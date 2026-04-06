import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SessionMemoryPanel } from '@/components/describe/SessionMemoryPanel'
import { Button } from '@/components/ui/Button'
import { useTTS } from '@/hooks/useTTS'
import { useAppStore } from '@/store/useAppStore'

export const SessionMemory = () => {
  const navigate = useNavigate()
  const { sceneHistory, clearSceneHistory } = useAppStore()
  const { speak } = useTTS()

  const handleReplayMemory = useCallback(
    (text) => {
      if (!text) return
      speak(text)
    },
    [speak]
  )

  return (
    <main id="main-content" className="min-h-dvh bg-[#0B121B] px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
            leftIcon={<ArrowLeft size={18} aria-hidden="true" />}
            onClick={() => navigate(-1)}
            ariaLabel="Go back to dashboard"
          >
            Back
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-[#E9EEF4]">Session Memory</h1>
            <p className="font-body text-sm text-[#7A8B9B] mt-1">
              Review recent scene descriptions and replay context when needed.
            </p>
          </div>
        </header>

        <SessionMemoryPanel entries={sceneHistory} onReplay={handleReplayMemory} onClear={clearSceneHistory} />
      </div>
    </main>
  )
}
