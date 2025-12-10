import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { CHAIN, CONTRACT_ADDRESS } from '@/lib/wagmi/addresses';
import { tokenAmountToUsd } from '@/lib/wagmi/utils';
import CastlabExperimentABI from '@/lib/contracts/CastlabExperiment.json';
import { ServerLogger } from '@/lib/utils/server-logger';

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
async function fetchFarcasterProfileByAddress(address: string, logger: ServerLogger) {
  const startTime = Date.now();

  try {
    logger.info('neynar_fetch_start', 'Fetching Farcaster profile from Neynar', {
      address,
    });

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
      logger.error('neynar_fetch_failed', 'Failed to fetch user data from Neynar', {
        address,
        status: apiResponse.status,
        statusText: apiResponse.statusText,
      });
      return null;
    }

    const data = await apiResponse.json();

    // Neynar returns users by address
    const addressKey = address.toLowerCase();
    const users = data[addressKey] || [];

    if (users.length === 0) {
      logger.warn('neynar_no_user', 'No Farcaster user found for address', {
        address,
      });
      return null;
    }

    // Take the first user (primary account)
    const user = users[0];

    const profile = {
      fid: user.fid,
      username: user.username || null,
      displayName: user.display_name || null,
      pfpUrl: user.pfp_url || null,
      followerCount: user.follower_count || null,
    };

    logger.timing('neynar_fetch_complete', startTime, {
      address,
      fid: profile.fid,
      username: profile.username,
    });

    return profile;
  } catch (error) {
    logger.error('neynar_fetch_error', 'Error fetching Farcaster profile from Neynar', {
      address,
      error: error instanceof Error ? error.message : String(error),
      error_name: error instanceof Error ? error.name : 'Unknown',
    });
    return null;
  }
}

export async function POST(req: NextRequest) {
  const logger = new ServerLogger();
  const requestStartTime = Date.now();

  try {
    logger.info('donation_sync_start', 'Starting donation sync request');

    const body = await req.json();
    const { walletAddress, experimentId } = body;

    logger.debug('donation_sync_input', 'Request body parsed', {
      walletAddress,
      experimentId,
    });

    // Validate required fields
    if (!walletAddress || experimentId === null || experimentId === undefined) {
      logger.warn('donation_sync_validation_failed', 'Missing required fields', {
        walletAddress: !!walletAddress,
        experimentId: experimentId !== null && experimentId !== undefined,
      });
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress and experimentId' },
        { status: 400 }
      );
    }

    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();

    // 1. Query on-chain contract for wallet's position (deposit and bets)
    logger.info('blockchain_query_start', 'Querying user position from blockchain', {
      address: normalizedAddress,
      experimentId,
    });

    const blockchainStartTime = Date.now();
    const userPosition = await viemClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CastlabExperimentABI.abi,
      functionName: 'getUserPosition',
      args: [BigInt(experimentId), normalizedAddress as `0x${string}`],
    });

    // getUserPosition returns [depositAmount, betAmount0, betAmount1]
    const [depositAmount, betAmount0, betAmount1] = userPosition as [bigint, bigint, bigint];

    const totalFundedUsd = tokenAmountToUsd(depositAmount);
    const totalBetUsd = tokenAmountToUsd(betAmount0) + tokenAmountToUsd(betAmount1);

    logger.timing('blockchain_query_complete', blockchainStartTime, {
      address: normalizedAddress,
      experimentId,
      total_funded_usd: totalFundedUsd,
      total_bet_usd: totalBetUsd,
    });

    // 2. Fetch Farcaster profile from Neynar using wallet address
    const profile = await fetchFarcasterProfileByAddress(normalizedAddress, logger);

    if (!profile) {
      // No Farcaster account linked to this wallet
      logger.warn('donation_sync_no_profile', 'No Farcaster profile found for wallet', {
        address: normalizedAddress,
        experimentId,
      });
      return NextResponse.json({
        success: false,
        message: 'No Farcaster profile linked to this wallet address',
      }, { status: 404 });
    }

    // 3. Upsert donation record with verified profile data and on-chain amounts
    logger.info('database_upsert_start', 'Upserting donation record', {
      experimentId,
      fid: profile.fid,
      username: profile.username,
      total_funded_usd: totalFundedUsd,
      total_bet_usd: totalBetUsd,
    });

    const dbStartTime = Date.now();
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
          total_funded_usd: totalFundedUsd,
          total_bet_usd: totalBetUsd,
          last_donation_at: new Date().toISOString(),
        },
        {
          onConflict: 'experiment_id,wallet_address',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('database_upsert_failed', 'Failed to upsert donation record', {
        experimentId,
        fid: profile.fid,
        error_message: error.message,
        error_code: error.code,
        error_details: error.details,
      });
      return NextResponse.json(
        { error: 'Failed to record donation' },
        { status: 500 }
      );
    }

    logger.timing('database_upsert_complete', dbStartTime, {
      experimentId,
      fid: profile.fid,
      donation_id: data.id,
    });

    logger.timing('donation_sync_complete', requestStartTime, {
      experimentId,
      fid: profile.fid,
      total_funded_usd: totalFundedUsd,
      total_bet_usd: totalBetUsd,
    });

    return NextResponse.json({
      success: true,
      donation: data,
    });
  } catch (error) {
    logger.error('donation_sync_error', 'Unexpected error during donation sync', {
      error: error instanceof Error ? error.message : String(error),
      error_name: error instanceof Error ? error.name : 'Unknown',
      error_stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
