"use strict";

/**
 * Authentication middleware for MCP server routes
 * Verifies the authentication token from the request headers
 */
const authMiddleware = (req, res, next) => {
  // Skip auth if not enabled
  if (process.env.MCP_AUTH_ENABLED !== "true") {
    return next();
  }

  const authToken = req.headers.authorization;
  const expectedToken = process.env.MCP_AUTH_TOKEN;

  // Check if token is present and matches the expected token
  if (!authToken || authToken !== `Bearer ${expectedToken}`) {
    return res.status(401).json({
      error: {
        message: "Unauthorized: Invalid or missing authentication token",
        status: 401,
      },
    });
  }

  // Authentication successful
  next();
};

module.exports = authMiddleware;
