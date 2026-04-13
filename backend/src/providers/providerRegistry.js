import { env } from '../config/env.js'
import * as mockVisionProvider from './vision/mockVision.provider.js'
import * as geminiVisionProvider from './vision/geminiVision.provider.js'
import * as mockSttProvider from './stt/mockStt.provider.js'
import * as deepgramSttProvider from './stt/deepgramStt.provider.js'
import * as googleTranslateTtsProvider from './tts/googleTranslateTts.provider.js'
import * as elevenLabsTtsProvider from './tts/elevenLabsTts.provider.js'

const registry = {
  vision: {
    mock: mockVisionProvider,
    gemini: geminiVisionProvider,
  },
  stt: {
    mock: mockSttProvider,
    deepgram: deepgramSttProvider,
  },
  tts: {
    'google-translate': googleTranslateTtsProvider,
    elevenlabs: elevenLabsTtsProvider,
  },
}

export const getVisionProvider = () => {
  const provider = registry.vision[env.visionProvider]

  if (!provider) {
    const error = new Error(`Unknown vision provider: ${env.visionProvider}`)
    error.status = 500
    error.code = 'VISION_PROVIDER_NOT_FOUND'
    throw error
  }

  if (env.visionProvider === 'gemini' && !env.geminiApiKey) {
    const error = new Error('GEMINI_API_KEY is required when VISION_PROVIDER=gemini.')
    error.status = 500
    error.code = 'GEMINI_API_KEY_MISSING'
    throw error
  }

  return provider
}

export const getSttProvider = () => {
  return getSttProviderByName(env.sttProvider)
}

export const getSttProviderByName = (name) => {
  const provider = registry.stt[name]

  if (!provider) {
    const error = new Error(`Unknown STT provider: ${name}`)
    error.status = 500
    error.code = 'STT_PROVIDER_NOT_FOUND'
    throw error
  }

  return provider
}

export const getTtsProvider = () => {
  return getTtsProviderByName(env.ttsProvider)
}

export const getTtsProviderByName = (name) => {
  const provider = registry.tts[name]

  if (!provider) {
    const error = new Error(`Unknown TTS provider: ${name}`)
    error.status = 500
    error.code = 'TTS_PROVIDER_NOT_FOUND'
    throw error
  }

  return provider
}
