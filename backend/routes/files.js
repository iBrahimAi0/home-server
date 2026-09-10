const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { resolveSecurePath, validateEntityName, validateBotId } = require('../utils/pathSecurity');
const { isSensitiveFile } = require('../utils/sensitiveFiles');
const { extractZipSafely, extractRarSafely, isUnrarAvailable, inspectZipArchive } = require('../utils/archiveSecurity');

// Temporary upload directory
const tempUploadDir = path.join(__dirname, '../uploads_temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Multer storage configuration with 50MB limit
const upload = multer({
  dest: tempUploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max upload
  }
});

module.exports = function createFilesRouter(botManager) {
  const router = express.Router({ mergeParams: true });

  /**
   * Helper to look up bot and retrieve its root path.
   */
  function getBotRoot(botId) {
    const cleanId = validateBotId(botId);
    const bot = botManager.bots.get(cleanId);
    if (!bot) {
      const err = new Error(`Bot "${cleanId}" does not exist in configuration.`);
      err.status = 404;
      throw err;
    }

    const botRoot = bot.config.path;
    if (!fs.existsSync(botRoot)) {
      fs.mkdirSync(botRoot, { recursive: true });
    }
    return botRoot;
  }

  /**
   * GET /api/bots/:id/files
   * Lists files and folders in a relative directory.
   */
  router.get('/', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const relativePath = (req.query.path || '').toString();

      const targetPath = resolveSecurePath(botRoot, relativePath);

      if (!fs.existsSync(targetPath)) {
        const err = new Error('Directory not found.');
        err.status = 404;
        throw err;
      }

      const stat = fs.statSync(targetPath);
      if (!stat.isDirectory()) {
        const err = new Error('Requested path is a file, not a directory.');
        err.status = 400;
        throw err;
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
          // ignore stat errors
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
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/files/content
   * Reads raw text content of a file.
   */
  router.get('/content', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const relativePath = (req.query.path || '').toString();

      if (!relativePath) {
        const err = new Error('Path parameter is required.');
        err.status = 400;
        throw err;
      }

      const targetPath = resolveSecurePath(botRoot, relativePath);

      if (!fs.existsSync(targetPath)) {
        const err = new Error(`File "${relativePath}" does not exist.`);
        err.status = 404;
        throw err;
      }

      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        const err = new Error('Cannot read text content of a directory.');
        err.status = 400;
        throw err;
      }

      // Max 4MB for in-browser editing
      if (stat.size > 4 * 1024 * 1024) {
        const err = new Error(`File is too large to edit in browser (${(stat.size / 1024 / 1024).toFixed(1)} MB > 4 MB limit).`);
        err.status = 400;
        throw err;
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
      next(err);
    }
  });

  /**
   * PUT /api/bots/:id/files/content
   * Saves text content to an existing or new file.
   */
  router.put('/content', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const { path: relativePath, content } = req.body;

      if (!relativePath || typeof relativePath !== 'string') {
        const err = new Error('Valid file path is required.');
        err.status = 400;
        throw err;
      }

      if (typeof content !== 'string') {
        const err = new Error('File content must be a string.');
        err.status = 400;
        throw err;
      }

      const targetPath = resolveSecurePath(botRoot, relativePath);

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
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/files/file
   * Creates a new file.
   */
  router.post('/file', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const { path: parentRelative = '', name, initialContent = '' } = req.body;

      const cleanName = validateEntityName(name);
      const targetRelative = path.posix.join(parentRelative.replace(/\\/g, '/'), cleanName);

      const targetPath = resolveSecurePath(botRoot, targetRelative);

      if (fs.existsSync(targetPath)) {
        const err = new Error(`A file or folder named "${cleanName}" already exists.`);
        err.status = 400;
        throw err;
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
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/files/folder
   * Creates a new directory.
   */
  router.post('/folder', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const { path: parentRelative = '', name } = req.body;

      const cleanName = validateEntityName(name);
      const targetRelative = path.posix.join(parentRelative.replace(/\\/g, '/'), cleanName);

      const targetPath = resolveSecurePath(botRoot, targetRelative);

      if (fs.existsSync(targetPath)) {
        const err = new Error(`A folder named "${cleanName}" already exists.`);
        err.status = 400;
        throw err;
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
      next(err);
    }
  });

  /**
   * PATCH /api/bots/:id/files/rename
   * Renames a file or directory.
   */
  router.patch('/rename', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const { path: relativePath, newName } = req.body;

      if (!relativePath) {
        const err = new Error('Path is required.');
        err.status = 400;
        throw err;
      }

      const cleanNewName = validateEntityName(newName);

      const oldTargetPath = resolveSecurePath(botRoot, relativePath);
      if (!fs.existsSync(oldTargetPath)) {
        const err = new Error('Source file or folder not found.');
        err.status = 404;
        throw err;
      }

      const parentDir = path.dirname(oldTargetPath);
      const newTargetPath = path.join(parentDir, cleanNewName);

      const newRelative = path.relative(botRoot, newTargetPath);
      resolveSecurePath(botRoot, newRelative);

      if (fs.existsSync(newTargetPath)) {
        const err = new Error(`Destination "${cleanNewName}" already exists.`);
        err.status = 400;
        throw err;
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
      next(err);
    }
  });

  /**
   * DELETE /api/bots/:id/files
   * Deletes a file or directory.
   */
  router.delete('/', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const relativePath = (req.query.path || '').toString();

      if (!relativePath || relativePath.trim() === '' || relativePath === '.' || relativePath === '/') {
        const err = new Error('Cannot delete the bot root directory itself.');
        err.status = 400;
        throw err;
      }

      const targetPath = resolveSecurePath(botRoot, relativePath);

      if (!fs.existsSync(targetPath)) {
        const err = new Error('Target file or folder not found.');
        err.status = 404;
        throw err;
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
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/files/batch-delete
   * Deletes multiple files and/or directories in a single request.
   * Body: { paths: string[] }
   */
  router.post('/batch-delete', (req, res, next) => {
    try {
      const botRoot = getBotRoot(req.params.id);
      const { paths } = req.body || {};

      if (!Array.isArray(paths) || paths.length === 0) {
        const err = new Error('At least one file path is required.');
        err.status = 400;
        throw err;
      }

      const results = [];

      for (const rawPath of paths) {
        const relativePath = (rawPath || '').toString();
        try {
          if (!relativePath || relativePath.trim() === '' || relativePath === '.' || relativePath === '/') {
            throw new Error('Cannot delete the bot root directory itself.');
          }

          const targetPath = resolveSecurePath(botRoot, relativePath);

          if (!fs.existsSync(targetPath)) {
            throw new Error('Target file or folder not found.');
          }

          const stat = fs.statSync(targetPath);
          if (stat.isDirectory()) {
            fs.rmSync(targetPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(targetPath);
          }

          results.push({ path: relativePath, success: true });
        } catch (itemErr) {
          results.push({ path: relativePath, success: false, error: itemErr.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      res.json({
        success: failCount === 0,
        message: failCount === 0
          ? `Deleted ${successCount} item(s) successfully.`
          : `Deleted ${successCount} item(s), ${failCount} failed.`,
        data: { results }
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/files/upload
   * Uploads files directly into the specified directory with duplicate overwrite handling.
   */
  router.post('/upload', upload.array('files', 30), async (req, res, next) => {
    const uploadedTempFiles = req.files || [];
    try {
      const botRoot = getBotRoot(req.params.id);
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

        const finalPath = resolveSecurePath(botRoot, destinationFileRel);

        if (fs.existsSync(finalPath) && !overwrite) {
          const err = new Error(`File "${originalName}" already exists. Please confirm replacement.`);
          err.status = 409;
          throw err;
        }

        fs.copyFileSync(file.path, finalPath);
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore
        }

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
      for (const file of uploadedTempFiles) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/files/inspect-archive
   * Inspects an uploaded or existing archive (.zip) and returns file list and metadata for preview.
   */
  router.post('/inspect-archive', upload.single('archive'), async (req, res, next) => {
    let tempPath = req.file ? req.file.path : null;
    try {
      const botRoot = getBotRoot(req.params.id);
      const existingArchiveRel = (req.body.archivePath || '').toString();

      let archiveToInspect = tempPath;
      if (!tempPath) {
        if (!existingArchiveRel) {
          const err = new Error('No archive provided for inspection.');
          err.status = 400;
          throw err;
        }
        archiveToInspect = resolveSecurePath(botRoot, existingArchiveRel);
      }

      const result = await inspectZipArchive(archiveToInspect);

      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore
        }
      }

      res.json({
        success: true,
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
      next(err);
    }
  });

  /**
   * POST /api/bots/:id/files/extract
   * Extracts an uploaded or existing archive (.zip or .rar) safely into destination folder.
   */
  router.post('/extract', upload.single('archive'), async (req, res, next) => {
    let tempPath = req.file ? req.file.path : null;

    try {
      const botRoot = getBotRoot(req.params.id);
      const destinationFolderRel = (req.body.destinationPath || '').toString();
      const existingArchiveRel = (req.body.archivePath || '').toString();

      const targetExtractDir = resolveSecurePath(botRoot, destinationFolderRel);

      let archiveToExtract = tempPath;
      let filename = req.file ? req.file.originalname : path.basename(existingArchiveRel);

      if (!tempPath) {
        if (!existingArchiveRel) {
          const err = new Error('No archive file provided.');
          err.status = 400;
          throw err;
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
        const err = new Error(`Unsupported archive format: "${ext}". Supported formats: .zip, .rar.`);
        err.status = 400;
        throw err;
      }

      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore
        }
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
      next(err);
    }
  });

  /**
   * GET /api/bots/:id/files/unrar-status
   * Checks if unrar binary is available on host.
   */
  router.get('/unrar-status', async (req, res, next) => {
    try {
      const available = await isUnrarAvailable();
      res.json({
        success: true,
        available: available,
        message: available ? 'unrar is installed' : 'unrar not found on host'
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
