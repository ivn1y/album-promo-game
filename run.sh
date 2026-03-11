#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "→ git checkout main"
git checkout main

echo "→ git pull origin main"
git pull origin main

echo "→ npm install"
npm install

echo "→ останавливаем старый Vite dev-сервер"
pkill -f "vite" 2>/dev/null || true
sleep 1

echo "→ npm run dev"
npm run dev
