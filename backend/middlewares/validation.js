const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
    }),
    
    name: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'string.pattern.base': 'Name can only contain letters and spaces',
        'any.required': 'Name is required'
    }),
    
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).messages({
        'string.pattern.base': 'Please provide a valid phone number'
    }),
    
    objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': 'Invalid ID format'
    })
};

// User registration validation
const registerSchema = Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
    }),
    phone: commonSchemas.phone.optional(),
    role: Joi.string().valid('student', 'teacher', 'admin').default('student')
});

// User login validation
const loginSchema = Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

// Password reset request validation
const forgotPasswordSchema = Joi.object({
    email: commonSchemas.email
});

// Password reset validation
const resetPasswordSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Reset token is required'
    }),
    password: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
    })
});

// Profile update validation
const updateProfileSchema = Joi.object({
    name: commonSchemas.name.optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    bio: Joi.string().max(500).optional().messages({
        'string.max': 'Bio cannot exceed 500 characters'
    }),
    location: Joi.string().max(100).optional().messages({
        'string.max': 'Location cannot exceed 100 characters'
    })
});

// Post/Content validation
const postSchema = Joi.object({
    title: Joi.string().trim().min(5).max(200).required().messages({
        'string.min': 'Title must be at least 5 characters long',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required'
    }),
    content: Joi.string().trim().min(10).max(10000).required().messages({
        'string.min': 'Content must be at least 10 characters long',
        'string.max': 'Content cannot exceed 10,000 characters',
        'any.required': 'Content is required'
    }),
    category: Joi.string().valid('lesson', 'quiz', 'announcement', 'discussion').required().messages({
        'any.only': 'Invalid category selected',
        'any.required': 'Category is required'
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(5).optional().messages({
        'array.max': 'Maximum 5 tags allowed',
        'string.max': 'Each tag cannot exceed 50 characters'
    }),
    isPublic: Joi.boolean().default(true)
});

// Comment validation
const commentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(1000).required().messages({
        'string.min': 'Comment cannot be empty',
        'string.max': 'Comment cannot exceed 1,000 characters',
        'any.required': 'Comment content is required'
    }),
    postId: commonSchemas.objectId.required()
});

// Contact form validation
const contactSchema = Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    subject: Joi.string().trim().min(5).max(200).required().messages({
        'string.min': 'Subject must be at least 5 characters long',
        'string.max': 'Subject cannot exceed 200 characters',
        'any.required': 'Subject is required'
    }),
    message: Joi.string().trim().min(10).max(2000).required().messages({
        'string.min': 'Message must be at least 10 characters long',
        'string.max': 'Message cannot exceed 2,000 characters',
        'any.required': 'Message is required'
    })
});

// AI service request validation
const aiRequestSchema = Joi.object({
    prompt: Joi.string().trim().min(10).max(5000).required().messages({
        'string.min': 'Prompt must be at least 10 characters long',
        'string.max': 'Prompt cannot exceed 5,000 characters',
        'any.required': 'Prompt is required'
    }),
    type: Joi.string().valid('lesson', 'quiz', 'essay', 'math', 'presentation').required().messages({
        'any.only': 'Invalid request type',
        'any.required': 'Request type is required'
    }),
    parameters: Joi.object({
        difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
        length: Joi.number().min(1).max(10).optional(),
        format: Joi.string().valid('multiple_choice', 'short_answer', 'essay').optional(),
        subject: Joi.string().max(100).optional()
    }).optional()
});

// File upload validation
const fileUploadSchema = Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid(
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).required().messages({
        'any.only': 'Invalid file type. Only images, PDFs, and Word documents are allowed'
    }),
    size: Joi.number().max(10 * 1024 * 1024).required().messages({
        'number.max': 'File size cannot exceed 10MB'
    })
});

// Search validation
const searchSchema = Joi.object({
    query: Joi.string().trim().min(1).max(200).required().messages({
        'string.min': 'Search query cannot be empty',
        'string.max': 'Search query cannot exceed 200 characters',
        'any.required': 'Search query is required'
    }),
    category: Joi.string().valid('all', 'lesson', 'quiz', 'user', 'post').default('all'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
});

// Pagination validation
const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string().valid('createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name').default('-createdAt')
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    postSchema,
    commentSchema,
    contactSchema,
    aiRequestSchema,
    fileUploadSchema,
    searchSchema,
    paginationSchema,
    commonSchemas
};