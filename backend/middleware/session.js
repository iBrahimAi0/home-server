const COOKIE = "forge_access";
const MAX_AGE = 8 * 60 * 60;
const encoder = new TextEncoder();

async function signature(secret, expiry) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode("forge-session:" + expiry)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function createSession(secret) {
  const expiry = Math.floor(Date.now() / 1000) + MAX_AGE;
  return expiry + "." + await signature(secret, expiry);
}

function equal(left, right) {
  if (typeof left !== "string" || left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

async function verifySession(secret, token) {
  if (!secret || !/^\d{10}\.[a-f0-9]{64}$/.test(token || "")) return false;
  const [expiry, mac] = token.split(".");
  return Number(expiry) > Date.now() / 1000 && equal(mac, await signature(secret, expiry));
}

exports.COOKIE = COOKIE;
exports.MAX_AGE = MAX_AGE;
exports.createSession = createSession;
exports.verifySession = verifySession;
exports.equal = equal;
