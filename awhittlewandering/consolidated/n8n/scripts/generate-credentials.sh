#!/bin/bash

# Function to generate a random string
generate_random_string() {
    local length=$1
    tr -dc 'A-Za-z0-9!@#$%^&*()_+' < /dev/urandom | head -c "$length"
    echo
}

# Create backup of existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup
    echo "Created backup of existing .env as .env.backup"
fi

# Generate secure credentials
ENCRYPTION_KEY=$(generate_random_string 32)
ADMIN_PASSWORD=$(generate_random_string 16)
DB_PASSWORD=$(generate_random_string 16)

# Create or update .env file
cat > .env << EOL
# n8n Configuration
N8N_HOST=localhost
N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=${ADMIN_PASSWORD}
TZ=America/Phoenix

# PostgreSQL Configuration
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=${DB_PASSWORD}

# Additional Settings
N8N_METRICS=true
N8N_DIAGNOSTICS_ENABLED=false
N8N_USER_FOLDER=/home/node/.n8n
EOL

echo "Generated new credentials:"
echo "========================="
echo "n8n Admin Password: ${ADMIN_PASSWORD}"
echo "Database Password: ${DB_PASSWORD}"
echo "Encryption Key: ${ENCRYPTION_KEY}"
echo "========================="
echo "These credentials have been saved to .env"
echo "Make sure to store them in a secure password manager!"
echo "Remember: The encryption key is crucial for decrypting credentials."
echo "If you lose it, you'll need to reconfigure all credentials in n8n."
