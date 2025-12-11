"use client";

import { NavigationPills } from "@/components/navigation-pills";
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
    <section className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(140,121,255,0.18),transparent_55%)]" aria-hidden />
      <div className={cn("relative", LAYOUT.paddingX, "pt-10 md:pt-14 pb-8 md:pb-10")}>
        <div className={cn("mx-auto text-center space-y-5 md:space-y-7", LAYOUT.maxWidth)}>
          <NavigationPills />

          <div className="space-y-3">
            <div className="mx-auto flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Science, funded boldly
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              Back fearless experiments, then cheer on the results.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
              CastLab is the playful way to fund and bet on science together. Support ideas you love and stay close to every milestone.
            </p>
            <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden />
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
        </div>
      </div>
    </section>
  );
}
