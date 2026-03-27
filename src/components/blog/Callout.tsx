import { Info, AlertTriangle, Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

type CalloutVariant = 'info' | 'warning' | 'insight'

const variants = {
  info: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/5',
    icon: Info,
    iconColor: 'text-blue-400',
    labelColor: 'text-blue-400',
    label: 'Note',
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/5',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    labelColor: 'text-amber-400',
    label: 'Warning',
  },
  insight: {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/5',
    icon: Lightbulb,
    iconColor: 'text-purple-400',
    labelColor: 'text-purple-400',
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
