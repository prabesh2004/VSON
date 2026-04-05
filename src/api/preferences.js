import client from './client'

/**
 * @typedef {Object} Preferences
 * @property {number} voice_speed
 * @property {'brief'|'standard'|'detailed'} detail_level
 * @property {'normal'|'large'|'xl'} font_size
 * @property {'dark'} theme
 */

/**
 * @param {string} id
 * @returns {Promise<Preferences>}
 */
export const getPreferences = async (id) => {
  const { data } = await client.get(`/preferences/${id}`)
  return data
}

/**
 * @param {string} id
 * @param {Partial<Preferences>} preferences
 * @returns {Promise<{ success: boolean }>}
 */
export const updatePreferences = async (id, preferences) => {
  const { data } = await client.put(`/preferences/${id}`, preferences)
  return data
}
