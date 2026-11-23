/**
 * Role Bot — Starter Worker
 * Demonstrates live log streaming, auto-restart, and process management.
 */
console.log("=== Role Bot Service Started ===");
console.log(`Node runtime: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);

// Heartbeat routine so logs stream actively in the dashboard console
setInterval(() => {
  const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`[Role Bot Heartbeat] Uptime: ${Math.floor(process.uptime())}s | Memory: ${memoryMB} MB | Status: Active`);
}, 10000);
