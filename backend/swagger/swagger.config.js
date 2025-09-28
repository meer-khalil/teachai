// Swagger Configuration for TeachAI Backend API Documentation
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const redoc = require('redoc-express');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'TeachAI Backend API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for TeachAI educational platform backend services',
    contact: {
      name: 'TeachAI Support',
      email: 'support@teachai.com',
      url: 'https://teachai.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    termsOfService: 'https://teachai.com/terms'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.teachai.com',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.teachai.com',
      description: 'Staging server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'API key for service-to-service authentication'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['name', 'email', 'role'],
        properties: {
          _id: {
            type: 'string',
            description: 'Unique identifier for the user',
            example: '64a1b2c3d4e5f6789012345'
          },
          name: {
            type: 'string',
            description: 'Full name of the user',
            example: 'John Doe',
            minLength: 2,
            maxLength: 100
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address (must be unique)',
            example: 'john.doe@example.com'
          },
          role: {
            type: 'string',
            enum: ['student', 'teacher', 'admin'],
            description: 'User role determining permissions',
            example: 'student'
          },
          avatar: {
            type: 'string',
            format: 'uri',
            description: 'URL to user profile picture',
            example: 'https://example.com/avatar.jpg'
          },
          bio: {
            type: 'string',
            description: 'User biography or description',
            example: 'Passionate educator with 10 years of experience',
            maxLength: 500
          },
          isVerified: {
            type: 'boolean',
            description: 'Whether user email has been verified',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2024-01-15T08:30:00Z'
          },
          lastLogin: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp',
            example: '2024-01-20T14:45:00Z'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              token: {
                type: 'string',
                description: 'JWT authentication token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          },
          message: {
            type: 'string',
            example: 'Authentication successful'
          }
        }
      },
      ChatMessage: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          _id: {
            type: 'string',
            description: 'Message unique identifier',
            example: '64a1b2c3d4e5f6789012346'
          },
          role: {
            type: 'string',
            enum: ['user', 'assistant', 'system'],
            description: 'Message sender role',
            example: 'user'
          },
          content: {
            type: 'string',
            description: 'Message content text',
            example: 'What is photosynthesis?',
            maxLength: 4000
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Message creation time',
            example: '2024-01-20T15:30:00Z'
          },
          metadata: {
            type: 'object',
            description: 'Additional message metadata',
            properties: {
              subject: {
                type: 'string',
                example: 'biology'
              },
              grade: {
                type: 'string',
                example: '10'
              },
              responseTime: {
                type: 'number',
                example: 1.5
              }
            }
          }
        }
      },
      Conversation: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '64a1b2c3d4e5f6789012347'
          },
          conversationId: {
            type: 'string',
            description: 'Human-readable conversation identifier',
            example: 'conv-biology-photosynthesis-123'
          },
          userId: {
            type: 'string',
            description: 'Owner of the conversation',
            example: '64a1b2c3d4e5f6789012345'
          },
          title: {
            type: 'string',
            description: 'Conversation title (auto-generated or custom)',
            example: 'Biology: Photosynthesis Discussion',
            maxLength: 200
          },
          subject: {
            type: 'string',
            description: 'Educational subject category',
            example: 'biology'
          },
          grade: {
            type: 'string',
            description: 'Grade level context',
            example: '10'
          },
          messages: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ChatMessage'
            },
            description: 'Conversation message history'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-20T15:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-20T15:45:00Z'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether conversation is currently active',
            example: true
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            description: 'Human-readable error message',
            example: 'Invalid credentials provided'
          },
          error: {
            type: 'string',
            description: 'Error type or code',
            example: 'INVALID_CREDENTIALS'
          },
          details: {
            type: 'object',
            description: 'Additional error details',
            example: {
              field: 'email',
              code: 'INVALID_FORMAT'
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-20T15:30:00Z'
          },
          requestId: {
            type: 'string',
            description: 'Unique request identifier for debugging',
            example: 'req_64a1b2c3d4e5f6789012348'
          }
        }
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                description: 'Array of items for current page'
              },
              pagination: {
                type: 'object',
                properties: {
                  currentPage: {
                    type: 'integer',
                    example: 1
                  },
                  totalPages: {
                    type: 'integer',
                    example: 5
                  },
                  totalItems: {
                    type: 'integer',
                    example: 47
                  },
                  itemsPerPage: {
                    type: 'integer',
                    example: 10
                  },
                  hasNextPage: {
                    type: 'boolean',
                    example: true
                  },
                  hasPrevPage: {
                    type: 'boolean',
                    example: false
                  }
                }
              }
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination (starts from 1)',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
          example: 1
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
          example: 10
        }
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and direction (field:asc or field:desc)',
        required: false,
        schema: {
          type: 'string',
          example: 'createdAt:desc'
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required or token invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Authentication token required',
              error: 'UNAUTHORIZED',
              timestamp: '2024-01-20T15:30:00Z',
              requestId: 'req_64a1b2c3d4e5f6789012348'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access denied - insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Insufficient permissions for this action',
              error: 'FORBIDDEN',
              timestamp: '2024-01-20T15:30:00Z',
              requestId: 'req_64a1b2c3d4e5f6789012349'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Requested resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Resource not found',
              error: 'NOT_FOUND',
              timestamp: '2024-01-20T15:30:00Z',
              requestId: 'req_64a1b2c3d4e5f6789012350'
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Validation failed',
              error: 'VALIDATION_ERROR',
              details: {
                email: 'Valid email address required',
                password: 'Password must be at least 8 characters'
              },
              timestamp: '2024-01-20T15:30:00Z',
              requestId: 'req_64a1b2c3d4e5f6789012351'
            }
          }
        }
      },
      RateLimitError: {
        description: 'Too many requests - rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Rate limit exceeded. Please try again later.',
              error: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: 100,
                remaining: 0,
                resetTime: '2024-01-20T16:00:00Z'
              },
              timestamp: '2024-01-20T15:30:00Z',
              requestId: 'req_64a1b2c3d4e5f6789012352'
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User profile management and preferences'
    },
    {
      name: 'Chat',
      description: 'AI-powered chat conversations and history'
    },
    {
      name: 'Posts',
      description: 'Educational content and community posts'
    },
    {
      name: 'Comments',
      description: 'Comment system for posts and discussions'
    },
    {
      name: 'Orders',
      description: 'Subscription and payment order management'
    },
    {
      name: 'Payments',
      description: 'Payment processing with Stripe integration'
    },
    {
      name: 'Stories',
      description: 'Educational story content management'
    },
    {
      name: 'Admin',
      description: 'Administrative functions and analytics'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js',
    './middlewares/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

// Swagger UI configuration
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
  `,
  customSiteTitle: 'TeachAI Backend API Documentation'
};

// Redoc configuration  
const redocOptions = {
  title: 'TeachAI Backend API Documentation',
  version: '1.0.0',
  specUrl: '/api-docs/swagger.json',
  redocOptions: {
    theme: {
      colors: {
        primary: {
          main: '#3b82f6'
        }
      },
      typography: {
        fontSize: '14px',
        lineHeight: '1.5em',
        code: {
          fontSize: '13px'
        }
      }
    },
    hideDownloadButton: false,
    disableSearch: false,
    menuToggle: true,
    scrollYOffset: 60
  }
};

module.exports = {
  options,
  swaggerSpec,
  swaggerUi,
  uiOptions: swaggerUiOptions,
  redoc,
  redocOptions
};