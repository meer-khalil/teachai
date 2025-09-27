const { StatusCodes } = require('http-status-codes');

// Base error class for all application errors
class AppError extends Error {
    constructor(message, statusCode, isOperational = true, stack = '') {
        super(message);
        
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;
        
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // Convert error to JSON for logging
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            status: this.status,
            isOperational: this.isOperational,
            stack: this.stack,
            timestamp: new Date().toISOString()
        };
    }
}

// Validation errors (400)
class ValidationError extends AppError {
    constructor(message = 'Validation failed', field = null, value = null) {
        super(message, StatusCodes.BAD_REQUEST);
        this.field = field;
        this.value = value;
        this.type = 'ValidationError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field,
            value: this.value,
            type: this.type
        };
    }
}

// Authentication errors (401)
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, StatusCodes.UNAUTHORIZED);
        this.type = 'AuthenticationError';
    }
}

// Authorization errors (403)
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, StatusCodes.FORBIDDEN);
        this.type = 'AuthorizationError';
    }
}

// Not found errors (404)
class NotFoundError extends AppError {
    constructor(resource = 'Resource', identifier = null) {
        const message = identifier 
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, StatusCodes.NOT_FOUND);
        this.resource = resource;
        this.identifier = identifier;
        this.type = 'NotFoundError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            resource: this.resource,
            identifier: this.identifier,
            type: this.type
        };
    }
}

// Conflict errors (409)
class ConflictError extends AppError {
    constructor(message = 'Resource conflict', resource = null) {
        super(message, StatusCodes.CONFLICT);
        this.resource = resource;
        this.type = 'ConflictError';
    }
}

// Rate limiting errors (429)
class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter = null) {
        super(message, StatusCodes.TOO_MANY_REQUESTS);
        this.retryAfter = retryAfter;
        this.type = 'RateLimitError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
            type: this.type
        };
    }
}

// Database errors (500)
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', operation = null, collection = null) {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR);
        this.operation = operation;
        this.collection = collection;
        this.type = 'DatabaseError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation,
            collection: this.collection,
            type: this.type
        };
    }
}

// External API errors (502, 503, 504)
class ExternalAPIError extends AppError {
    constructor(
        message = 'External service error', 
        service = null, 
        statusCode = StatusCodes.BAD_GATEWAY,
        originalError = null
    ) {
        super(message, statusCode);
        this.service = service;
        this.originalError = originalError;
        this.type = 'ExternalAPIError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            service: this.service,
            originalError: this.originalError ? {
                message: this.originalError.message,
                name: this.originalError.name,
                stack: this.originalError.stack
            } : null,
            type: this.type
        };
    }
}

// File upload errors (400, 413)
class FileUploadError extends AppError {
    constructor(
        message = 'File upload failed', 
        fileName = null, 
        fileSize = null, 
        statusCode = StatusCodes.BAD_REQUEST
    ) {
        super(message, statusCode);
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.type = 'FileUploadError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            fileName: this.fileName,
            fileSize: this.fileSize,
            type: this.type
        };
    }
}

// Business logic errors (400)
class BusinessLogicError extends AppError {
    constructor(message = 'Business rule violation', rule = null, context = null) {
        super(message, StatusCodes.BAD_REQUEST);
        this.rule = rule;
        this.context = context;
        this.type = 'BusinessLogicError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            rule: this.rule,
            context: this.context,
            type: this.type
        };
    }
}

// Configuration errors (500)
class ConfigurationError extends AppError {
    constructor(message = 'Configuration error', config = null) {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR);
        this.config = config;
        this.type = 'ConfigurationError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            config: this.config,
            type: this.type
        };
    }
}

// Timeout errors (408, 504)
class TimeoutError extends AppError {
    constructor(
        message = 'Operation timeout', 
        operation = null, 
        timeout = null, 
        statusCode = StatusCodes.REQUEST_TIMEOUT
    ) {
        super(message, statusCode);
        this.operation = operation;
        this.timeout = timeout;
        this.type = 'TimeoutError';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation,
            timeout: this.timeout,
            type: this.type
        };
    }
}

// Error factory functions
const createValidationError = (message, field = null, value = null) => {
    return new ValidationError(message, field, value);
};

const createAuthenticationError = (message = 'Authentication failed') => {
    return new AuthenticationError(message);
};

const createAuthorizationError = (message = 'Access denied') => {
    return new AuthorizationError(message);
};

const createNotFoundError = (resource = 'Resource', identifier = null) => {
    return new NotFoundError(resource, identifier);
};

const createDatabaseError = (message, operation = null, collection = null) => {
    return new DatabaseError(message, operation, collection);
};

const createExternalAPIError = (service, originalError, message = null) => {
    const errorMessage = message || `${service} service error: ${originalError.message}`;
    return new ExternalAPIError(errorMessage, service, StatusCodes.BAD_GATEWAY, originalError);
};

const createFileUploadError = (message, fileName = null, fileSize = null) => {
    return new FileUploadError(message, fileName, fileSize);
};

const createRateLimitError = (message = 'Rate limit exceeded', retryAfter = null) => {
    return new RateLimitError(message, retryAfter);
};

// Error type checking utilities
const isOperationalError = (error) => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};

const isValidationError = (error) => error instanceof ValidationError;
const isAuthenticationError = (error) => error instanceof AuthenticationError;
const isAuthorizationError = (error) => error instanceof AuthorizationError;
const isNotFoundError = (error) => error instanceof NotFoundError;
const isDatabaseError = (error) => error instanceof DatabaseError;
const isExternalAPIError = (error) => error instanceof ExternalAPIError;
const isFileUploadError = (error) => error instanceof FileUploadError;
const isRateLimitError = (error) => error instanceof RateLimitError;

// Error severity levels
const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Get error severity based on type and status code
const getErrorSeverity = (error) => {
    if (error instanceof AppError) {
        // Critical errors
        if (error.statusCode >= 500) {
            return ErrorSeverity.CRITICAL;
        }
        
        // High severity errors
        if (error instanceof AuthenticationError || 
            error instanceof DatabaseError ||
            error instanceof ExternalAPIError) {
            return ErrorSeverity.HIGH;
        }
        
        // Medium severity errors
        if (error instanceof AuthorizationError ||
            error instanceof ConflictError ||
            error instanceof RateLimitError) {
            return ErrorSeverity.MEDIUM;
        }
        
        // Low severity errors (validation, not found, etc.)
        return ErrorSeverity.LOW;
    }
    
    // Unknown errors are treated as critical
    return ErrorSeverity.CRITICAL;
};

module.exports = {
    // Error classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    ExternalAPIError,
    FileUploadError,
    BusinessLogicError,
    ConfigurationError,
    TimeoutError,
    
    // Factory functions
    createValidationError,
    createAuthenticationError,
    createAuthorizationError,
    createNotFoundError,
    createDatabaseError,
    createExternalAPIError,
    createFileUploadError,
    createRateLimitError,
    
    // Utility functions
    isOperationalError,
    isValidationError,
    isAuthenticationError,
    isAuthorizationError,
    isNotFoundError,
    isDatabaseError,
    isExternalAPIError,
    isFileUploadError,
    isRateLimitError,
    
    // Constants
    ErrorSeverity,
    getErrorSeverity
};