# n8n CI/CD Quick Start Guide

This is a minimal guide to get your n8n CI/CD environment up and running quickly. For detailed information, refer to `DEPLOYMENT.md`.

## Quick Setup

1. **Initialize the Environment**
   ```bash
   # Make the init script executable if it isn't already
   chmod +x init.sh
   
   # Run the initialization script
   ./init.sh
   ```

2. **Configure Environment**
   ```bash
   # Generate secure credentials
   make generate-credentials
   
   # Review and adjust the configuration
   nano .env
   ```

3. **Start n8n**
   ```bash
   # Start all services
   make start
   
   # Check status
   make status
   ```

4. **Access n8n**
   - Open your browser and navigate to: http://localhost:5678
   - Log in with the credentials from your .env file

## Basic Usage

1. **Start/Stop Services**
   ```bash
   make start    # Start n8n
   make stop     # Stop n8n
   make restart  # Restart n8n
   ```

2. **View Logs**
   ```bash
   make logs     # View all logs
   ```

3. **Backup Data**
   ```bash
   make backup   # Create full backup
   ```

## Integration with MCP

1. Create a webhook in n8n for MCP server communication
2. Configure the webhook URL in your MCP server
3. Test the connection using the n8n webhook tester

## Common Tasks

- **Update n8n**: `make update`
- **View Status**: `make status`
- **Check Logs**: `make logs`
- **Create Backup**: `make backup`

## Next Steps

1. Configure your first workflow in n8n
2. Set up GitHub webhooks for CI/CD
3. Configure backup schedule
4. Review security settings

For detailed configuration and best practices, refer to:
- `DEPLOYMENT.md` - Full deployment guide
- `SETUP_SUMMARY.md` - Setup overview and architecture
- `README.md` - General documentation

## Troubleshooting

If you encounter issues:
1. Check the logs: `make logs`
2. Verify your .env configuration
3. Ensure Docker services are running
4. Check the n8n container status
5. Review error messages in the n8n UI

For additional help, refer to the troubleshooting section in `DEPLOYMENT.md`.
