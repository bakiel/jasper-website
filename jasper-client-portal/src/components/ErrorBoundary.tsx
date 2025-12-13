'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console.error('Error boundary caught error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    } else {
      console.error('Error boundary caught error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-primary p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h1 className="text-2xl font-semibold text-jasper-carbon mb-2">
              Something went wrong
            </h1>

            <p className="text-jasper-slate mb-6">
              We apologise for the inconvenience. An unexpected error has occurred.
              Please try refreshing the page.
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-left">
                <p className="text-xs text-red-500 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-secondary hover:bg-surface-tertiary text-jasper-carbon font-medium rounded-lg border border-border transition-colors"
              >
                Go to Dashboard
              </a>
            </div>

            <p className="mt-8 text-xs text-jasper-slate-light">
              If the problem persists, please contact{' '}
              <a
                href="mailto:support@jasperfinance.org"
                className="text-jasper-emerald hover:underline"
              >
                support@jasperfinance.org
              </a>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
