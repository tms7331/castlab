"use client";

import { useEffect, useState } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, tokenAmountToUsd } from "@/lib/wagmi/config";
import { CHAIN } from "@/lib/wagmi/addresses";
import CastlabExperimentABI from "@/lib/contracts/CastlabExperiment.json";
import { HeroSection } from "@/components/hero-section";
import { ExperimentCard } from "@/components/experiment-card";
import { ExperimentCardSkeleton } from "@/components/experiment-card-skeleton";
import { cn } from "@/lib/utils";
import { LAYOUT } from "@/lib/constants/layout";

export default function HomeClient() {
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
    <div className="min-h-screen">
      <HeroSection />
      <section className={cn(LAYOUT.paddingX, "pt-6 md:pt-8 pb-12 md:pb-16")}>
        <div className={cn("mx-auto", LAYOUT.maxWidth)}>
          <div className={cn("grid grid-cols-1 md:grid-cols-2", LAYOUT.gridGap)}>
            {loading ? (
            <>
              <ExperimentCardSkeleton />
              <ExperimentCardSkeleton />
              <ExperimentCardSkeleton />
              <ExperimentCardSkeleton />
            </>
          ) : error ? (
            <div className="col-span-full rounded-lg border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
              <p className="text-lg font-semibold text-foreground mb-1">We hit a snag.</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : experiments.length === 0 ? (
            <div className="col-span-full rounded-lg border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(140,121,255,0.28),transparent_60%),linear-gradient(135deg,rgba(24,6,91,0.1),rgba(30,184,171,0.08))] shadow-[var(--shadow-soft)]">
                <span className="h-2 w-10 rounded-full bg-gradient-to-r from-primary/60 via-primary to-secondary/70" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No experiments yet</h3>
              <p className="text-muted-foreground text-sm">Check back soon—new science drops land here first.</p>
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
        </div>
      </section>
    </div>
  );
}

// Component wrapper to fetch and display experiment with user's contribution
function ExperimentCardWithContribution({
  experiment,
  userAddress,
}: {
  experiment: Event;
  userAddress?: string;
}) {
  // Fetch experiment's total funding
  useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
    functionName: 'getExperimentInfo',
    args: [BigInt(experiment.experiment_id)],
    chainId: CHAIN.id,
  });

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
