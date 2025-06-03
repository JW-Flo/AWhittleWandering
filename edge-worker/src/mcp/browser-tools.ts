import type { McpServerRequest, McpServerResponse, Env } from './index';

// Simulated browser session state
interface BrowserSession {
  logs: Array<{
    level: 'log' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
  }>;
  networkRequests: Array<{
    url: string;
    method: string;
    status?: number;
    type: string;
    size?: number;
    time?: number;
    isError: boolean;
    errorText?: string;
    timestamp: number;
  }>;
  selectedElement?: {
    tag: string;
    attributes: Record<string, string>;
    innerHTML: string;
    xpath: string;
  };
  auditResults?: {
    accessibility?: Record<string, any>;
    performance?: Record<string, any>;
    seo?: Record<string, any>;
    bestPractices?: Record<string, any>;
    nextjs?: Record<string, any>;
  };
}

// In-memory storage for browser sessions
// In production, this would be stored in KV or Durable Objects
const browserSessions = new Map<string, BrowserSession>();

// Default session ID (in production we would use proper session management)
const DEFAULT_SESSION_ID = 'default-browser-session';

/**
 * Handle browser tools MCP requests
 */
export async function handleBrowserTools(
  request: McpServerRequest,
  env: Env
): Promise<McpServerResponse> {
  switch (request.method) {
    case 'listTools':
      return handleListTools(request);
    case 'callTool':
      return handleCallTool(request, env);
    default:
      return {
        error: {
          code: 404,
          message: `Method not found: ${request.method}`
        },
        id: request.id
      };
  }
}

/**
 * Handle listing available tools
 */
function handleListTools(request: McpServerRequest): McpServerResponse {
  return {
    result: {
      tools: [
        {
          name: 'getConsoleLogs',
          description: 'Check our browser logs',
          inputSchema: {
            type: 'object'
          }
        },
        {
          name: 'getConsoleErrors',
          description: 'Check our browsers console errors',
          inputSchema: {
            type: 'object'
          }
        },
        {
          name: 'getNetworkErrors',
          description: 'Check our network ERROR logs',
          inputSchema: {
            type: 'object'
          }
        },
        {
          name: 'getNetworkLogs',
          description: 'Check ALL our network logs',
          inputSchema: {
            type: 'object'
          }
        },
        {
          name: 'takeScreenshot',
          description: 'Take a screenshot of the current browser tab',
          inputSchema: {
            type: 'object'
          }
        },
        {
          name: 'getSelectedElement',
          description: 'Get the selected element from the browser',
          inputSchema: {
            type: 'object'
          }
        },
        {
          name: 'wipeLogs',
          description: 'Wipe all browser logs from memory',
          inputSchema: {
            type: 'object'
          }
        },
        {
          name: 'runAccessibilityAudit',
          description: 'Run an accessibility audit on the current page',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'runPerformanceAudit',
          description: 'Run a performance audit on the current page',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'runSEOAudit',
          description: 'Run an SEO audit on the current page',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'runBestPracticesAudit',
          description: 'Run a best practices audit on the current page',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        }
      ]
    },
    id: request.id
  };
}

/**
 * Handle calling a browser tool
 */
async function handleCallTool(
  request: McpServerRequest,
  env: Env
): Promise<McpServerResponse> {
  const { name } = request.params;
  
  // Get or create a browser session
  let session = browserSessions.get(DEFAULT_SESSION_ID);
  
  if (!session) {
    session = createDefaultSession();
    browserSessions.set(DEFAULT_SESSION_ID, session);
  }
  
  switch (name) {
    case 'getConsoleLogs':
      return handleGetConsoleLogs(session, request.id);
    case 'getConsoleErrors':
      return handleGetConsoleErrors(session, request.id);
    case 'getNetworkErrors':
      return handleGetNetworkErrors(session, request.id);
    case 'getNetworkLogs':
      return handleGetNetworkLogs(session, request.id);
    case 'takeScreenshot':
      return handleTakeScreenshot(request.id);
    case 'getSelectedElement':
      return handleGetSelectedElement(session, request.id);
    case 'wipeLogs':
      return handleWipeLogs(session, request.id);
    case 'runAccessibilityAudit':
      return handleRunAccessibilityAudit(session, request.id);
    case 'runPerformanceAudit':
      return handleRunPerformanceAudit(session, request.id);
    case 'runSEOAudit':
      return handleRunSEOAudit(session, request.id);
    case 'runBestPracticesAudit':
      return handleRunBestPracticesAudit(session, request.id);
    default:
      return {
        error: {
          code: 404,
          message: `Tool not found: ${name}`
        },
        id: request.id
      };
  }
}

/**
 * Create a default browser session with simulated data
 */
function createDefaultSession(): BrowserSession {
  return {
    logs: [
      {
        level: 'info',
        message: 'Page loaded successfully',
        timestamp: Date.now() - 5000
      },
      {
        level: 'log',
        message: 'Map component initialized',
        timestamp: Date.now() - 4000
      },
      {
        level: 'warn',
        message: 'Resource loading took longer than expected',
        timestamp: Date.now() - 3000
      },
      {
        level: 'error',
        message: 'Failed to load weather data: API key not configured',
        timestamp: Date.now() - 2000
      }
    ],
    networkRequests: [
      {
        url: 'https://api.example.com/weather',
        method: 'GET',
        status: 401,
        type: 'fetch',
        size: 245,
        time: 321,
        isError: true,
        errorText: 'Unauthorized',
        timestamp: Date.now() - 3500
      },
      {
        url: 'https://cdn.example.com/map-tiles/1.png',
        method: 'GET',
        status: 200,
        type: 'image',
        size: 24500,
        time: 150,
        isError: false,
        timestamp: Date.now() - 3000
      },
      {
        url: 'https://analytics.example.com/collect',
        method: 'POST',
        status: 204,
        type: 'fetch',
        size: 512,
        time: 95,
        isError: false,
        timestamp: Date.now() - 2500
      }
    ],
    selectedElement: {
      tag: 'button',
      attributes: {
        'id': 'route-recalculate',
        'class': 'btn btn-primary',
        'data-action': 'recalculate',
        'aria-label': 'Recalculate route'
      },
      innerHTML: '<span class="icon-refresh"></span> Recalculate',
      xpath: '/html/body/div[1]/main/div[3]/div[2]/button[1]'
    },
    auditResults: {
      accessibility: {
        score: 0.82,
        issues: [
          'Buttons lack sufficient contrast ratio',
          'Some images missing alt text'
        ]
      },
      performance: {
        score: 0.76,
        issues: [
          'Render-blocking resources detected',
          'Large network payloads'
        ]
      },
      seo: {
        score: 0.91,
        issues: [
          'Some meta descriptions are too short'
        ]
      },
      bestPractices: {
        score: 0.85,
        issues: [
          'Console errors found',
          'Missing cache headers on static assets'
        ]
      }
    }
  };
}

/**
 * Handle getConsoleLogs tool
 */
function handleGetConsoleLogs(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  return {
    result: session.logs,
    id: requestId
  };
}

/**
 * Handle getConsoleErrors tool
 */
function handleGetConsoleErrors(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  const errors = session.logs.filter(log => log.level === 'error');
  
  return {
    result: errors,
    id: requestId
  };
}

/**
 * Handle getNetworkErrors tool
 */
function handleGetNetworkErrors(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  const errors = session.networkRequests.filter(req => req.isError);
  
  return {
    result: errors,
    id: requestId
  };
}

/**
 * Handle getNetworkLogs tool
 */
function handleGetNetworkLogs(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  return {
    result: session.networkRequests,
    id: requestId
  };
}

/**
 * Handle takeScreenshot tool
 */
function handleTakeScreenshot(
  requestId: string | undefined
): McpServerResponse {
  // In a real implementation, this would capture a screenshot
  // For the cloud version, we simulate it with a base64 encoded placeholder
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEXd3d3u346CAAAASElEQVR42u3BMQEAAADCIPuntsROYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUoOAAFvIOuBAAAAAElFTkSuQmCC';
  
  return {
    result: {
      imageData: placeholderImage,
      timestamp: Date.now(),
      width: 800,
      height: 600
    },
    id: requestId
  };
}

/**
 * Handle getSelectedElement tool
 */
function handleGetSelectedElement(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  if (!session.selectedElement) {
    return {
      error: {
        code: 404,
        message: 'No element currently selected'
      },
      id: requestId
    };
  }
  
  return {
    result: session.selectedElement,
    id: requestId
  };
}

/**
 * Handle wipeLogs tool
 */
function handleWipeLogs(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  session.logs = [];
  session.networkRequests = [];
  
  return {
    result: {
      success: true,
      timestamp: Date.now()
    },
    id: requestId
  };
}

/**
 * Handle runAccessibilityAudit tool
 */
function handleRunAccessibilityAudit(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  const accessibilityResults = session.auditResults?.accessibility || {
    score: 0.82,
    issues: [
      'Buttons lack sufficient contrast ratio',
      'Some images missing alt text'
    ]
  };
  
  return {
    result: accessibilityResults,
    id: requestId
  };
}

/**
 * Handle runPerformanceAudit tool
 */
function handleRunPerformanceAudit(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  const performanceResults = session.auditResults?.performance || {
    score: 0.76,
    issues: [
      'Render-blocking resources detected',
      'Large network payloads'
    ]
  };
  
  return {
    result: performanceResults,
    id: requestId
  };
}

/**
 * Handle runSEOAudit tool
 */
function handleRunSEOAudit(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  const seoResults = session.auditResults?.seo || {
    score: 0.91,
    issues: [
      'Some meta descriptions are too short'
    ]
  };
  
  return {
    result: seoResults,
    id: requestId
  };
}

/**
 * Handle runBestPracticesAudit tool
 */
function handleRunBestPracticesAudit(
  session: BrowserSession,
  requestId: string | undefined
): McpServerResponse {
  const bestPracticesResults = session.auditResults?.bestPractices || {
    score: 0.85,
    issues: [
      'Console errors found',
      'Missing cache headers on static assets'
    ]
  };
  
  return {
    result: bestPracticesResults,
    id: requestId
  };
}
