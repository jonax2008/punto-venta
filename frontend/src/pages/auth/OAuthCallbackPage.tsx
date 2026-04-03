import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { PageLoader } from '@/components/shared/LoadingSpinner'

export function OAuthCallbackPage() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const { setAuth } = useAuth()

  useEffect(() => {
    const token = params.get('token')

    if (! token) {
      navigate('/login', { replace: true })
      return
    }

    localStorage.setItem('auth_token', token)

    authApi.me()
      .then(({ data: user }) => {
        setAuth(token, user)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        navigate('/login', { replace: true })
      })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle">
      <div className="text-center">
        <PageLoader />
        <p className="mt-4 text-sm text-gray-500">Iniciando sesión con Google...</p>
      </div>
    </div>
  )
}
