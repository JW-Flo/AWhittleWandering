/**
 * SyncServiceDurableObject
 * 
 * A durable object that maintains WebSocket connections for real-time synchronization
 * between different parts of the 48 Continental USA system including:
 * - Web dashboard
 * - iOS app
 * - Mobile app
 * - Edge workers
 * - AI agents
 */

import { DurableObjectState, WebSocketPair, CloudflareResponseInit, CloudflareWebSocket } from './cloudflare-types';

export interface MessagePayload {
  type: string;
  payload: unknown;
  timestamp: number;
  source: string;
  hierarchyLevel?: string; // CEO, SLT, DeptHead, Manager, Worker
  department?: string; // Operations, Infrastructure, UX, Security
  targetHierarchy?: string; // For targeted messages to specific hierarchy levels
  targetDepartment?: string; // For targeted messages to specific departments
  [key: string]: unknown;
}

export interface AgentMetadata {
  id: string;
  name?: string;
  hierarchyLevel: string; // CEO, SLT, DeptHead, Manager, Worker
  department?: string; // Operations, Infrastructure, UX, Security
  role?: string; // Specific role within department
  capabilities?: string[]; // List of agent capabilities
  status: 'active' | 'idle' | 'error';
  lastUpdated: number;
}

export interface ResourceLock {
  resourcePath: string;
  lockId: string;
  agentId: string;
  acquired: number;
  expiresAt: number;
  description?: string;
}

export interface AgentTask {
  taskId: string;
  agentId: string;
  description: string;
  resources: string[]; // Resources being accessed/modified
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  priority: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface Session {
  webSocket: CloudflareWebSocket;
  id: string;
  clientType: string;
  hierarchyLevel?: string; // CEO, SLT, DeptHead, Manager, Worker
  department?: string; // Operations, Infrastructure, UX, Security
  metadata: Record<string, unknown>;
  lastActivity: number;
}

interface StoredMessage {
  payload: MessagePayload;
  timestamp: number;
}

interface AgentRegistry {
  agents: Map<string, AgentMetadata>;
  resourceLocks: Map<string, ResourceLock>;
  tasks: Map<string, AgentTask>;
}

/**
 * SyncServiceDurableObject manages real-time communication across the 48 Continental platform
 * Features:
 * - WebSocket connection management
 * - Message broadcasting to connected clients
 * - Client type filtering
 * - Message history for new connections
 * - Heartbeat and connection monitoring
 */
export class SyncServiceDurableObject {
  private sessions: Map<string, Session> = new Map();
  private messageHistory: StoredMessage[] = [];
  private readonly historyLimit = 100;
  private readonly state: DurableObjectState;
  private readonly env: unknown;
  private heartbeatInterval: number | null = null;
  
  // Agent coordination properties
  private agentRegistry: AgentRegistry = {
    agents: new Map<string, AgentMetadata>(),
    resourceLocks: new Map<string, ResourceLock>(),
    tasks: new Map<string, AgentTask>()
  };
  private readonly lockExpirationTime = 5 * 60 * 1000; // 5 minutes default lock expiration
  
  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
    this.env = env;
    
    // Set up regular session cleanup
    this.heartbeatInterval = setInterval(() => this.performHeartbeat(), 60000) as unknown as number;
  }
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket') {
      const clientType = url.searchParams.get('clientType') || 'unknown';
      const clientId = url.searchParams.get('clientId') || crypto.randomUUID();
      const hierarchyLevel = url.searchParams.get('hierarchyLevel') || undefined;
      const department = url.searchParams.get('department') || undefined;
      
      // Create the WebSocket pair
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      
      // Accept the WebSocket connection
      server.accept();
      
      // Set up event handlers for the WebSocket
      server.addEventListener('message', async (event) => {
        try {
          await this.handleMessage(clientId, server, event);
        } catch (error) {
          console.error('Error handling message:', error);
          server.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Failed to process message' },
            timestamp: Date.now()
          }));
        }
      });
      
      server.addEventListener('close', () => this.handleClose(clientId));
      server.addEventListener('error', () => this.handleClose(clientId));
      
      // Store the session
      this.sessions.set(clientId, {
        webSocket: server,
        id: clientId,
        clientType,
        hierarchyLevel,
        department,
        metadata: {},
        lastActivity: Date.now()
      });
      
      // Send recent message history to the new client
      const recentMessages = this.messageHistory
        .slice(-20) // Last 20 messages
        .map(msg => JSON.stringify(msg.payload));
      
      if (recentMessages.length > 0) {
        server.send(JSON.stringify({
          type: 'history',
          payload: { messages: recentMessages },
          timestamp: Date.now(),
          source: 'system'
        }));
      }
      
      // Send welcome message
      server.send(JSON.stringify({
        type: 'connected',
        payload: {
          sessionId: clientId,
          activeClients: this.getClientCount(),
          clientTypes: this.getClientTypes()
        },
        timestamp: Date.now(),
        source: 'system'
      }));
      
      // Broadcast that a new client has connected
      this.broadcast({
        type: 'client_connected',
        payload: {
          clientId,
          clientType,
          activeClients: this.getClientCount()
        },
        timestamp: Date.now(),
        source: 'system'
      }, clientId); // Don't send to the client that just connected
      
      return new Response(null, {
        status: 101,
        webSocket: client
      } as CloudflareResponseInit);
    }
    
    // Agent Registry API
    if (url.pathname === '/agent-registry' && request.method === 'POST') {
      try {
        const data = await request.json() as { agent: AgentMetadata };
        
        if (!data.agent || !data.agent.id || !data.agent.hierarchyLevel) {
          return new Response('Invalid agent data', { status: 400 });
        }
        
        // Register or update agent
        data.agent.lastUpdated = Date.now();
        this.agentRegistry.agents.set(data.agent.id, data.agent);
        
        // Broadcast agent registration to interested parties
        this.broadcast({
          type: 'agent_registered',
          payload: data.agent,
          timestamp: Date.now(),
          source: 'system',
          hierarchyLevel: 'SLT' // Only SLT and above care about registrations
        }, undefined, undefined, (session) => 
          session.hierarchyLevel === 'CEO' || 
          session.hierarchyLevel === 'SLT'
        );
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to register agent' }), {
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/agent-registry' && request.method === 'GET') {
      const agentId = url.searchParams.get('id');
      
      if (agentId) {
        // Get specific agent
        const agent = this.agentRegistry.agents.get(agentId);
        if (!agent) {
          return new Response(JSON.stringify({ error: 'Agent not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(agent), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Get all agents
        const agents = Array.from(this.agentRegistry.agents.values());
        return new Response(JSON.stringify({ agents }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Resource management API
    if (url.pathname === '/resources' && request.method === 'POST') {
      try {
        const { action, resource, agentId, description } = await request.json() as { 
          action: 'lock' | 'unlock', 
          resource: string,
          agentId: string,
          description?: string
        };
        
        if (!action || !resource || !agentId) {
          return new Response('Missing required fields', { status: 400 });
        }
        
        if (action === 'lock') {
          // Check if resource is already locked
          const existingLock = this.agentRegistry.resourceLocks.get(resource);
          if (existingLock && existingLock.expiresAt > Date.now()) {
            // Resource is locked by someone else
            if (existingLock.agentId !== agentId) {
              return new Response(JSON.stringify({
                success: false,
                error: 'Resource already locked',
                lockInfo: existingLock
              }), {
                status: 409, // Conflict
                headers: { 'Content-Type': 'application/json' }
              });
            }
            // Agent already holds this lock, extend it
          }
          
          // Create or renew lock
          const lockId = crypto.randomUUID();
          const now = Date.now();
          const lock: ResourceLock = {
            resourcePath: resource,
            lockId,
            agentId,
            acquired: now,
            expiresAt: now + this.lockExpirationTime,
            description
          };
          
          this.agentRegistry.resourceLocks.set(resource, lock);
          
          // Broadcast lock acquisition
          this.broadcast({
            type: 'resource_locked',
            payload: { 
              resource,
              agentId,
              lockId
            },
            timestamp: now,
            source: 'system'
          });
          
          return new Response(JSON.stringify({ 
            success: true, 
            lock 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else if (action === 'unlock') {
          // Check if resource is locked by this agent
          const existingLock = this.agentRegistry.resourceLocks.get(resource);
          if (!existingLock) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Resource not locked'
            }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          if (existingLock.agentId !== agentId) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Resource locked by another agent',
              lockInfo: existingLock
            }), {
              status: 403, // Forbidden
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Release the lock
          this.agentRegistry.resourceLocks.delete(resource);
          
          // Broadcast lock release
          this.broadcast({
            type: 'resource_unlocked',
            payload: { 
              resource,
              agentId,
              lockId: existingLock.lockId
            },
            timestamp: Date.now(),
            source: 'system'
          });
          
          return new Response(JSON.stringify({ 
            success: true 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response('Invalid action', { status: 400 });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to manage resource' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/resources' && request.method === 'GET') {
      const resource = url.searchParams.get('resource');
      
      if (resource) {
        // Get specific resource lock
        const lock = this.agentRegistry.resourceLocks.get(resource);
        
        return new Response(JSON.stringify({
          locked: !!lock && lock.expiresAt > Date.now(),
          lockInfo: lock || null
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Get all locked resources
        const locks = Array.from(this.agentRegistry.resourceLocks.entries())
          .filter(([, lock]) => lock.expiresAt > Date.now())
          .map(([resource, lock]) => ({ resource, lock }));
          
        return new Response(JSON.stringify({ locks }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Task management API
    if (url.pathname === '/tasks' && request.method === 'POST') {
      try {
        const taskData = await request.json() as {
          task: Omit<AgentTask, 'taskId' | 'createdAt' | 'updatedAt'> & { taskId?: string }
        };
        
        if (!taskData.task || !taskData.task.agentId || !taskData.task.description) {
          return new Response('Invalid task data', { status: 400 });
        }
        
        const now = Date.now();
        const task: AgentTask = {
          taskId: taskData.task.taskId || crypto.randomUUID(),
          agentId: taskData.task.agentId,
          description: taskData.task.description,
          resources: taskData.task.resources || [],
          status: taskData.task.status || 'pending',
          priority: taskData.task.priority || 1,
          createdAt: now,
          updatedAt: now,
          metadata: taskData.task.metadata || {}
        };
        
        // Store the task
        this.agentRegistry.tasks.set(task.taskId, task);
        
        // Broadcast task creation/update
        this.broadcast({
          type: 'task_updated',
          payload: task,
          timestamp: now,
          source: 'system'
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          task 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create/update task' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/tasks' && request.method === 'GET') {
      const taskId = url.searchParams.get('id');
      const agentId = url.searchParams.get('agentId');
      const status = url.searchParams.get('status');
      
      if (taskId) {
        // Get specific task
        const task = this.agentRegistry.tasks.get(taskId);
        if (!task) {
          return new Response(JSON.stringify({ error: 'Task not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(task), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Filter tasks
        let tasks = Array.from(this.agentRegistry.tasks.values());
        
        if (agentId) {
          tasks = tasks.filter(task => task.agentId === agentId);
        }
        
        if (status) {
          tasks = tasks.filter(task => task.status === status);
        }
        
        return new Response(JSON.stringify({ tasks }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Directive API
    if (url.pathname === '/directives' && request.method === 'POST') {
      try {
        const { directive, targetHierarchy, targetDepartment } = await request.json() as {
          directive: {
            type: string;
            content: unknown;
            priority: number;
          };
          targetHierarchy?: string;
          targetDepartment?: string;
        };
        
        if (!directive || !directive.type || !directive.content) {
          return new Response('Invalid directive data', { status: 400 });
        }
        
        // Create directive message
        const directiveMessage: MessagePayload = {
          type: 'hierarchical_directive',
          payload: directive,
          timestamp: Date.now(),
          source: 'system',
          targetHierarchy,
          targetDepartment
        };
        
        // Broadcast the directive to matching sessions
        this.broadcast(directiveMessage, undefined, undefined, (session) => {
          // Filter by hierarchy if specified
          if (targetHierarchy && session.hierarchyLevel !== targetHierarchy) {
            return false;
          }
          
          // Filter by department if specified
          if (targetDepartment && session.department !== targetDepartment) {
            return false;
          }
          
          return true;
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          directive: directiveMessage 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to issue directive' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Escalation API
    if (url.pathname === '/escalations' && request.method === 'POST') {
      try {
        const { escalation, sourceAgentId, targetHierarchy } = await request.json() as {
          escalation: {
            type: string;
            content: unknown;
            priority: number;
          };
          sourceAgentId: string;
          targetHierarchy: string;
        };
        
        if (!escalation || !escalation.type || !escalation.content || !sourceAgentId || !targetHierarchy) {
          return new Response('Invalid escalation data', { status: 400 });
        }
        
        // Get source agent info
        const sourceAgent = this.agentRegistry.agents.get(sourceAgentId);
        
        // Create escalation message
        const escalationMessage: MessagePayload = {
          type: 'escalation',
          payload: {
            ...escalation,
            sourceAgent: sourceAgent || { id: sourceAgentId }
          },
          timestamp: Date.now(),
          source: sourceAgentId,
          targetHierarchy
        };
        
        // Broadcast the escalation to matching sessions
        this.broadcast(escalationMessage, undefined, undefined, (session) => {
          return session.hierarchyLevel === targetHierarchy;
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          escalation: escalationMessage 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to create escalation' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // API endpoints
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      try {
        const message = await request.json() as MessagePayload;
        if (!message.type || !message.payload) {
          return new Response('Invalid message format', { status: 400 });
        }
        
        // Add system source if not specified
        if (!message.source) {
          message.source = 'api';
        }
        
        // Add timestamp if not specified
        if (!message.timestamp) {
          message.timestamp = Date.now();
        }
        
        // Broadcast to all connected clients
        const urlTargetType = url.searchParams.get('clientType') || undefined;
        const urlExcludeId = url.searchParams.get('excludeId') || undefined;
        this.broadcast(message, urlExcludeId, urlTargetType);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to broadcast message' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Stats endpoint
    if (url.pathname === '/stats' && request.method === 'GET') {
      const stats = {
        activeConnections: this.sessions.size,
        clientTypes: this.getClientTypes(),
        messageHistorySize: this.messageHistory.length,
        lastMessageTimestamp: this.messageHistory.length > 0 
          ? this.messageHistory[this.messageHistory.length - 1].timestamp
          : null
      };
      
      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  }
  
  private async handleMessage(clientId: string, webSocket: CloudflareWebSocket, event: MessageEvent): Promise<void> {
    // Update last activity timestamp
    const session = this.sessions.get(clientId);
    if (session) {
      session.lastActivity = Date.now();
    } else {
      // Session not found, close the connection
      webSocket.close(1011, 'Session not found');
      return;
    }
    
    // Parse the message
    let message: MessagePayload;
    try {
      message = JSON.parse(event.data as string) as MessagePayload;
    } catch (error) {
      webSocket.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Invalid message format' },
        timestamp: Date.now(),
        source: 'system'
      }));
      return;
    }
    
    // Handle message types
    switch (message.type) {
      case 'ping':
        // Respond with a pong
        webSocket.send(JSON.stringify({
          type: 'pong',
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
          source: 'system'
        }));
        break;
        
      case 'register_metadata': {
        // Update client metadata
        if (typeof message.payload === 'object' && message.payload !== null) {
          session.metadata = {
            ...session.metadata,
            ...message.payload
          };
        }
        break;
      }
        
      case 'broadcast': {
        // Broadcast message to all clients
        if (!message.source) {
          message.source = clientId;
        }
        
        // Store message in history
        this.addToMessageHistory(message);
        
        // Broadcast to specified target or all clients
        const msgTargetType = typeof message.targetType === 'string' ? message.targetType : undefined;
        const excludeSelf = message.excludeSelf === true;
        this.broadcast(message, excludeSelf ? clientId : undefined, msgTargetType);
        break;
      }
        
      default: {
        // For any other message type, broadcast it to all clients
        if (!message.source) {
          message.source = clientId;
        }
        
        // Store message in history
        this.addToMessageHistory(message);
        
        // Check if the message has a specific target
        const msgTargetType = typeof message.targetType === 'string' ? message.targetType : undefined;
        const targetId = typeof message.targetId === 'string' ? message.targetId : undefined;
        
        if (targetId) {
          // Send to specific client
          this.sendToClient(targetId, message);
        } else {
          // Broadcast to all or by type
          const excludeSelf = message.excludeSelf === true;
          this.broadcast(message, excludeSelf ? clientId : undefined, msgTargetType);
        }
        break;
      }
    }
  }
  
  private handleClose(clientId: string): void {
    const session = this.sessions.get(clientId);
    if (session) {
      // Remove the session
      this.sessions.delete(clientId);
      
      // Broadcast that a client has disconnected
      this.broadcast({
        type: 'client_disconnected',
        payload: {
          clientId,
          clientType: session.clientType,
          activeClients: this.getClientCount()
        },
        timestamp: Date.now(),
        source: 'system'
      });
    }
  }
  
  private addToMessageHistory(message: MessagePayload): void {
    this.messageHistory.push({
      payload: message,
      timestamp: Date.now()
    });
    
    // Trim history if it exceeds the limit
    if (this.messageHistory.length > this.historyLimit) {
      this.messageHistory = this.messageHistory.slice(-this.historyLimit);
    }
  }
  
  private sendToClient(clientId: string, message: MessagePayload): boolean {
    const session = this.sessions.get(clientId);
    if (session) {
      try {
        session.webSocket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        return false;
      }
    }
    return false;
  }
  
  private broadcast(
    message: MessagePayload, 
    excludeId?: string, 
    targetType?: string,
    customFilter?: (session: Session) => boolean
  ): void {
    // Serialize the message once
    const serializedMessage = JSON.stringify(message);
    
    // Broadcast to all matching clients
    for (const [id, session] of this.sessions.entries()) {
      // Skip excluded client
      if (excludeId && id === excludeId) continue;
      
      // Filter by client type if specified
      if (targetType && session.clientType !== targetType) continue;
      
      // Apply custom filter if provided
      if (customFilter && !customFilter(session)) continue;
      
      // Handle hierarchical routing
      if (message.targetHierarchy && session.hierarchyLevel !== message.targetHierarchy) continue;
      
      // Handle department routing
      if (message.targetDepartment && session.department !== message.targetDepartment) continue;
      
      try {
        session.webSocket.send(serializedMessage);
      } catch (error) {
        console.error(`Error broadcasting to client ${id}:`, error);
        // Don't remove the client here, let the heartbeat handle it
      }
    }
  }
  
  /**
   * Clean up expired resource locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    
    for (const [resource, lock] of this.agentRegistry.resourceLocks.entries()) {
      if (lock.expiresAt <= now) {
        // Lock has expired, remove it
        this.agentRegistry.resourceLocks.delete(resource);
        
        // Broadcast lock expiration
        this.broadcast({
          type: 'resource_lock_expired',
          payload: { 
            resource,
            agentId: lock.agentId,
            lockId: lock.lockId
          },
          timestamp: now,
          source: 'system'
        });
      }
    }
  }
  
  private getClientCount(): number {
    return this.sessions.size;
  }
  
  private getClientTypes(): Record<string, number> {
    const types: Record<string, number> = {};
    
    for (const session of this.sessions.values()) {
      types[session.clientType] = (types[session.clientType] || 0) + 1;
    }
    
    return types;
  }
  
  private performHeartbeat(): void {
    const now = Date.now();
    const timeoutThreshold = 120000; // 2 minutes
    
    // Clean up expired resource locks
    this.cleanupExpiredLocks();
    
    // Check each session for activity
    for (const [id, session] of this.sessions.entries()) {
      try {
        // Check if the session has timed out
        if (now - session.lastActivity > timeoutThreshold) {
          // Close the connection
          try {
            session.webSocket.close(1000, 'Session timeout');
          } catch (error) {
            // Ignore errors when closing
          }
          
          // Remove the session
          this.sessions.delete(id);
          
          // Broadcast that a client has disconnected
          this.broadcast({
            type: 'client_disconnected',
            payload: {
              clientId: id,
              clientType: session.clientType,
              reason: 'timeout',
              activeClients: this.getClientCount()
            },
            timestamp: now,
            source: 'system'
          });
          
          continue;
        }
        
        // Send a ping to active sessions every heartbeat
        session.webSocket.send(JSON.stringify({
          type: 'heartbeat',
          payload: { timestamp: now },
          timestamp: now,
          source: 'system'
        }));
      } catch (error) {
        // WebSocket is probably closed, remove the session
        this.sessions.delete(id);
      }
    }
  }
}
