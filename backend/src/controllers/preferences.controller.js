import { z } from 'zod'
import { getPreferencesForUser, updatePreferencesForUser } from '../services/preferences.service.js'

const paramsSchema = z.object({
  id: z.string().min(1),
})

const updateSchema = z
  .object({
    voice_speed: z.number().min(0.5).max(2).optional(),
    detail_level: z.enum(['brief', 'standard', 'detailed']).optional(),
    font_size: z.enum(['normal', 'large', 'xl']).optional(),
    theme: z.string().min(1).optional(),
  })
  .strict()

export const getPreferences = async (req, res, next) => {
  try {
    const { id } = paramsSchema.parse(req.params)
    const preferences = await getPreferencesForUser(id)
    res.json(preferences)
  } catch (error) {
    next(error)
  }
}

export const putPreferences = async (req, res, next) => {
  try {
    const { id } = paramsSchema.parse(req.params)
    const updates = updateSchema.parse(req.body)

    await updatePreferencesForUser(id, updates)

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
