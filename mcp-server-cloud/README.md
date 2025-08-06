# Tesla Road Trip Tracker - Cloud MCP Server

A cloud-hosted Model Context Protocol (MCP) server that provides AI assistants with access to real-time Tesla road trip data, analytics, and insights from the "A Whittle Wandering" cross-country adventure.

## 🚀 Features

- **Real-time Tesla Data**: Current battery, location, charging status
- **Trip Analytics**: Comprehensive trip statistics and progress tracking  
- **Drive History**: Search and analyze historical drives with filtering
- **Charging Analysis**: Cost analysis and charging pattern insights
- **Efficiency Metrics**: Performance analysis by state, time, and route
- **Live Location**: Detailed GPS positioning with mapping integration
- **Predictive Analytics**: Trip completion forecasts and milestone predictions
- **System Health**: API connectivity and data freshness monitoring

## 🌐 Cloud Deployment

This MCP server is deployed on Cloudflare Workers for global low-latency access:

- **Production**: `https://mcp.awhittlewandering.com/`
- **Development**: `https://tesla-roadtrip-mcp-server-dev.{worker}.workers.dev/`

## 📡 API Endpoints

### MCP Protocol
- `POST /mcp` - Standard MCP JSON-RPC 2.0 protocol endpoint
- `GET /tools` - List all available tools
- `POST /call` - Execute tool with simplified HTTP API

### Health & Info
- `GET /` - Server information and capabilities
- `GET /health` - System health and API status

## 🛠️ Available Tools

### Core Tesla Data
- `get_current_tesla_status` - Live vehicle status
- `get_trip_overview` - Overall trip statistics  
- `get_live_location` - Detailed GPS positioning

### Historical Analysis
- `search_drives` - Filter drives by date, state, distance
- `get_charging_history` - Charging sessions and costs
- `analyze_trip_efficiency` - Performance by group

### Predictions & Health
- `calculate_trip_predictions` - Completion forecasts
- `get_system_health` - API connectivity status

## 🔧 Usage Examples

### HTTP API (Simplified)
```bash
# Get current Tesla status
curl -X POST https://mcp.awhittlewandering.com/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_current_tesla_status"}'

# Search drives in California
curl -X POST https://mcp.awhittlewandering.com/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "search_drives", "arguments": {"state": "CA", "limit": 5}}'
```

### MCP Protocol (JSON-RPC 2.0)
```bash
# List available tools
curl -X POST https://mcp.awhittlewandering.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# Execute tool
curl -X POST https://mcp.awhittlewandering.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", 
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_trip_overview"
    }
  }'
```

## 🤖 ChatGPT Desktop Integration

To use with ChatGPT Desktop, add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "tesla-roadtrip": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://mcp.awhittlewandering.com/mcp",
        "-H", "Content-Type: application/json",
        "-d", "@-"
      ],
      "env": {}
    }
  }
}
```

Or use the direct HTTP API mode:
```json
{
  "mcpServers": {
    "tesla-roadtrip-http": {
      "command": "node",
      "args": ["-e", "/* HTTP bridge script */"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.awhittlewandering.com"
      }
    }
  }
}
```

## 🏗️ Development

### Local Development
```bash
npm install
npm run dev
```

### Deployment
```bash
# Deploy to staging
wrangler deploy

# Deploy to production  
npm run deploy:production
```

### Environment Variables
- `TESLA_API_BASE` - Backend API URL
- `MCP_SERVER_VERSION` - Server version
- `CORS_ORIGINS` - Allowed CORS origins

## 📊 Data Sources

- **Tesla Vehicle Data**: Via Tessie API integration
- **Trip Analytics**: Processed historical drive and charge data
- **Real-time Status**: Live vehicle telemetry and location
- **System Health**: API connectivity and data freshness monitoring

## 🔒 Security

- CORS enabled for AI dashboard access
- No authentication required (read-only public data)
- Rate limiting via Cloudflare Workers
- Secure API key handling in backend workers

## 📈 Performance

- **Global CDN**: Cloudflare Workers edge deployment
- **Low Latency**: Sub-100ms response times globally
- **High Availability**: 99.9% uptime SLA
- **Auto Scaling**: Handles traffic spikes automatically

## 📞 Support

For issues or questions:
- Check system health: `/health` endpoint
- Backend API status: Backend worker health checks
- Repository: [GitHub Issues](https://github.com/awhittlewandering/tesla-roadtrip-tracker)

## 📄 License

MIT License - See LICENSE file for details

---

**A Whittle Wandering** - Following the epic cross-country Tesla adventure through all 48 continental US states! 🇺🇸
