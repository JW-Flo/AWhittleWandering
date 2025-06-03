// Simple event-based communication system for AI agents coordination

class AgentCommunication {
  constructor() {
    this.listeners = {};
  }

  // Register a listener for a specific event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Remove a listener for a specific event
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Emit an event with data to all listeners
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error('AgentCommunication listener error:', err);
      }
    });
  }
}

// Singleton instance for shared communication
const agentCommunication = new AgentCommunication();

export default agentCommunication;

/*
Usage:

// Agent A
import agentCommunication from 'shared/agent-coordination/agentCommunication';

agentCommunication.on('taskRequest', (data) => {
  console.log('Received task request:', data);
  // Process or respond
});

agentCommunication.emit('taskRequest', { taskId: 123, details: 'Do X' });

// Agent B
import agentCommunication from 'shared/agent-coordination/agentCommunication';

agentCommunication.on('taskRequest', (data) => {
  // Handle task request
});
*/
