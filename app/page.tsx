"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Event } from "@/lib/supabase/types";

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch events');
        }
        
        setExperiments(result.data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load experiments');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="container mx-auto px-4">
          <h1 className="hero-title">Fund Weird Science</h1>
          <p className="hero-subtitle">
            Real experiments. Real results. Really fun.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#0a3d4d]">Loading experiments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#0a3d4d]">No experiments available yet.</p>
            </div>
          ) : (
            experiments.map((exp) => (
              <Link key={exp.experiment_id} href={`/experiments/${exp.experiment_id}`}>
                <div className="experiment-card hover:scale-[1.02] cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4 flex-grow">
                      {exp.image_url && (
                        <img 
                          src={exp.image_url} 
                          alt={exp.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-[#005577]">
                          {exp.title}
                        </h3>
                        {exp.summary && (
                          <p className="text-sm text-[#0a3d4d]/70 line-clamp-1 mt-1">
                            {exp.summary}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-sm text-[#0a3d4d]">
                        <span className="font-semibold text-[#00a8cc]">
                          ${exp.cost_min || 0} - ${exp.cost_max || 0}
                        </span>
                        <span className="text-[#0a3d4d]/60"> range</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}