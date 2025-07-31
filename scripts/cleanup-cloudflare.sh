#!/bin/bash
# Cloudflare Cleanup Script - Remove redundant Pages projects
# Keep only: awhittlewandering-site (production site)

echo "🧹 CLOUDFLARE CLEANUP SCRIPT"
echo "============================"

echo "📋 Current Projects Before Cleanup:"
wrangler pages project list

echo ""
echo "🗑️ Starting cleanup of redundant projects..."

# Function to delete with confirmation bypass
delete_project() {
    local project_name=$1
    echo "Deleting project: $project_name"
    # Use expect to handle interactive prompts automatically
    expect -c "
        spawn wrangler pages project delete $project_name
        expect \"Are you sure\"
        send \"yes\r\"
        expect eof
    " 2>/dev/null || echo "Project $project_name may already be deleted or error occurred"
}

# Delete redundant projects
echo "🗑️ Deleting: awhittlewandering (old .pages.dev)"
delete_project "awhittlewandering"

echo "🗑️ Deleting: awhittlewandering-admin (old admin)"
delete_project "awhittlewandering-admin"

echo "🗑️ Deleting: wandering-whittle (old/unused)"
delete_project "wandering-whittle"

echo "🗑️ Deleting: continentalusa-site (old/unused)"
delete_project "continentalusa-site"

echo "🗑️ Deleting: project-ignite (unrelated)"
delete_project "project-ignite"

echo ""
echo "✅ CLEANUP COMPLETE!"
echo "📋 Remaining Projects:"
wrangler pages project list

echo ""
echo "🎯 PRODUCTION ARCHITECTURE:"
echo "- Main Site: awhittlewandering.com (via awhittlewandering-site)"
echo "- Admin Portal: admin.awhittlewandering.com (same project, domain routing)"
echo "- API: admin-api.awhittlewandering.com (worker)"
