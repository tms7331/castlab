"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, TOKEN_ADDRESS, usdToTokenAmount, tokenAmountToUsd } from '@/lib/wagmi/config';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';
import { sdk } from '@farcaster/miniapp-sdk';

export default function ExperimentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [experiment, setExperiment] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState("");
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'approved' | 'depositing' | 'complete'>('idle');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  
  // Approve transaction
  const { 
    writeContract: writeApprove, 
    data: approveHash,
    error: approveError,
    reset: resetApprove
  } = useWriteContract();

  // Deposit transaction  
  const { 
    writeContract: writeDeposit, 
    data: depositHash,
    error: depositError,
    reset: resetDeposit
  } = useWriteContract();

  // Wait for approve confirmation
  const { isLoading: isApprovePending, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  
  // Wait for deposit confirmation
  const { isLoading: isDepositPending, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Withdrawal transaction hooks
  const { 
    writeContract: writeWithdraw, 
    data: withdrawHash,
    reset: resetWithdraw
  } = useWriteContract();

  // Wait for withdrawal confirmation
  const { isLoading: isWithdrawPending, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Read experiment data from smart contract
  const { data: contractData, refetch: refetchContractData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getExperimentInfo',
    args: experiment ? [BigInt(experiment.experiment_id)] : undefined,
    chainId: baseSepolia.id,
  });

  // Read user's token balance
  const { data: tokenBalance } = useReadContract({
    address: TOKEN_ADDRESS as `0x${string}`,
    abi: [{
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  // Read user's deposit amount for this experiment
  const { data: userDepositAmount, refetch: refetchUserDeposit } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getUserDeposit',
    args: address && experiment ? [BigInt(experiment.experiment_id), address] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!address && !!experiment,
    },
  });

  // Extract totalDeposited from contract data
  type ExperimentInfo = readonly [bigint, bigint, bigint, boolean];
  const totalDepositedTokens = contractData ? (contractData as ExperimentInfo)[2] : BigInt(0);
  const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
  
  // Convert token balance to USD
  const userBalanceUSD = tokenBalance ? tokenAmountToUsd(tokenBalance as bigint) : 0;
  
  // Convert user's deposit to USD
  const userDepositUSD = userDepositAmount ? tokenAmountToUsd(userDepositAmount as bigint) : 0;

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

  // Handle approve confirmation
  useEffect(() => {
    if (isApproved && currentStep === 'approving') {
      setCurrentStep('approved');
    }
  }, [isApproved, currentStep]);

  // Automatically proceed to deposit after approval
  useEffect(() => {
    if (currentStep === 'approved') {
      handleDeposit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Handle deposit confirmation
  useEffect(() => {
    if (isDepositConfirmed && currentStep === 'depositing') {
      setCurrentStep('complete');
      setFundingAmount("");
      // Refetch contract data to show updated amount
      refetchContractData();
      refetchUserDeposit();
      // Show success message
      alert("Thank you for funding this experiment! Your transaction has been confirmed.");
      // Don't reset the state automatically - let user dismiss it or cast about it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepositConfirmed, currentStep, refetchContractData]);

  // Handle withdrawal confirmation
  useEffect(() => {
    if (isWithdrawConfirmed) {
      setIsWithdrawing(false);
      resetWithdraw();
      // Refetch contract data and user deposit to show updated amounts
      refetchContractData();
      refetchUserDeposit();
      alert("Your withdrawal has been completed successfully.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithdrawConfirmed, resetWithdraw]);

  const handleCastAboutDonation = async () => {
    try {
      // Get the current URL for the app
      const appUrl = window.location.origin;
      
      const result = await sdk.actions.composeCast({
        text: "I donated to SCIENCE! 🧪🔬",
        embeds: [appUrl]
      });
      
      if (result?.cast) {
        console.log('Cast successful:', result.cast.hash);
        // Reset state after successful cast
        setCurrentStep('idle');
        resetApprove();
        resetDeposit();
      }
    } catch (error) {
      console.error('Failed to compose cast:', error);
    }
  };

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
      setCurrentStep('approving');
      
      // Convert USD to token amount (assuming 18 decimals for the token)
      const tokenAmount = usdToTokenAmount(Number(fundingAmount));
      
      // Step 1: Approve the contract to spend tokens
      const ERC20_ABI = (await import('@/lib/contracts/ERC20.json')).default.abi;
      
      await writeApprove({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, tokenAmount],
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Approval failed. Please try again.');
      setCurrentStep('idle');
    }
  };

  const handleWithdraw = async () => {
    if (!address || !userDepositAmount || !experiment) return;
    
    try {
      setIsWithdrawing(true);
      
      // Call undeposit function with experiment ID
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
      alert('Withdrawal failed. Please try again.');
    }
  };

  const handleDeposit = async () => {
    if (!experiment || !fundingAmount) return;
    
    try {
      setCurrentStep('depositing');
      
      const experimentId = experiment.experiment_id;
      const tokenAmount = usdToTokenAmount(Number(fundingAmount));
      
      // Step 2: Deposit tokens to the experiment
      const ExperimentFunding_ABI = (await import('@/lib/contracts/ExperimentFunding.json')).default.abi;
      
      await writeDeposit({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ExperimentFunding_ABI,
        functionName: 'deposit',
        args: [BigInt(experimentId), tokenAmount],
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error('Deposit failed:', err);
      alert('Deposit failed. Please try again.');
      setCurrentStep('idle');
      resetApprove();
      resetDeposit();
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
            <h1 className="text-3xl md:text-4xl font-bold text-[#005577] mb-6">
              {experiment.title}
            </h1>
            
            {experiment.image_url && (
              <img 
                src={experiment.image_url} 
                alt={experiment.title}
                className="w-full h-64 object-cover rounded-xl mb-6"
              />
            )}

            <div className="space-y-6">
              {experiment.summary && (
                <div className="bg-gradient-to-r from-[#00c9a7]/10 to-[#00a8cc]/10 p-6 rounded-xl border border-[#00a8cc]/20">
                  <h2 className="text-xl font-bold text-[#005577] mb-3">About This Experiment</h2>
                  <p className="text-[#0a3d4d] leading-relaxed whitespace-pre-line">
                    {experiment.summary}
                  </p>
                  {experiment.experiment_url && (
                    <div className="mt-4 pt-4 border-t border-[#00a8cc]/20">
                      <a 
                        href={experiment.experiment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#00a8cc] hover:text-[#0077a3] font-medium transition-colors"
                      >
                        <span>More details</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
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
              {/* Show completion status if completed */}
              {experiment.date_completed && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-900">✓ Experiment Completed</div>
                  <div className="text-xs text-green-700 mt-1">
                    {new Date(experiment.date_completed).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              )}
              
              <div className="text-3xl font-bold text-[#00a8cc]">
                ${totalDepositedUSD.toLocaleString()}
              </div>
              <div className="text-sm text-[#0a3d4d] mb-2">
                <div>raised</div>
              </div>
              <div className="text-sm text-[#0a3d4d] mb-4">
                <div>Target range: ${(experiment.cost_min || 0).toLocaleString()} - ${(experiment.cost_max || 0).toLocaleString()}</div>
                {experiment.cost_tag && (
                  <div className="mt-1 text-xs text-[#0077a3]">Category: {experiment.cost_tag}</div>
                )}
              </div>

            <div className="progress-bar h-3 mb-6">
              <div
                className="progress-fill h-full"
                style={{
                  width: `${Math.min(
                    (totalDepositedUSD / (experiment.cost_max || 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="text-center text-sm text-[#0a3d4d] mb-8">
              <span>
                {Math.round((totalDepositedUSD / (experiment.cost_max || 1)) * 100)}%
                funded
              </span>
            </div>

            {/* Wallet Connection Status and Balance */}
            {isConnected && (
              <div className="mb-4 space-y-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg text-sm">
                  <div>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
                  <div className="text-xs mt-1">
                    Network: {chainId === baseSepolia.id ? 'Base Sepolia ✓' : `Wrong Network (Chain ID: ${chainId})`}
                  </div>
                </div>
                
                {/* Token Balance Display */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Your Token Balance
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    ${userBalanceUSD.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Available for funding
                  </div>
                </div>
                
                {/* User's Current Stake Display */}
                {userDepositUSD > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-900">
                      Your Current Stake
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      ${userDepositUSD.toLocaleString()}
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || isWithdrawPending}
                      className="mt-2 w-full px-3 py-1.5 text-sm border border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isWithdrawing || isWithdrawPending ? 'Withdrawing...' : 'Withdraw Stake'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Only show funding form if experiment is not completed */}
            {!experiment.date_completed && (
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
                      disabled={currentStep !== 'idle'}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentStep !== 'idle'}
              >
                {!isConnected 
                  ? "Connect Wallet to Fund"
                  : currentStep === 'approving' || isApprovePending
                  ? "Approving Token..."
                  : currentStep === 'approved'
                  ? "Approved! Starting deposit..."
                  : currentStep === 'depositing' || isDepositPending
                  ? "Depositing..."
                  : currentStep === 'complete'
                  ? "Complete!"
                  : "Fund Experiment"}
              </button>

              {(approveError || depositError) && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                  Error: {(approveError || depositError)?.message}
                </div>
              )}

              {currentStep === 'complete' && (
                <>
                  <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-lg text-sm">
                    Transaction confirmed! Thank you for your support.
                  </div>
                  <button
                    type="button"
                    onClick={handleCastAboutDonation}
                    className="w-full mt-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                  >
                    Cast about it! 📢
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('idle');
                      resetApprove();
                      resetDeposit();
                    }}
                    className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
              
              {currentStep === 'approving' && (
                <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                  Step 1/2: Approving token transfer...
                </div>
              )}
              
              {currentStep === 'depositing' && (
                <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                  Step 2/2: Depositing tokens to experiment...
                </div>
              )}
            </form>
            )}

            {/* Contract Address Info */}
            <div className="mt-4 p-2 bg-gray-100 rounded-lg text-xs text-gray-600">
              Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}