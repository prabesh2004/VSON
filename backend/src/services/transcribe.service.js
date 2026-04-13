import { env } from '../config/env.js'
import { getSttProviderByName } from '../providers/providerRegistry.js'

const uniqueProviderOrder = (primary, fallbacks) => {
  const seen = new Set()
  return [primary, ...fallbacks].filter((name) => {
    if (!name || seen.has(name)) return false
    seen.add(name)
    return true
  })
}

/**
 * @param {{ audioBuffer: Buffer, mimeType?: string }} payload
 * @returns {Promise<{ transcript: string, confidence: number }>}
 */
export const transcribeVoice = async ({ audioBuffer, mimeType }) => {
  const providers = uniqueProviderOrder(env.sttProvider, env.sttFallbackProviders)
  const failures = []

  for (const providerName of providers) {
    try {
      const provider = getSttProviderByName(providerName)
      return await provider.transcribeAudio({ audioBuffer, mimeType })
    } catch (error) {
      failures.push(`${providerName}: ${error.message}`)
    }
  }

  const failure = new Error(`All STT providers failed. ${failures.join(' | ')}`)
  failure.status = 502
  failure.code = 'STT_ALL_PROVIDERS_FAILED'
  throw failure
}
