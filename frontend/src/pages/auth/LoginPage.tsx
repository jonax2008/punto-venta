import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ShoppingCart } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { setAuth } = useAuth()
  const navigate     = useNavigate()

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ token, user }) => {
      setAuth(token, user)
      navigate('/dashboard', { replace: true })
    },
    onError: () => {
      setError('email', { message: 'Credenciales incorrectas' })
    },
  })

  const handleGoogleLogin = async () => {
    const { redirect_url } = await authApi.googleRedirect()
    window.location.href = redirect_url
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <ShoppingCart className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
          <p className="mt-1 text-sm text-gray-500">Inicia sesión para continuar</p>
        </div>

        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit((d) => login.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                {...register('email')}
                className="input"
                placeholder="admin@puntoventa.local"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                {...register('password')}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={login.isPending}
            >
              {login.isPending && <LoadingSpinner size="sm" />}
              Iniciar sesión
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">o continúa con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn-secondary w-full justify-center"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google (clientes)
          </button>
        </div>
      </div>
    </div>
  )
}
