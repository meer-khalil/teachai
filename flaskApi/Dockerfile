# Multi-stage Docker build for TeachAI Flask AI Service
# Stage 1: Base image with Python dependencies
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Development image
FROM base AS development

# Install development dependencies
RUN pip install --no-cache-dir pytest pytest-cov black flake8 mypy

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p Cache ChatData ChatHistory GeneratedPresentations Questions Quizzes demo/uploads logs

# Set environment
ENV FLASK_ENV=development
ENV FLASK_DEBUG=1

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start application in development mode
CMD ["python", "app.py"]

# Stage 3: Production image
FROM base AS production

# Create non-root user
RUN adduser --disabled-password --gecos '' --uid 1001 flaskuser

# Copy source code and set ownership
COPY --chown=flaskuser:flaskuser . .

# Create necessary directories with proper permissions
RUN mkdir -p Cache ChatData ChatHistory GeneratedPresentations Questions Quizzes demo/uploads logs && \
    chown -R flaskuser:flaskuser Cache ChatData ChatHistory GeneratedPresentations Questions Quizzes demo logs

# Set environment
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0

# Switch to non-root user
USER flaskuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start application with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "--keepalive", "5", "--max-requests", "1000", "--max-requests-jitter", "100", "app:app"]