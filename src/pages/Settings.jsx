import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getPreferences, updatePreferences } from '@/api/preferences'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  FONT_SIZES,
  DETAIL_LEVELS,
  WALK_TARGET_FPS_MAX,
  WALK_TARGET_FPS_MIN,
} from '@/lib/constants'

const _MOTION = motion

const schema = z.object({
  fontSize: z.enum(FONT_SIZES),
  detailLevel: z.enum(DETAIL_LEVELS),
  voiceSpeed: z.number().min(0.5).max(2),
  walkTargetFps: z.number().min(WALK_TARGET_FPS_MIN).max(WALK_TARGET_FPS_MAX),
  walkAdaptiveScheduling: z.boolean(),
})

const FONT_LABELS = { normal: 'Normal', large: 'Large', xl: 'Extra Large' }
const DETAIL_LABELS = { brief: 'Brief', standard: 'Standard', detailed: 'Detailed' }
const PREFERENCES_USER_ID = 'vision-frontend-user'

export const Settings = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const {
    isConnected,
    fontSize,
    detailLevel,
    voiceSpeed,
    walkTargetFps,
    walkAdaptiveScheduling,
    setFontSize,
    setDetailLevel,
    setVoiceSpeed,
    setWalkTargetFps,
    setWalkAdaptiveScheduling,
  } = useAppStore()
  const authUser = useAuthStore((state) => state.user)
  const preferencesUserId = authUser?.id ?? PREFERENCES_USER_ID
  const [saveMessage, setSaveMessage] = useState('')
  const [saveType, setSaveType] = useState('success')

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitSuccessful, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fontSize,
      detailLevel,
      voiceSpeed,
      walkTargetFps,
      walkAdaptiveScheduling,
    },
  })

  const watchedFontSize = useWatch({ control, name: 'fontSize' })
  const watchedDetailLevel = useWatch({ control, name: 'detailLevel' })
  const watchedVoiceSpeed = useWatch({ control, name: 'voiceSpeed' })
  const watchedWalkTargetFps = useWatch({ control, name: 'walkTargetFps' })
  const watchedWalkAdaptiveScheduling = useWatch({ control, name: 'walkAdaptiveScheduling' })
  const displayVoiceSpeed = Number.isFinite(watchedVoiceSpeed) ? watchedVoiceSpeed : voiceSpeed
  const displayWalkTargetFps = Number.isFinite(watchedWalkTargetFps) ? watchedWalkTargetFps : walkTargetFps

  useEffect(() => {
    let mounted = true

    const loadPreferences = async () => {
      if (!isConnected) return

      try {
        const prefs = await getPreferences(preferencesUserId)
        if (!mounted) return

        const nextFont = FONT_SIZES.includes(prefs.font_size) ? prefs.font_size : fontSize
        const nextDetail = DETAIL_LEVELS.includes(prefs.detail_level) ? prefs.detail_level : detailLevel
        const nextSpeed = Number.isFinite(prefs.voice_speed) ? Math.min(2, Math.max(0.5, prefs.voice_speed)) : voiceSpeed

        setFontSize(nextFont)
        setDetailLevel(nextDetail)
        setVoiceSpeed(nextSpeed)

        setValue('fontSize', nextFont, { shouldDirty: false })
        setValue('detailLevel', nextDetail, { shouldDirty: false })
        setValue('voiceSpeed', nextSpeed, { shouldDirty: false })
      } catch {
        if (mounted) {
          setSaveType('warning')
          setSaveMessage('Using local settings. Cloud preferences are currently unavailable.')
        }
      }
    }

    loadPreferences()

    return () => {
      mounted = false
    }
  }, [
    detailLevel,
    fontSize,
    isConnected,
    preferencesUserId,
    setDetailLevel,
    setFontSize,
    setValue,
    setVoiceSpeed,
    voiceSpeed,
  ])

  const onSubmit = async (values) => {
    setFontSize(values.fontSize)
    setDetailLevel(values.detailLevel)
    setVoiceSpeed(values.voiceSpeed)
    setWalkTargetFps(values.walkTargetFps)
    setWalkAdaptiveScheduling(values.walkAdaptiveScheduling)

    if (!isConnected) {
      setSaveType('warning')
      setSaveMessage('Saved locally. Reconnect to sync preferences to cloud.')
      return
    }

    try {
      await updatePreferences(preferencesUserId, {
        font_size: values.fontSize,
        detail_level: values.detailLevel,
        voice_speed: values.voiceSpeed,
        theme: 'dark',
      })
      setSaveType('success')
      setSaveMessage('Settings saved and synced successfully.')
    } catch {
      setSaveType('warning')
      setSaveMessage('Saved locally. Cloud sync failed, please try again later.')
    }
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
              aria-valuenow={displayVoiceSpeed}
              aria-valuetext={`${displayVoiceSpeed.toFixed(1)}x`}
              aria-label="Voice speed"
              {...register('voiceSpeed', { valueAsNumber: true })}
              className="flex-1 accent-[#A9D1F5] h-2 rounded-full cursor-pointer"
            />
            <span className="text-[#7A8B9B] font-body text-sm w-12 text-right">{displayVoiceSpeed.toFixed(1)}×</span>
          </div>
        </Card>

        {/* Realtime walk mode scheduling */}
        <Card>
          <label
            htmlFor="walk-fps"
            className="font-display font-semibold text-[#E9EEF4] text-base block mb-4"
          >
            Walk Mode Target FPS
          </label>
          <div className="flex items-center gap-4">
            <span className="text-[#7A8B9B] font-body text-sm w-10">{WALK_TARGET_FPS_MIN.toFixed(1)}</span>
            <input
              id="walk-fps"
              type="range"
              min={WALK_TARGET_FPS_MIN}
              max={WALK_TARGET_FPS_MAX}
              step={0.1}
              aria-valuemin={WALK_TARGET_FPS_MIN}
              aria-valuemax={WALK_TARGET_FPS_MAX}
              aria-valuenow={displayWalkTargetFps}
              aria-valuetext={`${displayWalkTargetFps.toFixed(1)} frames per second`}
              aria-label="Walk mode target frames per second"
              {...register('walkTargetFps', { valueAsNumber: true })}
              className="flex-1 accent-[#A9D1F5] h-2 rounded-full cursor-pointer"
            />
            <span className="text-[#7A8B9B] font-body text-sm w-14 text-right">{displayWalkTargetFps.toFixed(1)} fps</span>
          </div>
          <p className="mt-3 text-xs text-[#7A8B9B] font-body">
            Higher FPS gives faster updates but can increase backend/API load.
          </p>

          <label className="mt-4 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              aria-label="Enable adaptive walk mode slowdown"
              {...register('walkAdaptiveScheduling')}
              className="mt-0.5 h-4 w-4 rounded border-[#2F3C4C] bg-[#0B121B] text-[#A9D1F5] focus:ring-[#A9D1F5]"
            />
            <span>
              <span className="block text-sm text-[#E9EEF4] font-body font-medium">Adaptive scheduling</span>
              <span className="block text-xs text-[#7A8B9B] font-body mt-1">
                {watchedWalkAdaptiveScheduling
                  ? 'Enabled: auto-slows capture interval when processing is under load.'
                  : 'Disabled: uses fixed frame interval at all times.'}
              </span>
            </span>
          </label>
        </Card>

        <Button type="submit" isLoading={isSubmitting} leftIcon={<Check size={18} aria-hidden="true" />}>
          Save Settings
        </Button>

        {isSubmitSuccessful && saveMessage && (
          <motion.p
            initial={prefersReduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            aria-live="polite"
            className={[
              'font-body text-sm text-center',
              saveType === 'success' ? 'text-[#00D4AA]' : 'text-[#FFB347]',
            ].join(' ')}
          >
            {saveMessage}
          </motion.p>
        )}
      </form>
    </main>
  )
}
