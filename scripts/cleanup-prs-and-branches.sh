#!/bin/bash
# Script to close all open PRs and delete unnecessary branches
# This script should be run by a user with appropriate GitHub permissions

set -e

REPO="JW-Flo/AWhittleWandering"

# Try to detect current PR number if running in a PR context
CURRENT_PR=$(gh pr view --json number -q .number 2>/dev/null || echo "")
if [ -z "$CURRENT_PR" ]; then
    echo "Warning: Could not detect current PR number. No PR will be excluded from closure."
    CURRENT_PR="none"
fi

echo "============================================"
echo "Cleaning up PRs and Branches for $REPO"
echo "============================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

echo "Step 1: Closing open pull requests (except #$CURRENT_PR)..."
echo "---------------------------------------------"

# Get all open PRs except the current one
ALL_PRS=$(gh pr list --repo "$REPO" --state open --json number,title,headRefName)

if [ "$CURRENT_PR" = "none" ]; then
    PRS_TO_CLOSE=$(echo "$ALL_PRS" | jq -c '.[]')
else
    PRS_TO_CLOSE=$(echo "$ALL_PRS" | jq -c ".[] | select(.number != $CURRENT_PR)")
fi

if [ -z "$PRS_TO_CLOSE" ]; then
    echo "No PRs to close (excluding current PR #$CURRENT_PR)"
else
    echo "$PRS_TO_CLOSE" | while IFS= read -r PR_INFO; do
        PR_NUMBER=$(echo "$PR_INFO" | jq -r '.number')
        PR_TITLE=$(echo "$PR_INFO" | jq -r '.title')
        PR_BRANCH=$(echo "$PR_INFO" | jq -r '.headRefName')
        
        echo "Closing PR #$PR_NUMBER: $PR_TITLE"
        gh pr close "$PR_NUMBER" --repo "$REPO" --comment "Closing as part of repository cleanup. This PR is no longer needed." || echo "  Warning: Failed to close PR #$PR_NUMBER"
        
        echo "  Associated branch: $PR_BRANCH"
    done
fi

echo ""
echo "Step 2: Listing branches to delete..."
echo "---------------------------------------------"

# Get all branches except main/master and the current working branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$CURRENT_BRANCH" ]; then
    echo "Warning: Could not detect current branch. Will not exclude any branch from deletion list."
    CURRENT_BRANCH="none"
fi

BRANCHES_TO_DELETE=$(gh api "/repos/$REPO/branches" --jq '.[] | select(.name != "main" and .name != "master" and .name != "'$CURRENT_BRANCH'" and .protected == false) | .name')

if [ -z "$BRANCHES_TO_DELETE" ]; then
    echo "No branches to delete (excluding main/master and current branch)"
else
    echo "The following branches will be deleted:"
    echo "$BRANCHES_TO_DELETE" | while read -r BRANCH; do
        echo "  - $BRANCH"
    done
    
    echo ""
    read -p "Do you want to delete these branches? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" = "yes" ]; then
        echo ""
        echo "Step 3: Deleting branches..."
        echo "---------------------------------------------"
        
        echo "$BRANCHES_TO_DELETE" | while read -r BRANCH; do
            echo "Deleting branch: $BRANCH"
            gh api -X DELETE "/repos/$REPO/git/refs/heads/$BRANCH" || echo "  Warning: Failed to delete branch $BRANCH"
        done
        
        echo ""
        echo "✓ Branch cleanup complete!"
    else
        echo "Branch deletion cancelled."
    fi
fi

echo ""
echo "============================================"
echo "Cleanup Summary:"
echo "============================================"
echo "✓ Closed PRs: Check above output for closed PRs"
echo "✓ Deleted branches: Check above output for deleted branches"
echo ""
echo "Note: PR #$CURRENT_PR (current cleanup PR) was not closed."
echo "You can close it manually once you verify the cleanup."
echo ""
