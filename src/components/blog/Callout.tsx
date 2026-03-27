import { Info, AlertTriangle, Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

type CalloutVariant = 'info' | 'warning' | 'insight'

const variants = {
  info: {
    border: 'border-white/20',
    bg: 'bg-white/5',
    icon: Info,
    iconColor: 'text-white/60',
    labelColor: 'text-white/60',
    label: 'Note',
  },
  warning: {
    border: 'border-red-600/40',
    bg: 'bg-red-600/10',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    labelColor: 'text-red-400',
    label: 'Warning',
  },
  insight: {
    border: 'border-white/30',
    bg: 'bg-white/[0.07]',
    icon: Lightbulb,
    iconColor: 'text-white/70',
    labelColor: 'text-white/70',
    label: 'Insight',
  },
}

export default function Callout({
  variant = 'info',
  title,
  children,
}: {
  variant?: CalloutVariant
  title?: string
  children: ReactNode
}) {
  const v = variants[variant]
  const Icon = v.icon

  return (
    <div
      className={`my-6 flex gap-4 rounded-xl border-l-4 px-5 py-4 ${v.border} ${v.bg}`}
    >
      <Icon className={`mt-0.5 shrink-0 w-5 h-5 ${v.iconColor}`} />
      <div className="text-sm leading-relaxed text-[#c0c0c0]">
        {title && (
          <p className={`font-semibold mb-1 ${v.labelColor}`}>{title}</p>
        )}
        {children}
      </div>
    </div>
  )
}
