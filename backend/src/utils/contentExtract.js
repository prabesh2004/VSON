import { load } from 'cheerio'

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim()

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text
  }

  const clipped = text.slice(0, maxLength)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trim()}...`
}

export const extractReadableWebContent = ({ html, fallbackTitle, maxLength }) => {
  const $ = load(html)
  $('script, style, noscript, svg, iframe').remove()

  const title = normalizeWhitespace($('title').first().text()) || fallbackTitle
  const bodyText = normalizeWhitespace($('body').text())

  if (!bodyText) {
    const error = new Error('No readable content found at this URL.')
    error.status = 422
    error.code = 'WEBPAGE_CONTENT_EMPTY'
    throw error
  }

  const truncated = truncateText(bodyText, maxLength)
  const wordCount = truncated.split(/\s+/).filter(Boolean).length

  return {
    title,
    text: truncated,
    word_count: wordCount,
  }
}
