// Enhanced API client with comprehensive error handling
import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api/v1',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    }
});

// Error types
export const ErrorTypes = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    CLIENT_ERROR: 'CLIENT_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Custom error classes
export class APIError extends Error {
    constructor(message, type, statusCode = null, details = {}) {
        super(message);
        this.name = 'APIError';
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

// Error handler utility class
class ErrorHandler {
    constructor() {
        this.errorCounts = {};
        this.retryDelays = [1000, 2000, 4000]; // Exponential backoff delays
        this.maxRetries = 3;
    }

    // Log error to console and external service
    logError(error, context = {}) {
        const errorData = {
            error: error.toJSON ? error.toJSON() : {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                userId: this.getUserId(),
                sessionId: this.getSessionId(),
                ...context
            }
        };

        // Update error counts
        const errorType = error.type || error.name || 'UnknownError';
        this.errorCounts[errorType] = (this.errorCounts[errorType] || 0) + 1;

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 API Error');
            console.error('Error:', error);
            console.error('Context:', context);
            console.error('Full Data:', errorData);
            console.groupEnd();
        }

        // Send to logging service
        this.sendToLoggingService(errorData);
    }

    // Send error to backend logging service
    async sendToLoggingService(errorData) {
        try {
            await fetch('/api/v1/errors/client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData)
            });
        } catch (error) {
            console.warn('Failed to send error to logging service:', error);
        }
    }

    // Get user ID from storage or context
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.id || null;
        } catch {
            return null;
        }
    }

    // Get or generate session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    // Handle different types of axios errors
    handleAxiosError(error, context = {}) {
        let apiError;

        if (error.code === 'ECONNABORTED') {
            // Timeout error
            apiError = new APIError(
                'Request timed out. Please check your connection and try again.',
                ErrorTypes.TIMEOUT_ERROR,
                null,
                { timeout: error.config?.timeout }
            );
        } else if (!error.response) {
            // Network error
            apiError = new APIError(
                'Network error. Please check your internet connection.',
                ErrorTypes.NETWORK_ERROR,
                null,
                { code: error.code, message: error.message }
            );
        } else {
            // Server response error
            const { status, data } = error.response;
            let errorType = ErrorTypes.SERVER_ERROR;
            let message = 'An error occurred while processing your request.';

            // Determine error type based on status code
            switch (status) {
                case 400:
                    errorType = ErrorTypes.VALIDATION_ERROR;
                    message = data?.message || 'Invalid request data.';
                    break;
                case 401:
                    errorType = ErrorTypes.AUTHENTICATION_ERROR;
                    message = 'Please log in to continue.';
                    break;
                case 403:
                    errorType = ErrorTypes.AUTHORIZATION_ERROR;
                    message = 'You don\'t have permission to perform this action.';
                    break;
                case 404:
                    errorType = ErrorTypes.CLIENT_ERROR;
                    message = 'The requested resource was not found.';
                    break;
                case 429:
                    errorType = ErrorTypes.RATE_LIMIT_ERROR;
                    message = 'Too many requests. Please wait before trying again.';
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    errorType = ErrorTypes.SERVER_ERROR;
                    message = 'Server error. Please try again later.';
                    break;
                default:
                    errorType = status >= 400 && status < 500 ? ErrorTypes.CLIENT_ERROR : ErrorTypes.SERVER_ERROR;
                    message = data?.message || message;
            }

            apiError = new APIError(
                message,
                errorType,
                status,
                {
                    responseData: data,
                    url: error.config?.url,
                    method: error.config?.method?.toUpperCase()
                }
            );
        }

        this.logError(apiError, context);
        return apiError;
    }

    // Retry logic for failed requests
    async retry(requestFn, maxRetries = this.maxRetries) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                // Don't retry on client errors (4xx) except 408, 429
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    if (![408, 429].includes(error.response.status)) {
                        throw error;
                    }
                }

                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    throw error;
                }

                // Wait before retrying
                const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
                await new Promise(resolve => setTimeout(resolve, delay));
                
                console.log(`Retrying request (attempt ${attempt + 2}/${maxRetries + 1})`);
            }
        }
        
        throw lastError;
    }

    // Get error statistics
    getErrorStats() {
        return {
            errorCounts: { ...this.errorCounts },
            totalErrors: Object.values(this.errorCounts).reduce((sum, count) => sum + count, 0),
            mostCommonError: Object.keys(this.errorCounts).reduce((a, b) => 
                this.errorCounts[a] > this.errorCounts[b] ? a : b
            , ''),
            timestamp: new Date().toISOString()
        };
    }

    // Clear error statistics
    clearErrorStats() {
        this.errorCounts = {};
    }
}

// Global error handler instance
const errorHandler = new ErrorHandler();

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp
        config.metadata = { startTime: Date.now() };

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Log successful requests in development
        if (process.env.NODE_ENV === 'development') {
            const duration = Date.now() - response.config.metadata?.startTime;
            console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
        }

        return response;
    },
    (error) => {
        const apiError = errorHandler.handleAxiosError(error, {
            duration: error.config?.metadata?.startTime ? 
                Date.now() - error.config.metadata.startTime : null
        });

        return Promise.reject(apiError);
    }
);

// Enhanced API methods with retry logic
export const api = {
    // GET request with retry
    async get(url, config = {}) {
        return errorHandler.retry(async () => {
            const response = await apiClient.get(url, config);
            return response.data;
        });
    },

    // POST request with retry
    async post(url, data = {}, config = {}) {
        return errorHandler.retry(async () => {
            const response = await apiClient.post(url, data, config);
            return response.data;
        });
    },

    // PUT request with retry
    async put(url, data = {}, config = {}) {
        return errorHandler.retry(async () => {
            const response = await apiClient.put(url, data, config);
            return response.data;
        });
    },

    // DELETE request with retry
    async delete(url, config = {}) {
        return errorHandler.retry(async () => {
            const response = await apiClient.delete(url, config);
            return response.data;
        });
    },

    // PATCH request with retry
    async patch(url, data = {}, config = {}) {
        return errorHandler.retry(async () => {
            const response = await apiClient.patch(url, data, config);
            return response.data;
        });
    },

    // Upload file with progress
    async uploadFile(url, file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 300000, // 5 minutes for file uploads
            onUploadProgress: onProgress
        };

        return errorHandler.retry(async () => {
            const response = await apiClient.post(url, formData, config);
            return response.data;
        }, 1); // Only retry once for file uploads
    }
};

// Utility functions for error handling
export const ErrorUtils = {
    // Check if error is of specific type
    isErrorType(error, type) {
        return error?.type === type;
    },

    // Check if error should show user-friendly message
    shouldShowToUser(error) {
        const userFriendlyTypes = [
            ErrorTypes.VALIDATION_ERROR,
            ErrorTypes.AUTHENTICATION_ERROR,
            ErrorTypes.AUTHORIZATION_ERROR,
            ErrorTypes.RATE_LIMIT_ERROR,
            ErrorTypes.NETWORK_ERROR,
            ErrorTypes.TIMEOUT_ERROR
        ];
        return userFriendlyTypes.includes(error?.type);
    },

    // Get user-friendly error message
    getUserMessage(error) {
        if (!error) return 'An unexpected error occurred.';
        
        return error.message || 'An unexpected error occurred.';
    },

    // Check if error requires authentication
    requiresAuth(error) {
        return error?.type === ErrorTypes.AUTHENTICATION_ERROR;
    },

    // Check if operation should be retried
    shouldRetry(error) {
        const retryableTypes = [
            ErrorTypes.NETWORK_ERROR,
            ErrorTypes.TIMEOUT_ERROR,
            ErrorTypes.SERVER_ERROR
        ];
        return retryableTypes.includes(error?.type);
    },

    // Format error for display
    formatError(error) {
        return {
            type: error?.type || ErrorTypes.UNKNOWN_ERROR,
            message: this.getUserMessage(error),
            statusCode: error?.statusCode,
            timestamp: error?.timestamp || new Date().toISOString(),
            canRetry: this.shouldRetry(error),
            requiresAuth: this.requiresAuth(error)
        };
    }
};

// Global error event listener
window.addEventListener('unhandledrejection', (event) => {
    const error = new APIError(
        event.reason?.message || 'Unhandled promise rejection',
        ErrorTypes.UNKNOWN_ERROR,
        null,
        { originalError: event.reason }
    );
    
    errorHandler.logError(error, { source: 'unhandledRejection' });
});

// Export main components
export { apiClient, errorHandler, ErrorHandler };
export default api;