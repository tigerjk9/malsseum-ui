'use client'
import type { VerseData, PanelType, VerseRef } from '@/lib/types'
import { TRANSLATION_LABELS } from '@/lib/constants'
import HanjaText from './HanjaText'

interface Props {
  verse: VerseData
  onAction: (panel: PanelType, ref: VerseRef) => void
  hanjaEnabled?: boolean
}

export default function VerseCard({ verse, onAction, hanjaEnabled = false }: Props) {
  const { ref, text, bookNameKo } = verse
  const displayRef = `${bookNameKo} ${ref.chapter}:${ref.verse}`
  const translationLabel = TRANSLATION_LABELS[ref.translation] ?? ref.translation

  return (
    <div className="my-2 w-full pl-3 border-l-2 border-[var(--clay)]/40
                    animate-fade-in">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="verse-label">{displayRef}</span>
        <span className="text-[0.6rem] text-[var(--ink-medium)]/50 tracking-wide">
          {translationLabel}
        </span>
      </div>
      <p className="verse-text text-[0.95rem] leading-[1.85]">
        <HanjaText text={text} enabled={hanjaEnabled} />
      </p>
      <div className="flex gap-3 mt-2.5">
        <ActionTag label="번역 비교" onClick={() => onAction('compare', ref)} />
        <ActionTag label="원어" onClick={() => onAction('original', ref)} />
        <ActionTag label="관련 구절" onClick={() => onAction('search', ref)} />
      </div>
    </div>
  )
}

function ActionTag({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[0.7rem] text-[var(--ink-medium)]/60 hover:text-[var(--clay)]
                 transition-colors tracking-wide underline underline-offset-2
                 decoration-[var(--clay-border)] hover:decoration-[var(--clay)]"
    >
      {label}
    </button>
  )
}
