import { WebSocketServer } from 'ws'
import { env } from '../config/env.js'
import { describeScene } from './describe.service.js'

const sessionMemory = new Map()

const normalize = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase()

const parseMessage = (rawData) => {
  try {
    return JSON.parse(rawData.toString())
  } catch {
    return null
  }
}

const pushHistory = (history, description) => {
  history.push(description)
  if (history.length > 20) {
    history.shift()
  }
}

const shouldEmitDescription = (nextDescription, lastDescription) => {
  if (!nextDescription) return false
  if (!lastDescription) return true
  return normalize(nextDescription) !== normalize(lastDescription)
}

const buildFrameDetailLevel = () => 'brief'

export const attachWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/live' })

  wss.on('connection', (ws) => {
    const state = {
      frameCount: 0,
      lastDescription: '',
      processing: false,
      history: [],
    }

    sessionMemory.set(ws, state)

    ws.send(
      JSON.stringify({
        type: 'ready',
        message: 'Vision live session started',
        model: env.geminiLiveModel || env.geminiModel,
      })
    )

    ws.on('message', async (rawData) => {
      const data = parseMessage(rawData)
      if (!data || typeof data !== 'object') {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid live message payload.' }))
        return
      }

      const current = sessionMemory.get(ws)
      if (!current) return

      if (data.type === 'frame') {
        if (!data.frame || current.processing) return

        current.processing = true
        current.frameCount += 1

        try {
          const result = await describeScene({
            image: data.frame,
            detail_level: buildFrameDetailLevel(),
          })

          if (shouldEmitDescription(result.description, current.lastDescription)) {
            current.lastDescription = result.description
            pushHistory(current.history, result.description)

            ws.send(
              JSON.stringify({
                type: 'description',
                description: result.description,
                confidence: result.confidence,
                frameNumber: current.frameCount,
                timestamp: Date.now(),
              })
            )
          }
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: error?.message ?? 'Description failed. Please try again.',
            })
          )
        } finally {
          current.processing = false
        }
        return
      }

      if (data.type === 'describe') {
        if (!data.frame) {
          ws.send(JSON.stringify({ type: 'error', message: 'Missing frame in describe request.' }))
          return
        }

        try {
          const result = await describeScene({
            image: data.frame,
            detail_level: data.detailed ? 'detailed' : 'brief',
          })

          current.lastDescription = result.description
          pushHistory(current.history, result.description)

          ws.send(
            JSON.stringify({
              type: 'description',
              description: result.description,
              confidence: result.confidence,
              triggered: true,
              timestamp: Date.now(),
            })
          )
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: error?.message ?? 'Description failed. Please try again.',
            })
          )
        }
      }
    })

    ws.on('close', () => {
      sessionMemory.delete(ws)
    })

    ws.on('error', () => {
      sessionMemory.delete(ws)
    })
  })

  return wss
}
