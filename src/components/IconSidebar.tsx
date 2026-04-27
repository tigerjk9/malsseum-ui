'use client'
import type { PanelType } from '@/lib/types'

interface Props {
  activePanel: PanelType
  onToggle: (panel: PanelType) => void
}

const ICONS: { panel: PanelType; icon: string; label: string }[] = [
  { panel: 'search',   icon: '🔍', label: '검색' },
  { panel: 'browse',   icon: '📖', label: '탐독' },
  { panel: 'themes',   icon: '🌿', label: '묵상' },
  { panel: 'compare',  icon: '⇄',  label: '비교' },
  { panel: 'original', icon: 'α',  label: '원어' },
]

export default function IconSidebar({ activePanel, onToggle }: Props) {
  return (
    <nav className="hidden md:flex flex-col items-center gap-3 px-1 py-4 w-12
                    border-r border-[var(--clay-border)] bg-[rgba(245,237,224,0.5)]">
      <div className="w-6 h-6 rounded-full bg-[var(--ink-dark)] flex items-center
                      justify-center text-[var(--hanji-cream)] text-xs mb-1">
        ✦
      </div>
      <div className="w-5 h-px bg-[var(--clay-border)]" />
      {ICONS.map(({ panel, icon, label }) => (
        <button
          key={panel}
          onClick={() => onToggle(panel)}
          title={label}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
                      transition-colors ${
                        activePanel === panel
                          ? 'bg-[var(--clay-light)] text-[var(--clay)]'
                          : 'text-[var(--ink-medium)] hover:bg-[var(--clay-light)]'
                      }`}
        >
          {icon}
        </button>
      ))}
    </nav>
  )
}
