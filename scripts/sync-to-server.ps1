# Sync local project to server via rsync (requires WSL) or run the .sh script from WSL.
# Run from repo root in Cursor terminal: .\scripts\sync-to-server.ps1
# 1. Edit SERVER and REMOTE_PATH below.
# 2. Ensure WSL has rsync: wsl sudo apt install -y rsync openssh-client

$SERVER = "user@your-server"       # e.g. ubuntu@192.168.1.100
$REMOTE_PATH = "/home/user/HotelSystems"

$target = "${SERVER}:${REMOTE_PATH}"
Write-Host "Syncing to $target ..."
wsl bash -c "rsync -avz --delete --exclude 'node_modules' --exclude '.venv' --exclude '.next' --exclude '__pycache__' --exclude '.git' --exclude '*.pyc' --exclude '.env' --exclude 'postgres_data' ./ '$target/'"
if ($LASTEXITCODE -eq 0) { Write-Host "Sync done." } else { Write-Host "Sync failed. Check WSL + rsync + SSH access." }
