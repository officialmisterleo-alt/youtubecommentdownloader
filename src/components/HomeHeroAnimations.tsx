'use client'
import { useState, useEffect, useLayoutEffect } from 'react'
import HeroInput from '@/components/HeroInput'
import { motion, useReducedMotion } from 'framer-motion'

const useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function HomeHeroAnimations() {
  const prefersReducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(true)

  useSafeLayoutEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  const skipEntrance = isMobile || !!prefersReducedMotion

  return (
    <>
      <motion.span
        key={`badge-${skipEntrance}`}
        className="relative z-10 bg-red-600/15 border border-red-500/40 rounded-full px-3 py-1 text-sm mb-6 inline-block"
        initial={skipEntrance ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: skipEntrance ? 0 : 0.5, ease: 'easeOut', delay: 0 }}
      >
        <span className="text-red-500 font-semibold">New:</span>
        <span className="text-red-400/80"> AI Sentiment Analysis</span>
      </motion.span>

      <motion.h1
        key={`h1-${skipEntrance}`}
        className="relative z-10 font-jakarta text-5xl md:text-7xl font-bold text-[#e5e2e1] leading-[1.05] tracking-tight max-w-4xl mb-6"
        initial={skipEntrance ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: skipEntrance ? 0 : 0.5, ease: 'easeOut', delay: skipEntrance ? 0 : 0.1 }}
      >
        YouTube Comment<br />
        <span className="text-white/90">Downloader</span>
      </motion.h1>

      <motion.p
        key={`sub-${skipEntrance}`}
        className="relative z-10 text-[#e5e2e1]/70 text-lg md:text-xl max-w-xl mb-10 leading-relaxed"
        initial={skipEntrance ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: skipEntrance ? 0 : 0.5, ease: 'easeOut', delay: skipEntrance ? 0 : 0.2 }}
      >
        Download comments from YouTube videos and Shorts, or export across playlists and channels on Business or Enterprise. Choose CSV, Excel, JSON, TXT, or HTML for research and reporting.
      </motion.p>

      <motion.div
        key={`cta-${skipEntrance}`}
        className="relative z-10 w-full max-w-2xl"
        initial={skipEntrance ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: skipEntrance ? 0 : 0.5, ease: 'easeOut', delay: skipEntrance ? 0 : 0.3 }}
      >
        <HeroInput />
      </motion.div>
    </>
  )
}
