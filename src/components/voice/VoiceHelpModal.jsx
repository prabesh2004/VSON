import { memo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { VOICE_COMMANDS } from '@/lib/constants'

const COMMAND_HELP = {
  start: 'Start the camera feed.',
  'walk mode': 'Start realtime walk mode narration.',
  describe: 'Capture and describe your current surroundings.',
  capture: 'Capture your surroundings using the camera now.',
  'describe in detail': 'Capture and request a more detailed scene description.',
  'start walk mode': 'Start continuous frame-by-frame walkthrough mode.',
  'pause walk mode': 'Pause realtime walkthrough capture.',
  'resume walk mode': 'Resume realtime walkthrough after pause.',
  'stop walk mode': 'Stop realtime walkthrough mode completely.',
  'stop mic': 'Stop microphone listening until you turn it on again.',
  'go back': 'Go back to the previous screen.',
  stop: 'Stop camera and active speech/walk mode actions.',
  repeat: 'Repeat the latest scene or reading output.',
  tutorial: 'Play the onboarding voice tutorial again.',
  settings: 'Open settings page.',
  help: 'Open this voice command help dialog.',
}

/**
 * @typedef {Object} VoiceHelpModalProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {() => void} [onTutorial]
 */
export const VoiceHelpModal = memo(
  /**
   * @param {VoiceHelpModalProps} props
   */
  function VoiceHelpModal({ isOpen, onClose, onTutorial }) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Voice Commands">
        <p className="text-[#7A8B9B] font-body text-sm leading-relaxed mb-4">
          You can control Vision by voice. Core commands are start, stop, walk mode, and help.
        </p>

        <div className="mb-4">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={onTutorial}
            ariaLabel="Play voice tutorial"
          >
            Play Tutorial
          </Button>
        </div>

        <ul className="space-y-3" role="list" aria-label="Supported voice commands">
          {VOICE_COMMANDS.map((command) => (
            <li key={command} className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-3">
              <p className="text-[#E9EEF4] font-display text-sm font-semibold">{command}</p>
              <p className="text-[#7A8B9B] font-body text-xs mt-1 leading-relaxed">
                {COMMAND_HELP[command] ?? 'Available command.'}
              </p>
            </li>
          ))}
        </ul>
      </Modal>
    )
  }
)
