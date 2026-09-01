#!/bin/bash
# ==============================================================================
# NexusPanel - Systemd Services Installation & Enablement Script
# Runs NexusPanel Backend (:3001) and Frontend (:3000) 24/7 on Ubuntu Server
# ==============================================================================

set -e

echo ">>> [NexusPanel] Installing systemd services..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="/etc/systemd/system"

# 1. Copy backend and dashboard service files
echo ">>> Copying service files to ${SERVICE_DIR}..."
sudo cp "${SCRIPT_DIR}/nexuspanel-backend.service" "${SERVICE_DIR}/"
sudo cp "${SCRIPT_DIR}/nexuspanel-dashboard.service" "${SERVICE_DIR}/"

# 2. Reload systemd daemon
echo ">>> Reloading systemd daemon..."
sudo systemctl daemon-reload

# 3. Enable services to launch on system boot
echo ">>> Enabling NexusPanel services for auto-start on boot..."
sudo systemctl enable nexuspanel-backend.service
sudo systemctl enable nexuspanel-dashboard.service

# 4. Start services immediately
echo ">>> Starting NexusPanel backend and dashboard..."
sudo systemctl restart nexuspanel-backend.service
sudo systemctl restart nexuspanel-dashboard.service

echo ""
echo "=============================================================================="
echo "  NexusPanel Services Successfully Installed and Running!"
echo "=============================================================================="
echo "  Backend status:   sudo systemctl status nexuspanel-backend"
echo "  Dashboard status: sudo systemctl status nexuspanel-dashboard"
echo "  Backend logs:     sudo journalctl -u nexuspanel-backend -f"
echo "  Dashboard logs:   sudo journalctl -u nexuspanel-dashboard -f"
echo "=============================================================================="
