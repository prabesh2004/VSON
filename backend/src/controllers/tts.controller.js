import { z } from 'zod'
import { synthesizeVoice } from '../services/tts.service.js'

const schema = z.object({
  text: z.string().trim().min(1).max(4000),
  speed: z.number().min(0.5).max(2).optional(),
  voice: z.string().trim().min(2).max(64).optional(),
})

export const postTts = async (req, res, next) => {
  try {
    const payload = schema.parse(req.body)
    const result = await synthesizeVoice(payload)

    res.json({
      audio_base64: result.audio_base64,
      duration_seconds: result.duration_seconds,
    })
  } catch (error) {
    next(error)
  }
}
