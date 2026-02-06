# Runtime Bindings Matrix

Single source of truth for all Cloudflare Worker bindings across environments.

## Worker: `awhittlewandering-api`

### D1 Databases

| Binding      | Environment  | Database Name              | Database ID                              | Status      |
| ------------ | ------------ | -------------------------- | ---------------------------------------- | ----------- |
| `TESLA_DB`   | default/prod | `tesla-journey-tracker`    | `889d864a-966d-4e8a-a3cd-bc60abf23688`  | Active      |
| `TESLA_DB`   | development  | `tesla-journey-tracker-dev`| `local` (SQLite)                         | Active      |
| `TESLA_DB`   | staging      | `tesla-journey-tracker`    | `889d864a-966d-4e8a-a3cd-bc60abf23688`  | Shared w/prod (temporary) |
| `TESLA_DB`   | production   | `tesla-journey-tracker`    | `889d864a-966d-4e8a-a3cd-bc60abf23688`  | Active      |

**Action needed:** Create a dedicated staging D1 database (`tesla-journey-tracker-staging`) to avoid shared state with production.

### KV Namespaces

| Binding        | Environment  | Namespace ID                           | Status      |
| -------------- | ------------ | -------------------------------------- | ----------- |
| `AUTH_TOKENS`  | default      | `7838e32d8ad04855b13eb2d9aa4f9811`     | Active      |
| `AUTH_TOKENS`  | development  | `7838e32d8ad04855b13eb2d9aa4f9811`     | Shared      |
| `AUTH_TOKENS`  | staging      | `7838e32d8ad04855b13eb2d9aa4f9811`     | Shared w/prod (temporary) |
| `AUTH_TOKENS`  | production   | `7838e32d8ad04855b13eb2d9aa4f9811`     | Active      |

**Action needed:** Create dedicated KV namespaces for development and staging.

### Analytics Engine

| Binding               | Environment | Status    |
| --------------------- | ----------- | --------- |
| `TELEMETRY_ANALYTICS` | all         | Configured |

### AI

| Binding | Environment | Status    |
| ------- | ----------- | --------- |
| `AI`    | all         | Configured |

### R2 (disabled)

| Binding        | Environment | Bucket Name                | Status   |
| -------------- | ----------- | -------------------------- | -------- |
| `MEDIA_BUCKET` | all         | `awhittlewandering-media`  | Disabled |

### Queues (disabled)

| Binding          | Environment | Queue Name                 | Status   |
| ---------------- | ----------- | -------------------------- | -------- |
| `DATA_PROCESSOR` | all         | `tesla-data-processor`     | Disabled |

### Durable Objects (disabled)

| Binding           | Environment | Class Name       | Status   |
| ----------------- | ----------- | ---------------- | -------- |
| `JOURNEY_TRACKER` | all         | `JourneyTracker` | Disabled |

## Environment Variables (non-secret)

| Variable         | Value                                  | Environments |
| ---------------- | -------------------------------------- | ------------ |
| `LOG_LEVEL`      | `info` (prod), `debug` (staging/dev)   | all          |
| `AI_GATEWAY_ID`  | `awhittlewandering-ai`                 | all          |
| `AI_MODEL_NAME`  | `@cf/meta/llama-3.1-8b-instruct`      | all          |

## Custom Domain Routes

| Pattern                                | Zone                       | Environment |
| -------------------------------------- | -------------------------- | ----------- |
| `api.awhittlewandering.com/*`          | `awhittlewandering.com`    | production  |
| `api-staging.awhittlewandering.com/*`  | `awhittlewandering.com`    | staging     |
