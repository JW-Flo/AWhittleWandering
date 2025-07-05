# Cloudflare API Token Fix Guide

## Problem Summary

Your deployment is failing with these errors:
1. **Authentication error [code: 10000]** - Missing Cloudflare Pages permissions
2. **Unable to retrieve email** - Missing User Details permission
3. **Missing pages_build_output_dir** - Fixed in wrangler.toml

## Required API Token Permissions

Your current `CF_API_TOKEN` is missing critical permissions. You need to create a **new token** with these exact scopes:

### Step 1: Create New Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"** → **"Custom token"**

### Step 2: Add These Exact Permissions

```
┌─────────────────────────────────────────────────────────────┐
│ REQUIRED PERMISSIONS (Exact names in Cloudflare UI)        │
├─────────────────────────────────────────────────────────────┤
│ Account - Cloudflare Pages:Edit - All accounts             │
│ Account - Workers Scripts:Edit - All accounts              │
│ User - User Details:Read - All users                       │
│ Zone - Zone:Read - All zones (if using custom domain)      │
│ Zone - Zone Settings:Edit - All zones (if custom domain)   │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Token Configuration

**Account Resources:**
- ✅ Include: All accounts

**Zone Resources:** (if using custom domains)
- ✅ Include: All zones

**Client IP Address Filtering:**
- Leave blank (allow all IPs)

**TTL:**
- Set to desired expiration (recommend 1 year)

### Step 4: Update GitHub Secret

1. Copy the new token
2. Go to your GitHub repository → Settings → Secrets and variables → Actions
3. Edit the `CF_API_TOKEN` secret
4. Replace with the new token value

## What Each Permission Does

| Permission | Purpose | Why Required |
|------------|---------|--------------|
| **Cloudflare Pages:Edit** | Deploy to Pages | Main deployment permission |
| **Workers Scripts:Edit** | Deploy edge workers | Worker deployment |
| **User Details:Read** | Get user info | Prevents email warning |
| **Zone:Read** | Read domain settings | Custom domain support |
| **Zone Settings:Edit** | Modify domain settings | SSL/DNS configuration |

## Alternative: Use Template + Manual Additions

If you prefer using a template:

1. Use **"Edit Cloudflare Workers"** template
2. Manually add these permissions:
   - Account - Cloudflare Pages:Edit
   - User - User Details:Read

## Files Fixed

✅ **wrangler.toml** - Added required `pages_build_output_dir = "dist"`
✅ **deploy-all.yml** - Removed (duplicate workflow)
✅ **deploy-all-fixed.yml** - Updated secret name mappings

## Testing the Fix

After updating the token:

1. Push changes to trigger deployment
2. Monitor: https://github.com/YOUR_USERNAME/ContinentalUSA/actions
3. Expected success URLs:
   - Edge Worker: https://thewanderingwhittle-edge.workers.dev
   - Public Site: https://continentalusa-site.pages.dev

## Troubleshooting

**Still getting authentication errors?**
- Verify token was copied completely (no extra spaces)
- Ensure all permissions are exactly as listed above
- Check that account ID matches your Cloudflare account

**"Project not found" errors?**
- The project will be created automatically on first deployment
- Ensure project name matches wrangler.toml: `continentalusa-site`

**Custom domain issues?**
- Add Zone permissions if using custom domains
- Verify domain is added to your Cloudflare account

## Security Notes

- ⚠️ Never commit API tokens to code
- 🔄 Rotate tokens every 6-12 months
- 📊 Monitor token usage in Cloudflare dashboard
- 🔒 Use minimum required permissions only

## Next Steps

1. Create new API token with correct permissions
2. Update GitHub secret `CF_API_TOKEN`
3. Push changes to trigger deployment
4. Verify successful deployment at provided URLs
