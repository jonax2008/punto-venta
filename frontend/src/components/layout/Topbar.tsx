import { Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/lib/utils'

interface Props {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: Props) {
  const { user } = useAuth()

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-surface-muted lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {user && (
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary">
            {ROLE_LABELS[user.role]}
          </span>
        )}
      </div>
    </header>
  )
}
