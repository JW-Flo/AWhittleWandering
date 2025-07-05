const { getVaults, getItems } = require('./client');
const { credentialSchema } = require('./schema');
const Ajv = require('ajv');
const ajv = new Ajv();
const validate = ajv.compile(credentialSchema);

async function getCredentials() {
  const vaults = await getVaults();
  if (!vaults || vaults.length === 0) {
    throw new Error('No vaults found');
  }
  const vaultId = vaults[0].id;
  const items = await getItems(vaultId);
  const credentials = items.filter(item => validate(item));
  return credentials;
}

async function rotateCredentials() {
  // Placeholder for credential rotation logic
  // This would interact with 1Password API to rotate secrets
  return { rotated: true, timestamp: new Date().toISOString() };
}

module.exports = {
  getCredentials,
  rotateCredentials,
};
