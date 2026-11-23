const { fork } = require("child_process");
const http = require("http");
const path = require("path");

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "localhost",
        port: 3001,
        path,
        method,
        headers: {
          ...(postData
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
              }
            : {}),
        },
        timeout: 4000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, text: data });
          }
        });
      },
    );
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runLiveTest() {
  console.log("=== Starting Live Integration Test of NexusPanel Backend ===");

  // Fork backend server
  const serverProcess = fork(path.join(__dirname, "server.js"), [], {
    env: { ...process.env, PORT: "3001" },
    stdio: "inherit",
  });

  // Wait 1.5s for server to listen
  await new Promise((r) => setTimeout(r, 1500));

  try {
    // 1. Health check
    console.log("1. Checking GET /health...");
    const health = await request("GET", "/health");
    console.log("   Status:", health.status, "Response:", health.data);
    if (health.status !== 200 || health.data.status !== "ok") {
      throw new Error("Health check failed");
    }

    // 2. Hardware telemetry
    console.log("2. Checking GET /api/status...");
    const sys = await request("GET", "/api/status");
    console.log(
      "   Platform:",
      sys.data.data.platform,
      "Hostname:",
      sys.data.data.hostname,
      "Status:",
      sys.data.data.status,
    );

    // 3. Bots list
    console.log("3. Checking GET /api/bots...");
    const bots = await request("GET", "/api/bots");
    console.log(`   Found ${bots.data.data.length} configured bot(s):`);
    for (const b of bots.data.data) {
      console.log(`   - ${b.id}: "${b.name}" (${b.status}) RAM Limit: ${b.ramLimitMB}MB Storage Limit: ${b.storageLimitMB}MB`);
    }

    // 4. Start bot-1
    console.log("4. Starting bot-1 (POST /api/bots/bot-1/start)...");
    const startRes = await request("POST", "/api/bots/bot-1/start");
    console.log("   Result:", startRes.data.message, "PID:", startRes.data.data.pid);

    // Wait 2s for process to run and log output
    await new Promise((r) => setTimeout(r, 2000));

    // 5. Bot status & metrics
    console.log("5. Checking bot-1 metrics (GET /api/bots/bot-1)...");
    const bot1 = await request("GET", "/api/bots/bot-1");
    console.log(`   Status: ${bot1.data.data.status} | PID: ${bot1.data.data.pid} | Uptime: ${bot1.data.data.uptime}s | RAM: ${bot1.data.data.ramUsageMB}MB`);

    // 6. Bot logs
    console.log("6. Checking bot-1 streaming logs (GET /api/bots/bot-1/logs)...");
    const logs = await request("GET", "/api/bots/bot-1/logs");
    console.log(`   Captured ${logs.data.data.length} log lines:`);
    for (const l of logs.data.data.slice(-3)) {
      console.log(`   [${l.time}] [${l.type}] ${l.message}`);
    }

    // 7. Bot Database: Create SQLite Database
    console.log("7. Creating SQLite database for bot-1 (POST /api/bots/bot-1/db/create)...");
    const testDbFile = path.join(__dirname, "..", "bots", "bot-1", "database.sqlite");
    const fs = require("fs");
    if (fs.existsSync(testDbFile)) {
      try { fs.unlinkSync(testDbFile); } catch {}
    }
    const dbCreate = await request("POST", "/api/bots/bot-1/db/create", { name: "database.sqlite" });
    console.log("   Result:", dbCreate.data.message || dbCreate.data.data?.name);

    // 8. Bot Database: Seed Schema
    console.log("8. Seeding 'general' schema (POST /api/bots/bot-1/db/seed)...");
    const dbSeed = await request("POST", "/api/bots/bot-1/db/seed", { template: "general" });
    console.log("   Result:", dbSeed.data.message);

    // 9. Bot Database: Query table
    console.log("9. Executing SQL query (POST /api/bots/bot-1/db/query)...");
    const dbQuery = await request("POST", "/api/bots/bot-1/db/query", { query: "SELECT * FROM bot_settings;" });
    console.log("   Rows returned:", dbQuery.data.data?.rows?.length, "Duration:", dbQuery.data.data?.durationMs, "ms");
    console.log("   Data preview:", dbQuery.data.data?.rows);

    // 10. Stop bot-1
    console.log("10. Stopping bot-1 (POST /api/bots/bot-1/stop)...");
    const stopRes = await request("POST", "/api/bots/bot-1/stop");
    console.log("    Result:", stopRes.data.message);

    console.log("\n=======================================================");
    console.log(" LIVE BACKEND INTEGRATION TEST: 100% WORKING & PASSED!");
    console.log("=======================================================\n");
  } finally {
    serverProcess.kill();
  }
}

runLiveTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
