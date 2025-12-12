import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import {
  ErrorBoundary,
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
  withErrorBoundary,
} from '../components/ErrorBoundary'
import {
  AsyncErrorFallback,
  getErrorType,
  LoadingFallback,
  EmptyFallback,
  AsyncContent,
} from '../components/AsyncErrorBoundary'

// Component that throws an error for testing
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Suppress console.error during error boundary tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('should render default fallback when error occurs', () => {
    render(
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Component Error')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it('should render custom fallback node', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
  })

  it('should render custom fallback function', () => {
    const fallback = ({ error, resetError }: any) => (
      <div>
        <span>Error: {error.message}</span>
        <button onClick={resetError}>Reset</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error: Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('should reset error state when reset is called', () => {
    let shouldThrow = true
    function ConditionalError() {
      if (shouldThrow) throw new Error('Test error')
      return <div>Recovered</div>
    }

    const { rerender } = render(
      <ErrorBoundary level="component">
        <ConditionalError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Component Error')).toBeInTheDocument()

    // Change the flag and click retry
    shouldThrow = false
    fireEvent.click(screen.getByText('Retry'))

    // Re-render to apply the change
    rerender(
      <ErrorBoundary level="component">
        <ConditionalError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })

  describe('level-specific rendering', () => {
    it('should render page-level error UI', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
    })

    it('should render section-level error UI', () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error loading this section')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('should render component-level error UI', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component Error')).toBeInTheDocument()
    })
  })
})

describe('PageErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <PageErrorBoundary>
        <div>Page content</div>
      </PageErrorBoundary>
    )

    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('should render page-level error UI on error', () => {
    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})

describe('SectionErrorBoundary', () => {
  it('should render section-level error UI on error', () => {
    render(
      <SectionErrorBoundary>
        <ThrowError />
      </SectionErrorBoundary>
    )

    expect(screen.getByText('Error loading this section')).toBeInTheDocument()
  })
})

describe('ComponentErrorBoundary', () => {
  it('should render component-level error UI on error', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('Component Error')).toBeInTheDocument()
  })
})

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    function SimpleComponent() {
      return <div>Simple content</div>
    }

    const WrappedComponent = withErrorBoundary(SimpleComponent)
    render(<WrappedComponent />)

    expect(screen.getByText('Simple content')).toBeInTheDocument()
  })

  it('should catch errors in wrapped component', () => {
    const WrappedError = withErrorBoundary(ThrowError)
    render(<WrappedError />)

    expect(screen.getByText('Component Error')).toBeInTheDocument()
  })

  it('should pass props through to wrapped component', () => {
    function DisplayProps({ name }: { name: string }) {
      return <div>Hello, {name}</div>
    }

    const WrappedComponent = withErrorBoundary(DisplayProps)
    render(<WrappedComponent name="Test" />)

    expect(screen.getByText('Hello, Test')).toBeInTheDocument()
  })
})

describe('getErrorType', () => {
  it('should return "unknown" for null error', () => {
    expect(getErrorType(null)).toBe('unknown')
  })

  it('should detect network errors', () => {
    expect(getErrorType(new Error('Network error'))).toBe('network')
    expect(getErrorType(new Error('Failed to fetch'))).toBe('network')
  })

  it('should detect timeout errors', () => {
    expect(getErrorType(new Error('Request timeout'))).toBe('timeout')
    expect(getErrorType(new Error('Operation timed out'))).toBe('timeout')
  })

  it('should detect auth errors', () => {
    expect(getErrorType(new Error('401 Unauthorized'))).toBe('auth')
    expect(getErrorType(new Error('Authentication failed'))).toBe('auth')
  })

  it('should detect not found errors', () => {
    expect(getErrorType(new Error('404 Not Found'))).toBe('not_found')
  })

  it('should detect rate limit errors', () => {
    expect(getErrorType(new Error('429 Too Many Requests'))).toBe('rate_limit')
    expect(getErrorType(new Error('Rate limit exceeded'))).toBe('rate_limit')
  })

  it('should detect server errors', () => {
    expect(getErrorType(new Error('500 Internal Server Error'))).toBe('server')
  })

  it('should return unknown for unrecognized errors', () => {
    expect(getErrorType(new Error('Something random'))).toBe('unknown')
  })
})

describe('AsyncErrorFallback', () => {
  it('should display error message', () => {
    const error = new Error('Test error message')
    render(<AsyncErrorFallback error={error} />)

    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('should show retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<AsyncErrorFallback error={new Error('Test')} onRetry={onRetry} />)

    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalled()
  })

  it('should show retrying state', () => {
    render(
      <AsyncErrorFallback
        error={new Error('Test')}
        onRetry={() => {}}
        isRetrying={true}
      />
    )

    expect(screen.getByText('Retrying...')).toBeInTheDocument()
  })

  it('should show retry count', () => {
    render(
      <AsyncErrorFallback
        error={new Error('Test')}
        onRetry={() => {}}
        retryCount={2}
        maxRetries={3}
      />
    )

    expect(screen.getByText('Attempt 2 of 3')).toBeInTheDocument()
  })

  it('should display network error UI', () => {
    render(<AsyncErrorFallback error={null} errorType="network" />)

    expect(screen.getByText('Connection Error')).toBeInTheDocument()
  })

  it('should display timeout error UI', () => {
    render(<AsyncErrorFallback error={null} errorType="timeout" />)

    expect(screen.getByText('Request Timeout')).toBeInTheDocument()
  })

  it('should display auth error UI with sign in link', () => {
    render(<AsyncErrorFallback error={null} errorType="auth" />)

    expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })
})

describe('LoadingFallback', () => {
  it('should display default loading message', () => {
    render(<LoadingFallback />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should display custom loading message', () => {
    render(<LoadingFallback message="Please wait..." />)

    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })
})

describe('EmptyFallback', () => {
  it('should display default empty state', () => {
    render(<EmptyFallback />)

    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.getByText('There is nothing to display here yet.')).toBeInTheDocument()
  })

  it('should display custom title and description', () => {
    render(
      <EmptyFallback
        title="No projects"
        description="You have not created any projects yet."
      />
    )

    expect(screen.getByText('No projects')).toBeInTheDocument()
    expect(screen.getByText('You have not created any projects yet.')).toBeInTheDocument()
  })

  it('should show action button when provided', () => {
    const onClick = vi.fn()
    render(
      <EmptyFallback
        action={{ label: 'Create Project', onClick }}
      />
    )

    const button = screen.getByText('Create Project')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })
})

describe('AsyncContent', () => {
  it('should show loading state', () => {
    render(
      <AsyncContent isLoading={true} error={null}>
        <div>Content</div>
      </AsyncContent>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should show error state', () => {
    render(
      <AsyncContent isLoading={false} error={new Error('Test error')}>
        <div>Content</div>
      </AsyncContent>
    )

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should show empty state', () => {
    render(
      <AsyncContent
        isLoading={false}
        error={null}
        isEmpty={true}
        emptyTitle="No items"
      >
        <div>Content</div>
      </AsyncContent>
    )

    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should show content when not loading, no error, and not empty', () => {
    render(
      <AsyncContent isLoading={false} error={null}>
        <div>Content</div>
      </AsyncContent>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should pass retry props to error fallback', () => {
    const onRetry = vi.fn()
    render(
      <AsyncContent
        isLoading={false}
        error={new Error('Test')}
        onRetry={onRetry}
        isRetrying={false}
        retryCount={1}
        maxRetries={3}
      >
        <div>Content</div>
      </AsyncContent>
    )

    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Attempt 1 of 3')).toBeInTheDocument()
  })
})
