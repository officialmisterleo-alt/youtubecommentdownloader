'use client'

import { useEffect } from 'react'
import { captureFirstTouch, trackEvent } from '@/lib/analytics'

export default function AttributionTracker() {
  useEffect(() => {
    captureFirstTouch()
    trackEvent('page_context_recorded')
  }, [])

  return null
}
