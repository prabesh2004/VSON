import mongoose from 'mongoose'
import { env } from './env.js'

export const connectToMongo = async () => {
  if (!env.mongoUri) {
    throw new Error('Missing MONGODB_URI. Add it to backend/.env before starting the backend.')
  }

  await mongoose.connect(env.mongoUri)
}

export const getMongoHealth = () => {
  const state = mongoose.connection.readyState
  const mapping = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }

  return {
    state,
    label: mapping[state] ?? 'unknown',
  }
}
