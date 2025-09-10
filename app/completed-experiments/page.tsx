"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';

export default function CompletedExperimentsPage() {
  const [experiments, setExperiments] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wagmi hooks
  const { address } = useAccount();

  useEffect(() => {
    async function fetchCompletedEvents() {
      try {
        const response = await fetch('/api/events/completed');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch completed events');
        }
        
        setExperiments(result.data || []);
      } catch (err) {
        console.error('Error fetching completed events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load completed experiments');
      } finally {
        setLoading(false);
      }
    }

    fetchCompletedEvents();
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="container mx-auto px-4">
          <h1 className="hero-title">Completed Experiments</h1>
          <p className="hero-subtitle">
            Successfully funded experiments that have been completed
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#0a3d4d]">Loading completed experiments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#0a3d4d]">No experiments have been completed yet.</p>
            </div>
          ) : (
            experiments.map((exp) => (
              <CompletedExperimentCard key={exp.experiment_id} experiment={exp} userAddress={address} />
            ))
          )}
        </div>
      </section>
    </>
  );
}

// Component to display completed experiment with user's contribution
function CompletedExperimentCard({ experiment, userAddress }: { experiment: Event; userAddress?: string }) {
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
      <div className="experiment-card hover:scale-[1.02] cursor-pointer bg-green-50 border-green-200">
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
              {experiment.date_completed && (
                <p className="text-xs text-green-600 mt-1">
                  Completed: {new Date(experiment.date_completed).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm text-[#0a3d4d]">
              <span className="font-semibold text-green-600">
                ✓ Funded
              </span>
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