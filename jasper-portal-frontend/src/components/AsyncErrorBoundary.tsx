'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, RefreshCw, Wifi, WifiOff, Clock, ServerCrash } from 'lucide-react'

/**
 * Error types that can occur during async operations
 */
export type AsyncErrorType = 'network' | 'timeout' | 'server' | 'auth' | 'not_found' | 'rate_limit' | 'unknown'

/**
 * Props for the AsyncErrorFallback component
 */
interface AsyncErrorFallbackProps {
  error: Error | null
  errorType?: AsyncErrorType
  onRetry?: () => void
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
}

/**
 * Determine error type from error object
 */
export function getErrorType(error: Error | null): AsyncErrorType {
  if (!error) return 'unknown'

  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  if (message.includes('network') || message.includes('fetch') || name.includes('typeerror')) {
    return 'network'
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout'
  }
  if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
    return 'auth'
  }
  if (message.includes('404') || message.includes('not found')) {
    return 'not_found'
  }
  if (message.includes('429') || message.includes('rate limit') || message.includes('too many')) {
    return 'rate_limit'
  }
  if (message.includes('500') || message.includes('server') || message.includes('internal')) {
    return 'server'
  }

  return 'unknown'
}

/**
 * Get error details based on error type
 */
function getErrorDetails(errorType: AsyncErrorType) {
  switch (errorType) {
    case 'network':
      return {
        icon: WifiOff,
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection.',
        color: 'amber',
      }
    case 'timeout':
      return {
        icon: Clock,
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again.',
        color: 'amber',
      }
    case 'server':
      return {
        icon: ServerCrash,
        title: 'Server Error',
        description: 'The server encountered an error. Please try again later.',
        color: 'red',
      }
    case 'auth':
      return {
        icon: AlertCircle,
        title: 'Authentication Required',
        description: 'Your session may have expired. Please sign in again.',
        color: 'amber',
      }
    case 'not_found':
      return {
        icon: AlertCircle,
        title: 'Not Found',
        description: 'The requested resource could not be found.',
        color: 'gray',
      }
    case 'rate_limit':
      return {
        icon: Clock,
        title: 'Too Many Requests',
        description: 'Please wait a moment before trying again.',
        color: 'amber',
      }
    default:
      return {
        icon: AlertCircle,
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        color: 'red',
      }
  }
}

/**
 * Async error fallback component for displaying async operation errors
 */
export function AsyncErrorFallback({
  error,
  errorType,
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
}: AsyncErrorFallbackProps) {
  const type = errorType || getErrorType(error)
  const details = getErrorDetails(type)
  const Icon = details.icon
  const isDev = process.env.NODE_ENV === 'development'
  const canRetry = onRetry && (maxRetries === 0 || retryCount < maxRetries)

  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      text: 'text-red-700',
      button: 'bg-red-100 text-red-800 hover:bg-red-200',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-800',
      text: 'text-amber-700',
      button: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-600',
      title: 'text-gray-800',
      text: 'text-gray-700',
      button: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    },
  }

  const colors = colorClasses[details.color as keyof typeof colorClasses]

  return (
    <div className={`p-6 ${colors.bg} border ${colors.border} rounded-lg`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-medium ${colors.title}`}>
            {details.title}
          </h3>
          <p className={`mt-1 text-sm ${colors.text}`}>
            {details.description}
          </p>

          {isDev && error && (
            <div className="mt-3 p-3 bg-white rounded border border-gray-200">
              <p className="text-sm font-mono text-gray-800 break-all">
                {error.message}
              </p>
            </div>
          )}

          {canRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className={`inline-flex items-center px-3 py-1.5 text-sm ${colors.button} rounded transition-colors disabled:opacity-50`}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
              {retryCount > 0 && maxRetries > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  Attempt {retryCount} of {maxRetries}
                </span>
              )}
            </div>
          )}

          {type === 'auth' && (
            <div className="mt-4">
              <a
                href="/login"
                className="inline-flex items-center px-3 py-1.5 text-sm bg-jasper-emerald text-white rounded hover:bg-jasper-emerald/90 transition-colors"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading fallback component
 */
export function LoadingFallback({
  message = 'Loading...',
  size = 'medium',
}: {
  message?: string
  size?: 'small' | 'medium' | 'large'
}) {
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  }

  const spinnerSizes = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-10 h-10',
  }

  return (
    <div className={`${sizeClasses[size]} flex flex-col items-center justify-center`}>
      <div
        className={`${spinnerSizes[size]} border-2 border-jasper-emerald/20 border-t-jasper-emerald rounded-full animate-spin`}
      />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  )
}

/**
 * Empty state fallback component
 */
export function EmptyFallback({
  title = 'No data',
  description = 'There is nothing to display here yet.',
  action,
}: {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center px-4 py-2 text-sm bg-jasper-emerald text-white rounded-lg hover:bg-jasper-emerald/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * Wrapper component for async content with loading, error, and empty states
 */
interface AsyncContentProps {
  isLoading: boolean
  error: Error | null
  isEmpty?: boolean
  onRetry?: () => void
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  loadingMessage?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  children: ReactNode
}

export function AsyncContent({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  isRetrying,
  retryCount,
  maxRetries,
  loadingMessage,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: AsyncContentProps) {
  if (isLoading) {
    return <LoadingFallback message={loadingMessage} />
  }

  if (error) {
    return (
      <AsyncErrorFallback
        error={error}
        onRetry={onRetry}
        isRetrying={isRetrying}
        retryCount={retryCount}
        maxRetries={maxRetries}
      />
    )
  }

  if (isEmpty) {
    return (
      <EmptyFallback
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return <>{children}</>
}

export default AsyncErrorFallback
