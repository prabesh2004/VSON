import client from './client'

/**
 * @param {{ image: string, detail_level?: 'brief'|'standard'|'detailed' }} payload
 * @returns {Promise<{ description: string, confidence: number }>}
 */
export const describeImage = async ({ image, detail_level = 'standard' }) => {
  const { data } = await client.post('/describe', { image, detail_level })
  return data
}
