# Custom Domain Setup for TheWanderingWhittle.com

## Current Status
- ✅ Public site deploys to: `continentalusa-site.pages.dev`
- ❌ Need to configure: `TheWanderingWhittle.com` → Cloudflare Pages

## Steps to Configure Custom Domain

### 1. Add Custom Domain in Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **continentalusa-site**
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `thewanderingwhittle.com`
6. Click **Continue**

### 2. DNS Configuration

You'll need to configure DNS records for `thewanderingwhittle.com`:

#### Option A: If domain is already on Cloudflare
- Cloudflare will automatically add the CNAME record
- No manual DNS changes needed

#### Option B: If domain is with another provider
Add these DNS records at your domain registrar:

```
Type: CNAME
Name: thewanderingwhittle.com (or @)
Value: continentalusa-site.pages.dev
```

### 3. SSL Certificate
- Cloudflare will automatically provision an SSL certificate
- This may take 5-15 minutes to complete

### 4. Update Workflow Configuration

Update the deployment workflow to use the custom domain:

```yaml
# In .github/workflows/deploy-all.yml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/wrangler-action@v3.13.0
  with:
    apiToken: ${{ secrets.CF_API_TOKEN }}
    accountId: ${{ secrets.CF_ACCOUNT_ID }}
    workingDirectory: 48Continental_Starter/public-site
    command: pages deploy dist --project-name=continentalusa-site --compatibility-date=2024-01-01
```

### 5. Verification

After setup, verify the domain works:
- https://thewanderingwhittle.com
- Should redirect to HTTPS automatically
- Should serve the same content as continentalusa-site.pages.dev

## Additional Configuration

### Subdomain Setup (Optional)
You might also want to set up:
- `www.thewanderingwhittle.com` → redirect to main domain
- `api.thewanderingwhittle.com` → point to edge worker

### Edge Worker Domain
Consider also setting up a custom domain for the edge worker:
- `api.thewanderingwhittle.com` → `thewanderingwhittle-edge.workers.dev`

## Current URLs After Setup
- **Main Site**: https://thewanderingwhittle.com
- **Edge Worker**: https://thewanderingwhittle-edge.workers.dev (or custom subdomain)
