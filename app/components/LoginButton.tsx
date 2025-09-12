'use client';

import { useFarcaster } from '../providers/FarcasterProvider';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LoginButton() {
  const { user, isLoading, login } = useFarcaster();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
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
          @{user.username || `fid:${user.fid}`}
        </span>
      </div>
    );
  }

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