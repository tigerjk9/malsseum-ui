'use client'
import type { ChatMessage, PanelType, VerseRef } from '@/lib/types'
import { parseSuggestions } from '@/lib/gemini'
import { stripVerseTags } from '@/lib/verse-parser'
import VerseCard from './VerseCard'
import SuggestionChips from './SuggestionChips'
import HanjaText from './HanjaText'

interface Props {
  message: ChatMessage
  onAction: (panel: PanelType, ref: VerseRef) => void
  onSuggestion: (prompt: string) => void
  hanjaEnabled?: boolean
}

export default function MessageBubble({ message, onAction, onSuggestion, hanjaEnabled = false }: Props) {
  const isUser = message.role === 'user'

  const { clean } = parseSuggestions(message.content)
  const cleanContent = stripVerseTags(clean)

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[78%] rounded-2xl rounded-br-sm
                        bg-[var(--clay-light)] px-4 py-2.5
                        text-[0.875rem] leading-relaxed text-[var(--ink-dark)]">
          <HanjaText text={cleanContent} enabled={hanjaEnabled} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1 animate-fade-in">
      <span className="font-[family-name:var(--font-serif)] italic
                       text-[0.7rem] text-[var(--clay)]/90 px-1
                       flex items-center gap-1.5">
        <span aria-hidden="true" className="not-italic text-[var(--clay)]/70">✦</span>
        말씀 길잡이
      </span>
      <div className="max-w-[88%] text-[0.9rem] leading-[1.85] text-[var(--ink-dark)] px-1">
        {message.isStreaming ? (
          <span>
            <HanjaText text={cleanContent} enabled={hanjaEnabled} />
            <span
              aria-hidden="true"
              className="inline-block w-[2px] h-[1em] mx-0.5 -mb-[0.15em]
                         bg-[var(--clay)]/60 align-middle animate-pulse"
            />
          </span>
        ) : (
          <HanjaText text={cleanContent} enabled={hanjaEnabled} />
        )}
      </div>
      {message.verses.map((verse) => (
        <div key={`${verse.ref.book}:${verse.ref.chapter}:${verse.ref.verse}`}
             className="w-full max-w-[88%]">
          <VerseCard verse={verse} onAction={onAction} hanjaEnabled={hanjaEnabled} />
        </div>
      ))}
      {!message.isStreaming && message.suggestions.length > 0 && (
        <div className="px-1">
          <SuggestionChips chips={message.suggestions} onSelect={onSuggestion} />
        </div>
      )}
    </div>
  )
}
