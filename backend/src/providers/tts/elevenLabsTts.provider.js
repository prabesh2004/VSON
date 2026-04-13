import { env } from '../../config/env.js'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * @param {{ text: string, speed?: number, voice?: string }} input
 * @returns {Promise<{ audio_base64: string, duration_seconds: number }>}
 */
export const synthesizeSpeech = async ({ text, speed = 1, voice }) => {
  console.info('[TTS API] ElevenLabs called')

  if (!env.elevenLabsApiKey) {
    const error = new Error('ELEVENLABS_API_KEY is missing.')
    error.status = 500
    error.code = 'ELEVENLABS_API_KEY_MISSING'
    throw error
  }

  const normalizedText = text.trim()
  if (!normalizedText) {
    const error = new Error('Text is required for speech synthesis.')
    error.status = 400
    error.code = 'TTS_TEXT_REQUIRED'
    throw error
  }

  const voiceId = typeof voice === 'string' && voice.trim().length > 0 ? voice.trim() : env.elevenLabsVoiceId
  const normalizedSpeed = clamp(speed, 0.7, 1.2)

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': env.elevenLabsApiKey,
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: normalizedText,
      model_id: env.elevenLabsModelId,
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
        speed: normalizedSpeed,
      },
    }),
  })

  if (!response.ok) {
    const payload = await response.text().catch(() => '')
    const error = new Error(payload || `ElevenLabs request failed with status ${response.status}`)
    error.status = response.status >= 500 ? 502 : response.status
    error.code = 'ELEVENLABS_TTS_FAILED'
    throw error
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())

  return {
    audio_base64: audioBuffer.toString('base64'),
    duration_seconds: Math.max(1, Math.round((normalizedText.length / 15) * 10) / 10),
  }
}
