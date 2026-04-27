'use client'
import type { SuggestionChip } from '@/lib/types'

interface Props {
  chips: SuggestionChip[]
  onSelect: (prompt: string) => void
}

export default function SuggestionChips({ chips, onSelect }: Props) {
  if (!chips.length) return null
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip.prompt)}
          className="text-[0.75rem] border border-[var(--clay-border)] text-[var(--ink-medium)]
                     bg-[var(--suggestion-bg)] rounded-full px-4 py-1.5
                     hover:border-[var(--clay)] hover:text-[var(--clay)] transition-colors"
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
