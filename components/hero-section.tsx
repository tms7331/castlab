"use client";

import { NavigationPills } from "@/components/navigation-pills";
import { Button } from "@/components/ui/button";
import { sdk } from '@farcaster/miniapp-sdk';
import { getAppUrl } from '@/lib/utils/app-url';
import { useAuth } from '@/app/providers/AuthProvider';

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
      <div className="relative px-4 md:px-6 lg:px-8 py-2 md:py-4">
        <div className="max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
          {/* Navigation Pills */}
          <NavigationPills />

          {/* Hero Content */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              Fund and <span className="text-primary">bet</span> on science!
            </h1>
          </div>

          {/* Cast Button - only shown in Farcaster mini app */}
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
