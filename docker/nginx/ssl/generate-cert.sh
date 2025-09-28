#!/bin/bash

# Generate self-signed SSL certificate for development
# For production, replace with your actual SSL certificates

echo "Generating self-signed SSL certificate for development..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=TeachAI/OU=IT/CN=localhost"

echo "SSL certificate generated successfully!"
echo "For production, replace these files with your actual SSL certificates."

# Set proper permissions
chmod 600 /etc/nginx/ssl/key.pem
chmod 644 /etc/nginx/ssl/cert.pem