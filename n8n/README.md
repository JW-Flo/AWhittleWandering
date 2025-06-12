# n8n CI/CD Orchestration Setup

This setup provides a containerized n8n instance with PostgreSQL for persistent storage, designed to serve as a CI/CD orchestration platform.

## Prerequisites

- Docker
- Docker Compose
- Git

## Setup Instructions

1. **Clone and Configure**
   ```bash
   # Create a directory for n8n
   mkdir -p n8n && cd n8n
   
   # Copy configuration files
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   
   Edit the `.env` file and update the following variables:
   - `N8N_ENCRYPTION_KEY`: Generate a secure random key
   - `N8N_BASIC_AUTH_USER`: Choose an admin username
   - `N8N_BASIC_AUTH_PASSWORD`: Set a strong password
   - `POSTGRES_PASSWORD`: Set a secure database password

3. **Start the Services**
   ```bash
   docker-compose up -d
   ```

4. **Access n8n**
   
   Open your browser and navigate to:
   ```
   http://localhost:5678
   ```

## Security Considerations

1. **Encryption Key**
   - Keep your `N8N_ENCRYPTION_KEY` secure and consistent
   - Backup this key as it's required to decrypt credentials

2. **Authentication**
   - Change default admin credentials immediately
   - Use strong passwords
   - Consider setting up SSH tunneling for remote access

3. **Database**
   - Regularly backup the PostgreSQL database
   - Monitor disk usage of the database volume

## Maintenance

1. **Backup Data**
   ```bash
   # Backup n8n data
   docker run --rm -v n8n_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/n8n_data_$(date +%Y%m%d).tar.gz /source

   # Backup PostgreSQL data
   docker exec -t n8n-postgres pg_dumpall -c -U n8n > backups/db_backup_$(date +%Y%m%d).sql
   ```

2. **Update n8n**
   ```bash
   # Pull latest images
   docker-compose pull
   
   # Restart services
   docker-compose down
   docker-compose up -d
   ```

3. **View Logs**
   ```bash
   # View n8n logs
   docker-compose logs -f n8n
   
   # View PostgreSQL logs
   docker-compose logs -f postgres
   ```

## CI/CD Integration

1. **Workflow Management**
   - Create separate workflows for different CI/CD stages
   - Use webhook nodes to trigger builds
   - Implement error handling and notifications

2. **Version Control**
   - Export important workflows regularly
   - Store workflow exports in version control
   - Maintain documentation for custom integrations

3. **Monitoring**
   - Enable n8n metrics for monitoring
   - Set up alerting for workflow failures
   - Monitor system resource usage

## Troubleshooting

1. **Container Issues**
   ```bash
   # Check container status
   docker-compose ps
   
   # View detailed logs
   docker-compose logs -f
   ```

2. **Database Issues**
   ```bash
   # Check database connection
   docker-compose exec postgres pg_isready -U n8n
   ```

3. **Common Solutions**
   - Clear browser cache if UI issues occur
   - Restart containers if workflows become unresponsive
   - Check disk space if database operations fail

## Support

For additional help:
- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [n8n GitHub Repository](https://github.com/n8n-io/n8n)

## License

This setup is provided as-is under the MIT license. n8n is licensed under its own terms.
