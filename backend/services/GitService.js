/**
 * GitService — Restricted GitHub Synchronization
 *
 * Every git invocation goes through execFile('git', [fixed args]) — never
 * through a shell — so there is no command-injection surface. Branch names
 * and repository URLs are additionally validated so a value can't be
 * smuggled in as a leading "-" flag. No arbitrary command execution is ever
 * exposed to the web layer; this module only implements the specific
 * operations below.
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execFileAsync = promisify(execFile);

const FIELD_SEP = '\x1f'; // unit separator, won't collide with commit message text
const LOG_FORMAT = `%H${FIELD_SEP}%h${FIELD_SEP}%s${FIELD_SEP}%an${FIELD_SEP}%aI`;
const GIT_TIMEOUT_MS = 20000;
const GIT_MAX_BUFFER = 5 * 1024 * 1024; // 5MB

/**
 * Only allow simple branch names (no leading "-" which could be
 * misinterpreted as a flag by git, no whitespace, no shell metacharacters).
 */
function validateBranch(branch) {
  const value = String(branch || '').trim();
  if (!value || value.length > 200 || !/^[A-Za-z0-9._/-]+$/.test(value) || value.startsWith('-')) {
    const err = new Error('Invalid branch name.');
    err.status = 400;
    throw err;
  }
  return value;
}

/**
 * Only allow https:// GitHub/GitLab/Bitbucket-style repository URLs.
 * Blocks local paths, ssh://, and anything that could be read as a flag.
 */
function validateRepoUrl(repoUrl) {
  const value = String(repoUrl || '').trim();
  const pattern = /^https:\/\/[A-Za-z0-9.-]+\/[A-Za-z0-9._/-]+(\.git)?$/;
  if (!value || value.length > 500 || value.startsWith('-') || !pattern.test(value)) {
    const err = new Error('Repository URL must be a valid HTTPS git URL, e.g. https://github.com/owner/repo.git');
    err.status = 400;
    throw err;
  }
  return value;
}

function runGit(cwd, args) {
  return execFileAsync('git', args, {
    cwd,
    timeout: GIT_TIMEOUT_MS,
    maxBuffer: GIT_MAX_BUFFER,
    windowsHide: true
  });
}

function isGitRepo(botRoot) {
  return fs.existsSync(path.join(botRoot, '.git'));
}

function parseLogLine(line) {
  if (!line) return null;
  const [hash, shortHash, message, author, date] = line.split(FIELD_SEP);
  if (!hash) return null;
  return { hash, shortHash, message: message || '', author: author || '', date: date || '' };
}

async function getCurrentCommit(botRoot) {
  try {
    const { stdout } = await runGit(botRoot, ['log', '-1', `--format=${LOG_FORMAT}`]);
    return parseLogLine(stdout.trim());
  } catch {
    return null; // repo with no commits yet
  }
}

/**
 * GET status — is this bot directory a git repo, what branch/remote/commit
 * is it on, and are there uncommitted local changes.
 */
async function getStatus(botRoot) {
  if (!isGitRepo(botRoot)) {
    return {
      isGitRepo: false,
      branch: null,
      remoteUrl: null,
      currentCommit: null,
      isClean: true
    };
  }

  let branch = null;
  try {
    const { stdout } = await runGit(botRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
    branch = stdout.trim() || null;
    if (branch === 'HEAD') branch = null; // detached HEAD
  } catch {
    branch = null;
  }

  let remoteUrl = null;
  try {
    const { stdout } = await runGit(botRoot, ['remote', 'get-url', 'origin']);
    remoteUrl = stdout.trim() || null;
  } catch {
    remoteUrl = null;
  }

  const currentCommit = await getCurrentCommit(botRoot);

  let modifiedFiles = [];
  try {
    const { stdout } = await runGit(botRoot, ['status', '--porcelain']);
    modifiedFiles = stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.slice(3).trim());
  } catch {
    modifiedFiles = [];
  }

  return {
    isGitRepo: true,
    branch,
    remoteUrl,
    currentCommit,
    isClean: modifiedFiles.length === 0,
    modifiedFilesCount: modifiedFiles.length,
    modifiedFiles
  };
}

/**
 * Fetches the given branch from origin and compares HEAD to origin/<branch>
 * without changing any local files.
 */
async function checkUpdates(botRoot, branch) {
  const cleanBranch = validateBranch(branch);

  if (!isGitRepo(botRoot)) {
    const err = new Error('This bot directory is not a git repository yet.');
    err.status = 400;
    throw err;
  }

  await runGit(botRoot, ['fetch', '--quiet', 'origin', cleanBranch]);

  const { stdout: remoteOut } = await runGit(botRoot, ['rev-parse', `origin/${cleanBranch}`]);
  const remoteCommit = remoteOut.trim();

  let localCommit = null;
  try {
    const { stdout: localOut } = await runGit(botRoot, ['rev-parse', 'HEAD']);
    localCommit = localOut.trim();
  } catch {
    localCommit = null; // repo has no commits yet (e.g. just linked via configureRepo)
  }

  if (localCommit === null) {
    // Nothing pulled yet — everything on the remote branch counts as incoming.
    const { stdout: countOut } = await runGit(botRoot, ['rev-list', '--count', `origin/${cleanBranch}`]);
    const commitsBehind = parseInt(countOut.trim(), 10) || 0;

    const { stdout: logOut } = await runGit(botRoot, [
      'log', `--format=${LOG_FORMAT}`, `-n`, '50', `origin/${cleanBranch}`
    ]);
    const incomingCommits = logOut.split('\n').filter(Boolean).map(parseLogLine).filter(Boolean);

    return {
      hasUpdates: commitsBehind > 0,
      localCommit: '',
      remoteCommit,
      commitsBehind,
      incomingCommits,
      changedFiles: [],
      checkedAt: new Date().toISOString()
    };
  }

  if (localCommit === remoteCommit) {
    return {
      hasUpdates: false,
      localCommit,
      remoteCommit,
      commitsBehind: 0,
      incomingCommits: [],
      changedFiles: [],
      checkedAt: new Date().toISOString()
    };
  }

  const { stdout: countOut } = await runGit(botRoot, [
    'rev-list', '--count', `HEAD..origin/${cleanBranch}`
  ]);
  const commitsBehind = parseInt(countOut.trim(), 10) || 0;

  const { stdout: logOut } = await runGit(botRoot, [
    'log', `--format=${LOG_FORMAT}`, `HEAD..origin/${cleanBranch}`
  ]);
  const incomingCommits = logOut
    .split('\n')
    .filter(Boolean)
    .map(parseLogLine)
    .filter(Boolean);

  const { stdout: diffOut } = await runGit(botRoot, [
    'diff', '--name-status', 'HEAD', `origin/${cleanBranch}`
  ]);
  const changedFiles = diffOut
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, ...fileParts] = line.split('\t');
      return { status: (status || '').trim().charAt(0), file: fileParts.join('\t').trim() };
    })
    .filter((f) => f.file);

  return {
    hasUpdates: commitsBehind > 0,
    localCommit,
    remoteCommit,
    commitsBehind,
    incomingCommits,
    changedFiles,
    checkedAt: new Date().toISOString()
  };
}

/**
 * Safe fast-forward-only pull. Refuses if the working tree has local
 * modifications, so a pull can never silently overwrite uncommitted work.
 */
async function pull(botRoot, branch) {
  const cleanBranch = validateBranch(branch);

  if (!isGitRepo(botRoot)) {
    const err = new Error('This bot directory is not a git repository yet.');
    err.status = 400;
    throw err;
  }

  const status = await getStatus(botRoot);
  if (!status.isClean) {
    const err = new Error(
      `Refusing to pull: ${status.modifiedFilesCount} local file(s) have uncommitted changes. Commit or discard them first.`
    );
    err.status = 409;
    throw err;
  }

  let pullOutput;
  try {
    const { stdout, stderr } = await runGit(botRoot, ['pull', '--ff-only', 'origin', cleanBranch]);
    pullOutput = [stdout, stderr].filter(Boolean).join('\n').trim();
  } catch (err) {
    const wrapped = new Error(
      `Git pull failed (non-fast-forward or network error): ${err.stderr || err.message}`
    );
    wrapped.status = 409;
    throw wrapped;
  }

  const newCommit = await getCurrentCommit(botRoot);

  return {
    success: true,
    message: 'Pulled latest changes from origin.',
    pullOutput,
    newCommit,
    pulledAt: new Date().toISOString()
  };
}

/**
 * Links a bot directory to a remote repository. Never overwrites or checks
 * out files automatically — it only ensures the directory is a git repo
 * and that "origin" points at the given URL, then fetches so status/check
 * calls have data to compare against. Any actual sync still goes through
 * the normal safe pull path above (which refuses to run on a dirty tree).
 */
async function configureRepo(botRoot, repoUrl, branch) {
  const cleanUrl = validateRepoUrl(repoUrl);
  const cleanBranch = validateBranch(branch);

  if (!fs.existsSync(botRoot)) {
    fs.mkdirSync(botRoot, { recursive: true });
  }

  if (!isGitRepo(botRoot)) {
    await runGit(botRoot, ['init', '--quiet']);
  }

  try {
    await runGit(botRoot, ['remote', 'set-url', 'origin', cleanUrl]);
  } catch {
    await runGit(botRoot, ['remote', 'add', 'origin', cleanUrl]);
  }

  try {
    await runGit(botRoot, ['fetch', '--quiet', 'origin', cleanBranch]);
  } catch {
    // Repo/branch may not exist yet, or credentials may be required for a
    // private repo over plain HTTPS — configuration is still saved either
    // way, the status/check calls will surface the real error to the UI.
  }

  return { repoUrl: cleanUrl, branch: cleanBranch };
}

module.exports = {
  getStatus,
  checkUpdates,
  pull,
  configureRepo,
  validateBranch,
  validateRepoUrl
};
