require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const BotManager = require('./managers/BotManager');
const createBotsRouter = require('./routes/bots');
const systemRouter = require('./routes/system');
const { getSystemStatus } = require('./utils/systemMonitor');

const PORT = parseInt(process.env.PORT || '3001', 10);
const rawCorsOrigin = process.env.CORS_ORIGIN || '';

// Parse configured origins or permit standard local network / localhost origins
const configuredOrigins = rawCorsOrigin
  ? rawCorsOrigin.split(',').map(o => o.trim()).filter(Boolean)
  : [];

function isOriginAllowed(origin) {
  if (!origin) return true; // allow same-origin, curl, server-to-server

  if (configuredOrigins.length > 0) {
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
      return true;
    }
  }

  // Allow standard local IP / private network ranges and localhost
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
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
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security and parser middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

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
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Socket.IO Realtime handling
io.on('connection', async (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send immediate initial snapshot
  try {
    const systemStatus = await getSystemStatus();
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
});

// Periodic system status broadcast every 3 seconds
setInterval(async () => {
  try {
    const status = await getSystemStatus();
    io.emit('system_metrics_update', status);
  } catch (err) {
    console.error('[Monitor] Error broadcasting system metrics:', err.message);
  }
}, 3000);

// Start server & initialize BotManager
async function bootstrap() {
  try {
    await botManager.init();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`===================================================`);
      console.log(`  🏠 HOME SERVER BACKEND CONTROLLER`);
      console.log(`  Server listening on http://0.0.0.0:${PORT}`);
      console.log(`  WebSocket / Socket.IO active`);
      console.log(`===================================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

// Graceful termination handling for SIGTERM and SIGINT
let isShuttingDown = false;
async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Backend] Received ${signal}. Stopping all managed bot process groups cleanly...`);

  try {
    await botManager.stopAll();
    console.log('[Backend] All bot process groups stopped.');
  } catch (err) {
    console.error('[Backend] Error while stopping bots:', err.message);
  }

  server.close(() => {
    console.log('[Backend] HTTP and WebSocket servers closed. Exiting cleanly.');
    process.exit(0);
  });

  // Force exit fallback if connections hang
  setTimeout(() => {
    console.warn('[Backend] Force exit timeout reached.');
    process.exit(0);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

bootstrap();
