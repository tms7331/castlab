"use client";

import { useEffect, useState } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import { CHAIN } from '@/lib/wagmi/addresses';
import CastlabExperimentABI from '@/lib/contracts/CastlabExperiment.json';
import { HeroSection } from "@/components/hero-section";
import { ExperimentCard } from "@/components/experiment-card";

export default function HomeClient() {
  const [experiments, setExperiments] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fundingMap, setFundingMap] = useState<Map<number, number>>(new Map());

  // Wagmi hooks
  const { address } = useAccount();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch events');
        }

        setExperiments(result.data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load experiments');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleFundingData = (id: number, amount: number) => {
    setFundingMap(prev => {
      const newMap = new Map(prev);
      newMap.set(id, amount);
      return newMap;
    });
  };

  // const totalFunded = Array.from(fundingMap.values()).reduce((sum, amount) => sum + amount, 0);
  // const totalBet = 0;

  return (
    <div className="min-h-screen">
      <HeroSection />
      <section className="px-4 pb-8">
        <div className="max-w-sm mx-auto space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#0a3d4d]">Loading experiments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#0a3d4d]">No experiments available yet.</p>
            </div>
          ) : (
            experiments.map((exp) => (
              <ExperimentCardWithContribution
                key={exp.experiment_id}
                experiment={exp}
                userAddress={address}
                onFundingData={handleFundingData}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// Component wrapper to fetch and display experiment with user's contribution
function ExperimentCardWithContribution({
  experiment,
  userAddress,
  onFundingData
}: {
  experiment: Event;
  userAddress?: string;
  onFundingData?: (experimentId: number, amount: number) => void;
}) {
  // Fetch experiment's total funding
  const { data: contractData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
    functionName: 'getExperimentInfo',
    args: [BigInt(experiment.experiment_id)],
    chainId: CHAIN.id,
  });

  // Report funding amount to parent
  useEffect(() => {
    if (contractData && onFundingData) {
      type ExperimentInfo = readonly [bigint, bigint, bigint, boolean];
      const totalDepositedTokens = (contractData as ExperimentInfo)[2];
      const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
      onFundingData(experiment.experiment_id, totalDepositedUSD);
    }
  }, [contractData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user's position (deposit and bets) for this specific experiment
  const { data: userPosition } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
    functionName: 'getUserPosition',
    args: userAddress ? [BigInt(experiment.experiment_id), userAddress] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!userAddress,
    },
  });

  // getUserPosition returns [depositAmount, betAmount0, betAmount1]
  type UserPosition = readonly [bigint, bigint, bigint];
  const userContribution = userPosition ? tokenAmountToUsd((userPosition as UserPosition)[0]) : 0;
  const userBet0 = userPosition ? tokenAmountToUsd((userPosition as UserPosition)[1]) : 0;
  const userBet1 = userPosition ? tokenAmountToUsd((userPosition as UserPosition)[2]) : 0;

  return (
    <ExperimentCard
      experiment={experiment}
      userContribution={userContribution}
      userBet0={userBet0}
      userBet1={userBet1}
    />
  );
}
