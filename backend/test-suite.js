const assert = require("assert");
const fs = require("fs");
const path = require("path");
const BotManager = require("./managers/BotManager");
const DatabaseService = require("./services/DatabaseService");

async function runTests() {
  console.log("=== Running NexusPanel Bot Controller & Database Test Suite ===\n");

  const testConfigPath = path.join(__dirname, "config/test-bots.json");
  const testBotDir = path.join(__dirname, "../bots/test-bot-unit");

  try {
    // Clean prior test artifacts
    if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath);
    if (fs.existsSync(testBotDir)) fs.rmSync(testBotDir, { recursive: true, force: true });
    fs.mkdirSync(testBotDir, { recursive: true });

    // -------------------------------------------------------------
    // Test 1: BotManager Initialization & Creation with RAM/Storage Limits
    // -------------------------------------------------------------
    console.log("Test 1: Testing BotManager bot creation with RAM & Storage limits...");
    const manager = new BotManager({
      configPath: testConfigPath,
      maxRestarts: 3,
      restartWindowMs: 10000,
    });
    await manager.loadConfig();

    const createdBot = manager.addBot({
      id: "test-bot-unit",
      name: "Unit Test Bot",
      description: "Testing limits and database functionality",
      path: testBotDir,
      command: "node",
      args: ["index.js"],
      autoStart: false,
      ramLimitMB: 512,
      storageLimitMB: 50,
      env: { TEST_KEY: "HELLO_VALUE" },
    });

    assert.strictEqual(createdBot.id, "test-bot-unit");
    assert.strictEqual(createdBot.ramLimitMB, 512, "RAM limit must be 512MB");
    assert.strictEqual(createdBot.storageLimitMB, 50, "Storage limit must be 50MB");
    assert.strictEqual(typeof createdBot.storageUsedMB, "number");
    console.log("  ✓ Bot created with ramLimitMB=512, storageLimitMB=50");

    // -------------------------------------------------------------
    // Test 2: Storage Limits Enforcement Check
    // -------------------------------------------------------------
    console.log("Test 2: Testing storage limit calculation and availability check...");
    // Write a dummy 5MB file inside bot dir
    const sampleFilePath = path.join(testBotDir, "sample-payload.bin");
    const sampleBuffer = Buffer.alloc(5 * 1024 * 1024, "a");
    fs.writeFileSync(sampleFilePath, sampleBuffer);

    const storageBytes = manager.getBotStorageBytes("test-bot-unit");
    assert.ok(storageBytes >= 5 * 1024 * 1024, "Storage calculation must reflect written 5MB file");
    const storageMB = manager.getBotStorageMB("test-bot-unit");
    assert.ok(storageMB >= 5.0, `Calculated storage should be >= 5MB, got ${storageMB}`);

    // Check availability under limit (requesting additional 20MB -> 25MB total <= 50MB limit)
    const allowedCheck = manager.checkStorageAvailable("test-bot-unit", 20 * 1024 * 1024);
    assert.strictEqual(allowedCheck.allowed, true, "25MB must be within 50MB limit");

    // Check availability exceeding limit (requesting additional 60MB -> 65MB total > 50MB limit)
    const deniedCheck = manager.checkStorageAvailable("test-bot-unit", 60 * 1024 * 1024);
    assert.strictEqual(deniedCheck.allowed, false, "65MB must exceed 50MB limit");
    assert.strictEqual(deniedCheck.limitMB, 50);
    console.log("  ✓ Storage availability check correctly allows < 50MB and rejects > 50MB");

    // Clean up sample payload
    fs.unlinkSync(sampleFilePath);

    // -------------------------------------------------------------
    // Test 3: Updating Resource Limits
    // -------------------------------------------------------------
    console.log("Test 3: Testing live updating of RAM & Storage limits...");
    const updated = manager.updateBot("test-bot-unit", {
      ramLimitMB: 1024,
      storageLimitMB: 200,
    });
    assert.strictEqual(updated.ramLimitMB, 1024);
    assert.strictEqual(updated.storageLimitMB, 200);

    const reloadedManager = new BotManager({ configPath: testConfigPath });
    await reloadedManager.loadConfig();
    const persisted = reloadedManager.getBotData("test-bot-unit");
    assert.strictEqual(persisted.ramLimitMB, 1024);
    assert.strictEqual(persisted.storageLimitMB, 200);
    console.log("  ✓ Resource limits update and persist to config file");

    // -------------------------------------------------------------
    // Test 4: SQLite Database Creation & Listing
    // -------------------------------------------------------------
    console.log("Test 4: Testing SQLite database creation and discovery...");
    const createdDb = DatabaseService.createDatabase(testBotDir, "bot_data.sqlite");
    assert.strictEqual(createdDb.name, "bot_data.sqlite");
    assert.ok(fs.existsSync(path.join(testBotDir, "bot_data.sqlite")));

    const dbsList = DatabaseService.listDatabases(testBotDir);
    assert.ok(dbsList.length >= 1, "Must find at least 1 database file");
    assert.strictEqual(dbsList[0].relativePath, "bot_data.sqlite");
    console.log("  ✓ SQLite database created and discovered via listDatabases()");

    // -------------------------------------------------------------
    // Test 5: Schema Seeding & Introspection
    // -------------------------------------------------------------
    console.log("Test 5: Testing starter schema seeding (General & Economy)...");
    const seedResult = DatabaseService.seedStarterSchema(testBotDir, "bot_data.sqlite", "general");
    assert.strictEqual(seedResult.success, true);

    const tables = DatabaseService.getTables(testBotDir, "bot_data.sqlite");
    const tableNames = tables.map((t) => t.name);
    assert.ok(tableNames.includes("bot_settings"), "Must include bot_settings table");
    assert.ok(tableNames.includes("command_logs"), "Must include command_logs table");

    const settingsTable = tables.find((t) => t.name === "bot_settings");
    assert.ok(settingsTable.columns.some((c) => c.name === "key" && c.pk));
    assert.ok(settingsTable.rowCount >= 1, "Default seed should insert default settings");
    console.log(`  ✓ Tables created: ${tableNames.join(", ")}; rowCount: ${settingsTable.rowCount}`);

    // Seed economy schema
    DatabaseService.seedStarterSchema(testBotDir, "bot_data.sqlite", "economy");
    const updatedTables = DatabaseService.getTables(testBotDir, "bot_data.sqlite");
    const updatedNames = updatedTables.map((t) => t.name);
    assert.ok(updatedNames.includes("users"), "Must include users table");
    assert.ok(updatedNames.includes("transactions"), "Must include transactions table");
    console.log("  ✓ Economy schema (users, transactions) seeded successfully");

    // -------------------------------------------------------------
    // Test 6: SQL Execution (SELECT & Mutations) & Paginated Table Data
    // -------------------------------------------------------------
    console.log("Test 6: Testing SQL queries, insertions, and table data pagination...");
    const insertSql = `
      INSERT INTO users (user_id, username, balance, xp, level)
      VALUES 
        ('user-100', 'PlayerOne', 500, 120, 2),
        ('user-101', 'PlayerTwo', 1250, 450, 5);
    `;
    const mutationRes = DatabaseService.executeQuery(testBotDir, "bot_data.sqlite", insertSql);
    assert.strictEqual(mutationRes.type, "mutation");
    assert.ok(mutationRes.durationMs >= 0);

    // SELECT query
    const selectRes = DatabaseService.executeQuery(
      testBotDir,
      "bot_data.sqlite",
      "SELECT * FROM users WHERE balance >= 500 ORDER BY balance DESC;",
    );
    assert.strictEqual(selectRes.type, "select");
    assert.strictEqual(selectRes.count, 2);
    assert.strictEqual(selectRes.rows[0].username, "PlayerTwo");
    assert.strictEqual(selectRes.rows[1].username, "PlayerOne");
    console.log(`  ✓ SELECT returned ${selectRes.count} rows, duration: ${selectRes.durationMs}ms`);

    // Paginated Table Data
    const page1 = DatabaseService.getTableData(testBotDir, "bot_data.sqlite", "users", 1, 0);
    assert.strictEqual(page1.totalRows, 2);
    assert.strictEqual(page1.rows.length, 1);
    assert.strictEqual(page1.columns.includes("username"), true);

    const page2 = DatabaseService.getTableData(testBotDir, "bot_data.sqlite", "users", 1, 1);
    assert.strictEqual(page2.rows.length, 1);
    assert.notStrictEqual(page1.rows[0].user_id, page2.rows[0].user_id);
    console.log("  ✓ Table data pagination works correctly (offset 0 and offset 1)");

    // -------------------------------------------------------------
    // Test 7: Environment Variable Management with Database URL
    // -------------------------------------------------------------
    console.log("Test 7: Testing bot .env persistence with DATABASE_URL...");
    const envVars = manager.getBotEnv("test-bot-unit");
    envVars["DATABASE_URL"] = "sqlite:///bot_data.sqlite";
    envVars["DB_PATH"] = "bot_data.sqlite";
    manager.setBotEnv("test-bot-unit", envVars);

    const readBackEnv = manager.getBotEnv("test-bot-unit");
    assert.strictEqual(readBackEnv.DATABASE_URL, "sqlite:///bot_data.sqlite");
    assert.strictEqual(readBackEnv.DB_PATH, "bot_data.sqlite");
    console.log("  ✓ DATABASE_URL and DB_PATH persisted and readable in .env");

    console.log("\n=======================================================");
    console.log(" ALL TESTS PASSED SUCCESSFULLY! (7/7)");
    console.log("=======================================================");
  } finally {
    // Cleanup test artifacts
    if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath);
    if (fs.existsSync(testBotDir)) fs.rmSync(testBotDir, { recursive: true, force: true });
  }
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
