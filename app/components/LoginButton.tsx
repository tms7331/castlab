'use client';

import { useFarcaster } from '../providers/FarcasterProvider';

export default function LoginButton() {
  const { user, isLoading, login, logout } = useFarcaster();

  if (isLoading) {
    return (
      <button className="nav-link opacity-50 cursor-wait">
        Loading...
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-[#004466]/30 px-3 py-1.5 rounded-lg">
        {user.pfpUrl && (
          <img 
            src={user.pfpUrl} 
            alt={user.displayName || user.username || 'Profile'} 
            className="w-8 h-8 rounded-full border-2 border-[#a8e6f0]/50"
          />
        )}
        <div className="flex flex-col">
          <span className="text-[#a8e6f0] text-sm font-semibold">
            {user.displayName || user.username || 'Anonymous'}
          </span>
          <span className="text-[#a8e6f0]/70 text-xs">
            @{user.username || `fid:${user.fid}`}
          </span>
        </div>
        <button 
          onClick={logout}
          className="ml-2 text-[#a8e6f0]/80 hover:text-[#a8e6f0] text-xs"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={login}
      className="nav-link bg-[#007799]/20 hover:bg-[#007799]/30 px-3 py-1 rounded-lg"
    >
      Login with Farcaster
    </button>
  );
}