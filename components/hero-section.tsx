"use client";

import { NavigationHero } from "@/components/navigation-hero";
import { Button } from "@/components/ui/button";
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from "@/lib/utils";
import { LAYOUT } from "@/lib/constants/layout";

export function HeroSection() {
  const { isInMiniApp } = useAuth();

  const handleCastExperimentIdea = async () => {
    try {
      const appUrl = getAppUrl();

      await sdk.actions.composeCast({
        text: `@motherlizard I have a great experiment idea:`,
        embeds: [appUrl]
      });
    } catch (error) {
      console.error('Failed to compose cast:', error);
    }
  };

  return (
    <NavigationHero>
      <div className="space-y-3">
        <div className="mx-auto flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <span className="inline-flex h-1 w-8 rounded-full bg-gradient-to-r from-primary/10 via-primary/50 to-primary/20" aria-hidden />
          Science, funded boldly
          <span className="inline-flex h-1 w-8 rounded-full bg-gradient-to-r from-secondary/20 via-secondary/60 to-secondary/20" aria-hidden />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
          Fund and bet on science!
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
          CastLab makes funding and betting on science feel intentional.
        </p>
        <div className="mx-auto flex items-center justify-center gap-2 text-primary">
          <span className="h-px w-10 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-primary"></span>
          <span className="h-2 w-2 rounded-full bg-primary"></span>
          <span className="h-px w-10 rounded-full bg-gradient-to-r from-primary to-transparent"></span>
        </div>
      </div>

      <div className="mx-auto flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] border border-border/80">
          <span className="inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden />
          Live experiments with transparent odds
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] border border-border/80">
          <span className="inline-flex h-2 w-2 rounded-full bg-secondary" aria-hidden />
          Built for funding, ready for betting
        </div>
      </div>

      {isInMiniApp && (
        <div className="pt-2">
          <Button
            onClick={handleCastExperimentIdea}
            className="w-full max-w-xs"
          >
            Cast an Experiment Idea
          </Button>
        </div>
      )}
    </NavigationHero>
  );
}
