# Authentication & API Key Storage Guide
## A Whittle Wandering Platform

This guide explains **where and how** all authentication credentials and API keys need to be saved in the A Whittle Wandering platform.

---

## 🔐 Authentication Storage Locations

### 1. **Backend API Secrets** (Cloudflare Workers)

**Location:** Cloudflare Workers Secrets (via Wrangler CLI)

**What needs to be saved:**
- `TESSIE_API_KEY` - Tesla data integration
- `MAPBOX_ACCESS_TOKEN` - Map services
- `OPENWEATHER_API_KEY` - Weather data
- `JWT_SECRET` - Authentication security (min 32 chars)
- `TESLA_VIN` - Vehicle Identification Number

**How to save:**
```bash
# Navigate to backend directory
cd backend/edge-worker

# Set secrets for development
npx wrangler secret put TESSIE_API_KEY
npx wrangler secret put MAPBOX_ACCESS_TOKEN
npx wrangler secret put OPENWEATHER_API_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put TESLA_VIN

# Set secrets for production
npx wrangler secret put TESSIE_API_KEY --env production
npx wrangler secret put MAPBOX_ACCESS_TOKEN --env production
npx wrangler secret put OPENWEATHER_API_KEY --env production
npx wrangler secret put JWT_SECRET --env production
npx wrangler secret put TESLA_VIN --env production
```

**Or use the automated script:**
```bash
./setup-tessie-secrets.sh
```

**Configuration File:**
- `backend/edge-worker/wrangler.toml` - Defines secret bindings
- Secrets are **NOT** stored in this file (only bindings)

**Access in Code:**
```typescript
// In backend/edge-worker/src/index.ts or routers
const tessieKey = c.env.TESSIE_API_KEY;
const mapboxToken = c.env.MAPBOX_ACCESS_TOKEN;
```

---

### 2. **Local Development Secrets** (`.dev.vars`)

**Location:** `backend/edge-worker/.dev.vars` (NOT committed to git)

**What needs to be saved:**
Same as above, but for local development only.

**How to save:**
```bash
# Copy example file
cp backend/edge-worker/.dev.vars.example backend/edge-worker/.dev.vars

# Edit .dev.vars and add your keys:
TESSIE_API_KEY=your_tessie_api_key
TESLA_VIN=your_vehicle_vin
JWT_SECRET=replace_with_random_32_plus_chars
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token
OPENWEATHER_API_KEY=your_openweather_api_key
```

**⚠️ Important:** `.dev.vars` is in `.gitignore` - never commit this file!

---

### 3. **Frontend User API Keys** (Browser localStorage)

**Location:** Browser `localStorage` (client-side only)

**What needs to be saved:**
- User's Tessie API Key (when user enters it)
- User's Mapbox Token (optional, if user provides)
- User's OpenWeather API Key (optional, if user provides)

**How it's saved:**
```typescript
// In frontend components (e.g., Index.tsx, AdminPortal.tsx)
localStorage.setItem('tessieApiKey', userEnteredKey);
localStorage.setItem('mapboxToken', userEnteredToken);
```

**Access in Code:**
```typescript
// In hooks (e.g., useTessieApi.ts, useUnifiedTessieApi.ts)
const apiKey = localStorage.getItem('tessieApiKey');
```

**Storage Keys Used:**
- `tessieApiKey` - User's Tessie API key
- `mapboxToken` - User's Mapbox token (optional)
- `openweatherApiKey` - User's OpenWeather key (optional)

**⚠️ Security Note:** These are stored in the browser, so they're visible to the user. This is intentional - users provide their own API keys.

---

### 4. **Admin Authentication** (Browser localStorage)

**Location:** Browser `localStorage`

**What needs to be saved:**
- Admin session token
- Session expiration time

**Storage Key:**
- `awhittlewandering_admin_token` - Admin session data

**How it's saved:**
```typescript
// In frontend/src/lib/auth.ts
localStorage.setItem('awhittlewandering_admin_token', JSON.stringify({
  isAuthenticated: true,
  expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
  sessionId: 'admin_session_id'
}));
```

**Access in Code:**
```typescript
// In frontend/src/lib/auth.ts
const session = JSON.parse(localStorage.getItem('awhittlewandering_admin_token'));
```

**Admin Password:**
- Currently hardcoded in `frontend/src/lib/auth.ts`
- Password: `RoadTrip48States!2025`
- **⚠️ TODO:** Move to backend secrets for production

---

### 5. **Frontend Environment Variables** (Build-time)

**Location:** `frontend/.env` (NOT committed to git)

**What needs to be saved:**
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_DESCRIPTION` - App description

**How to save:**
```bash
# Copy example
cp frontend/.env.example frontend/.env

# Edit .env:
VITE_API_BASE_URL=http://localhost:8787
VITE_APP_NAME="A Whittle Wandering"
VITE_APP_DESCRIPTION="48 Continental US Tesla Road Trip Tracker"
```

**⚠️ Note:** These are build-time variables, not runtime secrets. They're embedded in the build.

---

## 📋 Storage Summary Table

| Credential Type | Storage Location | Access Method | Security Level |
|----------------|------------------|---------------|----------------|
| **Backend API Keys** | Cloudflare Workers Secrets | `c.env.SECRET_NAME` | 🔒 High (encrypted) |
| **Local Dev Secrets** | `.dev.vars` file | Auto-loaded by Wrangler | ⚠️ Medium (local only) |
| **User API Keys** | Browser localStorage | `localStorage.getItem()` | ⚠️ Low (client-side) |
| **Admin Sessions** | Browser localStorage | `localStorage.getItem()` | ⚠️ Medium (client-side) |
| **Frontend Config** | `.env` file | `import.meta.env.VITE_*` | ℹ️ Public (build-time) |

---

## 🔒 Security Best Practices

### ✅ DO:
- Store backend secrets in Cloudflare Workers Secrets
- Use `.dev.vars` for local development (never commit)
- Store user API keys in localStorage (user-provided)
- Use environment variables for non-sensitive config
- Rotate secrets regularly
- Use strong JWT secrets (32+ characters)

### ❌ DON'T:
- Commit `.dev.vars` or `.env` files to git
- Hardcode API keys in source code
- Store backend secrets in frontend code
- Expose secrets in error messages
- Use weak JWT secrets

---

## 🚀 Setup Checklist

### Initial Setup:
- [ ] Run `./setup-tessie-secrets.sh` to configure backend secrets
- [ ] Create `backend/edge-worker/.dev.vars` for local development
- [ ] Create `frontend/.env` for frontend configuration
- [ ] Verify secrets are set: `npx wrangler secret list`
- [ ] Test API connections

### For Each Environment:
- [ ] Development: Set secrets without `--env` flag
- [ ] Production: Set secrets with `--env production` flag
- [ ] Verify secrets in Cloudflare Dashboard

---

## 📝 File Locations Reference

### Backend:
- `backend/edge-worker/wrangler.toml` - Secret bindings (committed)
- `backend/edge-worker/.dev.vars` - Local secrets (NOT committed)
- `backend/edge-worker/.dev.vars.example` - Example template (committed)

### Frontend:
- `frontend/.env` - Build-time config (NOT committed)
- `frontend/.env.example` - Example template (committed)
- `frontend/src/lib/auth.ts` - Admin auth (uses localStorage)
- `frontend/src/lib/config.ts` - Config management

### Scripts:
- `setup-tessie-secrets.sh` - Automated secret setup
- `config/api-management-system.js` - Secret validation

---

## 🔍 Verification Commands

### Check Backend Secrets:
```bash
cd backend/edge-worker
npx wrangler secret list
npx wrangler secret list --env production
```

### Validate API Configuration:
```bash
node config/api-management-system.js audit
```

### Test API Connections:
```bash
node validate-api-functionality.js
```

---

## ❓ Common Questions

**Q: Where do I put my Tessie API key?**
A: 
- **Backend:** Use `npx wrangler secret put TESSIE_API_KEY`
- **Frontend (user-provided):** Stored in browser localStorage when user enters it

**Q: How do I access secrets in backend code?**
A: Use `c.env.SECRET_NAME` in your Hono routes

**Q: Can I commit secrets to git?**
A: **NO!** Never commit `.dev.vars`, `.env`, or any files with actual secrets. Only commit `.example` files.

**Q: Where is the admin password stored?**
A: Currently hardcoded in `frontend/src/lib/auth.ts`. Should be moved to backend secrets for production.

**Q: How do users provide their API keys?**
A: Users enter their API keys in the frontend UI, which are stored in browser localStorage.

---

## 🆘 Troubleshooting

### "Secret not found" error:
- Verify secret is set: `npx wrangler secret list`
- Check environment flag matches: `--env production` if needed
- Ensure you're in the correct directory (`backend/edge-worker`)

### "API key not working" error:
- Verify key format is correct
- Check key hasn't expired or been revoked
- Test key directly with API provider

### "localStorage not persisting":
- Check browser allows localStorage
- Verify no private/incognito mode
- Check browser storage quota

---

*Last updated: 2025-12-21*
