'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

/**
 * Error information passed to fallback components
 */
interface ErrorBoundaryFallbackProps {
  error: Error
  errorInfo: ErrorInfo | null
  resetError: () => void
}

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'section' | 'component'
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary component for catching and handling React errors
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary level="page">
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomError />}>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * // With error callback
 * <ErrorBoundary onError={(error, info) => logToService(error, info)}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            errorInfo: this.state.errorInfo,
            resetError: this.resetError,
          })
        }
        return this.props.fallback
      }

      // Default fallback based on level
      const level = this.props.level || 'component'
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          level={level}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default error fallback UI
 */
interface DefaultErrorFallbackProps extends ErrorBoundaryFallbackProps {
  level: 'page' | 'section' | 'component'
}

function DefaultErrorFallback({ error, errorInfo, resetError, level }: DefaultErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development'

  if (level === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-lg w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>

          {isDev && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
              {errorInfo && (
                <details className="mt-2">
                  <summary className="text-sm text-red-700 cursor-pointer hover:text-red-800">
                    Component Stack
                  </summary>
                  <pre className="mt-2 text-xs text-red-700 overflow-x-auto whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetError}
              className="inline-flex items-center justify-center px-4 py-2 bg-jasper-emerald text-white rounded-lg hover:bg-jasper-emerald/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (level === 'section') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800">
              Error loading this section
            </h3>
            <p className="mt-1 text-sm text-red-700">
              This section encountered an error and could not be displayed.
            </p>

            {isDev && (
              <div className="mt-3 p-3 bg-white rounded border border-red-200">
                <p className="text-sm font-mono text-red-800 break-all">
                  {error.message}
                </p>
              </div>
            )}

            <button
              onClick={resetError}
              className="mt-4 inline-flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Component level - minimal UI
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
      <div className="flex items-center justify-center text-red-600 mb-2">
        <Bug className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium">Component Error</span>
      </div>
      {isDev && (
        <p className="text-xs text-red-700 font-mono mb-2 break-all">
          {error.message}
        </p>
      )}
      <button
        onClick={resetError}
        className="text-xs text-red-800 hover:text-red-900 underline"
      >
        Retry
      </button>
    </div>
  )
}

/**
 * Higher-order component to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

/**
 * Page-level error boundary wrapper
 */
export function PageErrorBoundary({ children, onError }: { children: ReactNode; onError?: ErrorBoundaryProps['onError'] }) {
  return (
    <ErrorBoundary level="page" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * Section-level error boundary wrapper
 */
export function SectionErrorBoundary({ children, onError }: { children: ReactNode; onError?: ErrorBoundaryProps['onError'] }) {
  return (
    <ErrorBoundary level="section" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component-level error boundary wrapper
 */
export function ComponentErrorBoundary({ children, onError }: { children: ReactNode; onError?: ErrorBoundaryProps['onError'] }) {
  return (
    <ErrorBoundary level="component" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
