const path = require('path');

// Protected filename exact base names (case-insensitive)
const PROTECTED_EXACT_NAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
  '.env.staging',
  '.npmrc',
  'id_rsa',
  'id_ecdsa',
  'id_ed25519',
  'id_dsa',
  'id_rsa.pub',
  'id_ecdsa.pub',
  'id_ed25519.pub',
  'authorized_keys',
  'known_hosts',
  '.gitconfig',
  '.gitmodules',
  '.gitcredentials',
  'passwd',
  'shadow'
]);

// Protected file extensions (case-insensitive)
const PROTECTED_EXTENSIONS = new Set([
  '.pem',
  '.key',
  '.pfx',
  '.p12',
  '.pkcs12',
  '.crt',
  '.cer',
  '.cert',
  '.kdbx',
  '.token'
]);

/**
 * Checks if a relative path or filename points to a protected sensitive file.
 * 
 * @param {string} filePath - Relative or absolute path / filename
 * @returns {boolean} True if sensitive, false otherwise
 */
function isSensitiveFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;

  const baseName = path.basename(filePath).toLowerCase();
  const ext = path.extname(filePath).toLowerCase();

  // Check exact names (.env, .npmrc, id_rsa, etc.)
  if (PROTECTED_EXACT_NAMES.has(baseName)) {
    return true;
  }

  // Check if filename starts with .env or id_
  if (baseName.startsWith('.env.') || baseName === '.env' || baseName.startsWith('id_')) {
    return true;
  }

  // Check forbidden extensions (.pem, .key, .crt, etc.)
  if (PROTECTED_EXTENSIONS.has(ext)) {
    return true;
  }

  // Check if it accesses hidden git internal configuration / credential files
  const normalized = filePath.replace(/\\/g, '/');
  if (
    normalized.includes('/.git/') ||
    normalized.startsWith('.git/') ||
    baseName === '.git' ||
    baseName === '.gitconfig'
  ) {
    return true;
  }

  return false;
}

/**
 * Throws an error if the target file is sensitive and blocked from access.
 * 
 * @param {string} filePath - Target file path
 * @throws {Error} If the file is protected
 */
function assertNotSensitive(filePath) {
  if (isSensitiveFile(filePath)) {
    const baseName = path.basename(filePath);
    const err = new Error(`Security Exception: Access to protected sensitive credential or configuration file "${baseName}" is blocked.`);
    err.status = 403;
    throw err;
  }
}

module.exports = {
  isSensitiveFile,
  assertNotSensitive
};
