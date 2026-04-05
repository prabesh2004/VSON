import { memo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Globe } from 'lucide-react'
import { readUrl } from '@/api/reader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAppStore } from '@/store/useAppStore'
import { TextDisplay } from './TextDisplay'

const schema = z.object({
  url: z.string().url('Please enter a valid URL (e.g. https://example.com)'),
})

/**
 * @typedef {Object} WebReaderProps
 * @property {(text: string, title: string) => void} [onReadAloud]
 * @property {(content: { text: string, title: string, word_count: number }) => void} [onContentReady]
 */

export const WebReader = memo(
  /**
   * @param {WebReaderProps} props
   */
  function WebReader({ onReadAloud, onContentReady }) {
    const { isConnected } = useAppStore()

    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm({ resolver: zodResolver(schema) })

    const { mutate, data, isPending, error, reset } = useMutation({
      mutationFn: readUrl,
      retry: 1,
    })

    const onSubmit = (values) => {
      if (!isConnected) return
      reset()
      mutate({ url: values.url })
    }

    useEffect(() => {
      if (data && onContentReady) onContentReady(data)
    }, [data, onContentReady])

    return (
      <div className="flex flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="web-url" className="text-sm font-body font-medium text-[#7A8B9B]">
              Website URL
            </label>
            <div className="flex gap-3">
              <input
                id="web-url"
                type="url"
                autoComplete="url"
                placeholder="https://example.com"
                disabled={!isConnected || isPending}
                aria-describedby={errors.url ? 'url-error' : undefined}
                aria-invalid={!!errors.url}
                {...register('url')}
                className={[
                  'flex-1 bg-[#161F2C] text-[#E9EEF4] rounded-xl px-4 py-3 font-body text-base',
                  'border placeholder:text-[#7A8B9B]/60',
                  'focus:outline-none focus:ring-2 focus:ring-[#A9D1F5] focus:ring-offset-2 focus:ring-offset-[#0B121B]',
                  errors.url ? 'border-[#FF6B6B]' : 'border-[#2F3C4C]',
                ].join(' ')}
              />
              <Button
                type="submit"
                disabled={!isConnected}
                isLoading={isPending}
                leftIcon={<Globe size={18} aria-hidden="true" />}
              >
                Read
              </Button>
            </div>
            {errors.url && (
              <p id="url-error" role="alert" className="text-sm text-[#FF6B6B] font-body">
                {errors.url.message}
              </p>
            )}
          </div>
        </form>

        {!isConnected && (
          <p role="status" aria-live="polite" className="text-[#FFB347] font-body text-sm text-center">
            You are offline. Web reading is unavailable until you reconnect.
          </p>
        )}

        {isPending && <Spinner label="Reading webpage…" />}

        {error && (
          <p role="alert" className="text-[#FF6B6B] font-body text-sm text-center">
            {error.message ?? 'Failed to read the page. Please try again.'}
          </p>
        )}

        {data && (
          <div className="flex flex-col gap-3">
            <TextDisplay text={data.text} title={data.title} />
            {onReadAloud && (
              <Button
                variant="secondary"
                onClick={() => onReadAloud(data.text, data.title)}
                ariaLabel={`Read aloud: ${data.title}`}
              >
                Read Aloud
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
