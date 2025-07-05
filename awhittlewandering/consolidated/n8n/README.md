# n8n-Copilot Integration

This repository contains the complete setup for integrating n8n with the Copilot agent, enabling intelligent task management, real-time communication, and automated workflows.

## Features

- Real-time communication between n8n and Copilot agent
- Intelligent task management and prioritization
- Automated GitHub issue and PR creation
- WebSocket-based status updates
- Built-in monitoring and maintenance tools
- Comprehensive backup system

## Quick Start

1. **Initial Setup**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd n8n

   # Run initial setup
   make setup
   ```

2. **Configure Environment**
   ```bash
   # Copy and edit environment files
   cp env/workflows.env.example env/workflows.env
   nano env/workflows.env
   
   # Generate secure credentials
   make generate-credentials
   ```

3. **Start Services**
   ```bash
   # Start n8n and required services
   make start
   
   # Setup workflows
   make setup-workflows
   ```

## Workflow Structure

### 1. Copilot Communication
- WebSocket-based real-time updates
- Task status monitoring
- Event-driven communication

### 2. Task Management
- Automatic task analysis and prioritization
- GitHub integration for issues and PRs
- Intelligent task routing

### 3. Monitoring
- Real-time system status
- Task execution analytics
- Performance monitoring

## Available Commands

```bash
# Service Management
make start          # Start n8n services
make stop           # Stop n8n services
make restart        # Restart n8n services
make status         # Check service status

# Workflow Management
make setup-workflows    # Configure workflows
make import-workflows   # Import workflow definitions
make update-workflows  # Update existing workflows

# Maintenance
make backup        # Backup n8n data
make maintain      # Run maintenance tasks
make clean         # Clean up data and containers
make monitor       # Display monitoring information

# Testing
make test         # Run integration tests
make check        # Quick system check
```

## Directory Structure

```
n8n/
├── scripts/              # Maintenance and setup scripts
│   ├── backup-n8n.sh
│   ├── setup-workflows.sh
│   ├── test-integration.sh
│   └── maintenance.sh
├── workflows/           # n8n workflow definitions
│   ├── copilot-communication.json
│   ├── copilot-task-handler.json
│   └── task-monitoring.json
├── env/                # Environment configuration
│   └── workflows.env.example
├── monitoring/         # Monitoring configuration
└── data/              # Workflow data storage
```

## Workflow Documentation

### Copilot Communication Workflow
- Handles real-time communication with Copilot agent
- Manages WebSocket connections and updates
- Processes task status changes

### Task Handler Workflow
- Analyzes and prioritizes incoming tasks
- Creates GitHub issues and PRs
- Manages task lifecycle

### Monitoring Workflow
- Tracks system health
- Monitors task execution
- Generates performance metrics

## Maintenance

### Backup System
- Automated daily backups
- Configurable retention period
- Backup verification

### Monitoring Tools
```bash
# View system status
make status

# Check logs
make logs

# Monitor tasks
make monitor-tasks
```

### Troubleshooting
```bash
# Run diagnostics
make check

# Access maintenance menu
make maintain
```

## Security

- All communication is encrypted
- Authentication required for API access
- Secure credential management
- Regular security audits

## Integration Points

### GitHub Integration
- Automatic issue creation
- PR management
- Commit handling

### WebSocket Communication
- Real-time updates
- Bi-directional communication
- Auto-reconnection handling

## Best Practices

1. **Regular Backups**
   ```bash
   # Run daily backups
   make backup
   ```

2. **Monitoring**
   ```bash
   # Check system health
   make status
   make monitor
   ```

3. **Updates**
   ```bash
   # Keep workflows updated
   make update-workflows
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
