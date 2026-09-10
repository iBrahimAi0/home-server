/**
 * Centralized Error Handler Middleware for NexusPanel Backend
 *
 * Catches errors forwarded via next(err) (or thrown in async routes wrapped
 * with a try/catch that calls next(err)) and returns a sanitized JSON
 * response. Avoids leaking stack traces or internal file paths to clients.
 */

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // CORS rejections thrown from the cors() middleware
  if (err && err.message === 'Blocked by CORS policy') {
    return res.status(403).json({
      success: false,
      error: 'Request blocked by CORS policy.',
    });
  }

  const status = err?.status || err?.statusCode || 500;

  console.error(`[Error] ${req.method} ${req.originalUrl} ->`, err?.message || err);

  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error.' : (err?.message || 'Request failed.'),
  });
}

module.exports = errorHandler;
