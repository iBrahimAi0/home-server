const { COOKIE, equal, verifySession } = require("./session");

async function authorize(headers) {
  const secret = process.env.AUTH_TOKEN || process.env.API_KEY;
  if (!secret) return false;
  const bearer = headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (equal(bearer, secret) || equal(headers["x-api-key"], secret)) return true;
  const cookie = headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith(COOKIE + "="));
  return verifySession(secret, cookie?.slice(COOKIE.length + 1));
}

function authMiddleware(req, res, next) {
  authorize(req.headers).then(allowed => {
    if (allowed) return next();
    res.status(401).json({ success: false, error: "Sign in to access this host." });
  }).catch(next);
}

module.exports = authMiddleware;
module.exports.authorize = authorize;
