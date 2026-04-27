'use client'
import type { PanelType } from '@/lib/types'

interface Props {
  activePanel: PanelType
  onToggle: (panel: PanelType) => void
  onHome: () => void
}

type NavTab =
  | { id: 'home'; label: string; icon: string }
  | { id: Exclude<PanelType, 'none' | 'compare' | 'original'>; label: string; icon: string }

const TABS: NavTab[] = [
  { id: 'home', label: '채팅', icon: '💬' },
  { id: 'search', label: '검색', icon: '🔍' },
  { id: 'browse', label: '탐독', icon: '📖' },
  { id: 'themes', label: '묵상', icon: '🌿' },
]

export default function BottomNav({ activePanel, onToggle, onHome }: Props) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30
                 bg-[var(--paper-white)] border-t border-[var(--clay-border)]
                 flex justify-around items-center h-14"
      aria-label="하단 탭 네비게이션"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === 'home'
          ? activePanel === 'none'
          : activePanel === tab.id
        const handleClick = () =>
          tab.id === 'home' ? onHome() : onToggle(tab.id)
        return (
          <button
            key={tab.id}
            onClick={handleClick}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            className={`flex flex-col items-center gap-0.5 px-3 py-1
                        text-[0.7rem] transition-colors min-w-16
                        ${isActive ? 'text-[var(--clay)]' : 'text-[var(--ink-medium)]'}`}
          >
            <span className="text-base" aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
