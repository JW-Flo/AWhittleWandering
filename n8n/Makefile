# Quick deployment targets
quick-deploy:
	@./scripts/quick-deploy.sh

quick-deploy-report:
	@./scripts/quick-deploy.sh --report

# Agent automation
automate-all: quick-deploy
	@echo "Starting automated deployment and task execution..."
	@./scripts/assign-copilot-tasks.sh --auto-approve
	@./scripts/register-workflows.sh --auto-approve
	@make monitor-all

# Monitoring shortcuts
monitor-all:
	@./scripts/maintenance.sh monitor --all-services

status-all:
	@echo "=== System Status ==="
	@make agent-status
	@make workflow-status
	@make deployment-status
	@echo "===================="
