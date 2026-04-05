/**
 * Variable-height waveform bars (decorative) — teal, sky, pink, amber, blue
 * Pairs with Mic on Voice-First card.
 */
const BARS = [
  { x: 0, h: 10, w: 2.5, fill: '#F5D547' },
  { x: 4, h: 16, w: 2.5, fill: '#00D4AA' },
  { x: 8, h: 8, w: 2.5, fill: '#F472B6' },
  { x: 12, h: 20, w: 3, fill: '#A9D1F5' },
  { x: 16.5, h: 12, w: 2.5, fill: '#00D4AA' },
  { x: 20.5, h: 18, w: 2.5, fill: '#93C5FD' },
  { x: 24.5, h: 6, w: 2.5, fill: '#F5D547' },
  { x: 28.5, h: 22, w: 3, fill: '#F472B6' },
  { x: 33, h: 14, w: 2.5, fill: '#A9D1F5' },
  { x: 37, h: 9, w: 2.5, fill: '#5B9BD5' },
  { x: 41, h: 17, w: 2.5, fill: '#00D4AA' },
  { x: 45, h: 11, w: 2.5, fill: '#F5D547' },
  { x: 49, h: 19, w: 3, fill: '#93C5FD' },
  { x: 53.5, h: 7, w: 2.5, fill: '#F472B6' },
  { x: 57.5, h: 15, w: 2.5, fill: '#A9D1F5' },
  { x: 61.5, h: 13, w: 2.5, fill: '#00D4AA' },
  { x: 65.5, h: 21, w: 3, fill: '#5B9BD5' },
  { x: 70, h: 9, w: 2.5, fill: '#7A8B9B' },
]

export const VoiceWaveform = ({ className = 'h-8 w-auto max-w-[min(100%,7.5rem)] shrink-0' }) => (
  <svg
    viewBox="0 0 100 32"
    fill="none"
    aria-hidden="true"
    className={className}
    preserveAspectRatio="xMinYMid meet"
  >
    {BARS.map((bar, i) => (
      <rect
        key={i}
        x={bar.x}
        y={16 - bar.h / 2}
        width={bar.w}
        height={bar.h}
        rx="1"
        fill={bar.fill}
        opacity={0.92}
      />
    ))}
  </svg>
)
