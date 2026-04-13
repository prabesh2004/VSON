import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DocumentReader } from '@/components/reader/DocumentReader'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { CommandHUD } from '@/components/voice/CommandHUD'
import { VoiceHelpModal } from '@/components/voice/VoiceHelpModal'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceCommand } from '@/hooks/useVoiceCommand'
import { ROUTES } from '@/lib/constants'

export const ReadDoc = () => {
  const navigate = useNavigate()
  const { speak, stop: stopSpeaking } = useTTS()
  const [voiceAction, setVoiceAction] = useState(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [hasDocument, setHasDocument] = useState(false)

  const handleReadAloud = useCallback(
    (text, title) => {
      speak(`${title}. ${text}`)
    },
    [speak]
  )

  const handleContentReady = useCallback(() => {
    setHasDocument(true)
  }, [])

  const handleCommand = (command) => {
    if (command === 'stop') {
      stopSpeaking()
      return true
    }

    if (command === 'go back') {
      navigate(-1)
      return true
    }

    if (command === 'settings') {
      navigate(ROUTES.SETTINGS)
      return true
    }

    if (command === 'help') {
      setIsHelpOpen(true)
      return true
    }

    if (command === 'repeat') {
      if (!hasDocument) return false
      setVoiceAction({ type: command, nonce: Date.now() })
      return true
    }

    return false
  }

  const { toggleListening } = useVoiceCommand({ onCommand: handleCommand })

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
        <h1 className="font-display text-xl font-semibold text-[#E9EEF4]">Read Document</h1>
      </header>

      <DocumentReader
        onReadAloud={handleReadAloud}
        onContentReady={handleContentReady}
        voiceAction={voiceAction}
      />

      <div className="flex flex-col items-center gap-3 mt-auto pt-4">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<CircleHelp size={16} aria-hidden="true" />}
          onClick={() => setIsHelpOpen(true)}
          ariaLabel="Open voice command help"
        >
          Voice Help
        </Button>
        <VoiceButton onToggle={toggleListening} />
        <CommandHUD />
      </div>

      <VoiceHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  )
}
