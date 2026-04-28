'use client'
import type { SuggestionChip } from '@/lib/types'

interface Props {
  chips: SuggestionChip[]
  onSelect: (prompt: string) => void
}

export default function SuggestionChips({ chips, onSelect }: Props) {
  if (!chips.length) return null
  return (
    <div className="mt-4">
      {/* Section divider */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="h-px flex-1 bg-[var(--clay-border)]" />
        <span className="text-[0.58rem] tracking-[0.25em] text-[var(--clay)]/55
                         uppercase select-none font-[family-name:var(--font-serif)]
                         not-italic">
          계속 나아가기
        </span>
        <span className="h-px flex-1 bg-[var(--clay-border)]" />
      </div>

      {/* Suggestion items */}
      <div className="space-y-0.5">
        {chips.map((chip, i) => (
          <button
            key={chip.label}
            onClick={() => onSelect(chip.prompt)}
            className="group w-full flex items-start gap-2.5 text-left
                       py-1 animate-fade-in"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span
              aria-hidden="true"
              className="text-[var(--clay)]/45 group-hover:text-[var(--clay)]
                         transition-colors shrink-0 text-[0.7rem] mt-[3px] leading-none"
            >
              ✦
            </span>
            <span
              className="text-[0.82rem] leading-relaxed text-[var(--ink-medium)]
                         group-hover:text-[var(--ink-dark)] transition-colors
                         border-b border-transparent
                         group-hover:border-[var(--clay)]/25"
            >
              {chip.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
