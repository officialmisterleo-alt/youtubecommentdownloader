'use client'

import { track } from '@vercel/analytics'

type Attribution = {
  landing_page: string
  referrer: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string
  utm_content: string
}

type EventProperties = Record<string, string | number | boolean | null | undefined>

const ATTRIBUTION_KEY = 'ycd_first_touch'

function readAttribution(): Partial<Attribution> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY)
    return raw ? JSON.parse(raw) as Partial<Attribution> : {}
  } catch {
    return {}
  }
}

export function captureFirstTouch() {
  if (typeof window === 'undefined') return

  try {
    if (window.localStorage.getItem(ATTRIBUTION_KEY)) return

    const params = new URLSearchParams(window.location.search)
    const attribution: Attribution = {
      landing_page: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || 'direct',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || '',
    }

    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution))
  } catch {
    // Attribution is helpful, but it should never block the app.
  }
}

export function trackEvent(name: string, properties: EventProperties = {}) {
  if (typeof window === 'undefined') return

  try {
    const attribution = readAttribution()
    track(name, {
      path: window.location.pathname,
      ...attribution,
      ...properties,
    })
  } catch {
    // Analytics failures should stay invisible to users.
  }
}
