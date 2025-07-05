// 1Password Connect API client

const fetch = require('node-fetch');

const API_BASE = process.env.ONEPASSWORD_API_BASE || 'https://connect.1password.com/v1';
const TOKEN = process.env.ONEPASSWORD_API_TOKEN || '';

async function validateToken(token) {
  // Simple token validation logic
  return token === TOKEN;
}

async function getVaults() {
  const response = await fetch(`${API_BASE}/vaults`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!response.ok) throw new Error('Failed to fetch vaults');
  return response.json();
}

async function getItems(vaultId) {
  const response = await fetch(`${API_BASE}/vaults/${vaultId}/items`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
}

module.exports = {
  validateToken,
  getVaults,
  getItems,
};
