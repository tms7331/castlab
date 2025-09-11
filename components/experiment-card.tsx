"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Event } from "@/lib/supabase/types";

interface ExperimentCardProps {
  experiment: Event;
  userContribution?: number;
  hideRanges?: boolean;
}

export function ExperimentCard({ experiment, userContribution = 0, hideRanges = false }: ExperimentCardProps) {
  const currentFunding = experiment.current_funding || 0;
  const fundingGoal = experiment.cost_max || 1;
  const fundingProgress = (currentFunding / fundingGoal) * 100;

  return (
    <Card className="hover-lift border-border/50 bg-card/95 backdrop-blur-sm transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {experiment.image_url && (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-lg bg-card flex items-center justify-center overflow-hidden">
                <img 
                  src={experiment.image_url} 
                  alt={experiment.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {experiment.status === 'active' && (
              <Badge variant="secondary" className="mb-2 text-xs">
                🔬 Active
              </Badge>
            )}
            <h3 className="font-semibold text-base text-balance leading-tight text-foreground">
              {experiment.title}
            </h3>
            {experiment.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {experiment.summary}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{fundingProgress.toFixed(1)}%</span>
          </div>
          <Progress value={fundingProgress} className="h-2 bg-muted" />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>${currentFunding.toLocaleString()} raised</span>
            <span>${fundingGoal.toLocaleString()} goal</span>
          </div>
        </div>

        {/* Funding Range & User Contribution */}
        {!hideRanges ? (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">You contributed</p>
              <p className="font-semibold text-secondary">${userContribution}</p>
            </div>
          )
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/experiments/${experiment.experiment_id}`}>
            View Details
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          Cast About This
        </Button>
      </CardFooter>
    </Card>
  );
}