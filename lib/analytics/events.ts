import posthog from 'posthog-js'

// Transaction event types
export type TransactionEventType =
  | 'transaction_approval_started'
  | 'transaction_approval_confirmed'
  | 'transaction_approval_failed'
  | 'transaction_deposit_started'
  | 'transaction_deposit_confirmed'
  | 'transaction_deposit_failed'
  | 'transaction_withdrawal_started'
  | 'transaction_withdrawal_confirmed'
  | 'transaction_withdrawal_failed'
  | 'transaction_claim_started'
  | 'transaction_claim_confirmed'
  | 'transaction_claim_failed'
  | 'transaction_mint_started'
  | 'transaction_mint_confirmed'
  | 'transaction_mint_failed'
  | 'admin_create_experiment_started'
  | 'admin_create_experiment_confirmed'
  | 'admin_create_experiment_failed'
  | 'admin_close_experiment_started'
  | 'admin_close_experiment_confirmed'
  | 'admin_close_experiment_failed'
  | 'admin_withdraw_started'
  | 'admin_withdraw_confirmed'
  | 'admin_withdraw_failed'
  | 'admin_set_outcome_started'
  | 'admin_set_outcome_confirmed'
  | 'admin_set_outcome_failed'

// Base properties for all transaction events
interface BaseTransactionProperties {
  wallet_address?: string
  chain_id?: number
  transaction_hash?: string
  error_message?: string
  error_code?: string
}

// Specific properties for user transactions
interface UserTransactionProperties extends BaseTransactionProperties {
  experiment_id?: number
  experiment_title?: string
  transaction_step?: 'idle' | 'approving' | 'approved' | 'depositing' | 'complete'
}

// Properties for deposit/funding transactions
interface DepositTransactionProperties extends UserTransactionProperties {
  fund_amount_usd?: number
  bet_amount_0_usd?: number
  bet_amount_1_usd?: number
  total_amount_usd?: number
}

// Properties for claim transactions
interface ClaimTransactionProperties extends UserTransactionProperties {
  claim_amount_usd?: number
  winning_position?: number
}

// Properties for admin transactions
interface AdminTransactionProperties extends BaseTransactionProperties {
  experiment_id?: number
  cost_min_wei?: string
  cost_max_wei?: string
  outcome?: number
}

// Union type for all transaction properties
export type TransactionProperties =
  | UserTransactionProperties
  | DepositTransactionProperties
  | ClaimTransactionProperties
  | AdminTransactionProperties

/**
 * Track a transaction event with PostHog
 */
export function trackTransaction(
  event: TransactionEventType,
  properties: TransactionProperties = {}
) {
  // Only track if PostHog is initialized
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  // Add timestamp
  const eventProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }

  console.log(`[PostHog] ${event}:`, eventProperties)
  posthog.capture(event, eventProperties)
}

/**
 * Identify a user by their wallet address
 */
export function identifyUser(walletAddress: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  posthog.identify(walletAddress, properties)
  console.log(`[PostHog] Identified user:`, walletAddress)
}

/**
 * Track a page view
 */
export function trackPageView(path: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  posthog.capture('$pageview', {
    $current_url: path,
    ...properties,
  })
}

/**
 * Reset user identity (on disconnect)
 */
export function resetUser() {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  posthog.reset()
  console.log(`[PostHog] User reset`)
}
