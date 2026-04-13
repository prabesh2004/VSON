import multer from 'multer'
import { Router } from 'express'
import { postTranscribe } from '../controllers/transcribe.controller.js'

const transcribeRouter = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})

transcribeRouter.post('/transcribe', upload.single('audio'), postTranscribe)

export default transcribeRouter
