# n8n Workflow System Quick Start Guide

This guide will help you get started with the n8n workflow system, including agent coordination and website deployment automation.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Node.js 14+ installed
- Access to required agent endpoints (Copilot, Cline, Blackbox, Cloudflare)
- Access to MCP server

## Quick Setup

1. **Clone and Configure**
   ```bash
   git clone <repository-url>
   cd n8n
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

2. **Initialize System**
   ```bash
   ./init.sh
   ```
   This will:
   - Set up required directories
   - Generate credentials
   - Register workflows
   - Start n8n
   - Initialize agent connections

3. **Verify Installation**
   ```bash
   make status
   ```
   Ensure all services and connections are running.

## Core Workflows

### 1. Agent Communication
- **Purpose**: Handles real-time communication between agents
- **Usage**: Automatically coordinates task assignments and updates
- **Endpoint**: `http://localhost:5678/webhook/agent/task`

### 2. Task Management
- **Purpose**: Manages task lifecycle and coordination
- **Usage**: Automatically created when tasks are assigned
- **Endpoint**: `http://localhost:5678/webhook/copilot/task`

### 3. Website Deployment
- **Purpose**: Coordinates website updates and deployments
- **Usage**: Triggered when website changes are ready
- **Endpoint**: `http://localhost:5678/webhook/website/update`

### 4. Repository Cleanup
- **Purpose**: Manages repository maintenance
- **Usage**: Run periodically or on-demand
- **Endpoint**: `http://localhost:5678/webhook/repo/cleanup`

## Common Tasks

### Creating a Task
```bash
curl -X POST http://localhost:5678/webhook/copilot/task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Example Task",
    "description": "Task description",
    "type": "feature",
    "priority": "high"
  }'
```

### Triggering Website Update
```bash
curl -X POST http://localhost:5678/webhook/website/update \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Update Feature",
    "type": "content",
    "description": "Update description"
  }'
```

### Running Repository Cleanup
```bash
make clean-repo
```

## Maintenance

### Check System Status
```bash
make status
```

### View Logs
```bash
make logs
```

### Backup Data
```bash
make backup
```

### Update Workflows
```bash
make update-workflows
```

## Monitoring

Access the monitoring dashboard at `http://localhost:5678/dashboard`

Key metrics available:
- Active tasks
- Agent status
- System health
- Task completion rates

## Troubleshooting

### Connection Issues
```bash
# Test all connections
make check

# Test specific agent
curl -v http://localhost:5678/healthz
```

### Common Problems

1. **Agent Connection Failed**
   ```bash
   # Restart agent connections
   make restart-agents
   ```

2. **Workflow Not Registered**
   ```bash
   # Re-register workflows
   ./scripts/register-workflows.sh
   ```

3. **Task Stuck**
   ```bash
   # Check task status
   make status
   # Clear stuck tasks
   make clear-tasks
   ```

## Next Steps

1. Review the complete documentation in `./docs`
2. Set up monitoring alerts
3. Configure backup schedule
4. Review security settings

## Additional Resources

- [Full Documentation](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Security Guidelines](./SECURITY.md)

## Support

For issues or questions:
1. Check the [troubleshooting guide](./TROUBLESHOOTING.md)
2. Open an issue in the repository
3. Contact the development team

## Security Notes

- Keep your `.env` file secure
- Regularly update credentials
- Monitor system logs
- Review access patterns

Remember to run `make test` after any configuration changes to ensure everything is working correctly.
