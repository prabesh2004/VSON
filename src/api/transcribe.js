import client from './client'

/**
 * @param {Blob} audioBlob
 * @returns {Promise<{ transcript: string, confidence: number }>}
 */
export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  const { data } = await client.post('/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
