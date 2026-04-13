import { z } from 'zod'
import { describeScene, describeSocialScene, readSceneText } from '../services/describe.service.js'

const base64Regex = /^[A-Za-z0-9+/=]+$/

const schema = z.object({
  image: z
    .string()
    .min(100, 'Image payload is too small.')
    .max(10 * 1024 * 1024, 'Image payload is too large.')
    .regex(base64Regex, 'Image must be a valid base64 string.'),
  detail_level: z.enum(['brief', 'standard', 'detailed']).optional(),
})

const imageOnlySchema = z.object({
  image: z
    .string()
    .min(100, 'Image payload is too small.')
    .max(10 * 1024 * 1024, 'Image payload is too large.')
    .regex(base64Regex, 'Image must be a valid base64 string.'),
})

export const postDescribe = async (req, res, next) => {
  try {
    const payload = schema.parse(req.body)
    const result = await describeScene(payload)

    res.json({
      description: result.description,
      confidence: result.confidence,
    })
  } catch (error) {
    next(error)
  }
}

export const postDescribeSocial = async (req, res, next) => {
  try {
    const payload = imageOnlySchema.parse(req.body)
    const result = await describeSocialScene(payload)

    res.json({
      description: result.description,
    })
  } catch (error) {
    next(error)
  }
}

export const postReadTextInScene = async (req, res, next) => {
  try {
    const payload = imageOnlySchema.parse(req.body)
    const result = await readSceneText(payload)

    res.json({
      text: result.text,
    })
  } catch (error) {
    next(error)
  }
}
