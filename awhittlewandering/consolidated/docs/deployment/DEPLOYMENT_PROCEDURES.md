# Deployment Procedures

This document outlines the deployment procedures for the A Whittle Wandering project.

## Deployment Infrastructure

The deployment infrastructure consists of several components:

- **GitHub Actions**: For automated CI/CD workflows
- **Cloudflare Workers**: For edge computing functionality
- **Cloudflare Pages**: For static site hosting
- **KV Storage**: For storing and retrieving trip data

## Deployment Process

### Prerequisites

Before deploying, ensure the following:

1. All tests are passing
2. The build process completes successfully
3. Required environment variables are set

### Production Deployment

Follow these steps for a production deployment:

1. Create a new release tag in GitHub
2. The GitHub Actions workflow will automatically deploy to production
3. Verify the deployment using the verification scripts

```bash
# Verify deployment
./scripts/verify-deployment.sh
```

### Staging Deployment

For staging deployments:

1. Push changes to the `staging` branch
2. The GitHub Actions workflow will automatically deploy to the staging environment
3. Verify the staging deployment

```bash
# Verify staging deployment
./scripts/verify-deployment.sh --environment=staging
```

## Deployment Configuration

The deployment configuration is stored in the following files:

- `.github/workflows/deploy.yml`: GitHub Actions workflow for deployment
- `wrangler.toml`: Configuration for Cloudflare Workers
- `wrangler-site.toml`: Configuration for the public site

## Rollback Procedures

If issues are detected after deployment, follow these steps to rollback:

1. Identify the last stable release tag
2. Trigger a manual deployment of that tag using GitHub Actions
3. Verify the rollback has resolved the issue

```bash
# Manual rollback to a specific release
./scripts/deploy-specific-version.sh v1.0.0
```

## Deployment Monitoring

After each deployment, monitor the following:

- Application performance metrics
- Error rates
- API response times
- User engagement metrics

## Troubleshooting Deployments

Common deployment issues and their solutions:

1. **API Token Permissions**: Ensure Cloudflare API tokens have the correct permissions.
2. **KV Access**: Verify that the Worker has access to required KV namespaces.
3. **Environment Variables**: Check that all required environment variables are set.
4. **DNS Configuration**: Verify DNS settings are correct for custom domains.
