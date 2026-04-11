# Test Credentials — A Whittle Wandering

## Admin/Owner Account

| Field | Value |
|-------|-------|
| Email | joe@awhittlewandering.com |
| Password | JourneyAdmin2025! |
| Role | owner |
| MFA | TOTP MFA **REQUIRED** before first login |

### Setting Up Admin MFA (One-Time Setup)
1. Visit `https://awhittlewandering.pages.dev/auth` (or the production domain)
2. Log in → you will be prompted with `mfa_setup_required`
3. Use the MFA enrollment API:
   ```
   POST https://api.awhittlewandering.com/api/v1/mfa/enroll
   Authorization: Bearer <temp_token_from_login_attempt>
   ```
   OR use the `/dashboard` MFA setup UI in the app.
4. Scan the QR code with Google Authenticator / Authy
5. Complete enrollment with the 6-digit code

## Database

| Resource | Value |
|----------|-------|
| D1 Database | tesla-journey-tracker |
| Database ID | 889d864a-966d-4e8a-a3cd-bc60abf23688 |
| Drives | 1,226 |
| Charges | 165 |
| States Visited | 41 |
| Total Miles | 15,592.62 |
| Journey ID | continental-usa-2025 |

## Deployment URLs

| Environment | URL |
|-------------|-----|
| Frontend (Pages) | https://awhittlewandering.pages.dev |
| Frontend (Custom) | https://awhittlewandering.com (DNS initializing) |
| Backend API | https://api.awhittlewandering.com |
| Workers.dev | https://awhittlewandering.kd8jc7v8cd.workers.dev |

## Cloudflare Resources

| Resource | Value |
|----------|-------|
| Account ID | 620865722bd88ef0a77dbbb60c91392e |
| Zone ID | 4983dcf0cbfebc73e920a2f1f27acabc |
| Worker Name | awhittlewandering-api |
| Pages Project | awhittlewandering |

## Key API Endpoints
- `GET /api/v1/health` — system health + data counts
- `GET /api/v1/unified-data` — full journey data
- `GET /api/v1/unified-data/continental-usa-2025` — journey-scoped data
- `POST /api/v1/auth` — login/register
- `GET /api/v1/config` — frontend config (Mapbox token etc.)
