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
import CastlabExperimentABI from '@/lib/contracts/CastlabExperiment.json';
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';
import { TopDonors } from './top-donors';

interface ExperimentCardProps {
  experiment: Event;
  userContribution?: number;
  userBet0?: number;
  userBet1?: number;
  hideRanges?: boolean;
}

export function ExperimentCard({ experiment, userContribution = 0, userBet0 = 0, userBet1 = 0, hideRanges = false }: ExperimentCardProps) {
  // Read experiment data from smart contract - now includes bet amounts
  const { data: contractData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CastlabExperimentABI.abi,
    functionName: 'getExperimentInfo',
    args: [BigInt(experiment.experiment_id)],
    chainId: CHAIN.id,
  });

  // Extract data from contract - new structure includes bet amounts
  type ExperimentInfo = readonly [bigint, bigint, bigint, bigint, bigint, boolean];
  const totalDepositedTokens = contractData ? (contractData as ExperimentInfo)[2] : BigInt(0);
  const totalBet0Tokens = contractData ? (contractData as ExperimentInfo)[3] : BigInt(0);
  const totalBet1Tokens = contractData ? (contractData as ExperimentInfo)[4] : BigInt(0);

  const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
  const totalBet0USD = tokenAmountToUsd(totalBet0Tokens);
  const totalBet1USD = tokenAmountToUsd(totalBet1Tokens);
  const fundingGoal = experiment.cost_min || 1;
  const fundingProgress = Math.min((totalDepositedUSD / fundingGoal) * 100, 100);

  // Calculate odds (percentage of total bets for outcome 0)
  const totalBetsUSD = totalBet0USD + totalBet1USD;
  const oddsPercentage = totalBetsUSD > 0 ? Math.round((totalBet0USD / totalBetsUSD) * 100) : 50;

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
                <span className="font-medium text-black">
                  ${totalDepositedUSD.toLocaleString()} raised of ${fundingGoal.toLocaleString()}
                </span>
              </div>
              <Progress value={fundingProgress} className="h-2 bg-muted" />
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-black">Current odds</span>
                  <span className="font-medium text-black">{oddsPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={oddsPercentage}
                  onChange={() => {}}
                  className="w-full accent-primary cursor-default"
                  aria-readonly
                />
              </div>
            </div>
          )}

          {/* Top Donors Leaderboard */}
          {!hideRanges && (
            <TopDonors experimentId={experiment.experiment_id} />
          )}

          {(userContribution > 0 || userBet0 > 0 || userBet1 > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-black">Your Activity</span>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  {userContribution > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-black/70">Funded:</span>
                      <span className="font-semibold text-secondary">${userContribution}</span>
                    </div>
                  )}
                  {(userBet0 > 0 || userBet1 > 0) && (
                    <div className="flex items-center gap-3">
                      {userBet0 > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-black/70">{experiment.outcome_text0}:</span>
                          <span className="font-semibold text-secondary">${userBet0}</span>
                        </div>
                      )}
                      {userBet1 > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-black/70">{experiment.outcome_text1}:</span>
                          <span className="font-semibold text-secondary">${userBet1}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
