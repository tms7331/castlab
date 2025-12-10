/**
 * Unified user type that works for both Farcaster mini app and standalone web app modes.
 *
 * In Farcaster: user has fid, username, displayName, pfpUrl from Farcaster context
 * In standalone: user only has address (truncated for display)
 */
export interface UnifiedUser {
  // Always available when authenticated
  address: string;

  // Farcaster-specific (only populated when in mini app)
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

/**
 * Unified auth context type
 */
export interface UnifiedAuthContextType {
  /** The authenticated user, or null if not authenticated */
  user: UnifiedUser | null;

  /** Whether we're currently loading auth state */
  isLoading: boolean;

  /** Whether user is authenticated (has wallet connected) */
  isAuthenticated: boolean;

  /** Whether we're running inside Farcaster mini app */
  isInMiniApp: boolean;

  /** Login function - behavior differs by environment */
  login: () => void;

  /** Logout function */
  logout: () => void;
}

/**
 * Truncate an Ethereum address for display
 * e.g., 0x1234567890abcdef1234567890abcdef12345678 -> 0x1234...5678
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get display name for a user
 * Prefers displayName > username > truncated address
 */
export function getUserDisplayName(user: UnifiedUser | null): string {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  if (user.username) return `@${user.username}`;
  return truncateAddress(user.address);
}
