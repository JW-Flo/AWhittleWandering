#!/bin/bash
# Script to close all open PRs and delete unnecessary branches
# This script should be run by a user with appropriate GitHub permissions

set -e

REPO="JW-Flo/AWhittleWandering"
CURRENT_PR=128  # The PR running this cleanup

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
OPEN_PRS=$(gh pr list --repo "$REPO" --state open --json number,title,headRefName --jq ".[] | select(.number != $CURRENT_PR) | .number")

if [ -z "$OPEN_PRS" ]; then
    echo "No PRs to close (excluding current PR #$CURRENT_PR)"
else
    for PR_NUMBER in $OPEN_PRS; do
        PR_INFO=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json number,title,headRefName)
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
CURRENT_BRANCH="copilot/close-prs-and-branches"
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
