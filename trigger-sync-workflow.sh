#!/bin/bash

# Trigger GitHub Actions Workflow to Sync Secrets
# This script uses GitHub CLI to trigger the sync-secrets workflow

set -e

echo "🔄 Triggering GitHub Actions Secret Sync Workflow"
echo "=================================================="
echo ""

# Check if GitHub CLI is available and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found"
    echo "   Install: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI not authenticated"
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
    echo "⚠️  Could not detect repository"
    echo "   Please provide repository: OWNER/REPO"
    read -p "Repository (e.g., owner/repo): " REPO
fi

if [ -z "$REPO" ]; then
    echo "❌ Repository required"
    exit 1
fi

echo "📦 Repository: $REPO"
echo ""

# Get current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo "🌿 Branch: $BRANCH"
echo ""

# Trigger workflow
echo "🚀 Triggering workflow: Sync Secrets to Cloudflare Workers"
echo ""

WORKFLOW_ID="sync-secrets.yml"
WORKFLOW_NAME="Sync Secrets to Cloudflare Workers"

# Check if workflow exists
if ! gh workflow list 2>/dev/null | grep -q "$WORKFLOW_NAME"; then
    echo "⚠️  Workflow not found: $WORKFLOW_NAME"
    echo "   Available workflows:"
    gh workflow list 2>/dev/null || echo "   (Could not list workflows)"
    exit 1
fi

# Trigger the workflow
echo "Triggering workflow..."
gh workflow run "$WORKFLOW_ID" --ref "$BRANCH" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Workflow triggered successfully!"
    echo ""
    echo "📊 Monitor progress:"
    echo "   https://github.com/$REPO/actions"
    echo ""
    echo "⏳ Waiting for workflow to start..."
    sleep 3
    
    # Show latest run
    echo ""
    echo "📋 Latest workflow run:"
    gh run list --workflow="$WORKFLOW_ID" --limit 1 2>/dev/null || echo "   (Could not fetch run status)"
    
    echo ""
    echo "✅ Sync workflow is running!"
    echo "   Check GitHub Actions for progress"
else
    echo ""
    echo "❌ Failed to trigger workflow"
    echo "   Check GitHub CLI authentication and permissions"
    exit 1
fi
