import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../config/env.js'

const genAI = new GoogleGenerativeAI(env.geminiApiKey)
const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions'

const normalizeModelName = (model) => model.replace(/^models\//, '')

const VISION_SYSTEM_INSTRUCTION = `You are Vision, an AI assistant built for visually impaired users.
Describe surroundings clearly and immediately.
Use direct, plain language.
Lead with important information first.
Mention hazards, people, obstacles, text, and spatial positions.
Do not say "I can see" or "the image shows".`

const detailPrompts = {
  brief:
    'Give a brief 1-2 sentence description for a blind user. Focus on key objects, hazards, and text.',
  standard:
    'Give a concise scene description with key objects, positions, hazards, and visible text.',
  detailed:
    'Give a detailed 3-5 sentence description for a blind user. Include spatial layout, text, people, expressions, and safety cues.',
}

const fallbackConfidenceByDetail = {
  brief: 0.84,
  standard: 0.9,
  detailed: 0.94,
}

const stripDataUrlPrefix = (base64) => {
  if (!base64.startsWith('data:')) {
    return base64
  }

  const commaIndex = base64.indexOf(',')
  return commaIndex > -1 ? base64.slice(commaIndex + 1) : base64
}

const ensureDataUrl = (base64) => {
  if (base64.startsWith('data:')) {
    return base64
  }

  return `data:image/jpeg;base64,${stripDataUrlPrefix(base64)}`
}

const isGeminiRateLimited = (error) => {
  const status = Number(error?.status)
  if (status === 429) {
    return true
  }

  const message = error?.message ?? ''
  return /RESOURCE_EXHAUSTED|quota|rate limit|too many requests|429/i.test(message)
}

const extractGroqText = (content) => {
  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part.text === 'string') return part.text
        return ''
      })
      .join('')
      .trim()
  }

  return ''
}

const extractOpenRouterText = (content) => {
  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part.text === 'string') return part.text
        return ''
      })
      .join('')
      .trim()
  }

  return ''
}

const callGroqFallback = async ({ imageBase64, prompt }) => {
  if (!env.groqApiKey) {
    const error = new Error('Groq fallback is not configured. Set GROQ_API_KEY (or GORQ_API_KEY) in backend/.env.')
    error.status = 500
    error.code = 'GROQ_API_KEY_MISSING'
    throw error
  }

  const response = await withTimeout(
    fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 1,
        top_p: 1,
        max_completion_tokens: 1024,
        stream: false,
        messages: [
          {
            role: 'system',
            content: VISION_SYSTEM_INSTRUCTION,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: ensureDataUrl(imageBase64),
                },
              },
            ],
          },
        ],
      }),
    }),
    env.apiTimeoutMs
  )

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    const error = new Error(`Groq fallback request failed${details ? `: ${details}` : '.'}`)
    error.status = response.status || 502
    error.code = response.status === 429 ? 'GROQ_RATE_LIMITED' : 'GROQ_PROVIDER_ERROR'
    throw error
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  const text = extractGroqText(content)

  if (!text) {
    const error = new Error('Groq fallback returned an empty description.')
    error.status = 502
    error.code = 'GROQ_EMPTY_RESPONSE'
    throw error
  }

  return text
}

const callOpenRouterFallback = async ({ imageBase64, prompt }) => {
  if (!env.openRouterApiKey) {
    const error = new Error(
      'OpenRouter fallback is not configured. Set OPENROUTER_API_KEY (or GEMA_API_KEY) in backend/.env.'
    )
    error.status = 500
    error.code = 'OPENROUTER_API_KEY_MISSING'
    throw error
  }

  const response = await withTimeout(
    fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.openRouterModel,
        temperature: 1,
        top_p: 1,
        max_tokens: 1024,
        stream: false,
        messages: [
          {
            role: 'system',
            content: VISION_SYSTEM_INSTRUCTION,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: ensureDataUrl(imageBase64),
                },
              },
            ],
          },
        ],
      }),
    }),
    env.apiTimeoutMs
  )

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    const error = new Error(`OpenRouter fallback request failed${details ? `: ${details}` : '.'}`)
    error.status = response.status || 502
    error.code = response.status === 429 ? 'OPENROUTER_RATE_LIMITED' : 'OPENROUTER_PROVIDER_ERROR'
    throw error
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  const text = extractOpenRouterText(content)

  if (!text) {
    const error = new Error('OpenRouter fallback returned an empty description.')
    error.status = 502
    error.code = 'OPENROUTER_EMPTY_RESPONSE'
    throw error
  }

  return text
}

const withTimeout = async (promise, timeoutMs) => {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error('Vision provider timed out.')
      error.status = 504
      error.code = 'VISION_PROVIDER_TIMEOUT'
      reject(error)
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

const parseStructuredDescribe = (rawText) => {
  if (!rawText) return null

  const withoutFences = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(withoutFences)
  } catch {
    const firstBrace = withoutFences.indexOf('{')
    const lastBrace = withoutFences.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      return null
    }

    try {
      return JSON.parse(withoutFences.slice(firstBrace, lastBrace + 1))
    } catch {
      return null
    }
  }
}

const callGemini = async ({ imageBase64, prompt, model }) => {
  try {
    const client = genAI.getGenerativeModel({
      model: normalizeModelName(model),
      systemInstruction: VISION_SYSTEM_INSTRUCTION,
    })

    const result = await withTimeout(
      client.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: stripDataUrlPrefix(imageBase64),
          },
        },
        { text: prompt },
      ]),
      env.apiTimeoutMs
    )

    return result?.response?.text()?.trim() ?? ''
  } catch (error) {
    if (isGeminiRateLimited(error)) {
      let groqError = null

      if (env.groqApiKey) {
        try {
          return await callGroqFallback({ imageBase64, prompt })
        } catch (fallbackError) {
          groqError = fallbackError
        }
      }

      if (env.openRouterApiKey) {
        return callOpenRouterFallback({ imageBase64, prompt })
      }

      if (groqError) {
        throw groqError
      }

      const rateLimitError = new Error(
        'Gemini rate limit reached and no fallback key is configured. Set GORQ_API_KEY and/or GEMA_API_KEY in backend/.env.'
      )
      rateLimitError.status = 429
      rateLimitError.code = 'VISION_RATE_LIMIT_NO_FALLBACK'
      throw rateLimitError
    }

    if (error?.status && error?.code) {
      throw error
    }

    const rawMessage = error?.message ?? 'Vision provider failed.'

    if (/API_KEY_INVALID|API key not valid/i.test(rawMessage)) {
      const authError = new Error(
        'Gemini API key is invalid. Regenerate a key in Google AI Studio, set GEMINI_API_KEY in backend/.env, then restart backend.'
      )
      authError.status = 401
      authError.code = 'GEMINI_API_KEY_INVALID'
      throw authError
    }

    if (/not found.*generateContent|is not found for API version/i.test(rawMessage)) {
      const modelError = new Error(
        'Configured Gemini model is not supported for generateContent. Use GEMINI_MODEL=gemini-2.5-flash (or another supported model).'
      )
      modelError.status = 400
      modelError.code = 'GEMINI_MODEL_NOT_SUPPORTED'
      throw modelError
    }

    const providerError = new Error(rawMessage)
    providerError.status = 502
    providerError.code = 'VISION_PROVIDER_ERROR'
    throw providerError
  }
}

/**
 * @param {{ imageBase64: string, detailLevel: 'brief'|'standard'|'detailed' }} input
 * @returns {Promise<{ description: string, confidence: number }>}
 */
export const describeImage = async ({ imageBase64, detailLevel }) => {
  const detailPrompt = detailPrompts[detailLevel] ?? detailPrompts.standard
  const prompt = [
    detailPrompt,
    'Return JSON only with shape {"description":"...","confidence":0.0}.',
    'confidence must be a decimal between 0 and 1.',
  ].join(' ')

  const responseText = await callGemini({
    imageBase64,
    prompt,
    model: env.geminiLiveModel || env.geminiModel,
  })

  const parsed = parseStructuredDescribe(responseText)
  const description =
    typeof parsed?.description === 'string' && parsed.description.trim().length > 0
      ? parsed.description.trim()
      : responseText

  if (!description) {
    const error = new Error('Vision provider returned an empty description.')
    error.status = 502
    error.code = 'VISION_EMPTY_RESPONSE'
    throw error
  }

  const parsedConfidence = Number(parsed?.confidence)
  const confidence = Number.isFinite(parsedConfidence)
    ? Math.min(1, Math.max(0, parsedConfidence))
    : fallbackConfidenceByDetail[detailLevel] ?? fallbackConfidenceByDetail.standard

  return { description, confidence }
}

/**
 * @param {{ imageBase64: string }} input
 * @returns {Promise<{ description: string }>}
 */
export const describeSocialContext = async ({ imageBase64 }) => {
  const prompt =
    'Describe people and social/emotional context for a blind user. Include approximate positions, expressions, body language, and social atmosphere. If no people are present, say so briefly.'

  const description = await callGemini({
    imageBase64,
    prompt,
    model: env.geminiModel,
  })

  return {
    description: description || 'No clear social cues detected in this scene.',
  }
}

/**
 * @param {{ imageBase64: string }} input
 * @returns {Promise<{ text: string }>}
 */
export const readTextInScene = async ({ imageBase64 }) => {
  const prompt =
    'Read all text visible in this image exactly as written, in top-to-bottom and left-to-right order. If no text is visible, respond with "No text found in this scene."'

  const text = await callGemini({
    imageBase64,
    prompt,
    model: env.geminiModel,
  })

  return {
    text: text || 'No text found in this scene.',
  }
}
