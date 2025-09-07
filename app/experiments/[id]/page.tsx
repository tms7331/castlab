"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { prepareDepositTransaction } from '@/lib/wagmi/contractHelpers';
import { CONTRACT_ADDRESS } from '@/lib/wagmi/config';

export default function ExperimentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [experiment, setExperiment] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState("");

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { 
    writeContract, 
    data: hash,
    isPending: isWriting,
    error: writeError 
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${id}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch event');
        }
        
        setExperiment(result.data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load experiment');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  // Reset form when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      setFundingAmount("");
      // Show success message
      alert("Thank you for funding this experiment! Your transaction has been confirmed.");
    }
  }, [isConfirmed]);

  // Generate mock raised/backers data for display (until we add these to the database)
  const raised = experiment ? Math.floor((experiment.cost || 0) * 0.65) : 0;
  const backers = experiment ? Math.floor(Math.random() * 100) + 20 : 0;

  const handleFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fundingAmount || Number(fundingAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Connect wallet if not connected
    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }

    // Check if on the correct chain
    if (chainId !== baseSepolia.id) {
      alert(`Please switch to ${baseSepolia.name} network in your wallet`);
      return;
    }

    try {
      // Prepare the transaction
      const { to, value, data } = prepareDepositTransaction(id, Number(fundingAmount));
      
      // Send the transaction with explicit chain ID
      await writeContract({
        address: to as `0x${string}`,
        abi: (await import('@/lib/contracts/ExperimentFunding.json')).default.abi,
        functionName: 'deposit',
        args: [BigInt(id.charCodeAt(0))], // Simple ID mapping
        value,
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error('Transaction failed:', err);
      alert('Transaction failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-[#0a3d4d]">Loading experiment...</p>
        </div>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#005577]">
            {error || "Experiment not found"}
          </h1>
          <Link href="/" className="text-[#00a8cc] hover:underline mt-4 inline-block">
            Back to experiments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-[#00a8cc] hover:underline mb-6 inline-block">
          ← Back to all experiments
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold text-[#005577] mb-2">
              {experiment.title}
            </h1>
            <p className="text-lg text-[#0a3d4d] italic mb-6">
              {experiment.one_liner || ""}
            </p>

            <div className="space-y-6">
              {experiment.why_study && (
                <div className="bg-gradient-to-r from-[#00c9a7]/10 to-[#00a8cc]/10 p-6 rounded-xl border border-[#00a8cc]/20">
                  <h2 className="text-xl font-bold text-[#005577] mb-3">Why Study This?</h2>
                  <p className="text-[#0a3d4d] leading-relaxed">
                    {experiment.why_study}
                  </p>
                </div>
              )}

              {experiment.approach && (
                <div className="bg-gradient-to-r from-[#00a8cc]/10 to-[#00c9a7]/10 p-6 rounded-xl border border-[#00c9a7]/20">
                  <h2 className="text-xl font-bold text-[#005577] mb-3">Experimental Approach</h2>
                  <p className="text-[#0a3d4d] leading-relaxed whitespace-pre-line">
                    {experiment.approach}
                  </p>
                </div>
              )}

              <div className="bg-[#f0fbfd] p-6 rounded-xl border border-[#00a8cc]/20">
                <h2 className="text-xl font-bold text-[#005577] mb-3">Updates</h2>
                <p className="text-[#0a3d4d] italic">
                  No updates yet. Check back soon!
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-4 experiment-card">
              <div className="text-3xl font-bold text-[#00a8cc]">
                ${raised.toLocaleString()}
              </div>
              <div className="text-sm text-[#0a3d4d]">
                raised of ${(experiment.cost || 0).toLocaleString()} goal
              </div>

            <div className="progress-bar h-3 mb-6">
              <div
                className="progress-fill h-full"
                style={{
                  width: `${Math.min(
                    (raised / (experiment.cost || 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-sm text-[#0a3d4d] mb-8">
              <span>{backers} backers</span>
              <span>
                {Math.round((raised / (experiment.cost || 1)) * 100)}%
                funded
              </span>
            </div>

            {/* Wallet Connection Status */}
            {isConnected && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-lg text-sm">
                <div>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
                <div className="text-xs mt-1">
                  Network: {chainId === baseSepolia.id ? 'Base Sepolia ✓' : `Wrong Network (Chain ID: ${chainId})`}
                </div>
              </div>
            )}

            <form onSubmit={handleFunding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#005577] mb-2">
                  Fund this experiment (USD)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0a3d4d]">
                      $
                    </span>
                    <input
                      type="number"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc]"
                      placeholder="50"
                      min="1"
                      step="1"
                      disabled={isWriting || isConfirming}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isWriting || isConfirming}
              >
                {!isConnected 
                  ? "Connect Wallet to Fund" 
                  : isWriting 
                  ? "Preparing Transaction..." 
                  : isConfirming 
                  ? "Confirming..." 
                  : "Fund This Science"}
              </button>

              {writeError && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                  Error: {writeError.message}
                </div>
              )}

              {isConfirmed && (
                <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-lg text-sm">
                  Transaction confirmed! Thank you for your support.
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-[#00a8cc]/20">
                <button
                  type="button"
                  onClick={() => setFundingAmount("10")}
                  className="w-full py-2 text-[#00a8cc] hover:bg-[#00a8cc]/10 rounded-lg transition-colors"
                  disabled={isWriting || isConfirming}
                >
                  Quick fund: $10
                </button>
                <button
                  type="button"
                  onClick={() => setFundingAmount("25")}
                  className="w-full py-2 text-[#00a8cc] hover:bg-[#00a8cc]/10 rounded-lg transition-colors"
                  disabled={isWriting || isConfirming}
                >
                  Quick fund: $25
                </button>
                <button
                  type="button"
                  onClick={() => setFundingAmount("50")}
                  className="w-full py-2 text-[#00a8cc] hover:bg-[#00a8cc]/10 rounded-lg transition-colors"
                  disabled={isWriting || isConfirming}
                >
                  Quick fund: $50
                </button>
              </div>
            </form>

            {/* Contract Address Info */}
            {CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000" && (
              <div className="mt-4 p-2 bg-gray-100 rounded-lg text-xs text-gray-600">
                Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}