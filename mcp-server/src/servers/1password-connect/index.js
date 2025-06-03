// 1password-connect MCP server main entry point

const express = require('express');
const router = express.Router();
const { getCredentials, rotateCredentials } = require('./tools');
const { validateToken } = require('./client');

// Middleware to validate token
router.use(async (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token || !(await validateToken(token))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Endpoint to get credentials
router.get('/credentials', async (req, res) => {
  try {
    const creds = await getCredentials();
    res.json(creds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get credentials' });
  }
});

// Endpoint to rotate credentials
router.post('/credentials/rotate', async (req, res) => {
  try {
    const result = await rotateCredentials();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to rotate credentials' });
  }
});

module.exports = router;
