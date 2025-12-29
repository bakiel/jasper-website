"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Code } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackContent?: string;
  onFallbackToMarkdown?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary specifically for BlockNote editor
 * Shows detailed error info and allows fallback to markdown editor
 */
export class BlockNoteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BlockNote Error Boundary] Caught error:', error);
    console.error('[BlockNote Error Boundary] Error info:', errorInfo);
    console.error('[BlockNote Error Boundary] Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-700 font-semibold mb-2">BlockNote Editor Error</h3>
              <p className="text-red-600 text-sm mb-4">
                The visual editor encountered an error. You can try again or switch to markdown mode.
              </p>

              {/* Error Details */}
              <details className="mb-4">
                <summary className="text-red-600 text-sm cursor-pointer hover:underline">
                  View error details
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
                  </div>
                  {this.state.error?.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                {this.props.onFallbackToMarkdown && (
                  <button
                    onClick={this.props.onFallbackToMarkdown}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    Switch to Markdown
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BlockNoteErrorBoundary;
