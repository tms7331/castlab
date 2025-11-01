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
        capture_pageview: true, // Auto-capture pageviews
        capture_pageleave: true,
      })

      console.log('[PostHog] Initialized with key:', apiKey.substring(0, 10) + '...')
    } else {
      console.log('[PostHog] Not initialized - missing key or not in browser')
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
