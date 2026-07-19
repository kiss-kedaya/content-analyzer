'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle } from './Icon'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="surface-card w-full max-w-md rounded-2xl p-6 text-center" role="alert">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-content">
              出错了
            </h2>
            <p className="mb-4 text-muted">
              {this.state.error?.message || '应用程序遇到了一个错误'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)] focus-ring"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
