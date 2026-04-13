import mongoose from 'mongoose'

const preferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    voice_speed: {
      type: Number,
      default: 1,
      min: 0.5,
      max: 2,
    },
    detail_level: {
      type: String,
      enum: ['brief', 'standard', 'detailed'],
      default: 'standard',
    },
    font_size: {
      type: String,
      enum: ['normal', 'large', 'xl'],
      default: 'normal',
    },
    theme: {
      type: String,
      default: 'dark',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const PreferenceModel = mongoose.model('Preference', preferenceSchema)
