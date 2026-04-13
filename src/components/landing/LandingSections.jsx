import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bot,
  ChartLine,
  Cloud,
  Cpu,
  Database,
  FileImage,
  Globe,
  Mic,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/lib/constants'

const _MOTION = motion

const FEATURE_ITEMS = [
  {
    title: 'Realtime Scene Narration',
    description:
      'Continuous frame-based understanding that updates as the user walks through changing surroundings.',
    icon: TimerReset,
  },
  {
    title: 'Voice-Driven Control',
    description:
      'Hands-free command flow for starting walk mode, pausing, reading outputs, and navigating app actions.',
    icon: Mic,
  },
  {
    title: 'Image Describe Mode',
    description:
      'Single image explain mode for targeted scene understanding when a user needs focused context.',
    icon: FileImage,
  },
]

const FEATURE_PREVIEW_CHILD = {
  title: 'Persistent Preference Memory',
  description:
    'Cloud-backed settings for voice speed, detail level, and accessibility behavior across sessions.',
  icon: Database,
}

const TECH_ITEMS = [
  {
    name: 'Python + FastAPI',
    detail: 'Async backend APIs with typed contracts and automatic validation docs.',
    icon: Cpu,
  },
  {
    name: 'Gemini Flash Vision',
    detail: 'Low-latency multimodal scene understanding optimized for realtime student-tier usage.',
    icon: Bot,
  },
  {
    name: 'Whisper (Local)',
    detail: 'Fallback speech recognition pipeline when browser speech APIs are unavailable.',
    icon: Mic,
  },
  {
    name: 'edge-tts',
    detail: 'Natural backend speech output for cleaner narration quality in accessibility scenarios.',
    icon: Sparkles,
  },
  {
    name: 'Readability + Parsing',
    detail: 'Web extraction stack for clean article reading and distraction-free spoken content.',
    icon: Globe,
  },
  {
    name: 'Supabase',
    detail: 'Postgres-backed preferences and persistence layer supporting cross-device continuity.',
    icon: Cloud,
  },
]

export const LandingSections = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const reveal = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.5, delay },
        }

  return (
    <>
      <section
        id="features"
        className="scroll-mt-24 relative bg-[#0B121B] px-4 sm:px-8 lg:px-14 xl:px-16 py-12 sm:py-16"
        aria-label="Vision features"
      >
        <div className="max-w-[84rem] mx-auto">
          <motion.div {...reveal(0)} className="max-w-3xl">
            <p className="font-body text-[#A9D1F5] text-xs tracking-[0.18em] uppercase">Core Features</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E9EEF4] mt-3">
              A Realtime Accessibility Dashboard Built for Motion
            </h2>
            <p className="font-body text-[#7A8B9B] text-sm sm:text-base mt-3 leading-relaxed">
              Vision combines live camera context, AI reasoning, and voice interaction into one professional control surface.
            </p>
          </motion.div>

          <div className="mt-8 grid gap-5 sm:gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
            <div className="space-y-4">
              <motion.div {...reveal(0.04)}>
                <Card className="p-0 overflow-hidden self-start min-h-[16rem] sm:min-h-[20rem] lg:min-h-[23rem]">
                  <div className="p-4 sm:p-5 border-b border-[#2F3C4C] bg-[linear-gradient(130deg,#1a2838_0%,#111b29_100%)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-lg text-[#E9EEF4] font-semibold">Dashboard Preview</h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#2F3C4C] bg-[#0B121B]/80 px-3 py-1 text-[11px] uppercase tracking-wide text-[#A9D1F5] font-body">
                        <ChartLine size={12} aria-hidden="true" />
                        Walk Mode Ready
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-4">
                      <p className="font-body text-[11px] uppercase tracking-wide text-[#7A8B9B]">Loop Health</p>
                      <p className="font-display text-2xl text-[#E9EEF4] mt-2">Stable</p>
                      <p className="font-body text-xs text-[#7A8B9B] mt-1">Adaptive interval auto-tunes under load.</p>
                    </div>
                    <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-4">
                      <p className="font-body text-[11px] uppercase tracking-wide text-[#7A8B9B]">Voice Ops</p>
                      <p className="font-display text-2xl text-[#E9EEF4] mt-2">Command-First</p>
                      <p className="font-body text-xs text-[#7A8B9B] mt-1">Start, pause, resume, stop fully by speech.</p>
                    </div>
                    <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-4 sm:col-span-2">
                      <p className="font-body text-[11px] uppercase tracking-wide text-[#7A8B9B]">Why this matters</p>
                      <p className="font-body text-sm text-[#E9EEF4] mt-2 leading-relaxed">
                        The interface is optimized for continuity while walking: clear telemetry, low-cognitive controls, and speech-first interaction.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div {...reveal(0.08)}>
                <Card className="p-4 sm:p-5">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B121B] border border-[#2F3C4C] text-[#A9D1F5]">
                    <Database size={17} aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-[#E9EEF4] text-base font-semibold mt-3">{FEATURE_PREVIEW_CHILD.title}</h3>
                  <p className="font-body text-[#7A8B9B] text-sm mt-2 leading-relaxed">{FEATURE_PREVIEW_CHILD.description}</p>
                </Card>
              </motion.div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {FEATURE_ITEMS.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div key={item.title} {...reveal(0.08 + index * 0.03)}>
                    <Card className="p-4 sm:p-5">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B121B] border border-[#2F3C4C] text-[#A9D1F5]">
                        <Icon size={17} aria-hidden="true" />
                      </div>
                      <h3 className="font-display text-[#E9EEF4] text-base font-semibold mt-3">{item.title}</h3>
                      <p className="font-body text-[#7A8B9B] text-sm mt-2 leading-relaxed">{item.description}</p>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        id="technology"
        className="scroll-mt-24 relative bg-[#0D1520] px-4 sm:px-8 lg:px-14 xl:px-16 py-12 sm:py-16 border-y border-[#182233]"
        aria-label="Vision technology"
      >
        <div className="max-w-[84rem] mx-auto">
          <motion.div {...reveal(0)} className="max-w-3xl">
            <p className="font-body text-[#A9D1F5] text-xs tracking-[0.18em] uppercase">Technology</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E9EEF4] mt-3">
              Built on Practical AI Infrastructure
            </h2>
            <p className="font-body text-[#7A8B9B] text-sm sm:text-base mt-3 leading-relaxed">
              Backend architecture uses low-cost, high-impact tools selected for realtime response, maintainability, and accessibility use-cases.
            </p>
          </motion.div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {TECH_ITEMS.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div key={item.name} {...reveal(0.04 + index * 0.02)}>
                  <Card className="p-4 sm:p-5 h-full">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B121B] border border-[#2F3C4C] text-[#A9D1F5] shrink-0">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-display text-[#E9EEF4] text-base font-semibold leading-tight">{item.name}</h3>
                        <p className="font-body text-[#7A8B9B] text-sm mt-2 leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="scroll-mt-24 relative bg-[#0B121B] px-4 sm:px-8 lg:px-14 xl:px-16 py-12 sm:py-16"
        aria-label="About Vision"
      >
        <div className="max-w-[84rem] mx-auto grid gap-6 lg:grid-cols-2">
          <motion.div {...reveal(0)}>
            <Card className="p-5 sm:p-6">
              <p className="font-body text-[#A9D1F5] text-xs tracking-[0.18em] uppercase">About Us</p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#E9EEF4] mt-3">
                We Build for Independent Movement
              </h2>
              <p className="font-body text-[#7A8B9B] text-sm sm:text-base mt-3 leading-relaxed">
                Vision is a student-built accessibility product focused on helping visually impaired users understand changing surroundings in real time.
              </p>
            </Card>
          </motion.div>

          <motion.div {...reveal(0.06)}>
            <Card className="p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-[#E9EEF4]">Principles</h3>
              <ul className="mt-4 space-y-3" role="list" aria-label="Vision principles">
                <li className="flex items-start gap-3">
                  <ShieldCheck size={16} className="text-[#A9D1F5] mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="font-body text-sm text-[#7A8B9B]">Reliability over novelty for real-world mobility and confidence.</p>
                </li>
                <li className="flex items-start gap-3">
                  <Zap size={16} className="text-[#A9D1F5] mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="font-body text-sm text-[#7A8B9B]">Low-latency feedback so descriptions remain useful while moving.</p>
                </li>
                <li className="flex items-start gap-3">
                  <Mic size={16} className="text-[#A9D1F5] mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="font-body text-sm text-[#7A8B9B]">Voice-first control so users can stay hands-free and focused.</p>
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 relative bg-[#0B121B] px-4 sm:px-8 lg:px-14 xl:px-16 pb-14 sm:pb-20"
        aria-label="Contact Vision"
      >
        <div className="max-w-[84rem] mx-auto">
          <motion.div {...reveal(0)}>
            <Card className="p-6 sm:p-8 border-[#33465d] bg-[linear-gradient(130deg,#162437_0%,#111b29_58%,#0f1825_100%)]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <p className="font-body text-[#A9D1F5] text-xs tracking-[0.18em] uppercase">Contact Us</p>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#E9EEF4] mt-3">
                    Partner, Test, or Collaborate with Vision
                  </h2>
                  <p className="font-body text-[#7A8B9B] text-sm sm:text-base mt-3 leading-relaxed max-w-2xl">
                    Reach out if you want to test accessibility flows, contribute to frontend or backend, or validate walk-mode behavior with real users.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(ROUTES.DESCRIBE)}
                    ariaLabel="Open Vision dashboard"
                  >
                    Open Dashboard
                  </Button>
                  <a
                    href="mailto:vision.project.team@gmail.com"
                    className="inline-flex items-center justify-center min-h-[48px] min-w-[48px] px-4 rounded-xl font-body font-medium text-sm text-[#E9EEF4] border border-[#2F3C4C] bg-[#0B121B]/70 hover:bg-[#0B121B] transition-colors"
                    aria-label="Contact Vision team by email"
                  >
                    Contact Team
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  )
}
