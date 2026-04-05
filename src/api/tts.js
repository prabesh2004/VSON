import client from './client'

/**
 * @param {{ text: string, speed?: number, voice?: string }} payload
 * @returns {Promise<{ audio_base64: string, duration_seconds: number }>}
 */
export const synthesizeSpeech = async ({ text, speed = 1, voice }) => {
  const { data } = await client.post('/tts', { text, speed, voice })
  return data
}
