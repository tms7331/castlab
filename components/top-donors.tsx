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
  const [topInfluencer, setTopInfluencer] = useState<Donation | null>(null);
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
          .gt('total_amount_usd', 0)
          .order('total_amount_usd', { ascending: false })
          .limit(1)
          .single();

        if (topDonorData) {
          setTopDonor(topDonorData);
        }

        // Fetch top influencer (most followers, only with donations > 0)
        const { data: topInfluencerData } = await supabase
          .from('donations')
          .select('*')
          .eq('experiment_id', experimentId)
          .gt('total_amount_usd', 0)
          .not('follower_count', 'is', null)
          .order('follower_count', { ascending: false })
          .limit(1)
          .single();

        if (topInfluencerData) {
          setTopInfluencer(topInfluencerData);
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
  if (!topDonor && !topInfluencer) {
    return null;
  }

  const handleViewProfile = (fid: number) => {
    sdk.actions.viewProfile({ fid });
  };

  return (
    <div className="flex gap-2 text-xs">
      {topDonor && topDonor.total_amount_usd > 0 && (
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
              className="font-semibold text-primary hover:underline truncate block max-w-full text-left"
            >
              @{topDonor.username || 'anonymous'}
            </button>
          </div>
          <span className="font-bold text-secondary whitespace-nowrap">${topDonor.total_amount_usd}</span>
        </div>
      )}

      {topInfluencer && topInfluencer.follower_count !== null && topInfluencer.follower_count > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md flex-1">
          <Avatar className="w-5 h-5">
            <AvatarImage src={topInfluencer.pfp_url || undefined} alt={topInfluencer.display_name || topInfluencer.username || ''} />
            <AvatarFallback className="text-[8px]">
              {(topInfluencer.display_name || topInfluencer.username || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">Popular Donor</p>
            <button
              onClick={() => handleViewProfile(topInfluencer.fid)}
              className="font-semibold text-primary hover:underline truncate block max-w-full text-left"
            >
              @{topInfluencer.username || 'anonymous'}
            </button>
          </div>
          <span className="font-bold text-secondary whitespace-nowrap">${topInfluencer.total_amount_usd}</span>
        </div>
      )}
    </div>
  );
}
