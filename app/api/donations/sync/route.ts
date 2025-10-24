import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { CHAIN, CONTRACT_ADDRESS } from '@/lib/wagmi/addresses';
import { tokenAmountToUsd } from '@/lib/wagmi/config';
import CastlabExperimentABI from '@/lib/contracts/CastlabExperiment.json';

// Create Supabase client with service role for write operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Create Viem client for on-chain queries
const viemClient = createPublicClient({
  chain: CHAIN,
  transport: http(),
});

// Neynar API key
const neynarApiKey = process.env.NEYNAR_API_KEY!;

// Fetch user profile data from Neynar by wallet address
async function fetchFarcasterProfileByAddress(address: string) {
  try {
    // Construct URL with query params
    const url = new URL('https://api.neynar.com/v2/farcaster/user/bulk-by-address');
    url.searchParams.append('addresses', address);

    const apiResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': neynarApiKey,
      },
    });

    if (!apiResponse.ok) {
      console.error('Failed to fetch user data from Neynar');
      return null;
    }

    const data = await apiResponse.json();

    // Neynar returns users by address
    const addressKey = address.toLowerCase();
    const users = data[addressKey] || [];

    if (users.length === 0) {
      console.log('No Farcaster user found for address:', address);
      return null;
    }

    // Take the first user (primary account)
    const user = users[0];

    return {
      fid: user.fid,
      username: user.username || null,
      displayName: user.display_name || null,
      pfpUrl: user.pfp_url || null,
      followerCount: user.follower_count || null,
    };
  } catch (error) {
    console.error('Error fetching Farcaster profile from Neynar:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, experimentId } = body;

    // Validate required fields
    if (!walletAddress || !experimentId) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress and experimentId' },
        { status: 400 }
      );
    }

    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();

    // 1. Query on-chain contract for wallet's actual deposit amount
    const depositAmount = await viemClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CastlabExperimentABI.abi,
      functionName: 'getUserDeposit',
      args: [BigInt(experimentId), normalizedAddress as `0x${string}`],
    });

    const totalAmountUsd = tokenAmountToUsd(depositAmount as bigint);

    // 2. Fetch Farcaster profile from Neynar using wallet address
    const profile = await fetchFarcasterProfileByAddress(normalizedAddress);

    if (!profile) {
      // No Farcaster account linked to this wallet
      console.log('No Farcaster profile found for wallet:', normalizedAddress);
      return NextResponse.json({
        success: false,
        message: 'No Farcaster profile linked to this wallet address',
      }, { status: 404 });
    }

    // 3. Upsert donation record with verified profile data and on-chain amount
    const { data, error } = await supabaseAdmin
      .from('donations')
      .upsert(
        {
          experiment_id: experimentId,
          fid: profile.fid,
          username: profile.username,
          display_name: profile.displayName,
          pfp_url: profile.pfpUrl,
          follower_count: profile.followerCount,
          wallet_address: normalizedAddress,
          total_amount_usd: totalAmountUsd,
          last_donation_at: new Date().toISOString(),
        },
        {
          onConflict: 'experiment_id,wallet_address',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to record donation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      donation: data,
    });
  } catch (error) {
    console.error('Donation sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
