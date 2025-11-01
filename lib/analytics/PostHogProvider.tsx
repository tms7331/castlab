'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if API key is available
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

    if (apiKey && typeof window !== 'undefined') {
      posthog.init(apiKey, {
        api_host: host,
        person_profiles: 'identified_only', // Only track identified users
        capture_pageview: false, // We'll manually capture pageviews
        capture_pageleave: true,

        // Enable session replay
        session_recording: {
          recordCrossOriginIframes: true,
        },

        // Enable autocapture with web3 specific elements
        autocapture: {
          dom_event_allowlist: ['click', 'change', 'submit'],
          capture_copied_text: true,
        },

        // Enable better error tracking
        capture_performance: true,

        // Privacy settings
        mask_all_text: false, // We want to see error messages
        mask_all_element_attributes: false,

        // Disable in development
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.opt_out_capturing()
          }
        },
      })
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
