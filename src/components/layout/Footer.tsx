'use client'

import { usePathname } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'

export default function Footer() {
  const pathname = usePathname()

  // Hide on studio page — it's a fullscreen immersive workspace
  if (pathname === '/studio') return null

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--cream)]">
      <div className="max-w-[1340px] mx-auto py-10 px-5 lg:px-8 flex flex-col sm:flex-row items-center gap-4 text-[13px] text-[var(--ink-muted)]">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)] tracking-tight">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M2 9h4m12 0h4M2 15h4m12 0h4" />
          </svg>
          照见
        </div>
        <span className="sm:ml-auto">让每一张证件照，都合规也好看。</span>
        <span className="flex items-center gap-1.5 sm:ml-8 bg-[var(--olive-light)] text-[var(--olive)] px-3 py-1 rounded-full text-[11px] font-medium">
          <LockKeyhole size={13} />
          所有图像处理均在本地完成
        </span>
      </div>
    </footer>
  )
}
