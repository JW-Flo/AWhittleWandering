#!/usr/bin/env bash
# ===== monorepo-bootstrap.sh =====
# Vendoring helper libs, adding scripts & workflows in one go.

# 1. shared/ – schema + code-gen
mkdir -p shared && cat > shared/visit.schema.json <<'JSON'
{
  "$id": "Visit",
  "type": "object",
  "properties": {
    "id":   { "type": "string" },
    "time": { "type": "string", "format": "date-time" },
    "lat":  { "type": "number" },
    "lon":  { "type": "number" }
  },
  "required": ["id","time","lat","lon"]
}
JSON
npm pkg set name=@mcp/shared type=module &&
npm i -D openapi-typescript-codegen@latest        # [oai_citation:0‡GitHub]
npm set-script codegen:ts "openapi-typescript-codegen \
  --input edge-worker/openapi.yaml \
  --output shared/ts"

# 2. edge-worker – OAuth helper & HMAC util
mkdir -p edge-worker/src && cat > edge-worker/src/hmac.ts <<'TS'
// verifySignature adapted from Cloudflare example (workers-oauth-provider)
export async function verify(body: string, sig: string, key: CryptoKey) {
  const data = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = [...new Uint8Array(data)].map(b=>b.toString(16).padStart(2,"0")).join("");
  return hex === sig;
}
TS  # [oai_citation:1‡GitHub] [oai_citation:2‡GitHub]

# 3. ios-client – SwiftLocation & BGTask skeleton
swift package init --type library --name MCPClient -d ios-client &&
swift package --package-path ios-client \
  add dependency https://github.com/malcommac/SwiftLocation.git --branch master   # [oai_citation:3‡GitHub]
cat > ios-client/Sources/MCPClient/SyncScheduler.swift <<'SWIFT'
// based on BGAppRefresh demo repos
// [oai_citation:4‡GitHub] [oai_citation:5‡GitHub]
import BackgroundTasks, Foundation
SWIFT

# 4. commit-lint
npm i -D @commitlint/{cli,config-conventional}    # [oai_citation:6‡Npm]
cat > .commitlintrc.cjs <<'JS'
module.exports = { extends: ['@commitlint/config-conventional'],
  rules: { 'scope-enum':[2,'always',['edge','ios','cli','shared']] } };
JS

# 5. GitHub workflows (Wrangler deploy uses official action)  # [oai_citation:7‡GitHub]
mkdir -p .github/workflows && cat > .github/workflows/worker.yml <<'YML'
name: Worker CI
on: push
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          workingDirectory: edge-worker
          command: publish
YML

# 6. charging-plan stub (uses ABRP later)   # [oai_citation:8‡GitHub]
cat > .github/workflows/charging-plan.yml <<'YML'
name: Charging Plan
on: workflow_dispatch
jobs:
  plan:
    runs-on: ubuntu-latest
    env:
      ABRP_API_KEY: ${{ secrets.ABRP_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - run: echo "leg,start,end" > charging-plan.csv
      - run: git config user.email bot@github && git config user.name bot &&
             git add charging-plan.csv && git commit -m "cli: stub plan" && git push
YML

# 7. openapi.yaml seed (Edge API)   # [oai_citation:9‡GitHub]
cat > edge-worker/openapi.yaml <<'YAML'
openapi: 3.1.0
info: {title: MCP Edge, version: 0.1.0}
paths:
  /v1/sync:
    post:
      requestBody: {required: true, content: {application/json: {schema: {$ref: '../shared/visit.schema.json'}}}}
      responses: {200: {description: OK}}
YAML

echo "Scaffold files written – stage & commit with 'shared: bootstrap' prefix"
