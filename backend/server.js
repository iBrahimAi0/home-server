<<<<<<< HEAD
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const BotManager = require("./managers/BotManager");
const createBotsRouter = require("./routes/bots");
const systemRouter = require("./routes/system");
const { getSystemStatus } = require("./utils/systemMonitor");
const authMiddleware = require("./middleware/auth");
const { generalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const PORT = parseInt(process.env.PORT || "3001", 10);
const rawCorsOrigin = process.env.CORS_ORIGIN || "";

// Parse configured origins or permit standard local network / localhost origins
const configuredOrigins = rawCorsOrigin
  ? rawCorsOrigin
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
=======
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const BotManager = require('./managers/BotManager');
const createBotsRouter = require('./routes/bots');
const systemRouter = require('./routes/system');
const { getSystemStatus } = require('./utils/systemMonitor');
const authMiddleware = require('./middleware/auth');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const PORT = parseInt(process.env.PORT || '3001', 10);
const rawCorsOrigin = process.env.CORS_ORIGIN || '';

// Parse configured origins or permit standard local network / localhost origins
const configuredOrigins = rawCorsOrigin
  ? rawCorsOrigin.split(',').map(o => o.trim()).filter(Boolean)
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  : [];

function isOriginAllowed(origin) {
  if (!origin) return true; // allow same-origin, curl, server-to-server

  if (configuredOrigins.length > 0) {
<<<<<<< HEAD
    if (configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
=======
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      return true;
    }
  }

  // Allow standard local IP / private network ranges and localhost
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    if (
<<<<<<< HEAD
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
=======
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return true;
    }
  } catch {
    // ignore parse error
  }

  return false;
}

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS validation
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
<<<<<<< HEAD
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Security and parser middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hidePoweredBy: true,
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS policy"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// Request size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// General Rate Limiter & Auth middleware
app.use(generalLimiter);
app.use("/api", authMiddleware);

// Initialize Bot Manager
const botManager = new BotManager({
  configPath:
    process.env.BOTS_CONFIG_PATH || path.join(__dirname, "config/bots.json"),
  maxRestarts: parseInt(process.env.MAX_RESTARTS || "5", 10),
  restartWindowMs: parseInt(process.env.RESTART_WINDOW_MS || "60000", 10),
});

// API Routes
app.use("/api/system", systemRouter);
app.use("/api", systemRouter); // For GET /api/status directly
app.use("/api/bots", createBotsRouter(botManager));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
=======
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security and parser middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hidePoweredBy: true
}));

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiter & Auth middleware
app.use(generalLimiter);
app.use('/api', authMiddleware);

// Initialize Bot Manager
const botManager = new BotManager({
  configPath: process.env.BOTS_CONFIG_PATH || path.join(__dirname, 'config/bots.json'),
  maxRestarts: parseInt(process.env.MAX_RESTARTS || '5', 10),
  restartWindowMs: parseInt(process.env.RESTART_WINDOW_MS || '60000', 10)
});

// API Routes
app.use('/api/system', systemRouter);
app.use('/api', systemRouter); // For GET /api/status directly
app.use('/api/bots', createBotsRouter(botManager));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
});

// Centralized error handler middleware
app.use(errorHandler);

// Socket.IO Realtime handling
<<<<<<< HEAD
io.on("connection", async (socket) => {
=======
io.on('connection', async (socket) => {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send immediate initial snapshot
  try {
    const systemStatus = await getSystemStatus();
<<<<<<< HEAD
    socket.emit("system_status", systemStatus);
    socket.emit("bots_list", botManager.getAllBots());
  } catch (err) {
    console.error("[Socket.IO] Error sending initial payload:", err.message);
  }

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });

  // Handle client interactive console commands via Socket.IO
  socket.on("bot_stdin", ({ botId, input }, callback) => {
    try {
      if (!botId || typeof input !== "string") {
        if (typeof callback === "function")
          callback({ success: false, error: "Invalid botId or input string" });
        return;
      }
      const result = botManager.sendStdin(botId, input);
      if (typeof callback === "function")
        callback({ success: true, message: result.message });
    } catch (err) {
      if (typeof callback === "function")
        callback({ success: false, error: err.message });
    }
  });

  socket.on("bot_exec", async ({ botId, command }, callback) => {
    try {
      if (!botId || !command || typeof command !== "string") {
        if (typeof callback === "function")
          callback({
            success: false,
            error: "Invalid botId or command string",
          });
        return;
      }
      const result = await botManager.executeCommand(botId, command);
      if (typeof callback === "function")
        callback({ success: true, data: result });
    } catch (err) {
      if (typeof callback === "function")
        callback({ success: false, error: err.message });
    }
  });
});

// Forward BotManager events to all connected Socket.IO clients
botManager.on("bot_status", (botData) => {
  io.emit("bot_status_changed", botData);
});

botManager.on("bot_log", (logEntry) => {
  io.emit("new_log", logEntry);
});

botManager.on("bots_metrics", (botsList) => {
  io.emit("bots_metrics_update", botsList);
=======
    socket.emit('system_status', systemStatus);
    socket.emit('bots_list', botManager.getAllBots());
  } catch (err) {
    console.error('[Socket.IO] Error sending initial payload:', err.message);
  }

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Forward BotManager events to all connected Socket.IO clients
botManager.on('bot_status', (botData) => {
  io.emit('bot_status_changed', botData);
});

botManager.on('bot_log', (logEntry) => {
  io.emit('new_log', logEntry);
});

botManager.on('bots_metrics', (botsList) => {
  io.emit('bots_metrics_update', botsList);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
});

// Periodic system status broadcast every 3 seconds
setInterval(async () => {
  try {
    const status = await getSystemStatus();
<<<<<<< HEAD
    io.emit("system_metrics_update", status);
  } catch (err) {
    console.error("[Monitor] Error broadcasting system metrics:", err.message);
=======
    io.emit('system_metrics_update', status);
  } catch (err) {
    console.error('[Monitor] Error broadcasting system metrics:', err.message);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  }
}, 3000);

// Start server & initialize BotManager
async function bootstrap() {
  try {
    await botManager.init();

<<<<<<< HEAD
    server.listen(PORT, "0.0.0.0", () => {
=======
    server.listen(PORT, '0.0.0.0', () => {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      console.log(`===================================================`);
      console.log(`  🏠 NEXUSPANEL HOME SERVER BACKEND`);
      console.log(`  Server listening on http://0.0.0.0:${PORT}`);
      console.log(`  WebSocket / Socket.IO active`);
      console.log(`  Security Headers & Rate Limiting: Active`);
      console.log(`===================================================`);
    });
  } catch (err) {
<<<<<<< HEAD
    console.error("Fatal initialization error:", err);
=======
    console.error('Fatal initialization error:', err);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    process.exit(1);
  }
}

// Graceful termination handling for SIGTERM and SIGINT
let isShuttingDown = false;
async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
<<<<<<< HEAD
  console.log(
    `[Backend] Received ${signal}. Stopping all managed bot process groups cleanly...`,
  );

  try {
    await botManager.stopAll();
    console.log("[Backend] All bot process groups stopped.");
  } catch (err) {
    console.error("[Backend] Error while stopping bots:", err.message);
  }

  server.close(() => {
    console.log(
      "[Backend] HTTP and WebSocket servers closed. Exiting cleanly.",
    );
=======
  console.log(`[Backend] Received ${signal}. Stopping all managed bot process groups cleanly...`);

  try {
    await botManager.stopAll();
    console.log('[Backend] All bot process groups stopped.');
  } catch (err) {
    console.error('[Backend] Error while stopping bots:', err.message);
  }

  server.close(() => {
    console.log('[Backend] HTTP and WebSocket servers closed. Exiting cleanly.');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    process.exit(0);
  });

  // Force exit fallback if connections hang
  setTimeout(() => {
<<<<<<< HEAD
    console.warn("[Backend] Force exit timeout reached.");
=======
    console.warn('[Backend] Force exit timeout reached.');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    process.exit(0);
  }, 10000);
}

<<<<<<< HEAD
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
=======
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

bootstrap();
