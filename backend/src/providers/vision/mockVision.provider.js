/**
 * Describe an image payload and return frontend-compatible response shape.
 * This is a scaffold provider for backend integration and can be swapped later.
 *
 * @param {{ imageBase64: string, detailLevel: 'brief'|'standard'|'detailed' }} input
 * @returns {Promise<{ description: string, confidence: number }>}
 */
export const describeImage = async ({ imageBase64, detailLevel }) => {
  const sizeBucket = imageBase64.length > 500000 ? 'high-detail' : 'standard-detail'

  const byDetail = {
    brief: 'A quick scene summary is available. Main objects and rough layout detected.',
    standard:
      'An indoor scene with recognizable objects and spatial structure. This is a scaffold response from backend provider mode.',
    detailed:
      'A detailed scaffold scene response: visible objects, probable positions, and overall context are identified for accessibility narration. This is placeholder output until AI provider is connected.',
  }

  return {
    description: `${byDetail[detailLevel] ?? byDetail.standard} Capture quality: ${sizeBucket}.`,
    confidence: detailLevel === 'detailed' ? 0.9 : 0.86,
  }
}

/**
 * @param {{ imageBase64: string }} input
 * @returns {Promise<{ description: string }>}
 */
export const describeSocialContext = async ({ imageBase64 }) => {
  const hasLikelyFaces = imageBase64.length % 2 === 0

  return {
    description: hasLikelyFaces
      ? 'At least one person may be present in front of the camera. Their exact expression is unclear in mock mode.'
      : 'No clear people or social interaction detected in this mock frame.',
  }
}

/**
 * @param {{ imageBase64: string }} input
 * @returns {Promise<{ text: string }>}
 */
export const readTextInScene = async ({ imageBase64 }) => {
  if (imageBase64.length < 50000) {
    return { text: 'No text found in this scene.' }
  }

  return {
    text: 'Mock mode detected potential visible text. Connect Gemini provider for exact OCR results.',
  }
}
