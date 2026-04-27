'use client'
import type { ChatMessage, PanelType, VerseRef } from '@/lib/types'
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

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
      {!isUser && (
        <span className="font-[family-name:var(--font-serif)] italic
                         text-[0.75rem] text-[var(--ink-medium)] px-1
                         flex items-center gap-1.5">
          <span aria-hidden="true" className="text-[var(--clay)] not-italic">✦</span>
          말씀 길잡이
        </span>
      )}
      <div
        className={`max-w-[80%] rounded-[var(--radius-paper)] px-4 py-3 text-[0.9rem] leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-[var(--clay-light)] text-[var(--ink-dark)]'
            : 'rounded-bl-sm border-l-2 border-[var(--clay)] bg-[var(--clay-light)] text-[var(--ink-dark)]'
        }`}
      >
        {message.isStreaming ? (
          <span>
            <HanjaText text={message.content} enabled={hanjaEnabled} />
            <span
              aria-hidden="true"
              className="inline-block w-[2px] h-[1em] mx-0.5 -mb-[0.15em] bg-current align-middle animate-pulse"
            />
          </span>
        ) : (
          <HanjaText text={message.content} enabled={hanjaEnabled} />
        )}
      </div>
      {message.verses.map((verse) => (
        <VerseCard
          key={`${verse.ref.book}:${verse.ref.chapter}:${verse.ref.verse}`}
          verse={verse}
          onAction={onAction}
          hanjaEnabled={hanjaEnabled}
        />
      ))}
      {!message.isStreaming && message.suggestions.length > 0 && (
        <SuggestionChips chips={message.suggestions} onSelect={onSuggestion} />
      )}
    </div>
  )
}
