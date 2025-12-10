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
      <div className="relative px-4 py-2">
        <div className="max-w-sm mx-auto text-center space-y-4">
          {/* Navigation Pills */}
          <NavigationPills />

          {/* Hero Content */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-balance leading-tight">
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
