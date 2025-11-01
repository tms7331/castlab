"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { EventInsert, Event } from "@/lib/supabase/types";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient, useReadContract } from 'wagmi';
import { CHAIN } from '@/lib/wagmi/addresses';
import { CONTRACT_ADDRESS, usdToTokenAmount, tokenAmountToUsd } from '@/lib/wagmi/adminConfig';
import CastlabExperimentABI from '@/lib/contracts/CastlabExperiment.json';
import { decodeEventLog } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { trackTransaction, identifyUser } from "@/lib/analytics/events";

export default function AdminPage() {
  const [newExperiment, setNewExperiment] = useState({
    title: "",
    summary: "",
    costMin: "",
    costMax: "",
    outcomeText0: "",
    outcomeText1: "",
    imageUrl: "",
    experimentUrl: "",
    dateCompleted: "",
    dateFundingDeadline: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [selectedExperiment, setSelectedExperiment] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [contractExperimentId, setContractExperimentId] = useState<string | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [existingExperiments, setExistingExperiments] = useState<Event[]>([]);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false);
  const [dateCompletedInput, setDateCompletedInput] = useState("");
  const [contractAction, setContractAction] = useState<'close' | 'withdraw' | null>(null);
  const [syncWalletAddress, setSyncWalletAddress] = useState("");
  const [syncExperimentId, setSyncExperimentId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [bettingOutcome, setBettingOutcome] = useState<string>("");
  const [showBettingConfirmDialog, setShowBettingConfirmDialog] = useState(false);
  const [contractExperimentInfo, setContractExperimentInfo] = useState<{
    costMin: bigint;
    costMax: bigint;
    totalDeposited: bigint;
    totalBet0: bigint;
    totalBet1: bigint;
    experimentCreatedAt: bigint;
    bettingOutcome: number;
    open: boolean;
  } | null>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Identify admin user in PostHog when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      identifyUser(address, {
        chain_id: chainId,
        is_admin: true,
      });
    }
  }, [address, isConnected, chainId]);
  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  // Read contract experiment info
  const { data: contractInfo, isLoading: isLoadingContractInfo } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
    functionName: 'getExperimentInfo',
    args: selectedExperiment ? [BigInt(selectedExperiment)] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!selectedExperiment,
    }
  });

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Update contract experiment info when data is fetched
  useEffect(() => {
    if (contractInfo) {
      console.log('📊 Contract info received:', contractInfo);
      console.log('📊 Type:', typeof contractInfo, 'Is array?:', Array.isArray(contractInfo));

      // getExperimentInfo returns a tuple: [costMin, costMax, totalDeposited, totalBet0, totalBet1, experimentCreatedAt, bettingOutcome, open]
      type ExperimentInfo = readonly [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];

      const info = contractInfo as ExperimentInfo;

      setContractExperimentInfo({
        costMin: info[0],
        costMax: info[1],
        totalDeposited: info[2],
        totalBet0: info[3],
        totalBet1: info[4],
        experimentCreatedAt: info[5],
        bettingOutcome: info[6],
        open: info[7],
      });
    }
  }, [contractInfo]);

  // Handle contract action confirmations
  useEffect(() => {
    if (isConfirmed && receipt && contractAction) {
      if (contractAction === 'close') {
        // Track admin close/set outcome confirmation
        trackTransaction('admin_close_experiment_confirmed', {
          wallet_address: address,
          chain_id: chainId,
          transaction_hash: hash,
          experiment_id: selectedExperiment ? parseInt(selectedExperiment) : undefined,
        });
        alert('Experiment closed successfully on blockchain!');
      } else if (contractAction === 'withdraw') {
        // Track admin withdraw confirmation
        trackTransaction('admin_withdraw_confirmed', {
          wallet_address: address,
          chain_id: chainId,
          transaction_hash: hash,
          experiment_id: selectedExperiment ? parseInt(selectedExperiment) : undefined,
        });
        alert('Funds withdrawn successfully!');
      }
      setContractAction(null);
      fetchExperiments(); // Refresh to get updated state
    }
  }, [isConfirmed, receipt, contractAction, address, chainId, hash, selectedExperiment]);

  // Extract experiment ID from transaction receipt
  useEffect(() => {
    async function extractExperimentId() {
      if (isConfirmed && receipt && publicClient && !contractAction) {
        try {
          // Find the ExperimentCreated event in the logs
          const experimentCreatedEvent = receipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
                abi: CastlabExperimentABI.abi,
                data: log.data,
                topics: log.topics,
              });
              return decoded.eventName === 'ExperimentCreated';
            } catch {
              return false;
            }
          });

          if (experimentCreatedEvent) {
            const decoded = decodeEventLog({
              abi: CastlabExperimentABI.abi,
              data: experimentCreatedEvent.data,
              topics: experimentCreatedEvent.topics,
            });

            // The experiment ID is the first indexed parameter
            const args = decoded.args as unknown as { experimentId: bigint };
            const expId = args.experimentId;
            setContractExperimentId(expId.toString());
            setIsCreatingContract(false);

            // Track admin create experiment confirmation
            trackTransaction('admin_create_experiment_confirmed', {
              wallet_address: address,
              chain_id: chainId,
              transaction_hash: hash,
              experiment_id: parseInt(expId.toString()),
            });

            // Show success message
            setSubmitMessage({
              type: 'success',
              text: `Experiment created on-chain! ID: ${expId.toString()}`
            });
          }
        } catch (error) {
          console.error('Error extracting experiment ID:', error);
        }
      }
    }

    extractExperimentId();
  }, [isConfirmed, receipt, publicClient, contractAction, address, chainId, hash]);

  // Fetch existing experiments from database
  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    setIsLoadingExperiments(true);
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      if (result.data) {
        setExistingExperiments(result.data);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setIsLoadingExperiments(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload an image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File too large. Maximum size is 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateContractExperiment = async () => {
    // Validate inputs
    if (!newExperiment.title || !newExperiment.costMin || !newExperiment.costMax) {
      alert("Please enter a title, minimum cost, and maximum cost for the experiment");
      return;
    }

    // Validate cost range
    const minCost = parseFloat(newExperiment.costMin);
    const maxCost = parseFloat(newExperiment.costMax);
    if (minCost > maxCost) {
      alert("Minimum cost cannot be greater than maximum cost");
      return;
    }

    // Check if wallet is connected
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    // Check if on the correct chain
    if (chainId !== CHAIN.id) {
      alert(`Please switch to ${CHAIN.name} network in your wallet`);
      return;
    }

    setIsCreatingContract(true);
    setContractExperimentId(null);
    resetWrite();

    try {
      // Convert costs to Wei
      const costMinWei = usdToTokenAmount(parseFloat(newExperiment.costMin));
      const costMaxWei = usdToTokenAmount(parseFloat(newExperiment.costMax));
      console.log('costMinWei', costMinWei);
      console.log('costMaxWei', costMaxWei);

      // Track admin create experiment start
      trackTransaction('admin_create_experiment_started', {
        wallet_address: address,
        chain_id: chainId,
        cost_min_wei: costMinWei.toString(),
        cost_max_wei: costMaxWei.toString(),
      });

      // Send the transaction with new parameters
      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CastlabExperimentABI.abi,
        functionName: 'adminCreateExperiment',
        args: [costMinWei, costMaxWei],
        chainId: CHAIN.id,
      });
    } catch (error) {
      console.error('Contract creation failed:', error);

      // Track admin create experiment failure
      trackTransaction('admin_create_experiment_failed', {
        wallet_address: address,
        chain_id: chainId,
        cost_min_wei: usdToTokenAmount(parseFloat(newExperiment.costMin)).toString(),
        cost_max_wei: usdToTokenAmount(parseFloat(newExperiment.costMax)).toString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_code: error instanceof Error ? error.name : 'Error',
      });

      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create experiment on-chain'
      });
      setIsCreatingContract(false);
    }
  };

  const parseDateString = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Parse MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      alert("Please enter date in MM/DD/YYYY format");
      return null;
    }

    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      alert("Invalid date format. Please use MM/DD/YYYY");
      return null;
    }

    if (month < 1 || month > 12) {
      alert("Invalid month. Please enter a value between 1 and 12");
      return null;
    }

    if (day < 1 || day > 31) {
      alert("Invalid day. Please enter a value between 1 and 31");
      return null;
    }

    if (year < 2020 || year > 2100) {
      alert("Invalid year. Please enter a reasonable year");
      return null;
    }

    // Create a Date object and convert to ISO string
    const date = new Date(year, month - 1, day);
    return date.toISOString();
  };

  const handleCreateDatabaseExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      let experimentId: number;

      // Parse date completed if provided
      let dateCompleted: string | null = null;
      if (newExperiment.dateCompleted) {
        dateCompleted = parseDateString(newExperiment.dateCompleted);
        if (!dateCompleted) {
          setIsSubmitting(false);
          return;
        }
      }

      // If date_completed is filled, generate a random experiment_id
      // Otherwise, require blockchain experiment ID
      if (dateCompleted) {
        // Generate a random experiment ID for completed experiments
        // Use a large number range to avoid conflicts with blockchain IDs
        experimentId = Math.floor(Math.random() * 900000) + 100000;
        setSubmitMessage({
          type: 'success',
          text: `Creating completed experiment with ID: ${experimentId}`
        });
      } else {
        // For ongoing experiments, require blockchain ID
        if (!contractExperimentId) {
          alert("Please create an experiment on the blockchain first to get an Experiment ID (or mark as completed for offline experiments)");
          setIsSubmitting(false);
          return;
        }

        experimentId = parseInt(contractExperimentId);
        if (isNaN(experimentId)) {
          alert("Invalid Experiment ID");
          setIsSubmitting(false);
          return;
        }
      }

      // Upload image if one is selected
      let imageUrl = newExperiment.imageUrl; // fallback to manually entered URL
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // Upload failed, stop submission
          setIsSubmitting(false);
          return;
        }
      }

      // Parse funding deadline date
      let dateFundingDeadline: string | null = null;
      if (newExperiment.dateFundingDeadline) {
        dateFundingDeadline = parseDateString(newExperiment.dateFundingDeadline);
        if (!dateFundingDeadline) {
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare the event data for the database
      const eventData: EventInsert = {
        experiment_id: experimentId,
        title: newExperiment.title,
        summary: newExperiment.summary || null,
        image_url: imageUrl || null,
        cost_min: newExperiment.costMin ? parseInt(newExperiment.costMin) : null,
        cost_max: newExperiment.costMax ? parseInt(newExperiment.costMax) : null,
        outcome_text0: newExperiment.outcomeText0 || null,
        outcome_text1: newExperiment.outcomeText1 || null,
        date_completed: dateCompleted,
        date_funding_deadline: dateFundingDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days from now
        experiment_url: newExperiment.experimentUrl || null
      };

      // Send to the API
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event');
      }

      // Success! Reset form and show success message
      setSubmitMessage({ type: 'success', text: 'Event created successfully!' });
      setNewExperiment({
        title: "",
        summary: "",
        costMin: "",
        costMax: "",
        outcomeText0: "",
        outcomeText1: "",
        imageUrl: "",
        experimentUrl: "",
        dateCompleted: "",
        dateFundingDeadline: ""
      });
      setImageFile(null);
      setImagePreview(null);
      setContractExperimentId(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSubmitMessage(null), 5000);
    } catch (error) {
      console.error('Error creating event:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create event. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseExperiment = async () => {
    if (!selectedExperiment) {
      alert("Please select an experiment to close");
      return;
    }
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    if (chainId !== CHAIN.id) {
      alert(`Please switch to ${CHAIN.name} network in your wallet`);
      return;
    }

    const experiment = existingExperiments.find(exp => exp.experiment_id.toString() === selectedExperiment);
    if (!experiment) return;

    if (confirm(`Are you sure you want to close experiment "${experiment.title}" (ID: ${selectedExperiment})?`)) {
      setContractAction('close');
      try {
        // Track admin close experiment start
        trackTransaction('admin_close_experiment_started', {
          wallet_address: address,
          chain_id: chainId,
          experiment_id: parseInt(selectedExperiment),
        });

        await writeContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CastlabExperimentABI.abi,
          functionName: 'adminClose',
          args: [BigInt(selectedExperiment)],
          chainId: CHAIN.id,
        });
      } catch (error) {
        console.error('Failed to close experiment:', error);

        // Track admin close experiment failure
        trackTransaction('admin_close_experiment_failed', {
          wallet_address: address,
          chain_id: chainId,
          experiment_id: parseInt(selectedExperiment),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_code: error instanceof Error ? error.name : 'Error',
        });

        alert('Failed to close experiment: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setContractAction(null);
      }
    }
  };

  const handleWithdrawFunds = async () => {
    if (!selectedExperiment) {
      alert("Please select an experiment to withdraw from");
      return;
    }
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    if (chainId !== CHAIN.id) {
      alert(`Please switch to ${CHAIN.name} network in your wallet`);
      return;
    }

    const experiment = existingExperiments.find(exp => exp.experiment_id.toString() === selectedExperiment);
    if (!experiment) return;

    if (confirm(`Withdraw funds from "${experiment.title}" (ID: ${selectedExperiment})?`)) {
      setContractAction('withdraw');
      try {
        // Track admin withdraw start
        trackTransaction('admin_withdraw_started', {
          wallet_address: address,
          chain_id: chainId,
          experiment_id: parseInt(selectedExperiment),
        });

        await writeContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CastlabExperimentABI.abi,
          functionName: 'adminWithdraw',
          args: [BigInt(selectedExperiment)],
          chainId: CHAIN.id,
        });
      } catch (error) {
        console.error('Failed to withdraw funds:', error);

        // Track admin withdraw failure
        trackTransaction('admin_withdraw_failed', {
          wallet_address: address,
          chain_id: chainId,
          experiment_id: parseInt(selectedExperiment),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_code: error instanceof Error ? error.name : 'Error',
        });

        alert('Failed to withdraw funds: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setContractAction(null);
      }
    }
  };

  const handleSetDateCompleted = async () => {
    if (!selectedExperiment) {
      alert("Please select an experiment to update");
      return;
    }
    if (!dateCompletedInput) {
      alert("Please enter a completion date");
      return;
    }

    const dateCompleted = parseDateString(dateCompletedInput);
    if (!dateCompleted) return;

    const experiment = existingExperiments.find(exp => exp.experiment_id.toString() === selectedExperiment);
    if (!experiment) return;

    if (confirm(`Set completion date for "${experiment.title}" to ${dateCompletedInput}?`)) {
      try {
        const response = await fetch(`/api/admin/events/${selectedExperiment}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date_completed: dateCompleted }),
        });

        if (!response.ok) {
          throw new Error('Failed to update experiment');
        }

        alert('Completion date updated successfully!');
        setDateCompletedInput('');
        await fetchExperiments(); // Refresh the list
      } catch (error) {
        console.error('Failed to update date:', error);
        alert('Failed to update completion date');
      }
    }
  };

  const handleDeleteExperiment = async () => {
    if (!selectedExperiment) {
      alert("Please select an experiment to delete");
      return;
    }

    const experiment = existingExperiments.find(exp => exp.experiment_id.toString() === selectedExperiment);
    if (!experiment) return;

    if (confirm(`Are you sure you want to DELETE "${experiment.title}" from the database? This cannot be undone!`)) {
      if (confirm(`This will PERMANENTLY DELETE the experiment. Are you absolutely sure?`)) {
        try {
          const response = await fetch(`/api/admin/events/${selectedExperiment}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete experiment');
          }

          alert('Experiment deleted successfully!');
          setSelectedExperiment('');
          await fetchExperiments(); // Refresh the list
        } catch (error) {
          console.error('Failed to delete:', error);
          alert('Failed to delete experiment');
        }
      }
    }
  };

  const handleSetBettingOutcome = () => {
    console.log('🎯 handleSetBettingOutcome called');
    console.log('  selectedExperiment:', selectedExperiment);
    console.log('  bettingOutcome:', bettingOutcome);
    console.log('  isConnected:', isConnected);
    console.log('  chainId:', chainId, '| CHAIN.id:', CHAIN.id);

    if (!selectedExperiment) {
      console.log('❌ Validation failed: No experiment selected');
      alert("Please select an experiment");
      return;
    }
    if (bettingOutcome !== "0" && bettingOutcome !== "1") {
      console.log('❌ Validation failed: Invalid betting outcome:', bettingOutcome);
      alert("Please enter a valid betting outcome (0 or 1)");
      return;
    }
    if (!isConnected) {
      console.log('❌ Validation failed: Wallet not connected');
      alert("Please connect your wallet first");
      return;
    }
    if (chainId !== CHAIN.id) {
      console.log('❌ Validation failed: Wrong chain. chainId:', chainId, 'expected:', CHAIN.id);
      alert(`Please switch to ${CHAIN.name} network in your wallet`);
      return;
    }

    // Show confirmation dialog
    console.log('✅ All validations passed, showing confirmation dialog');
    setShowBettingConfirmDialog(true);
  };

  const handleConfirmBettingOutcome = async () => {
    console.log('🔐 handleConfirmBettingOutcome called');
    console.log('  selectedExperiment:', selectedExperiment);
    console.log('  bettingOutcome:', bettingOutcome);

    const experiment = existingExperiments.find(exp => exp.experiment_id.toString() === selectedExperiment);
    console.log('  experiment found:', !!experiment, experiment);
    if (!experiment) {
      console.log('❌ Experiment not found');
      return;
    }

    const outcomeNum = parseInt(bettingOutcome);
    const outcomeText = outcomeNum === 0 ? experiment.outcome_text0 : experiment.outcome_text1;
    console.log('  outcomeNum:', outcomeNum);
    console.log('  outcomeText:', outcomeText);

    setShowBettingConfirmDialog(false);
    setContractAction('close'); // Reusing the 'close' action type
    console.log('  contractAction set to close');

    try {
      console.log('📝 About to call writeContract with:');
      console.log('  address:', CONTRACT_ADDRESS);
      console.log('  abi length:', CastlabExperimentABI.abi?.length);
      console.log('  functionName: adminSetResult');
      console.log('  args:', [BigInt(selectedExperiment), outcomeNum]);
      console.log('  chainId:', CHAIN.id);
      console.log('  isWriting:', isWriting);
      console.log('  isConfirming:', isConfirming);

      // Track admin set outcome start
      trackTransaction('admin_set_outcome_started', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: parseInt(selectedExperiment),
        outcome: outcomeNum,
      });

      const tx = await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CastlabExperimentABI.abi,
        functionName: 'adminSetResult',
        args: [BigInt(selectedExperiment), outcomeNum],
        chainId: CHAIN.id,
      });

      console.log('✅ writeContract call returned:', tx);

      // Clear the input after successful submission
      setBettingOutcome("");
      console.log('✅ Betting outcome cleared');
    } catch (error) {
      console.error('❌ Failed to set betting outcome:', error);
      console.error('  Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('  Error message:', error instanceof Error ? error.message : String(error));

      // Track admin set outcome failure
      trackTransaction('admin_set_outcome_failed', {
        wallet_address: address,
        chain_id: chainId,
        experiment_id: parseInt(selectedExperiment),
        outcome: outcomeNum,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_code: error instanceof Error ? error.name : 'Error',
      });
      if (error instanceof Error) {
        console.error('  Stack:', error.stack);
      }
      alert('Failed to set betting outcome: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setContractAction(null);
    }
  };

  const handleSyncDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!syncWalletAddress || !syncExperimentId) {
      setSyncMessage({ type: 'error', text: 'Please enter both wallet address and experiment ID' });
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/donations/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: syncWalletAddress,
          experimentId: parseInt(syncExperimentId),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync donation');
      }

      setSyncMessage({
        type: 'success',
        text: result.message || 'Donation synced successfully!'
      });

      // Clear form on success
      setSyncWalletAddress('');
      setSyncExperimentId('');

      // Clear success message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (error) {
      console.error('Sync donation error:', error);
      setSyncMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to sync donation'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-2">Admin Dashboard</h1>
            <p className="text-[#0a3d4d]">Manage experiments and platform operations</p>
          </div>
          <div className="mt-2">
            <ConnectButton />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === "create"
              ? "bg-gradient-to-r from-[#00c9a7] to-[#00a8cc] text-white"
              : "bg-white text-[#005577] border border-[#00a8cc]/30"
              }`}
          >
            Create Experiment
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === "manage"
              ? "bg-gradient-to-r from-[#00c9a7] to-[#00a8cc] text-white"
              : "bg-white text-[#005577] border border-[#00a8cc]/30"
              }`}
          >
            Manage Experiments
          </button>
        </div>

        {activeTab === "create" ? (
          /* Create Experiment Form */
          <div className="experiment-card">
            <h2 className="text-2xl font-bold text-[#005577] mb-6">Create New Experiment</h2>
            <form onSubmit={handleCreateDatabaseExperiment} className="space-y-6">
              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newExperiment.title}
                  onChange={(e) => setNewExperiment({ ...newExperiment, title: e.target.value })}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="e.g., What Rap Music Goes the Hardest, Objectively"
                />
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Summary
                </label>
                <textarea
                  value={newExperiment.summary}
                  onChange={(e) => setNewExperiment({ ...newExperiment, summary: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="Provide a brief summary of the experiment, including its purpose, approach, and expected outcomes..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Minimum Cost (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newExperiment.costMin}
                    onChange={(e) => setNewExperiment({ ...newExperiment, costMin: e.target.value })}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Maximum Cost (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newExperiment.costMax}
                    onChange={(e) => setNewExperiment({ ...newExperiment, costMax: e.target.value })}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Outcome 0 Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={newExperiment.outcomeText0}
                    onChange={(e) => setNewExperiment({ ...newExperiment, outcomeText0: e.target.value })}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="e.g., Drake, No, Fail"
                  />
                </div>

                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Outcome 1 Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={newExperiment.outcomeText1}
                    onChange={(e) => setNewExperiment({ ...newExperiment, outcomeText1: e.target.value })}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="e.g., Kendrick, Yes, Success"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Experiment Image
                </label>

                {/* Image Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-[#00a8cc]/30 border-dashed rounded-lg cursor-pointer bg-white/50 hover:bg-[#e8f5f7] transition-colors">
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-10 h-10 mb-3 text-[#00a8cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-[#0a3d4d]">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-[#0a3d4d]">PNG, JPG, GIF or WebP (MAX. 5MB)</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {/* Optional: Manual URL input as fallback */}
                  <div>
                    <label className="block text-sm text-[#005577] mb-1">
                      Or enter image URL manually (optional)
                    </label>
                    <input
                      type="text"
                      value={newExperiment.imageUrl}
                      onChange={(e) => setNewExperiment({ ...newExperiment, imageUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50 text-sm"
                      placeholder="https://example.com/image.jpg"
                      disabled={!!imageFile}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Experiment URL
                </label>
                <input
                  type="text"
                  value={newExperiment.experimentUrl}
                  onChange={(e) => setNewExperiment({ ...newExperiment, experimentUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="https://example.com/experiment-details"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Funding Deadline
                  </label>
                  <input
                    type="text"
                    value={newExperiment.dateFundingDeadline}
                    onChange={(e) => setNewExperiment({ ...newExperiment, dateFundingDeadline: e.target.value })}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="MM/DD/YYYY (e.g., 12/31/2024)"
                  />
                  <p className="text-xs text-[#0a3d4d] mt-1">
                    Deadline for funding. Defaults to 30 days from now if left blank.
                  </p>
                </div>

                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Date Completed (Optional)
                  </label>
                  <input
                    type="text"
                    value={newExperiment.dateCompleted}
                    onChange={(e) => setNewExperiment({ ...newExperiment, dateCompleted: e.target.value })}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="MM/DD/YYYY (e.g., 03/15/2024)"
                  />
                  <p className="text-xs text-[#0a3d4d] mt-1">
                    Leave blank for ongoing experiments. Fill in for completed experiments (no blockchain required).
                  </p>
                </div>
              </div>

              {/* Wallet connection */}
              {!isConnected && (
                <div className="flex justify-center mb-4">
                  <ConnectButton />
                </div>
              )}

              {/* Show different UI based on whether it's a completed experiment */}
              {newExperiment.dateCompleted ? (
                <div>
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Completed Experiment Mode:</strong> This experiment will be created directly in the database with a random ID.
                      No blockchain transaction required.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingImage}
                    className={`w-full btn-primary ${(isSubmitting || isUploadingImage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUploadingImage ? 'Uploading Image...' : isSubmitting ? 'Creating Completed Experiment...' : 'Create Completed Experiment'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Ongoing Experiment Mode:</strong> First create on blockchain to get an ID, then save to database.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={handleCreateContractExperiment}
                      disabled={!isConnected || isWriting || isConfirming || isCreatingContract}
                      className={`btn-primary ${(!isConnected || isWriting || isConfirming || isCreatingContract) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isWriting
                        ? "Preparing..."
                        : isConfirming
                          ? "Confirming..."
                          : isCreatingContract
                            ? "Creating on-chain..."
                            : "Step 1: Create on Blockchain"}
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || isUploadingImage || !contractExperimentId}
                      className={`btn-primary ${(isSubmitting || isUploadingImage || !contractExperimentId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploadingImage ? 'Uploading Image...' : isSubmitting ? 'Creating...' : 'Step 2: Save to Database'}
                    </button>
                  </div>
                </div>
              )}

              {/* Display contract experiment ID after successful creation (only for ongoing experiments) */}
              {contractExperimentId && !newExperiment.dateCompleted && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Contract Experiment ID:
                  </label>
                  <input
                    type="text"
                    value={contractExperimentId}
                    onChange={(e) => setContractExperimentId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-900 font-mono"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    This ID will be used when saving to the database
                  </p>
                </div>
              )}

              {/* Wallet connection status */}
              {isConnected && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  <div>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
                  <div className="text-xs mt-1">
                    Network: {chainId === CHAIN.id ? `${CHAIN.name} ✓` : `Wrong Network (Chain ID: ${chainId})`}
                  </div>
                </div>
              )}

              {/* Transaction error display */}
              {writeError && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
                  Error: {writeError.message}
                </div>
              )}

              {submitMessage && (
                <div className={`mt-4 p-4 rounded-lg ${submitMessage.type === 'success'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                  {submitMessage.text}
                </div>
              )}
            </form>
          </div>
        ) : (
          /* Manage Experiments */
          <div className="space-y-6">
            <div className="experiment-card">
              <h2 className="text-2xl font-bold text-[#005577] mb-6">Manage Experiments</h2>

              <div className="mb-6">
                <label className="block text-[#005577] font-semibold mb-2">
                  Select Experiment
                </label>
                <select
                  value={selectedExperiment}
                  onChange={(e) => {
                    setSelectedExperiment(e.target.value);
                    // Pre-fill date if experiment has one
                    const exp = existingExperiments.find(ex => ex.experiment_id.toString() === e.target.value);
                    if (exp?.date_completed) {
                      const date = new Date(exp.date_completed);
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const year = date.getFullYear();
                      setDateCompletedInput(`${month}/${day}/${year}`);
                    } else {
                      setDateCompletedInput('');
                    }
                  }}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  disabled={isLoadingExperiments}
                >
                  <option value="">-- Select an experiment --</option>
                  {existingExperiments.map((exp) => (
                    <option key={exp.experiment_id} value={exp.experiment_id.toString()}>
                      ID: {exp.experiment_id} - {exp.title}
                      {exp.date_completed ? ' (Completed)' : ''}
                      {exp.cost_min && exp.cost_max ? ` ($${exp.cost_min}-$${exp.cost_max})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExperiment && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#e8f5f7] rounded-lg">
                    {(() => {
                      const exp = existingExperiments.find(e => e.experiment_id.toString() === selectedExperiment);
                      return exp ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-[#005577]">{exp.title}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[#0a3d4d]">Experiment ID: </span>
                              <span className="font-medium">{exp.experiment_id}</span>
                            </div>
                            <div>
                              <span className="text-[#0a3d4d]">Status: </span>
                              <span className={`font-medium ${exp.date_completed ? 'text-green-600' : 'text-blue-600'}`}>
                                {exp.date_completed ? 'Completed' : 'Active'}
                              </span>
                            </div>
                            {exp.cost_min && exp.cost_max && (
                              <div>
                                <span className="text-[#0a3d4d]">Cost Range: </span>
                                <span className="font-medium text-[#00a8cc]">
                                  ${exp.cost_min} - ${exp.cost_max}
                                </span>
                              </div>
                            )}
                            {exp.date_completed && (
                              <div>
                                <span className="text-[#0a3d4d]">Completed: </span>
                                <span className="font-medium">
                                  {new Date(exp.date_completed).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          {exp.summary && (
                            <div className="mt-2 pt-2 border-t border-[#00a8cc]/20">
                              <span className="text-[#0a3d4d] text-sm">Summary: </span>
                              <p className="text-sm mt-1">{exp.summary}</p>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Contract Experiment Information */}
                  {contractExperimentInfo && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                      <h4 className="text-lg font-bold text-purple-900 mb-4">Smart Contract Data</h4>
                      {isLoadingContractInfo ? (
                        <p className="text-purple-600">Loading contract data...</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Cost Min</p>
                            <p className="text-purple-900 font-mono font-bold">
                              ${typeof contractExperimentInfo.costMin === 'bigint'
                                ? tokenAmountToUsd(contractExperimentInfo.costMin).toFixed(2)
                                : '0.00'
                              }
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Cost Max</p>
                            <p className="text-purple-900 font-mono font-bold">
                              ${typeof contractExperimentInfo.costMax === 'bigint'
                                ? tokenAmountToUsd(contractExperimentInfo.costMax).toFixed(2)
                                : '0.00'
                              }
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Total Deposited</p>
                            <p className="text-purple-900 font-mono font-bold">
                              ${typeof contractExperimentInfo.totalDeposited === 'bigint'
                                ? tokenAmountToUsd(contractExperimentInfo.totalDeposited).toFixed(2)
                                : '0.00'
                              }
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Total Bet (Outcome 0)</p>
                            <p className="text-purple-900 font-mono font-bold">
                              ${typeof contractExperimentInfo.totalBet0 === 'bigint'
                                ? tokenAmountToUsd(contractExperimentInfo.totalBet0).toFixed(2)
                                : '0.00'
                              }
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Total Bet (Outcome 1)</p>
                            <p className="text-purple-900 font-mono font-bold">
                              ${typeof contractExperimentInfo.totalBet1 === 'bigint'
                                ? tokenAmountToUsd(contractExperimentInfo.totalBet1).toFixed(2)
                                : '0.00'
                              }
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Created At</p>
                            <p className="text-purple-900 font-mono font-bold">
                              {contractExperimentInfo.experimentCreatedAt
                                ? new Date(Number(contractExperimentInfo.experimentCreatedAt) * 1000).toLocaleDateString()
                                : 'Unknown'}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Betting Outcome</p>
                            <p className={`font-mono font-bold ${contractExperimentInfo.bettingOutcome > 0 && contractExperimentInfo.bettingOutcome !== 255 ? 'text-green-600' : 'text-gray-600'}`}>
                              {contractExperimentInfo.bettingOutcome > 0 && contractExperimentInfo.bettingOutcome !== 255 ? contractExperimentInfo.bettingOutcome : 'Not Set'}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-purple-200">
                            <p className="text-purple-700 font-semibold mb-1">Status</p>
                            <p className={`font-bold ${contractExperimentInfo.open ? 'text-green-600' : 'text-red-600'}`}>
                              {contractExperimentInfo.open ? 'Open' : 'Closed'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Contract Actions */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#005577] mb-3">Smart Contract Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={handleCloseExperiment}
                          disabled={isWriting || isConfirming}
                          className={`px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors ${(isWriting || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {contractAction === 'close' && (isWriting || isConfirming)
                            ? (isWriting ? 'Preparing...' : 'Confirming...')
                            : 'Admin Close Experiment'}
                        </button>

                        <button
                          onClick={handleWithdrawFunds}
                          disabled={isWriting || isConfirming}
                          className={`px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors ${(isWriting || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {contractAction === 'withdraw' && (isWriting || isConfirming)
                            ? (isWriting ? 'Preparing...' : 'Confirming...')
                            : 'Admin Withdraw Funds'}
                        </button>
                      </div>
                    </div>

                    {/* Set Betting Outcome */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#005577] mb-3">Set Betting Outcome</h4>
                      {(() => {
                        const exp = existingExperiments.find(e => e.experiment_id.toString() === selectedExperiment);
                        return exp && (
                          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 mb-2">Betting Options:</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="p-3 bg-white rounded border border-blue-300">
                                <span className="font-semibold text-blue-900">0:</span>{" "}
                                <span className="text-blue-700">{exp.outcome_text0 || "Not set"}</span>
                              </div>
                              <div className="p-3 bg-white rounded border border-blue-300">
                                <span className="font-semibold text-blue-900">1:</span>{" "}
                                <span className="text-blue-700">{exp.outcome_text1 || "Not set"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bettingOutcome}
                          onChange={(e) => setBettingOutcome(e.target.value)}
                          placeholder="Enter 0 or 1"
                          className="w-32 px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50 text-center font-bold text-lg"
                          maxLength={1}
                        />
                        <button
                          onClick={handleSetBettingOutcome}
                          disabled={isWriting || isConfirming}
                          className={`flex-1 px-6 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors ${(isWriting || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Set Experiment Result
                        </button>
                      </div>
                      <p className="text-xs text-[#0a3d4d] mt-2">
                        This will close betting and set the winning outcome. This action cannot be undone.
                      </p>
                    </div>

                    {/* Database Actions */}
                    <div>
                      <h4 className="text-lg font-semibold text-[#005577] mb-3">Database Actions</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-[#0a3d4d] mb-2">Set Completion Date</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={dateCompletedInput}
                              onChange={(e) => setDateCompletedInput(e.target.value)}
                              placeholder="MM/DD/YYYY"
                              className="flex-1 px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                            />
                            <button
                              onClick={handleSetDateCompleted}
                              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Set Date
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={handleDeleteExperiment}
                          className="w-full px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete Experiment from Database
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Overview */}
            <div className="experiment-card">
              <h3 className="text-xl font-bold text-[#005577] mb-4">Platform Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#e8f5f7] rounded-lg">
                  <p className="text-2xl font-bold text-[#00a8cc]">{existingExperiments.length}</p>
                  <p className="text-sm text-[#0a3d4d]">Total Experiments</p>
                </div>
                <div className="text-center p-4 bg-[#e8f5f7] rounded-lg">
                  <p className="text-2xl font-bold text-[#00a8cc]">
                    {existingExperiments.filter(exp => !exp.date_completed).length}
                  </p>
                  <p className="text-sm text-[#0a3d4d]">Active Experiments</p>
                </div>
                <div className="text-center p-4 bg-[#e8f5f7] rounded-lg">
                  <p className="text-2xl font-bold text-[#00a8cc]">
                    {existingExperiments.filter(exp => exp.date_completed).length}
                  </p>
                  <p className="text-sm text-[#0a3d4d]">Completed Experiments</p>
                </div>
              </div>
            </div>

            {/* Sync Donation */}
            <div className="experiment-card">
              <h3 className="text-xl font-bold text-[#005577] mb-4">Sync Donation to Leaderboard</h3>
              <p className="text-sm text-[#0a3d4d] mb-4">
                Manually sync a donation from a wallet address to the donations database.
                This will query the blockchain for the deposit amount and fetch the Farcaster profile from Neynar.
              </p>

              <form onSubmit={handleSyncDonation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#005577] mb-2">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    value={syncWalletAddress}
                    onChange={(e) => setSyncWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50 font-mono text-sm"
                    disabled={isSyncing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#005577] mb-2">
                    Experiment ID *
                  </label>
                  <input
                    type="number"
                    value={syncExperimentId}
                    onChange={(e) => setSyncExperimentId(e.target.value)}
                    placeholder="e.g., 1"
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    disabled={isSyncing}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className={`w-full px-6 py-3 bg-[#00a8cc] text-white font-medium rounded-lg hover:bg-[#008fb3] transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Donation'}
                </button>

                {syncMessage && (
                  <div className={`p-4 rounded-lg ${syncMessage.type === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                    {syncMessage.text}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Admin Access:</strong> This page should be protected with authentication in production.
            All actions are logged for security purposes.
          </p>
        </div>
      </div>

      {/* Betting Outcome Confirmation Dialog */}
      {showBettingConfirmDialog && (() => {
        const experiment = existingExperiments.find(exp => exp.experiment_id.toString() === selectedExperiment);
        const outcomeNum = parseInt(bettingOutcome);
        const outcomeText = experiment && (outcomeNum === 0 ? experiment.outcome_text0 : experiment.outcome_text1);

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-[#005577] mb-4">Confirm Betting Outcome</h3>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Warning</p>
                  <p className="text-sm text-yellow-700">
                    This action will permanently set the betting outcome and cannot be undone.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-[#0a3d4d] mb-2">
                    <strong>Experiment:</strong> {experiment?.title}
                  </p>
                  <p className="text-sm text-[#0a3d4d] mb-2">
                    <strong>Experiment ID:</strong> {selectedExperiment}
                  </p>
                  <p className="text-sm text-[#0a3d4d]">
                    <strong>Winning Outcome:</strong> {outcomeNum} - {outcomeText || "Not set"}
                  </p>
                </div>

                <p className="text-sm text-[#0a3d4d]">
                  Are you sure the result is <strong>&quot;{outcomeText || `Outcome ${outcomeNum}`}&quot;</strong>?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBettingConfirmDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBettingOutcome}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Confirm & Set Outcome
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}