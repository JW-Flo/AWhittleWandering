import { handleSequentialThinking } from './sequential-thinking';
import { handleFileSystem } from './filesystem';
import { handleBrowserTools } from './browser-tools';
import type { WorkerEnvironment } from '../types/cloudflare';

export interface McpServerRequest {
  serverId: string;
  method: string;
  params: Record<string, unknown>;
  id?: string;
}

export interface McpServerResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id?: string;
}

export interface McpServerHandler {
  (request: McpServerRequest, env: Env): Promise<McpServerResponse>;
}

export interface Env extends WorkerEnvironment {
  MCP_API_KEY: string;
}

const serverHandlers: Record<string, McpServerHandler> = {
  'github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking': handleSequentialThinking,
  'github.com/modelcontextprotocol/servers/tree/main/src/filesystem': handleFileSystem,
  'github.com/AgentDeskAI/browser-tools-mcp': handleBrowserTools
};

export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify API key
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.split('Bearer ')[1];
  
  if (!apiKey || apiKey !== env.MCP_API_KEY) {
    return new Response(JSON.stringify({
      error: {
        code: 401,
        message: 'Unauthorized: Invalid or missing API key'
      }
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  try {
    const mcpRequest = await request.json() as McpServerRequest;
    const { serverId } = mcpRequest;
    
    // Get the appropriate handler for the requested server
    const handler = serverHandlers[serverId];
    
    if (!handler) {
      return new Response(JSON.stringify({
        error: {
          code: 404,
          message: `Server not found: ${serverId}`
        },
        id: mcpRequest.id
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Process the request with the server handler
    const response = await handler(mcpRequest, env);
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('MCP request error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 500,
        message: 'Internal server error'
      }
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
