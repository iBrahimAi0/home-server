const dotenv = require("dotenv");
const { randomUUID } = require("crypto");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");

class BotManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.configPath =
      options.configPath || path.join(__dirname, "../config/bots.json");
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
        console.warn(
          `[BotManager] Config file not found at ${this.configPath}, creating default configuration.`,
        );
        const defaultBots = [
          {
            id: "bot-1",
            name: "Role Bot",
            description:
              "Discord automated role management and reaction roles handler",
            path: "/home/ibra/home-server/bots/bot-1",
            command: "npm",
            args: ["start"],
            autoStart: true,
            env: {},
          },
          {
            id: "bot-2",
            name: "Games Bot",
            description:
              "Discord minigames, trivia, and leaderboard tracking bot",
            path: "/home/ibra/home-server/bots/bot-2",
            command: "npm",
            args: ["start"],
            autoStart: false,
            env: {},
          },
          {
            id: "bot-3",
            name: "Music & Utility Bot",
            description: "Discord audio streamer and moderation utility tools",
            path: "/home/ibra/home-server/bots/bot-3",
            command: "npm",
            args: ["start"],
            autoStart: false,
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
      const configs = JSON.parse(raw);
      const defaultBotsBase =
        process.env.BOTS_DIR || path.resolve(__dirname, "../../bots");

      for (const conf of configs) {
        if (!conf.id) continue;

        // Auto-resolve path if missing or non-existent
        if (!conf.path || !conf.path.trim() || !fs.existsSync(conf.path)) {
          const fallback = path.resolve(defaultBotsBase, conf.id);
          if (
            fs.existsSync(fallback) ||
            !conf.path ||
            !conf.path.trim() ||
            !path.isAbsolute(conf.path) ||
            (process.platform === "win32" && conf.path.startsWith("/"))
          ) {
            conf.path = fallback;
          }
        }

        // Ensure the bot working directory exists
        try {
          if (conf.path && !fs.existsSync(conf.path)) {
            fs.mkdirSync(conf.path, { recursive: true });
          }
        } catch {
          // ignore
        }

        conf.ramLimitMB = Math.max(0, parseInt(conf.ramLimitMB, 10) || 0);
        conf.storageLimitMB = Math.max(0, parseInt(conf.storageLimitMB, 10) || 0);

        // Preserve existing runtime state if bot is already loaded
        const existing = this.bots.get(conf.id);
        if (existing) {
          existing.config = conf;
        } else {
          this.bots.set(conf.id, {
            id: conf.id,
            config: conf,
            status: "offline", // online, offline, starting, stopping, crashed
            process: null,
            pid: null,
            startedAt: null,
            uptime: 0,
            cpuUsage: 0,
            ramUsageMB: 0,
            storageUsedMB: 0,
            lastRamAlertTime: 0,
            restartHistory: [], // array of timestamps
            restartCount: 0,
            lastCrashReason: null,
            logs: [],
            isStoppingManually: false,
          });
        }
      }

      console.log(
        `[BotManager] Loaded ${this.bots.size} bot(s) from config: ${this.configPath}`,
      );
    } catch (err) {
      console.error("[BotManager] Failed to load bots config:", err.message);
    }
  }

  /**
   * Persists the current in-memory bot configurations back to the config JSON file on disk.
   */
  persistConfig() {
    try {
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
    }
  }

  /**
   * Creates a brand new bot entry (from the website UI), persists it to bots.json,
   * and registers it in memory so it is immediately manageable.
   */
  addBot(conf) {
    if (!conf || !conf.id) {
      const err = new Error("Bot ID is required.");
      err.status = 400;
      throw err;
    }

    if (this.bots.has(conf.id)) {
      const err = new Error(`A bot with ID "${conf.id}" already exists.`);
      err.status = 400;
      throw err;
    }

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
      ramLimitMB: Math.max(0, parseInt(conf.ramLimitMB, 10) || 0),
      storageLimitMB: Math.max(0, parseInt(conf.storageLimitMB, 10) || 0),
      env: conf.env && typeof conf.env === "object" ? conf.env : {},
    };

    this.bots.set(conf.id, {
      id: conf.id,
      config: cleanConfig,
      status: "offline",
      process: null,
      pid: null,
      startedAt: null,
      uptime: 0,
      cpuUsage: 0,
      ramUsageMB: 0,
      storageUsedMB: 0,
      lastRamAlertTime: 0,
      restartHistory: [],
      restartCount: 0,
      lastCrashReason: null,
      logs: [],
      isStoppingManually: false,
    });

    // Ensure the bot's working directory exists so it's immediately usable in the File Manager
    try {
      if (!fs.existsSync(cleanConfig.path)) {
        fs.mkdirSync(cleanConfig.path, { recursive: true });
      }
    } catch (err) {
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
    if (updates.ramLimitMB !== undefined)
      nextConfig.ramLimitMB = Math.max(0, parseInt(updates.ramLimitMB, 10) || 0);
    if (updates.storageLimitMB !== undefined)
      nextConfig.storageLimitMB = Math.max(0, parseInt(updates.storageLimitMB, 10) || 0);
    if (updates.env !== undefined && typeof updates.env === "object")
      nextConfig.env = updates.env;

    bot.config = nextConfig;

    try {
      if (!fs.existsSync(nextConfig.path)) {
        fs.mkdirSync(nextConfig.path, { recursive: true });
      }
    } catch (err) {
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

    if (bot.status === "online" || bot.status === "starting" || bot.pid) {
      await this.stopBot(id);
    }

    this.bots.delete(id);
    this.persistConfig();
    this.emit("bot_removed", { id });

    return {
      success: true,
      message: `Bot "${bot.config.name}" removed successfully.`,
    };
  }

  /**
   * Retrieves merged environment variables for a bot (from config and .env file).
   */
  getProcessEnv(id) {
    const { AUTH_TOKEN, API_KEY, ...hostEnvironment } = process.env;
    return { ...hostEnvironment, ...this.getBotEnv(id) };
  }

  getBotEnv(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      const err = new Error(`Bot with ID "${id}" does not exist.`);
      err.status = 404;
      throw err;
    }

    const envPath = path.join(bot.config.path, ".env");
    try {
      return { ...bot.config.env, ...dotenv.parse(fs.readFileSync(envPath)) };
    } catch (error) {
      if (error.code === "ENOENT") return { ...bot.config.env };
      throw error;
    }
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

    const lines = Object.entries(envVars).map(([key, value]) => {
      if (/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key) && typeof value === "string" && !value.includes("\0")) {
        for (const delimiter of ["", "'", '"', "`"]) {
          const line = `${key}=${delimiter}${value}${delimiter}`;
          const parsed = dotenv.parse(line);
          if (Object.keys(parsed).length === 1 && parsed[key] === value) return line;
        }
      }
      throw Object.assign(new Error(`Invalid name or unsupported value for ${key}.`), { status: 400 });
    });
    fs.mkdirSync(bot.config.path, { recursive: true });
    const envPath = path.join(bot.config.path, ".env");
    const temporary = envPath + "." + randomUUID();
    try {
      fs.writeFileSync(temporary, lines.join("\n") + "\n", { mode: 0o600, flag: "wx" });
      fs.renameSync(temporary, envPath);
    } finally {
      fs.rmSync(temporary, { force: true });
    }
    bot.config.env = { ...envVars };
    this.persistConfig();

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
        env: this.getProcessEnv(id),
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
        env: this.getProcessEnv(id),
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
        const pids = stdout
          .trim()
          .split(/\s+/)
          .map((p) => parseInt(p, 10))
          .filter((p) => !isNaN(p) && p !== process.pid);

        for (const p of pids) {
          try {
            process.kill(p, "SIGTERM");
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
        console.log(
          `[BotManager] Auto-starting bot "${bot.config.name}" (${id})...`,
        );
        this.startBot(id).catch((err) => {
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
    const timeStr = timestamp.toTimeString().split(" ")[0]; // HH:MM:SS
    const fullIso = timestamp.toISOString();

    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      botId,
      botName: bot.config.name,
      type: type || "INFO", // INFO, WARN, ERROR, SYSTEM
      time: timeStr,
      timestamp: fullIso,
      message: String(message).replace(/[\r\n]+$/, ""), // trim trailing newlines
    };

    bot.logs.push(logEntry);
    if (bot.logs.length > this.maxLogsInMemory) {
      bot.logs.shift();
    }

    this.emit("bot_log", logEntry);
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
    if (bot.status === "online" || bot.status === "starting" || bot.process) {
      return {
        success: true,
        message: `Bot ${bot.config.name} is already ${bot.status}.`,
      };
    }

    const botDir = bot.config.path;
    const exists = fs.existsSync(botDir);

    // If the bot directory does not exist on filesystem, reject immediately and remain OFFLINE
    if (!exists) {
      bot.status = "offline";
      bot.process = null;
      bot.pid = null;
      bot.startedAt = null;
      bot.uptime = 0;
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      const errorMsg = `Bot directory not found: ${botDir}`;
      this.appendLog(id, "ERROR", errorMsg);
      this.emitStatus(id);
      throw new Error(errorMsg);
    }

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
      const env = this.getProcessEnv(id);

      // Enforce RAM limit for Node/npm processes via V8 flag
      if (bot.config.ramLimitMB && bot.config.ramLimitMB > 0) {
        const memFlag = `--max-old-space-size=${bot.config.ramLimitMB}`;
        if (!env.NODE_OPTIONS || !env.NODE_OPTIONS.includes("--max-old-space-size")) {
          env.NODE_OPTIONS = `${memFlag} ${env.NODE_OPTIONS || ""}`.trim();
        }
      }

      // Spawn real process with detached: true (creates new process group leader on POSIX)
      const isWin = process.platform === "win32";
      const child = spawn(command, args, {
        cwd: botDir,
        env,
        detached: !isWin,
        shell: isWin,
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (!child || !child.pid) {
        throw new Error(
          `Failed to spawn process for bot "${bot.config.name}".`,
        );
      }

      bot.process = child;
      bot.pid = child.pid;
      bot.startedAt = Date.now();
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
          }
        }
      });

      // Handle standard error
      child.stderr.on("data", (data) => {
        const text = data.toString();
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            this.appendLog(id, "ERROR", line);
          }
        }
      });

      // Handle process close / exit
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
      bot.process = null;
      bot.pid = null;
      bot.startedAt = null;
      bot.lastCrashReason = err.message;
      this.emitStatus(id);
      this.appendLog(id, "ERROR", `Failed to start bot: ${err.message}`);
      throw err;
    }
  }

  /**
   * Safely sends a signal to a process group and specific PIDs, handling ESRCH gracefully.
   */
  killTargetProcesses(mainPid, childPids = [], signal = "SIGTERM") {
    if (process.platform === "win32") {
      if (mainPid && mainPid > 0) {
        try {
          exec(`taskkill /PID ${mainPid} /T /F`, { timeout: 2000 }, () => {});
        } catch {
          // ignore
        }
      }
      return;
    }

    // 1. Kill process group
    if (mainPid && mainPid > 0) {
      try {
        process.kill(-mainPid, signal);
      } catch (err) {
        if (err.code !== "ESRCH") {
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
        if (err.code === "EPERM") return true; // Exists but no permission
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

    if (bot.status === "offline" && !bot.process && !bot.pid) {
      return { success: true, message: `Bot is already offline.` };
    }

    bot.isStoppingManually = true;
    bot.status = "stopping";
    this.emitStatus(id);

    const targetPid = bot.pid;
    const targetProcess = bot.process;
    this.appendLog(
      id,
      "SYSTEM",
      `Stopping bot "${bot.config.name}" (PID ${targetPid || "N/A"})...`,
    );

    if (!targetPid && !targetProcess) {
      bot.status = "offline";
      bot.pid = null;
      bot.startedAt = null;
      bot.uptime = 0;
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      this.emitStatus(id);
      this.appendLog(id, "SYSTEM", `Bot stopped.`);
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

        bot.status = "offline";
        bot.process = null;
        bot.pid = null;
        bot.startedAt = null;
        bot.uptime = 0;
        bot.cpuUsage = 0;
        bot.ramUsageMB = 0;
        bot.isStoppingManually = false;

        this.emitStatus(id);
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

      // 2. Poll every 250ms to confirm if processes have exited
      const pollInterval = setInterval(() => {
        if (!this.isAnyPidAlive(allPidsToKill)) {
          finishCleanup(0, "SIGTERM");
        }
      }, 250);

      // 3. Fallback: If still alive after 3.5 seconds, send SIGKILL to all PIDs
      const forceKillTimer = setTimeout(() => {
        if (!resolved) {
          this.appendLog(
            id,
            "WARN",
            `Process group did not exit within 3.5s, sending SIGKILL to all child processes.`,
          );
          this.killTargetProcesses(targetPid, childPids, "SIGKILL");
          setTimeout(() => finishCleanup(null, "SIGKILL"), 600);
        }
      }, 3500);

      if (targetProcess) {
        targetProcess.once("exit", (code, signal) =>
          finishCleanup(code, signal),
        );
        targetProcess.once("close", (code, signal) =>
          finishCleanup(code, signal),
        );
      }
    });
  }

  /**
   * Restarts a Discord bot process, guaranteeing complete termination before respawning.
   */
  async restartBot(id) {
    this.appendLog(id, "SYSTEM", `Restart command received.`);
    await this.stopBot(id);
    // Grace delay to release sockets/files cleanly
    await new Promise((r) => setTimeout(r, 800));
    return this.startBot(id);
  }

  /**
   * Stops all running bots cleanly (used during server shutdown).
   */
  async stopAll() {
    const promises = [];
    for (const [id, bot] of this.bots.entries()) {
      if (bot.status === "online" || bot.status === "starting" || bot.pid) {
        promises.push(
          this.stopBot(id).catch((e) =>
            console.error(`[BotManager] Error stopping ${id}:`, e.message),
          ),
        );
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
      return;
    }

    // Unexpected exit / Crash
    const now = Date.now();
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
    bot.restartHistory.push(now);
    bot.restartCount++;

    this.emitStatus(id);

    // Restart Protection Check: maxRestarts in restartWindowMs
    if (bot.restartHistory.length > this.maxRestarts) {
      const windowSec = Math.round(this.restartWindowMs / 1000);
      const errMsg = `Restart protection activated: Crashed ${bot.restartHistory.length} times in ${windowSec}s (Limit: ${this.maxRestarts}). Auto-restart halted.`;
      bot.lastCrashReason = errMsg;
      this.appendLog(id, "ERROR", errMsg);
      this.emitStatus(id);
      return;
    }

    // Attempt automatic restart
    const delayMs = 3000;
    this.appendLog(
      id,
      "WARN",
      `Auto-restarting in ${delayMs / 1000}s (Attempt ${bot.restartHistory.length}/${this.maxRestarts})...`,
    );

    setTimeout(() => {
      if (bot.status === "crashed") {
        this.startBot(id).catch((err) => {
          this.appendLog(id, "ERROR", `Auto-restart failed: ${err.message}`);
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
    this.emit("bot_status", data);
  }

  /**
   * Formats sanitized bot summary for API/Socket consumers.
   */
  getBotData(id) {
    const bot = this.bots.get(id);
    if (!bot) return null;

    let uptime = 0;
    if (bot.status === "online" && bot.startedAt) {
      uptime = Math.floor((Date.now() - bot.startedAt) / 1000);
    }

    return {
      id: bot.id,
      name: bot.config.name,
      description: bot.config.description || "",
      path: bot.config.path,
      command: bot.config.command,
      args: bot.config.args,
      autoStart: !!bot.config.autoStart,
      ramLimitMB: bot.config.ramLimitMB || 0,
      storageLimitMB: bot.config.storageLimitMB || 0,
      storageUsedMB: bot.storageUsedMB !== undefined ? bot.storageUsedMB : this.getBotStorageMB(bot.id),
      status: bot.status,
      pid: bot.pid,
      uptime: uptime,
      startedAt: bot.startedAt ? new Date(bot.startedAt).toISOString() : null,
      cpuUsage: bot.cpuUsage,
      ramUsageMB: bot.ramUsageMB,
      restartCount: bot.restartCount,
      lastCrashReason: bot.lastCrashReason,
      logsCount: bot.logs.length,
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
   * Recursively calculates disk size of a directory in bytes.
   */
  getDirectorySizeBytes(dirPath) {
    let totalBytes = 0;
    if (!fs.existsSync(dirPath)) return 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === ".git") continue;
        const fullPath = path.join(dirPath, entry.name);
        try {
          if (entry.isDirectory()) {
            totalBytes += this.getDirectorySizeBytes(fullPath);
          } else if (entry.isFile()) {
            const st = fs.statSync(fullPath);
            totalBytes += st.size;
          }
        } catch {
          // ignore unreadable files
        }
      }
    } catch {
      // ignore
    }
    return totalBytes;
  }

  /**
   * Returns disk storage used by a bot in bytes.
   */
  getBotStorageBytes(botId) {
    const bot = this.bots.get(botId);
    if (!bot || !bot.config || !bot.config.path) return 0;
    return this.getDirectorySizeBytes(bot.config.path);
  }

  /**
   * Returns disk storage used by a bot in MB.
   */
  getBotStorageMB(botId) {
    const bytes = this.getBotStorageBytes(botId);
    return Math.round((bytes / (1024 * 1024)) * 10) / 10;
  }

  /**
   * Checks if writing additionalBytes would violate the bot's configured storage limit.
   */
  checkStorageAvailable(botId, additionalBytes = 0) {
    const bot = this.bots.get(botId);
    if (!bot) return { allowed: true };
    const limitMB = bot.config.storageLimitMB || 0;
    if (limitMB <= 0) return { allowed: true, limitMB: 0 };

    const currentBytes = this.getBotStorageBytes(botId);
    const limitBytes = limitMB * 1024 * 1024;
    const projectedBytes = currentBytes + additionalBytes;
    const allowed = projectedBytes <= limitBytes;

    return {
      allowed,
      currentMB: Math.round((currentBytes / (1024 * 1024)) * 10) / 10,
      limitMB,
      projectedMB: Math.round((projectedBytes / (1024 * 1024)) * 10) / 10,
    };
  }

  /**
   * Checks RAM usage and logs throttled warning if over limit.
   */
  checkRamAlert(bot) {
    const limit = bot.config.ramLimitMB;
    if (limit && limit > 0 && bot.ramUsageMB > limit) {
      const now = Date.now();
      if (!bot.lastRamAlertTime || now - bot.lastRamAlertTime > 60000) {
        bot.lastRamAlertTime = now;
        this.appendLog(
          bot.id,
          "WARN",
          `Memory limit warning: RAM usage (${bot.ramUsageMB} MB) has exceeded allocated limit of ${limit} MB.`,
        );
      }
    }
  }

  /**
   * Measures real CPU & RAM for running bot processes.
   */
  async updateProcessMetrics(bot) {
    if (!bot.pid || bot.status !== "online") {
      bot.cpuUsage = 0;
      bot.ramUsageMB = 0;
      return;
    }

    if (process.platform === "win32") {
      return new Promise((resolve) => {
        exec(
          `tasklist /FI "PID eq ${bot.pid}" /FO CSV /NH`,
          { timeout: 1500 },
          (error, stdout) => {
            if (error || !stdout || !stdout.trim()) {
              bot.cpuUsage = 0;
              bot.ramUsageMB = 0;
              return resolve();
            }
            try {
              const parts = stdout.trim().split('","');
              if (parts.length >= 5) {
                const memStr = parts[4].replace(/[^0-9]/g, "");
                const memKb = parseInt(memStr, 10) || 0;
                bot.ramUsageMB = Math.round(memKb / 1024);
                bot.cpuUsage = 0;
              }
            } catch {
              bot.ramUsageMB = 0;
            }
            this.checkRamAlert(bot);
            resolve();
          },
        );
      });
    }

    return new Promise((resolve) => {
      // Execute ps command for exact PID: %cpu and rss in KB
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

          this.checkRamAlert(bot);
          resolve();
        },
      );
    });
  }

  /**
   * Periodically collects real CPU & RAM for running bot processes.
   */
  startMetricsCollector() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    let cycleCount = 0;

    this.statsInterval = setInterval(async () => {
      cycleCount++;
      const metricPromises = [];
      const refreshStorage = cycleCount % 4 === 1; // refresh storage every ~10s

      for (const bot of this.bots.values()) {
        if (refreshStorage) {
          bot.storageUsedMB = this.getBotStorageMB(bot.id);
        }
        if (bot.status === "online") {
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
      this.emit("bots_metrics", this.getAllBots());
    }, 2500);
  }
}

module.exports = BotManager;
