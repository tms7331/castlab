"use client";

import { NavigationPills } from "@/components/navigation-pills";
import { Button } from "@/components/ui/button";
import { sdk } from '@farcaster/miniapp-sdk';

interface HeroSectionProps {
  activeCount: number;
  totalFunded: number;
}

export function HeroSection({ activeCount, totalFunded }: HeroSectionProps) {
  const handleCastExperimentIdea = async () => {
    try {
      const appUrl = window.location.origin;
      
      const result = await sdk.actions.composeCast({
        text: "@motherlizard I have a great experiment idea: ",
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
    <section className="relative overflow-hidden">
      <div className="relative px-4 py-2">
        <div className="max-w-sm mx-auto text-center space-y-4">
          {/* Navigation Pills */}
          <NavigationPills />

          {/* Hero Content */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-balance leading-tight">
              Fund <span className="text-primary">SCIENCE!</span>
            </h1>
            <p className="text-lg text-muted-foreground text-balance">Real experiments. Real results. Real fun.</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 pt-2 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="font-semibold text-foreground">{activeCount}</div>
              <div>Active</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">
                ${totalFunded >= 1000 ? `${(totalFunded / 1000).toFixed(0)}k` : totalFunded.toFixed(0)}
              </div>
              <div>Funded</div>
            </div>
          </div>

          {/* Cast Button */}
          <div className="pt-2">
            <Button 
              onClick={handleCastExperimentIdea}
              className="w-full max-w-xs"
            >
              Cast an Experiment Idea
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}