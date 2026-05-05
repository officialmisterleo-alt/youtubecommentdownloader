import { Suspense } from 'react'
import ToolClientContent from './ToolClientContent'

export default function ToolPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <ToolClientContent />
    </Suspense>
  )
}
