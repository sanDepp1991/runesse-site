'use client'
import React from 'react'
import { Sparkles } from 'lucide-react'

export function classNames(...c: (string|false|undefined)[]) { return c.filter(Boolean).join(' ') }

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur">
      {children}
    </span>
  )
}

export function Nav({ active, onSet }: { active: 'landing' | 'demo', onSet?: (t: 'landing'|'demo') => void }) {
  return (
    <div className="w-full sticky top-0 z-30 border-b border-zinc-800/60 bg-[#0b0d12]/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400" />
            <div className="text-white font-semibold tracking-tight">Runesse</div>
            <span className="ml-3 hidden text-xs text-white/60 sm:inline">Unlock every card offer</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className={classNames('rounded-xl px-3 py-1.5 text-sm', active==='landing' ? 'bg-white text-zinc-900' : 'text-white/80 hover:text-white hover:bg-white/10')}>Landing</a>
            <a href="/demo" className={classNames('rounded-xl px-3 py-1.5 text-sm', active==='demo' ? 'bg-white text-zinc-900' : 'text-white/80 hover:text-white hover:bg-white/10')}>Demo</a>
            <a href="/#join" className="ml-2 hidden rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 sm:inline-flex items-center gap-1">
              <Sparkles size={16} /> Join waitlist
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0d12]">
      <div className="mx-auto max-w-7xl px-4 py-10 text-white/70">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400" />
            <span className="text-white">Runesse</span>
            <span className="ml-2 text-xs">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="mailto:founder@runesse.in" className="hover:text-white">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
