"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Event } from "@/lib/supabase/types";
import Image from "next/image";
import Link from "next/link";
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import { CHAIN } from '@/lib/wagmi/addresses';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';
import { TopDonors } from './top-donors';

const MOTHERLIZARD_FID = 883930;

interface ExperimentCardProps {
  experiment: Event;
  userContribution?: number;
  hideRanges?: boolean;
}

export function ExperimentCard({ experiment, userContribution = 0, hideRanges = false }: ExperimentCardProps) {
  // Read experiment data from smart contract
  const { data: contractData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ExperimentFundingABI.abi,
    functionName: 'getExperimentInfo',
    args: [BigInt(experiment.experiment_id)],
    chainId: CHAIN.id,
  });

  // Extract totalDeposited from contract data
  type ExperimentInfo = readonly [bigint, bigint, bigint, boolean];
  const totalDepositedTokens = contractData ? (contractData as ExperimentInfo)[2] : BigInt(0);
  const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
  const fundingGoal = experiment.cost_min || 1;
  const fundingProgress = Math.min((totalDepositedUSD / fundingGoal) * 100, 100);

  const handleCastAboutThis = async () => {
    try {
      const appUrl = `${getAppUrl()}/experiments/${experiment?.experiment_id}`;
      await sdk.actions.composeCast({
        text: `Check out this CastLab experiment: "${experiment.title}" 🧪🔬`,
        embeds: [appUrl]
      });
    } catch (error) {
      console.error('Failed to compose cast:', error);
    }
  };

  return (
    <Card className="hover-lift border-border/20 bg-white/5 dark:bg-black/5 backdrop-blur-sm transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {experiment.image_url && (
            <div className="w-[45%] aspect-square rounded-lg bg-gradient-to-br from-primary to-secondary p-0.5 flex-shrink-0">
              <div className="relative w-full h-full rounded-lg bg-card overflow-hidden">
                <Image
                  src={experiment.image_url}
                  alt={experiment.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 45vw, 200px"
                  priority
                />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link href={`/experiments/${experiment.experiment_id}`}>
              <h3 className="font-semibold text-base text-balance leading-tight text-black hover:text-primary transition-colors cursor-pointer">
                {experiment.title}
              </h3>
            </Link>
            {experiment.summary && (
              <p className="text-xs text-black mt-1 line-clamp-2">
                {experiment.summary}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {(!hideRanges || userContribution > 0) && (
        <CardContent className="space-y-4">
          {/* Funding Progress - only show if not hiding ranges */}
          {!hideRanges && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-black">Progress</span>
                <span className="font-medium text-black">{fundingProgress.toFixed(1)}%</span>
              </div>
              <Progress value={fundingProgress} className="h-2 bg-muted" />
              <div className="flex justify-between items-center text-xs text-black">
                <span>${totalDepositedUSD.toLocaleString()} raised</span>
                <span>${fundingGoal.toLocaleString()} goal</span>
              </div>
            </div>
          )}

          {/* Top Donors Leaderboard */}
          {!hideRanges && (
            <TopDonors experimentId={experiment.experiment_id} />
          )}

          {/* Experimenter, Deadline & User Contribution */}
          {!hideRanges ? (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-black">Experimenter</p>
                <button
                  className="font-semibold text-primary hover:underline text-left"
                  onClick={() => {
                    sdk.actions.viewProfile({ fid: MOTHERLIZARD_FID });
                  }}
                >
                  @motherlizard
                </button>
              </div>
              <div className="text-center">
                <p className="text-xs text-black">Deadline</p>
                <p className="font-semibold text-black">
                  {new Date(experiment.date_funding_deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              {userContribution > 0 && (
                <div className="text-right">
                  <p className="text-xs text-black">You contributed</p>
                  <p className="font-semibold text-secondary">${userContribution}</p>
                </div>
              )}
            </div>
          ) : (
            userContribution > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-black">You contributed</p>
                <p className="font-semibold text-secondary">${userContribution}</p>
              </div>
            )
          )}
        </CardContent>
      )}

      <CardFooter className="flex gap-2 pt-0">
        <Button
          size="sm"
          className="flex-1"
          asChild
        >
          <Link href={`/experiments/${experiment.experiment_id}`}>
            View Details
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleCastAboutThis}
        >
          Cast About This
        </Button>
      </CardFooter>
    </Card>
  );
}
