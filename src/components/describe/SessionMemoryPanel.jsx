import { memo } from 'react'
import { Clock3, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const DETAIL_LABELS = {
  brief: 'Brief',
  standard: 'Standard',
  detailed: 'Detailed',
}

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * @typedef {Object} SessionMemoryPanelProps
 * @property {Array<{ id: string, description: string, detailLevel: 'brief'|'standard'|'detailed', confidence?: number, timestamp: number }>} entries
 * @property {(text: string) => void} onReplay
 * @property {() => void} onClear
 */

export const SessionMemoryPanel = memo(
  /**
   * @param {SessionMemoryPanelProps} props
   */
  function SessionMemoryPanel({ entries, onReplay, onClear }) {
    return (
      <Card className="p-0 overflow-hidden" ariaLabel="Session memory panel">
        <div className="flex items-center justify-between gap-3 border-b border-[#2F3C4C] bg-[linear-gradient(145deg,#18273a_0%,#111c2a_100%)] p-4 sm:p-5">
          <div>
            <h2 className="font-display text-[#E9EEF4] text-base font-semibold">Session Memory</h2>
            <p className="font-body text-xs text-[#7A8B9B] mt-1">
              Vision keeps your recent scene descriptions here for quick recall.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Eraser size={14} aria-hidden="true" />}
            onClick={onClear}
            disabled={!entries.length}
            ariaLabel="Clear session memory"
          >
            Clear
          </Button>
        </div>

        <div className="p-4 sm:p-5">
          {!entries.length ? (
            <p className="text-sm text-[#7A8B9B] font-body" aria-live="polite">
              No memory captured yet. Describe a scene to start building context.
            </p>
          ) : (
            <ul className="space-y-3 max-h-[min(26rem,calc(100dvh-300px))] overflow-auto pr-1" role="list" aria-label="Recent scene descriptions">
              {entries.map((entry, index) => (
                <li key={entry.id} className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-body text-[#A9D1F5] uppercase tracking-wide">
                      {DETAIL_LABELS[entry.detailLevel] ?? 'Standard'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-body text-[#7A8B9B]">
                      <Clock3 size={12} aria-hidden="true" />
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-body text-[#E9EEF4] leading-relaxed line-clamp-3">
                    {entry.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-body text-[#7A8B9B]">
                      {entry.confidence != null ? `Confidence: ${(entry.confidence * 100).toFixed(0)}%` : 'Confidence not provided'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onReplay(entry.description)}
                      ariaLabel={`Replay memory item ${index + 1}`}
                    >
                      Replay
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    )
  }
)
