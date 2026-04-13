import { paginateDocumentText, parseDocumentContent } from '../utils/documentParse.js'

/**
 * @param {{ fileBuffer: Buffer, filename?: string, page?: number }} payload
 * @returns {Promise<{ title: string, total_pages: number, current_page: number, text: string, has_next: boolean }>}
 */
export const readUploadedDocument = async ({ fileBuffer, filename, page = 1 }) => {
  const parsed = await parseDocumentContent({
    buffer: fileBuffer,
    filename,
  })

  const pageResult = paginateDocumentText({
    text: parsed.text,
    page,
  })

  return {
    title: parsed.title,
    ...pageResult,
  }
}
