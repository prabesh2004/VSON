import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import { Home } from '@/pages/Home'
import { Describe } from '@/pages/Describe'
import { ReadWeb } from '@/pages/ReadWeb'
import { ReadDoc } from '@/pages/ReadDoc'
import { Settings } from '@/pages/Settings'
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

const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <Home /> },
  { path: ROUTES.DESCRIBE, element: <Describe /> },
  { path: ROUTES.READ_WEB, element: <ReadWeb /> },
  { path: ROUTES.READ_DOC, element: <ReadDoc /> },
  { path: ROUTES.SETTINGS, element: <Settings /> },
])

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
})
