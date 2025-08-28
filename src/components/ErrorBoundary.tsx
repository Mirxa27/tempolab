// Comprehensive Error Boundary with user-friendly error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error tracking service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    console.error('Error Boundary caught an error:', errorReport);

    // Example integration with error tracking service
    if (import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureException(error, { extra: errorReport });
    }

    // Send to custom error tracking endpoint
    this.sendErrorReport(errorReport);
  };

  private getCurrentUserId = (): string | null => {
    // Get current user ID from your auth context or localStorage
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };

  private sendErrorReport = async (errorReport: any) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorMessage = (error: Error): string => {
    // Provide user-friendly error messages based on error types
    if (error.message.includes('ChunkLoadError')) {
      return 'There was an issue loading the application. This usually happens after an update.';
    }
    
    if (error.message.includes('Network')) {
      return 'There seems to be a network connectivity issue. Please check your internet connection.';
    }
    
    if (error.message.includes('Permission')) {
      return 'You don\'t have permission to access this feature. Please contact support if you believe this is an error.';
    }
    
    if (error.message.includes('Authentication')) {
      return 'Your session has expired. Please log in again.';
    }
    
    return 'Something unexpected happened. Our team has been notified and will look into it.';
  };

  private getErrorTitle = (error: Error): string => {
    if (error.message.includes('ChunkLoadError')) {
      return 'Application Update Required';
    }
    
    if (error.message.includes('Network')) {
      return 'Connection Problem';
    }
    
    if (error.message.includes('Permission')) {
      return 'Access Denied';
    }
    
    if (error.message.includes('Authentication')) {
      return 'Session Expired';
    }
    
    return 'Oops! Something went wrong';
  };

  private getSuggestedActions = (error: Error): React.ReactNode => {
    if (error.message.includes('ChunkLoadError')) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Try refreshing the page to load the latest version of the application.
          </p>
          <Button onClick={this.handleReload} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      );
    }
    
    if (error.message.includes('Network')) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Please check your internet connection and try again.
          </p>
          <div className="space-y-2">
            <Button onClick={this.handleRetry} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={this.handleReload} className="w-full">
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
    
    if (error.message.includes('Authentication')) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Please log in again to continue using the application.
          </p>
          <Button onClick={() => window.location.href = '/login'} className="w-full">
            Go to Login
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          You can try refreshing the page or return to the homepage.
        </p>
        <div className="space-y-2">
          <Button onClick={this.handleRetry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={this.handleGoHome} variant="outline" className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Go to Homepage
          </Button>
          <Button onClick={this.handleReload} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error!;
      const errorTitle = this.getErrorTitle(error);
      const errorMessage = this.getErrorMessage(error);
      const suggestedActions = this.getSuggestedActions(error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {errorTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                {errorMessage}
              </p>
              
              {suggestedActions}
              
              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-gray-500 text-center">
                    Error ID: {this.state.errorId}
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Please include this ID when contacting support.
                  </p>
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => window.location.href = '/contact'}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Contact Support
                    </Button>
                  </div>
                </div>
              )}

              {/* Development mode error details */}
              {import.meta.env.DEV && (
                <details className="mt-4 p-3 bg-gray-100 rounded border">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Developer Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <h4 className="text-xs font-medium text-gray-600">Error:</h4>
                      <pre className="text-xs text-red-600 overflow-auto">
                        {error.message}
                      </pre>
                    </div>
                    {error.stack && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-600">Stack Trace:</h4>
                        <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-600">Component Stack:</h4>
                        <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for handling async errors
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error) => {
    // Throw error to be caught by error boundary
    throw error;
  }, []);

  return handleError;
};

// Utility for handling promise rejections
export const handleAsyncError = (error: Error) => {
  // Log to console and monitoring service
  console.error('Async error occurred:', error);
  
  // You could also dispatch to a global error state here
  // or show a toast notification
  
  return error;
};

export default ErrorBoundary;