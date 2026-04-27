'use client'
import type { SuggestionChip } from '@/lib/types'

interface Props {
  chips: SuggestionChip[]
  onSelect: (prompt: string) => void
}

export default function SuggestionChips({ chips, onSelect }: Props) {
  if (!chips.length) return null
  return (
    <div className="flex flex-col gap-1.5 mt-3 items-start">
      {chips.map((chip, i) => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip.prompt)}
          className="group flex items-center gap-2 text-left
                     text-[0.8rem] text-[var(--ink-medium)]
                     hover:text-[var(--clay)] transition-colors duration-150
                     animate-fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="text-[var(--clay)]/60 group-hover:text-[var(--clay)]
                           transition-colors text-[0.7rem] leading-none mt-px">
            →
          </span>
          <span className="border-b border-transparent group-hover:border-[var(--clay)]/40
                           transition-colors leading-relaxed">
            {chip.label}
          </span>
        </button>
      ))}
    </div>
  )
}
