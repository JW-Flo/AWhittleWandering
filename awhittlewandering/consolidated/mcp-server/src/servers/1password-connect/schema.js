// Schema definitions for 1Password Connect MCP server

const credentialSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    password: { type: 'string' },
    vaultId: { type: 'string' },
    lastRotated: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'username', 'password', 'vaultId'],
};

module.exports = {
  credentialSchema,
};
