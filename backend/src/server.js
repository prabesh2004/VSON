import http from 'node:http'
import { createApp } from './app.js'
import { connectToMongo } from './config/mongo.js'
import { env } from './config/env.js'
import { attachWebSocketServer } from './services/liveStream.service.js'

const app = createApp()
const httpServer = http.createServer(app)

const startServer = async () => {
  try {
    await connectToMongo()
    const wss = attachWebSocketServer(httpServer)

    wss.on('error', (error) => {
      console.error('[backend] WebSocket server error:', error.message)
    })

    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `[backend] Port ${env.port} is already in use. Stop the existing backend process, then restart.`
        )
      } else {
        console.error('[backend] HTTP server error:', error.message)
      }

      process.exit(1)
    })

    httpServer.listen(env.port, () => {
      console.log(`[backend] Listening on http://localhost:${env.port}`)
      console.log(`[backend] Live stream WebSocket: ws://localhost:${env.port}/ws/live`)
    })
  } catch (error) {
    console.error('[backend] Startup failed:', error.message)
    process.exit(1)
  }
}

void startServer()
