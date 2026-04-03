import { AlertTriangle } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

interface Props {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (! isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'}`}>
            <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary" disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner size="sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
