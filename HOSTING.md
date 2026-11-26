# Run Forge on your home server

Forge uses Docker Compose and keeps the dashboard on the server’s loopback interface. An SSH tunnel gives you access from your computer. The backend stays inside the Docker network.

## New installation

On a Linux home server with Git, OpenSSL, Docker Engine, and the Docker Compose plugin:

```bash
ssh YOUR_USER@YOUR_SERVER
git clone https://github.com/iBrahimAi0/home-server.git
cd home-server
bash scripts/setup-host.sh
docker compose up -d --build
docker compose ps
```

Sign in as **admin** using the password printed by the setup script. It generates a unique password and saves it in `.env`. Running the script again prints your current credentials. Keep that terminal output private.

On your computer, open a separate terminal and keep this tunnel running:

```bash
ssh -N -L 3000:127.0.0.1:3000 YOUR_USER@YOUR_SERVER
```

Open [Forge on localhost](http://localhost:3000). If port 3000 is already used on your computer, use `-L 4300:127.0.0.1:3000` and open [Forge on port 4300](http://localhost:4300).

## Replace an existing installation

Run these commands over SSH from your **existing** `home-server` checkout. The backup may include bot secrets.

```bash
cd ~/home-server
backup="$HOME/forge-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
(umask 077; tar -czf "$backup" bots backend/config)
git status --short
```

If you have local changes, save or commit the changes you need before pulling. For a host with a locally edited tracked `backend/config/bots.json`, keep a private copy outside the checkout before restoring the tracked file for the pull, then copy your saved config back afterwards. Bot paths need to point to `/app/bots` inside Docker. A standard `bots/<bot-id>` project is found automatically. Move or mount any custom project paths separately.

If the old installation used **systemd**, stop its units before starting Compose so they release the ports. Run the command for the unit names installed on your host:

```bash
sudo systemctl disable --now nexuspanel-dashboard.service nexuspanel-backend.service
# Or, for the older unit names:
sudo systemctl disable --now home-server-dashboard.service home-server-backend.service
```

If the old installation used Compose from a **different checkout or project**, run `docker compose down` from that old checkout before starting the upgraded one.

```bash
git pull --ff-only
bash scripts/setup-host.sh
docker compose up -d --build --remove-orphans
docker compose ps
```

Check that the new dashboard shows your bots before deleting any old checkout or images.

## Host a bot

1. Put your source and dependency manifest in a ZIP. Forge recognizes a Node.js `package.json` with a start script and common Python projects with `main.py` or `bot.py`. Include `requirements.txt` for Python dependencies.
2. Sign in, select **Deploy a bot**, and drop the ZIP. Forge fills in a project name. A ZIP containing a single project folder is supported.
3. If the bot needs a token, expand **Environment variables** and paste `DISCORD_TOKEN=your-token` or import your `.env` file. Use the variable names your code expects.
4. Select **Create project**. Leave **Start when ready and on host boot** selected to install dependencies and start automatically. Follow setup in the **Console** tab. Use **Environment** to edit variables later.

Check container logs with `docker compose logs --tail=100` if the dashboard is unreachable. The bot console shows errors from your project. Only upload projects whose code and dependencies you trust, since bots share the backend container.
