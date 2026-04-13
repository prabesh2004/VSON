import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Convert a canvas or video frame to a base64-encoded JPEG string.
 * @param {HTMLCanvasElement} canvas
 * @param {number} [quality=0.85]
 * @returns {string} base64 string without the data URI prefix
 */
export const canvasToBase64 = (canvas, quality = 0.85) => {
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return dataUrl.split(',')[1]
}

/**
 * Play a base64-encoded audio string in the browser.
 * @param {string} base64Audio
 * @returns {Promise<void>}
 */
export const playBase64Audio = (base64Audio) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`)
    audio.onended = resolve
    audio.onerror = reject
    audio.play().catch(reject)
  })
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * Format a word count into a human-readable string.
 * @param {number} count
 * @returns {string}
 */
export const formatWordCount = (count) => {
  if (count < 1000) return `${count} words`
  return `${(count / 1000).toFixed(1)}k words`
}

/**
 * Truncate text to a maximum length, appending an ellipsis.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Generate a hash string from a base64 image for React Query caching.
 * @param {string} base64
 * @returns {string}
 */
export const hashBase64 = (base64) => {
  let hash = 0
  const sample = base64.slice(0, 200)
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash.toString(36)
}

/**
 * Merge conditional class names using clsx + tailwind-merge.
 * @param {...any} inputs
 * @returns {string}
 */
export const cn = (...inputs) => twMerge(clsx(inputs))
