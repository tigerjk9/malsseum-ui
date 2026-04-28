import { NextRequest } from 'next/server'
import { getModel, buildGeminiContents, parseSuggestions } from '@/lib/gemini'
import { extractVerseRefs, stripVerseTags } from '@/lib/verse-parser'
import { retrieve, expandQuery } from '@/lib/rag'
import { verifyAdminToken } from '@/lib/auth'
import type { ChatMessage, StreamChunk } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const RAG_TOP_K = 10
const RAG_SCORE_THRESHOLD = 0.55

function encode(chunk: StreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`
}

function buildRagBlock(hits: Awaited<ReturnType<typeof retrieve>>): string {
  if (hits.length === 0) return ''
  const lines = hits.map((h) => {
    const tag = `[[VERSE:${h.ref.book}:${h.ref.chapter}:${h.ref.verse}:KRV]]`
    return `${tag} ${h.bookNameKo} ${h.ref.chapter}:${h.ref.verse} — ${h.text}`
  })
  return [
    '',
    '---',
    '관련 후보 구절(KRV RAG 검색, 점수 내림차순):',
    ...lines,
    '---',
    '위 후보 안에서만 [[VERSE:...]]를 인용하세요. 후보 블록은 응답에 노출하지 마세요.',
  ].join('\n')
}

export async function POST(req: NextRequest) {
  const adminToken = req.headers.get('x-admin-token') ?? ''
  const userApiKey = req.headers.get('x-gemini-api-key') ?? undefined
  const isAdmin = verifyAdminToken(adminToken)

  if (!isAdmin && !userApiKey) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { messages: ChatMessage[]; mode?: 'inductive' | 'free' }

  if (!body.messages?.length) {
    return new Response(encode({ type: 'error', message: 'messages 필드 필요' }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: StreamChunk) =>
        controller.enqueue(new TextEncoder().encode(encode(chunk)))

      try {
        // Find the latest user message to drive retrieval and expansion.
        const lastUser = [...body.messages].reverse().find((m) => m.role === 'user')
        const lastUserText = lastUser?.rawContent ?? lastUser?.content ?? ''
        const mode = body.mode ?? 'inductive'

        // Run RAG retrieval only in inductive mode — free mode is LLM-first conversation.
        let ragBlock = ''
        let ragCandidateKeys = new Set<string>()
        const ragKey = isAdmin ? (process.env.GEMINI_API_KEY ?? '') : (userApiKey ?? '')
        if (mode !== 'free' && lastUserText.trim() && ragKey) {
          try {
            // For short follow-up messages, include recent context to improve retrieval quality.
            const userMessages = body.messages.filter(m => m.role === 'user')
            const ragQuery = lastUserText.length < 30 && userMessages.length > 1
              ? userMessages.slice(-3).map(m => m.rawContent ?? m.content).join(' ')
              : lastUserText

            const expanded = await expandQuery(ragQuery, ragKey)
            const allHits = await retrieve(expanded, RAG_TOP_K, ragKey)
            const hits = allHits.filter((h) => h.score >= RAG_SCORE_THRESHOLD)
            console.log(`[chat] RAG: expanded="${expanded.slice(0, 80)}" hits=${allHits.length} above_threshold=${hits.length}`)
            ragCandidateKeys = new Set(hits.map(h => `${h.ref.book}:${h.ref.chapter}:${h.ref.verse}`))
            ragBlock = buildRagBlock(hits)
          } catch (err) {
            console.error('[chat] RAG retrieval failed, continuing without:', err)
          }
        }

        // Build Gemini contents and append RAG block to the latest user turn.
        const contents = buildGeminiContents(body.messages)
        if (ragBlock && contents.length > 0) {
          const last = contents[contents.length - 1]
          if (last.role === 'user') {
            const part = last.parts[0]
            if (part && 'text' in part && typeof part.text === 'string') {
              part.text = part.text + ragBlock
            }
          }
        }

        const model = getModel(isAdmin ? undefined : userApiKey, mode)
        const result = await model.generateContentStream({ contents })

        let fullText = ''
        for await (const chunk of result.stream) {
          const piece = chunk.text()
          fullText += piece
          const visiblePiece = stripVerseTags(piece)
          if (visiblePiece) send({ type: 'text', content: visiblePiece })
        }

        const verseRefs = extractVerseRefs(fullText)
        for (const ref of verseRefs) {
          // Guard against hallucinated refs not present in the RAG candidate set.
          if (ragCandidateKeys.size > 0) {
            const parts = ref.split(':')
            if (!ragCandidateKeys.has(`${parts[0]}:${parts[1]}:${parts[2]}`)) {
              console.log(`[chat] Dropping out-of-candidate ref: ${ref}`)
              continue
            }
          }
          send({ type: 'verse_ref', ref })
        }

        const { chips } = parseSuggestions(fullText)
        if (chips.length > 0) send({ type: 'suggestions', chips })

        send({ type: 'done' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gemini 오류'
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
