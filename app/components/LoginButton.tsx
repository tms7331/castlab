'use client';

import { useFarcaster } from '../providers/FarcasterProvider';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LoginButton() {
  const { user, isLoading, login, logout } = useFarcaster();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
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
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {user.displayName || user.username || 'Anonymous'}
            </p>
            <p className="text-xs text-muted-foreground">
              @{user.username || `fid:${user.fid}`}
            </p>
          </div>
        </div>
        <Button 
          onClick={logout}
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
        >
          <span className="text-sm">Logout</span>
        </Button>
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