#!/usr/bin/env bash

# Hostforge installation script
# Designed for debian-based systemd systems.
# May work on other systemd systems, but not tested.

# Install docker if not installed
if ! [ -x "$(command -v docker)" ]; then
  echo "[i] Docker is not installed. Installing docker..."
  curl -sSL https://get.docker.com/ | CHANNEL=stable bash
  sudo systemctl enable --now docker
  echo "[i] Docker installed successfully."
fi

# Initialize docker swarm
if ! docker info | grep -q "Swarm: active"; then
  echo "[i] Initializing docker swarm..."
  docker swarm init
  echo "[i] Docker swarm initialized successfully."
fi

# Create networks
if ! docker network ls | grep -q "hostforge_public"; then
  echo "[i] Creating hostforge_public network..."
  docker network create --driver overlay --attachable hostforge_public > /dev/null
  echo "[i] hostforge_public network created successfully."
fi

if ! docker network ls | grep -q "hostforge_internal"; then
  echo "[i] Creating hostforge_internal network..."
  docker network create --driver overlay --attachable hostforge_internal > /dev/null
  echo "[i] hostforge_internal network created successfully."
fi

if ! docker network ls | grep -q "hostforge_registry"; then
  echo "[i] Creating hostforge_registry network..."
  docker network create --driver overlay --attachable hostforge_registry > /dev/null
  echo "[i] hostforge_registry network created successfully."
fi

# Create hostforge service
mkdir -p /var/lib/hostforge/traefik
docker service create \
  --name hostforge \
  --network hostforge_public \
  --network hostforge_internal \
  --network hostforge_registry \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  --mount type=bind,source=/var/lib/hostforge,target=/app/data \
  --publish 3000:3000 \
  -e DATABASE_PATH=/app/data/db.sqlite \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e HOSTNAME=0.0.0.0 \
  ghcr.io/itzderock/hostforge:main

# get the current IP address
IP=$(ip route get 8.8.8.8 | sed -n '/src/{s/.*src *\([^ ]*\).*/\1/p;q}')

# hostforge ascii art
clear
echo "  _    _           _    __                     "
echo " | |  | |         | |  / _|                    "
echo " | |__| | ___  ___| |_| |_ ___  _ __ __ _  ___ "
echo " |  __  |/ _ \/ __| __|  _/ _ \| '__/ _\` |/ _ \\"
echo " | |  | | (_) \__ \ |_| || (_) | | | (_| |  __/"
echo " |_|  |_|\___/|___/\__|_| \___/|_|  \__, |\___|"
echo "                                     __/ |     "
echo "                                    |___/      "
echo ""
echo "Hostforge is now running on port 3000."
echo "Visit http://$IP:3000 to access the dashboard."
echo ""
echo "Still have issues? Check out the documentation at https://docs.hostforge.sh/"

sleep 1
