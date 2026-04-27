'use client'

interface Props {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export default function HanjaToggle({ enabled, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      aria-label="한자 표기 토글"
      className={`text-[0.7rem] px-2 py-1 rounded-xl border transition-colors ${
        enabled
          ? 'bg-[var(--clay-light)] text-[var(--clay)] border-[var(--clay)]'
          : 'bg-transparent text-[var(--ink-medium)] border-[var(--clay-border)] hover:bg-[var(--clay-light)]'
      }`}
    >
      한자 {enabled ? 'ON' : 'OFF'}
    </button>
  )
}
