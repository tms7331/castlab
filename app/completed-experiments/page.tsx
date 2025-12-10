"use client";

import { useEffect, useState } from "react";
import { Event } from "@/lib/supabase/types";
import { NavigationPills } from "@/components/navigation-pills";
import { ExperimentCard } from "@/components/experiment-card";

export default function CompletedExperimentsPage() {
  const [experiments, setExperiments] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompletedEvents() {
      try {
        const response = await fetch('/api/events/completed');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch completed events');
        }
        
        setExperiments(result.data || []);
      } catch (err) {
        console.error('Error fetching completed events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load completed experiments');
      } finally {
        setLoading(false);
      }
    }

    fetchCompletedEvents();
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="relative px-4 md:px-6 lg:px-8 py-2 md:py-4">
          <div className="max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
            <NavigationPills />

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
                <span className="text-primary">Completed</span> Experiments
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-balance">
                Successfully funded experiments that have been completed
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 lg:px-8 pb-8">
        <div className="max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {loading ? (
            <div className="text-center py-8 col-span-full">
              <p className="text-muted-foreground">Loading completed experiments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 col-span-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-8 col-span-full">
              <p className="text-muted-foreground">No completed experiments yet.</p>
            </div>
          ) : (
            experiments.map((exp) => (
              <ExperimentCard key={exp.experiment_id} experiment={exp} hideRanges={true} />
            ))
          )}
          </div>
        </div>
      </section>
    </div>
  );
}
