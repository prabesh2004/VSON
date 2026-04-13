import { transcribeVoice } from '../services/transcribe.service.js'

export const postTranscribe = async (req, res, next) => {
  try {
    const file = req.file

    if (!file?.buffer) {
      const error = new Error('Audio file is required. Send multipart/form-data with field name "audio".')
      error.status = 400
      error.code = 'AUDIO_FILE_REQUIRED'
      throw error
    }

    const result = await transcribeVoice({
      audioBuffer: file.buffer,
      mimeType: file.mimetype,
    })

    res.json({
      transcript: result.transcript,
      confidence: result.confidence,
    })
  } catch (error) {
    next(error)
  }
}
