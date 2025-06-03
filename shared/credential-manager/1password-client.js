// 1Password Connect client for shared credential management

const fetch = require('node-fetch');

const API_BASE = process.env.ONEPASSWORD_API_BASE || 'https://connect.1password.com/v1';
const TOKEN = process.env.ONEPASSWORD_API_TOKEN || '';

async function getCredentials() {
  const response = await fetch(`${API_BASE}/credentials`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!response.ok) throw new Error('Failed to fetch credentials');
  return response.json();
}

async function rotateCredentials() {
  const response = await fetch(`${API_BASE}/credentials/rotate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!response.ok) throw new Error('Failed to rotate credentials');
  return response.json();
}

module.exports = {
  getCredentials,
  rotateCredentials,
};
