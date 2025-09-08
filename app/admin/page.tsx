"use client";

import { useState, useEffect } from "react";
import { EventInsert } from "@/lib/supabase/types";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, usdToTokenAmount } from '@/lib/wagmi/adminConfig';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';
import { decodeEventLog } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AdminPage() {
  const [newExperiment, setNewExperiment] = useState({
    title: "",
    summary: "",
    costMin: "",
    costMax: "",
    imageUrl: ""
  });

  const [selectedExperiment, setSelectedExperiment] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [contractExperimentId, setContractExperimentId] = useState<string | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Extract experiment ID from transaction receipt
  useEffect(() => {
    async function extractExperimentId() {
      if (isConfirmed && receipt && publicClient) {
        try {
          // Find the ExperimentCreated event in the logs
          const experimentCreatedEvent = receipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
                abi: ExperimentFundingABI.abi,
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
              abi: ExperimentFundingABI.abi,
              data: experimentCreatedEvent.data,
              topics: experimentCreatedEvent.topics,
            });

            // The experiment ID is the first indexed parameter
            const args = decoded.args as unknown as { experimentId: bigint };
            const expId = args.experimentId;
            setContractExperimentId(expId.toString());
            setIsCreatingContract(false);

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
  }, [isConfirmed, receipt, publicClient]);

  // Mock existing experiments for management
  const existingExperiments = [
    { id: 1, title: "What Rap Music Goes the Hardest, Objectively", raised: 325, goal: 500, status: "active" },
    { id: 2, title: "The Science of Talking to Plants", raised: 890, goal: 1200, status: "active" },
    { id: 3, title: "Canine Classical Music Discrimination", raised: 156, goal: 800, status: "active" },
    { id: 4, title: "The Optimal Programming Soundtrack", raised: 2100, goal: 2500, status: "active" },
    { id: 5, title: "Teaching Fungi to Play Video Games", raised: 450, goal: 1500, status: "active" },
    { id: 6, title: "The Mathematics of Perfect Pizza", raised: 3200, goal: 3000, status: "completed" }
  ];

  const handleCreateContractExperiment = async () => {
    // Validate inputs
    if (!newExperiment.title || !newExperiment.costMin || !newExperiment.costMax || !newExperiment.imageUrl) {
      alert("Please enter a title, image URL, minimum cost, and maximum cost for the experiment");
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
    if (chainId !== baseSepolia.id) {
      alert(`Please switch to ${baseSepolia.name} network in your wallet`);
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

      // Send the transaction with new parameters
      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ExperimentFundingABI.abi,
        functionName: 'createExperiment',
        args: [newExperiment.title, costMinWei, costMaxWei],
        chainId: baseSepolia.id,
      });
    } catch (error) {
      console.error('Contract creation failed:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create experiment on-chain'
      });
      setIsCreatingContract(false);
    }
  };

  const handleCreateDatabaseExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Validate experiment ID
      if (!contractExperimentId) {
        alert("Please create an experiment on the blockchain first to get an Experiment ID");
        setIsSubmitting(false);
        return;
      }

      const experimentId = parseInt(contractExperimentId);
      if (isNaN(experimentId)) {
        alert("Invalid Experiment ID");
        setIsSubmitting(false);
        return;
      }

      // Prepare the event data for the database
      const eventData: EventInsert = {
        experiment_id: experimentId,
        title: newExperiment.title,
        summary: newExperiment.summary || null,
        image_url: newExperiment.imageUrl || null,
        cost_min: newExperiment.costMin ? parseInt(newExperiment.costMin) : null,
        cost_max: newExperiment.costMax ? parseInt(newExperiment.costMax) : null
      };

      // Send to the API
      const response = await fetch('/api/events', {
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
        imageUrl: ""
      });
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

  const handleCloseExperiment = () => {
    if (!selectedExperiment) {
      alert("Please select an experiment to close");
      return;
    }
    if (confirm(`Are you sure you want to close experiment ${selectedExperiment}?`)) {
      console.log("Closing experiment:", selectedExperiment);
      alert(`Experiment ${selectedExperiment} has been closed`);
    }
  };

  const handleWithdrawFunds = () => {
    if (!selectedExperiment) {
      alert("Please select an experiment to withdraw from");
      return;
    }
    const experiment = existingExperiments.find(exp => exp.id.toString() === selectedExperiment);
    if (experiment) {
      if (confirm(`Withdraw $${experiment.raised} from "${experiment.title}"?`)) {
        console.log("Withdrawing funds from:", selectedExperiment);
        alert(`Successfully withdrew $${experiment.raised} from experiment ${selectedExperiment}`);
      }
    }
  };

  const handleRefundAll = () => {
    if (!selectedExperiment) {
      alert("Please select an experiment to refund");
      return;
    }
    if (confirm(`Are you sure you want to refund all backers for experiment ${selectedExperiment}? This action cannot be undone.`)) {
      console.log("Refunding all backers for:", selectedExperiment);
      alert(`All backers have been refunded for experiment ${selectedExperiment}`);
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

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Image URL *
                </label>
                <input
                  type="text"
                  required
                  value={newExperiment.imageUrl}
                  onChange={(e) => setNewExperiment({ ...newExperiment, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="/image.png (place file in public folder)"
                />
              </div>

              {/* Wallet connection */}
              {!isConnected && (
                <div className="flex justify-center mb-4">
                  <ConnectButton />
                </div>
              )}

              {/* Two buttons for contract and database creation */}
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
                        : "Create Experiment (Contract)"}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Creating...' : 'Create Experiment (Database)'}
                </button>
              </div>

              {/* Display contract experiment ID after successful creation */}
              {contractExperimentId && (
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
                    Network: {chainId === baseSepolia.id ? 'Base Sepolia ✓' : `Wrong Network (Chain ID: ${chainId})`}
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
                  onChange={(e) => setSelectedExperiment(e.target.value)}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                >
                  <option value="">-- Select an experiment --</option>
                  {existingExperiments.map((exp) => (
                    <option key={exp.id} value={exp.id.toString()}>
                      {exp.title} (${exp.raised}/${exp.goal} - {exp.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedExperiment && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#e8f5f7] rounded-lg">
                    {(() => {
                      const exp = existingExperiments.find(e => e.id.toString() === selectedExperiment);
                      return exp ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-[#005577]">{exp.title}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[#0a3d4d]">Status: </span>
                              <span className={`font-medium ${exp.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                                {exp.status === 'completed' ? 'Completed' : 'Active'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#0a3d4d]">Progress: </span>
                              <span className="font-medium text-[#00a8cc]">
                                ${exp.raised} / ${exp.goal}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleCloseExperiment}
                      className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Close Experiment
                    </button>

                    <button
                      onClick={handleWithdrawFunds}
                      className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Withdraw Funds
                    </button>

                    <button
                      onClick={handleRefundAll}
                      className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Refund All Backers
                    </button>

                    <button
                      onClick={() => alert("Feature coming soon")}
                      className="px-6 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Post Results
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Overview */}
            <div className="experiment-card">
              <h3 className="text-xl font-bold text-[#005577] mb-4">Platform Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#e8f5f7] rounded-lg">
                  <p className="text-2xl font-bold text-[#00a8cc]">$8,521</p>
                  <p className="text-sm text-[#0a3d4d]">Total Raised</p>
                </div>
                <div className="text-center p-4 bg-[#e8f5f7] rounded-lg">
                  <p className="text-2xl font-bold text-[#00a8cc]">6</p>
                  <p className="text-sm text-[#0a3d4d]">Active Experiments</p>
                </div>
                <div className="text-center p-4 bg-[#e8f5f7] rounded-lg">
                  <p className="text-2xl font-bold text-[#00a8cc]">628</p>
                  <p className="text-sm text-[#0a3d4d]">Total Backers</p>
                </div>
              </div>
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
    </div>
  );
}