"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Event } from "@/lib/supabase/types";
import Image from "next/image";
import Link from "next/link";
import { useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, tokenAmountToUsd } from '@/lib/wagmi/config';
import ExperimentFundingABI from '@/lib/contracts/ExperimentFunding.json';
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';

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
    chainId: baseSepolia.id,
  });

  // Extract totalDeposited from contract data
  type ExperimentInfo = readonly [bigint, bigint, bigint, boolean];
  const totalDepositedTokens = contractData ? (contractData as ExperimentInfo)[2] : BigInt(0);
  const totalDepositedUSD = tokenAmountToUsd(totalDepositedTokens);
  const fundingGoal = experiment.cost_max || 1;
  const fundingProgress = Math.min((totalDepositedUSD / fundingGoal) * 100, 100);

  const handleCastAboutThis = async () => {
    try {
      const appUrl = `${getAppUrl()}/experiments/${experiment?.experiment_id}`;

      const result = await sdk.actions.composeCast({
        text: `Check out this CastLab experiment: "${experiment.title} ${appUrl}" 🧪🔬`,
        embeds: [appUrl]
      });

      if (result?.cast) {
        console.log('Cast successful:', result.cast.hash);
      }
    } catch (error) {
      console.error('Failed to compose cast:', error);
    }
  };

  return (
    <Card className="hover-lift border-border/30 bg-card/40 bg-white/50 dark:bg-black/30 backdrop-blur-lg opacity-85 transition-all hover:shadow-lg">
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
              <h3 className="font-semibold text-base text-balance leading-tight text-foreground hover:text-primary transition-colors cursor-pointer">
                {experiment.title}
              </h3>
            </Link>
            {experiment.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{fundingProgress.toFixed(1)}%</span>
              </div>
              <Progress value={fundingProgress} className="h-2 bg-muted" />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>${totalDepositedUSD.toLocaleString()} raised</span>
                <span>${fundingGoal.toLocaleString()} goal</span>
              </div>
            </div>
          )}

          {/* Funding Range & User Contribution */}
          {!hideRanges ? (
            <div className="flex items-center justify-between p-3 bg-white/40 dark:bg-black/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Funding Range</p>
                <p className="font-semibold text-primary">
                  ${experiment.cost_min || 0} - ${experiment.cost_max || 0}
                </p>
              </div>
              {userContribution > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">You contributed</p>
                  <p className="font-semibold text-secondary">${userContribution}</p>
                </div>
              )}
            </div>
          ) : (
            userContribution > 0 && (
              <div className="p-3 bg-white/40 dark:bg-black/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">You contributed</p>
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
