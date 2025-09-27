const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Create daily rotate file transport
const createRotateTransport = (filename, level = 'info') => {
    return new DailyRotateFile({
        filename: path.join(logsDir, `${filename}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level,
        format: logFormat,
        auditFile: path.join(logsDir, `.${filename}-audit.json`)
    });
};

// Application logger configuration
const appLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'teachai-backend',
        version: process.env.APP_VERSION || '1.0.0'
    },
    transports: [
        // Console transport for development
        ...(process.env.NODE_ENV === 'development' ? [
            new winston.transports.Console({
                format: consoleFormat
            })
        ] : []),
        
        // File transports
        createRotateTransport('application', 'info'),
        createRotateTransport('error', 'error'),
        
        // Combined log for all levels
        createRotateTransport('combined', 'debug')
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'exceptions.log'),
            format: logFormat
        })
    ],
    
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'rejections.log'),
            format: logFormat
        })
    ],
    
    exitOnError: false
});

// Error-specific logger
const errorLogger = winston.createLogger({
    level: 'error',
    format: logFormat,
    defaultMeta: { 
        service: 'teachai-backend-errors',
        version: process.env.APP_VERSION || '1.0.0'
    },
    transports: [
        createRotateTransport('errors', 'error'),
        ...(process.env.NODE_ENV === 'development' ? [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ] : [])
    ]
});

// Performance logger for slow operations
const performanceLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'teachai-performance'
    },
    transports: [
        createRotateTransport('performance', 'info')
    ]
});

// Security logger for security events
const securityLogger = winston.createLogger({
    level: 'warn',
    format: logFormat,
    defaultMeta: { 
        service: 'teachai-security'
    },
    transports: [
        createRotateTransport('security', 'warn'),
        ...(process.env.NODE_ENV === 'development' ? [
            new winston.transports.Console({
                format: consoleFormat
            })
        ] : [])
    ]
});

// Audit logger for user actions
const auditLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { 
        service: 'teachai-audit'
    },
    transports: [
        createRotateTransport('audit', 'info')
    ]
});

// Generate unique request ID
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Request ID middleware
const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.get('X-Request-ID') || generateRequestId();
    res.set('X-Request-ID', req.requestId);
    next();
};

// Custom Morgan token for request ID
morgan.token('requestId', (req) => req.requestId);

// Custom Morgan token for user ID
morgan.token('userId', (req) => req.user ? req.user.id : 'anonymous');

// Custom Morgan token for response time with color coding
morgan.token('colorResponseTime', (req, res) => {
    const responseTime = parseFloat(morgan['response-time'](req, res));
    if (responseTime < 100) return `\x1b[32m${responseTime}ms\x1b[0m`; // Green
    if (responseTime < 500) return `\x1b[33m${responseTime}ms\x1b[0m`; // Yellow
    return `\x1b[31m${responseTime}ms\x1b[0m`; // Red
});

// Morgan format for development
const morganDevFormat = ':method :url :status :colorResponseTime - :requestId - :userId';

// Morgan format for production
const morganProdFormat = JSON.stringify({
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time',
    requestId: ':requestId',
    userId: ':userId',
    userAgent: ':user-agent',
    ip: ':remote-addr',
    timestamp: ':date[iso]'
});

// Request logging middleware
const requestLogger = morgan(
    process.env.NODE_ENV === 'development' ? morganDevFormat : morganProdFormat,
    {
        stream: {
            write: (message) => {
                if (process.env.NODE_ENV === 'development') {
                    // Console output for development
                    process.stdout.write(message);
                } else {
                    // Structured logging for production
                    try {
                        const logData = JSON.parse(message.trim());
                        appLogger.info('HTTP Request', logData);
                    } catch (err) {
                        appLogger.info('HTTP Request', { message: message.trim() });
                    }
                }
            }
        }
    }
);

// Slow query logging middleware
const slowQueryLogger = (threshold = 1000) => {
    return (req, res, next) => {
        const startTime = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            
            if (duration > threshold) {
                performanceLogger.warn('Slow Request Detected', {
                    requestId: req.requestId,
                    method: req.method,
                    url: req.originalUrl,
                    duration: `${duration}ms`,
                    statusCode: res.statusCode,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip,
                    user: req.user ? {
                        id: req.user.id,
                        email: req.user.email
                    } : null,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        next();
    };
};

// Security event logger
const logSecurityEvent = (event, details, req = null) => {
    const logData = {
        event,
        details,
        timestamp: new Date().toISOString(),
        ip: req ? req.ip : null,
        userAgent: req ? req.get('User-Agent') : null,
        requestId: req ? req.requestId : null,
        user: req && req.user ? {
            id: req.user.id,
            email: req.user.email
        } : null
    };
    
    securityLogger.warn('Security Event', logData);
};

// Audit event logger
const logAuditEvent = (action, resource, details, req) => {
    const logData = {
        action,
        resource,
        details,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        } : null
    };
    
    auditLogger.info('User Action', logData);
};

// Database operation logger
const logDatabaseOperation = (operation, collection, query, duration, success = true, error = null) => {
    const logData = {
        operation,
        collection,
        query: JSON.stringify(query),
        duration: `${duration}ms`,
        success,
        error: error ? {
            name: error.name,
            message: error.message
        } : null,
        timestamp: new Date().toISOString()
    };
    
    if (success) {
        if (duration > 100) { // Slow query threshold
            performanceLogger.warn('Slow Database Operation', logData);
        } else {
            performanceLogger.info('Database Operation', logData);
        }
    } else {
        errorLogger.error('Database Operation Failed', logData);
    }
};

// API call logger for external services
const logExternalAPICall = (service, endpoint, method, duration, success = true, statusCode = null, error = null) => {
    const logData = {
        service,
        endpoint,
        method,
        duration: `${duration}ms`,
        success,
        statusCode,
        error: error ? {
            name: error.name,
            message: error.message
        } : null,
        timestamp: new Date().toISOString()
    };
    
    if (success) {
        appLogger.info('External API Call', logData);
    } else {
        errorLogger.error('External API Call Failed', logData);
    }
};

// Log cleanup utility
const cleanupOldLogs = () => {
    const cleanupLogger = winston.createLogger({
        transports: [
            new winston.transports.Console()
        ]
    });
    
    cleanupLogger.info('Log cleanup completed', {
        timestamp: new Date().toISOString()
    });
};

// Express error logging middleware
const expressErrorLogger = (err, req, res, next) => {
    errorLogger.error('Express Error', {
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack
        },
        request: {
            id: req.requestId,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        },
        timestamp: new Date().toISOString()
    });
    
    next(err);
};

module.exports = {
    // Loggers
    appLogger,
    errorLogger,
    performanceLogger,
    securityLogger,
    auditLogger,
    
    // Middleware
    requestIdMiddleware,
    requestLogger,
    slowQueryLogger,
    expressErrorLogger,
    
    // Utility functions
    logSecurityEvent,
    logAuditEvent,
    logDatabaseOperation,
    logExternalAPICall,
    generateRequestId,
    cleanupOldLogs
};