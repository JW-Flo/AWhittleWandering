/* eslint-disable no-unused-vars */
import { SyncServiceDurableObject, AgentMetadata, ResourceLock, AgentTask } from '../../shared/agent-coordination/syncService';
/* eslint-enable no-unused-vars */
import { safeCompress, safeDecompress } from './utils/compression';

/* global URL, URLSearchParams, Request, Headers, Response, console */

/**
 * Maximum size in bytes for auto-compression (2MB)
 * Payloads larger than this will be automatically compressed
 */
const AUTO_COMPRESSION_THRESHOLD = 2 * 1024 * 1024;

/**
 * Process telemetry data before synchronization
 * Compresses large data payloads for efficient transmission
 * 
 * @param {object|string} data - The data to process
 * @param {object} options - Processing options
 * @param {boolean} options.forceCompress - Force compression regardless of size
 * @param {number} options.threshold - Size threshold for auto-compression
 * @returns {Promise<object>} - Processed data with compression metadata
 */
export async function processTelemetryForSync(data, options = {}) {
  try {
    const { 
      forceCompress = false, 
      threshold = AUTO_COMPRESSION_THRESHOLD 
    } = options;
    
    // Convert to string if it's an object
    const strData = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Only compress if forced or data exceeds threshold
    if (forceCompress || strData.length > threshold) {
      const result = await safeCompress(data);
      
      // Log compression stats if it was compressed
      if (result.compressed) {
        const compressionRatio = (result.originalSize / result.compressedSize).toFixed(2);
        console.log(`Compressed payload: ${result.originalSize} → ${result.compressedSize} bytes (${compressionRatio}x)`);
      }
      
      return result;
    }
    
    // Return uncompressed data with metadata
    return {
      data,
      compressed: false,
      originalSize: strData.length
    };
  } catch (error) {
    console.error('Failed to process telemetry data for sync:', error);
    
    // Fallback to uncompressed data
    return {
      data,
      compressed: false,
      originalSize: typeof data === 'object' ? JSON.stringify(data).length : data.length,
      error: error.message
    };
  }
}

/**
 * Process received telemetry data
 * Decompresses data if it was compressed
 * 
 * @param {object} payload - The payload containing data and compression metadata
 * @returns {Promise<object|string>} - Decompressed data
 */
export async function processReceivedTelemetry(payload) {
  try {
    return await safeDecompress(payload);
  } catch (error) {
    console.error('Failed to process received telemetry:', error);
    throw new Error(`Telemetry processing failed: ${error.message}`);
  }
}

/**
 * Register or update an agent in the coordination system
 * 
 * @param {AgentMetadata} agent - The agent metadata to register
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Registration result
 */
export async function registerAgent(agent, env) {
  if (!agent || !agent.id || !agent.hierarchyLevel) {
    throw new Error('Invalid agent data: id and hierarchyLevel are required');
  }
  
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const response = await obj.fetch('/agent-registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agent })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to register agent: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error registering agent:', error);
    throw error;
  }
}

/**
 * Get all registered agents or a specific agent by ID
 * 
 * @param {object} options - Options for fetching agents
 * @param {string} options.agentId - Optional ID of a specific agent to fetch
 * @param {object} env - Environment variables
 * @returns {Promise<object|array>} - Agent data
 */
export async function getAgents({ agentId } = {}, env) {
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const url = agentId ? `/agent-registry?id=${encodeURIComponent(agentId)}` : '/agent-registry';
    const response = await obj.fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get agents: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting agents:', error);
    throw error;
  }
}

/**
 * Lock a resource for exclusive access by an agent
 * 
 * @param {object} options - Resource lock options
 * @param {string} options.resource - Path or identifier of the resource to lock
 * @param {string} options.agentId - ID of the agent requesting the lock
 * @param {string} options.description - Optional description of why the resource is being locked
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Lock result
 */
export async function lockResource({ resource, agentId, description }, env) {
  if (!resource || !agentId) {
    throw new Error('Invalid lock request: resource and agentId are required');
  }
  
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const response = await obj.fetch('/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: 'lock',
        resource,
        agentId,
        description
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to lock resource: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error locking resource:', error);
    throw error;
  }
}

/**
 * Unlock a previously locked resource
 * 
 * @param {object} options - Resource unlock options
 * @param {string} options.resource - Path or identifier of the resource to unlock
 * @param {string} options.agentId - ID of the agent that holds the lock
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Unlock result
 */
export async function unlockResource({ resource, agentId }, env) {
  if (!resource || !agentId) {
    throw new Error('Invalid unlock request: resource and agentId are required');
  }
  
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const response = await obj.fetch('/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: 'unlock',
        resource,
        agentId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to unlock resource: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error unlocking resource:', error);
    throw error;
  }
}

/**
 * Get information about locked resources
 * 
 * @param {object} options - Options for fetching resource locks
 * @param {string} options.resource - Optional specific resource to check
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Resource lock information
 */
export async function getResourceLocks({ resource } = {}, env) {
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const url = resource ? `/resources?resource=${encodeURIComponent(resource)}` : '/resources';
    const response = await obj.fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get resource locks: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting resource locks:', error);
    throw error;
  }
}

/**
 * Create or update a task for an agent
 * 
 * @param {AgentTask} task - The task to create or update
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Task creation/update result
 */
export async function createOrUpdateTask(task, env) {
  if (!task || !task.agentId || !task.description) {
    throw new Error('Invalid task data: agentId and description are required');
  }
  
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const response = await obj.fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create/update task: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating/updating task:', error);
    throw error;
  }
}

/**
 * Get tasks with optional filtering
 * 
 * @param {object} options - Options for fetching tasks
 * @param {string} options.taskId - Optional ID of a specific task to fetch
 * @param {string} options.agentId - Optional filter for tasks assigned to a specific agent
 * @param {string} options.status - Optional filter for tasks with a specific status
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Task data
 */
export async function getTasks({ taskId, agentId, status } = {}, env) {
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    // Build query string based on provided filters
    const params = new URLSearchParams();
    if (taskId) params.append('id', taskId);
    if (agentId) params.append('agentId', agentId);
    if (status) params.append('status', status);
    
    const url = `/tasks${params.toString() ? '?' + params.toString() : ''}`;
    const response = await obj.fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get tasks: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

/**
 * Issue a directive to agents at specific hierarchy levels or departments
 * 
 * @param {object} options - Directive options
 * @param {object} options.directive - The directive content
 * @param {string} options.targetHierarchy - Optional hierarchy level to target
 * @param {string} options.targetDepartment - Optional department to target
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Directive issuance result
 */
export async function issueDirective({ directive, targetHierarchy, targetDepartment }, env) {
  if (!directive || !directive.type || !directive.content) {
    throw new Error('Invalid directive: type and content are required');
  }
  
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const response = await obj.fetch('/directives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        directive,
        targetHierarchy,
        targetDepartment
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to issue directive: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error issuing directive:', error);
    throw error;
  }
}

/**
 * Create an escalation to a higher hierarchy level
 * 
 * @param {object} options - Escalation options
 * @param {object} options.escalation - The escalation content
 * @param {string} options.sourceAgentId - ID of the agent creating the escalation
 * @param {string} options.targetHierarchy - Hierarchy level to escalate to
 * @param {object} env - Environment variables
 * @returns {Promise<object>} - Escalation creation result
 */
export async function createEscalation({ escalation, sourceAgentId, targetHierarchy }, env) {
  if (!escalation || !escalation.type || !escalation.content || !sourceAgentId || !targetHierarchy) {
    throw new Error('Invalid escalation: escalation details, sourceAgentId, and targetHierarchy are required');
  }
  
  try {
    const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
    const obj = env.SYNC_SERVICE_DO.get(id);
    
    const response = await obj.fetch('/escalations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        escalation,
        sourceAgentId,
        targetHierarchy
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create escalation: ${error.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating escalation:', error);
    throw error;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/sync-service')) {
      const id = env.SYNC_SERVICE_DO.idFromName('sync-service');
      const obj = env.SYNC_SERVICE_DO.get(id);
      
      // Check if we need to process request body for compression
      if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
        try {
          // Clone the request to avoid consuming the body
          const clonedRequest = request.clone();
          const data = await clonedRequest.json();
          
          // Process the data with compression
          const processedData = await processTelemetryForSync(data);
          
          // Create a new request with the processed data
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: new Headers(request.headers),
            body: JSON.stringify(processedData)
          });
          
          // Add a header to indicate compression was applied
          newRequest.headers.set('X-Compression-Applied', processedData.compressed ? 'true' : 'false');
          
          return obj.fetch(newRequest);
        } catch (error) {
          console.error('Error processing request for compression:', error);
          // Fall back to original request if processing fails
          return obj.fetch(request);
        }
      }
      
      return obj.fetch(request);
    }
    
    // Agent coordination endpoints
    
    // Agent Registry
    if (url.pathname === '/agent-coordination/agents') {
      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const result = await registerAgent(data.agent, env);
          return new Response(JSON.stringify(result), { 
            headers: { 'Content-Type': 'application/json' } 
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      } else if (request.method === 'GET') {
        try {
          const agentId = url.searchParams.get('id');
          const result = await getAgents({ agentId }, env);
          return new Response(JSON.stringify(result), { 
            headers: { 'Content-Type': 'application/json' } 
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }
    
    // Resource Locks
    if (url.pathname === '/agent-coordination/resources') {
      if (request.method === 'POST') {
        try {
          const data = await request.json();
          let result;
          
          if (data.action === 'lock') {
            result = await lockResource(data, env);
          } else if (data.action === 'unlock') {
            result = await unlockResource(data, env);
          } else {
            throw new Error('Invalid resource action: must be "lock" or "unlock"');
          }
          
          return new Response(JSON.stringify(result), { 
            headers: { 'Content-Type': 'application/json' } 
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      } else if (request.method === 'GET') {
        try {
          const resource = url.searchParams.get('resource');
          const result = await getResourceLocks({ resource }, env);
          return new Response(JSON.stringify(result), { 
            headers: { 'Content-Type': 'application/json' } 
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }
    
    // Tasks
    if (url.pathname === '/agent-coordination/tasks') {
      if (request.method === 'POST') {
        try {
          const data = await request.json();
          const result = await createOrUpdateTask(data.task, env);
          return new Response(JSON.stringify(result), { 
            headers: { 'Content-Type': 'application/json' } 
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      } else if (request.method === 'GET') {
        try {
          const taskId = url.searchParams.get('id');
          const agentId = url.searchParams.get('agentId');
          const status = url.searchParams.get('status');
          const result = await getTasks({ taskId, agentId, status }, env);
          return new Response(JSON.stringify(result), { 
            headers: { 'Content-Type': 'application/json' } 
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }
    
    // Directives
    if (url.pathname === '/agent-coordination/directives' && request.method === 'POST') {
      try {
        const data = await request.json();
        const result = await issueDirective(data, env);
        return new Response(JSON.stringify(result), { 
          headers: { 'Content-Type': 'application/json' } 
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    }
    
    // Escalations
    if (url.pathname === '/agent-coordination/escalations' && request.method === 'POST') {
      try {
        const data = await request.json();
        const result = await createEscalation(data, env);
        return new Response(JSON.stringify(result), { 
          headers: { 'Content-Type': 'application/json' } 
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    }

    // Add other route handlers here or fallback
    return new Response('Not Found', { status: 404 });
  }
};
