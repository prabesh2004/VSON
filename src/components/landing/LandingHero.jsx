import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Handshake, Mic, Smile, Sparkles } from 'lucide-react'
import { PwaFloating } from '@/components/landing/PwaFloating'
import { VoiceWaveform } from '@/components/landing/VoiceWaveform'
import mainImage from '@/images/main.png'
import { ROUTES } from '@/lib/constants'

const _MOTION = motion

/** Shared translucent tile style for secondary feature cards */
const CARD_BASE =
  'rounded-[1.1rem] border border-[#2F3C4C] bg-[#161F2C]/92 shadow-[0_10px_24px_rgba(3,10,18,0.36)] backdrop-blur-sm'

/** Main card appears elevated above surrounding tiles */
const MAIN_FLOAT =
  'rounded-[1.1rem] border border-[#2F3C4C] bg-[#161F2C] z-30 ' +
  'shadow-[0_24px_56px_rgba(2,7,16,0.56),0_12px_28px_rgba(2,8,17,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm'

const CHILD_CARD_HEIGHT = 'min-h-[10.5rem] sm:h-[12rem] lg:h-[12.5rem]'

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
      id="home"
      className="relative min-h-dvh overflow-hidden bg-[#0B121B] pt-20 sm:pt-24 lg:pt-24 pb-10 sm:pb-12 lg:pb-10"
      aria-label="Vision landing hero"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(80%_76%_at_20%_12%,rgba(169,209,245,0.14)_0%,rgba(11,18,27,0)_66%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,27,0.88)_0%,rgba(11,18,27,0.24)_34%,rgba(11,18,27,0.82)_100%)]"
      />

      <div className="relative z-10 max-w-[84rem] mx-auto px-5 sm:px-8 lg:px-14 xl:px-16">
        <div className="relative isolate grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-x-5 xl:gap-x-6 lg:items-start overflow-visible">
          <div className="lg:col-span-6 flex flex-col gap-5 lg:gap-5 min-w-0 lg:pr-2 pt-3 sm:pt-4 lg:pt-8">
            <motion.h1
              {...reveal(0)}
              className="font-display font-extrabold text-[#E9EEF4] text-[2rem] sm:text-4xl lg:text-[3rem] xl:text-[3.35rem] leading-[1.2] sm:leading-[1.2] lg:leading-[1.14] tracking-tight uppercase"
            >
              <span className="block">Your World,</span>
              <span className="block mt-2 sm:mt-2 lg:mt-1">Described.</span>
              <span className="block mt-2 sm:mt-2 lg:mt-1">Beyond the</span>
              <span className="block mt-2 sm:mt-2 lg:mt-1">Surface.</span>
            </motion.h1>

            <motion.p
              {...reveal(0.06)}
              className="font-body text-[#7A8B9B] text-base sm:text-lg lg:text-xl leading-[1.34] max-w-[35rem]"
            >
              An AI that remembers your surroundings and reads social cues for running context, not isolated snapshots.
            </motion.p>

            <div className="mt-1 flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-4 relative overflow-visible lg:pr-6 xl:pr-8">
              <motion.article
                {...reveal(0.12)}
                className={`relative z-20 w-full max-w-none sm:max-w-[17rem] sm:shrink-0 ${CHILD_CARD_HEIGHT} ${CARD_BASE} p-4 sm:p-5 ${cardInner}`}
              >
                <div className="flex items-center gap-2.5 text-[#A9D1F5] shrink-0" aria-hidden="true">
                  <Smile className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                  <Handshake className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                </div>
                <h3 className="mt-2 font-display font-bold text-[#E9EEF4] text-xs sm:text-sm leading-snug shrink-0 uppercase tracking-[0.01em]">
                  Social &amp; Emotional Cues
                </h3>
                <p className="mt-1.5 sm:mt-2 font-body text-[#7A8B9B] text-xs sm:text-sm leading-relaxed flex-1 min-h-0 overflow-hidden line-clamp-2 sm:line-clamp-3">
                  Describes not just objects, but human expressions and interpersonal situations.
                </p>
              </motion.article>

              <motion.article
                {...reveal(0.16)}
                className={`relative z-10 flex-1 min-w-0 w-full ${CHILD_CARD_HEIGHT} ${CARD_BASE} p-4 sm:p-5 ${cardInner} lg:min-w-[26rem] lg:translate-x-9 xl:translate-x-12`}
              >
                <div className="flex items-end gap-2 sm:gap-3 shrink-0 min-h-0" aria-hidden="true">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-[#E9EEF4] shrink-0" strokeWidth={1.5} />
                  <VoiceWaveform className="h-6 sm:h-7 w-full max-w-none min-w-0 flex-1" />
                </div>
                <h3 className="mt-2 font-display font-bold text-[#E9EEF4] text-xs sm:text-sm leading-snug shrink-0 uppercase tracking-[0.01em]">
                  Voice-First Interface
                </h3>
                <p className="mt-1.5 sm:mt-2 font-body text-[#7A8B9B] text-xs sm:text-sm leading-relaxed flex-1 min-h-0 overflow-hidden line-clamp-3">
                  Real-time scene descriptions generated through voice command.
                </p>
              </motion.article>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center lg:justify-end min-w-0 overflow-visible pt-0 lg:pt-5">
            <div className="relative w-full max-w-[33rem]">
              <motion.div
                {...reveal(0.04)}
                className={`hidden sm:block absolute top-3 right-[-2.1rem] h-[79%] w-[76%] rounded-[1rem] border border-[#2F3C4C] bg-[#161F2C]/45 shadow-[0_12px_32px_rgba(3,9,18,0.3)] ${prefersReducedMotion ? '' : 'translate-y-4'}`}
                aria-hidden="true"
              />

              <motion.article
                {...reveal(0.08)}
                className={`relative w-full lg:w-[min(100%,28.5rem)] xl:w-[min(100%,30rem)] flex flex-col p-4 sm:p-5 lg:p-6 overflow-hidden ${MAIN_FLOAT} ${prefersReducedMotion ? '' : 'lg:-translate-x-14 xl:-translate-x-16 lg:translate-y-1'}`}
              >
                <div className={cardInner}>
                  <div className="rounded-[0.95rem] border border-[#2F3C4C] overflow-hidden bg-[#0B121B] shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="aspect-[16/10] w-full">
                      <img src={mainImage} alt="Vision scene preview" className="h-full w-full object-cover" />
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 flex items-start justify-between gap-3 min-h-0 shrink-0">
                    <div className="min-w-0">
                      <h2 className="font-display font-semibold text-[#E9EEF4] text-lg sm:text-xl leading-tight">
                        Persistent Spatial Memory
                      </h2>
                      <p className="font-body text-[#7A8B9B] text-sm sm:text-base mt-1.5 sm:mt-2 leading-snug">
                        Builds a persistent memory of your environment across each session.
                      </p>
                    </div>
                   
                  </div>
                </div>
              </motion.article>
            </div>
          </div>
        </div>

        <motion.div {...reveal(0.32)} className="mt-6 sm:mt-7 lg:mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DESCRIBE)}
            className="font-body font-semibold text-sm sm:text-base text-[#0B121B] bg-[#A9D1F5] hover:bg-[#93c4ef] px-7 sm:px-8 py-3 rounded-lg transition-colors min-h-touch shadow-[0_10px_22px_rgba(12,46,82,0.26)] focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B]"
            aria-label="Get started with Vision for free"
          >
            GET STARTED FREE
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.DESCRIBE)}
            className="font-body font-semibold text-sm sm:text-base text-[#E9EEF4] border border-[#2F3C4C] bg-[#161F2C]/70 hover:border-[#7A8B9B] hover:bg-[#161F2C] px-7 sm:px-8 py-3 rounded-lg transition-colors min-h-touch focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B]"
            aria-label="Explore the Vision demo"
          >
            EXPLORE DEMO
          </button>
        </motion.div>

        <motion.div {...reveal(0.38)} className="mt-1 sm:mt-1 flex justify-center sm:justify-end pr-0 sm:pr-0 lg:pr-1">
          <PwaFloating className="max-w-[220px] text-right pointer-events-auto -translate-y-2 sm:-translate-y-3 translate-x-3 sm:translate-x-4" />
        </motion.div>
      </div>

      <div className="absolute bottom-4 right-4 sm:right-8 z-20 pointer-events-none text-[#7A8B9B]" aria-hidden="true">
        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.25} />
      </div>
    </section>
  )
}
