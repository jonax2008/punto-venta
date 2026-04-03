import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
            <h2 className="text-base font-semibold text-gray-900">Algo salió mal</h2>
            <p className="mt-1 text-sm text-gray-500">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="btn-secondary mt-4"
            >
              Reintentar
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
