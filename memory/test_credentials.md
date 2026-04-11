# Test Credentials — A Whittle Wandering

## Admin/Owner Account

| Field | Value |
|-------|-------|
| Email | joe@awhittlewandering.com |
| Password | JourneyAdmin2025! |
| Role | owner |
| MFA | Not enrolled (bypassed per previous fix) |

### Login
1. Visit `https://awhittlewandering.pages.dev/login`
2. Enter email + password above
3. Redirects to `/dashboard` on success

## Public Follower View
- URL: `https://awhittlewandering.pages.dev/journey/continental-usa-2025`
- No login required
- Shows: map, 41/48 states progress, stats grid, journal entries, narrative

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
