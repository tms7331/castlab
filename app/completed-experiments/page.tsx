"use client";

import { useEffect, useState } from "react";
import { Event } from "@/lib/supabase/types";
import { NavigationPills } from "@/components/navigation-pills";
import { ExperimentCard } from "@/components/experiment-card";
import { ExperimentCardSkeleton } from "@/components/experiment-card-skeleton";
import { LAYOUT } from "@/lib/constants/layout";
import { cn } from "@/lib/utils";

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
        <div className={cn("relative", LAYOUT.paddingX, "pt-10 md:pt-14 pb-8 md:pb-10")}>
          <div className={cn("mx-auto text-center space-y-4 md:space-y-6", LAYOUT.maxWidth)}>
            <NavigationPills />

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
                <span className="text-primary">Completed</span> Experiments
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-balance">
                The experiments the community funded together—now fully wrapped.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={cn(LAYOUT.paddingX, LAYOUT.sectionY)}>
        <div className={cn("mx-auto", LAYOUT.maxWidth)}>
          <div className={cn("grid grid-cols-1 md:grid-cols-2", LAYOUT.gridGap)}>
          {loading ? (
            <>
              <ExperimentCardSkeleton />
              <ExperimentCardSkeleton />
              <ExperimentCardSkeleton />
            </>
          ) : error ? (
            <div className="col-span-full rounded-lg border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
              <p className="text-lg font-semibold text-foreground mb-1">Couldn&apos;t load completed experiments.</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : experiments.length === 0 ? (
            <div className="col-span-full rounded-lg border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(140,121,255,0.28),transparent_60%),linear-gradient(135deg,rgba(24,6,91,0.1),rgba(30,184,171,0.08))] shadow-[var(--shadow-soft)]">
                <span className="h-2 w-10 rounded-full bg-gradient-to-r from-primary/60 via-primary to-secondary/70" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No completed experiments yet</h3>
              <p className="text-muted-foreground text-sm">Stay tuned—our first finished runs will show up here.</p>
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
