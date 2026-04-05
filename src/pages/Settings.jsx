import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAppStore } from '@/store/useAppStore'
import { FONT_SIZES, DETAIL_LEVELS } from '@/lib/constants'

const schema = z.object({
  fontSize: z.enum(FONT_SIZES),
  detailLevel: z.enum(DETAIL_LEVELS),
  voiceSpeed: z.number().min(0.5).max(2),
})

const FONT_LABELS = { normal: 'Normal', large: 'Large', xl: 'Extra Large' }
const DETAIL_LABELS = { brief: 'Brief', standard: 'Standard', detailed: 'Detailed' }

export const Settings = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const { fontSize, setFontSize } = useAppStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitSuccessful },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fontSize,
      detailLevel: 'standard',
      voiceSpeed: 1,
    },
  })

  const watchedFontSize = watch('fontSize')
  const watchedDetailLevel = watch('detailLevel')

  const onSubmit = (values) => {
    setFontSize(values.fontSize)
  }

  return (
    <main id="main-content" className="min-h-dvh bg-[#0B121B] px-4 py-6 max-w-lg mx-auto flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={18} aria-hidden="true" />}
          onClick={() => navigate(-1)}
          ariaLabel="Go back to home"
        >
          Back
        </Button>
        <h1 className="font-display text-xl font-semibold text-[#E9EEF4]">Settings</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        {/* Font size */}
        <Card>
          <fieldset>
            <legend className="font-display font-semibold text-[#E9EEF4] text-base mb-4">
              Font Size
            </legend>
            <div className="flex gap-3" role="group" aria-label="Select font size">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setValue('fontSize', size)}
                  aria-pressed={watchedFontSize === size}
                  aria-label={`Font size: ${FONT_LABELS[size]}`}
                  className={[
                    'flex-1 py-3 rounded-xl font-body font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161F2C]',
                    watchedFontSize === size
                      ? 'bg-[#A9D1F5] text-[#0B121B]'
                      : 'bg-[#0B121B] text-[#7A8B9B] hover:text-[#E9EEF4]',
                    size === 'normal' ? 'text-sm' : size === 'large' ? 'text-base' : 'text-lg',
                  ].join(' ')}
                >
                  {FONT_LABELS[size]}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('fontSize')} />
          </fieldset>
        </Card>

        {/* Detail level */}
        <Card>
          <fieldset>
            <legend className="font-display font-semibold text-[#E9EEF4] text-base mb-4">
              Scene Description Detail
            </legend>
            <div className="flex gap-3" role="group" aria-label="Select scene description detail level">
              {DETAIL_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setValue('detailLevel', level)}
                  aria-pressed={watchedDetailLevel === level}
                  aria-label={`Detail level: ${DETAIL_LABELS[level]}`}
                  className={[
                    'flex-1 py-3 rounded-xl font-body text-sm font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161F2C]',
                    watchedDetailLevel === level
                      ? 'bg-[#A9D1F5] text-[#0B121B]'
                      : 'bg-[#0B121B] text-[#7A8B9B] hover:text-[#E9EEF4]',
                  ].join(' ')}
                >
                  {DETAIL_LABELS[level]}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('detailLevel')} />
          </fieldset>
        </Card>

        {/* Voice speed */}
        <Card>
          <label
            htmlFor="voice-speed"
            className="font-display font-semibold text-[#E9EEF4] text-base block mb-4"
          >
            Voice Speed
          </label>
          <div className="flex items-center gap-4">
            <span className="text-[#7A8B9B] font-body text-sm w-8">0.5×</span>
            <input
              id="voice-speed"
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-label="Voice speed"
              {...register('voiceSpeed', { valueAsNumber: true })}
              className="flex-1 accent-[#A9D1F5] h-2 rounded-full cursor-pointer"
            />
            <span className="text-[#7A8B9B] font-body text-sm w-8">2×</span>
          </div>
        </Card>

        <Button type="submit" leftIcon={<Check size={18} aria-hidden="true" />}>
          Save Settings
        </Button>

        {isSubmitSuccessful && (
          <motion.p
            initial={prefersReduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            aria-live="polite"
            className="text-[#00D4AA] font-body text-sm text-center"
          >
            Settings saved successfully.
          </motion.p>
        )}
      </form>
    </main>
  )
}
