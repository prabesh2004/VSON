import { findPreferenceByUserId, upsertPreferenceByUserId } from '../repos/preference.repo.js'

const DEFAULT_PREFERENCES = {
  voice_speed: 1,
  detail_level: 'standard',
  font_size: 'normal',
  theme: 'dark',
}

const toPublicPreferences = (doc) => ({
  voice_speed: doc?.voice_speed ?? DEFAULT_PREFERENCES.voice_speed,
  detail_level: doc?.detail_level ?? DEFAULT_PREFERENCES.detail_level,
  font_size: doc?.font_size ?? DEFAULT_PREFERENCES.font_size,
  theme: doc?.theme ?? DEFAULT_PREFERENCES.theme,
})

export const getPreferencesForUser = async (userId) => {
  const existing = await findPreferenceByUserId(userId)
  if (!existing) return DEFAULT_PREFERENCES
  return toPublicPreferences(existing)
}

export const updatePreferencesForUser = async (userId, updates) => {
  const next = await upsertPreferenceByUserId(userId, updates)
  return toPublicPreferences(next)
}
