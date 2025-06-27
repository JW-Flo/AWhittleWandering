# AWhittleWandering Handoff-Readiness Tasks

## Task Progress
1. **JWT Admin Auth** ✅
   - Implement HS256 verifyAdmin(jwt, ENV.ADMIN_JWT_SECRET)
   - Guard all admin routes with 401 response for unauthorized requests
   - Validate with tests

2. **Live Telemetry Toggle** ⏳
   - Add LIVE_TELEMETRY_ENABLED environment variable
   - Wrap Tessie/Tesla fetch in telemetry service
   - Validate with tests

3. **Consolidate Frontend** ⏳
   - Move legacy files to packages/frontend
   - Delete legacy folder
   - Build and test

4. **Docs Sync** ⏳
   - Generate ENVIRONMENT_VARIABLES.md
   - Update README with quick-start & dev commands

5. **Mapbox Performance** ⏳
   - Optimize initial load
   - Test with Lighthouse

6. **Monitoring Cron** ⏳
   - Implement monitoring worker
   - Deploy preview

7. **Security Audit** ⏳
   - Run npm audit, eslint, and secret grep
   - Address any high-severity issues

8. **CI Workflow Update** ⏳
   - Add concurrency to GitHub workflow
   - Export new environment variables
