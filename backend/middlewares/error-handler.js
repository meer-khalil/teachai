const { 
    AppError, 
    isOperationalError, 
    getErrorSeverity 
} = require('../utils/errors');
const { StatusCodes } = require('http-status-codes');
const logger = require('./logger').errorLogger;

// Development error response
const sendErrorDev = (err, req, res) => {
    const errorResponse = {
        success: false,
        status: err.status,
        error: {
            name: err.name,
            message: err.message,
            statusCode: err.statusCode,
            type: err.type || 'UnknownError',
            stack: err.stack,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            path: req.originalUrl,
            method: req.method
        }
    };

    // Add additional error details if available
    if (err.field) errorResponse.error.field = err.field;
    if (err.value) errorResponse.error.value = err.value;
    if (err.resource) errorResponse.error.resource = err.resource;
    if (err.operation) errorResponse.error.operation = err.operation;
    if (err.service) errorResponse.error.service = err.service;

    res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
};

// Production error response
const sendErrorProd = (err, req, res) => {
    const errorResponse = {
        success: false,
        status: err.status,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    };

    // Only send error details for operational errors
    if (isOperationalError(err)) {
        errorResponse.message = err.message;
        errorResponse.type = err.type || 'ApplicationError';
        
        // Add specific error details for client
        if (err.field) errorResponse.field = err.field;
        if (err.resource) errorResponse.resource = err.resource;
        if (err.retryAfter) errorResponse.retryAfter = err.retryAfter;
    } else {
        // Don't leak error details for programming errors
        errorResponse.message = 'Something went wrong. Please try again later.';
        errorResponse.type = 'InternalError';
    }

    res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
};

// Handle specific error types
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'duplicate value';
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', StatusCodes.UNAUTHORIZED);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', StatusCodes.UNAUTHORIZED);

const handleMulterError = (err) => {
    let message = 'File upload failed';
    let statusCode = StatusCodes.BAD_REQUEST;

    if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large. Please upload a smaller file.';
        statusCode = StatusCodes.REQUEST_ENTITY_TOO_LARGE;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
        message = 'Too many files. Please upload fewer files.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        message = 'Unexpected file field. Please check your upload configuration.';
    }

    return new AppError(message, statusCode);
};

// Log error with context
const logError = (err, req) => {
    const errorContext = {
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
            type: err.type || 'UnknownError',
            severity: getErrorSeverity(err),
            isOperational: isOperationalError(err)
        },
        request: {
            id: req.requestId,
            method: req.method,
            url: req.originalUrl,
            headers: {
                userAgent: req.get('User-Agent'),
                referer: req.get('Referer'),
                contentType: req.get('Content-Type')
            },
            ip: req.ip,
            user: req.user ? {
                id: req.user.id,
                email: req.user.email
            } : null,
            timestamp: new Date().toISOString()
        }
    };

    // Don't log request body for security reasons in production
    if (process.env.NODE_ENV !== 'production') {
        errorContext.request.body = req.body;
        errorContext.request.query = req.query;
        errorContext.request.params = req.params;
    }

    // Log based on severity
    const severity = getErrorSeverity(err);
    switch (severity) {
        case 'critical':
            logger.error('Critical Error', errorContext);
            break;
        case 'high':
            logger.error('High Severity Error', errorContext);
            break;
        case 'medium':
            logger.warn('Medium Severity Error', errorContext);
            break;
        case 'low':
            logger.info('Low Severity Error', errorContext);
            break;
        default:
            logger.error('Unknown Severity Error', errorContext);
    }
};

// Main error handling middleware
const globalErrorHandler = (err, req, res, next) => {
    // Ensure error has statusCode and status
    err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    err.status = err.status || 'error';

    // Add request ID if not present
    if (!req.requestId) {
        req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.name === 'MulterError') error = handleMulterError(error);

    // Log the error
    logError(error, req);

    // Send error response based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, req, res);
    } else {
        sendErrorProd(error, req, res);
    }
};

// Async error handler wrapper
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
    
    // Log the unhandled rejection
    if (logger) {
        logger.error('Unhandled Promise Rejection', {
            reason: reason.toString(),
            stack: reason.stack,
            promise: promise.toString(),
            timestamp: new Date().toISOString()
        });
    }

    // Graceful shutdown
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    
    // Log the uncaught exception
    if (logger) {
        logger.error('Uncaught Exception', {
            name: err.name,
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    }

    // Graceful shutdown
    process.exit(1);
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    if (logger) {
        logger.info('Graceful Shutdown', {
            signal,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }

    // Close server gracefully
    if (global.server) {
        global.server.close((err) => {
            if (err) {
                console.error('Error during server close:', err);
                process.exit(1);
            }
            
            console.log('Server closed successfully');
            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 404 handler for unmatched routes
const handleNotFound = (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server!`, StatusCodes.NOT_FOUND);
    next(err);
};

module.exports = {
    globalErrorHandler,
    catchAsync,
    handleNotFound,
    sendErrorDev,
    sendErrorProd,
    logError
};