import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DocumentReader } from '@/components/reader/DocumentReader'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { CommandHUD } from '@/components/voice/CommandHUD'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceCommand } from '@/hooks/useVoiceCommand'

export const ReadDoc = () => {
  const navigate = useNavigate()
  const { speak, stop: stopSpeaking } = useTTS()

  const handleCommand = (command) => {
    if (command === 'stop') stopSpeaking()
    else if (command === 'go back') navigate(-1)
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

      <DocumentReader onReadAloud={(text, title) => speak(`${title}. ${text}`)} />

      <div className="flex flex-col items-center gap-3 mt-auto pt-4">
        <VoiceButton onToggle={toggleListening} />
        <CommandHUD />
      </div>
    </main>
  )
}
