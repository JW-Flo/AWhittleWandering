AWhittleWandering – End-to-End Production Deployment Playbook
Version 2025-06-12

Table of Contents
Project Scope & Goals

Glossary & Roles

High-Level Architecture

Pre-Deployment Checklist

Secrets & Environment-Variable Matrix

Cloudflare Configuration

Source-Control Structure

Local Build & Smoke-Test Workflow

Cloudflare Pages Deployment

Cloudflare Worker (+ Durable Object) Deployment

n8n-Orchestrated CI/CD Pipeline

GitHub Actions Pipeline Reference

Post-Deploy Validation & Load-Testing

Cloudflare Web Assets Hardening

Observability & Incident Response

Backup, Rollback & Disaster Recovery

Maintenance Cadence

Appendix A – Scripts

Appendix B – n8n Node Blueprints

Appendix C – Troubleshooting Matrix

<a id="1"></a>

1 · Project Scope & Goals
Item Target Value
Public URL <https://awhittlewandering-site.pages.dev>
API URL <https://awhittlewandering-edge>.<CF_ACCOUNT_ID>.workers.dev
Concurrency SLA 200 simultaneous users
Data Live Tesla telemetry (Tessie); weather (OpenWeather)
Streaming WebSocket (/sync-service) preferred; REST fallback
Automation n8n triggers → GitHub Actions builds & deploys
Post-deploy Security Cloudflare Web Assets: endpoint discovery + schema validation

<a id="2"></a>

2 · Glossary & Roles
Term Description
Pages Cloudflare Pages (static hosting for React/Vite)
Worker Cloudflare Worker serving REST + WebSocket API
DO Durable Object (SyncService) for WebSocket brokering
KV Cloudflare KV namespaces APP_KV, ITINERARY_KV
n8n Workflow orchestrator (CI/CD triggers)
GH Actions GitHub Actions (build & deploy pipelines)
Web Assets CF security module for endpoint monitoring

<a id="3"></a>

3 · High-Level Architecture
mermaid
Copy
Edit
graph LR
  subgraph Cloudflare
    Pages[awhittlewandering-site<br/>Cloudflare Pages]
    Worker[awhittlewandering-edge<br/>Cloudflare Worker]
    DO[SyncService<br/>Durable Object]
    KV[(APP_KV & ITINERARY_KV)]
  end
  subgraph External
    Tessie[Tessie API]
    Weather[OpenWeather API]
    GH[GitHub Actions]
    n8n[n8n Orchestrator]
    WAF[Web Assets]
  end
  Tessie --> Worker
  Weather --> Worker
  Worker --> DO
  DO --> Pages
  Worker -. caches .-> KV
  n8n -->|dispatch| GH
  GH -->|deploy| Worker & Pages
  Worker -->|register| WAF
<a id="4"></a>

4 · Pre-Deployment Checklist
 Rename all 48Continental → AWhittleWandering in code & docs

 Update edge-worker/wrangler.toml: name = "awhittlewandering-edge"

 Create Cloudflare Pages project awhittlewandering-site

 Provision KV namespaces (APP_KV, ITINERARY_KV) and bind in wrangler.toml

 Configure Durable Object SyncService migration (v1) in wrangler.toml

 Populate GitHub Secrets (see §5)

 Install Wrangler CLI (npm install -g wrangler)

 Validate Tessie account & token are active

<a id="5"></a>

5 · Secrets & Environment-Variable Matrix
Scope Key Store Notes
Cloudflare CF_API_TOKEN, CF_ACCOUNT_ID GitHub Secrets Worker & Pages deployment
Tessie TESSIE_API_TOKEN, TESSIE_VIN Wrangler secret Edge Worker only
Weather OPENWEATHER_API_KEY Wrangler secret Edge Worker
Mapbox MAPBOX_TOKEN Wrangler secret Edge Worker
Frontend VITE_MAPBOX_TOKEN Pages env duplicate of MAPBOX_TOKEN
VITE_EDGE_WORKER_URL Pages env Worker URL
VITE_API_BASE_URL Pages env same as above
VITE_WEBSOCKET_ENDPOINT Pages env wss://…/sync-service
VITE_ENABLE_STREAMING Pages env "true"
VITE_USE_SIMULATED_DATA Pages env "false"
Worker HMAC EDGE_HMAC_KEY Wrangler secret Request signing/verification

<a id="6"></a>

6 · Cloudflare Configuration
Pages

Project: awhittlewandering-site

Root: 48Continental_Starter/public-site

Build: npm run build → dist

Env: all VITE_* variables

Worker (wrangler.toml):

toml
Copy
Edit
name = "awhittlewandering-edge"
[durable_objects]
bindings = [{ name = "SYNC_SERVICE_DO", class_name = "SyncService" }]
[[migrations]]
tag = "v1"
new_classes = ["SyncService"]
[[kv_namespaces]]
binding = "APP_KV"
id = "<APP_KV_ID>"
[[kv_namespaces]]
binding = "ITINERARY_KV"
id = "<ITINERARY_KV_ID>"
Create KV namespaces in CF dashboard; copy IDs into wrangler.toml.

<a id="7"></a>

7 · Source-Control Structure
bash
Copy
Edit
repo/
├─ edge-worker/
│   ├─ wrangler.toml
│   └─ src/
├─ 48Continental_Starter/public-site/
├─ docs/DEPLOY_PLAYBOOK.md   ← this file
├─ scripts/deploy-all.sh     # CLI helper
└─ ops/add_endpoints.sh      # Web Assets onboarding
<a id="8"></a>

8 · Local Build & Smoke-Test
bash
Copy
Edit

# Frontend

cd 48Continental_Starter/public-site
npm ci && npm run build
npx serve dist

# Worker

cd edge-worker
npm ci
npx wrangler dev
curl <http://127.0.0.1:8787/api/v1/status>
<a id="9"></a>

9 · Cloudflare Pages Deployment
bash
Copy
Edit
cd 48Continental_Starter/public-site
npm ci && npm run build
npx wrangler pages deploy dist --project-name awhittlewandering-site
Verify <https://awhittlewandering-site.pages.dev>.

<a id="10"></a>

10 · Cloudflare Worker Deployment
bash
Copy
Edit
cd edge-worker
npm ci

# wrangler secret put ... for tokens

npx wrangler deploy
Smoke:

bash
Copy
Edit
curl <https://awhittlewandering-edge>.<CF_ACCOUNT_ID>.workers.dev/api/v1/status
wscat -c wss://awhittlewandering-edge.<CF_ACCOUNT_ID>.workers.dev/sync-service
<a id="11"></a>

11 · n8n-Orchestrated CI/CD Pipeline
CI/CD Trigger
Webhook /github/cicd (POST, HMAC)

IF ref contains refs/heads/main

HTTP Request → GitHub API dispatch

Optional Poll for run status

Notification (Slack/Email)

Manual Deploy
Manual trigger node → same dispatch

Import JSON from Appendix B.

<a id="12"></a>

12 · GitHub Actions Pipeline
Key env block in .github/workflows/deploy-all-final.yml:

yaml
Copy
Edit
env:
  SITE_NAME: awhittlewandering-site
  WORKER_NAME: awhittlewandering-edge
  VITE_EDGE_WORKER_URL: https://${{ env.WORKER_NAME }}.${{ secrets.CF_ACCOUNT_ID }}.workers.dev
  VITE_API_BASE_URL: ${{ env.VITE_EDGE_WORKER_URL }}
  VITE_WEBSOCKET_ENDPOINT: wss://${{ env.WORKER_NAME }}.${{ secrets.CF_ACCOUNT_ID }}.workers.dev/sync-service
  VITE_ENABLE_STREAMING: "true"
  VITE_USE_SIMULATED_DATA: "false"
<a id="13"></a>

13 · Post-Deploy Validation & Load-Testing
bash
Copy
Edit

# WebSocket load test

artillery quick --duration 60 --count 200 wss://<worker>.workers.dev/sync-service

# REST load test

k6 run - <<EOF
import http from "k6/http";
export let options={vus:200,duration:"60s"};
export default()=>http.get("https://<worker>.workers.dev/api/vehicle");
EOF
Targets: p95 < 600 ms, errors < 2%.

<a id="14"></a>

14 · Cloudflare Web Assets Hardening
API Token (Zone WAF Write/Read)

Register Endpoints

bash
Copy
Edit
CF_API_TOKEN=<token> ops/add_endpoints.sh
Wait ≥ 24 h → Dashboard → Web Assets → Discovery → Save

Upload OpenAPI spec → Schema Validation

Enable Page Shield

<a id="15"></a>

15 · Observability & Incident Response
Layer Mechanism Cadence
Worker GET /api/v1/status via n8n every 10 min
Pages Cloudflare Analytics weekly
Web Assets CF WAF alerts immediate
Tessie Worker logs (wrangler tail) manual/Grafana

<a id="16"></a>

16 · Backup, Rollback & Disaster Recovery
Rollback Worker:
gh workflow run deploy-all-final.yml -f ref=refs/tags/vX.Y.Z

Rollback Pages: promote previous in CF Pages

Backup KV: wrangler kv:export --namespace-id <ID> backup.json

Backup n8n: tar /home/node/.n8n nightly

Secrets: managed in 1Password

<a id="17"></a>

17 · Maintenance Cadence
Frequency Task
Daily Review logs & Web Assets alerts
Weekly scripts/verify-site.sh; refresh endpoints
Bi-weekly npm audit fix + redeploy
Monthly Rotate tokens; tag stable release
Post-Trip Archive KV; revoke unused Tessie tokens

<a id="A"></a>

Appendix A – Scripts
scripts/deploy-all.sh

ops/add_endpoints.sh

scripts/verify-site.sh

<a id="B"></a>

Appendix B – n8n Node Blueprints
<details><summary><code>ci-cd.json</code></summary>
json
Copy
Edit
{
  "name": "CI/CD",
  "nodes": [ /* see earlier section */ ]
}
</details>
<a id="C"></a>

Appendix C – Troubleshooting Matrix
Symptom Cause Resolution
Map spinner never stops Missing VITE_MAPBOX_TOKEN Add to Pages env; rebuild
/api/vehicle returns 500 Tesla asleep or bad token Wake vehicle or fix secrets
WS closes prematurely Missing DurableObject ping Ensure ping every 60 s
Web Assets validation fail Schema mismatch Update OpenAPI + re-upload schema
Deploy fails Invalid project/token Verify names & token scopes

End of Playbook
