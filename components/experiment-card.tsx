"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Event } from "@/lib/supabase/types";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import { CHAIN } from '@/lib/wagmi/addresses';
import CastlabExperimentABI from '@/lib/contracts/CastlabExperiment.json';
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';
import { TopDonors } from './top-donors';
import { toast } from "sonner";
import { trackTransaction, identifyUser } from "@/lib/analytics/events";
import { useAuth } from '@/app/providers/AuthProvider';

interface ExperimentCardProps {
  experiment: Event;
  userContribution?: number;
  userBet0?: number;
  userBet1?: number;
  hideRanges?: boolean;
}

// Featured experiment ID (Sativa experiment)
const FEATURED_EXPERIMENT_ID = 1;

export function ExperimentCard({ experiment, userContribution = 0, userBet0 = 0, userBet1 = 0, hideRanges = false }: ExperimentCardProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { isInMiniApp } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<number>(0);

  // Check if this is the featured experiment
  const isFeatured = experiment.experiment_id === FEATURED_EXPERIMENT_ID;

  // Identify user in PostHog when wallet connects
  useEffect(() => {
    if (address) {
      identifyUser(address, {
        chain_id: chainId,
      });
    }
  }, [address, chainId]);

  // Read experiment data from smart contract - now includes bet amounts
  const { data: contractData, refetch: refetchContractData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
    functionName: 'getExperimentInfo',
    args: [BigInt(experiment.experiment_id)],
    chainId: CHAIN.id,
  });

  // Claim bet profit transaction hooks
  const {
    writeContract: writeClaimBet,
    data: claimBetHash,
    error: claimBetWriteError,
    reset: resetClaimBet
  } = useWriteContract();

  // Wait for claim confirmation
  const { isLoading: isClaimBetPending, isSuccess: isClaimBetConfirmed, error: claimBetReceiptError } = useWaitForTransactionReceipt({
    hash: claimBetHash,
  });

  // Extract data from contract - structure includes bet amounts, outcome, and open state
  type ExperimentInfo = readonly [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
  const experimentInfo = contractData as ExperimentInfo | undefined;
  const totalDepositedTokens = experimentInfo ? experimentInfo[2] : BigInt(0);
  const totalBet0Tokens = experimentInfo ? experimentInfo[3] : BigInt(0);
  const totalBet1Tokens = experimentInfo ? experimentInfo[4] : BigInt(0);
  const bettingOutcome = experimentInfo ? experimentInfo[6] : 255; // 255 means no outcome set yet
  const isOpen = experimentInfo ? experimentInfo[7] : undefined;

  const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
  const totalBet0USD = tokenAmountToUsd(totalBet0Tokens);
  const totalBet1USD = tokenAmountToUsd(totalBet1Tokens);
  const fundingGoal = experiment.cost_min || 1;
  const fundingProgress = Math.min((totalDepositedUSD / fundingGoal) * 100, 100);

  // Calculate odds (percentage of total bets for outcome 0)
  const totalBetsUSD = totalBet0USD + totalBet1USD;
  const oddsPercentage = totalBetsUSD > 0 ? Math.round((totalBet0USD / totalBetsUSD) * 100) : 50;

  // Check if user has a winning bet (frontend logic instead of relying on contract)
  const hasWinningBet = (bettingOutcome === 0 && userBet0 > 0) || (bettingOutcome === 1 && userBet1 > 0);

  // Calculate claimable amount based on Solidity logic
  const calculateClaimableAmount = (): number => {
    if (bettingOutcome === 0) {
      const userBetAmount = userBet0;
      if (userBetAmount === 0) return 0;
      // payout = (userBetAmount * (totalBet0 + totalBet1)) / totalBet0
      return totalBet0USD > 0 ? (userBetAmount * (totalBet0USD + totalBet1USD)) / totalBet0USD : 0;
    } else if (bettingOutcome === 1) {
      const userBetAmount = userBet1;
      if (userBetAmount === 0) return 0;
      // payout = (userBetAmount * (totalBet0 + totalBet1)) / totalBet1
      return totalBet1USD > 0 ? (userBetAmount * (totalBet0USD + totalBet1USD)) / totalBet1USD : 0;
    }
    return 0;
  };

  const claimableAmount = calculateClaimableAmount();

  // Handle claim bet profit confirmation
  useEffect(() => {
    if (isClaimBetConfirmed) {
      // Track claim confirmation
      trackTransaction('transaction_claim_confirmed', {
        wallet_address: address,
        chain_id: chainId,
        transaction_hash: claimBetHash,
        experiment_id: experiment.experiment_id,
        experiment_title: experiment.title,
        claim_amount_usd: claimedAmount,
      });

      setIsClaiming(false);
      setHasClaimed(true); // Mark as claimed to hide the button
      resetClaimBet();

      // Add a small delay to ensure blockchain state is updated
      setTimeout(async () => {
        // Refetch contract data to show updated amounts
        await refetchContractData();
      }, 1000);

      // Show success toast with the amount claimed
      const formattedAmount = claimedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      toast.success(`🎉 Successfully claimed $${formattedAmount} in winnings!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClaimBetConfirmed, resetClaimBet]);

  // Handle claim bet profit error - reset state to allow retry
  useEffect(() => {
    const hasClaimError = claimBetWriteError || claimBetReceiptError;
    // Handle error if we're claiming OR if we have an error (catches race conditions)
    if (hasClaimError && isClaiming) {
      console.error('[Claim Bet Error] Transaction failed:', hasClaimError);

      // Track claim failure
      trackTransaction('transaction_claim_failed', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment.experiment_id,
        experiment_title: experiment.title,
        claim_amount_usd: claimedAmount,
        error_message: hasClaimError.message,
        error_code: hasClaimError.name,
      });

      // Reset state to allow retry
      setIsClaiming(false);
      resetClaimBet();

      // Show error toast
      toast.error('Claiming winnings failed. Please try again.');
    }
  }, [claimBetWriteError, claimBetReceiptError, isClaiming, address, chainId, experiment, claimableAmount, claimedAmount, resetClaimBet]);

  // Timeout for stuck claim transactions (15 seconds)
  useEffect(() => {
    if (isClaiming) {
      console.log('[Claim Timeout] Starting 15-second timeout for claim transaction');
      const timeoutId = setTimeout(() => {
        console.error('[Claim Timeout] Transaction timed out after 15 seconds');

        // Track claim failure due to timeout
        trackTransaction('transaction_claim_failed', {
          wallet_address: address,
          chain_id: chainId,
          experiment_id: experiment.experiment_id,
          experiment_title: experiment.title,
          claim_amount_usd: claimedAmount,
          error_message: 'Transaction timed out after 15 seconds',
          error_code: 'TIMEOUT',
        });

        // Show error toast
        toast.error('Claim transaction timed out. Please try again.');

        // Reset state
        setIsClaiming(false);
        resetClaimBet();
      }, 15000); // 15 seconds

      // Cleanup timeout if component unmounts or state changes
      return () => {
        console.log('[Claim Timeout] Clearing timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [isClaiming, address, chainId, experiment, claimableAmount, claimedAmount, resetClaimBet]);

  const handleClaimBetProfit = async () => {
    if (!address || !experiment) return;

    try {
      // Reset claim state first to clear any previous errors
      // This prevents race conditions where an error is set before isClaiming updates
      resetClaimBet();

      // Store the claimable amount before the transaction (it will be 0 after claiming)
      const amountToClaim = claimableAmount;
      setClaimedAmount(amountToClaim);
      setIsClaiming(true);

      // Track claim start
      trackTransaction('transaction_claim_started', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment.experiment_id,
        experiment_title: experiment.title,
        claim_amount_usd: amountToClaim,
      });

      // Call userClaimBetProfit function with experiment ID
      writeClaimBet({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CastlabExperimentABI.abi,
        functionName: 'userClaimBetProfit',
        args: [BigInt(experiment.experiment_id)],
        chainId: CHAIN.id,
      });
    } catch (err) {
      console.error('Claim bet profit failed:', err);
      setIsClaiming(false);

      // Track claim failure
      trackTransaction('transaction_claim_failed', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment.experiment_id,
        experiment_title: experiment.title,
        claim_amount_usd: claimedAmount,
        error_message: err instanceof Error ? err.message : 'Unknown error',
        error_code: err instanceof Error ? err.name : 'Error',
      });

      toast.error('Claiming winnings failed. Please try again.');
    }
  };

  const handleCastAboutThis = async () => {
    try {
      const appUrl = `${getAppUrl()}/experiments/${experiment?.experiment_id}`;
      await sdk.actions.composeCast({
        text: `Check out this CastLab experiment: "${experiment.title}" 🧪🔬`,
        embeds: [appUrl]
      });
    } catch (error) {
      console.error('Failed to compose cast:', error);
    }
  };

  return (
    <Card className={`hover-lift transition-all shadow-[var(--shadow-soft)] ${
      isFeatured
        ? 'border-2 border-primary/40 bg-card'
        : 'border border-border/40 bg-card'
    }`}>
      <CardHeader className="pb-3 md:pb-4">
        {/* Featured Badge */}
        {isFeatured && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <span aria-hidden>⭐</span>
              Featured
            </span>
          </div>
        )}
        <div className="flex items-start gap-3 md:gap-4">
          {(() => {
            const videoUrl = experiment.video_url;
            const imageUrl = experiment.image_url;
            const hasMedia = videoUrl || imageUrl;
            return hasMedia && (
              <div className="w-[45%] md:w-[35%] lg:w-[30%] aspect-square rounded-lg bg-gradient-to-br from-primary to-secondary p-0.5 flex-shrink-0">
                <div className="relative w-full h-full rounded-lg bg-card overflow-hidden">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={experiment.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 45vw, (max-width: 1024px) 35vw, 200px"
                      priority
                      unoptimized={imageUrl.endsWith('.gif')}
                    />
                  ) : null}
                </div>
              </div>
            );
          })()}
          <div className="flex-1 min-w-0">
            <Link href={`/experiments/${experiment.experiment_id}`}>
              <h3 className="font-semibold text-base md:text-lg text-balance leading-tight text-foreground hover:text-primary transition-colors cursor-pointer">
                {experiment.title}
              </h3>
            </Link>
            {experiment.summary && (
              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2 md:line-clamp-3">
                {experiment.summary}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {(!hideRanges || userContribution > 0) && (
        <CardContent className="space-y-4 md:space-y-5">
          {/* Funding Progress - only show if not hiding ranges */}
          {!hideRanges && (
            <div className="space-y-2">
              {isOpen ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      ${totalDepositedUSD.toLocaleString()} raised of ${fundingGoal.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={fundingProgress} className="h-2 bg-muted" />
                </>
              ) : (
                <div className="text-sm">
                  <span className="font-semibold text-foreground">Progress: Fully Funded!</span>
                </div>
              )}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Current odds</span>
                  <span className="font-medium text-foreground">{oddsPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={oddsPercentage}
                  onChange={() => { }}
                  className="w-full accent-primary cursor-default"
                  aria-readonly
                />
              </div>
            </div>
          )}

          {/* Top Donors Leaderboard */}
          {!hideRanges && (
            <TopDonors experimentId={experiment.experiment_id} />
          )}

          {(userContribution > 0 || userBet0 > 0 || userBet1 > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-foreground">Your Activity</span>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  {userContribution > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-foreground/80">Funded:</span>
                      <span className="font-semibold text-secondary">${userContribution}</span>
                    </div>
                  )}
                  {(userBet0 > 0 || userBet1 > 0) && (
                    <div className="flex items-center gap-3">
                      {userBet0 > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-foreground/80">{experiment.outcome_text0}:</span>
                          <span className="font-semibold text-secondary">${userBet0}</span>
                        </div>
                      )}
                      {userBet1 > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-foreground/80">{experiment.outcome_text1}:</span>
                          <span className="font-semibold text-secondary">${userBet1}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="flex flex-col gap-2 pt-0">
        {hasWinningBet && !hasClaimed && (
          <Button
            size="sm"
            onClick={handleClaimBetProfit}
            disabled={isClaiming || isClaimBetPending}
            className="w-full bg-amber-500 text-black shadow-[var(--shadow-medium)] hover:bg-amber-600"
          >
            <span className="flex items-center justify-center gap-2 text-sm font-semibold">
              {isClaiming || isClaimBetPending
                ? 'Claiming...'
                : claimableAmount > 0
                  ? `Claim $${claimableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Claim Winnings'
              }
            </span>
          </Button>
        )}
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            className={isInMiniApp ? "flex-1" : "w-full"}
            asChild
          >
            <Link href={`/experiments/${experiment.experiment_id}`}>
              View Details
            </Link>
          </Button>
          {isInMiniApp && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCastAboutThis}
            >
              Cast About This
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
