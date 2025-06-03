// MCP Server (Orchestrator) – 48 Continental
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// DB and buffer paths
const DB_PATH = process.env.DB_PATH || './data/mcp.sqlite';
const TELEMETRY_BUFFER_PATH = process.env.TELEMETRY_BUFFER_PATH || './data/telemetry.json';
const PORT = process.env.PORT || 4000;
const HMAC_SECRET = process.env.HMAC_SECRET || 'changeme';

const app = express();
app.use(bodyParser.json());
app.use(morgan('dev'));

// Ensure data directories exist
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(path.dirname(TELEMETRY_BUFFER_PATH), { recursive: true });

// --- In-memory task queue (to be replaced with persistent queue) ---
let taskQueue = [];
let agentStatus = {};

// --- API Endpoints ---

// Health check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    agents: agentStatus,
    queueLength: taskQueue.length
  });
});

// Add a task to the queue
app.post('/api/tasks', (req, res) => {
  const { agent, type, payload } = req.body;
  if (!agent || !type) {
    return res.status(400).json({ error: 'agent and type are required' });
  }
  const task = {
    id: uuidv4(),
    agent,
    type,
    payload: payload || {},
    status: 'queued',
    createdAt: new Date().toISOString()
  };
  taskQueue.push(task);
  res.json({ success: true, task });
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json({ tasks: taskQueue });
});

// Agent heartbeat/status update
app.post('/api/agents/:agentId/status', (req, res) => {
  const { agentId } = req.params;
  agentStatus[agentId] = {
    ...req.body,
    lastSeen: new Date().toISOString()
  };
  res.json({ success: true });
});

// Buffer telemetry
app.post('/api/telemetry', (req, res) => {
  const telemetry = req.body;
  let buffer = [];
  if (fs.existsSync(TELEMETRY_BUFFER_PATH)) {
    buffer = JSON.parse(fs.readFileSync(TELEMETRY_BUFFER_PATH, 'utf8'));
  }
  buffer.push({
    ...telemetry,
    receivedAt: new Date().toISOString()
  });
  fs.writeFileSync(TELEMETRY_BUFFER_PATH, JSON.stringify(buffer, null, 2));
  res.json({ success: true });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`MCP Orchestrator running on port ${PORT}`);
});
