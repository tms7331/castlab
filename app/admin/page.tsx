"use client";

import { useState } from "react";
import { EventInsert } from "@/lib/supabase/types";

export default function AdminPage() {
  const [newExperiment, setNewExperiment] = useState({
    title: "",
    oneLiner: "",
    whyStudy: "",
    approach: "",
    cost: "",
    imageUrl: ""
  });

  const [selectedExperiment, setSelectedExperiment] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Mock existing experiments for management
  const existingExperiments = [
    { id: 1, title: "What Rap Music Goes the Hardest, Objectively", raised: 325, goal: 500, status: "active" },
    { id: 2, title: "The Science of Talking to Plants", raised: 890, goal: 1200, status: "active" },
    { id: 3, title: "Canine Classical Music Discrimination", raised: 156, goal: 800, status: "active" },
    { id: 4, title: "The Optimal Programming Soundtrack", raised: 2100, goal: 2500, status: "active" },
    { id: 5, title: "Teaching Fungi to Play Video Games", raised: 450, goal: 1500, status: "active" },
    { id: 6, title: "The Mathematics of Perfect Pizza", raised: 3200, goal: 3000, status: "completed" }
  ];

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Prepare the event data for the database
      const eventData: EventInsert = {
        title: newExperiment.title,
        one_liner: newExperiment.oneLiner || null,
        why_study: newExperiment.whyStudy || null,
        approach: newExperiment.approach || null,
        cost: newExperiment.cost ? parseFloat(newExperiment.cost) : null
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
        oneLiner: "",
        whyStudy: "",
        approach: "",
        cost: "",
        imageUrl: ""
      });

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
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-2">Admin Dashboard</h1>
          <p className="text-[#0a3d4d]">Manage experiments and platform operations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "create"
                ? "bg-gradient-to-r from-[#00c9a7] to-[#00a8cc] text-white"
                : "bg-white text-[#005577] border border-[#00a8cc]/30"
            }`}
          >
            Create Experiment
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === "manage"
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
            <form onSubmit={handleCreateExperiment} className="space-y-6">
              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newExperiment.title}
                  onChange={(e) => setNewExperiment({...newExperiment, title: e.target.value})}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="e.g., What Rap Music Goes the Hardest, Objectively"
                />
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  One-Liner *
                </label>
                <input
                  type="text"
                  required
                  value={newExperiment.oneLiner}
                  onChange={(e) => setNewExperiment({...newExperiment, oneLiner: e.target.value})}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="e.g., Kendrick vs Drake – which goes the hardest"
                />
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Why Study This? *
                </label>
                <textarea
                  required
                  value={newExperiment.whyStudy}
                  onChange={(e) => setNewExperiment({...newExperiment, whyStudy: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="Explain the scientific merit and importance of this study..."
                />
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Experimental Approach *
                </label>
                <textarea
                  required
                  value={newExperiment.approach}
                  onChange={(e) => setNewExperiment({...newExperiment, approach: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="Describe the methodology, controls, and measurements..."
                />
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Cost (USD) *
                </label>
                <input
                  type="number"
                  required
                  value={newExperiment.cost}
                  onChange={(e) => setNewExperiment({...newExperiment, cost: e.target.value})}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={newExperiment.imageUrl}
                  onChange={(e) => setNewExperiment({...newExperiment, imageUrl: e.target.value})}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="/image.png (place file in public folder)"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Creating...' : 'Create Experiment'}
              </button>

              {submitMessage && (
                <div className={`mt-4 p-4 rounded-lg ${
                  submitMessage.type === 'success' 
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