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
  const allowMockFallback = env.nodeEnv === 'development' && Boolean(env.sttMockTranscript?.trim())
  const providers = uniqueProviderOrder(env.sttProvider, env.sttFallbackProviders).filter((providerName, index) => {
    if (providerName !== 'mock') return true
    if (index === 0) return true
    return allowMockFallback
  })
  const failures = []

  for (const providerName of providers) {
    try {
      console.info('[STT] Trying provider:', providerName)
      const provider = getSttProviderByName(providerName)
      const result = await provider.transcribeAudio({ audioBuffer, mimeType })
      console.info('[STT] Provider succeeded:', providerName)
      return result
    } catch (error) {
      console.info('[STT] Provider failed:', providerName, error.message)
      failures.push(`${providerName}: ${error.message}`)
    }
  }

  const failure = new Error(`All STT providers failed. ${failures.join(' | ')}`)
  failure.status = 502
  failure.code = 'STT_ALL_PROVIDERS_FAILED'
  throw failure
}
