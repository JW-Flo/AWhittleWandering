.PHONY: setup start stop restart backup generate-credentials status logs clean

# Default target
all: setup

# Setup the environment
setup:
	@echo "Setting up n8n environment..."
	chmod +x scripts/generate-credentials.sh scripts/backup-n8n.sh
	mkdir -p backups
	@echo "Setup complete. Run 'make generate-credentials' to create secure credentials."

# Generate secure credentials
generate-credentials:
	@./scripts/generate-credentials.sh

# Start n8n services
start:
	docker-compose up -d
	@echo "n8n is starting... Wait a moment and visit http://localhost:5678"

# Stop n8n services
stop:
	docker-compose down

# Restart n8n services
restart: stop start

# Backup n8n data
backup:
	@./scripts/backup-n8n.sh

# Check service status
status:
	@docker-compose ps

# View logs
logs:
	@docker-compose logs -f

# Clean up containers and volumes (WARNING: This will delete all data)
clean:
	@echo "WARNING: This will delete all n8n data and containers."
	@echo "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	docker-compose down -v
	rm -rf backups/*
	@echo "Cleanup complete."

# Help
help:
	@echo "Available commands:"
	@echo "  make setup              - Initial setup of n8n environment"
	@echo "  make generate-credentials - Generate secure credentials"
	@echo "  make start             - Start n8n services"
	@echo "  make stop              - Stop n8n services"
	@echo "  make restart           - Restart n8n services"
	@echo "  make backup            - Backup n8n data"
	@echo "  make status            - Check service status"
	@echo "  make logs              - View logs"
	@echo "  make clean             - Clean up all data (warning: destructive)"
