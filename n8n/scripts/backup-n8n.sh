#!/bin/bash

# Set backup directory relative to the script's own directory for consistency
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${DATE}"

# Create backup directories
mkdir -p "${BACKUP_PATH}"
mkdir -p "${BACKUP_PATH}/workflows"
mkdir -p "${BACKUP_PATH}/data"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting n8n backup process..."

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1 successful"
    else
        echo -e "${RED}✗${NC} $1 failed"
        exit 1
    fi
}

# Export all workflows using n8n CLI
echo "Exporting workflows..."
docker-compose exec -T n8n n8n export:workflow --all --output="${BACKUP_PATH}/workflows/workflows.json" --pretty
check_status "Workflow export"

# Backup n8n data volume
echo "Backing up n8n data..."
docker run --rm \
    -v n8n_data:/source \
    -v "${PWD}/${BACKUP_PATH}/data":/backup \
    alpine tar czf /backup/n8n_data.tar.gz -C /source .
check_status "n8n data backup"

# Backup PostgreSQL database
echo "Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dumpall -c -U n8n > "${BACKUP_PATH}/data/database.sql"
check_status "Database backup"

# Create environment backup
echo "Backing up environment configuration..."
if [ -f .env ]; then
    cp .env "${BACKUP_PATH}/data/.env.backup"
    check_status "Environment backup"
fi

# Create a single archive of all backups
echo "Creating final backup archive..."
tar czf "${BACKUP_DIR}/n8n_backup_${DATE}.tar.gz" -C "${BACKUP_PATH}" .
check_status "Backup archive creation"

# Cleanup temporary files
rm -rf "${BACKUP_PATH}"
check_status "Temporary files cleanup"

# Calculate backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/n8n_backup_${DATE}.tar.gz" | cut -f1)

echo -e "\n${GREEN}Backup completed successfully!${NC}"
echo "Backup location: ${BACKUP_DIR}/n8n_backup_${DATE}.tar.gz"
echo "Backup size: ${BACKUP_SIZE}"
echo "Remember to store this backup in a secure location!"

# Keep only last 5 backups
echo "Cleaning up old backups..."
ls -t "${BACKUP_DIR}"/n8n_backup_*.tar.gz | tail -n +6 | xargs -r rm
check_status "Old backups cleanup"

echo "Backup process complete!"
