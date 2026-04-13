import { env } from '../config/env.js'
import { extractReadableWebContent } from '../utils/contentExtract.js'

const ensureHttpUrl = (value) => {
  const parsed = new URL(value)

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    const error = new Error('Only http and https URLs are supported.')
    error.status = 400
    error.code = 'URL_PROTOCOL_NOT_SUPPORTED'
    throw error
  }

  return parsed
}

/**
 * @param {{ url: string, max_length?: number }} payload
 * @returns {Promise<{ title: string, text: string, word_count: number }>}
 */
export const readWebUrl = async ({ url, max_length = 2000 }) => {
  const parsedUrl = ensureHttpUrl(url)
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), env.apiTimeoutMs)

  try {
    const response = await fetch(parsedUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: timeoutController.signal,
      headers: {
        'User-Agent': 'vision-reader/1.0',
      },
    })

    if (!response.ok) {
      const error = new Error(`Failed to read URL. Upstream status: ${response.status}`)
      error.status = 502
      error.code = 'WEBPAGE_FETCH_FAILED'
      throw error
    }

    const html = await response.text()

    return extractReadableWebContent({
      html,
      fallbackTitle: parsedUrl.hostname,
      maxLength: max_length,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Reading URL timed out. Try again.')
      timeoutError.status = 504
      timeoutError.code = 'WEBPAGE_FETCH_TIMEOUT'
      throw timeoutError
    }

    if (!Number.isInteger(error?.status)) {
      const fetchError = new Error('Unable to fetch the URL from the server environment.')
      fetchError.status = 502
      fetchError.code = 'WEBPAGE_FETCH_ERROR'
      throw fetchError
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
