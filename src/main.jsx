import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import { AppRuntime } from '@/AppRuntime'
import { Home } from '@/pages/Home'
import { Describe } from '@/pages/Describe'
import { SessionMemory } from '@/pages/SessionMemory'
import { ReadWeb } from '@/pages/ReadWeb'
import { ReadDoc } from '@/pages/ReadDoc'
import { Settings } from '@/pages/Settings'
import { AppErrorFallback } from '@/components/ui/AppErrorFallback'
import { ROUTES, QUERY_STALE_TIME, QUERY_RETRY_COUNT } from '@/lib/constants'

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('@/mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
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

const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <Home />, errorElement: routeErrorElement },
  { path: ROUTES.DESCRIBE, element: <Describe />, errorElement: routeErrorElement },
  { path: ROUTES.SESSION_MEMORY, element: <SessionMemory />, errorElement: routeErrorElement },
  { path: ROUTES.READ_WEB, element: <ReadWeb />, errorElement: routeErrorElement },
  { path: ROUTES.READ_DOC, element: <ReadDoc />, errorElement: routeErrorElement },
  { path: ROUTES.SETTINGS, element: <Settings />, errorElement: routeErrorElement },
])

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppRuntime router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
})
