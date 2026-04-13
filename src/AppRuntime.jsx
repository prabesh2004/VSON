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

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      window.__visionDeferredPrompt = event
      window.dispatchEvent(new Event('vision:pwa-installability-changed'))
    }

    const handleAppInstalled = () => {
      window.__visionDeferredPrompt = null
      window.dispatchEvent(new Event('vision:pwa-installability-changed'))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return (
    <>
      <ConnectivityBanner />
      <RouterProvider router={router} />
    </>
  )
}
