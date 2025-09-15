'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AddToFarcasterPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasBeenPrompted, setHasBeenPrompted] = useState(false);

  useEffect(() => {
    // Check if user has already been prompted (store in localStorage)
    const prompted = localStorage.getItem('farcaster-add-prompted');
    if (!prompted) {
      // Show prompt after a short delay to not be too aggressive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setHasBeenPrompted(true);
    }
  }, []);

  const handleAddToFarcaster = async () => {
    try {
      // This will only work in production on the actual domain
      await sdk.actions.addMiniApp();

      // Mark as prompted so we don't show again
      localStorage.setItem('farcaster-add-prompted', 'true');
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to add mini app:', error);
      // Still mark as prompted even if it fails
      localStorage.setItem('farcaster-add-prompted', 'true');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('farcaster-add-prompted', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || hasBeenPrompted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold">Add CastLab to Farcaster</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Add CastLab for quick access
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAddToFarcaster}
              className="w-full"
            >
              Add to Farcaster
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}