import { PreferenceModel } from '../models/preference.model.js'

export const findPreferenceByUserId = async (userId) => {
  return PreferenceModel.findOne({ userId }).lean()
}

export const upsertPreferenceByUserId = async (userId, payload) => {
  return PreferenceModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...payload,
        userId,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean()
}
