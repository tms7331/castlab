"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';

export default function MyExperimentsPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInvestments, setUserInvestments] = useState<Map<number, number>>(new Map());
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  
  // Get user's experiments from blockchain
  const { data: userExperiments } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getUserExperiments',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    enabled: !!address,
  });

  // Process user experiments data
  useEffect(() => {
    if (!userExperiments || !address) return;
    
    const [experimentIds, hasActiveDonation] = userExperiments as [bigint[], boolean[]];
    const investments = new Map<number, number>();
    
    // Mark experiments that have active donations
    for (let i = 0; i < experimentIds.length; i++) {
      if (hasActiveDonation[i]) {
        investments.set(Number(experimentIds[i]), 1); // Placeholder, actual amount fetched in ExperimentRow
      }
    }
    
    setUserInvestments(investments);
  }, [userExperiments, address]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch events');
        }
        
        setAllEvents(result.data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load experiments');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Filter to only show user's funded experiments
  const myExperiments = allEvents
    .filter(event => userInvestments.has(event.experiment_id))
    .map(event => {
      return {
        ...event,
        amountFunded: userInvestments.get(event.experiment_id) || 0,
        status: "in_progress" as const,
        hasResults: false
      };
    });

  const totalInvested = myExperiments.reduce((sum, exp) => sum + exp.amountFunded, 0);
  const activeInvestments = myExperiments.length;
  const completedInvestments = 0; // TODO: Track completed experiments from contract

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-[#0a3d4d]">Loading your experiments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-8">My Experiments</h1>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="experiment-card text-center">
            <p className="text-2xl font-bold text-[#00a8cc]">${totalInvested}</p>
            <p className="text-sm text-[#0a3d4d]">Total Invested</p>
          </div>
          <div className="experiment-card text-center">
            <p className="text-2xl font-bold text-[#00a8cc]">{activeInvestments}</p>
            <p className="text-sm text-[#0a3d4d]">Active Experiments</p>
          </div>
          <div className="experiment-card text-center">
            <p className="text-2xl font-bold text-[#00a8cc]">{completedInvestments}</p>
            <p className="text-sm text-[#0a3d4d]">Completed</p>
          </div>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          {myExperiments.length === 0 ? (
            <div className="experiment-card text-center py-12">
              <p className="text-lg text-[#0a3d4d] mb-4">You haven&apos;t funded any experiments yet</p>
              <Link href="/" className="btn-primary">
                Explore Experiments
              </Link>
            </div>
          ) : (
            myExperiments.map((exp) => (
              <ExperimentRow key={exp.experiment_id} experiment={exp} userAddress={address} />
            ))
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-[#e8f5f7] rounded-lg">
          <p className="text-sm text-[#0a3d4d]">
            <strong>Note:</strong> Withdrawals are only available for experiments still in funding. 
            Once an experiment is fully funded and research begins, contributions cannot be withdrawn. 
            Results will be available once the experiment is completed.
          </p>
        </div>
      </div>
    </div>
  );
}

// Component to display individual experiment with fetched investment amount
function ExperimentRow({ experiment, userAddress }: { experiment: any; userAddress?: string }) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  // Fetch user's deposit amount for this specific experiment
  const { data: depositAmount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getUserDeposit',
    args: userAddress ? [BigInt(experiment.experiment_id), userAddress] : undefined,
    chainId: baseSepolia.id,
    enabled: !!userAddress,
  });

  // Fetch experiment info from contract
  const { data: experimentInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getExperimentInfo',
    args: [BigInt(experiment.experiment_id)],
    chainId: baseSepolia.id,
  });

  const amountInvested = depositAmount ? tokenAmountToUsd(depositAmount as bigint) : 0;
  const totalRaised = experimentInfo ? tokenAmountToUsd((experimentInfo as any)[3]) : 0;
  const goal = experiment.cost_max || 0;
  const isClosed = experimentInfo ? (experimentInfo as any)[5] : false;
  const status = isClosed ? 'completed' : 'in_progress';

  // Withdrawal transaction hooks
  const { 
    writeContract: writeWithdraw, 
    data: withdrawHash,
    error: withdrawError,
    reset: resetWithdraw
  } = useWriteContract();

  // Wait for withdrawal confirmation
  const { isLoading: isWithdrawPending, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Handle withdrawal confirmation
  useEffect(() => {
    if (isWithdrawConfirmed) {
      setIsWithdrawing(false);
      resetWithdraw();
      // Refresh the page to update balances
      window.location.reload();
    }
  }, [isWithdrawConfirmed, resetWithdraw]);

  // Handle withdrawal error
  useEffect(() => {
    if (withdrawError) {
      setIsWithdrawing(false);
      alert(`Withdrawal failed: ${withdrawError.message}`);
    }
  }, [withdrawError]);

  const handleWithdraw = async () => {
    if (!userAddress || !depositAmount) return;
    
    try {
      setIsWithdrawing(true);
      
      // Call undeposit function with only experiment ID (it withdraws the full amount automatically)
      await writeWithdraw({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ExperimentFundingABI.abi,
        functionName: 'undeposit',
        args: [BigInt(experiment.experiment_id)],
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="experiment-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-4">
              {experiment.image_url && (
                <img 
                  src={experiment.image_url} 
                  alt={experiment.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div>
                <Link href={`/experiments/${experiment.experiment_id}`}>
                  <h3 className="text-lg md:text-xl font-semibold text-[#005577] hover:text-[#0077a3] transition-colors cursor-pointer">
                    {experiment.title}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#0a3d4d]">
                  <span>
                    Your contribution: <span className="font-semibold text-[#00a8cc]">${amountInvested}</span>
                  </span>
                  <span>
                    Total raised: ${totalRaised} / ${goal}
                  </span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              status === 'completed' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {status === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="progress-bar h-2">
              <div 
                className="progress-fill"
                style={{ width: `${Math.min((totalRaised / goal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#0077a3] mt-1">
              {Math.round((totalRaised / goal) * 100)}% funded
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              disabled
              className="px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg cursor-not-allowed"
            >
              Results Pending
            </button>
            
            {status === 'in_progress' && depositAmount && Number(depositAmount) > 0 && (
              <button 
                onClick={handleWithdraw}
                disabled={isWithdrawing || isWithdrawPending}
                className="px-4 py-2 border border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing || isWithdrawPending ? 'Withdrawing...' : 'Withdraw'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}