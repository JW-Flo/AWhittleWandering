# Docker Compose Configuration Documentation

This document details the Docker Compose configuration for the n8n workflow automation system with PostgreSQL database.

## Overview

The configuration consists of two main services:
- n8n: The workflow automation platform
- postgres: The PostgreSQL database for storing n8n data

## Configuration Details

### Version
```yaml
version: "3.8"
```
- Uses Docker Compose format version 3.8 for maximum compatibility and feature support

### N8N Service Configuration

#### Basic Settings
```yaml
n8n:
  image: n8nio/n8n
  ports:
    - "${N8N_PORT:-5678}:5678"
```
- Uses the official n8n image
- Dynamic port mapping using N8N_PORT environment variable (defaults to 5678)

#### Environment Variables
```yaml
environment:
  - N8N_HOST=${N8N_HOST:-localhost}
  - N8N_PORT=5678
  - N8N_PROTOCOL=${N8N_PROTOCOL:-http}
  - N8N_PATH=/
  - N8N_EDITOR_BASE_URL=http://localhost:${N8N_PORT:-5678}
  - DB_TYPE=postgres
  - DB_POSTGRESDB_HOST=postgres
  - DB_POSTGRESDB_PORT=5432
  - DB_POSTGRESDB_DATABASE=n8n
  - DB_POSTGRESDB_USER=n8n
  - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD:-n8n_password}
```
- Configurable host, protocol, and port settings
- Dynamic editor base URL that matches the exposed port
- Database connection parameters with support for environment variables

#### Volumes
```yaml
volumes:
  - n8n_data:/home/node/.n8n
```
- Uses named volume for better portability and data persistence
- Stores n8n workflows and configuration data

#### Health Check
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5678/healthz"]
  interval: 30s
  timeout: 10s
  retries: 3
```
- Regular health checks every 30 seconds
- Fails after 3 retries
- Uses n8n's health endpoint

#### Resource Management
```yaml
deploy:
  resources:
    limits:
      cpus: "0.5"
      memory: 512M
```
- CPU limited to 50% of a core
- Memory limited to 512MB

### PostgreSQL Service Configuration

#### Basic Settings
```yaml
postgres:
  image: postgres:14.5
```
- Uses PostgreSQL 14.5 for stability
- Specific version pinned to prevent unexpected updates

#### Environment Variables
```yaml
environment:
  - POSTGRES_USER=n8n
  - POSTGRES_PASSWORD=${DB_PASSWORD:-n8n_password}
  - POSTGRES_DB=n8n
```
- Database credentials configurable via environment variables
- Consistent password variable across services

#### Health Check
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U n8n"]
  interval: 30s
  timeout: 10s
  retries: 5
```
- Ensures database is ready to accept connections
- More retries than n8n service for stability

#### Resource Management
```yaml
deploy:
  resources:
    limits:
      cpus: "0.5"
      memory: 256M
```
- CPU limited to 50% of a core
- Memory limited to 256MB for PostgreSQL

### Networking

```yaml
networks:
  n8n_network:
    driver: bridge
    name: n8n_internal
```
- Isolated bridge network for security
- Named network for easier identification
- Internal communication between services

### Volume Management

```yaml
volumes:
  postgres_data:
    name: n8n_postgres_data
  n8n_data:
    name: n8n_user_data
```
- Named volumes for easier backup and management
- Persistent storage for both services

## Environment Variables

Required environment variables:
- `DB_PASSWORD`: Database password (defaults to n8n_password)
- `N8N_PORT`: Port for n8n web interface (defaults to 5678)
- `N8N_HOST`: Host name (defaults to localhost)
- `N8N_PROTOCOL`: Protocol for web interface (defaults to http)

## Security Considerations

1. All sensitive data is configurable via environment variables
2. Services are isolated in a custom network
3. Resource limits prevent DoS scenarios
4. Health checks ensure service reliability
5. Specific version pinning prevents supply chain attacks

## Maintenance

1. Volumes are named for easier backup procedures
2. Health checks facilitate monitoring
3. Resource limits help with capacity planning
4. Restart policy set to unless-stopped for controlled maintenance
