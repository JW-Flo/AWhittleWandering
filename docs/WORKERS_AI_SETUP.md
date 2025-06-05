# Workers AI Setup for 48 Continental

## Overview

The 48 Continental project includes an AI Worker that provides intelligent features like route optimization, charging strategy recommendations, and travel highlights using Cloudflare Workers AI.

## Workers AI Token

You've been provided with a Workers AI token:
```
ncb7JjU0QyKqQc3QJapVlNY_c3ufwMCLL7VuzsfY
```

## Setup Instructions

### 1. GitHub Repository Secrets

Add the following secret to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add:
   - Name: `WORKERS_AI_TOKEN`
   - Value: `ncb7JjU0QyKqQc3QJapVlNY_c3ufwMCLL7VuzsfY`

### 2. Local Development

For local development of the AI Worker, add to `edge-worker/src/ai-worker/.dev.vars`:

```env
WORKERS_AI_TOKEN=ncb7JjU0QyKqQc3QJapVlNY_c3ufwMCLL7VuzsfY
```

### 3. AI Worker Features

The AI Worker provides these endpoints:

#### OpenAI-Compatible Endpoints
- `/v1/chat/completions` - Chat completions using Llama 3.1
- `/v1/embeddings` - Text embeddings using BGE

#### 48 Continental Specialized Endpoints
- `/route-optimization` - Optimize Tesla road trip routes
- `/charging-strategy` - Get charging recommendations
- `/travel-highlights` - Discover points of interest
- `/environmental-impact` - Analyze trip environmental impact

### 4. Using the AI Features

Once deployed, the AI Worker will be available at your worker URL. The frontend can make requests to these endpoints for intelligent features.

Example usage:
```javascript
// Route optimization
const response = await fetch('https://your-ai-worker.workers.dev/route-optimization', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    waypoints: [...],
    constraints: {...},
    vehicleData: {...}
  })
});
```

### 5. Important Notes

- The Workers AI token is different from the Cloudflare API token
- This token specifically enables AI model usage in Workers
- The AI Worker uses Cloudflare's built-in AI models (no external API needed)
- Keep this token secure and never commit it to version control

## Troubleshooting

If the AI Worker deployment fails:
1. Verify the `WORKERS_AI_TOKEN` secret is set in GitHub
2. Check that the token is valid and has proper permissions
3. Review the GitHub Actions logs for specific error messages

## Next Steps

With the Workers AI token configured:
1. The AI Worker will deploy automatically on push
2. AI features will be available in the application
3. You can test the endpoints using the examples above
