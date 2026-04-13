import { env } from '../../config/env.js'

/**
 * @param {{ audioBuffer: Buffer, mimeType?: string }} _input
 * @returns {Promise<{ transcript: string, confidence: number }>}
 */
export const transcribeAudio = async (_input) => {
  return {
    transcript: env.sttMockTranscript,
    confidence: 0.6,
  }
}
