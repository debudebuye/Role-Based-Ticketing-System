import { Component } from 'react';

/**
 * Error boundary — catches unhandled render errors in the subtree and shows
 * a recovery UI instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary>          — wraps the whole app (root boundary)
 *   <ErrorBoundary key="x"> — wraps a feature route (feature-level boundary)
 *
 * To enable Sentry, install @sentry/react and uncomment the import + call below.
 */

// import * as Sentry from '@sentry/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Send to error-tracking service in production
    if (import.meta.env.PROD) {
      // Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    }
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            An unexpected error occurred. You can try refreshing the page or
            clicking the button below to recover.
          </p>
          {/* Show error message in development only */}
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs bg-gray-100 rounded p-3 mb-6 overflow-auto text-red-600">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go to home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
