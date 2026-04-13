import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WebReader } from '@/components/reader/WebReader'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { CommandHUD } from '@/components/voice/CommandHUD'
import { VoiceHelpModal } from '@/components/voice/VoiceHelpModal'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceCommand } from '@/hooks/useVoiceCommand'
import { ROUTES } from '@/lib/constants'

export const ReadWeb = () => {
  const navigate = useNavigate()
  const { speak, stop: stopSpeaking } = useTTS()
  const [content, setContent] = useState(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const stopListeningRef = useRef(() => {})

  const handleReadAloud = useCallback(
    (text, title) => {
      speak(`${title}. ${text}`)
    },
    [speak]
  )

  const handleContentReady = useCallback((nextContent) => {
    setContent(nextContent)
  }, [])

  const handleCommand = (command) => {
    if (command === 'stop') {
      stopSpeaking()
      return true
    }

    if (command === 'stop mic') {
      stopListeningRef.current()
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

    if (command === 'repeat' && content) {
      handleReadAloud(content.text, content.title)
      return true
    }

    return false
  }

  const { toggleListening, stopListening } = useVoiceCommand({ onCommand: handleCommand })

  useEffect(() => {
    stopListeningRef.current = stopListening
  }, [stopListening])

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
        <h1 className="font-display text-xl font-semibold text-[#E9EEF4]">Read Web Page</h1>
      </header>

      <WebReader onReadAloud={handleReadAloud} onContentReady={handleContentReady} />

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
