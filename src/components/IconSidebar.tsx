'use client'
import type { ComponentType, SVGProps } from 'react'
import type { PanelType } from '@/lib/types'
import { SearchIcon, BookIcon, LeafIcon, CompareIcon, GlyphIcon } from './icons'

interface Props {
  activePanel: PanelType
  onToggle: (panel: PanelType) => void
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>
const ICONS: { panel: PanelType; Icon: IconComponent; label: string }[] = [
  { panel: 'search',   Icon: SearchIcon,  label: '검색' },
  { panel: 'browse',   Icon: BookIcon,    label: '탐독' },
  { panel: 'themes',   Icon: LeafIcon,    label: '묵상' },
  { panel: 'compare',  Icon: CompareIcon, label: '비교' },
  { panel: 'original', Icon: GlyphIcon,   label: '원어' },
]

export default function IconSidebar({ activePanel, onToggle }: Props) {
  return (
    <nav className="hidden md:flex flex-col items-center gap-2 px-1 py-4 w-14
                    border-r border-[var(--clay-border)] bg-[rgba(245,237,224,0.5)]">
      <div className="w-6 h-6 rounded-[var(--radius-pill)] bg-[var(--ink-dark)] flex items-center
                      justify-center text-[var(--hanji-cream)] text-xs mb-1">
        ✦
      </div>
      <div className="w-5 h-px bg-[var(--clay-border)]" />
      {ICONS.map(({ panel, Icon, label }) => (
        <button
          key={panel}
          onClick={() => onToggle(panel)}
          title={label}
          aria-label={label}
          className={`w-10 h-10 rounded-[var(--radius-paper)] flex items-center justify-center
                      transition-colors ${
                        activePanel === panel
                          ? 'bg-[var(--clay-light)] text-[var(--clay)]'
                          : 'text-[var(--ink-medium)] hover:bg-[var(--clay-light)]'
                      }`}
        >
          <Icon width={18} height={18} />
        </button>
      ))}
    </nav>
  )
}
