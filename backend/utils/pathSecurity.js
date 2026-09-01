const path = require('path');
const fs = require('fs');

/**
 * Validates a bot identifier to prevent route injection or traversal.
 * 
 * @param {string} botId - Identifier string from URL parameter
 * @returns {string} Sanitized bot ID
 */
function validateBotId(botId) {
  if (!botId || typeof botId !== 'string') {
    const err = new Error('Bot ID is required.');
    err.status = 400;
    throw err;
  }

  const trimmed = botId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    const err = new Error('Invalid Bot ID format. Must contain only alphanumeric characters, dashes, or underscores.');
    err.status = 400;
    throw err;
  }

  return trimmed;
}

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
    const err = new Error('Invalid bot root configuration.');
    err.status = 500;
    throw err;
  }

  const cleanBotRoot = path.resolve(botRoot);

  if (typeof requestedRelativePath !== 'string') {
    const err = new Error('Invalid path parameter.');
    err.status = 400;
    throw err;
  }

  // Prevent null byte poisoning
  if (requestedRelativePath.includes('\0')) {
    const err = new Error('Access denied: Null byte sequence detected.');
    err.status = 400;
    throw err;
  }

  // Clean relative path (remove leading slashes/backslashes so path.resolve doesn't treat as root)
  const sanitizedRelative = requestedRelativePath.replace(/^[/\\]+/, '');

  // Resolve absolute target path
  const targetPath = path.resolve(cleanBotRoot, sanitizedRelative);

  // Verification 1: Target path must start with cleanBotRoot
  const isWithinRoot = targetPath === cleanBotRoot || targetPath.startsWith(cleanBotRoot + path.sep);
  if (!isWithinRoot) {
    const err = new Error('Access denied: Path is outside the designated bot root directory.');
    err.status = 403;
    throw err;
  }

  // Verification 2: If the file or directory exists on disk, verify realpath to prevent symlink traversal
  if (fs.existsSync(targetPath)) {
    try {
      const realTarget = fs.realpathSync(targetPath);
      const realRoot = fs.existsSync(cleanBotRoot) ? fs.realpathSync(cleanBotRoot) : cleanBotRoot;
      const isRealWithinRoot = realTarget === realRoot || realTarget.startsWith(realRoot + path.sep);
      if (!isRealWithinRoot) {
        const err = new Error('Access denied: Symlink resolves outside the designated bot directory.');
        err.status = 403;
        throw err;
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
    const err = new Error('File or folder name is required.');
    err.status = 400;
    throw err;
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    const err = new Error('File or folder name cannot be empty.');
    err.status = 400;
    throw err;
  }

  if (trimmed.length > 255) {
    const err = new Error('File or folder name exceeds maximum length (255 characters).');
    err.status = 400;
    throw err;
  }

  // Check for forbidden characters in filenames (slashes, colons, null bytes, control chars, traversal)
  if (/[/\\:\0\x00-\x1f*?"<>|]/.test(trimmed) || trimmed === '.' || trimmed === '..') {
    const err = new Error('Invalid name: contains forbidden characters or path traversal markers.');
    err.status = 400;
    throw err;
  }

  return trimmed;
}

module.exports = {
  validateBotId,
  resolveSecurePath,
  validateEntityName
};
