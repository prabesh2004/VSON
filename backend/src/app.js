import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import healthRouter from './routes/health.routes.js'
import authRouter from './routes/auth.routes.js'
import preferencesRouter from './routes/preferences.routes.js'
import describeRouter from './routes/describe.routes.js'
import transcribeRouter from './routes/transcribe.routes.js'
import ttsRouter from './routes/tts.routes.js'
import readerRouter from './routes/reader.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export const createApp = () => {
  const app = express()

  const isDev = env.nodeEnv !== 'production'

  app.use(
    helmet({
      contentSecurityPolicy: isDev
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              connectSrc: ["'self'", env.corsOrigin],
              imgSrc: ["'self'", 'data:', 'blob:'],
              mediaSrc: ["'self'", 'data:', 'blob:'],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
            },
          },
      crossOriginEmbedderPolicy: false,
    })
  )
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  )
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
  app.use(express.json({ limit: env.requestLimit }))
  app.use(express.urlencoded({ extended: true, limit: env.requestLimit }))
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  )

  app.use('/', healthRouter)
  app.use('/', authRouter)
  app.use('/', preferencesRouter)
  app.use('/', describeRouter)
  app.use('/', transcribeRouter)
  app.use('/', ttsRouter)
  app.use('/', readerRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
