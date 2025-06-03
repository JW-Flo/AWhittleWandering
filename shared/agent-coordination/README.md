# Agent Coordination System

This module provides a robust coordination system for AI agents in the 48 Continental USA platform, enabling reliable orchestration of multi-agent systems with built-in synchronization, resource management, and hierarchical communication.

## Key Features

- **Agent Registry**: Register and discover agents with their capabilities, status, and hierarchical position
- **Resource Locking**: Prevent conflicts through distributed resource locking with automatic expiration
- **Task Management**: Assign, track, and update tasks across the agent ecosystem
- **Hierarchical Communication**: Issue directives and escalate issues across the agent hierarchy
- **WebSocket Synchronization**: Real-time communication between all system components

## Architecture

The Agent Coordination system is built on the SyncServiceDurableObject, which maintains persistent WebSocket connections and state across the distributed system. The service is accessible through:

1. Direct WebSocket connections for real-time updates
2. HTTP REST endpoints for management operations
3. Client SDKs (edge-worker integration, etc.)

## Usage

### Agent Registry

Register an agent to make it visible in the coordination system:

```javascript
// From edge-worker
import { registerAgent } from './syncServiceIntegration';

await registerAgent({
  id: 'agent-123',
  name: 'Route Planner',
  hierarchyLevel: 'Worker',
  department: 'Operations',
  role: 'Route Optimization',
  capabilities: ['tesla-api', 'mapbox', 'weather-analysis'],
  status: 'active'
}, env);

// Get information about agents
const allAgents = await getAgents({}, env);
const specificAgent = await getAgents({ agentId: 'agent-123' }, env);
```

### Resource Management

Prevent conflicts by locking resources during operations:

```javascript
// Lock a resource
const lockResult = await lockResource({
  resource: '/data/routes/current-route.json',
  agentId: 'agent-123',
  description: 'Updating route with charging stops'
}, env);

try {
  // Perform operations on the resource
  // ...

  // Release the lock when done
  await unlockResource({
    resource: '/data/routes/current-route.json',
    agentId: 'agent-123'
  }, env);
} catch (error) {
  // Still release the lock in case of error
  await unlockResource({
    resource: '/data/routes/current-route.json',
    agentId: 'agent-123'
  }, env);
  throw error;
}

// Check resource lock status
const lockInfo = await getResourceLocks({ 
  resource: '/data/routes/current-route.json'
}, env);
```

### Task Management

Create, update, and track tasks across the agent system:

```javascript
// Create a new task
await createOrUpdateTask({
  agentId: 'agent-123',
  description: 'Optimize route for maximum efficiency',
  resources: ['/data/routes/current-route.json'],
  status: 'pending',
  priority: 2,
  metadata: {
    estimatedDuration: 120000, // 2 minutes
    requiredBattery: 45 // percent
  }
}, env);

// Update task status
await createOrUpdateTask({
  taskId: 'existing-task-id',
  agentId: 'agent-123',
  description: 'Optimize route for maximum efficiency',
  resources: ['/data/routes/current-route.json'],
  status: 'in-progress',
  priority: 2
}, env);

// Get tasks
const agentTasks = await getTasks({ agentId: 'agent-123' }, env);
const pendingTasks = await getTasks({ status: 'pending' }, env);
const specificTask = await getTasks({ taskId: 'task-123' }, env);
```

### Hierarchical Communication

Enable communication across the agent hierarchy:

```javascript
// Issue a directive to agents
await issueDirective({
  directive: {
    type: 'system_update',
    content: {
      message: 'New charging stations available',
      action: 'update_charging_data'
    },
    priority: 1
  },
  targetHierarchy: 'Worker',
  targetDepartment: 'Operations'
}, env);

// Escalate an issue to a higher level
await createEscalation({
  escalation: {
    type: 'technical_issue',
    content: {
      message: 'Unable to connect to Tesla API',
      attempts: 3,
      lastError: 'Timeout after 5000ms'
    },
    priority: 2
  },
  sourceAgentId: 'agent-123',
  targetHierarchy: 'SLT'
}, env);
```

### WebSocket Connections

To receive real-time updates, connect via WebSocket:

```javascript
const ws = new WebSocket(`wss://your-worker.com/sync-service?clientType=agent&clientId=agent-123&hierarchyLevel=Worker&department=Operations`);

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  
  // Handle different message types
  switch (message.type) {
    case 'resource_locked':
      // Handle resource lock notification
      break;
    case 'task_updated':
      // Handle task update notification
      break;
    case 'hierarchical_directive':
      // Handle directive from higher-level agent
      break;
    case 'escalation':
      // Handle escalated issue
      break;
  }
});

// Send messages
ws.send(JSON.stringify({
  type: 'broadcast',
  payload: { /* your message here */ },
  timestamp: Date.now(),
  targetType: 'dashboard' // Optional target client type
}));
```

## Resource Lock Expiration

Resource locks automatically expire after 5 minutes to prevent deadlocks. The system automatically cleans up expired locks during its heartbeat checks. If you need a lock for longer operations, you should periodically renew it by acquiring it again with the same parameters.

## Agent Hierarchy Levels

The system supports the following hierarchy levels:

- **CEO**: Top-level strategic decisions and oversight
- **SLT**: Senior Leadership Team for high-level coordination
- **DeptHead**: Department leadership for specialized domains
- **Manager**: Tactical oversight of multiple worker agents
- **Worker**: Specialized agents performing specific tasks

## Error Handling

All API functions throw descriptive errors when operations fail. Always implement proper error handling:

```javascript
try {
  await lockResource({ 
    resource: '/data/tesla/vehicle-state.json',
    agentId: 'agent-123'
  }, env);
} catch (error) {
  console.error('Failed to lock resource:', error.message);
  // Handle the error appropriately
}
```

## Best Practices

1. **Always Release Locks**: Use try/finally blocks to ensure locks are released
2. **Respect Hierarchy**: Only escalate issues when they truly need attention from higher levels
3. **Transient Resources**: For temporary data, use short lock expirations
4. **Agent Discovery**: Regularly check the agent registry for new capabilities
5. **Heartbeat**: Keep agent registry entries up-to-date with regular status updates
6. **Task Priorities**: Use consistent priority levels (1-5, where 1 is highest)
7. **Metadata**: Include useful context in task and resource metadata
8. **Targeted Communication**: Filter WebSocket messages to only relevant receivers

## Integration Points

The Agent Coordination System integrates with:

- **Edge Worker**: For API access and integration with Cloudflare Workers
- **iOS Client**: For mobile agent orchestration and status visualization
- **Mapbox Module**: For coordinating map resource access
- **Tesla API Module**: For vehicle command synchronization
- **Mission Control**: For high-level directive distribution

## Security Considerations

- All resource locks are tied to specific agent IDs
- Hierarchical operations require appropriate access levels
- Resource locks auto-expire to prevent system-wide deadlocks
- Agents should only access resources they explicitly require

## Future Enhancements

- **Distributed Transactions**: Atomic operations across multiple resources
- **Agent Delegation**: Ability to transfer tasks between agents
- **Enhanced Analytics**: Detailed telemetry on resource usage patterns
- **Conflict Resolution**: Automatic resolution of competing resource requests

## Related Documentation

- [Agent Architecture](../../docs/agent-architecture.md)
- [Deployment Strategy](../../docs/DEPLOYMENT_STRATEGY.md)
- [Agent Orchestration Rules](../../docs/AGENT_ORCHESTRATION_RULES.md)
