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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ExternalLink, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to all experiments
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-6">{experiment.title}</h1>

        {experiment.image_url && (
          <div className="relative mb-6 rounded-lg overflow-hidden">
            <img
              src={experiment.image_url}
              alt={experiment.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Show completion status for completed experiments */}
        {experiment.date_completed && (
          <div className="text-sm text-green-600 font-medium mb-6">
            ✓ Experiment Completed - {new Date(experiment.date_completed).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        )}

        {experiment.summary && (
          <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold text-foreground mb-3">About This Experiment</h2>
            <p className="text-muted-foreground leading-relaxed">
              {experiment.summary}
            </p>
          </Card>
        )}

        {experiment.experiment_url && (
          <Card className="p-6 mb-6 bg-muted/50 border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">It's time for a data-driven experiment.</h3>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
                <a 
                  href={experiment.experiment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  More details <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </div>
          </Card>
        )}

        {/* Only show funding card if experiment is not completed */}
        {!experiment.date_completed && (
          <Card className="p-4 mb-6 bg-card border-border">
              <div className="text-center mb-3">
                <div className="text-3xl font-bold text-primary mb-1">
                  ${totalDepositedUSD.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-sm">raised</div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-muted-foreground mb-1">
                  Target range: ${(experiment.cost_min || 0).toLocaleString()} - ${(experiment.cost_max || 0).toLocaleString()}
                </div>
                {experiment.cost_tag && (
                  <div className="text-sm text-primary mb-3">
                    Category: {experiment.cost_tag}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <Progress value={Math.min((totalDepositedUSD / (experiment.cost_max || 1)) * 100, 100)} className="h-2 mb-2" />
                <div className="text-center text-sm text-muted-foreground">
                  {Math.round((totalDepositedUSD / (experiment.cost_max || 1)) * 100)}% funded
                </div>
              </div>

            {/* Wallet Connection Status and Balance */}
            {isConnected && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Network: {chainId === baseSepolia.id ? 'Base Sepolia ✓' : `Wrong Network (Chain ID: ${chainId})`}
                  </div>
                </div>
                
                {/* Token Balance Display */}
                <Card className="p-3 mb-4 bg-secondary/10 border-secondary/20">
                  <div className="text-xs text-secondary-foreground mb-1">Your Token Balance</div>
                  <div className="text-xl font-bold text-secondary">${userBalanceUSD.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Available for funding</div>
                </Card>
                
                {/* User's Current Stake Display */}
                {userDepositUSD > 0 && (
                  <Card className="p-3 mb-4 bg-green-50 border-green-200">
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
                  </Card>
                )}
              </>
            )}

            {/* Only show funding form if experiment is not completed */}
            <form onSubmit={handleFunding} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fund this experiment (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input 
                    type="number" 
                    placeholder="50" 
                    className="pl-8" 
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    min="1"
                    step="1"
                    disabled={currentStep !== 'idle'}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2"
                size="lg"
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
              </Button>

              {(approveError || depositError) && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm break-words overflow-hidden">
                  <div className="font-semibold">Transaction Error</div>
                  <div className="mt-1 text-xs break-all">
                    {((approveError || depositError)?.message || '').includes('User rejected') 
                      ? 'Transaction was cancelled by user'
                      : 'Transaction failed. Please try again.'}
                  </div>
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

            {/* Contract Address Info */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}