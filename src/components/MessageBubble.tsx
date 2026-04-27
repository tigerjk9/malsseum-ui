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
        <span className="verse-label px-1">✦ 말씀 길잡이</span>
      )}
      <div
        className={`max-w-[80%] rounded-[var(--radius-paper)] px-4 py-3 text-[0.9rem] leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-[var(--clay-light)] text-[var(--ink-dark)]'
            : 'rounded-bl-sm border-l-2 border-[var(--clay)] bg-[rgba(139,99,67,0.08)] text-[var(--ink-dark)]'
        }`}
      >
        {message.isStreaming ? (
          <span>
            <HanjaText text={message.content} enabled={hanjaEnabled} />
            <span className="animate-pulse">▌</span>
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
