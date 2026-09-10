<<<<<<< HEAD
const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
=======
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

class BotManager extends EventEmitter {
  constructor(options = {}) {
    super();
<<<<<<< HEAD
    this.configPath =
      options.configPath || path.join(__dirname, "../config/bots.json");
=======
    this.configPath = options.configPath || path.join(__dirname, '../config/bots.json');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
        console.warn(
          `[BotManager] Config file not found at ${this.configPath}, creating default configuration.`,
        );
=======
        console.warn(`[BotManager] Config file not found at ${this.configPath}, creating default configuration.`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        const defaultBots = [
          {
            id: "bot-1",
            name: "Role Bot",
<<<<<<< HEAD
            description:
              "Discord automated role management and reaction roles handler",
=======
            description: "Discord automated role management and reaction roles handler",
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            path: "/home/ibra/home-server/bots/bot-1",
            command: "npm",
            args: ["start"],
            autoStart: true,
<<<<<<< HEAD
            env: {},
=======
            env: {}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          },
          {
            id: "bot-2",
            name: "Games Bot",
<<<<<<< HEAD
            description:
              "Discord minigames, trivia, and leaderboard tracking bot",
=======
            description: "Discord minigames, trivia, and leaderboard tracking bot",
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            path: "/home/ibra/home-server/bots/bot-2",
            command: "npm",
            args: ["start"],
            autoStart: false,
<<<<<<< HEAD
            env: {},
=======
            env: {}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          },
          {
            id: "bot-3",
            name: "Music & Utility Bot",
            description: "Discord audio streamer and moderation utility tools",
            path: "/home/ibra/home-server/bots/bot-3",
            command: "npm",
            args: ["start"],
            autoStart: false,
<<<<<<< HEAD
            env: {},
          },
        ];
        fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
        fs.writeFileSync(
          this.configPath,
          JSON.stringify(defaultBots, null, 2),
          "utf8",
        );
      }

      const raw = fs.readFileSync(this.configPath, "utf8");
=======
            env: {}
          }
        ];
        fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
        fs.writeFileSync(this.configPath, JSON.stringify(defaultBots, null, 2), 'utf8');
      }

      const raw = fs.readFileSync(this.configPath, 'utf8');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
            status: "offline", // online, offline, starting, stopping, crashed
=======
            status: 'offline', // online, offline, starting, stopping, crashed
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
            isStoppingManually: false,
=======
            isStoppingManually: false
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          });
        }
      }

<<<<<<< HEAD
      console.log(
        `[BotManager] Loaded ${this.bots.size} bot(s) from config: ${this.configPath}`,
      );
    } catch (err) {
      console.error("[BotManager] Failed to load bots config:", err.message);
=======
      console.log(`[BotManager] Loaded ${this.bots.size} bot(s) from config: ${this.configPath}`);
    } catch (err) {
      console.error('[BotManager] Failed to load bots config:', err.message);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    }
  }

  /**
   * Persists the current in-memory bot configurations back to the config JSON file on disk.
   */
  persistConfig() {
    try {
<<<<<<< HEAD
      const configs = Array.from(this.bots.values()).map((bot) => bot.config);
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(configs, null, 2),
        "utf8",
      );
    } catch (err) {
      console.error("[BotManager] Failed to persist bots config:", err.message);
      throw new Error(
        `Failed to save bot configuration to disk: ${err.message}`,
      );
=======
      const configs = Array.from(this.bots.values()).map(bot => bot.config);
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2), 'utf8');
    } catch (err) {
      console.error('[BotManager] Failed to persist bots config:', err.message);
      throw new Error(`Failed to save bot configuration to disk: ${err.message}`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    }
  }

  /**
   * Creates a brand new bot entry (from the website UI), persists it to bots.json,
   * and registers it in memory so it is immediately manageable.
   */
  addBot(conf) {
    if (!conf || !conf.id) {
<<<<<<< HEAD
      const err = new Error("Bot ID is required.");
=======
      const err = new Error('Bot ID is required.');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      err.status = 400;
      throw err;
    }

    if (this.bots.has(conf.id)) {
      const err = new Error(`A bot with ID "${conf.id}" already exists.`);
      err.status = 400;
      throw err;
    }

<<<<<<< HEAD
    const defaultBotsBase =
      process.env.BOTS_DIR || path.resolve(__dirname, "../../bots");
    let resolvedPath = conf.path;
    if (!resolvedPath || !resolvedPath.trim()) {
      resolvedPath = path.join(defaultBotsBase, conf.id);
    } else if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.resolve(defaultBotsBase, resolvedPath);
    }

    const cleanConfig = {
      id: conf.id,
      name: conf.name || conf.id,
      description: conf.description || "",
      path: resolvedPath,
      command: conf.command || "npm",
      args: Array.isArray(conf.args) ? conf.args : ["start"],
      autoStart: !!conf.autoStart,
      env: conf.env && typeof conf.env === "object" ? conf.env : {},
    };

    this.bots.set(conf.id, {
      id: conf.id,
      config: cleanConfig,
      status: "offline",
=======
    const cleanConfig = {
      id: conf.id,
      name: conf.name || conf.id,
      description: conf.description || '',
      path: conf.path,
      command: conf.command || 'npm',
      args: Array.isArray(conf.args) ? conf.args : ['start'],
      autoStart: !!conf.autoStart,
      env: (conf.env && typeof conf.env === 'object') ? conf.env : {}
    };

    if (!cleanConfig.path) {
      const err = new Error('Bot directory path is required.');
      err.status = 400;
      throw err;
    }

    this.bots.set(conf.id, {
      id: conf.id,
      config: cleanConfig,
      status: 'offline',
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      process: null,
      pid: null,
      startedAt: null,
      uptime: 0,
      cpuUsage: 0,
      ramUsageMB: 0,
      restartHistory: [],
      restartCount: 0,
      lastCrashReason: null,
      logs: [],
<<<<<<< HEAD
      isStoppingManually: false,
=======
      isStoppingManually: false
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    });

    // Ensure the bot's working directory exists so it's immediately usable in the File Manager
    try {
      if (!fs.existsSync(cleanConfig.path)) {
        fs.mkdirSync(cleanConfig.path, { recursive: true });
      }
    } catch (err) {
<<<<<<< HEAD
      console.warn(
        `[BotManager] Could not create bot directory ${cleanConfig.path}:`,
        err.message,
      );
    }

    this.persistConfig();
    this.appendLog(
      conf.id,
      "SYSTEM",
      `Bot "${cleanConfig.name}" created via web dashboard.`,
    );

    if (cleanConfig.autoStart) {
      this.startBot(conf.id).catch((err) => {
        console.error(
          `[BotManager] Error auto-starting newly created bot ${conf.id}:`,
          err.message,
        );
=======
      console.warn(`[BotManager] Could not create bot directory ${cleanConfig.path}:`, err.message);
    }

    this.persistConfig();
    this.appendLog(conf.id, 'SYSTEM', `Bot "${cleanConfig.name}" created via web dashboard.`);

    if (cleanConfig.autoStart) {
      this.startBot(conf.id).catch(err => {
        console.error(`[BotManager] Error auto-starting newly created bot ${conf.id}:`, err.message);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      });
    }

    return this.getBotData(conf.id);
  }

  /**
   * Updates an existing bot's configuration (name, path, command, args, autoStart, env, description).
   * Does not affect a currently running process until the next start/restart.
   */
  updateBot(id, updates = {}) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const nextConfig = { ...bot.config };

<<<<<<< HEAD
    if (updates.name !== undefined)
      nextConfig.name = updates.name || nextConfig.name;
    if (updates.description !== undefined)
      nextConfig.description = updates.description;
    if (updates.path !== undefined && updates.path)
      nextConfig.path = updates.path;
    if (updates.command !== undefined && updates.command)
      nextConfig.command = updates.command;
    if (updates.args !== undefined)
      nextConfig.args = Array.isArray(updates.args)
        ? updates.args
        : nextConfig.args;
    if (updates.autoStart !== undefined)
      nextConfig.autoStart = !!updates.autoStart;
    if (updates.env !== undefined && typeof updates.env === "object")
      nextConfig.env = updates.env;
=======
    if (updates.name !== undefined) nextConfig.name = updates.name || nextConfig.name;
    if (updates.description !== undefined) nextConfig.description = updates.description;
    if (updates.path !== undefined && updates.path) nextConfig.path = updates.path;
    if (updates.command !== undefined && updates.command) nextConfig.command = updates.command;
    if (updates.args !== undefined) nextConfig.args = Array.isArray(updates.args) ? updates.args : nextConfig.args;
    if (updates.autoStart !== undefined) nextConfig.autoStart = !!updates.autoStart;
    if (updates.env !== undefined && typeof updates.env === 'object') nextConfig.env = updates.env;
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

    bot.config = nextConfig;

    try {
      if (!fs.existsSync(nextConfig.path)) {
        fs.mkdirSync(nextConfig.path, { recursive: true });
      }
    } catch (err) {
<<<<<<< HEAD
      console.warn(
        `[BotManager] Could not create bot directory ${nextConfig.path}:`,
        err.message,
      );
    }

    this.persistConfig();
    this.appendLog(
      id,
      "SYSTEM",
      `Bot configuration updated via web dashboard.`,
    );
=======
      console.warn(`[BotManager] Could not create bot directory ${nextConfig.path}:`, err.message);
    }

    this.persistConfig();
    this.appendLog(id, 'SYSTEM', `Bot configuration updated via web dashboard.`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    this.emitStatus(id);

    return this.getBotData(id);
  }

  /**
   * Permanently removes a bot from configuration. Stops the process first if running.
   */
  async removeBot(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

<<<<<<< HEAD
    if (bot.status === "online" || bot.status === "starting" || bot.pid) {
=======
    if (bot.status === 'online' || bot.status === 'starting' || bot.pid) {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      await this.stopBot(id);
    }

    this.bots.delete(id);
    this.persistConfig();
<<<<<<< HEAD
    this.emit("bot_removed", { id });

    return {
      success: true,
      message: `Bot "${bot.config.name}" removed successfully.`,
    };
  }

  /**
   * Retrieves merged environment variables for a bot (from config and .env file).
   */
  getBotEnv(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const envMap = { ...(bot.config.env || {}) };
    const botDir = bot.config.path;

    // Read .env file if it exists and parse simple KEY=VALUE pairs
    try {
      const envPath = path.join(botDir, ".env");
      if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, "utf8");
        const lines = raw.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const k = trimmed.substring(0, eqIdx).trim();
            const v = trimmed
              .substring(eqIdx + 1)
              .trim()
              .replace(/^["']|["']$/g, "");
            envMap[k] = v;
          }
        }
      }
    } catch (err) {
      console.warn(
        `[BotManager] Could not read .env file for bot ${id}:`,
        err.message,
      );
    }

    return envMap;
  }

  /**
   * Updates bot environment variables in memory, config JSON, and .env file.
   */
  setBotEnv(id, envVars = {}) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

    bot.config.env = { ...envVars };
    this.persistConfig();

    const botDir = bot.config.path;
    try {
      if (!fs.existsSync(botDir)) {
        fs.mkdirSync(botDir, { recursive: true });
      }
      const envPath = path.join(botDir, ".env");
      const lines = Object.entries(envVars).map(([k, v]) => `${k}=${v}`);
      fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf8");
    } catch (err) {
      console.warn(
        `[BotManager] Error writing .env file for bot ${id}:`,
        err.message,
      );
    }

    this.appendLog(id, "SYSTEM", "Environment variables updated.");
    this.emitStatus(id);

    return {
      success: true,
      message: "Environment variables saved successfully.",
      env: bot.config.env,
    };
  }

  /**
   * Installs dependencies for a bot (runs npm install or pip install).
   * Streams live output to bot's logs.
   */
  async installDependencies(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const botDir = bot.config.path;
    if (!fs.existsSync(botDir)) {
      throw new Error(`Bot directory not found: ${botDir}`);
    }

    const hasPackageJson = fs.existsSync(path.join(botDir, "package.json"));
    const hasRequirements = fs.existsSync(
      path.join(botDir, "requirements.txt"),
    );

    let cmd = "";
    let args = [];

    if (hasPackageJson) {
      cmd = "npm";
      args = ["install"];
    } else if (hasRequirements) {
      cmd = "pip3";
      args = ["install", "-r", "requirements.txt"];
    } else {
      throw new Error(
        "No package.json or requirements.txt found in bot directory.",
      );
    }

    this.appendLog(
      id,
      "SYSTEM",
      `Starting dependency installation: ${cmd} ${args.join(" ")} in ${botDir}...`,
    );

    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, {
        cwd: botDir,
        shell: true,
        env: { ...process.env, ...(bot.config.env || {}) },
      });

      child.stdout.on("data", (data) => {
        const lines = data.toString().split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            this.appendLog(id, "INFO", line);
          }
        }
      });

      child.stderr.on("data", (data) => {
        const lines = data.toString().split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            const isWarn = /warn|notice|deprecated/i.test(line);
            this.appendLog(id, isWarn ? "WARN" : "ERROR", line);
          }
        }
      });

      child.on("close", (code) => {
        if (code === 0) {
          this.appendLog(
            id,
            "SYSTEM",
            "Dependency installation completed successfully.",
          );
          resolve({
            success: true,
            message: "Dependencies installed successfully.",
          });
        } else {
          const errMsg = `Dependency installation failed with exit code ${code}.`;
          this.appendLog(id, "ERROR", errMsg);
          reject(new Error(errMsg));
        }
      });

      child.on("error", (err) => {
        this.appendLog(id, "ERROR", `Failed to run ${cmd}: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Writes input directly to a running bot process's stdin.
   */
  sendStdin(id, input) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

    if (!bot.process || !bot.process.stdin || bot.status !== "online") {
      const err = new Error(
        `Bot "${bot.config.name}" is not currently running. Start the bot first to send stdin.`,
      );
      err.status = 400;
      throw err;
    }

    const cleanInput = String(input || "").replace(/[\r\n]+$/, "");
    this.appendLog(id, "SYSTEM", `> ${cleanInput}`);

    try {
      bot.process.stdin.write(cleanInput + "\n");
      return {
        success: true,
        message: `Sent command to ${bot.config.name} stdin.`,
      };
    } catch (err) {
      this.appendLog(id, "ERROR", `Failed to write to stdin: ${err.message}`);
      throw new Error(`Stdin write failed: ${err.message}`);
    }
  }

  /**
   * Executes a shell command inside the bot's working directory and streams output to logs.
   */
  async executeCommand(id, commandString) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const botDir = bot.config.path;
    if (!fs.existsSync(botDir)) {
      throw new Error(`Bot directory not found: ${botDir}`);
    }

    const cleanCmd = String(commandString || "").trim();
    if (!cleanCmd) {
      throw new Error("Command cannot be empty.");
    }

    this.appendLog(id, "SYSTEM", `$ ${cleanCmd}`);

    return new Promise((resolve, reject) => {
      const child = spawn(cleanCmd, [], {
        cwd: botDir,
        shell: true,
        env: { ...process.env, ...(bot.config.env || {}) },
      });

      child.stdout.on("data", (data) => {
        const lines = data.toString().split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            this.appendLog(id, "INFO", line);
          }
        }
      });

      child.stderr.on("data", (data) => {
        const lines = data.toString().split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            const isWarn = /warn|notice|deprecated/i.test(line);
            this.appendLog(id, isWarn ? "WARN" : "ERROR", line);
          }
        }
      });

      child.on("close", (code) => {
        this.appendLog(
          id,
          "SYSTEM",
          `[Command finished with exit code ${code !== null ? code : 0}]`,
        );
        resolve({
          success: code === 0,
          exitCode: code,
          message: `Command finished with exit code ${code !== null ? code : 0}`,
        });
      });

      child.on("error", (err) => {
        this.appendLog(id, "ERROR", `Execution error: ${err.message}`);
        reject(err);
      });
    });
=======
    this.emit('bot_removed', { id });

    return { success: true, message: `Bot "${bot.config.name}" removed successfully.` };
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
        const pids = stdout
          .trim()
          .split(/\s+/)
          .map((p) => parseInt(p, 10))
          .filter((p) => !isNaN(p) && p !== process.pid);

        for (const p of pids) {
          try {
            process.kill(p, "SIGTERM");
=======
        const pids = stdout.trim().split(/\s+/).map(p => parseInt(p, 10)).filter(p => !isNaN(p) && p !== process.pid);
        
        for (const p of pids) {
          try {
            process.kill(p, 'SIGTERM');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
        console.log(
          `[BotManager] Auto-starting bot "${bot.config.name}" (${id})...`,
        );
        this.startBot(id).catch((err) => {
=======
        console.log(`[BotManager] Auto-starting bot "${bot.config.name}" (${id})...`);
        this.startBot(id).catch(err => {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
    const timeStr = timestamp.toTimeString().split(" ")[0]; // HH:MM:SS
=======
    const timeStr = timestamp.toTimeString().split(' ')[0]; // HH:MM:SS
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    const fullIso = timestamp.toISOString();

    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      botId,
      botName: bot.config.name,
<<<<<<< HEAD
      type: type || "INFO", // INFO, WARN, ERROR, SYSTEM
      time: timeStr,
      timestamp: fullIso,
      message: String(message).replace(/[\r\n]+$/, ""), // trim trailing newlines
=======
      type: type || 'INFO', // INFO, WARN, ERROR, SYSTEM
      time: timeStr,
      timestamp: fullIso,
      message: String(message).replace(/[\r\n]+$/, '') // trim trailing newlines
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    };

    bot.logs.push(logEntry);
    if (bot.logs.length > this.maxLogsInMemory) {
      bot.logs.shift();
    }

<<<<<<< HEAD
    this.emit("bot_log", logEntry);
=======
    this.emit('bot_log', logEntry);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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

<<<<<<< HEAD
        const directChildren = stdout
          .trim()
          .split(/\s+/)
          .map((p) => parseInt(p, 10))
          .filter((p) => !isNaN(p));
        if (directChildren.length === 0) return resolve([]);

        // Find grandchildren recursively
        Promise.all(
          directChildren.map((childPid) => this.getChildPids(childPid)),
        )
          .then((grandChildrenArrays) => {
=======
        const directChildren = stdout.trim().split(/\s+/).map(p => parseInt(p, 10)).filter(p => !isNaN(p));
        if (directChildren.length === 0) return resolve([]);

        // Find grandchildren recursively
        Promise.all(directChildren.map(childPid => this.getChildPids(childPid)))
          .then(grandChildrenArrays => {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
    if (bot.status === "online" || bot.status === "starting" || bot.process) {
      return {
        success: true,
        message: `Bot ${bot.config.name} is already ${bot.status}.`,
      };
=======
    if (bot.status === 'online' || bot.status === 'starting' || bot.process) {
      return { success: true, message: `Bot ${bot.config.name} is already ${bot.status}.` };
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    }

    const botDir = bot.config.path;
    const exists = fs.existsSync(botDir);

    // If the bot directory does not exist on filesystem, reject immediately and remain OFFLINE
    if (!exists) {
<<<<<<< HEAD
      bot.status = "offline";
=======
      bot.status = 'offline';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      bot.process = null;
      bot.pid = null;
      bot.startedAt = null;
      bot.uptime = 0;
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      const errorMsg = `Bot directory not found: ${botDir}`;
<<<<<<< HEAD
      this.appendLog(id, "ERROR", errorMsg);
=======
      this.appendLog(id, 'ERROR', errorMsg);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      this.emitStatus(id);
      throw new Error(errorMsg);
    }

<<<<<<< HEAD
    bot.status = "starting";
    bot.isStoppingManually = false;
    bot.lastCrashReason = null;
    this.emitStatus(id);
    this.appendLog(
      id,
      "SYSTEM",
      `Starting process for "${bot.config.name}" in ${botDir}...`,
    );

    try {
      const command = bot.config.command || "npm";
      const args = bot.config.args || ["start"];
=======
    bot.status = 'starting';
    bot.isStoppingManually = false;
    bot.lastCrashReason = null;
    this.emitStatus(id);
    this.appendLog(id, 'SYSTEM', `Starting process for "${bot.config.name}" in ${botDir}...`);

    try {
      const command = bot.config.command || 'npm';
      const args = bot.config.args || ['start'];
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      const env = { ...process.env, ...(bot.config.env || {}) };

      // Spawn real process with detached: true (creates new process group leader)
      // shell: false is enforced by omitting shell / passing command directly
      const child = spawn(command, args, {
        cwd: botDir,
        env,
        detached: true,
<<<<<<< HEAD
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (!child || !child.pid) {
        throw new Error(
          `Failed to spawn process for bot "${bot.config.name}".`,
        );
=======
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!child || !child.pid) {
        throw new Error(`Failed to spawn process for bot "${bot.config.name}".`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      }

      bot.process = child;
      bot.pid = child.pid;
      bot.startedAt = Date.now();
<<<<<<< HEAD
      bot.status = "online";
      this.emitStatus(id);
      this.appendLog(
        id,
        "SYSTEM",
        `Process spawned successfully with PID ${child.pid} (Process Group: -${child.pid})`,
      );

      // Handle standard output
      child.stdout.on("data", (data) => {
        const text = data.toString();
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            const isWarn = /warn|warning/i.test(line);
            this.appendLog(id, isWarn ? "WARN" : "INFO", line);
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          }
        }
      });

      // Handle standard error
<<<<<<< HEAD
      child.stderr.on("data", (data) => {
        const text = data.toString();
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            this.appendLog(id, "ERROR", line);
=======
      child.stderr.on('data', (data) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.appendLog(id, 'ERROR', line);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          }
        }
      });

      // Handle process close / exit
<<<<<<< HEAD
      child.on("close", (code, signal) => {
        this.handleProcessExit(id, code, signal);
      });

      child.on("error", (err) => {
        this.appendLog(id, "ERROR", `Spawn error: ${err.message}`);
        this.handleProcessExit(id, 1, null, err.message);
      });

      return {
        success: true,
        message: `Bot ${bot.config.name} started successfully (PID: ${child.pid}).`,
      };
    } catch (err) {
      bot.status = "crashed";
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      bot.process = null;
      bot.pid = null;
      bot.startedAt = null;
      bot.lastCrashReason = err.message;
      this.emitStatus(id);
<<<<<<< HEAD
      this.appendLog(id, "ERROR", `Failed to start bot: ${err.message}`);
=======
      this.appendLog(id, 'ERROR', `Failed to start bot: ${err.message}`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      throw err;
    }
  }

  /**
   * Safely sends a signal to a process group and specific PIDs, handling ESRCH gracefully.
   */
<<<<<<< HEAD
  killTargetProcesses(mainPid, childPids = [], signal = "SIGTERM") {
=======
  killTargetProcesses(mainPid, childPids = [], signal = 'SIGTERM') {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    // 1. Kill process group
    if (mainPid && mainPid > 0) {
      try {
        process.kill(-mainPid, signal);
      } catch (err) {
<<<<<<< HEAD
        if (err.code !== "ESRCH") {
=======
        if (err.code !== 'ESRCH') {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
        if (err.code === "EPERM") return true; // Exists but no permission
=======
        if (err.code === 'EPERM') return true; // Exists but no permission
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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

<<<<<<< HEAD
    if (bot.status === "offline" && !bot.process && !bot.pid) {
=======
    if (bot.status === 'offline' && !bot.process && !bot.pid) {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      return { success: true, message: `Bot is already offline.` };
    }

    bot.isStoppingManually = true;
<<<<<<< HEAD
    bot.status = "stopping";
=======
    bot.status = 'stopping';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    this.emitStatus(id);

    const targetPid = bot.pid;
    const targetProcess = bot.process;
<<<<<<< HEAD
    this.appendLog(
      id,
      "SYSTEM",
      `Stopping bot "${bot.config.name}" (PID ${targetPid || "N/A"})...`,
    );

    if (!targetPid && !targetProcess) {
      bot.status = "offline";
=======
    this.appendLog(id, 'SYSTEM', `Stopping bot "${bot.config.name}" (PID ${targetPid || 'N/A'})...`);

    if (!targetPid && !targetProcess) {
      bot.status = 'offline';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      bot.pid = null;
      bot.startedAt = null;
      bot.uptime = 0;
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      this.emitStatus(id);
<<<<<<< HEAD
      this.appendLog(id, "SYSTEM", `Bot stopped.`);
=======
      this.appendLog(id, 'SYSTEM', `Bot stopped.`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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

<<<<<<< HEAD
        bot.status = "offline";
=======
        bot.status = 'offline';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        bot.process = null;
        bot.pid = null;
        bot.startedAt = null;
        bot.uptime = 0;
        bot.cpuUsage = 0;
        bot.ramUsageMB = 0;
        bot.isStoppingManually = false;

        this.emitStatus(id);
<<<<<<< HEAD
        this.appendLog(
          id,
          "SYSTEM",
          `Process and all descendants terminated cleanly (Exit: ${code !== null && code !== undefined ? code : signal || 0}).`,
        );
        resolve({
          success: true,
          message: `Bot ${bot.config.name} stopped successfully.`,
        });
      };

      // 1. Send SIGTERM to process group and all descendants
      this.killTargetProcesses(targetPid, childPids, "SIGTERM");
=======
        this.appendLog(id, 'SYSTEM', `Process and all descendants terminated cleanly (Exit: ${code !== null && code !== undefined ? code : signal || 0}).`);
        resolve({ success: true, message: `Bot ${bot.config.name} stopped successfully.` });
      };

      // 1. Send SIGTERM to process group and all descendants
      this.killTargetProcesses(targetPid, childPids, 'SIGTERM');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

      // 2. Poll every 250ms to confirm if processes have exited
      const pollInterval = setInterval(() => {
        if (!this.isAnyPidAlive(allPidsToKill)) {
<<<<<<< HEAD
          finishCleanup(0, "SIGTERM");
=======
          finishCleanup(0, 'SIGTERM');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        }
      }, 250);

      // 3. Fallback: If still alive after 3.5 seconds, send SIGKILL to all PIDs
      const forceKillTimer = setTimeout(() => {
        if (!resolved) {
<<<<<<< HEAD
          this.appendLog(
            id,
            "WARN",
            `Process group did not exit within 3.5s, sending SIGKILL to all child processes.`,
          );
          this.killTargetProcesses(targetPid, childPids, "SIGKILL");
          setTimeout(() => finishCleanup(null, "SIGKILL"), 600);
=======
          this.appendLog(id, 'WARN', `Process group did not exit within 3.5s, sending SIGKILL to all child processes.`);
          this.killTargetProcesses(targetPid, childPids, 'SIGKILL');
          setTimeout(() => finishCleanup(null, 'SIGKILL'), 600);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        }
      }, 3500);

      if (targetProcess) {
<<<<<<< HEAD
        targetProcess.once("exit", (code, signal) =>
          finishCleanup(code, signal),
        );
        targetProcess.once("close", (code, signal) =>
          finishCleanup(code, signal),
        );
=======
        targetProcess.once('exit', (code, signal) => finishCleanup(code, signal));
        targetProcess.once('close', (code, signal) => finishCleanup(code, signal));
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      }
    });
  }

  /**
   * Restarts a Discord bot process, guaranteeing complete termination before respawning.
   */
  async restartBot(id) {
<<<<<<< HEAD
    this.appendLog(id, "SYSTEM", `Restart command received.`);
    await this.stopBot(id);
    // Grace delay to release sockets/files cleanly
    await new Promise((r) => setTimeout(r, 800));
=======
    this.appendLog(id, 'SYSTEM', `Restart command received.`);
    await this.stopBot(id);
    // Grace delay to release sockets/files cleanly
    await new Promise(r => setTimeout(r, 800));
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    return this.startBot(id);
  }

  /**
   * Stops all running bots cleanly (used during server shutdown).
   */
  async stopAll() {
    const promises = [];
    for (const [id, bot] of this.bots.entries()) {
<<<<<<< HEAD
      if (bot.status === "online" || bot.status === "starting" || bot.pid) {
        promises.push(
          this.stopBot(id).catch((e) =>
            console.error(`[BotManager] Error stopping ${id}:`, e.message),
          ),
        );
=======
      if (bot.status === 'online' || bot.status === 'starting' || bot.pid) {
        promises.push(this.stopBot(id).catch(e => console.error(`[BotManager] Error stopping ${id}:`, e.message)));
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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

<<<<<<< HEAD
    if (wasManual || code === 0 || signal === "SIGTERM") {
      bot.status = "offline";
      bot.startedAt = null;
      bot.uptime = 0;
      this.emitStatus(id);
      this.appendLog(
        id,
        "SYSTEM",
        `Bot stopped (Exit code: ${code !== null ? code : signal || 0})`,
      );
=======
    if (wasManual || code === 0 || signal === 'SIGTERM') {
      bot.status = 'offline';
      bot.startedAt = null;
      bot.uptime = 0;
      this.emitStatus(id);
      this.appendLog(id, 'SYSTEM', `Bot stopped (Exit code: ${code !== null ? code : signal || 0})`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      return;
    }

    // Unexpected exit / Crash
    const now = Date.now();
<<<<<<< HEAD
    bot.lastCrashReason =
      explicitError ||
      `Process exited unexpectedly with code ${code} (Signal: ${signal || "none"})`;
    bot.status = "crashed";
    bot.startedAt = null;
    bot.uptime = 0;
    this.appendLog(id, "ERROR", `CRASH DETECTED: ${bot.lastCrashReason}`);

    // Filter restart history within window
    bot.restartHistory = bot.restartHistory.filter(
      (t) => now - t < this.restartWindowMs,
    );
=======
    bot.lastCrashReason = explicitError || `Process exited unexpectedly with code ${code} (Signal: ${signal || 'none'})`;
    bot.status = 'crashed';
    bot.startedAt = null;
    bot.uptime = 0;
    this.appendLog(id, 'ERROR', `CRASH DETECTED: ${bot.lastCrashReason}`);

    // Filter restart history within window
    bot.restartHistory = bot.restartHistory.filter(t => (now - t) < this.restartWindowMs);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    bot.restartHistory.push(now);
    bot.restartCount++;

    this.emitStatus(id);

    // Restart Protection Check: maxRestarts in restartWindowMs
    if (bot.restartHistory.length > this.maxRestarts) {
      const windowSec = Math.round(this.restartWindowMs / 1000);
      const errMsg = `Restart protection activated: Crashed ${bot.restartHistory.length} times in ${windowSec}s (Limit: ${this.maxRestarts}). Auto-restart halted.`;
      bot.lastCrashReason = errMsg;
<<<<<<< HEAD
      this.appendLog(id, "ERROR", errMsg);
=======
      this.appendLog(id, 'ERROR', errMsg);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      this.emitStatus(id);
      return;
    }

    // Attempt automatic restart
    const delayMs = 3000;
<<<<<<< HEAD
    this.appendLog(
      id,
      "WARN",
      `Auto-restarting in ${delayMs / 1000}s (Attempt ${bot.restartHistory.length}/${this.maxRestarts})...`,
    );

    setTimeout(() => {
      if (bot.status === "crashed") {
        this.startBot(id).catch((err) => {
          this.appendLog(id, "ERROR", `Auto-restart failed: ${err.message}`);
=======
    this.appendLog(id, 'WARN', `Auto-restarting in ${delayMs / 1000}s (Attempt ${bot.restartHistory.length}/${this.maxRestarts})...`);

    setTimeout(() => {
      if (bot.status === 'crashed') {
        this.startBot(id).catch(err => {
          this.appendLog(id, 'ERROR', `Auto-restart failed: ${err.message}`);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
    this.emit("bot_status", data);
=======
    this.emit('bot_status', data);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  }

  /**
   * Formats sanitized bot summary for API/Socket consumers.
   */
  getBotData(id) {
    const bot = this.bots.get(id);
    if (!bot) return null;

    let uptime = 0;
<<<<<<< HEAD
    if (bot.status === "online" && bot.startedAt) {
=======
    if (bot.status === 'online' && bot.startedAt) {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      uptime = Math.floor((Date.now() - bot.startedAt) / 1000);
    }

    return {
      id: bot.id,
      name: bot.config.name,
<<<<<<< HEAD
      description: bot.config.description || "",
=======
      description: bot.config.description || '',
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
      logsCount: bot.logs.length,
=======
      logsCount: bot.logs.length
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
    if (!bot.pid || bot.status !== "online") {
=======
    if (!bot.pid || bot.status !== 'online') {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      return;
    }

    return new Promise((resolve) => {
      // Execute ps command for exact PID: %cpu and rss in KB
<<<<<<< HEAD
      exec(
        `ps -p ${bot.pid} -o %cpu,rss --no-headers`,
        { timeout: 1500 },
        (error, stdout) => {
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
        },
      );
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
        if (bot.status === "online") {
=======
        if (bot.status === 'online') {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
      this.emit("bots_metrics", this.getAllBots());
=======
      this.emit('bots_metrics', this.getAllBots());
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    }, 2500);
  }
}

module.exports = BotManager;
