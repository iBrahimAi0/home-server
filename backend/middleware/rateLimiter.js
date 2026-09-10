/**
 * Rate Limiter Middleware for NexusPanel Backend
 *
 * Simple in-memory sliding-window rate limiter. Tracks request timestamps
 * per client IP and rejects requests once the configured threshold is
 * exceeded within the time window. No external dependencies required.
 */

function createRateLimiter({ windowMs = 60 * 1000, max = 120 } = {}) {
  const hits = new Map(); // ip -> array of request timestamps (ms)

  // Periodically clear out stale entries so the map doesn't grow forever
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const recent = timestamps.filter((t) => now - t < windowMs);
      if (recent.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, recent);
      }
    }
  }, windowMs);
  sweepInterval.unref?.();

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    const timestamps = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    hits.set(ip, timestamps);

    if (timestamps.length > max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down and try again shortly.',
      });
    }

    next();
  };
}

// General-purpose limiter applied to every request
const generalLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });

// Stricter limiter, available for sensitive routes (e.g. auth-adjacent actions)
const strictLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20 });

module.exports = { generalLimiter, strictLimiter, createRateLimiter };
