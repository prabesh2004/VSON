import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'

import { AppRuntime } from '@/AppRuntime'
import { ProtectedLayout } from '@/components/auth/ProtectedLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Describe } from '@/pages/Describe'
import { SessionMemory } from '@/pages/SessionMemory'
import { ReadWeb } from '@/pages/ReadWeb'
import { ReadDoc } from '@/pages/ReadDoc'
import { Settings } from '@/pages/Settings'
import { AppErrorFallback } from '@/components/ui/AppErrorFallback'
import { ROUTES, QUERY_STALE_TIME, QUERY_RETRY_COUNT } from '@/lib/constants'

async function enableMocking() {
  const shouldMock = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true'

  if (shouldMock) {
    const { worker } = await import('@/mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations
        .filter((registration) => registration.active?.scriptURL?.includes('mockServiceWorker.js'))
        .map((registration) => registration.unregister())
    )
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      retry: QUERY_RETRY_COUNT,
    },
    mutations: {
      retry: QUERY_RETRY_COUNT,
    },
  },
})

const routeErrorElement = <AppErrorFallback />
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const strictModeEnabled = import.meta.env.PROD || import.meta.env.VITE_ENABLE_STRICT_MODE === 'true'

const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <Home />, errorElement: routeErrorElement },
  { path: ROUTES.LOGIN, element: <Login />, errorElement: routeErrorElement },
  {
    element: (
      <ProtectedRoute>
        <ProtectedLayout />
      </ProtectedRoute>
    ),
    errorElement: routeErrorElement,
    children: [
      {
        path: ROUTES.DESCRIBE,
        element: <Describe />,
      },
      {
        path: ROUTES.SESSION_MEMORY,
        element: <SessionMemory />,
      },
      {
        path: ROUTES.READ_WEB,
        element: <ReadWeb />,
      },
      {
        path: ROUTES.READ_DOC,
        element: <ReadDoc />,
      },
      {
        path: ROUTES.SETTINGS,
        element: <Settings />,
      },
    ],
  },
])

enableMocking().then(() => {
  const appTree = (
    <QueryClientProvider client={queryClient}>
      <AppRuntime router={router} />
    </QueryClientProvider>
  )

  const wrappedApp = strictModeEnabled ? <StrictMode>{appTree}</StrictMode> : appTree

  createRoot(document.getElementById('root')).render(
    googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{wrappedApp}</GoogleOAuthProvider> : wrappedApp
  )
})
