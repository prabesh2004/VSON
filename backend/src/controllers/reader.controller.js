import { z } from 'zod'
import { readUploadedDocument } from '../services/readDocument.service.js'
import { readWebUrl } from '../services/readUrl.service.js'

const readUrlSchema = z.object({
  url: z.string().url(),
  max_length: z.number().int().min(300).max(20000).optional(),
})

const readDocumentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).optional(),
})

export const postReadUrl = async (req, res, next) => {
  try {
    const payload = readUrlSchema.parse(req.body)
    const result = await readWebUrl(payload)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const postReadDocument = async (req, res, next) => {
  try {
    const file = req.file

    if (!file?.buffer) {
      const error = new Error('Document file is required. Send multipart/form-data with field name "file".')
      error.status = 400
      error.code = 'DOCUMENT_FILE_REQUIRED'
      throw error
    }

    const { page = 1 } = readDocumentQuerySchema.parse(req.query)

    const result = await readUploadedDocument({
      fileBuffer: file.buffer,
      filename: file.originalname,
      page,
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}
