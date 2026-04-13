import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { loginWithGoogle } from '@/api/auth'
import { useAuthStore } from '@/store/useAuthStore'
import { ROUTES } from '@/lib/constants'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const fallbackPath = (stateFromLocation) => {
  if (!stateFromLocation || typeof stateFromLocation !== 'string') return ROUTES.DESCRIBE
  return stateFromLocation
}

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toPath = fallbackPath(location.state?.from)

  if (isAuthenticated) {
    return <Navigate to={toPath} replace />
  }

  const handleCredential = async (credential) => {
    if (!credential) {
      setError('Google login credential was not received. Please try again.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await loginWithGoogle(credential)
      login(response.user)
      navigate(toPath, { replace: true })
    } catch (authError) {
      setError(authError.message ?? 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDevLogin = () => {
    login({
      id: 'dev-user',
      name: 'Developer Mode',
      email: 'dev@local',
      email_verified: true,
    })
    navigate(toPath, { replace: true })
  }

  return (
    <main id="main-content" className="min-h-dvh bg-[#0B121B] px-4 py-6 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-7">
        <h1 className="font-display text-2xl font-semibold text-[#E9EEF4]">Sign in to Vision</h1>
        <p className="font-body text-sm text-[#7A8B9B] mt-2">
          Please sign in to access the dashboard and reader tools.
        </p>

        <div className="mt-6 space-y-4">
          {googleClientId ? (
            <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-3">
              <GoogleLogin
                onSuccess={(credentialResponse) => handleCredential(credentialResponse.credential)}
                onError={() => setError('Google sign-in popup failed. Please try again.')}
                useOneTap={false}
              />
            </div>
          ) : (
            <p className="text-sm font-body text-[#FFB347]" role="status">
              GOOGLE_CLIENT_ID is not configured for frontend. Add it to .env and restart Vite.
            </p>
          )}

          {import.meta.env.DEV && (
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<LogIn size={16} aria-hidden="true" />}
              onClick={handleDevLogin}
              ariaLabel="Continue in development mode"
            >
              Continue in Dev Mode
            </Button>
          )}

          {isSubmitting && (
            <p className="text-sm font-body text-[#7A8B9B]" role="status" aria-live="polite">
              Verifying your account...
            </p>
          )}

          {error && (
            <p className="text-sm font-body text-[#FF6B6B]" role="alert">
              {error}
            </p>
          )}
        </div>
      </Card>
    </main>
  )
}
