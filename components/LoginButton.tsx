'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { truncateAddress } from '@/lib/auth/types';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function LoginButton() {
  const { user, isLoading, isInMiniApp, login } = useAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  // If user is authenticated
  if (user) {
    // In Farcaster with full profile
    if (isInMiniApp && user.fid) {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={user.pfpUrl || "/scientist-profile.png"}
              alt={user.displayName || user.username || 'Profile'}
            />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {(user.displayName || user.username || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">
            {user.username ? `@${user.username}` : `fid:${user.fid}`}
          </span>
        </div>
      );
    }

    // Wallet-only user (standalone mode) - use RainbowKit's account button for disconnect
    return (
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal }) => (
          <div className="flex items-center gap-2">
            {/* Chain indicator - click to switch */}
            {chain && (
              <button
                onClick={openChainModal}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors"
                title="Switch network"
              >
                {chain.hasIcon && chain.iconUrl && (
                  <img
                    src={chain.iconUrl}
                    alt={chain.name ?? 'Chain'}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                {chain.unsupported && (
                  <span className="text-red-500">Wrong network</span>
                )}
              </button>
            )}
            {/* Account button - click to open account modal (disconnect, etc.) */}
            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="Account settings"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                  {account?.address?.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">
                {account?.displayName || truncateAddress(account?.address || '')}
              </span>
            </button>
          </div>
        )}
      </ConnectButton.Custom>
    );
  }

  // Not authenticated - show login button
  if (isInMiniApp) {
    // In Farcaster, show simple login button
    return (
      <Button
        onClick={login}
        variant="secondary"
        size="sm"
      >
        Login with Farcaster
      </Button>
    );
  }

  // Outside Farcaster, show RainbowKit connect button
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, connectModalOpen }) => (
        <Button
          onClick={openConnectModal}
          variant="secondary"
          size="sm"
          disabled={connectModalOpen}
        >
          Connect Wallet
        </Button>
      )}
    </ConnectButton.Custom>
  );
}