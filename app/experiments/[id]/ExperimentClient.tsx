"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, TOKEN_ADDRESS, usdToTokenAmount, tokenAmountToUsd } from '@/lib/wagmi/config';
import { CHAIN } from '@/lib/wagmi/addresses';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';
import ERC20ABI from '@/lib/contracts/ERC20.json';
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ExternalLink, CheckCircle } from "lucide-react";

export default function ExperimentClient() {
  const params = useParams();
  const id = params.id as string;


  // Debug logging to understand URL handling
  useEffect(() => {
    console.log('[ExperimentClient] Loaded with ID:', id);
    console.log('[ExperimentClient] Current URL:', window.location.href);
    console.log('[ExperimentClient] Pathname:', window.location.pathname);
    console.log('[ExperimentClient] Search params:', window.location.search);
    console.log('[ExperimentClient] Params:', params);


    // Check if we're in a Farcaster context
    if (window.parent !== window) {
      console.log('[ExperimentClient] Running in iframe/embedded context');
    }
  }, [id, params]);

  const [experiment, setExperiment] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState("");
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'approved' | 'depositing' | 'complete'>('idle');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState<string | null>(null);
  const [hasAttemptedDeposit, setHasAttemptedDeposit] = useState(false);

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
    chainId: CHAIN.id,
  });

  // Read user's token balance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
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
    chainId: CHAIN.id,
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
    chainId: CHAIN.id,
    query: {
      enabled: !!address && !!experiment,
    },
  });

  // Mint testnet tokens transaction
  const {
    writeContract: writeMint,
    data: mintHash,
  } = useWriteContract();

  // Wait for mint confirmation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoading: isMintPending, isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({
    hash: mintHash,
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
      setApprovedAmount(fundingAmount); // Track the amount that was approved
    }
  }, [isApproved, currentStep, fundingAmount]);

  // Handle approve error - reset to idle state for retry
  useEffect(() => {
    if (approveError && currentStep === 'approving') {
      console.error('Approve transaction failed:', approveError);
      setCurrentStep('idle');
      // Reset approve state to allow retry
      resetApprove();
    }
  }, [approveError, currentStep, resetApprove]);

  // Automatically proceed to deposit after approval (only first time)
  useEffect(() => {
    if (currentStep === 'approved' && !hasAttemptedDeposit) {
      setHasAttemptedDeposit(true);
      handleDeposit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, hasAttemptedDeposit]);

  // Handle deposit confirmation
  useEffect(() => {
    if (isDepositConfirmed && currentStep === 'depositing') {
      // Haptic feedback for successful deposit
      sdk.haptics.impactOccurred('medium');
      setCurrentStep('complete');
      setFundingAmount("");
      setApprovedAmount(null); // Clear approved amount after successful deposit

      // Add a small delay to ensure blockchain state is updated
      setTimeout(async () => {
        // Refetch all data to show updated amounts
        await Promise.all([
          refetchContractData(),
          refetchUserDeposit(),
          refetchTokenBalance()
        ]);
      }, 1000);

      // Don't reset the state automatically - let user dismiss it or cast about it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepositConfirmed, currentStep, refetchContractData]);

  // Handle deposit error - keep approval and allow manual retry
  useEffect(() => {
    if (depositError && currentStep === 'depositing') {
      console.error('Deposit transaction failed:', depositError);

      // Always go back to approved state so user can retry just the deposit
      // This preserves the approval transaction
      setCurrentStep('approved');
      resetDeposit();
    }
  }, [depositError, currentStep, resetDeposit]);

  // Reset approval if amount changes after approval
  useEffect(() => {
    if (currentStep === 'approved' && approvedAmount && fundingAmount !== approvedAmount) {
      // Amount changed, need new approval
      setCurrentStep('idle');
      setApprovedAmount(null);
      setHasAttemptedDeposit(false);
      resetApprove();
      resetDeposit();
    }
  }, [fundingAmount, approvedAmount, currentStep, resetApprove, resetDeposit]);

  // Handle withdrawal confirmation
  useEffect(() => {
    if (isWithdrawConfirmed) {
      setIsWithdrawing(false);
      resetWithdraw();

      // Add a small delay to ensure blockchain state is updated
      setTimeout(async () => {
        // Refetch all data to show updated amounts
        await Promise.all([
          refetchContractData(),
          refetchUserDeposit(),
          refetchTokenBalance()
        ]);
      }, 1000);

      alert("Your withdrawal has been completed successfully.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithdrawConfirmed, resetWithdraw]);

  // Handle mint confirmation
  useEffect(() => {
    if (isMintConfirmed) {
      // Refetch balance after minting
      setTimeout(async () => {
        await refetchTokenBalance();
      }, 1000);

      alert("Testnet tokens minted successfully!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMintConfirmed]);

  const handleCastAboutDonation = async () => {
    try {
      // Link to the specific experiment page
      const appUrl = `${getAppUrl()}/experiments/${experiment?.experiment_id}`;

      const result = await sdk.actions.composeCast({
        text: `I just funded "${experiment?.title}" on CastLab! 🧪🔬`,
        embeds: [appUrl]
      });

      if (result?.cast) {
        // Reset state after successful cast
        setCurrentStep('idle');
        setApprovedAmount(null);
        setHasAttemptedDeposit(false);
        resetApprove();
        resetDeposit();

        // Refetch data to ensure amounts stay current
        setTimeout(async () => {
          await Promise.all([
            refetchContractData(),
            refetchUserDeposit(),
            refetchTokenBalance()
          ]);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to compose cast:', error);
    }
  };

  const handleFunding = async (e: React.FormEvent) => {
    e.preventDefault();

    // Connect wallet if not connected
    if (!isConnected) {
      // Simply connect with the Farcaster connector (the only one available)
      if (connectors[0]) {
        await connect({ connector: connectors[0] });
      }
      return;
    }

    if (!fundingAmount || Number(fundingAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Check if on the correct chain
    if (chainId !== CHAIN.id) {
      alert(`Please switch to ${CHAIN.name} network in your wallet`);
      return;
    }

    // Clear any previous errors before starting
    resetApprove();
    resetDeposit();
    setHasAttemptedDeposit(false);

    setCurrentStep('approving');

    // Convert USD to token amount (assuming 18 decimals for the token)
    const tokenAmount = usdToTokenAmount(Number(fundingAmount));

    // Step 1: Approve the contract to spend tokens
    writeApprove({
      address: TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20ABI.abi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, tokenAmount],
      chainId: CHAIN.id,
    });
    // Error handling is now done in the useEffect hook for approveError
  };

  const handleWithdraw = async () => {
    if (!address || !userDepositAmount || !experiment) return;

    try {
      setIsWithdrawing(true);

      // Call undeposit function with experiment ID
      writeWithdraw({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ExperimentFundingABI.abi,
        functionName: 'undeposit',
        args: [BigInt(experiment.experiment_id)],
        chainId: CHAIN.id,
      });
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setIsWithdrawing(false);
      alert('Withdrawal failed. Please try again.');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMintTestTokens = async () => {
    if (!address) return;

    try {
      writeMint({
        address: TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20ABI.abi,
        functionName: 'mint',
        args: [],
        chainId: CHAIN.id,
      });
    } catch (err) {
      console.error('Minting failed:', err);
      alert('Minting failed. Please try again.');
    }
  };

  const handleDeposit = async () => {
    if (!experiment || !fundingAmount) return;

    setCurrentStep('depositing');

    const experimentId = experiment.experiment_id;
    const tokenAmount = usdToTokenAmount(Number(fundingAmount));

    // Step 2: Deposit tokens to the experiment
    writeDeposit({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: ExperimentFundingABI.abi,
      functionName: 'deposit',
      args: [BigInt(experimentId), tokenAmount],
      chainId: CHAIN.id,
    });
    // Error handling is now done in the useEffect hook for depositError
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
    <div className="min-h-screen">
      <main className="px-3 py-4 max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to all experiments
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-4">{experiment.title}</h1>

        {experiment.image_url && (
          <div className="relative mb-4 rounded-lg overflow-hidden h-64">
            <Image
              src={experiment.image_url}
              alt={experiment.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Show completion status for completed experiments */}
        {experiment.date_completed && (
          <div className="text-sm text-green-600 font-medium mb-4">
            ✓ Experiment Completed - {new Date(experiment.date_completed).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        )}

        {experiment.summary && (
          <Card className="p-4 mb-4 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold text-foreground mb-2">About This Experiment</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {experiment.summary}
            </p>
          </Card>
        )}

        {experiment.experiment_url && (
          <Card className="p-4 mb-4 bg-muted/50 border-border/50">
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() => {
                  // Open in external browser
                  sdk.actions.openUrl(experiment.experiment_url!);
                }}
              >
                Read full protocol <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* Only show funding card if experiment is not completed */}
        {!experiment.date_completed && (
          <Card className="p-4 mb-4 bg-card border-border">
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
                  {experiment.cost_tag}
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
                    Network: {chainId === CHAIN.id ? `${CHAIN.name} ✓` : `Wrong Network (Chain ID: ${chainId})`}
                  </div>
                </div>

                {/* Token Balance Display - only show if not in complete state */}
                {currentStep !== 'complete' && (
                  <Card className="p-3 mb-4 bg-secondary/10 border-secondary/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-secondary-foreground mb-1">Your Base USDC Balance</div>
                        <div className="text-xl font-bold text-secondary">${userBalanceUSD.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Available for funding</div>
                      </div>
                      {/* Commented out testnet token minting button - may reintroduce later
                      <button
                        onClick={handleMintTestTokens}
                        disabled={isMintPending}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isMintPending ? 'Minting...' : 'Get Testnet Tokens'}
                      </button>
                      */}
                    </div>
                  </Card>
                )}

                {/* User's Current Stake Display - only show if not in complete state */}
                {userDepositUSD > 0 && currentStep !== 'complete' && (
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

            {/* Show Cast button when deposit is complete */}
            {currentStep === 'complete' ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium text-center">
                  ✅ Thank you for funding this experiment!
                </div>

                {/* Show updated balance after deposit */}
                <Card className="p-3 bg-secondary/10 border-secondary/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-secondary-foreground mb-1">Your Base USDC Balance</div>
                      <div className="text-xl font-bold text-secondary">${userBalanceUSD.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Available for funding</div>
                    </div>
                    {/* Commented out testnet token minting button - may reintroduce later
                    <button
                      onClick={handleMintTestTokens}
                      disabled={isMintPending}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMintPending ? 'Minting...' : 'Get Testnet Tokens'}
                    </button>
                    */}
                  </div>
                </Card>

                {/* Show updated stake after deposit */}
                {userDepositUSD > 0 && (
                  <Card className="p-3 bg-green-50 border-green-200">
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

                <Button
                  onClick={handleCastAboutDonation}
                  className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold"
                  size="lg"
                >
                  Cast about it! 📢
                </Button>
              </div>
            ) : (
              /* Show funding form when not complete */
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
                      disabled={currentStep === 'approving' || currentStep === 'depositing'}
                    />
                  </div>
                </div>

                <Button
                  type={isConnected ? "submit" : "button"}
                  onClick={!isConnected ? () => connect({ connector: connectors[0] }) : currentStep === 'approved' ? handleDeposit : undefined}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2"
                  size="lg"
                  disabled={currentStep === 'approving' || currentStep === 'depositing'}
                >
                  {!isConnected
                    ? "Connect Wallet to Fund"
                    : currentStep === 'approving' || isApprovePending
                      ? "Approving Token..."
                      : currentStep === 'approved'
                        ? depositError ? "Retry Deposit" : "Click to Deposit"
                        : currentStep === 'depositing' || isDepositPending
                          ? "Depositing..."
                          : "Fund Experiment"}
                </Button>

                {(approveError || depositError) && (
                  <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm break-words overflow-hidden">
                    <div className="font-semibold">Transaction Error</div>
                    <div className="mt-1 text-xs break-all">
                      {((approveError || depositError)?.message || '').includes('User rejected')
                        ? 'Transaction was cancelled by user'
                        : approveError
                          ? 'Token approval failed. You can try again.'
                          : 'Deposit failed. You can retry the deposit.'}
                    </div>
                    {approveError && currentStep === 'idle' && (
                      <Button
                        onClick={() => handleFunding({ preventDefault: () => { } } as React.FormEvent)}
                        className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1"
                        size="sm"
                      >
                        Retry Approval
                      </Button>
                    )}
                    {depositError && currentStep === 'approved' && (
                      <Button
                        onClick={handleDeposit}
                        className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-1"
                        size="sm"
                      >
                        Retry Deposit
                      </Button>
                    )}
                  </div>
                )}

                {currentStep === 'approving' && (
                  <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                    Step 1/2: Approving token transfer...
                  </div>
                )}

                {currentStep === 'approved' && !depositError && (
                  <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-lg text-sm">
                    ✅ Approval complete! Click the button to deposit.
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
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground">
                <a
                  href={`${CHAIN.blockExplorers?.default?.url || 'https://basescan.org'}/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  View smart contract: {CONTRACT_ADDRESS}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </Card>
        )}

        {/* Show contract link for completed experiments outside the funding card */}
        {experiment.date_completed && (
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="text-xs text-muted-foreground">
              <a
                href={`${CHAIN.blockExplorers?.default?.url || 'https://basescan.org'}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                View smart contract: {CONTRACT_ADDRESS}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
