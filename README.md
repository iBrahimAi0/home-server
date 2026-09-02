# NexusPanel — Home Server Infrastructure & Bot Controller

NexusPanel is a high-security, technical server management panel designed for Ubuntu Home Servers. It directly manages Discord bot processes via isolated process groups (`child_process.spawn`), provides a full-featured **Bot File Manager**, enables safe **GitHub Synchronization**, extracts archives with Zip-Slip/Zip Bomb defenses, monitors hardware telemetry in real-time, and keeps services running 24/7 with persistent systemd daemons.

---

## ⚡ Key Highlights

* **100% Real Process Management**: Spawns bot processes with dedicated process groups (`detached: true`, `kill(-pid)`), monitors exact RSS RAM and CPU via `ps`, and streams stdout/stderr logs in real-time via Socket.IO.
* **Powerful Bot File Manager**:
  * Browse directories with breadcrumb navigation and up/back folder traversal.
  * In-dashboard code editor with line numbers, tab indentation, and `Ctrl+S` saving.
  * Create files & folders, rename, and delete with recursive safety confirmation.
  * Drag-and-drop file upload with duplicate overwrite protection.
  * ZIP archive upload, inspection preview (entry count & uncompressed size), and safe extraction.
* **Restricted GitHub Synchronization**:
  * 1-click update checks against remote branches (`git fetch` + commit diff count).
  * Safe fast-forward pulls (`git pull --ff-only`) with local uncommitted modification detection.
  * Zero arbitrary terminal/command execution exposed to the web.
* **Deep Security Hardening**:
  * Strict path resolution preventing directory traversal (`../../etc/passwd`, null bytes, symlink escapes).
  * Centralized sensitive file protection blocking read/write access to `.env*`, `id_rsa*`, `*.pem`, `*.key`, `*.token`, `.git/`.
  * Modular authentication middleware supporting optional Bearer tokens / API keys.
  * Rate limiting, request size limits, and sanitized error responses.
* **Modern Technical UI**:
  * Dark charcoal aesthetic with deep neutral surfaces, crisp borders, and indigo accent.
  * Original geometric vector SVG NexusPanel logo.
  * 4-tab bot details view: **Overview | Files | Logs | GitHub**.

---

## 🏗️ Architecture Overview

```text
LAN Client / Browser (e.g. http://192.168.1.120:3000)
       │
       ▼
Next.js 15 Frontend UI (:3000)
       │
       ▼ (REST API / Socket.IO Realtime)
Express Backend Controller (:3001)
 ├── Security: Helmet, CORS, Rate Limiter, Path Traversal Defenses, Sensitive File Filter
 ├── Services:
 │     ├── BotManager.js      --> child_process.spawn() [Process Groups: -pid]
 │     ├── GitService.js      --> execFile('git', args) [Restricted Parameters]
 │     └── archiveSecurity.js --> AdmZip [Zip-Slip & Zip Bomb Defenses]
 └── Telemetry: systemMonitor.js (Linux CPU delta, RAM, df storage)
```

---

## 📁 Directory Structure

```text
home-server/
├── bots/
│   └── bot-1/          # Role Bot
│
├── backend/
│   ├── server.js               # Express + Socket.IO server (Port 3001)
│   ├── managers/
│   │   └── BotManager.js       # Process Group & Crash Recovery Manager
│   ├── services/
│   │   └── GitService.js       # Restricted Git synchronization service
│   ├── routes/
│   │   ├── bots.js             # Bot lifecycle API
│   │   ├── files.js            # File management & ZIP archive API
│   │   ├── git.js              # GitHub synchronization API
│   │   └── system.js           # Hardware telemetry API
│   ├── middleware/
│   │   ├── auth.js             # Optional Bearer token / API key authentication
│   │   ├── rateLimiter.js      # Sliding-window in-memory rate limiter
│   │   └── errorHandler.js     # Sanitized error response handler
│   ├── utils/
│   │   ├── pathSecurity.js     # Traversal & symlink defense
│   │   ├── sensitiveFiles.js   # Credential & secret filter (.env, id_rsa, keys)
│   │   ├── archiveSecurity.js  # Zip-Slip & bomb protection + inspection
│   │   └── systemMonitor.js    # Linux CPU/RAM/Storage monitor
│   ├── config/
│   │   └── bots.json           # Bot definitions & working directories
│   ├── .env.example
│   └── package.json
│
├── app/                        # Next.js App Router (Dashboard UI)
├── components/                 # UI components & modals
│   ├── files/                  # FileManager, CodeEditorModal, Upload, Extract, Rename, Delete
│   └── git/                    # GitHubSync, PullConfirmModal
├── lib/
│   ├── api.ts                  # Client API connector with auth header injection
│   ├── branding.ts             # Centralized branding configuration
│   ├── socket.ts               # Realtime Socket.IO client
│   └── types.ts                # TypeScript interfaces
├── systemd/                    # Ubuntu 24/7 background service definitions
└── README.md
```

---

## 🚀 Quick Start on Ubuntu Server

### 1. Install & Start Backend

```bash
cd ~/home-server/backend
npm install
cp .env.example .env
npm start
```

### 2. Build & Start Dashboard

```bash
cd ~/home-server
npm install
cp .env.example .env.local
npm run build
npm start
```

---

## 🛡️ Ubuntu systemd Setup (24/7 Background Services)

```bash
# 1. Install Backend Service (:3001)
sudo cp ~/home-server/systemd/nexuspanel-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nexuspanel-backend
sudo systemctl start nexuspanel-backend

# 2. Install Dashboard Service (:3000)
sudo cp ~/home-server/systemd/nexuspanel-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nexuspanel-dashboard
sudo systemctl start nexuspanel-dashboard
```

---

## 🔒 Security Configuration

To enable API authentication, set `AUTH_TOKEN` in `backend/.env`:

```env
AUTH_TOKEN=your-random-secure-secret-token
```

When configured, all requests require an `Authorization: Bearer <token>` or `x-api-key: <token>` header.

---

## 🌍 Accessing the Dashboard From Outside Your Home Network

**Recommended: Tailscale.** This panel can spawn processes, read/write bot
files, and pull from GitHub — don't expose it directly to the public
internet via port forwarding. Tailscale creates a private encrypted mesh
network between your devices; the dashboard is never reachable by anyone
outside it, and you don't open any ports on your router.

1. Install Tailscale on the Ubuntu server: `curl -fsSL https://tailscale.com/install.sh | sh` then `sudo tailscale up`.
2. Install the Tailscale app on your phone/laptop and sign in with the same account.
3. Note the server's Tailscale IP or MagicDNS name (`tailscale ip -4`, or `home-server.your-tailnet.ts.net`).
4. On the server, edit `backend/.env` and add that address to `CORS_ORIGIN`, e.g.:
   `CORS_ORIGIN=http://192.168.1.120:3000,http://home-server.your-tailnet.ts.net:3000`
5. From anywhere, open `http://<tailscale-ip-or-name>:3000` — same as being on your home LAN.
6. Also set `AUTH_TOKEN` in `backend/.env` (see above) as a second layer of protection.

**Alternative: Cloudflare Tunnel**, if you want a normal public URL you can open from any browser without installing an app on your device. Run `cloudflared tunnel` on the server to expose `:3000` under a subdomain of your own domain, and turn on **Cloudflare Access** in front of it so only your email/account can log in before the dashboard even loads. More setup than Tailscale, but no client install needed on the accessing device.

**Avoid:** plain router port-forwarding to `:3000`/`:3001` with just `AUTH_TOKEN`. It works, but it puts a panel with file-system and process-spawn access directly on the public internet behind a single password with no login-attempt lockout.
