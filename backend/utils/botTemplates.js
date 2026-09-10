const fs = require("fs");
const path = require("path");

/**
 * Starter template definitions and file generators.
 */
const TEMPLATES = {
  discordjs: {
    name: "Discord.js (v14) Starter",
    language: "javascript",
    command: "node",
    args: ["index.js"],
    description:
      "Modern Discord.js v14 bot with slash command support, event handlers, and ping command.",
    files: {
      "package.json": JSON.stringify(
        {
          name: "discord-js-bot",
          version: "1.0.0",
          description: "Discord bot powered by Discord.js and NexusPanel",
          main: "index.js",
          scripts: {
            start: "node index.js",
            dev: "node --watch index.js",
          },
          dependencies: {
            "discord.js": "^14.17.3",
            dotenv: "^16.4.7",
          },
        },
        null,
        2,
      ),
      "index.js":
        [
          "const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');",
          "require('dotenv').config();",
          "",
          "const token = process.env.DISCORD_TOKEN;",
          "const clientId = process.env.CLIENT_ID;",
          "",
          "if (!token) {",
          "  console.error('[ERROR] DISCORD_TOKEN is not set in environment or .env file!');",
          "  console.error('[INFO] Please set DISCORD_TOKEN in the Bot Environment tab.');",
          "  process.exit(1);",
          "}",
          "",
          "const client = new Client({",
          "  intents: [",
          "    GatewayIntentBits.Guilds,",
          "    GatewayIntentBits.GuildMessages,",
          "    GatewayIntentBits.MessageContent",
          "  ]",
          "});",
          "",
          "async function registerSlashCommands() {",
          "  if (!clientId || !token) return;",
          "  const commands = [",
          "    new SlashCommandBuilder()",
          "      .setName('ping')",
          "      .setDescription('Replies with Pong and WebSocket latency')",
          "      .toJSON(),",
          "    new SlashCommandBuilder()",
          "      .setName('serverinfo')",
          "      .setDescription('Displays server info')",
          "      .toJSON()",
          "  ];",
          "",
          "  const rest = new REST({ version: '10' }).setToken(token);",
          "  try {",
          "    console.log('[SYSTEM] Registering global application (/) commands...');",
          "    await rest.put(Routes.applicationCommands(clientId), { body: commands });",
          "    console.log('[SYSTEM] Successfully registered application (/) commands.');",
          "  } catch (err) {",
          "    console.warn('[WARN] Could not register slash commands:', err.message);",
          "  }",
          "}",
          "",
          "client.once('ready', async () => {",
          "  console.log('[READY] Logged in as ' + client.user.tag + ' (ID: ' + client.user.id + ')');",
          "  console.log('[READY] Serving ' + client.guilds.cache.size + ' guilds.');",
          "  await registerSlashCommands();",
          "});",
          "",
          "client.on('interactionCreate', async (interaction) => {",
          "  if (!interaction.isChatInputCommand()) return;",
          "  const { commandName } = interaction;",
          "  if (commandName === 'ping') {",
          "    const ping = client.ws.ping;",
          "    await interaction.reply({ content: 'Pong! WebSocket Latency: ' + ping + 'ms', ephemeral: false });",
          "  } else if (commandName === 'serverinfo') {",
          "    await interaction.reply({ content: 'Server: ' + (interaction.guild?.name || 'DM') + ' | Members: ' + (interaction.guild?.memberCount || 1) });",
          "  }",
          "});",
          "",
          "client.on('messageCreate', async (message) => {",
          "  if (message.author.bot) return;",
          "  const prefix = process.env.PREFIX || '!';",
          "  if (!message.content.startsWith(prefix)) return;",
          "  const args = message.content.slice(prefix.length).trim().split(/ +/);",
          "  const command = args.shift().toLowerCase();",
          "  if (command === 'ping') {",
          "    message.reply('Pong! Latency: ' + client.ws.ping + 'ms');",
          "  }",
          "});",
          "",
          "client.login(token);",
        ].join("\n") + "\n",
      ".env.example":
        "DISCORD_TOKEN=your_bot_token_here\nCLIENT_ID=your_application_client_id_here\nPREFIX=!\n",
      ".gitignore": "node_modules/\n.env\n.env.local\n*.log\n",
      "README.md":
        "# Discord.js Bot Template\n\nScaffolded by NexusPanel.\n\n## Getting Started\n1. Set DISCORD_TOKEN in the Environment tab.\n2. Click 'Install Dependencies' to run npm install.\n3. Click Start to launch!\n",
    },
  },

  discordpy: {
    name: "Discord.py Starter",
    language: "python",
    command: "python3",
    args: ["bot.py"],
    description:
      "Python 3 bot using discord.py with slash command tree and prefix commands.",
    files: {
      "requirements.txt": "discord.py>=2.3.2\npython-dotenv>=1.0.0\n",
      "bot.py":
        [
          "import os",
          "import discord",
          "from discord import app_commands",
          "from discord.ext import commands",
          "from dotenv import load_dotenv",
          "",
          "load_dotenv()",
          "TOKEN = os.getenv('DISCORD_TOKEN')",
          "PREFIX = os.getenv('PREFIX', '!')",
          "",
          "if not TOKEN:",
          "    print('[ERROR] DISCORD_TOKEN is not set in environment or .env file!')",
          "    print('[INFO] Please configure your bot token in the NexusPanel Environment tab.')",
          "    exit(1)",
          "",
          "intents = discord.Intents.default()",
          "intents.message_content = True",
          "bot = commands.Bot(command_prefix=PREFIX, intents=intents)",
          "",
          "@bot.event",
          "async def on_ready():",
          "    print(f'[READY] Logged in as {bot.user} (ID: {bot.user.id})')",
          "    try:",
          "        synced = await bot.tree.sync()",
          "        print(f'[SYSTEM] Synced {len(synced)} slash command(s).')",
          "    except Exception as e:",
          "        print(f'[WARN] Failed to sync slash commands: {e}')",
          "",
          "@bot.tree.command(name='ping', description='Replies with Pong and latency')",
          "async def slash_ping(interaction: discord.Interaction):",
          "    latency_ms = round(bot.latency * 1000)",
          "    await interaction.response.send_message(f'Pong! Latency: {latency_ms}ms')",
          "",
          "@bot.command(name='ping')",
          "async def prefix_ping(ctx):",
          "    latency_ms = round(bot.latency * 1000)",
          "    await ctx.reply(f'Pong! Latency: {latency_ms}ms')",
          "",
          "bot.run(TOKEN)",
        ].join("\n") + "\n",
      ".env.example": "DISCORD_TOKEN=your_bot_token_here\nPREFIX=!\n",
      ".gitignore": "__pycache__/\n*.pyc\n.env\nvenv/\n.venv/\n",
      "README.md":
        "# Discord.py Bot Template\n\nScaffolded by NexusPanel.\n\n## Getting Started\n1. Configure DISCORD_TOKEN in Environment.\n2. Run pip install -r requirements.txt.\n3. Start the bot via the dashboard!\n",
    },
  },

  typescript: {
    name: "TypeScript Discord.js Starter",
    language: "typescript",
    command: "npm",
    args: ["start"],
    description:
      "Discord.js v14 setup with TypeScript compilation and strict typing.",
    files: {
      "package.json": JSON.stringify(
        {
          name: "discord-ts-bot",
          version: "1.0.0",
          description: "TypeScript Discord Bot on NexusPanel",
          main: "dist/index.js",
          scripts: {
            build: "tsc",
            start: "node dist/index.js",
            dev: "ts-node src/index.ts",
          },
          dependencies: {
            "discord.js": "^14.17.3",
            dotenv: "^16.4.7",
          },
          devDependencies: {
            typescript: "^5.7.3",
            "@types/node": "^20.17.0",
            "ts-node": "^10.9.2",
          },
        },
        null,
        2,
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "commonjs",
            lib: ["ES2022"],
            outDir: "./dist",
            rootDir: "./src",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ["src/**/*"],
        },
        null,
        2,
      ),
      "src/index.ts":
        [
          "import { Client, GatewayIntentBits } from 'discord.js';",
          "import * as dotenv from 'dotenv';",
          "dotenv.config();",
          "",
          "const token = process.env.DISCORD_TOKEN;",
          "if (!token) {",
          "  console.error('[ERROR] DISCORD_TOKEN is missing!');",
          "  process.exit(1);",
          "}",
          "",
          "const client = new Client({",
          "  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]",
          "});",
          "",
          "client.once('ready', () => {",
          "  console.log('[READY] TypeScript Bot logged in as ' + client.user?.tag);",
          "});",
          "",
          "client.on('messageCreate', (message) => {",
          "  if (message.author.bot) return;",
          "  if (message.content === '!ping') {",
          "    message.reply('Pong! (' + client.ws.ping + 'ms)');",
          "  }",
          "});",
          "",
          "client.login(token);",
        ].join("\n") + "\n",
      ".env.example": "DISCORD_TOKEN=your_bot_token_here\nPREFIX=!\n",
      ".gitignore": "node_modules/\ndist/\n.env\n*.log\n",
      "README.md": "# TypeScript Discord Bot\n\nScaffolded by NexusPanel.\n",
    },
  },

  minimal: {
    name: "Minimal Node.js Bot / Service",
    language: "javascript",
    command: "node",
    args: ["index.js"],
    description:
      "Clean single-file Node.js daemon with heartbeat loop and environment support.",
    files: {
      "package.json": JSON.stringify(
        {
          name: "minimal-bot",
          version: "1.0.0",
          main: "index.js",
          scripts: {
            start: "node index.js",
          },
          dependencies: {
            dotenv: "^16.4.7",
          },
        },
        null,
        2,
      ),
      "index.js":
        [
          "require('dotenv').config();",
          "",
          "console.log('[SYSTEM] Starting Minimal Bot Service...');",
          "console.log('[SYSTEM] Environment: ' + (process.env.NODE_ENV || 'production'));",
          "",
          "let tick = 0;",
          "setInterval(() => {",
          "  tick++;",
          "  console.log('[HEARTBEAT] Bot tick #' + tick + ' - System operational (' + new Date().toLocaleTimeString() + ')');",
          "}, 10000);",
          "",
          "process.on('SIGTERM', () => {",
          "  console.log('[SYSTEM] Received SIGTERM, gracefully shutting down.');",
          "  process.exit(0);",
          "});",
        ].join("\n") + "\n",
      ".env.example": "SERVICE_NAME=MinimalBot\nPORT=3000\n",
      ".gitignore": "node_modules/\n.env\n",
    },
  },
};

/**
 * Scaffolds a starter template into the target bot directory.
 */
function scaffoldTemplate(botDir, templateKey, initialEnv = {}) {
  const template = TEMPLATES[templateKey];
  if (!template) {
    throw new Error(
      'Unknown template "' +
        templateKey +
        '". Available: ' +
        Object.keys(TEMPLATES).join(", "),
    );
  }

  if (!fs.existsSync(botDir)) {
    fs.mkdirSync(botDir, { recursive: true });
  }

  for (const [relPath, content] of Object.entries(template.files)) {
    const fullPath = path.join(botDir, relPath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, "utf8");
  }

  const envFilePath = path.join(botDir, ".env");
  const envLines = [];
  for (const [k, v] of Object.entries(initialEnv)) {
    if (k && k.trim()) {
      envLines.push(k.trim() + "=" + (v || ""));
    }
  }

  if (envLines.length > 0) {
    fs.writeFileSync(envFilePath, envLines.join("\n") + "\n", "utf8");
  } else if (template.files[".env.example"]) {
    fs.copyFileSync(path.join(botDir, ".env.example"), envFilePath);
  }

  return {
    template: templateKey,
    name: template.name,
    command: template.command,
    args: template.args,
    filesCreated: Object.keys(template.files),
  };
}

module.exports = {
  TEMPLATES,
  scaffoldTemplate,
};
