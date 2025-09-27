import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Main Error Boundary Component
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Generate unique error ID
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Log the error
        this.logError(error, errorInfo, errorId);
        
        // Update state with error details
        this.setState({
            error,
            errorInfo,
            errorId
        });
    }

    logError = (error, errorInfo, errorId) => {
        const errorData = {
            errorId,
            name: error.name,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getUserId(),
            sessionId: this.getSessionId(),
            buildVersion: process.env.REACT_APP_VERSION || 'unknown'
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 React Error Boundary');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Error Data:', errorData);
            console.groupEnd();
        }

        // Send to logging service
        this.sendErrorToService(errorData);
    };

    getUserId = () => {
        // Get user ID from context, localStorage, or other source
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.id || null;
        } catch {
            return null;
        }
    };

    getSessionId = () => {
        // Get or generate session ID
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    };

    sendErrorToService = async (errorData) => {
        try {
            // Send error to backend logging endpoint
            await fetch('/api/v1/errors/client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData)
            });
        } catch (error) {
            console.error('Failed to send error to logging service:', error);
        }
    };

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoBack = () => {
        window.history.back();
    };

    render() {
        if (this.state.hasError) {
            const { fallback: FallbackComponent, level = 'component' } = this.props;
            
            // Use custom fallback component if provided
            if (FallbackComponent) {
                return (
                    <FallbackComponent
                        error={this.state.error}
                        errorInfo={this.state.errorInfo}
                        errorId={this.state.errorId}
                        retryCount={this.state.retryCount}
                        onRetry={this.handleRetry}
                        onReload={this.handleReload}
                        onGoBack={this.handleGoBack}
                    />
                );
            }

            // Default fallback UI based on error level
            if (level === 'application') {
                return <ApplicationErrorFallback {...this.state} onRetry={this.handleRetry} onReload={this.handleReload} />;
            } else if (level === 'page') {
                return <PageErrorFallback {...this.state} onRetry={this.handleRetry} onGoBack={this.handleGoBack} />;
            } else {
                return <ComponentErrorFallback {...this.state} onRetry={this.handleRetry} />;
            }
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.elementType,
    level: PropTypes.oneOf(['component', 'page', 'application'])
};

// Application-level error fallback
const ApplicationErrorFallback = ({ error, errorId, onRetry, onReload }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Application Error
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Something went wrong with the application. We've been notified and are working on a fix.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-4 bg-red-50 rounded-md">
                            <p className="text-sm text-red-800 font-mono">{error?.message}</p>
                            <p className="text-xs text-red-600 mt-1">Error ID: {errorId}</p>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex flex-col space-y-3">
                    <button
                        onClick={onRetry}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={onReload}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Page-level error fallback
const PageErrorFallback = ({ error, errorId, onRetry, onGoBack }) => (
    <div className="min-h-96 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
                    Page Error
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    This page encountered an error and couldn't be displayed properly.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md text-left">
                        <p className="text-sm text-red-800 font-mono">{error?.message}</p>
                        <p className="text-xs text-red-600 mt-1">Error ID: {errorId}</p>
                    </div>
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={onRetry}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Retry
                </button>
                <button
                    onClick={onGoBack}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Go Back
                </button>
            </div>
        </div>
    </div>
);

// Component-level error fallback
const ComponentErrorFallback = ({ error, errorId, onRetry }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                    Component Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                    <p>This component encountered an error and couldn't be displayed.</p>
                    {process.env.NODE_ENV === 'development' && (
                        <p className="mt-1 font-mono text-xs">{error?.message}</p>
                    )}
                </div>
                <div className="mt-3">
                    <button
                        onClick={onRetry}
                        className="text-sm font-medium text-red-800 hover:text-red-600 focus:outline-none focus:underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (WrappedComponent, options = {}) => {
    const WithErrorBoundaryComponent = React.forwardRef((props, ref) => {
        return (
            <ErrorBoundary {...options}>
                <WrappedComponent {...props} ref={ref} />
            </ErrorBoundary>
        );
    });

    WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return WithErrorBoundaryComponent;
};

// Hook for handling errors in functional components
export const useErrorHandler = () => {
    const errorHandler = React.useCallback((error, errorInfo = {}) => {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const errorData = {
            errorId,
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...errorInfo
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Handled Error:', errorData);
        }

        // Send to logging service
        fetch('/api/v1/errors/client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(errorData)
        }).catch(err => {
            console.error('Failed to send error to logging service:', err);
        });

        return errorId;
    }, []);

    return errorHandler;
};

// Async error boundary for handling async errors
export const AsyncErrorBoundary = ({ children, fallback }) => {
    const [asyncError, setAsyncError] = React.useState(null);
    
    const resetError = React.useCallback(() => {
        setAsyncError(null);
    }, []);

    const handleAsyncError = React.useCallback((error) => {
        setAsyncError(error);
    }, []);

    React.useEffect(() => {
        const handleUnhandledRejection = (event) => {
            handleAsyncError(event.reason);
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [handleAsyncError]);

    if (asyncError) {
        if (fallback) {
            return fallback({ error: asyncError, resetError });
        }
        
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">
                    <p>An async operation failed: {asyncError.message}</p>
                    <button 
                        onClick={resetError}
                        className="mt-2 text-red-800 hover:text-red-600 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            {children}
        </ErrorBoundary>
    );
};

export default ErrorBoundary;