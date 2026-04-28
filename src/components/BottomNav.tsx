'use client'
import type { ComponentType, SVGProps } from 'react'
import type { PanelType } from '@/lib/types'
import { ChatIcon, SearchIcon, BookIcon, LeafIcon, QuestionIcon } from './icons'

interface Props {
  activePanel: PanelType
  onToggle: (panel: PanelType) => void
  onHome: () => void
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>
type NavTab =
  | { id: 'home'; label: string; Icon: IconComponent }
  | { id: Exclude<PanelType, 'none' | 'compare' | 'original' | 'history'>; label: string; Icon: IconComponent }

const TABS: NavTab[] = [
  { id: 'home',   label: '채팅', Icon: ChatIcon },
  { id: 'search', label: '검색', Icon: SearchIcon },
  { id: 'browse', label: '탐독', Icon: BookIcon },
  { id: 'themes', label: '묵상', Icon: LeafIcon },
  { id: 'help',   label: '도움말', Icon: QuestionIcon },
]

export default function BottomNav({ activePanel, onToggle, onHome }: Props) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30
                 bg-[var(--hanji-cream)]/90 backdrop-blur-md
                 border-t border-[var(--clay-border)]/60
                 flex justify-around items-center h-14
                 safe-area-inset-bottom"
      aria-label="하단 탭 네비게이션"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === 'home'
          ? activePanel === 'none'
          : activePanel === tab.id
        const handleClick = () =>
          tab.id === 'home' ? onHome() : onToggle(tab.id)
        const Icon = tab.Icon
        return (
          <button
            key={tab.id}
            onClick={handleClick}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            className={`flex flex-col items-center gap-0.5 px-3 py-2
                        text-[0.65rem] tracking-wide transition-all duration-150 min-w-16
                        ${isActive
                          ? 'text-[var(--clay)]'
                          : 'text-[var(--ink-medium)]/60 hover:text-[var(--ink-medium)]'
                        }`}
          >
            <div className="relative">
              <Icon width={20} height={20} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2
                                 w-1 h-1 rounded-full bg-[var(--clay)]" />
              )}
            </div>
            <span className="mt-1">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
