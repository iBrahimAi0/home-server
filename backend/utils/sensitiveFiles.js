const path = require('path');

// Protected filename patterns and exact names (case-insensitive)
const PROTECTED_EXACT_NAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
  'id_rsa',
  'id_ecdsa',
  'id_ed25519',
  'id_dsa',
  'authorized_keys',
  'known_hosts'
]);

const PROTECTED_EXTENSIONS = new Set([
  '.pem',
  '.key',
  '.pfx',
  '.p12',
  '.pkcs12',
  '.crt',
  '.cer',
  '.kdbx'
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

  // Check exact names (.env, .env.local, id_rsa, etc.)
  if (PROTECTED_EXACT_NAMES.has(baseName)) {
    return true;
  }

  // Check if filename starts with .env. (e.g., .env.staging, .env.custom)
  if (baseName.startsWith('.env.') || baseName === '.env') {
    return true;
  }

  // Check forbidden extensions (.pem, .key, etc.)
  if (PROTECTED_EXTENSIONS.has(ext)) {
    return true;
  }

  // Check if it accesses hidden git configuration/credentials
  if (filePath.includes('.git/') || filePath.includes('.git\\') || baseName === '.gitconfig') {
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
    throw new Error(`Security Exception: Access to protected sensitive file "${baseName}" is blocked.`);
  }
}

module.exports = {
  isSensitiveFile,
  assertNotSensitive
};
