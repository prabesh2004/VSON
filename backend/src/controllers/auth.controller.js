import { z } from 'zod'
import { verifyGoogleCredential } from '../services/googleAuth.service.js'

const googleLoginSchema = z.object({
  credential: z.string().min(1),
})

export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = googleLoginSchema.parse(req.body)
    const result = await verifyGoogleCredential(credential)

    res.json({
      success: true,
      user: result.user,
      verified: result.verified,
      mode: result.mode,
    })
  } catch (error) {
    next(error)
  }
}
