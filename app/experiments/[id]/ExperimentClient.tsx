"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Event } from "@/lib/supabase/types";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, TOKEN_ADDRESS, usdToTokenAmount, tokenAmountToUsd } from '@/lib/wagmi/config';
import { CHAIN } from '@/lib/wagmi/addresses';
import CastlabExperimentABI from '@/lib/contracts/CastlabExperiment.json';
import ERC20ABI from '@/lib/contracts/ERC20.json';
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trackTransaction, identifyUser } from "@/lib/analytics/events";

const EXPERIMENTER_FID = 883930;
const EXPERIMENTER_HANDLE = "@motherlizard";

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
  const [fundingAmount, setFundingAmount] = useState("0");
  const [outcome0BetAmount, setOutcome0BetAmount] = useState("0");
  const [outcome1BetAmount, setOutcome1BetAmount] = useState("0");
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'approved' | 'depositing' | 'complete'>('idle');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState<string | null>(null);
  const [hasAttemptedDeposit, setHasAttemptedDeposit] = useState(false);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();

  // Identify user in PostHog when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      identifyUser(address, {
        chain_id: chainId,
      });
    }
  }, [address, isConnected, chainId]);

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
  const { isLoading: isDepositPending, isSuccess: isDepositConfirmed, error: depositReceiptError } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Debug logging for transaction hashes
  useEffect(() => {
    console.log('[Transaction Hashes] approveHash:', approveHash, 'depositHash:', depositHash);
  }, [approveHash, depositHash]);

  // Debug logging for transaction pending states
  useEffect(() => {
    console.log('[Transaction Pending] isApprovePending:', isApprovePending, 'isDepositPending:', isDepositPending);
  }, [isApprovePending, isDepositPending]);

  // Debug logging for transaction success states
  useEffect(() => {
    console.log('[Transaction Success] isApproved:', isApproved, 'isDepositConfirmed:', isDepositConfirmed);
  }, [isApproved, isDepositConfirmed]);

  // Debug logging for transaction errors
  useEffect(() => {
    console.log('[Transaction Errors] approveError:', approveError, 'depositError:', depositError, 'depositReceiptError:', depositReceiptError);
    if (depositError) {
      console.error('[Transaction Errors] Deposit error details:', depositError);
    }
    if (depositReceiptError) {
      console.error('[Transaction Errors] Deposit receipt error details:', depositReceiptError);
    }
  }, [approveError, depositError, depositReceiptError]);

  // Withdrawal transaction hooks
  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    reset: resetWithdraw
  } = useWriteContract();

  // Wait for withdrawal confirmation
  const { isLoading: isWithdrawPending, isSuccess: isWithdrawConfirmed, error: withdrawError } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Read experiment data from smart contract
  const { data: contractData, refetch: refetchContractData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
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

  // Read user's position (deposit and bets) for this experiment
  const { data: userPosition, refetch: refetchUserPosition } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
    functionName: 'getUserPosition',
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
  const { isSuccess: isMintConfirmed, error: mintError } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Extract data from contract - new structure includes bet amounts and bettingOutcome
  type ExperimentInfo = readonly [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
  const totalDepositedTokens = contractData ? (contractData as ExperimentInfo)[2] : BigInt(0);
  const totalBet0Tokens = contractData ? (contractData as ExperimentInfo)[3] : BigInt(0);
  const totalBet1Tokens = contractData ? (contractData as ExperimentInfo)[4] : BigInt(0);
  const bettingOutcome: number = contractData ? (contractData as ExperimentInfo)[6] : 255; // 255 means no outcome set yet

  // Extract isOpen from blockchain data
  const isOpen: boolean = contractData ? (contractData as ExperimentInfo)[7] : false;

  // Determine experiment state
  const experimentState: 'open' | 'inProgress' | 'betClaims' | 'completed' | null = experiment?.date_completed
    ? 'completed'
    : isOpen
      ? 'open'
      : bettingOutcome === 0 || bettingOutcome === 1
        ? 'betClaims'
        : !isOpen && bettingOutcome === 255
          ? 'inProgress'
          : null;

  const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
  const totalBet0USD = tokenAmountToUsd(totalBet0Tokens);
  const totalBet1USD = tokenAmountToUsd(totalBet1Tokens);
  const fundingTargetUSD = experiment?.cost_min || experiment?.cost_max || 1;

  // Calculate odds (percentage of total bets for outcome 0)
  const totalBetsUSD = totalBet0USD + totalBet1USD;
  const oddsPercentage = totalBetsUSD > 0 ? Math.round((totalBet0USD / totalBetsUSD) * 100) : 50;

  // Convert token balance to USD
  const userBalanceUSD = tokenBalance ? tokenAmountToUsd(tokenBalance as bigint) : 0;

  // Convert user's position to USD - getUserPosition returns [depositAmount, betAmount0, betAmount1]
  type UserPosition = readonly [bigint, bigint, bigint];
  const userDepositAmount = userPosition ? (userPosition as UserPosition)[0] : BigInt(0);
  const userBet0Amount = userPosition ? (userPosition as UserPosition)[1] : BigInt(0);
  const userBet1Amount = userPosition ? (userPosition as UserPosition)[2] : BigInt(0);

  const userDepositUSD = tokenAmountToUsd(userDepositAmount);
  const userBet0USD = tokenAmountToUsd(userBet0Amount);
  const userBet1USD = tokenAmountToUsd(userBet1Amount);
  const userTotalStakeUSD = userDepositUSD + userBet0USD + userBet1USD;
  const formatUsd = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

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
    console.log('[Approve Effect] isApproved:', isApproved, 'currentStep:', currentStep);
    if (isApproved && currentStep === 'approving') {
      console.log('[Approve Effect] Moving to approved state');
      setCurrentStep('approved');
      // Track the total amount that was approved (funding + bets)
      const totalApproved = (Number(fundingAmount) || 0) + (Number(outcome0BetAmount) || 0) + (Number(outcome1BetAmount) || 0);
      console.log('[Approve Effect] Total approved amount:', totalApproved);
      setApprovedAmount(totalApproved.toString());

      // Track approval confirmation
      trackTransaction('transaction_approval_confirmed', {
        wallet_address: address,
        chain_id: chainId,
        transaction_hash: approveHash,
        experiment_id: experiment?.experiment_id,
        experiment_title: experiment?.title,
        total_amount_usd: totalApproved,
        transaction_step: 'approved',
      });
    }
  }, [isApproved, currentStep, fundingAmount, outcome0BetAmount, outcome1BetAmount, address, chainId, approveHash, experiment]);

  // Handle approve error - reset to idle state for retry
  useEffect(() => {
    console.log('[Approve Error Effect] approveError:', approveError, 'currentStep:', currentStep);
    if (approveError && currentStep === 'approving') {
      console.error('[Approve Error Effect] Approve transaction failed:', approveError);
      setCurrentStep('idle');

      // Track approval failure
      trackTransaction('transaction_approval_failed', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment?.experiment_id,
        experiment_title: experiment?.title,
        error_message: approveError.message,
        error_code: approveError.name,
        transaction_step: 'approving',
      });

      // Show error toast
      toast.error('Approval failed. Please try again.');

      // Reset approve state to allow retry
      resetApprove();
    }
  }, [approveError, currentStep, resetApprove, address, chainId, experiment]);

  // Automatically proceed to deposit after approval (only first time)
  useEffect(() => {
    console.log('[Auto Deposit Effect] currentStep:', currentStep, 'hasAttemptedDeposit:', hasAttemptedDeposit);
    if (currentStep === 'approved' && !hasAttemptedDeposit) {
      console.log('[Auto Deposit Effect] Auto-triggering deposit');
      setHasAttemptedDeposit(true);
      handleDeposit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, hasAttemptedDeposit]);

  // Handle deposit confirmation
  useEffect(() => {
    console.log('[Deposit Confirmed Effect] isDepositConfirmed:', isDepositConfirmed, 'currentStep:', currentStep);
    if (isDepositConfirmed && currentStep === 'depositing') {
      console.log('[Deposit Confirmed] Starting post-deposit flow');

      const fundAmount = Number(fundingAmount) || 0;
      const bet0Amount = Number(outcome0BetAmount) || 0;
      const bet1Amount = Number(outcome1BetAmount) || 0;

      // Track deposit confirmation
      trackTransaction('transaction_deposit_confirmed', {
        wallet_address: address,
        chain_id: chainId,
        transaction_hash: depositHash,
        experiment_id: experiment?.experiment_id,
        experiment_title: experiment?.title,
        fund_amount_usd: fundAmount,
        bet_amount_0_usd: bet0Amount,
        bet_amount_1_usd: bet1Amount,
        total_amount_usd: fundAmount + bet0Amount + bet1Amount,
        transaction_step: 'complete',
      });

      // Show success toast
      const totalAmount = fundAmount + bet0Amount + bet1Amount;
      toast.success(`Successfully funded $${totalAmount.toFixed(2)}! 🎉`);

      // Haptic feedback for successful deposit
      sdk.haptics.impactOccurred('medium');
      console.log('[Deposit Confirmed] Setting currentStep to "complete"');
      setCurrentStep('complete');
      setFundingAmount("");
      setOutcome0BetAmount("0");
      setOutcome1BetAmount("0");
      setApprovedAmount(null); // Clear approved amount after successful deposit

      // Add a small delay to ensure blockchain state is updated
      setTimeout(async () => {
        console.log('[Deposit Confirmed] Refetching contract data and syncing to database');
        // Refetch all data to show updated amounts
        await Promise.all([
          refetchContractData(),
          refetchUserPosition(),
          refetchTokenBalance()
        ]);

        console.log('[Deposit Confirmed] About to call syncDonationToDatabase');
        // Sync donation to database for leaderboard
        await syncDonationToDatabase();
        console.log('[Deposit Confirmed] Completed syncDonationToDatabase');
      }, 2000);

      // Don't reset the state automatically - let user dismiss it or cast about it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDepositConfirmed, currentStep, refetchContractData]);

  // Handle deposit error - keep approval and allow manual retry
  useEffect(() => {
    console.log('[Deposit Error Effect] depositError:', depositError, 'depositReceiptError:', depositReceiptError, 'currentStep:', currentStep, 'hasAttemptedDeposit:', hasAttemptedDeposit);
    const hasDepositError = depositError || depositReceiptError;
    // Handle error if we're in depositing state OR if we attempted deposit and are in approved state
    // The second condition catches race conditions where error is set before currentStep updates
    if (hasDepositError && (currentStep === 'depositing' || (currentStep === 'approved' && hasAttemptedDeposit))) {
      console.error('[Deposit Error Effect] Deposit transaction failed:', hasDepositError);

      const fundAmount = Number(fundingAmount) || 0;
      const bet0Amount = Number(outcome0BetAmount) || 0;
      const bet1Amount = Number(outcome1BetAmount) || 0;

      // Track deposit failure
      trackTransaction('transaction_deposit_failed', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment?.experiment_id,
        experiment_title: experiment?.title,
        fund_amount_usd: fundAmount,
        bet_amount_0_usd: bet0Amount,
        bet_amount_1_usd: bet1Amount,
        total_amount_usd: fundAmount + bet0Amount + bet1Amount,
        error_message: hasDepositError.message,
        error_code: hasDepositError.name,
        transaction_step: 'depositing',
      });

      // Show error toast
      toast.error('Deposit failed. Please try again.');

      // Always go back to approved state so user can retry just the deposit
      // This preserves the approval transaction
      console.log('[Deposit Error Effect] Resetting to approved state');
      setCurrentStep('approved');
      resetDeposit();
    }
  }, [depositError, depositReceiptError, currentStep, hasAttemptedDeposit, resetDeposit, fundingAmount, outcome0BetAmount, outcome1BetAmount, address, chainId, experiment]);

  // Timeout for stuck deposit transactions (15 seconds)
  useEffect(() => {
    if (currentStep === 'depositing') {
      console.log('[Deposit Timeout] Starting 15-second timeout for deposit transaction');
      const timeoutId = setTimeout(() => {
        console.error('[Deposit Timeout] Transaction timed out after 15 seconds');

        const fundAmount = Number(fundingAmount) || 0;
        const bet0Amount = Number(outcome0BetAmount) || 0;
        const bet1Amount = Number(outcome1BetAmount) || 0;

        // Track deposit failure due to timeout
        trackTransaction('transaction_deposit_failed', {
          wallet_address: address,
          chain_id: chainId,
          experiment_id: experiment?.experiment_id,
          experiment_title: experiment?.title,
          fund_amount_usd: fundAmount,
          bet_amount_0_usd: bet0Amount,
          bet_amount_1_usd: bet1Amount,
          total_amount_usd: fundAmount + bet0Amount + bet1Amount,
          error_message: 'Transaction timed out after 15 seconds',
          error_code: 'TIMEOUT',
          transaction_step: 'depositing',
        });

        // Show error toast
        toast.error('Transaction timed out. Please try again.');

        // Reset to approved state
        setCurrentStep('approved');
        resetDeposit();
      }, 15000); // 15 seconds

      // Cleanup timeout if component unmounts or state changes
      return () => {
        console.log('[Deposit Timeout] Clearing timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [currentStep, address, chainId, experiment, fundingAmount, outcome0BetAmount, outcome1BetAmount, resetDeposit]);

  // Reset approval if amount changes after approval
  useEffect(() => {
    console.log('[Amount Change Effect] currentStep:', currentStep, 'approvedAmount:', approvedAmount);
    if (currentStep === 'approved' && approvedAmount) {
      const currentTotal = (Number(fundingAmount) || 0) + (Number(outcome0BetAmount) || 0) + (Number(outcome1BetAmount) || 0);
      console.log('[Amount Change Effect] currentTotal:', currentTotal, 'approvedAmount:', approvedAmount);
      if (currentTotal.toString() !== approvedAmount) {
        // Amount changed, need new approval
        console.log('[Amount Change Effect] Amount changed, resetting to idle');
        setCurrentStep('idle');
        setApprovedAmount(null);
        setHasAttemptedDeposit(false);
        resetApprove();
        resetDeposit();
      }
    }
  }, [fundingAmount, outcome0BetAmount, outcome1BetAmount, approvedAmount, currentStep, resetApprove, resetDeposit]);

  // Handle withdrawal confirmation
  useEffect(() => {
    if (isWithdrawConfirmed) {
      // Track withdrawal confirmation
      trackTransaction('transaction_withdrawal_confirmed', {
        wallet_address: address,
        chain_id: chainId,
        transaction_hash: withdrawHash,
        experiment_id: experiment?.experiment_id,
        experiment_title: experiment?.title,
      });

      setIsWithdrawing(false);
      resetWithdraw();

      // Add a small delay to ensure blockchain state is updated
      setTimeout(async () => {
        // Refetch all data to show updated amounts
        await Promise.all([
          refetchContractData(),
          refetchUserPosition(),
          refetchTokenBalance()
        ]);

        // Sync donation to database for leaderboard
        await syncDonationToDatabase();

        // Show success toast after all data is refreshed
        toast.success("Your withdrawal has been completed successfully.");
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWithdrawConfirmed, resetWithdraw]);

  // Handle withdrawal error - reset state to allow retry
  useEffect(() => {
    if (withdrawError) {
      console.error('[Withdrawal Error] Transaction failed:', withdrawError);

      // Track withdrawal failure
      trackTransaction('transaction_withdrawal_failed', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment?.experiment_id,
        experiment_title: experiment?.title,
        error_message: withdrawError.message,
        error_code: withdrawError.name,
      });

      // Reset state to allow retry
      setIsWithdrawing(false);
      resetWithdraw();

      // Show error toast
      toast.error('Withdrawal failed. Please try again.');
    }
  }, [withdrawError, address, chainId, experiment, resetWithdraw]);

  // Handle mint confirmation
  useEffect(() => {
    if (isMintConfirmed) {
      // Refetch balance after minting
      setTimeout(async () => {
        await refetchTokenBalance();
      }, 2000);

      toast.success("Testnet tokens minted successfully!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMintConfirmed]);

  // Handle mint error
  useEffect(() => {
    if (mintError) {
      console.error('[Mint Error] Transaction failed:', mintError);
      toast.error('Minting failed. Please try again.');
    }
  }, [mintError]);

  const syncDonationToDatabase = async () => {
    console.log('[syncDonationToDatabase] Called with:', { address, experimentId: experiment?.experiment_id });

    if (!address || !experiment) {
      console.log('[syncDonationToDatabase] Early return - missing address or experiment:', { address, experiment: !!experiment });
      return;
    }

    try {
      console.log('[syncDonationToDatabase] Sending request to /api/donations/sync');
      // Send wallet address and experiment ID to API
      // API will fetch deposit amount from blockchain and profile from Neynar
      const response = await fetch('/api/donations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          experimentId: experiment.experiment_id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('[syncDonationToDatabase] Could not sync donation (this is okay):', errorText);
      } else {
        const result = await response.json();
        console.log('[syncDonationToDatabase] Donation synced successfully to leaderboard:', result);
      }
    } catch (error) {
      console.log('[syncDonationToDatabase] Could not sync donation to database (this is okay):', error);
    }
  };

  const handleCastAboutDonation = async () => {
    console.log('[handleCastAboutDonation] Called, currentStep:', currentStep);
    try {
      // Link to the specific experiment page
      const appUrl = `${getAppUrl()}/experiments/${experiment?.experiment_id}`;

      // Determine the cast text based on whether they bet or just funded
      const bet0Amount = Number(outcome0BetAmount) || 0;
      const bet1Amount = Number(outcome1BetAmount) || 0;
      const hasBet = bet0Amount > 0 || bet1Amount > 0;

      let castText: string;
      if (hasBet) {
        // If they bet on both sides, prefer outcome0
        const betSide = bet0Amount > 0 ? experiment?.outcome_text0 : experiment?.outcome_text1;
        castText = `"${experiment?.title}" I bet on ${betSide} on CastLab! 🧪🔬`;
      } else {
        castText = `I just funded "${experiment?.title}" on CastLab! 🧪🔬`;
      }

      const result = await sdk.actions.composeCast({
        text: castText,
        embeds: [appUrl]
      });

      console.log('[handleCastAboutDonation] Compose cast result:', result);
      if (result?.cast) {
        // Reset state after successful cast
        console.log('[handleCastAboutDonation] Cast successful, resetting state to idle');
        setCurrentStep('idle');
        setApprovedAmount(null);
        setHasAttemptedDeposit(false);
        resetApprove();
        resetDeposit();

        // Refetch data to ensure amounts stay current
        setTimeout(async () => {
          await Promise.all([
            refetchContractData(),
            refetchUserPosition(),
            refetchTokenBalance()
          ]);
        }, 500);
      } else {
        console.log('[handleCastAboutDonation] No cast in result, not resetting state');
      }
    } catch (error) {
      console.error('[handleCastAboutDonation] Failed to compose cast:', error);
    }
  };

  const handleFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[handleFunding] Called, currentStep:', currentStep);

    // Connect wallet if not connected
    if (!isConnected) {
      console.log('[handleFunding] Wallet not connected, connecting...');
      // Simply connect with the Farcaster connector (the only one available)
      if (connectors[0]) {
        await connect({ connector: connectors[0] });
      }
      return;
    }

    const fundAmount = Number(fundingAmount) || 0;
    const outcome0Bet = Number(outcome0BetAmount) || 0;
    const outcome1Bet = Number(outcome1BetAmount) || 0;
    console.log('[handleFunding] Amounts - fund:', fundAmount, 'bet0:', outcome0Bet, 'bet1:', outcome1Bet);

    // Validation: each field must be 0 or >= 1
    if ((fundAmount > 0 && fundAmount < 1) || (outcome0Bet > 0 && outcome0Bet < 1) || (outcome1Bet > 0 && outcome1Bet < 1)) {
      toast.error("Each amount must be either 0 or at least $1");
      return;
    }

    // Validation: at least one field must be >= 1
    const totalAmount = fundAmount + outcome0Bet + outcome1Bet;
    if (totalAmount < 1) {
      toast.error("Please enter at least $1 in one of the fields");
      return;
    }

    // Check if on the correct chain
    if (chainId !== CHAIN.id) {
      toast.error(`Please switch to ${CHAIN.name} network in your wallet`);
      return;
    }

    // Clear any previous errors before starting
    console.log('[handleFunding] Clearing previous states and resetting');
    resetApprove();
    resetDeposit();
    setHasAttemptedDeposit(false);

    console.log('[handleFunding] Setting currentStep to "approving"');
    setCurrentStep('approving');

    // Convert USD to token amount - approve total of funding + bets
    const tokenAmount = usdToTokenAmount(totalAmount);
    console.log('[handleFunding] Token amount to approve:', tokenAmount);

    // Track approval start
    trackTransaction('transaction_approval_started', {
      wallet_address: address,
      chain_id: chainId,
      experiment_id: experiment?.experiment_id,
      experiment_title: experiment?.title,
      fund_amount_usd: fundAmount,
      bet_amount_0_usd: outcome0Bet,
      bet_amount_1_usd: outcome1Bet,
      total_amount_usd: totalAmount,
      transaction_step: 'approving',
    });

    // Step 1: Approve the contract to spend tokens
    console.log('[handleFunding] Calling writeApprove');
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
    if (!address || !userPosition || !experiment) return;

    try {
      setIsWithdrawing(true);

      // Track withdrawal start
      trackTransaction('transaction_withdrawal_started', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment.experiment_id,
        experiment_title: experiment.title,
      });

      // Call undeposit function with experiment ID
      writeWithdraw({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CastlabExperimentABI.abi,
        functionName: 'userUndeposit',
        args: [BigInt(experiment.experiment_id)],
        chainId: CHAIN.id,
      });
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setIsWithdrawing(false);

      // Track withdrawal failure
      trackTransaction('transaction_withdrawal_failed', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: experiment.experiment_id,
        experiment_title: experiment.title,
        error_message: err instanceof Error ? err.message : 'Unknown error',
        error_code: err instanceof Error ? err.name : 'Error',
      });

      toast.error('Withdrawal failed. Please try again.');
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
      toast.error('Minting failed. Please try again.');
    }
  };

  const handleDeposit = async () => {
    console.log('[handleDeposit] Called, currentStep:', currentStep);
    if (!experiment) {
      console.log('[handleDeposit] No experiment, returning');
      return;
    }

    // Reset deposit state first to clear any previous errors
    // This prevents race conditions where an error is set before currentStep updates
    console.log('[handleDeposit] Resetting deposit state');
    resetDeposit();

    console.log('[handleDeposit] Setting currentStep to "depositing"');
    setCurrentStep('depositing');

    const experimentId = experiment.experiment_id;
    const fundAmount = Number(fundingAmount) || 0;
    const bet0Amount = Number(outcome0BetAmount) || 0;
    const bet1Amount = Number(outcome1BetAmount) || 0;
    const tokenFundAmount = usdToTokenAmount(fundAmount);
    const tokenBetAmount0 = usdToTokenAmount(bet0Amount);
    const tokenBetAmount1 = usdToTokenAmount(bet1Amount);
    console.log('[handleDeposit] Deposit amounts - fund:', tokenFundAmount, 'bet0:', tokenBetAmount0, 'bet1:', tokenBetAmount1);

    // Track deposit start
    trackTransaction('transaction_deposit_started', {
      wallet_address: address,
      chain_id: chainId,
      experiment_id: experimentId,
      experiment_title: experiment.title,
      fund_amount_usd: fundAmount,
      bet_amount_0_usd: bet0Amount,
      bet_amount_1_usd: bet1Amount,
      total_amount_usd: fundAmount + bet0Amount + bet1Amount,
      transaction_step: 'depositing',
    });

    // Step 2: Fund and bet on the experiment
    console.log('[handleDeposit] Calling writeDeposit for experiment:', experimentId);
    writeDeposit({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CastlabExperimentABI.abi,
      functionName: 'userFundAndBet',
      args: [BigInt(experimentId), tokenFundAmount, tokenBetAmount0, tokenBetAmount1],
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

        <h1 className="text-3xl font-bold text-foreground mb-4 text-center">{experiment.title}</h1>

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

        {/* Show funding deadline if experiment is not completed */}
        {!experiment.date_completed && (
          <Card className="p-4 mb-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Funding Deadline</div>
              <div className="text-lg font-bold text-foreground">
                {experiment.date_funding_deadline
                  ? new Date(experiment.date_funding_deadline).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })
                  : 'TBD'}
              </div>
            </div>
            {experiment.date_funding_deadline && (() => {
              const daysRemaining = Math.ceil((new Date(experiment.date_funding_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return daysRemaining > 0 ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                </div>
              ) : (
                <div className="text-xs text-red-600 mt-1">Deadline has passed</div>
              );
            })()}
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Experimenter</p>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{EXPERIMENTER_HANDLE}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sdk.actions.viewProfile({ fid: EXPERIMENTER_FID })}
                >
                  View profile
                </Button>
              </div>
            </div>
          </Card>
        )}

        {experiment.summary && (
          <Card className="p-4 mb-4 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-xl font-semibold text-foreground mb-2">About This Experiment</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {experiment.summary}
            </p>
          </Card>
        )}

        {experiment.date_completed && experiment.experiment_url && (
          <Card className="p-4 mb-4 bg-muted/50 border-border/50">
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() => {
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
          <>
            <Card className="mb-4 bg-card border-border">
              <CardHeader className="px-4 pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">Funding Progress</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-5">
                <div className="space-y-4">
                  {experimentState === 'open' ? (
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">
                          ${totalDepositedUSD.toLocaleString()} raised of ${fundingTargetUSD.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={Math.min((totalDepositedUSD / fundingTargetUSD) * 100, 100)} className="mt-2 h-2 bg-muted" />
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">Progress: Fully Funded!</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current odds</span>
                      <span className="font-semibold text-foreground">{oddsPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={oddsPercentage}
                      onChange={() => { }}
                      className="mt-2 w-full accent-primary cursor-default"
                      aria-readonly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left sm:text-center">
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      ${totalBet0USD.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground text-xs">Amount {experiment.outcome_text0}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      ${totalBet1USD.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground text-xs">Amount {experiment.outcome_text1}</div>
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="relative mb-6 rounded-2xl bg-gradient-to-br from-primary/35 via-transparent to-secondary/35 p-[1.5px] shadow-[0_20px_50px_-22px_rgba(124,58,237,0.6)]">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/15 blur-3xl" />
              <Card className="relative h-full rounded-[1.1rem] border-2 border-primary/40 bg-card/95 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground">Fund and Bet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experimentState === 'open' && (
                    <>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        You can fund without betting, or bet without funding. Funding goes towards running the experiment. Betting goes towards the betting pool, which is parimutuel style.  For more info, see the About page.
                      </p>

                      {currentStep === 'complete' ? (
                        <>
                          <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium text-center">
                            ✅ Thank you for funding this experiment!
                          </div>

                          <Button
                            onClick={handleCastAboutDonation}
                            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold"
                            size="lg"
                          >
                            Cast about it! 📢
                          </Button>
                        </>
                      ) : (
                        <form onSubmit={handleFunding} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Fund this experiment (USDC)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                placeholder="50"
                                className="pl-8"
                                value={fundingAmount}
                                onChange={(e) => setFundingAmount(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                min="0"
                                step="1"
                                disabled={currentStep === 'approving' || currentStep === 'depositing'}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Bet on this experiment (USDC)
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  {experiment.outcome_text0}
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    placeholder="25"
                                    className="pl-8"
                                    value={outcome0BetAmount}
                                    onChange={(e) => setOutcome0BetAmount(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    min="0"
                                    step="1"
                                    disabled={currentStep === 'approving' || currentStep === 'depositing'}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  {experiment.outcome_text1}
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    type="number"
                                    placeholder="25"
                                    className="pl-8"
                                    value={outcome1BetAmount}
                                    onChange={(e) => setOutcome1BetAmount(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    min="0"
                                    step="1"
                                    disabled={currentStep === 'approving' || currentStep === 'depositing'}
                                  />
                                </div>
                              </div>
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
                                  ? (depositError || depositReceiptError) ? "Retry Deposit" : "Click to Deposit"
                                  : currentStep === 'depositing' || isDepositPending
                                    ? "Depositing..."
                                    : "Fund and Bet"}
                          </Button>

                          {(approveError || depositError || depositReceiptError) && (
                            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm break-words overflow-hidden">
                              <div className="font-semibold">Transaction Error</div>
                              <div className="mt-1 text-xs break-all">
                                {((approveError || depositError || depositReceiptError)?.message || '').includes('User rejected')
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
                              {(depositError || depositReceiptError) && currentStep === 'approved' && (
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

                          {currentStep === 'approved' && !depositError && !depositReceiptError && (
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
                    </>
                  )}

                  {isConnected && (
                    <Card className="mt-4 p-3 bg-secondary/10 border-secondary/20">
                      <div>
                        <div className="text-xs text-secondary-foreground mb-1">Your Base USDC Balance</div>
                        <div className="text-xl font-bold text-secondary">${userBalanceUSD.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Available for funding</div>
                      </div>
                    </Card>
                  )}

                  {/* Your Current Stake */}
                  <div className="mt-3 rounded-lg border border-border/70 bg-card/90 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your Current Stake</p>
                        <p className="text-lg font-semibold text-foreground">${formatUsd(userTotalStakeUSD)}</p>
                        <p className="text-[11px] text-muted-foreground">Total funding + bets</p>
                      </div>
                      {userDepositUSD > 0 && experimentState === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleWithdraw}
                          disabled={isWithdrawing || isWithdrawPending}
                          className="border-destructive/70 text-destructive hover:bg-destructive/10 disabled:border-muted disabled:text-muted-foreground"
                        >
                          {isWithdrawing || isWithdrawPending ? 'Withdrawing...' : 'Withdraw Funding'}
                        </Button>
                      )}
                    </div>

                    {userTotalStakeUSD > 0 ? (
                      <div className="mt-3 grid gap-x-6 gap-y-2 text-xs text-muted-foreground sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">Funding: ${formatUsd(userDepositUSD)}</p>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {experimentState === 'open' ? 'Withdrawable' : 'Funding complete'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">Bet {experiment.outcome_text0}: ${formatUsd(userBet0USD)}</p>
                          <p className="text-[11px] uppercase tracking-wide text-primary/80">Locked until settlement</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">Bet {experiment.outcome_text1}: ${formatUsd(userBet1USD)}</p>
                          <p className="text-[11px] uppercase tracking-wide text-secondary-foreground/80">Locked until settlement</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        You haven&apos;t funded or placed a bet on this experiment yet.
                      </p>
                    )}

                    <p className="mt-3 text-[11px] text-muted-foreground">
                      Withdrawals return only your funding contributions. Bets stay in the pool until resolution.
                    </p>
                  </div>

                  {isConnected && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Network: {chainId === CHAIN.id ? `${CHAIN.name} ✓` : `Wrong Network (Chain ID: ${chainId})`}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
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
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
