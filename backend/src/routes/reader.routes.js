import multer from 'multer'
import { Router } from 'express'
import { postReadDocument, postReadUrl } from '../controllers/reader.controller.js'

const readerRouter = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
})

readerRouter.post('/read-url', postReadUrl)
readerRouter.post('/read-document', upload.single('file'), postReadDocument)

export default readerRouter
