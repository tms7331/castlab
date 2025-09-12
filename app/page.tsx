"use client";

import { useEffect, useState, useCallback } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';
import { HeroSection } from "@/components/hero-section";
import { ExperimentCard } from "@/components/experiment-card";

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  return (
    <div className="min-h-screen bg-white">
      <ExperimentsWithStats experiments={experiments} />
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
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// Component to calculate total funding and show hero section
function ExperimentsWithStats({ experiments }: { experiments: Event[] }) {
  const [fundingData, setFundingData] = useState<Record<number, number>>({});

  // Calculate total from all experiments
  const totalFunded = Object.values(fundingData).reduce((sum, amount) => sum + amount, 0);

  // Callback to store funding data per experiment
  const handleFundingData = useCallback((experimentId: number, funded: number) => {
    setFundingData(prev => ({
      ...prev,
      [experimentId]: funded
    }));
  }, []);

  // Reset when experiments change
  useEffect(() => {
    setFundingData({});
  }, [experiments.length]);

  return (
    <>
      <HeroSection activeCount={experiments.length} totalFunded={totalFunded} />
      {/* Hidden components to fetch funding data */}
      <div style={{ display: 'none' }}>
        {experiments.map(exp => (
          <FundingFetcher 
            key={exp.experiment_id} 
            experimentId={exp.experiment_id}
            onFundingData={handleFundingData}
          />
        ))}
      </div>
    </>
  );
}

// Component to fetch funding for a single experiment
function FundingFetcher({ 
  experimentId,
  onFundingData 
}: { 
  experimentId: number;
  onFundingData: (id: number, funded: number) => void;
}) {
  const { data: contractData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getExperimentInfo',
    args: [BigInt(experimentId)],
    chainId: baseSepolia.id,
  });

  useEffect(() => {
    if (contractData) {
      type ExperimentInfo = readonly [bigint, bigint, bigint, boolean];
      const totalDepositedTokens = (contractData as ExperimentInfo)[2];
      const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
      onFundingData(experimentId, totalDepositedUSD);
    }
  }, [contractData]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// Component wrapper to fetch and display experiment with user's contribution
function ExperimentCardWithContribution({ 
  experiment, 
  userAddress
}: { 
  experiment: Event; 
  userAddress?: string;
}) {
  // Fetch user's deposit amount for this specific experiment
  const { data: depositAmount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getUserDeposit',
    args: userAddress ? [BigInt(experiment.experiment_id), userAddress] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!userAddress,
    },
  });

  const userContribution = depositAmount ? tokenAmountToUsd(depositAmount as bigint) : 0;

  return (
    <ExperimentCard 
      experiment={experiment} 
      userContribution={userContribution}
    />
  );
}