#!/bin/bash
cat > .env << 'ENVFILE'
# AWS Configuration
AWS_REGION=ca-central-1
AWS_ACCOUNT_ID=655009248147
PROJECT_NAME=hqmemes
ENVIRONMENT=prod

# Domain Configuration
DOMAIN_NAME=dev.gharbidev.com
HOSTED_ZONE_ID=Z005982130NMVGKL0RYQ1

# Subdomains
FRONTEND_DOMAIN=hqmemes.dev.gharbidev.com
ASSETS_DOMAIN=assets-hqmemes.dev.gharbidev.com
API_DOMAIN=api-hqmemems.dev.gharbidev.com

# Frontend Environment Variables
VITE_APP_NAME=HQMemes
VITE_MAX_UPLOAD_SIZE=10485760
VITE_MAX_FILES_PER_UPLOAD=10
VITE_POLLING_INTERVAL=5000
ENVFILE
echo "✅ Fichier .env créé"
