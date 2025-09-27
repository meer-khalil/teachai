#!/bin/bash

# API Documentation Generation Script
# Generates comprehensive API documentation for TeachAI platform
# Usage: ./scripts/generate-docs.sh [--deploy]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
BUILD_DIR="$DOCS_DIR/build"
BACKEND_DIR="$PROJECT_ROOT/backend"
FLASK_DIR="$PROJECT_ROOT/flaskApi"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print header
echo -e "${BLUE}"
echo "========================================"
echo "  TeachAI API Documentation Generator"
echo "========================================"
echo -e "${NC}"

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        log_error "Python is required but not installed"
        exit 1
    fi
    
    # Use python3 if available, otherwise python
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    else
        PYTHON_CMD="python"
    fi
    
    log_success "Dependencies check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install backend dependencies
    if [ -f "$BACKEND_DIR/package.json" ]; then
        log_info "Installing backend dependencies..."
        cd "$BACKEND_DIR"
        npm install --silent
        cd "$PROJECT_ROOT"
    fi
    
    # Install Flask dependencies
    if [ -f "$FLASK_DIR/requirements.txt" ]; then
        log_info "Installing Flask dependencies..."
        cd "$FLASK_DIR"
        pip install -r requirements.txt --quiet
        pip install flask-restx marshmallow --quiet
        cd "$PROJECT_ROOT"
    fi
    
    log_success "Dependencies installed"
}

# Validate API specifications
validate_specs() {
    log_info "Validating API specifications..."
    
    # Install swagger-parser globally if not present
    if ! command -v swagger-parser &> /dev/null; then
        log_info "Installing swagger-parser..."
        npm install -g @apidevtools/swagger-parser
    fi
    
    # Validate OpenAPI spec
    if [ -f "$DOCS_DIR/api/openapi.yaml" ]; then
        log_info "Validating OpenAPI specification..."
        swagger-parser validate "$DOCS_DIR/api/openapi.yaml"
        log_success "OpenAPI specification is valid"
    else
        log_warning "OpenAPI specification not found, skipping validation"
    fi
    
    # Validate Postman collections
    if command -v newman &> /dev/null; then
        log_info "Validating Postman collections..."
        
        if [ -f "$DOCS_DIR/postman/TeachAI-Backend-API.json" ]; then
            newman collection validate "$DOCS_DIR/postman/TeachAI-Backend-API.json"
            log_success "Backend API collection is valid"
        fi
        
        if [ -f "$DOCS_DIR/postman/TeachAI-Flask-AI-API.json" ]; then
            newman collection validate "$DOCS_DIR/postman/TeachAI-Flask-AI-API.json"
            log_success "Flask AI API collection is valid"
        fi
    else
        log_warning "Newman not installed, skipping Postman collection validation"
    fi
}

# Generate API documentation
generate_docs() {
    log_info "Generating API documentation..."
    
    # Create build directory
    mkdir -p "$BUILD_DIR/generated"
    
    # Generate Backend API documentation
    if [ -f "$BACKEND_DIR/swagger/swagger.config.js" ]; then
        log_info "Generating Backend API documentation..."
        cd "$BACKEND_DIR"
        
        cat > generate_spec.js << 'EOF'
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

try {
    const config = require('./swagger/swagger.config');
    const specs = swaggerJsdoc(config.options);
    
    const outputPath = path.join(__dirname, '..', 'docs', 'generated', 'backend-api.json');
    fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
    
    console.log('Backend API documentation generated successfully');
} catch (error) {
    console.error('Error generating Backend API documentation:', error.message);
    process.exit(1);
}
EOF
        
        node generate_spec.js
        rm generate_spec.js
        cd "$PROJECT_ROOT"
        log_success "Backend API documentation generated"
    else
        log_warning "Backend swagger config not found, skipping backend documentation generation"
    fi
    
    # Generate Flask API documentation
    if [ -f "$FLASK_DIR/api_docs/flask_restx_config.py" ]; then
        log_info "Generating Flask API documentation..."
        cd "$FLASK_DIR"
        
        cat > generate_flask_spec.py << 'EOF'
import sys
import os
import json

try:
    # Add current directory to Python path
    sys.path.insert(0, os.getcwd())
    
    from flask import Flask
    from api_docs.flask_restx_config import api
    
    app = Flask(__name__)
    api.init_app(app)
    
    with app.app_context():
        spec = api.__schema__
        
        output_path = os.path.join('..', 'docs', 'generated', 'flask-api.json')
        with open(output_path, 'w') as f:
            json.dump(spec, f, indent=2)
    
    print('Flask API documentation generated successfully')
except Exception as e:
    print(f'Warning: Could not generate Flask API documentation: {e}')
    # Don't exit with error, as this is optional
EOF
        
        $PYTHON_CMD generate_flask_spec.py || log_warning "Flask API documentation generation failed"
        rm -f generate_flask_spec.py
        cd "$PROJECT_ROOT"
    else
        log_warning "Flask API config not found, skipping Flask documentation generation"
    fi
}

# Build documentation site
build_site() {
    log_info "Building documentation site..."
    
    # Create build directory structure
    mkdir -p "$BUILD_DIR"/{api,postman,generated,assets}
    
    # Copy main documentation files
    if [ -f "$DOCS_DIR/interactive-documentation.html" ]; then
        cp "$DOCS_DIR/interactive-documentation.html" "$BUILD_DIR/index.html"
        log_success "Copied interactive documentation"
    fi
    
    # Copy API documentation
    if [ -d "$DOCS_DIR/api" ]; then
        cp -r "$DOCS_DIR/api"/* "$BUILD_DIR/api/"
        log_success "Copied API documentation files"
    fi
    
    # Copy Postman collections
    if [ -d "$DOCS_DIR/postman" ]; then
        cp -r "$DOCS_DIR/postman"/* "$BUILD_DIR/postman/"
        log_success "Copied Postman collections"
    fi
    
    # Copy generated documentation
    if [ -d "$DOCS_DIR/generated" ]; then
        cp -r "$DOCS_DIR/generated"/* "$BUILD_DIR/generated/"
        log_success "Copied generated documentation"
    fi
    
    # Create sitemap.xml
    cat > "$BUILD_DIR/sitemap.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://docs.teachai.com/</loc>
    <lastmod>$(date -u +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://docs.teachai.com/api/</loc>
    <lastmod>$(date -u +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
EOF
    
    # Create robots.txt
    cat > "$BUILD_DIR/robots.txt" << EOF
User-agent: *
Allow: /

Sitemap: https://docs.teachai.com/sitemap.xml
EOF
    
    # Create .nojekyll file for GitHub Pages
    touch "$BUILD_DIR/.nojekyll"
    
    log_success "Documentation site built successfully"
}

# Generate README for docs
generate_readme() {
    log_info "Generating documentation README..."
    
    cat > "$BUILD_DIR/README.md" << 'EOF'
# TeachAI API Documentation

This directory contains the comprehensive API documentation for the TeachAI educational platform.

## 📚 Documentation Structure

- **Interactive Documentation** (`index.html`) - Main documentation portal with examples and guides
- **API Specifications** (`api/`) - OpenAPI/Swagger specifications and detailed API guides
- **Postman Collections** (`postman/`) - Ready-to-import Postman collections for testing
- **Generated Docs** (`generated/`) - Auto-generated API documentation from code

## 🚀 Quick Start

### Viewing Documentation
Open `index.html` in your browser to access the interactive documentation portal.

### Using Postman Collections
1. Import collections from the `postman/` directory
2. Set up environment variables as described in the documentation
3. Start testing the APIs immediately

### API Specifications
- OpenAPI 3.0 specification: `api/openapi.yaml`
- Backend API guide: `api/backend-api-guide.md`

## 🔧 Development

This documentation is automatically generated from:
- Swagger/OpenAPI annotations in the codebase
- Postman collection exports
- Manual documentation files

To regenerate documentation, run:
```bash
./scripts/generate-docs.sh
```

## 📞 Support

For questions or issues with the API documentation:
- Email: support@teachai.com
- Documentation Issues: File an issue in the main repository

---

Last Updated: $(date -u)
Build: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
EOF

    log_success "Documentation README generated"
}

# Deploy to GitHub Pages (optional)
deploy_docs() {
    if [ "$1" = "--deploy" ] || [ "$1" = "-d" ]; then
        log_info "Deploying documentation to GitHub Pages..."
        
        # Check if git is available and we're in a git repository
        if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
            # Check if gh-pages branch exists
            if git show-ref --verify --quiet refs/heads/gh-pages; then
                git checkout gh-pages
                
                # Clear existing files but keep .git
                find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +
                
                # Copy build files
                cp -r "$BUILD_DIR"/* .
                cp -r "$BUILD_DIR"/.[!.]* . 2>/dev/null || true
                
                # Commit and push
                git add -A
                git commit -m "Update API documentation - $(date -u)"
                git push origin gh-pages
                
                # Switch back to original branch
                git checkout -
                
                log_success "Documentation deployed to GitHub Pages"
            else
                log_warning "gh-pages branch not found. Create it first or deploy manually."
            fi
        else
            log_warning "Not in a git repository or git not available. Skipping deployment."
        fi
    fi
}

# Print summary
print_summary() {
    echo -e "${GREEN}"
    echo "========================================"
    echo "  Documentation Generation Complete"
    echo "========================================"
    echo -e "${NC}"
    
    log_success "Documentation generated successfully!"
    log_info "Output directory: $BUILD_DIR"
    echo ""
    log_info "Next steps:"
    echo "  1. Open $BUILD_DIR/index.html to view the documentation"
    echo "  2. Deploy to your web server or GitHub Pages"
    echo "  3. Share the documentation URL with your team"
    echo ""
    
    if [ "$1" = "--deploy" ] || [ "$1" = "-d" ]; then
        log_info "Documentation has been deployed to GitHub Pages"
        log_info "It may take a few minutes to become available"
    fi
}

# Main execution
main() {
    log_info "Starting documentation generation..."
    
    check_dependencies
    install_dependencies
    validate_specs
    generate_docs
    build_site
    generate_readme
    deploy_docs "$1"
    print_summary "$1"
}

# Handle script arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "TeachAI API Documentation Generator"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -d, --deploy   Deploy to GitHub Pages after generation"
    echo ""
    echo "Examples:"
    echo "  $0                # Generate documentation only"
    echo "  $0 --deploy       # Generate and deploy to GitHub Pages"
    exit 0
fi

# Run main function
main "$1"