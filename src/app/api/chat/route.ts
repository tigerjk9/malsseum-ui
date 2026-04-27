import { NextRequest } from 'next/server'
import { getModel, buildGeminiContents, parseSuggestions } from '@/lib/gemini'
import { extractVerseRefs, stripVerseTags } from '@/lib/verse-parser'
import type { ChatMessage, StreamChunk } from '@/lib/types'

function encode(chunk: StreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`
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
        const model = getModel(userApiKey)
        const contents = buildGeminiContents(body.messages)
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
