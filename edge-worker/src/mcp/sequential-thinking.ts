import type { McpServerRequest, McpServerResponse, Env } from './index';

interface ThoughtState {
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  branches: Array<{
    id: string;
    fromThought: number;
  }>;
  thoughtHistoryLength: number;
  history?: Array<{
    thought: string;
    thoughtNumber: number;
    isRevision?: boolean;
    revisesThought?: number;
    branchId?: string;
    branchFromThought?: number;
  }>;
}

// In-memory state for sequential thinking
// In production, this would be stored in KV or Durable Objects
const stateMap = new Map<string, ThoughtState>();

/**
 * Handle sequential thinking MCP requests
 */
export async function handleSequentialThinking(
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
          name: 'sequentialthinking',
          description: 'A detailed tool for dynamic and reflective problem-solving through thoughts.',
          inputSchema: {
            type: 'object',
            properties: {
              thought: {
                type: 'string',
                description: 'Your current thinking step'
              },
              nextThoughtNeeded: {
                type: 'boolean',
                description: 'Whether another thought step is needed'
              },
              thoughtNumber: {
                type: 'integer',
                description: 'Current thought number',
                minimum: 1
              },
              totalThoughts: {
                type: 'integer',
                description: 'Estimated total thoughts needed',
                minimum: 1
              },
              isRevision: {
                type: 'boolean',
                description: 'Whether this revises previous thinking'
              },
              revisesThought: {
                type: 'integer',
                description: 'Which thought is being reconsidered',
                minimum: 1
              },
              branchFromThought: {
                type: 'integer',
                description: 'Branching point thought number',
                minimum: 1
              },
              branchId: {
                type: 'string',
                description: 'Branch identifier'
              },
              needsMoreThoughts: {
                type: 'boolean',
                description: 'If more thoughts are needed'
              }
            },
            required: [
              'thought',
              'nextThoughtNeeded',
              'thoughtNumber',
              'totalThoughts'
            ]
          }
        }
      ]
    },
    id: request.id
  };
}

/**
 * Handle calling the sequential thinking tool
 */
async function handleCallTool(
  request: McpServerRequest,
  env: Env
): Promise<McpServerResponse> {
  if (request.params.name !== 'sequentialthinking') {
    return {
      error: {
        code: 404,
        message: `Tool not found: ${request.params.name}`
      },
      id: request.id
    };
  }

  const args = request.params.arguments;
  if (!validateSequentialThinkingArgs(args)) {
    return {
      error: {
        code: 400,
        message: 'Invalid arguments for sequential thinking'
      },
      id: request.id
    };
  }

  // Generate a session ID based on the first thought to maintain state
  // In production, we would use a proper session management system
  const sessionId = generateSessionId(args.thought);
  
  let state = stateMap.get(sessionId);
  
  if (!state || args.thoughtNumber === 1) {
    // Initialize new state for first thought or reset
    state = {
      thoughtNumber: args.thoughtNumber,
      totalThoughts: args.totalThoughts,
      nextThoughtNeeded: args.nextThoughtNeeded,
      branches: [],
      thoughtHistoryLength: 1,
      history: [{
        thought: args.thought,
        thoughtNumber: args.thoughtNumber,
        isRevision: args.isRevision,
        revisesThought: args.revisesThought,
        branchId: args.branchId,
        branchFromThought: args.branchFromThought
      }]
    };
  } else {
    // Update existing state
    state.thoughtNumber = args.thoughtNumber;
    state.totalThoughts = args.totalThoughts;
    state.nextThoughtNeeded = args.nextThoughtNeeded;
    state.thoughtHistoryLength++;
    
    // Add new thought to history
    if (state.history) {
      state.history.push({
        thought: args.thought,
        thoughtNumber: args.thoughtNumber,
        isRevision: args.isRevision,
        revisesThought: args.revisesThought,
        branchId: args.branchId,
        branchFromThought: args.branchFromThought
      });
    }
    
    // Track branch information
    if (args.branchId && args.branchFromThought) {
      const branchExists = state.branches.some(b => b.id === args.branchId);
      if (!branchExists) {
        state.branches.push({
          id: args.branchId,
          fromThought: args.branchFromThought
        });
      }
    }
  }
  
  // Save state
  stateMap.set(sessionId, state);
  
  // For privacy reasons, don't send full thought history back
  // Just send metadata about the thinking process
  const responseState = { ...state };
  delete responseState.history;
  
  return {
    result: responseState,
    id: request.id
  };
}

/**
 * Validate sequential thinking arguments
 */
function validateSequentialThinkingArgs(args: any): boolean {
  if (!args) return false;
  
  // Check required fields
  if (typeof args.thought !== 'string' ||
      typeof args.nextThoughtNeeded !== 'boolean' ||
      typeof args.thoughtNumber !== 'number' ||
      typeof args.totalThoughts !== 'number') {
    return false;
  }
  
  // Validate numeric fields
  if (args.thoughtNumber < 1 || args.totalThoughts < 1) {
    return false;
  }
  
  // Validate optional fields
  if (args.isRevision !== undefined && typeof args.isRevision !== 'boolean') {
    return false;
  }
  
  if (args.revisesThought !== undefined && 
      (typeof args.revisesThought !== 'number' || args.revisesThought < 1)) {
    return false;
  }
  
  if (args.branchFromThought !== undefined && 
      (typeof args.branchFromThought !== 'number' || args.branchFromThought < 1)) {
    return false;
  }
  
  if (args.branchId !== undefined && typeof args.branchId !== 'string') {
    return false;
  }
  
  if (args.needsMoreThoughts !== undefined && typeof args.needsMoreThoughts !== 'boolean') {
    return false;
  }
  
  return true;
}

/**
 * Generate a session ID from a thought
 * In production, we would use a more robust session management system
 */
function generateSessionId(thought: string): string {
  // Simple hash function for demo purposes
  let hash = 0;
  for (let i = 0; i < thought.length; i++) {
    const char = thought.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `session_${Math.abs(hash)}`;
}
