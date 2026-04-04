import { defineEventHandler } from 'h3';
import { createHash } from 'node:crypto';

/**
 * Hash a string using SHA-256 and return a short hex digest.
 * @param value - The string to hash.
 * @returns First 8 characters of the SHA-256 hash.
 */
function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').substring(0, 8);
}

/**
 * H3 middleware that redacts or hashes PII (IP address, User-Agent) from incoming requests.
 * The original values are removed from request headers; hashed versions are stored
 * in `event.context` for downstream use if needed.
 */
export default defineEventHandler(async (event) => {
  const req = event.node.req;
  const headers = req.headers;

  // --- IP address ---
  // Check common headers and the socket remoteAddress.
  const ip =
    headers['x-forwarded-for'] ||
    headers['x-real-ip'] ||
    (req.socket?.remoteAddress ?? null);

  if (ip) {
    const ipString = typeof ip === 'string' ? ip : ip.address || ip.toString();
    const ipHash = hash(ipString);
    event.context.ipHash = ipHash;

    // Remove original IP-related headers.
    delete headers['x-forwarded-for'];
    delete headers['x-real-ip'];
    // Note: `req.socket.remoteAddress` is a net.Socket property; we cannot delete it.
    // The hash is stored in context for any downstream logic that needs it.
  }

  // --- User-Agent ---
  const ua = headers['user-agent'];
  if (ua) {
    const uaHash = hash(ua);
    event.context.userAgentHash = uaHash;
    delete headers['user-agent'];
  }

  // Continue to the next middleware/handler.
});
