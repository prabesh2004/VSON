import client from './client'

/**
 * @param {{ url: string, max_length?: number }} payload
 * @returns {Promise<{ title: string, text: string, word_count: number }>}
 */
export const readUrl = async ({ url, max_length }) => {
  const { data } = await client.post('/read-url', { url, max_length })
  return data
}

/**
 * @param {FormData} formData - must contain a 'file' field
 * @param {number} [page]
 * @returns {Promise<{ title: string, total_pages: number, current_page: number, text: string, has_next: boolean }>}
 */
export const readDocument = async (formData, page = 1) => {
  const { data } = await client.post(`/read-document?page=${page}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
