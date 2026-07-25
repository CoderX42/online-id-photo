'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type CollapsibleSectionProps = {
  title: React.ReactNode
  summary?: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

export default function CollapsibleSection({ title, summary, open, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="panel-block">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left group"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-sm">{title}</span>
          {!open && summary && (
            <span className="block text-[11px] text-[var(--muted)] mt-0.5 truncate">
              {summary}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-[var(--muted)] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-200',
          open ? 'grid-rows-[1fr] mt-3 opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
