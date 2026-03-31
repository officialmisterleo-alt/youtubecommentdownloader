'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MessageSquare, Download, CheckCircle } from 'lucide-react'

const steps = [
  { title: 'Paste your YouTube URL',  desc: 'Drop in any video link' },
  { title: 'Choose your format',      desc: 'CSV, JSON, TXT, HTML, or Excel' },
  { title: 'Data ingestion',          desc: 'We pull every comment at full speed' },
  { title: 'Download instantly',      desc: 'Your file is ready in seconds' },
]

const formats = ['CSV', 'JSON', 'TXT', 'HTML', 'Excel']

function StepScanVisualizer() {
  const widths = ['w-full', 'w-3/4', 'w-5/6', 'w-2/3']
  const prefersReducedMotion = useReducedMotion()
  return (
    <div className="w-full space-y-3 px-2">
      {widths.map((w, i) => (
        <motion.div
          key={i}
          className={`${w} h-4 bg-white/10 rounded-full`}
          animate={prefersReducedMotion ? {} : { opacity: [0.3, 1, 0.3], scale: [1, 1.02, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function StepFormatVisualizer() {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {formats.map((fmt, i) => (
        <motion.div
          key={fmt}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-[#e5e2e1] font-medium"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: i * 0.08 }}
        >
          {fmt}
        </motion.div>
      ))}
    </div>
  )
}

function StepIngestionVisualizer() {
  const count = 12
  const radius = 90
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="relative w-48 h-48 mx-auto">
      {!prefersReducedMotion && Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 2 * Math.PI
        const startX = Math.cos(angle) * radius
        const startY = Math.sin(angle) * radius
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 text-red-400"
            style={{ translateX: '-50%', translateY: '-50%' }}
            initial={{ x: startX, y: startY, opacity: 1 }}
            animate={{ x: 0, y: 0, opacity: 0 }}
            transition={{
              duration: 1.2,
              ease: 'circIn',
              delay: i * 0.08,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            <MessageSquare size={12} />
          </motion.div>
        )
      })}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Separate glow overlay — opacity-only animation avoids repainting box-shadow each frame */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full shadow-[0_0_30px_10px_rgba(220,38,38,0.3)]"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <motion.div
            className="absolute inset-0 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center"
            animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Download size={20} className="text-red-400" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StepSuccessVisualizer() {
  return (
    <motion.div
      className="w-full rounded-xl border border-emerald-500/30 bg-emerald-600/20 flex flex-col items-center justify-center gap-3 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
      >
        <CheckCircle size={40} className="text-emerald-400" />
      </motion.div>
      <p className="text-white font-semibold text-base">Ready to download</p>
      <p className="text-emerald-300/70 text-sm">Your file is waiting</p>
    </motion.div>
  )
}

const visualizers = [
  <StepScanVisualizer key="scan" />,
  <StepFormatVisualizer key="format" />,
  <StepIngestionVisualizer key="ingest" />,
  <StepSuccessVisualizer key="success" />,
]

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep(s => (s + 1) % 4)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="py-16 px-6 border-t border-white/[0.07]">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1] mb-10">
          From URL to insights in 3 steps
        </h2>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          {/* Left — steps list */}
          <div className="space-y-6">
            {steps.map((step, i) => {
              const isActive = i === activeStep
              return (
                <motion.div
                  key={i}
                  className="flex gap-4 items-start cursor-pointer"
                  animate={{ opacity: isActive ? 1 : 0.4, x: prefersReducedMotion ? 0 : (isActive ? 10 : 0) }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
                  onClick={() => setActiveStep(i)}
                >
                  <span
                    className={`text-3xl font-bold leading-none w-8 shrink-0 tabular-nums transition-colors ${
                      isActive ? 'text-red-500' : 'text-white/20'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-0.5">
                    <p className={`font-jakarta font-semibold text-sm transition-colors ${isActive ? 'text-red-400' : 'text-[#e5e2e1]'}`}>{step.title}</p>
                    <p className="text-[#555555] text-xs mt-0.5">{step.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Center — progress rail */}
          <div className="hidden md:flex flex-col items-center self-stretch py-2">
            <div className="relative bg-white/10 w-0.5 flex-1 rounded-full overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 w-full bg-red-500 rounded-full"
                animate={{ scaleY: (activeStep + 1) / 4 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeInOut' }}
                style={{ originY: 0, height: '100%' }}
              />
            </div>
          </div>

          {/* Right — visualizer */}
          <div className="flex items-center justify-center min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                className="w-full"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
              >
                {visualizers[activeStep]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
