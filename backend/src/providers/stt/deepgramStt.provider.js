import { env } from '../../config/env.js'

const clamp01 = (value, fallback) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(1, Math.max(0, parsed))
}

/**
 * @param {{ audioBuffer: Buffer, mimeType?: string }} input
 * @returns {Promise<{ transcript: string, confidence: number }>}
 */
export const transcribeAudio = async ({ audioBuffer, mimeType = 'audio/webm' }) => {
  console.info('[STT API] Deepgram called')

  if (!env.deepgramApiKey) {
    const error = new Error('DEEPGRAM_API_KEY is missing.')
    error.status = 500
    error.code = 'DEEPGRAM_API_KEY_MISSING'
    throw error
  }

  const url = new URL('https://api.deepgram.com/v1/listen')
  url.searchParams.set('model', env.deepgramModel)
  url.searchParams.set('smart_format', 'true')
  url.searchParams.set('punctuate', 'true')
  url.searchParams.set('utterances', 'false')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${env.deepgramApiKey}`,
      'Content-Type': mimeType,
    },
    body: audioBuffer,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload?.err_msg ?? payload?.error ?? `Deepgram request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status >= 500 ? 502 : response.status
    error.code = 'DEEPGRAM_TRANSCRIBE_FAILED'
    throw error
  }

  const alternative = payload?.results?.channels?.[0]?.alternatives?.[0]
  const transcript = String(alternative?.transcript ?? '').trim()

  if (!transcript) {
    return {
      transcript: '',
      confidence: 0,
    }
  }

  return {
    transcript,
    confidence: clamp01(alternative?.confidence, 0.85),
  }
}
