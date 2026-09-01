const path = require('path');
const fs = require('fs');

/**
 * Validates and safely resolves a relative path inside a bot's designated root directory.
 * Defends against path traversal attacks (e.g. ../, %2e%2e, null bytes) and symlink escapes.
 * 
 * @param {string} botRoot - Absolute path to the bot's configured folder (from bots.json)
 * @param {string} requestedRelativePath - User-requested relative path (default: empty / current dir)
 * @returns {string} Fully resolved and security-checked absolute path
 * @throws {Error} If path traversal or symlink escape is detected
 */
function resolveSecurePath(botRoot, requestedRelativePath = '') {
  if (!botRoot || typeof botRoot !== 'string') {
    throw new Error('Invalid bot root configuration.');
  }

  const cleanBotRoot = path.resolve(botRoot);

  if (typeof requestedRelativePath !== 'string') {
    throw new Error('Invalid path parameter.');
  }

  // Prevent null byte poisoning
  if (requestedRelativePath.includes('\0')) {
    throw new Error('Path traversal rejected: Null byte detected.');
  }

  // Clean relative path (remove leading slashes/backslashes so resolve doesn't treat as root)
  const sanitizedRelative = requestedRelativePath.replace(/^[/\\]+/, '');

  // Resolve absolute target path
  const targetPath = path.resolve(cleanBotRoot, sanitizedRelative);

  // Verification 1: Target path must start with cleanBotRoot
  const isWithinRoot = targetPath === cleanBotRoot || targetPath.startsWith(cleanBotRoot + path.sep);
  if (!isWithinRoot) {
    throw new Error('Access denied: Path is outside the bot directory.');
  }

  // Verification 2: If the file or directory exists on disk, verify realpath to prevent symlink traversal
  if (fs.existsSync(targetPath)) {
    try {
      const realTarget = fs.realpathSync(targetPath);
      const realRoot = fs.existsSync(cleanBotRoot) ? fs.realpathSync(cleanBotRoot) : cleanBotRoot;
      const isRealWithinRoot = realTarget === realRoot || realTarget.startsWith(realRoot + path.sep);
      if (!isRealWithinRoot) {
        throw new Error('Access denied: Symlink points outside the bot directory.');
      }
      return targetPath;
    } catch (err) {
      if (err.message.includes('Access denied')) throw err;
      // If realpathSync fails due to transient ENOENT, fallback to targetPath check
    }
  }

  return targetPath;
}

/**
 * Validates a new file or directory name to prevent malicious characters and traversal.
 * 
 * @param {string} name - Base name of new file/folder
 * @returns {string} Sanitized name
 */
function validateEntityName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Name is required.');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Name cannot be empty.');
  }

  if (trimmed.length > 255) {
    throw new Error('Name exceeds maximum length (255 characters).');
  }

  // Check for forbidden characters in filenames (slashes, null bytes, control chars)
  if (/[/\\:\0\x00-\x1f]/.test(trimmed) || trimmed === '.' || trimmed === '..') {
    throw new Error('Invalid name: contains forbidden characters or path separators.');
  }

  return trimmed;
}

module.exports = {
  resolveSecurePath,
  validateEntityName
};
