import client from './client'

/**
 * @param {string} credential
 * @returns {Promise<{ success: boolean, user: { id: string, email?: string, name?: string, picture?: string }, verified?: boolean, mode?: string }>}
 */
export const loginWithGoogle = async (credential) => {
  const { data } = await client.post('/auth/google', { credential })
  return data
}
