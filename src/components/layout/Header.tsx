'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/studio', label: '在线制作' },
  { href: '/sizes', label: '尺寸大全' },
  { href: '/guide', label: '拍摄指南' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-[var(--paper)]/85 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-[1340px] mx-auto h-16 px-5 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group"
          aria-label="照见首页"
        >
          <span className="w-9 h-9 grid place-items-center bg-[var(--terracotta)] text-white rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M2 9h4m12 0h4M2 15h4m12 0h4" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-[var(--ink)]">
            照见
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1" aria-label="主导航">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-4 py-2 text-[13px] font-medium rounded-xl transition-all',
                pathname === link.href
                  ? 'text-[var(--terracotta)] bg-[var(--terracotta-light)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border-light)]',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Privacy badge */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--olive-light)] text-[var(--olive)] rounded-full text-[11px] font-semibold">
          <LockKeyhole size={13} />
          本机处理
        </span>
      </div>
    </header>
  )
}
