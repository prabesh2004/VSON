import { Router } from 'express'
import { postTts } from '../controllers/tts.controller.js'

const ttsRouter = Router()

ttsRouter.post('/tts', postTts)

export default ttsRouter
