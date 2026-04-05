import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const AppErrorFallback = () => {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = 'Something went wrong'
  let message = 'Vision hit an unexpected issue. Please try again.'

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`
    message = error.statusText || message
  } else if (error instanceof Error && error.message) {
    message = error.message
  }

  return (
    <main className="min-h-dvh bg-[#0B121B] text-[#E9EEF4] px-4 py-8 flex items-center justify-center">
      <section className="w-full max-w-xl bg-[#161F2C] border border-[#2F3C4C] rounded-2xl p-6 sm:p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#FF6B6B]/15 border border-[#FF6B6B]/40 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-[#FF6B6B]" aria-hidden="true" />
        </div>

        <h1 className="mt-5 font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-3 font-body text-[#7A8B9B] text-sm sm:text-base leading-relaxed">{message}</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="secondary"
            leftIcon={<Home size={18} aria-hidden="true" />}
            onClick={() => navigate('/')}
            ariaLabel="Go to home page"
          >
            Go Home
          </Button>
          <Button
            variant="primary"
            leftIcon={<RotateCcw size={18} aria-hidden="true" />}
            onClick={() => window.location.reload()}
            ariaLabel="Reload application"
          >
            Reload
          </Button>
        </div>
      </section>
    </main>
  )
}
