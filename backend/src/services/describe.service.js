import { getVisionProvider } from '../providers/providerRegistry.js'

/**
 * @param {{ image: string, detail_level?: 'brief'|'standard'|'detailed' }} payload
 * @returns {Promise<{ description: string, confidence: number }>}
 */
export const describeScene = async ({ image, detail_level = 'standard' }) => {
  const provider = getVisionProvider()

  return provider.describeImage({
    imageBase64: image,
    detailLevel: detail_level,
  })
}

/**
 * @param {{ image: string }} payload
 * @returns {Promise<{ description: string }>}
 */
export const describeSocialScene = async ({ image }) => {
  const provider = getVisionProvider()

  if (typeof provider.describeSocialContext !== 'function') {
    const error = new Error('Social context description is not available for the current provider.')
    error.status = 501
    error.code = 'VISION_SOCIAL_NOT_AVAILABLE'
    throw error
  }

  return provider.describeSocialContext({ imageBase64: image })
}

/**
 * @param {{ image: string }} payload
 * @returns {Promise<{ text: string }>}
 */
export const readSceneText = async ({ image }) => {
  const provider = getVisionProvider()

  if (typeof provider.readTextInScene !== 'function') {
    const error = new Error('Text reading is not available for the current provider.')
    error.status = 501
    error.code = 'VISION_TEXT_NOT_AVAILABLE'
    throw error
  }

  return provider.readTextInScene({ imageBase64: image })
}
