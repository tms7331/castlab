"use client";

import { useEffect, useState } from "react";
import { Donation } from "@/lib/supabase/types";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sdk } from '@farcaster/miniapp-sdk';

interface TopDonorsProps {
  experimentId: number;
}

export function TopDonors({ experimentId }: TopDonorsProps) {
  const [topDonor, setTopDonor] = useState<Donation | null>(null);
  const [topBettor, setTopBettor] = useState<Donation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTopDonors() {
      setIsLoading(true);
      try {
        // Fetch top donor by amount (only amounts > 0)
        const { data: topDonorData } = await supabase
          .from('donations')
          .select('*')
          .eq('experiment_id', experimentId)
          .gt('total_funded_usd', 0)
          .order('total_funded_usd', { ascending: false })
          .limit(1)
          .single();

        if (topDonorData) {
          setTopDonor(topDonorData);
        }

        // Fetch top bettor by bet amount (only amounts > 0)
        const { data: topBettorData } = await supabase
          .from('donations')
          .select('*')
          .eq('experiment_id', experimentId)
          .gt('total_bet_usd', 0)
          .order('total_bet_usd', { ascending: false })
          .limit(1)
          .single();

        if (topBettorData) {
          setTopBettor(topBettorData);
        }
      } catch (error) {
        console.error('Error fetching top donors:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopDonors();
  }, [experimentId]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  // Don't show if no donors at all
  if (!topDonor && !topBettor) {
    return null;
  }

  const handleViewProfile = (fid: number) => {
    sdk.actions.viewProfile({ fid });
  };

  const formatUsdAmount = (value: number) => {
    if (!Number.isFinite(value)) {
      return String(value ?? "");
    }

    return value.toLocaleString(undefined, {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    });
  };

  return (
    <div className="flex gap-2 text-xs">
      {topDonor && topDonor.total_funded_usd > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md flex-1">
          <Avatar className="w-5 h-5">
            <AvatarImage src={topDonor.pfp_url || undefined} alt={topDonor.display_name || topDonor.username || ''} />
            <AvatarFallback className="text-[8px]">
              {(topDonor.display_name || topDonor.username || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">Biggest Donor</p>
            <button
              onClick={() => handleViewProfile(topDonor.fid)}
              className="block max-w-full break-words text-left font-semibold text-primary hover:underline"
            >
              @{topDonor.username || 'anonymous'}
            </button>
            <span className="mt-0.5 block break-all font-bold text-secondary">
              ${formatUsdAmount(topDonor.total_funded_usd)}
            </span>
          </div>
        </div>
      )}

      {topBettor && topBettor.total_bet_usd > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md flex-1">
          <Avatar className="w-5 h-5">
            <AvatarImage src={topBettor.pfp_url || undefined} alt={topBettor.display_name || topBettor.username || ''} />
            <AvatarFallback className="text-[8px]">
              {(topBettor.display_name || topBettor.username || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">Biggest Bettor</p>
            <button
              onClick={() => handleViewProfile(topBettor.fid)}
              className="block max-w-full break-words text-left font-semibold text-primary hover:underline"
            >
              @{topBettor.username || 'anonymous'}
            </button>
            <span className="mt-0.5 block break-all font-bold text-secondary">
              ${formatUsdAmount(topBettor.total_bet_usd)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
