import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = ++counter
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => setToasts((t) => t.filter((item) => item.id !== id)), 4000)
  }, [])

  const remove = (id: number) => setToasts((t) => t.filter((item) => item.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 lg:bottom-4">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg min-w-[280px] max-w-sm',
              item.variant === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            )}
          >
            {item.variant === 'success'
              ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
              : <XCircle className="h-4 w-4 flex-shrink-0" />}
            <p className="flex-1 text-sm font-medium">{item.message}</p>
            <button onClick={() => remove(item.id)} className="opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
