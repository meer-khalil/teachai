# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    curl \
    dumb-init

# Set working directory
WORKDIR /app

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
CMD ["npm", "start"]

# Backend build stage
FROM base AS backend-build
ENV NODE_ENV=production
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force
COPY backend/ .

# Frontend build stage  
FROM node:18-alpine AS frontend-build
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js ./
COPY webpack.config.js ./
RUN npm run build

# Production Node.js stage
FROM node:18-alpine AS production-api

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S teachai -u 1001

# Install production system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy built backend
COPY --from=backend-build --chown=teachai:nodejs /app/backend ./backend
COPY --from=frontend-build --chown=teachai:nodejs /app/build ./build

# Copy production files
COPY --chown=teachai:nodejs package*.json ./
COPY --chown=teachai:nodejs start-project.sh ./

# Make script executable
RUN chmod +x start-project.sh

# Switch to non-root user
USER teachai

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/server.js"]

# Nginx stage for serving static files
FROM nginx:alpine AS nginx
COPY --from=frontend-build /app/build /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]