const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class BotManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.configPath = options.configPath || path.join(__dirname, '../config/bots.json');
    this.maxRestarts = options.maxRestarts || 5;
    this.restartWindowMs = options.restartWindowMs || 60000; // 60 seconds window
    this.maxLogsInMemory = options.maxLogsInMemory || 1000;

    this.bots = new Map(); // id -> BotRuntime
    this.statsInterval = null;
  }

  /**
   * Loads bot configurations from bots.json and initializes internal state.
   */
  async loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`[BotManager] Config file not found at ${this.configPath}, creating default configuration.`);
        const defaultBots = [
          {
            id: "bot-1",
            name: "Role Bot",
            description: "Discord automated role management and reaction roles handler",
            path: "/home/ibra/home-server/bots/bot-1",
            command: "npm",
            args: ["start"],
            autoStart: true,
            env: {}
          },
          {
            id: "bot-2",
            name: "Games Bot",
            description: "Discord minigames, trivia, and leaderboard tracking bot",
            path: "/home/ibra/home-server/bots/bot-2",
            command: "npm",
            args: ["start"],
            autoStart: false,
            env: {}
          },
          {
            id: "bot-3",
            name: "Music & Utility Bot",
            description: "Discord audio streamer and moderation utility tools",
            path: "/home/ibra/home-server/bots/bot-3",
            command: "npm",
            args: ["start"],
            autoStart: false,
            env: {}
          }
        ];
        fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
        fs.writeFileSync(this.configPath, JSON.stringify(defaultBots, null, 2), 'utf8');
      }

      const raw = fs.readFileSync(this.configPath, 'utf8');
      const configs = JSON.parse(raw);

      for (const conf of configs) {
        if (!conf.id) continue;

        // Preserve existing runtime state if bot is already loaded
        const existing = this.bots.get(conf.id);
        if (existing) {
          existing.config = conf;
        } else {
          this.bots.set(conf.id, {
            id: conf.id,
            config: conf,
            status: 'offline', // online, offline, starting, stopping, crashed
            process: null,
            pid: null,
            startedAt: null,
            uptime: 0,
            cpuUsage: 0,
            ramUsageMB: 0,
            restartHistory: [], // array of timestamps
            restartCount: 0,
            lastCrashReason: null,
            logs: [],
            isStoppingManually: false
          });
        }
      }

      console.log(`[BotManager] Loaded ${this.bots.size} bot(s) from config: ${this.configPath}`);
    } catch (err) {
      console.error('[BotManager] Failed to load bots config:', err.message);
    }
  }

  /**
   * Cleans up any orphan processes left over from prior manual starts or crashes.
   */
  async cleanupOrphansForBot(bot) {
    if (!bot || !bot.config || !bot.config.path) return;
    const botDir = bot.config.path;

    return new Promise((resolve) => {
      // Find node/npm processes with working directory or command containing bot path
      exec(`pgrep -f "${botDir}"`, { timeout: 2000 }, (err, stdout) => {
        if (err || !stdout || !stdout.trim()) return resolve();
        const pids = stdout.trim().split(/\s+/).map(p => parseInt(p, 10)).filter(p => !isNaN(p) && p !== process.pid);
        
        for (const p of pids) {
          try {
            process.kill(p, 'SIGTERM');
          } catch {
            // ignore
          }
        }
        resolve();
      });
    });
  }

  /**
   * Initializes BotManager, cleans stale processes, starts auto-start bots, and begins telemetry polling.
   */
  async init() {
    await this.loadConfig();

    // Auto-start configured bots
    for (const [id, bot] of this.bots.entries()) {
      if (bot.config.autoStart) {
        console.log(`[BotManager] Auto-starting bot "${bot.config.name}" (${id})...`);
        this.startBot(id).catch(err => {
          console.error(`[BotManager] Error auto-starting ${id}:`, err.message);
        });
      }
    }

    // Start background process stats collector
    this.startMetricsCollector();
  }

  /**
   * Adds log line to bot's in-memory circular buffer and emits live event.
   */
  appendLog(botId, type, message) {
    const bot = this.bots.get(botId);
    if (!bot) return;

    const timestamp = new Date();
    const timeStr = timestamp.toTimeString().split(' ')[0]; // HH:MM:SS
    const fullIso = timestamp.toISOString();

    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      botId,
      botName: bot.config.name,
      type: type || 'INFO', // INFO, WARN, ERROR, SYSTEM
      time: timeStr,
      timestamp: fullIso,
      message: String(message).replace(/[\r\n]+$/, '') // trim trailing newlines
    };

    bot.logs.push(logEntry);
    if (bot.logs.length > this.maxLogsInMemory) {
      bot.logs.shift();
    }

    this.emit('bot_log', logEntry);
  }

  /**
   * Recursively finds all descendant child PIDs for a given parent PID.
   */
  getChildPids(parentPid) {
    return new Promise((resolve) => {
      if (!parentPid || parentPid <= 0) return resolve([]);

      exec(`pgrep -P ${parentPid}`, { timeout: 1500 }, (err, stdout) => {
        if (err || !stdout || !stdout.trim()) {
          return resolve([]);
        }

        const directChildren = stdout.trim().split(/\s+/).map(p => parseInt(p, 10)).filter(p => !isNaN(p));
        if (directChildren.length === 0) return resolve([]);

        // Find grandchildren recursively
        Promise.all(directChildren.map(childPid => this.getChildPids(childPid)))
          .then(grandChildrenArrays => {
            const allDescendants = [...directChildren];
            for (const list of grandChildrenArrays) {
              allDescendants.push(...list);
            }
            resolve(Array.from(new Set(allDescendants)));
          })
          .catch(() => resolve(directChildren));
      });
    });
  }

  /**
   * Starts a Discord bot by spawning a real child process with its own process group (detached: true).
   */
  async startBot(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot with ID "${id}" does not exist in configuration.`);
    }

    // Prevent duplicate spawning if already online, starting, or active process exists
    if (bot.status === 'online' || bot.status === 'starting' || bot.process) {
      return { success: true, message: `Bot ${bot.config.name} is already ${bot.status}.` };
    }

    const botDir = bot.config.path;
    const exists = fs.existsSync(botDir);

    // If the bot directory does not exist on filesystem, reject immediately and remain OFFLINE
    if (!exists) {
      bot.status = 'offline';
      bot.process = null;
      bot.pid = null;
      bot.startedAt = null;
      bot.uptime = 0;
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      const errorMsg = `Bot directory not found: ${botDir}`;
      this.appendLog(id, 'ERROR', errorMsg);
      this.emitStatus(id);
      throw new Error(errorMsg);
    }

    bot.status = 'starting';
    bot.isStoppingManually = false;
    bot.lastCrashReason = null;
    this.emitStatus(id);
    this.appendLog(id, 'SYSTEM', `Starting process for "${bot.config.name}" in ${botDir}...`);

    try {
      const command = bot.config.command || 'npm';
      const args = bot.config.args || ['start'];
      const env = { ...process.env, ...(bot.config.env || {}) };

      // Spawn real process with detached: true (creates new process group leader)
      // shell: false is enforced by omitting shell / passing command directly
      const child = spawn(command, args, {
        cwd: botDir,
        env,
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!child || !child.pid) {
        throw new Error(`Failed to spawn process for bot "${bot.config.name}".`);
      }

      bot.process = child;
      bot.pid = child.pid;
      bot.startedAt = Date.now();
      bot.status = 'online';
      this.emitStatus(id);
      this.appendLog(id, 'SYSTEM', `Process spawned successfully with PID ${child.pid} (Process Group: -${child.pid})`);

      // Handle standard output
      child.stdout.on('data', (data) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const isWarn = /warn|warning/i.test(line);
            this.appendLog(id, isWarn ? 'WARN' : 'INFO', line);
          }
        }
      });

      // Handle standard error
      child.stderr.on('data', (data) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.appendLog(id, 'ERROR', line);
          }
        }
      });

      // Handle process close / exit
      child.on('close', (code, signal) => {
        this.handleProcessExit(id, code, signal);
      });

      child.on('error', (err) => {
        this.appendLog(id, 'ERROR', `Spawn error: ${err.message}`);
        this.handleProcessExit(id, 1, null, err.message);
      });

      return { success: true, message: `Bot ${bot.config.name} started successfully (PID: ${child.pid}).` };
    } catch (err) {
      bot.status = 'crashed';
      bot.process = null;
      bot.pid = null;
      bot.startedAt = null;
      bot.lastCrashReason = err.message;
      this.emitStatus(id);
      this.appendLog(id, 'ERROR', `Failed to start bot: ${err.message}`);
      throw err;
    }
  }

  /**
   * Safely sends a signal to a process group and specific PIDs, handling ESRCH gracefully.
   */
  killTargetProcesses(mainPid, childPids = [], signal = 'SIGTERM') {
    // 1. Kill process group
    if (mainPid && mainPid > 0) {
      try {
        process.kill(-mainPid, signal);
      } catch (err) {
        if (err.code !== 'ESRCH') {
          try {
            process.kill(mainPid, signal);
          } catch {
            // already dead
          }
        }
      }
    }

    // 2. Kill all child/descendant PIDs explicitly (e.g. node index.js spawned by npm)
    for (const pid of childPids) {
      if (pid && pid > 0 && pid !== process.pid) {
        try {
          process.kill(pid, signal);
        } catch {
          // already dead
        }
      }
    }
  }

  /**
   * Checks if any PID in a list is still running.
   */
  isAnyPidAlive(pids = []) {
    for (const pid of pids) {
      if (!pid || pid <= 0 || pid === process.pid) continue;
      try {
        process.kill(pid, 0);
        return true; // Still alive
      } catch (err) {
        if (err.code === 'EPERM') return true; // Exists but no permission
        // ESRCH means process does not exist
      }
    }
    return false;
  }

  /**
   * Stops a running Discord bot process, its entire process group, and all child processes completely.
   * Confirms termination before setting status to offline.
   */
  async stopBot(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot with ID "${id}" does not exist.`);
    }

    if (bot.status === 'offline' && !bot.process && !bot.pid) {
      return { success: true, message: `Bot is already offline.` };
    }

    bot.isStoppingManually = true;
    bot.status = 'stopping';
    this.emitStatus(id);

    const targetPid = bot.pid;
    const targetProcess = bot.process;
    this.appendLog(id, 'SYSTEM', `Stopping bot "${bot.config.name}" (PID ${targetPid || 'N/A'})...`);

    if (!targetPid && !targetProcess) {
      bot.status = 'offline';
      bot.pid = null;
      bot.startedAt = null;
      bot.uptime = 0;
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      this.emitStatus(id);
      this.appendLog(id, 'SYSTEM', `Bot stopped.`);
      return { success: true, message: `Bot ${bot.config.name} stopped.` };
    }

    // Discover all child/descendant PIDs (e.g. node index.js) before sending signals
    const childPids = await this.getChildPids(targetPid);
    const allPidsToKill = [targetPid, ...childPids].filter(Boolean);

    return new Promise((resolve) => {
      let resolved = false;

      const finishCleanup = (code, signal) => {
        if (resolved) return;
        resolved = true;
        clearInterval(pollInterval);
        clearTimeout(forceKillTimer);

        bot.status = 'offline';
        bot.process = null;
        bot.pid = null;
        bot.startedAt = null;
        bot.uptime = 0;
        bot.cpuUsage = 0;
        bot.ramUsageMB = 0;
        bot.isStoppingManually = false;

        this.emitStatus(id);
        this.appendLog(id, 'SYSTEM', `Process and all descendants terminated cleanly (Exit: ${code !== null && code !== undefined ? code : signal || 0}).`);
        resolve({ success: true, message: `Bot ${bot.config.name} stopped successfully.` });
      };

      // 1. Send SIGTERM to process group and all descendants
      this.killTargetProcesses(targetPid, childPids, 'SIGTERM');

      // 2. Poll every 250ms to confirm if processes have exited
      const pollInterval = setInterval(() => {
        if (!this.isAnyPidAlive(allPidsToKill)) {
          finishCleanup(0, 'SIGTERM');
        }
      }, 250);

      // 3. Fallback: If still alive after 3.5 seconds, send SIGKILL to all PIDs
      const forceKillTimer = setTimeout(() => {
        if (!resolved) {
          this.appendLog(id, 'WARN', `Process group did not exit within 3.5s, sending SIGKILL to all child processes.`);
          this.killTargetProcesses(targetPid, childPids, 'SIGKILL');
          setTimeout(() => finishCleanup(null, 'SIGKILL'), 600);
        }
      }, 3500);

      if (targetProcess) {
        targetProcess.once('exit', (code, signal) => finishCleanup(code, signal));
        targetProcess.once('close', (code, signal) => finishCleanup(code, signal));
      }
    });
  }

  /**
   * Restarts a Discord bot process, guaranteeing complete termination before respawning.
   */
  async restartBot(id) {
    this.appendLog(id, 'SYSTEM', `Restart command received.`);
    await this.stopBot(id);
    // Grace delay to release sockets/files cleanly
    await new Promise(r => setTimeout(r, 800));
    return this.startBot(id);
  }

  /**
   * Stops all running bots cleanly (used during server shutdown).
   */
  async stopAll() {
    const promises = [];
    for (const [id, bot] of this.bots.entries()) {
      if (bot.status === 'online' || bot.status === 'starting' || bot.pid) {
        promises.push(this.stopBot(id).catch(e => console.error(`[BotManager] Error stopping ${id}:`, e.message)));
      }
    }
    await Promise.all(promises);
  }

  /**
   * Handles process termination, crash detection, and crash rate-limiting protection.
   */
  handleProcessExit(id, code, signal, explicitError = null) {
    const bot = this.bots.get(id);
    if (!bot) return;

    const wasManual = bot.isStoppingManually;
    bot.process = null;
    bot.pid = null;
    bot.cpuUsage = 0;
    bot.ramUsageMB = 0;

    if (wasManual || code === 0 || signal === 'SIGTERM') {
      bot.status = 'offline';
      bot.startedAt = null;
      bot.uptime = 0;
      this.emitStatus(id);
      this.appendLog(id, 'SYSTEM', `Bot stopped (Exit code: ${code !== null ? code : signal || 0})`);
      return;
    }

    // Unexpected exit / Crash
    const now = Date.now();
    bot.lastCrashReason = explicitError || `Process exited unexpectedly with code ${code} (Signal: ${signal || 'none'})`;
    bot.status = 'crashed';
    bot.startedAt = null;
    bot.uptime = 0;
    this.appendLog(id, 'ERROR', `CRASH DETECTED: ${bot.lastCrashReason}`);

    // Filter restart history within window
    bot.restartHistory = bot.restartHistory.filter(t => (now - t) < this.restartWindowMs);
    bot.restartHistory.push(now);
    bot.restartCount++;

    this.emitStatus(id);

    // Restart Protection Check: maxRestarts in restartWindowMs
    if (bot.restartHistory.length > this.maxRestarts) {
      const windowSec = Math.round(this.restartWindowMs / 1000);
      const errMsg = `Restart protection activated: Crashed ${bot.restartHistory.length} times in ${windowSec}s (Limit: ${this.maxRestarts}). Auto-restart halted.`;
      bot.lastCrashReason = errMsg;
      this.appendLog(id, 'ERROR', errMsg);
      this.emitStatus(id);
      return;
    }

    // Attempt automatic restart
    const delayMs = 3000;
    this.appendLog(id, 'WARN', `Auto-restarting in ${delayMs / 1000}s (Attempt ${bot.restartHistory.length}/${this.maxRestarts})...`);

    setTimeout(() => {
      if (bot.status === 'crashed') {
        this.startBot(id).catch(err => {
          this.appendLog(id, 'ERROR', `Auto-restart failed: ${err.message}`);
        });
      }
    }, delayMs);
  }

  /**
   * Broadcasts status changes to listeners.
   */
  emitStatus(id) {
    const bot = this.bots.get(id);
    if (!bot) return;

    const data = this.getBotData(id);
    this.emit('bot_status', data);
  }

  /**
   * Formats sanitized bot summary for API/Socket consumers.
   */
  getBotData(id) {
    const bot = this.bots.get(id);
    if (!bot) return null;

    let uptime = 0;
    if (bot.status === 'online' && bot.startedAt) {
      uptime = Math.floor((Date.now() - bot.startedAt) / 1000);
    }

    return {
      id: bot.id,
      name: bot.config.name,
      description: bot.config.description || '',
      path: bot.config.path,
      command: bot.config.command,
      args: bot.config.args,
      autoStart: !!bot.config.autoStart,
      status: bot.status,
      pid: bot.pid,
      uptime: uptime,
      startedAt: bot.startedAt ? new Date(bot.startedAt).toISOString() : null,
      cpuUsage: bot.cpuUsage,
      ramUsageMB: bot.ramUsageMB,
      restartCount: bot.restartCount,
      lastCrashReason: bot.lastCrashReason,
      logsCount: bot.logs.length
    };
  }

  /**
   * Returns list of all bots.
   */
  getAllBots() {
    const list = [];
    for (const id of this.bots.keys()) {
      const data = this.getBotData(id);
      if (data) list.push(data);
    }
    return list;
  }

  /**
   * Returns bot logs.
   */
  getBotLogs(id, limit = 200) {
    const bot = this.bots.get(id);
    if (!bot) return [];
    return bot.logs.slice(-limit);
  }

  /**
   * Measures real CPU & RAM for running bot processes using the Linux `ps` command.
   */
  async updateProcessMetrics(bot) {
    if (!bot.pid || bot.status !== 'online') {
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      return;
    }

    return new Promise((resolve) => {
      // Execute ps command for exact PID: %cpu and rss in KB
      exec(`ps -p ${bot.pid} -o %cpu,rss --no-headers`, { timeout: 1500 }, (error, stdout) => {
        if (error || !stdout || !stdout.trim()) {
          bot.cpuUsage = 0;
          bot.ramUsageMB = 0;
          return resolve();
        }

        try {
          const parts = stdout.trim().split(/\s+/);
          if (parts.length >= 2) {
            const cpu = parseFloat(parts[0]) || 0;
            const rssKb = parseInt(parts[1], 10) || 0;
            bot.cpuUsage = parseFloat(cpu.toFixed(1));
            bot.ramUsageMB = Math.round(rssKb / 1024);
          }
        } catch {
          bot.cpuUsage = 0;
          bot.ramUsageMB = 0;
        }

        resolve();
      });
    });
  }

  /**
   * Periodically collects real CPU & RAM for running bot processes.
   */
  startMetricsCollector() {
    if (this.statsInterval) clearInterval(this.statsInterval);

    this.statsInterval = setInterval(async () => {
      const metricPromises = [];

      for (const bot of this.bots.values()) {
        if (bot.status === 'online') {
          if (bot.startedAt) {
            bot.uptime = Math.floor((Date.now() - bot.startedAt) / 1000);
          }
          if (bot.pid) {
            metricPromises.push(this.updateProcessMetrics(bot));
          }
        } else {
          bot.uptime = 0;
          bot.cpuUsage = 0;
          bot.ramUsageMB = 0;
        }
      }

      await Promise.all(metricPromises);
      this.emit('bots_metrics', this.getAllBots());
    }, 2500);
  }
}

module.exports = BotManager;
