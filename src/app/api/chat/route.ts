import { NextRequest } from 'next/server'
import { getModel, buildGeminiContents, parseSuggestions } from '@/lib/gemini'
import { extractVerseRefs, stripVerseTags } from '@/lib/verse-parser'
import { retrieve } from '@/lib/rag'
import type { ChatMessage, StreamChunk } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const RAG_TOP_K = 10

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
  const userApiKey = req.headers.get('x-gemini-api-key') ?? undefined
  const body = await req.json() as { messages: ChatMessage[] }

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
        // Find the latest user message to drive retrieval.
        const lastUser = [...body.messages].reverse().find((m) => m.role === 'user')
        const queryText = lastUser?.rawContent ?? lastUser?.content ?? ''

        // Run RAG retrieval. Failures here should not kill the chat — fall back to bare LLM.
        let ragBlock = ''
        const apiKey = userApiKey ?? process.env.GEMINI_API_KEY ?? ''
        if (queryText.trim() && apiKey) {
          try {
            const hits = await retrieve(queryText, RAG_TOP_K, apiKey)
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

        const model = getModel(userApiKey)
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
