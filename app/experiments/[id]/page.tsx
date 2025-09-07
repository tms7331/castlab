"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Event } from "@/lib/supabase/types";

export default function ExperimentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [experiment, setExperiment] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState("");

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

  // Generate mock raised/backers data for display (until we add these to the database)
  const raised = experiment ? Math.floor((experiment.cost || 0) * 0.65) : 0;
  const backers = experiment ? Math.floor(Math.random() * 100) + 20 : 0;

  const handleFunding = (e: React.FormEvent) => {
    e.preventDefault();
    if (fundingAmount && Number(fundingAmount) > 0) {
      alert(`Thank you for funding $${fundingAmount}!`);
      setFundingAmount("");
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

            <form onSubmit={handleFunding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#005577] mb-2">
                  Fund this experiment
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
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary">
                Fund This Science
              </button>

              <div className="space-y-2 pt-4 border-t border-[#00a8cc]/20">
                <button
                  type="button"
                  onClick={() => setFundingAmount("10")}
                  className="w-full py-2 text-[#00a8cc] hover:bg-[#00a8cc]/10 rounded-lg transition-colors"
                >
                  Quick fund: $10
                </button>
                <button
                  type="button"
                  onClick={() => setFundingAmount("25")}
                  className="w-full py-2 text-[#00a8cc] hover:bg-[#00a8cc]/10 rounded-lg transition-colors"
                >
                  Quick fund: $25
                </button>
                <button
                  type="button"
                  onClick={() => setFundingAmount("50")}
                  className="w-full py-2 text-[#00a8cc] hover:bg-[#00a8cc]/10 rounded-lg transition-colors"
                >
                  Quick fund: $50
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}