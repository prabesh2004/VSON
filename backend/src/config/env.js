import dotenv from 'dotenv'

dotenv.config()

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toProviderList = (value, fallback = '') => {
  const input = value ?? fallback
  return String(input)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const resolveSttProvider = () => {
  const configured = (process.env.STT_PROVIDER ?? 'auto').trim().toLowerCase()
  if (configured === 'auto') {
    return process.env.DEEPGRAM_API_KEY ? 'deepgram' : 'mock'
  }
  return configured
}

const resolveTtsProvider = () => {
  const configured = (process.env.TTS_PROVIDER ?? 'auto').trim().toLowerCase()
  if (configured === 'auto') {
    return process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'google-translate'
  }
  return configured
}

const buildMongoUri = () => {
  const username = process.env.MONGODB_USERNAME
  const password = process.env.MONGODB_PASSWORD
  const mongoUri = process.env.MONGODB_URI?.trim()
  const host = process.env.MONGODB_HOST ?? 'cluster0.lx4fhf9.mongodb.net'
  const dbName = process.env.MONGODB_DB_NAME ?? 'vision'
  const options = process.env.MONGODB_OPTIONS ?? 'retryWrites=true&w=majority&appName=Cluster0'

  if (mongoUri && username && password) {
    throw new Error(
      'Ambiguous Mongo config: use either MONGODB_URI or MONGODB_USERNAME+MONGODB_PASSWORD, not both.'
    )
  }

  if (username && password) {
    return `mongodb+srv://${username}:${encodeURIComponent(password)}@${host}/${dbName}?${options}`
  }

  return mongoUri ?? ''
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 8000),
  mongoUri: buildMongoUri(),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  requestLimit: process.env.REQUEST_LIMIT ?? '10mb',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  apiTimeoutMs: toNumber(process.env.API_TIMEOUT_MS, 30000),
  visionProvider: process.env.VISION_PROVIDER ?? (process.env.GEMINI_API_KEY ? 'gemini' : 'mock'),
  geminiApiKey: (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '').trim().replace(/^['"]|['"]$/g, ''),
  geminiModel: (process.env.GEMINI_MODEL ?? 'gemini-2.5-flash').trim(),
  geminiLiveModel: (process.env.GEMINI_LIVE_MODEL ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash').trim(),
  groqApiKey: (process.env.GROQ_API_KEY ?? process.env.GORQ_API_KEY ?? '').trim().replace(/^['"]|['"]$/g, ''),
  groqModel: (process.env.GROQ_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct').trim(),
  openRouterApiKey: (process.env.OPENROUTER_API_KEY ?? process.env.GEMA_API_KEY ?? process.env.GEMMA_API_KEY ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, ''),
  openRouterModel: (process.env.OPENROUTER_MODEL ?? 'google/gemma-4-26b-a4b-it:free').trim(),
  sttProvider: resolveSttProvider(),
  sttFallbackProviders: toProviderList(process.env.STT_FALLBACKS, ''),
  deepgramApiKey: (process.env.DEEPGRAM_API_KEY ?? '').trim().replace(/^['"]|['"]$/g, ''),
  deepgramModel: (process.env.DEEPGRAM_MODEL ?? 'nova-2').trim(),
  ttsProvider: resolveTtsProvider(),
  ttsFallbackProviders: toProviderList(process.env.TTS_FALLBACKS, 'google-translate'),
  elevenLabsApiKey: (process.env.ELEVENLABS_API_KEY ?? '').trim().replace(/^['"]|['"]$/g, ''),
  elevenLabsVoiceId: (process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL').trim(),
  elevenLabsModelId: (process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2').trim(),
  sttMockTranscript: process.env.STT_MOCK_TRANSCRIPT ?? '',
}
