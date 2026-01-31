# 1Password Environment Template
# This file is used by the 1Password load-secrets-action to load secrets
# Syntax: VARIABLE_NAME=op://vault/${VAULT_ENV}/field_name
# Note: ${VAULT_ENV} should be set to "dev" for development or "prod" for production

# Core API Secrets
TESSIE_API_TOKEN=op://AWW_SHARED/${VAULT_ENV}/TESSIE_API_TOKEN
MAPBOX_API_TOKEN=op://AWW_SHARED/${VAULT_ENV}/MAPBOX_API_TOKEN
OPENWEATHER_API_KEY=op://AWW_SHARED/${VAULT_ENV}/OPENWEATHER_API_KEY

# Cloudflare Secrets
CLOUDFLARE_API_TOKEN=op://AWW_SHARED/${VAULT_ENV}/CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID=op://AWW_SHARED/${VAULT_ENV}/CLOUDFLARE_ACCOUNT_ID

# Authentication Secrets
JWT_SECRET=op://AWW_SHARED/${VAULT_ENV}/JWT_SECRET
ADMIN_TOKEN=op://AWW_SHARED/${VAULT_ENV}/ADMIN_TOKEN

# Vehicle Data
TESLA_VIN=op://AWW_SHARED/${VAULT_ENV}/TESLA_VIN

# Optional Services
# Note: These secrets are documented but not yet integrated into workflows
# They are available for future use when additional integrations are implemented
NOTIFICATION_WEBHOOK=op://AWW_SHARED/${VAULT_ENV}/NOTIFICATION_WEBHOOK
SPOTIFY_CLIENT_ID=op://AWW_SHARED/${VAULT_ENV}/SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET=op://AWW_SHARED/${VAULT_ENV}/SPOTIFY_CLIENT_SECRET
TAVILY_API_KEY=op://AWW_SHARED/${VAULT_ENV}/TAVILY_API_KEY
SERPER_API_KEY=op://AWW_SHARED/${VAULT_ENV}/SERPER_API_KEY
BRAVE_API_KEY=op://AWW_SHARED/${VAULT_ENV}/BRAVE_API_KEY
