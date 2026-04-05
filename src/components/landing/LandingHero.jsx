import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Copy, Handshake, Mic, Smile, Sparkles } from 'lucide-react'
import { PwaFloating } from '@/components/landing/PwaFloating'
import { RoomIllustration } from '@/components/landing/RoomIllustration'
import { VoiceWaveform } from '@/components/landing/VoiceWaveform'
import { ROUTES } from '@/lib/constants'

/** Elevated tiles behind the main card */
const CARD_BASE =
  'rounded-2xl border border-[#2F3C4C] bg-[#161F2C] shadow-[0_10px_28px_rgba(9,20,36,0.22)]'

/** Main feature — pops above Voice (higher z-index, deeper shadow, slight lift) */
const MAIN_FLOAT =
  'rounded-2xl border border-[#3d4f66] bg-[#161F2C] z-30 ' +
  'shadow-[0_32px_70px_rgba(2,6,14,0.62),0_14px_36px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]'

const cardInner = 'flex flex-col h-full min-h-0 overflow-hidden'

export const LandingHero = () => {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const reveal = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay },
        }

  return (
    <section
      id="features"
      className="relative bg-[#0B121B] pt-20 pb-36 lg:pb-44 overflow-x-hidden lg:overflow-x-visible"
      aria-label="Vision landing hero"
    >
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Left ~2/3, right ~1/3; Voice wider & under main overlap on lg+ */}
        <div id="technology" className="relative isolate grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-x-5 xl:gap-x-6 lg:items-start">
          <div className="lg:col-span-6 flex flex-col gap-6 lg:gap-8 min-w-0 lg:pr-2">
            <motion.h1
              {...reveal(0)}
              className="font-display font-extrabold text-[#E9EEF4] text-4xl sm:text-5xl lg:text-5xl xl:text-6xl leading-[1.04] tracking-tight uppercase"
            >
              Your World,
              <br />
              Described.
              <br />
              Beyond the Surface.
            </motion.h1>

            <motion.p {...reveal(0.06)} className="font-body text-[#7A8B9B] text-base sm:text-lg leading-relaxed max-w-2xl">
              An AI that remembers your surroundings and reads social cues for running context, not isolated snapshots.
            </motion.p>

            <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-5 relative lg:-mr-2 xl:-mr-4">
              {/* Social — same height as Voice on sm+ (row stretch); stacked mobile uses same aspect as Voice */}
              <motion.article
                {...reveal(0.12)}
                className={`relative z-20 w-full max-w-[20rem] mx-auto aspect-[2.2/1] sm:mx-0 sm:aspect-auto sm:h-full sm:min-h-0 sm:w-[38%] sm:max-w-[15.5rem] sm:shrink-0 ${CARD_BASE} p-5 sm:p-6 ${cardInner}`}
              >
                <div className="flex items-center gap-2.5 text-[#A9D1F5] shrink-0" aria-hidden="true">
                  <Smile className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
                  <Handshake className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
                </div>
                <h3 className="mt-2 sm:mt-3 font-display font-bold text-[#E9EEF4] text-sm sm:text-base leading-snug shrink-0">
                  Social &amp; Emotional Cues
                </h3>
                <p className="mt-1.5 sm:mt-2 font-body text-[#7A8B9B] text-xs sm:text-sm leading-relaxed flex-1 min-h-0 overflow-hidden line-clamp-2 sm:line-clamp-3">
                  Describes not just objects, but human expressions and interpersonal situations.
                </p>
              </motion.article>

              {/* Voice — defines row height via aspect; wider than Social */}
              <motion.article
                {...reveal(0.16)}
                className={`relative z-10 flex-1 min-w-0 w-full aspect-[2.2/1] sm:aspect-[2.45/1] lg:aspect-[2.65/1] sm:min-h-0 ${CARD_BASE} p-5 sm:p-6 ${cardInner}`}
              >
                <div className="flex items-end gap-2 sm:gap-3 shrink-0 min-h-0" aria-hidden="true">
                  <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-[#E9EEF4] shrink-0" strokeWidth={1.5} />
                  <VoiceWaveform className="h-7 sm:h-8 w-full max-w-none min-w-0 flex-1" />
                </div>
                <h3 className="mt-3 sm:mt-4 font-display font-bold text-[#E9EEF4] text-sm sm:text-base leading-snug shrink-0">
                  Voice-First Interface
                </h3>
                <p className="mt-2 font-body text-[#7A8B9B] text-xs sm:text-sm leading-relaxed flex-1 min-h-0 overflow-hidden line-clamp-3">
                  Real-time scene descriptions generated through voice command.
                </p>
              </motion.article>
            </div>
          </div>

          {/* Main card — larger; shifts over Voice for clear overlap */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end lg:pt-0 min-w-0 overflow-visible">
            <motion.article
              {...reveal(0.08)}
              className={`w-full max-w-md lg:max-w-none lg:w-[min(100%,28.5rem)] xl:w-[min(100%,31rem)] flex flex-col min-h-[18rem] lg:min-h-0 p-5 sm:p-6 lg:p-7 overflow-hidden ${MAIN_FLOAT} ${prefersReducedMotion ? '' : 'lg:-translate-x-[3.25rem] xl:-translate-x-[4.75rem] lg:translate-y-5 xl:translate-y-6'}`}
            >
              <div className={cardInner}>
                <div className="rounded-xl border border-[#2F3C4C] overflow-hidden bg-[#101B28] shrink-0">
                  <div className="aspect-[16/10] w-full">
                    <RoomIllustration />
                  </div>
                </div>
                <div className="mt-4 sm:mt-5 flex items-start justify-between gap-3 min-h-0 shrink-0">
                  <div className="min-w-0">
                    <h2 className="font-display font-semibold text-[#E9EEF4] text-base sm:text-lg leading-tight">
                      Persistent Spatial Memory
                    </h2>
                    <p className="font-body text-[#7A8B9B] text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed">
                      Builds a persistent memory of your environment across each session.
                    </p>
                  </div>
                  <Copy className="w-4 h-4 text-[#7A8B9B] shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                </div>
              </div>
            </motion.article>
          </div>
        </div>

        <motion.div {...reveal(0.32)} className="mt-7 sm:mt-8 lg:mt-10 flex flex-wrap justify-center gap-6">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DESCRIBE)}
            className="font-body font-semibold text-sm text-[#0B121B] bg-[#A9D1F5] hover:bg-[#93c4ef] px-8 py-3 rounded-lg transition-colors min-h-touch focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B]"
            aria-label="Get started with Vision for free"
          >
            GET STARTED FREE
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.DESCRIBE)}
            className="font-body font-semibold text-sm text-[#E9EEF4] border border-[#5B6B7C] bg-transparent hover:border-[#7A8B9B] hover:bg-[#161F2C]/80 px-8 py-3 rounded-lg transition-colors min-h-touch focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B]"
            aria-label="Explore the Vision demo"
          >
            EXPLORE DEMO
          </button>
        </motion.div>
      </div>

      <PwaFloating />

      <div className="fixed bottom-5 right-4 sm:right-8 z-30 pointer-events-none text-[#7A8B9B]" aria-hidden="true">
        <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.25} />
      </div>
    </section>
  )
}
