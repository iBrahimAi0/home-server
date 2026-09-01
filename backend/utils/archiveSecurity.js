const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { assertNotSensitive } = require('./sensitiveFiles');

const MAX_FILES_COUNT = 2000;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 200 * 1024 * 1024; // 200MB
const MAX_SINGLE_FILE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Validates and safely extracts a .zip archive into the designated target directory.
 * Defends against Zip-Slip, Zip Bombs, and symlink exploits.
 * 
 * @param {string} zipFilePath - Path to temporary zip archive
 * @param {string} destinationDir - Absolute path to bot destination directory
 * @returns {Promise<{ extractedCount: number, totalBytes: number }>}
 */
async function extractZipSafely(zipFilePath, destinationDir) {
  if (!fs.existsSync(zipFilePath)) {
    throw new Error('Archive file does not exist.');
  }

  const cleanDest = path.resolve(destinationDir);
  if (!fs.existsSync(cleanDest)) {
    fs.mkdirSync(cleanDest, { recursive: true });
  }

  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  if (zipEntries.length > MAX_FILES_COUNT) {
    throw new Error(`Archive contains too many files (${zipEntries.length} > ${MAX_FILES_COUNT}). Extraction halted.`);
  }

  let totalUncompressed = 0;

  // Pre-validate all entries before writing a single byte to disk
  for (const entry of zipEntries) {
    const entryName = entry.entryName;

    // Check for null bytes or relative path traversal sequences
    if (entryName.includes('\0') || entryName.includes('..')) {
      throw new Error(`Malicious path detected in archive entry: "${entryName}". Extraction rejected.`);
    }

    // Resolve the destination for this entry
    const targetPath = path.resolve(cleanDest, entryName);

    // Verify target is strictly within cleanDest
    if (targetPath !== cleanDest && !targetPath.startsWith(cleanDest + path.sep)) {
      throw new Error(`Zip-Slip attempt detected for entry: "${entryName}". Extraction rejected.`);
    }

    // Block extraction of sensitive file names (e.g. .env inside a zip)
    assertNotSensitive(entryName);

    if (!entry.isDirectory) {
      const size = entry.header.size;
      if (size > MAX_SINGLE_FILE_BYTES) {
        throw new Error(`File "${entryName}" in archive exceeds size limit (${Math.round(size / 1024 / 1024)}MB > ${MAX_SINGLE_FILE_BYTES / 1024 / 1024}MB).`);
      }
      totalUncompressed += size;
      if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) {
        throw new Error(`Archive uncompressed size exceeds maximum allowed (${Math.round(totalUncompressed / 1024 / 1024)}MB > ${MAX_TOTAL_UNCOMPRESSED_BYTES / 1024 / 1024}MB). Potential zip bomb.`);
      }
    }
  }

  // Safe extraction pass
  let extractedCount = 0;
  for (const entry of zipEntries) {
    const targetPath = path.resolve(cleanDest, entry.entryName);

    if (entry.isDirectory) {
      fs.mkdirSync(targetPath, { recursive: true });
    } else {
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, entry.getData());
      extractedCount++;
    }
  }

  return {
    extractedCount,
    totalBytes: totalUncompressed
  };
}

/**
 * Checks whether the Ubuntu system has unrar installed for optional .rar extraction.
 * 
 * @returns {Promise<boolean>}
 */
function isUnrarAvailable() {
  return new Promise((resolve) => {
    exec('which unrar', (err, stdout) => {
      resolve(!err && !!stdout && stdout.trim().length > 0);
    });
  });
}

/**
 * Safely extracts a .rar archive if unrar is available, with path verification.
 * 
 * @param {string} rarFilePath - Path to rar file
 * @param {string} destinationDir - Target directory
 */
async function extractRarSafely(rarFilePath, destinationDir) {
  const hasUnrar = await isUnrarAvailable();
  if (!hasUnrar) {
    throw new Error('RAR extraction requires "unrar" package on Ubuntu Server. Please install it via "sudo apt install unrar" or upload as .zip.');
  }

  const cleanDest = path.resolve(destinationDir);

  return new Promise((resolve, reject) => {
    // List archive contents first to check for directory traversal
    exec(`unrar lb "${rarFilePath}"`, { timeout: 10000 }, (listErr, stdout) => {
      if (listErr) {
        return reject(new Error('Failed to inspect RAR archive. File may be corrupted or password protected.'));
      }

      const files = stdout.trim().split('\n').map(f => f.trim()).filter(Boolean);
      for (const file of files) {
        if (file.includes('..') || file.includes('\0') || path.isAbsolute(file)) {
          return reject(new Error(`Malicious path detected in RAR: "${file}". Extraction rejected.`));
        }
        assertNotSensitive(file);
      }

      // Extract to directory
      exec(`unrar x -o+ -inul "${rarFilePath}" "${cleanDest}/"`, { timeout: 30000 }, (extErr) => {
        if (extErr) {
          return reject(new Error('RAR extraction failed: ' + extErr.message));
        }
        resolve({ extractedCount: files.length });
      });
    });
  });
}

module.exports = {
  extractZipSafely,
  extractRarSafely,
  isUnrarAvailable
};
