"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();

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
    <>
      <section className="hero-section">
        <div className="container mx-auto px-4">
          <h1 className="hero-title">Fund Weird Science</h1>
          <p className="hero-subtitle">
            Real experiments. Real results. Really fun.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-4">
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
              <ExperimentCard key={exp.experiment_id} experiment={exp} userAddress={address} />
            ))
          )}
        </div>
      </section>
    </>
  );
}

// Component to display experiment with user's contribution
function ExperimentCard({ experiment, userAddress }: { experiment: Event; userAddress?: string }) {
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
    <Link href={`/experiments/${experiment.experiment_id}`}>
      <div className="experiment-card hover:scale-[1.02] cursor-pointer">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 flex-grow">
            {experiment.image_url && (
              <img 
                src={experiment.image_url} 
                alt={experiment.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-[#005577]">
                {experiment.title}
              </h3>
              {experiment.summary && (
                <p className="text-sm text-[#0a3d4d]/70 line-clamp-1 mt-1">
                  {experiment.summary}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm text-[#0a3d4d]">
              <span className="font-semibold text-[#00a8cc]">
                ${experiment.cost_min || 0} - ${experiment.cost_max || 0}
              </span>
              <span className="text-[#0a3d4d]/60"> range</span>
            </div>
            
            {/* Display user's contribution if they have contributed */}
            {userContribution > 0 && (
              <div className="text-sm">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  You contributed: ${userContribution}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}