'use client'
import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, PanelType, VerseRef } from '@/lib/types'
import { parseSuggestions } from '@/lib/gemini'
import { stripVerseTags } from '@/lib/verse-parser'
import VerseCard from './VerseCard'
import SuggestionChips from './SuggestionChips'
import HanjaText from './HanjaText'

const TYPEWRITER_CHARS = 2
const TYPEWRITER_MS = 16

interface Props {
  message: ChatMessage
  onAction: (panel: PanelType, ref: VerseRef) => void
  onSuggestion: (prompt: string) => void
  hanjaEnabled?: boolean
}

export default function MessageBubble({ message, onAction, onSuggestion, hanjaEnabled = false }: Props) {
  const isUser = message.role === 'user'

  const { clean } = parseSuggestions(message.content)
  const cleanContent = stripVerseTags(clean).replace(/\n{2,}/g, '\n')

  const cleanRef = useRef(cleanContent)
  cleanRef.current = cleanContent

  const [displayedLen, setDisplayedLen] = useState(() =>
    message.isStreaming ? 0 : cleanContent.length
  )

  useEffect(() => {
    if (isUser) return
    if (!message.isStreaming) {
      setDisplayedLen(cleanRef.current.length)
      return
    }
    const timer = setInterval(() => {
      setDisplayedLen(prev => {
        const target = cleanRef.current.length
        return prev >= target ? prev : prev + TYPEWRITER_CHARS
      })
    }, TYPEWRITER_MS)
    return () => clearInterval(timer)
  }, [message.isStreaming, isUser])

  const visibleContent = (!isUser && message.isStreaming)
    ? cleanContent.slice(0, displayedLen)
    : cleanContent

  // Special rendering for the welcome message: split ✦ feature block into a styled box.
  if (message.id === 'welcome') {
    const rawText = stripVerseTags(parseSuggestions(message.content).clean)
    const bulletIdx = rawText.indexOf('\n✦')
    const intro = bulletIdx !== -1 ? rawText.slice(0, bulletIdx).trim() : rawText
    const boxLines = bulletIdx !== -1
      ? rawText.slice(bulletIdx + 1).split('\n').filter(l => l.trim())
      : []

    return (
      <div className="flex flex-col items-start gap-1 animate-fade-in">
        <span className="font-[family-name:var(--font-serif)] italic
                         text-[0.7rem] text-[var(--clay)]/90 px-1
                         flex items-center gap-1.5">
          <span aria-hidden="true" className="not-italic text-[var(--clay)]/70">✦</span>
          말씀 길잡이
        </span>
        <div className="max-w-[88%] text-[0.9rem] leading-[1.85] text-[var(--ink-dark)]
                        px-1 whitespace-pre-line">
          {intro}
        </div>
        {boxLines.length > 0 && (
          <div className="w-full max-w-[88%] mx-1 mt-1.5
                          rounded-[var(--radius-paper)] border border-[var(--clay-border)]
                          bg-[var(--paper-white)]/50 px-3.5 py-3 space-y-2">
            {boxLines.map((line, i) => (
              line.startsWith('✦') ? (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[var(--clay)] shrink-0 text-[0.82rem]
                                   leading-relaxed mt-px">✦</span>
                  <span className="text-[0.82rem] leading-relaxed text-[var(--ink-dark)]">
                    {line.slice(1).trim()}
                  </span>
                </div>
              ) : (
                <div key={i} className="text-[0.74rem] text-[var(--ink-medium)]/80
                                        pl-[22px] leading-snug -mt-1">
                  {line.trim()}
                </div>
              )
            ))}
          </div>
        )}
        {message.suggestions.length > 0 && (
          <div className="px-1">
            <SuggestionChips chips={message.suggestions} onSelect={onSuggestion} />
          </div>
        )}
      </div>
    )
  }

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
      {message.verses.map((verse) => (
        <div key={`${verse.ref.book}:${verse.ref.chapter}:${verse.ref.verse}`}
             className="w-full max-w-[88%]">
          <VerseCard verse={verse} onAction={onAction} hanjaEnabled={hanjaEnabled} />
        </div>
      ))}
      <div className="max-w-[88%] text-[0.9rem] leading-[1.85] text-[var(--ink-dark)] px-1 whitespace-pre-line">
        {message.isStreaming ? (
          <span>
            <HanjaText text={visibleContent} enabled={hanjaEnabled} />
            <span
              aria-hidden="true"
              className="inline-block w-[2px] h-[1em] mx-0.5 -mb-[0.15em]
                         bg-[var(--clay)]/60 align-middle animate-pulse"
            />
          </span>
        ) : (
          <HanjaText text={visibleContent} enabled={hanjaEnabled} />
        )}
      </div>
      {!message.isStreaming && message.suggestions.length > 0 && (
        <div className="px-1">
          <SuggestionChips chips={message.suggestions} onSelect={onSuggestion} />
        </div>
      )}
    </div>
  )
}
