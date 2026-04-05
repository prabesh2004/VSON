import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner'
import { useAppStore } from '@/store/useAppStore'

/**
 * @typedef {Object} AppRuntimeProps
 * @property {import('react-router-dom').Router} router
 */

/**
 * @param {AppRuntimeProps} props
 */
export const AppRuntime = ({ router }) => {
  const { setIsConnected } = useAppStore()

  useEffect(() => {
    const syncConnectivity = () => setIsConnected(navigator.onLine)

    syncConnectivity()
    window.addEventListener('online', syncConnectivity)
    window.addEventListener('offline', syncConnectivity)

    return () => {
      window.removeEventListener('online', syncConnectivity)
      window.removeEventListener('offline', syncConnectivity)
    }
  }, [setIsConnected])

  return (
    <>
      <ConnectivityBanner />
      <RouterProvider router={router} />
    </>
  )
}
