// Agent Validation Script – 48 Continental MCP
const axios = require('axios');

const MCP_URL = process.env.MCP_URL || 'http://localhost:4000';

const agents = [
  { id: 'ios-client-agent', description: 'iOS Swift client' },
  { id: 'edge-worker-agent', description: 'Cloudflare Worker' },
  { id: 'cli-tools-agent', description: 'CLI utilities' },
  { id: 'shared-types-agent', description: 'Shared types/contracts' }
];

async function checkStatus() {
  try {
    const res = await axios.get(`${MCP_URL}/api/status`);
    if (res.data && res.data.status === 'ok') {
      console.log('MCP Server is running.');
      console.log('Current agent status:', res.data.agents);
      return res.data.agents;
    } else {
      throw new Error('Unexpected MCP status response');
    }
  } catch (err) {
    console.error('Failed to reach MCP server:', err.message);
    process.exit(1);
  }
}

async function validateAgents() {
  const agentStatus = await checkStatus();
  let allOperational = true;
  for (const agent of agents) {
    const status = agentStatus[agent.id];
    if (!status) {
      console.warn(`Agent "${agent.id}" (${agent.description}) has not checked in.`);
      allOperational = false;
    } else if (status.error) {
      console.error(`Agent "${agent.id}" reported error: ${status.error}`);
      allOperational = false;
    } else {
      console.log(`Agent "${agent.id}" is operational. Last seen: ${status.lastSeen}`);
    }
  }
  if (allOperational) {
    console.log('All agents are functional and operational.');
    process.exit(0);
  } else {
    console.warn('Some agents are not operational or have not checked in.');
    process.exit(2);
  }
}

validateAgents();
