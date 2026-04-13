import googleTTS from 'google-tts-api'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const fetchMp3Buffer = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    const error = new Error(`TTS provider request failed with status ${response.status}`)
    error.status = 502
    error.code = 'TTS_PROVIDER_ERROR'
    throw error
  }

  return Buffer.from(await response.arrayBuffer())
}

/**
 * @param {{ text: string, speed?: number, voice?: string }} input
 * @returns {Promise<{ audio_base64: string, duration_seconds: number }>}
 */
export const synthesizeSpeech = async ({ text, speed = 1, voice }) => {
  const normalized = text.trim()
  if (!normalized) {
    const error = new Error('Text is required for speech synthesis.')
    error.status = 400
    error.code = 'TTS_TEXT_REQUIRED'
    throw error
  }

  const language = typeof voice === 'string' && voice.trim().length > 0 ? voice.trim() : 'en'
  const slow = clamp(speed, 0.5, 2) < 0.9

  const parts = googleTTS.getAllAudioUrls(normalized, {
    lang: language,
    slow,
    host: 'https://translate.google.com',
  })

  const buffers = await Promise.all(parts.map((part) => fetchMp3Buffer(part.url)))
  const merged = Buffer.concat(buffers)

  return {
    audio_base64: merged.toString('base64'),
    duration_seconds: Math.max(1, Math.round((normalized.length / 14) * 10) / 10),
  }
}
