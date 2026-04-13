import { getMongoHealth } from '../config/mongo.js'

export const getHealth = (_req, res) => {
  const mongo = getMongoHealth()

  res.json({
    status: mongo.label === 'connected' ? 'ok' : 'degraded',
    version: '0.1.0',
    services: {
      mongo: mongo.label,
    },
  })
}
