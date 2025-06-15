# The Wandering Whittle Project

This repository contains the full source code and deployment configuration for The Wandering Whittle, a 60-day Tesla road trip tracking application across the 48 contiguous United States.

## Project Overview

- **Edge Worker**: Cloudflare Worker backend providing APIs for vehicle telemetry, trip data, and integrations.
- **Public Site**: React frontend displaying live trip data, maps, and dashboards.
- **MCP Server**: Local orchestrator for agent tasks and telemetry buffering.

## Environment Setup

1. Copy `.env.example` to `.env` in the public site and `.dev.vars` in the edge worker.
2. Configure required environment variables:
   - `VITE_MAPBOX_TOKEN`
   - `VITE_OPENWEATHER_API_KEY`
   - `VITE_TESSIE_API_TOKEN`
   - `VITE_TESSIE_VIN`
   - `EDGE_HMAC_KEY`
   - `VITE_API_BASE_URL`
   - `VITE_EDGE_WORKER_URL`
3. Use the `setup-env.cjs` script to synchronize environment variables.

## Deployment

- Use `deploy-all.sh` script to deploy Edge Worker and Public Site.
- Ensure `EDGE_HMAC_KEY` is set in environment and GitHub secrets.
- Configure custom domain and DNS in Cloudflare.
- Enable HTTPS enforcement via Cloudflare Page Rules.

## Troubleshooting

- Verify environment variables are consistent and present.
- Check Cloudflare dashboard for DNS and SSL settings.
- Use deployment verification scripts to test API endpoints.
- Review logs for errors during deployment or runtime.

## Contributing

- Follow existing code style and commit conventions.
- Run tests and lint before submitting PRs.
- Update documentation for new features or changes.

---

For detailed setup and deployment instructions, see the `docs/` directory and `48Continental_Starter/public-site/README.md`.

## CI/CD Monitoring

The project includes a GitHub Workflow Status Checker that recursively monitors CI/CD pipeline status after commits:

- Automatically checks workflow status for multiple commits
- Generates detailed reports with workflow outcomes
- Provides real-time feedback on build, test, and deployment processes
- Integrates with the MCP server for comprehensive monitoring

For detailed instructions, see [CI/CD Monitoring Instructions](./docs/ci-cd-monitoring-instructions.md)
