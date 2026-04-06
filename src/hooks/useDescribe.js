import { useMutation } from '@tanstack/react-query'
import { describeImage } from '@/api/describe'
import { hashBase64 } from '@/lib/utils'
import { QUERY_RETRY_COUNT } from '@/lib/constants'

/**
 * @typedef {Object} UseDescribeReturn
 * @property {(payload: { image: string, detail_level?: string }) => void} describe
 * @property {(payload: { image: string, detail_level?: string }) => Promise<{ description: string, confidence: number }>} describeAsync
 * @property {{ description: string, confidence: number }|undefined} data
 * @property {boolean} isPending
 * @property {{ message: string }|null} error
 * @property {() => void} reset
 */

/**
 * @returns {UseDescribeReturn}
 */
export const useDescribe = () => {
  const { mutate, mutateAsync, data, isPending, error, reset } = useMutation({
    mutationFn: describeImage,
    mutationKey: ['describe'],
    retry: QUERY_RETRY_COUNT,
    meta: { imageHash: null },
  })

  const describe = ({ image, detail_level = 'standard' }) => {
    const hash = hashBase64(image)
    mutate({ image, detail_level, _hash: hash })
  }

  const describeAsync = ({ image, detail_level = 'standard' }) => {
    const hash = hashBase64(image)
    return mutateAsync({ image, detail_level, _hash: hash })
  }

  return {
    describe,
    describeAsync,
    data,
    isPending,
    error,
    reset,
  }
}
