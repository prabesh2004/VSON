import path from 'node:path'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

const wordsPerPage = 450

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim()

const getTitleFromFilename = (filename) => {
  if (!filename) {
    return 'Document'
  }

  const ext = path.extname(filename)
  return path.basename(filename, ext) || 'Document'
}

const parseTextBuffer = (buffer) => {
  return normalizeWhitespace(buffer.toString('utf8'))
}

const parsePdfBuffer = async (buffer) => {
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    return normalizeWhitespace(result.text || '')
  } finally {
    await parser.destroy()
  }
}

const parseDocxBuffer = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer })
  return normalizeWhitespace(result.value || '')
}

const buildPages = (text) => {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return []
  }

  const pages = []
  for (let index = 0; index < words.length; index += wordsPerPage) {
    pages.push(words.slice(index, index + wordsPerPage).join(' '))
  }

  return pages
}

export const parseDocumentContent = async ({ buffer, filename }) => {
  const ext = path.extname(filename || '').toLowerCase()

  if (ext === '.txt') {
    return {
      title: getTitleFromFilename(filename),
      text: parseTextBuffer(buffer),
    }
  }

  if (ext === '.pdf') {
    return {
      title: getTitleFromFilename(filename),
      text: await parsePdfBuffer(buffer),
    }
  }

  if (ext === '.docx') {
    return {
      title: getTitleFromFilename(filename),
      text: await parseDocxBuffer(buffer),
    }
  }

  const error = new Error('Unsupported document type. Use PDF, TXT, or DOCX.')
  error.status = 415
  error.code = 'DOCUMENT_TYPE_UNSUPPORTED'
  throw error
}

export const paginateDocumentText = ({ text, page }) => {
  const pages = buildPages(text)

  if (pages.length === 0) {
    const error = new Error('Document contains no readable text.')
    error.status = 422
    error.code = 'DOCUMENT_TEXT_EMPTY'
    throw error
  }

  const totalPages = pages.length
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages)

  return {
    total_pages: totalPages,
    current_page: safePage,
    text: pages[safePage - 1],
    has_next: safePage < totalPages,
  }
}
