/**
 * Authentication Middleware for NexusPanel Backend
 *
 * Supports optional authentication via Bearer Token or x-api-key header.
 * When API_KEY or AUTH_TOKEN environment variable is set, requests without
 * a valid token will receive HTTP 401 Unauthorized.
 * When not configured (e.g. local private network dev mode), requests pass
 * through with standard security headers.
 */

function authMiddleware(req, res, next) {
  const configuredToken = process.env.AUTH_TOKEN || process.env.API_KEY || "";

  // If no auth token is configured on the host server, pass through
  if (!configuredToken || configuredToken.trim() === "") {
    return next();
  }

  // Check Authorization header (Bearer <token>)
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === configuredToken) {
      return next();
    }
  }

  // Check x-api-key header
  const apiKeyHeader = req.headers["x-api-key"];
  if (apiKeyHeader && apiKeyHeader === configuredToken) {
    return next();
  }

  // Unauthenticated
  return res.status(401).json({
    success: false,
    error:
      "Unauthorized: Valid API key or Bearer token is required to access this endpoint.",
  });
}

module.exports = authMiddleware;
