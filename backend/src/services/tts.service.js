import { env } from '../config/env.js'
import { getTtsProviderByName } from '../providers/providerRegistry.js'

const uniqueProviderOrder = (primary, fallbacks) => {
  const seen = new Set()
  return [primary, ...fallbacks].filter((name) => {
    if (!name || seen.has(name)) return false
    seen.add(name)
    return true
  })
}

/**
 * @param {{ text: string, speed?: number, voice?: string }} payload
 * @returns {Promise<{ audio_base64: string, duration_seconds: number }>}
 */
export const synthesizeVoice = async ({ text, speed = 1, voice }) => {
  const providers = uniqueProviderOrder(env.ttsProvider, env.ttsFallbackProviders)
  const failures = []

  for (const providerName of providers) {
    try {
      const provider = getTtsProviderByName(providerName)
      return await provider.synthesizeSpeech({ text, speed, voice })
    } catch (error) {
      failures.push(`${providerName}: ${error.message}`)
    }
  }

  const failure = new Error(`All TTS providers failed. ${failures.join(' | ')}`)
  failure.status = 502
  failure.code = 'TTS_ALL_PROVIDERS_FAILED'
  throw failure
}
