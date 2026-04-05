import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

/** Line-art monitor + phones — matches refined PWA corner treatment */
const DeviceLineArt = () => (
  <svg width="48" height="30" viewBox="0 0 56 36" fill="none" aria-hidden="true" className="shrink-0 text-[#A9D1F5]">
    <rect x="14" y="4" width="28" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 26h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M28 22v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="2" y="10" width="8" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="46" y="12" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const PwaFloating = ({ className } = {}) => {
  const navigate = useNavigate()

  const rootClassName =
    className || 'fixed bottom-16 right-4 sm:right-8 z-40 max-w-[220px] text-right pointer-events-auto'

  return (
    <div className={rootClassName}>
      <button
        type="button"
        onClick={() => navigate(ROUTES.DESCRIBE)}
        className="inline-flex flex-col items-end gap-1.5 bg-transparent border-0 p-2 -m-2 min-h-touch min-w-touch justify-end text-right focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B] rounded-sm"
        aria-label="Installable PWAs and planned browser extension — open Vision"
      >
        <DeviceLineArt />
        <span className="font-display font-bold text-[#E9EEF4] text-[9px] sm:text-[10px] leading-snug uppercase tracking-wide">
          INSTALLABLE PWAs &amp;
          <br />
          PLANNED BROWSER
          <br />
          EXTENSION
        </span>
      </button>
    </div>
  )
}
