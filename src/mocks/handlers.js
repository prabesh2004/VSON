import { http, HttpResponse } from 'msw'

const endpoint = (path) => new RegExp(`/${path}(?:\\?.*)?$`)
const endpointWithId = (path) => new RegExp(`/${path}/[^/?#]+(?:\\?.*)?$`)

export const handlers = [
  // POST /describe
  http.post(endpoint('describe'), async () => {
    await delay(800)
    return HttpResponse.json({
      description:
        'A brightly lit indoor space. There is a wooden desk with a laptop, a glass of water, and a houseplant in the foreground. Natural daylight is streaming through a window on the right side of the frame.',
      confidence: 0.92,
    })
  }),

  // POST /read-url
  http.post(endpoint('read-url'), async () => {
    await delay(600)
    return HttpResponse.json({
      title: 'Example Article',
      text: 'This is the mock content of the web page. In a real request the backend would fetch and clean the actual page text for you to read.',
      word_count: 30,
    })
  }),

  // POST /read-document
  http.post(endpoint('read-document'), async () => {
    await delay(700)
    return HttpResponse.json({
      title: 'Sample Document',
      total_pages: 3,
      current_page: 1,
      text: 'This is page one of the mock document. The backend would parse your uploaded PDF or text file and return each page on demand.',
      has_next: true,
    })
  }),

  // POST /tts
  http.post(endpoint('tts'), async () => {
    await delay(400)
    // Empty audio — browser TTS should be used first; this is a no-op fallback
    return HttpResponse.json({ audio_base64: '', duration_seconds: 0 })
  }),

  // POST /transcribe
  http.post(endpoint('transcribe'), async () => {
    await delay(500)
    return HttpResponse.json({ transcript: 'describe', confidence: 0.95 })
  }),

  // GET /preferences/:id
  http.get(endpointWithId('preferences'), () => {
    return HttpResponse.json({
      voice_speed: 1,
      detail_level: 'standard',
      font_size: 'normal',
      theme: 'dark',
    })
  }),

  // PUT /preferences/:id
  http.put(endpointWithId('preferences'), async () => {
    await delay(300)
    return HttpResponse.json({ success: true })
  }),

  // GET /health
  http.get(endpoint('health'), () => {
    return HttpResponse.json({ status: 'ok', version: 'mock-1.0.0' })
  }),
]

/** @param {number} ms */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
