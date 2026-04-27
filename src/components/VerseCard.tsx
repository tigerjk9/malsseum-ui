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
    <div className="rounded-[var(--radius-paper)] border border-[var(--clay-border)] bg-[var(--paper-white)] p-4 my-1 w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="verse-label">{displayRef} · {translationLabel}</span>
      </div>
      <p className="verse-text"><HanjaText text={text} enabled={hanjaEnabled} /></p>
      <div className="flex gap-2 mt-3 flex-wrap">
        <ActionTag label="번역 비교" onClick={() => onAction('compare', ref)} />
        <ActionTag label="원어 보기" onClick={() => onAction('original', ref)} />
        <ActionTag label="교차 참조" onClick={() => onAction('search', ref)} />
      </div>
    </div>
  )
}

function ActionTag({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[0.75rem] bg-[var(--clay-light)] text-[var(--clay)] px-3 py-1 rounded-[var(--radius-pill)]
                 hover:bg-[rgba(139,99,67,0.2)] transition-colors"
    >
      {label}
    </button>
  )
}
