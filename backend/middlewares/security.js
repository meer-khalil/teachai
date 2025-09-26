const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Rate limiting configuration
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message) => {
    return rateLimit({
        windowMs, // Time window in milliseconds
        max, // Limit each IP to max requests per windowMs
        message: message || {
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 requests per windowMs
    {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.'
    }
);

const generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
);

const apiLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    1000, // limit each IP to 1000 API calls per windowMs
);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGINS 
            ? process.env.CORS_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:3001'];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies to be sent
    optionsSuccessStatus: 200 // Support legacy browsers
};

// Security middleware configuration
const securityMiddleware = (app) => {
    // Basic security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.openai.com"],
            },
        },
        crossOriginEmbedderPolicy: false // Allow embedding for development
    }));
    
    // CORS
    app.use(cors(corsOptions));
    
    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize());
    
    // Data sanitization against XSS
    app.use(xss());
    
    // Prevent parameter pollution
    app.use(hpp({
        whitelist: ['sort', 'fields', 'page', 'limit'] // Allow these parameters to be duplicated
    }));
    
    // Apply rate limiting
    app.use('/api/', generalLimiter);
    app.use('/api/v1/auth/', authLimiter);
    app.use('/api/v1/', apiLimiter);
};

// Input validation middleware
const validateInput = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                details: error.details.map(detail => detail.message)
            });
        }
        next();
    };
};

// API key validation middleware
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key is required'
        });
    }
    
    // In production, validate against a database of valid API keys
    // For now, we'll use a simple environment variable
    const validApiKey = process.env.API_KEY;
    
    if (apiKey !== validApiKey) {
        return res.status(403).json({
            success: false,
            message: 'Invalid API key'
        });
    }
    
    next();
};

// Security headers middleware for API responses
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
};

module.exports = {
    securityMiddleware,
    authLimiter,
    generalLimiter,
    apiLimiter,
    validateInput,
    validateApiKey,
    securityHeaders,
    corsOptions
};