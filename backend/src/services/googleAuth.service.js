import { OAuth2Client } from 'google-auth-library'
import { env } from '../config/env.js'

const oauthClient = new OAuth2Client(env.googleClientId || undefined)

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return Buffer.from(padded, 'base64').toString('utf8')
}

const decodeWithoutVerify = (credential) => {
  const parts = credential.split('.')
  if (parts.length < 2) {
    throw new Error('Invalid Google credential payload.')
  }

  const payload = JSON.parse(base64UrlDecode(parts[1]))
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: Boolean(payload.email_verified),
  }
}

export const verifyGoogleCredential = async (credential) => {
  if (!credential || typeof credential !== 'string') {
    const error = new Error('Missing Google credential token.')
    error.status = 400
    error.code = 'MISSING_GOOGLE_CREDENTIAL'
    throw error
  }

  if (!env.googleClientId) {
    const user = decodeWithoutVerify(credential)
    return {
      user,
      verified: false,
      mode: 'decode-only',
    }
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  })

  const payload = ticket.getPayload()
  if (!payload?.sub) {
    const error = new Error('Invalid Google token payload.')
    error.status = 401
    error.code = 'INVALID_GOOGLE_TOKEN'
    throw error
  }

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: Boolean(payload.email_verified),
    },
    verified: true,
    mode: 'verified',
  }
}
