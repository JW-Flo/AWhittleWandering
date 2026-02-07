# PR7: Deploy hardening + CI log ingestion + Playwright E2E smoke

GOAL
- Make deployments deterministic and self-diagnosing.
- Fix Cloudflare deploy failure caused by invalid _redirects (error 10021 infinite loop).
- Capture and publish Cloudflare/Wrangler logs as CI artifacts + GitHub annotations.
- Add Playwright E2E smoke tests that click key UI paths (dashboard, coordination, demo, authors tab) and produce screenshots/traces on failure.

NON-GOALS
- UI/UX improvements. Functionality + deployability only.
- No new framework migration.

CONTEXT (Observed Failures)
- Cloudflare Workers deploy fails:
  - WARNING: Worker name mismatch (repo says "awhittlewandering", CI expects "awhittlewandering-api")
  - ERROR: Invalid _redirects configuration, Line 2 infinite loop detected [code: 10021]
- Frontend issues:
  - /dashboard Authors tab yields blank page (likely runtime error or failed API call)

DELIVERABLES
1) Fix redirect handling so Workers deploy never fails on _redirects.
2) Align Worker name in config with what Workers Builds expects (stop auto-PR churn).
3) CI: on any deploy failure, automatically:
   - collect wrangler logs
   - upload as build artifacts
   - emit GitHub Actions annotations summarizing root cause lines
   - optionally open/update an Issue comment on the PR with the summarized diagnosis
4) Add Playwright smoke suite that:
   - loads /dashboard
   - clicks "Coordination" route and waits for stable render
   - clicks Authors tab and asserts page is not blank + no console errors
   - loads /demo and asserts expected element text exists
   - captures screenshot + trace on failure

IMPLEMENTATION DETAILS

A) Redirect loop fix (Cloudflare validation 10021)
- Stop relying on `_redirects` for SPA fallback in the Worker+assets deployment path.
- Prefer implementing SPA fallback in the Worker handler:
  - For GET requests with Accept including "text/html":
    - Try serving the requested asset via env.ASSETS.fetch(request)
    - If 404, serve /index.html from env.ASSETS
  - Do NOT affect /api routes or non-HTML asset requests (js/css/png/etc).
- Ensure this logic lives in the Worker that serves frontend assets (or the edge-worker if it’s combining API+frontend).
- Remove or neutralize problematic `_redirects` from the build output to prevent validation errors:
  - If frontend build emits `_redirects`, ensure it is not shipped in the assets bundle for Workers deploy OR replace with a safe minimal config.
  - Prefer removal since SPA fallback is now code-driven.

B) Worker name consistency
- Update relevant wrangler.toml so the Worker name matches CI expectation:
  - expected: awhittlewandering-api (per build log)
- Ensure staging/prod naming remains consistent with PR4 decisions.

C) CI: Wrangler log capture + annotation
- In GitHub Actions workflows that deploy via wrangler:
  - run wrangler with verbose logging (or ensure logs file path is collected)
  - on failure:
    - print the last ~200 lines of the wrangler log to the job output
    - upload the full wrangler logs directory as an artifact
    - parse for known Cloudflare error patterns (10021, auth errors, missing bindings, etc.)
    - emit ::error annotations with the key lines and suggested fix links
- Output must be deterministic and safe: do not leak secrets (redact tokens).

D) Playwright E2E (CI)
- Add Playwright to the repo (prefer in frontend/).
- Create a smoke test file (e.g., frontend/tests/e2e/smoke.spec.ts).
- Configure tests to run against the deployed Pages preview URL (from CI env) OR a locally started preview server (choose simplest reliable approach):
  - Option 1 (preferred): Use the Cloudflare Pages preview URL available in CI to test the real deployed artifact.
  - If not available, Option 2: Start the frontend locally in CI and run against localhost, but still capture deploy logs.
- Add artifact output:
  - screenshots on failure
  - trace.zip on failure
  - console error collection (fail test on console.error/pageerror)

E) Docs
- Add a short doc: docs/CI_DEPLOY_DIAGNOSTICS.md
  - where logs are stored
  - how to reproduce locally
  - what error 10021 means + why we fixed it in code

ACCEPTANCE CRITERIA
- Cloudflare deploy no longer fails with error 10021.
- No Worker name mismatch warning during CI deploy.
- If deploy fails for any reason, CI artifacts include logs + annotations.
- Playwright smoke runs in CI and produces artifacts on failure.
- Authors tab blank page is either fixed or reliably caught with actionable error output (console stack + screenshot + trace).

SAFETY / SECURITY
- Least-privilege: do not broaden tokens.
- No secrets in logs. Add redaction if necessary.
- Do not add ad-hoc manual steps; everything must run in CI.

OUTPUT
- Open a PR titled: "PR7: Deploy diagnostics + SPA fallback + Playwright smoke"
- Include a clear PR description with:
  - what was broken
  - what changed
  - how to validate
  - where to find artifacts
