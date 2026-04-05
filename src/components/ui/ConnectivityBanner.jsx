import { WifiOff } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export const ConnectivityBanner = () => {
  const { isConnected } = useAppStore()

  if (isConnected) return null

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[70] bg-[#161F2C] border-b border-[#2F3C4C] px-4 py-2"
    >
      <div className="max-w-[90rem] mx-auto flex items-center justify-center gap-2 text-[#FFB347] font-body text-sm">
        <WifiOff className="w-4 h-4" aria-hidden="true" />
        You are offline. Network-based features are temporarily unavailable.
      </div>
    </div>
  )
}
