const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { resolveSecurePath, validateEntityName } = require('../utils/pathSecurity');
const { isSensitiveFile, assertNotSensitive } = require('../utils/sensitiveFiles');
const { extractZipSafely, extractRarSafely, isUnrarAvailable } = require('../utils/archiveSecurity');

// Temporary upload folder setup
const tempUploadDir = path.join(__dirname, '../uploads_temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Multer storage configuration with 50MB limit
const upload = multer({
  dest: tempUploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max single upload
  }
});

module.exports = function createFilesRouter(botManager) {
  const router = express.Router({ mergeParams: true });

  /**
   * Helper to look up bot and retrieve its root path.
   */
  function getBotRoot(botId) {
    const bot = botManager.bots.get(botId);
    if (!bot) {
      const err = new Error(`Bot "${botId}" does not exist in configuration.`);
      err.status = 404;
      throw err;
    }

    const botRoot = bot.config.path;
    if (!fs.existsSync(botRoot)) {
      // Create bot directory if missing so file manager can browse it
      fs.mkdirSync(botRoot, { recursive: true });
    }
    return botRoot;
  }

  /**
   * GET /api/bots/:id/files
   * Lists files and folders in a relative directory.
   */
  router.get('/', (req, res) => {
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const relativePath = (req.query.path || '').toString();

      const targetPath = resolveSecurePath(botRoot, relativePath);

      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ success: false, error: 'Directory not found.' });
      }

      const stat = fs.statSync(targetPath);
      if (!stat.isDirectory()) {
        return res.status(400).json({ success: false, error: 'Requested path is a file, not a directory.' });
      }

      const dirEntries = fs.readdirSync(targetPath, { withFileTypes: true });

      const files = [];
      const folders = [];

      for (const entry of dirEntries) {
        const entryRelative = path.posix.join(relativePath.replace(/\\/g, '/'), entry.name).replace(/^\//, '');
        const entryAbsolute = path.join(targetPath, entry.name);

        let size = 0;
        let modifiedAt = new Date().toISOString();
        let isDir = entry.isDirectory();

        try {
          const entryStat = fs.statSync(entryAbsolute);
          size = entryStat.size;
          modifiedAt = entryStat.mtime.toISOString();
          isDir = entryStat.isDirectory();
        } catch {
          // ignore stat errors for inaccessible entries
        }

        const ext = isDir ? '' : path.extname(entry.name).toLowerCase();
        const sensitive = isSensitiveFile(entry.name);
        const isArchive = ['.zip', '.rar', '.tar', '.gz', '.7z'].includes(ext);

        const item = {
          name: entry.name,
          path: entryRelative,
          isDirectory: isDir,
          size: size,
          modifiedAt: modifiedAt,
          extension: ext,
          isSensitive: sensitive,
          isArchive: isArchive
        };

        if (isDir) {
          // Calculate contained items count if practical
          try {
            const children = fs.readdirSync(entryAbsolute);
            item.itemsCount = children.length;
          } catch {
            item.itemsCount = 0;
          }
          folders.push(item);
        } else {
          files.push(item);
        }
      }

      // Sort folders alphabetically, then files alphabetically
      folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      res.json({
        success: true,
        data: {
          currentPath: relativePath.replace(/\\/g, '/'),
          items: [...folders, ...files]
        }
      });
    } catch (err) {
      console.error('[FilesAPI] List error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/bots/:id/files/content
   * Reads raw text content of a file.
   */
  router.get('/content', (req, res) => {
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const relativePath = (req.query.path || '').toString();

      if (!relativePath) {
        return res.status(400).json({ success: false, error: 'Path parameter is required.' });
      }

      const targetPath = resolveSecurePath(botRoot, relativePath);
      assertNotSensitive(relativePath);

      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ success: false, error: `File "${relativePath}" does not exist.` });
      }

      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        return res.status(400).json({ success: false, error: 'Cannot read text content of a directory.' });
      }

      // Max 4MB for in-browser editing
      if (stat.size > 4 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: `File is too large to edit in browser (${(stat.size / 1024 / 1024).toFixed(1)} MB > 4 MB limit).`
        });
      }

      const content = fs.readFileSync(targetPath, 'utf8');

      res.json({
        success: true,
        data: {
          path: relativePath.replace(/\\/g, '/'),
          name: path.basename(targetPath),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          content: content
        }
      });
    } catch (err) {
      console.error('[FilesAPI] Read content error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * PUT /api/bots/:id/files/content
   * Saves text content to an existing or new file.
   */
  router.put('/content', (req, res) => {
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const { path: relativePath, content } = req.body;

      if (!relativePath || typeof relativePath !== 'string') {
        return res.status(400).json({ success: false, error: 'Valid file path is required.' });
      }

      if (typeof content !== 'string') {
        return res.status(400).json({ success: false, error: 'File content must be a string.' });
      }

      const targetPath = resolveSecurePath(botRoot, relativePath);
      assertNotSensitive(relativePath);

      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, content, 'utf8');

      const stat = fs.statSync(targetPath);
      res.json({
        success: true,
        message: 'File saved successfully.',
        data: {
          path: relativePath.replace(/\\/g, '/'),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString()
        }
      });
    } catch (err) {
      console.error('[FilesAPI] Save content error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/bots/:id/files/file
   * Creates a new empty or initial file.
   */
  router.post('/file', (req, res) => {
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const { path: parentRelative = '', name, initialContent = '' } = req.body;

      const cleanName = validateEntityName(name);
      const targetRelative = path.posix.join(parentRelative.replace(/\\/g, '/'), cleanName);

      assertNotSensitive(targetRelative);
      const targetPath = resolveSecurePath(botRoot, targetRelative);

      if (fs.existsSync(targetPath)) {
        return res.status(400).json({ success: false, error: `A file or folder named "${cleanName}" already exists.` });
      }

      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, initialContent, 'utf8');

      res.json({
        success: true,
        message: `File "${cleanName}" created successfully.`,
        data: {
          name: cleanName,
          path: targetRelative,
          isDirectory: false,
          size: Buffer.byteLength(initialContent, 'utf8'),
          modifiedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('[FilesAPI] Create file error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/bots/:id/files/folder
   * Creates a new directory.
   */
  router.post('/folder', (req, res) => {
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const { path: parentRelative = '', name } = req.body;

      const cleanName = validateEntityName(name);
      const targetRelative = path.posix.join(parentRelative.replace(/\\/g, '/'), cleanName);

      const targetPath = resolveSecurePath(botRoot, targetRelative);

      if (fs.existsSync(targetPath)) {
        return res.status(400).json({ success: false, error: `A folder named "${cleanName}" already exists.` });
      }

      fs.mkdirSync(targetPath, { recursive: true });

      res.json({
        success: true,
        message: `Folder "${cleanName}" created successfully.`,
        data: {
          name: cleanName,
          path: targetRelative,
          isDirectory: true,
          size: 0,
          itemsCount: 0,
          modifiedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('[FilesAPI] Create folder error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * PATCH /api/bots/:id/files/rename
   * Renames a file or directory.
   */
  router.patch('/rename', (req, res) => {
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const { path: relativePath, newName } = req.body;

      if (!relativePath) {
        return res.status(400).json({ success: false, error: 'Path is required.' });
      }

      const cleanNewName = validateEntityName(newName);
      assertNotSensitive(relativePath);

      const oldTargetPath = resolveSecurePath(botRoot, relativePath);
      if (!fs.existsSync(oldTargetPath)) {
        return res.status(404).json({ success: false, error: 'Source file or folder not found.' });
      }

      const parentDir = path.dirname(oldTargetPath);
      const newTargetPath = path.join(parentDir, cleanNewName);

      // Verify new target is also secure
      const newRelative = path.relative(botRoot, newTargetPath);
      assertNotSensitive(newRelative);
      resolveSecurePath(botRoot, newRelative);

      if (fs.existsSync(newTargetPath)) {
        return res.status(400).json({ success: false, error: `Destination "${cleanNewName}" already exists.` });
      }

      fs.renameSync(oldTargetPath, newTargetPath);

      res.json({
        success: true,
        message: `Renamed to "${cleanNewName}" successfully.`,
        data: {
          oldPath: relativePath.replace(/\\/g, '/'),
          newPath: newRelative.replace(/\\/g, '/'),
          newName: cleanNewName
        }
      });
    } catch (err) {
      console.error('[FilesAPI] Rename error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * DELETE /api/bots/:id/files
   * Deletes a file or directory.
   */
  router.delete('/', (req, res) => {
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const relativePath = (req.query.path || '').toString();

      if (!relativePath || relativePath.trim() === '' || relativePath === '.' || relativePath === '/') {
        return res.status(400).json({ success: false, error: 'Cannot delete the bot root directory itself.' });
      }

      assertNotSensitive(relativePath);
      const targetPath = resolveSecurePath(botRoot, relativePath);

      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ success: false, error: 'Target file or folder not found.' });
      }

      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }

      res.json({
        success: true,
        message: `Deleted "${path.basename(targetPath)}" successfully.`
      });
    } catch (err) {
      console.error('[FilesAPI] Delete error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/bots/:id/files/upload
   * Uploads files directly into the specified directory.
   */
  router.post('/upload', upload.array('files', 20), async (req, res) => {
    const uploadedTempFiles = req.files || [];
    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const targetFolderRelative = (req.body.destinationPath || '').toString();
      const overwrite = req.body.overwrite === 'true' || req.body.overwrite === true;

      const targetDirPath = resolveSecurePath(botRoot, targetFolderRelative);
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }

      const savedFiles = [];

      for (const file of uploadedTempFiles) {
        const originalName = validateEntityName(file.originalname);
        const destinationFileRel = path.posix.join(targetFolderRelative.replace(/\\/g, '/'), originalName);

        assertNotSensitive(destinationFileRel);
        const finalPath = resolveSecurePath(botRoot, destinationFileRel);

        if (fs.existsSync(finalPath) && !overwrite) {
          throw new Error(`File "${originalName}" already exists. Set overwrite to replace.`);
        }

        // Move from temp upload folder to destination
        fs.copyFileSync(file.path, finalPath);
        fs.unlinkSync(file.path); // remove temp file

        savedFiles.push({
          name: originalName,
          path: destinationFileRel,
          size: file.size
        });
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${savedFiles.length} file(s).`,
        data: savedFiles
      });
    } catch (err) {
      // Clean up any remaining temp files on error
      for (const file of uploadedTempFiles) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
      console.error('[FilesAPI] Upload error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/bots/:id/files/extract
   * Extracts an uploaded archive (.zip or .rar) safely into destination folder.
   */
  router.post('/extract', upload.single('archive'), async (req, res) => {
    let tempPath = req.file ? req.file.path : null;

    try {
      const botId = req.params.id;
      const botRoot = getBotRoot(botId);
      const destinationFolderRel = (req.body.destinationPath || '').toString();
      const existingArchiveRel = (req.body.archivePath || '').toString();

      const targetExtractDir = resolveSecurePath(botRoot, destinationFolderRel);

      let archiveToExtract = tempPath;
      let filename = req.file ? req.file.originalname : path.basename(existingArchiveRel);

      if (!tempPath) {
        if (!existingArchiveRel) {
          return res.status(400).json({ success: false, error: 'No archive file provided.' });
        }
        archiveToExtract = resolveSecurePath(botRoot, existingArchiveRel);
      }

      const ext = path.extname(filename).toLowerCase();

      let result;
      if (ext === '.zip') {
        result = await extractZipSafely(archiveToExtract, targetExtractDir);
      } else if (ext === '.rar') {
        result = await extractRarSafely(archiveToExtract, targetExtractDir);
      } else {
        return res.status(400).json({
          success: false,
          error: `Unsupported archive format: "${ext}". Supported formats: .zip, .rar.`
        });
      }

      // Cleanup temp uploaded archive if it was a direct upload
      if (tempPath && fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      res.json({
        success: true,
        message: `Successfully extracted ${result.extractedCount} file(s) into "${destinationFolderRel || 'root'}".`,
        data: result
      });
    } catch (err) {
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore
        }
      }
      console.error('[FilesAPI] Extract error:', err.message);
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/bots/:id/files/unrar-status
   * Checks if unrar binary is available on Ubuntu.
   */
  router.get('/unrar-status', async (req, res) => {
    try {
      const available = await isUnrarAvailable();
      res.json({
        success: true,
        available: available,
        message: available ? 'unrar is installed' : 'unrar not found on host'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
