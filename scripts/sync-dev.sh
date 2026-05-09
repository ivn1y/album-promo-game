#!/usr/bin/env bash
# Подтянуть код с GitHub, обновить зависимости, запустить Vite с доступом по LAN (телефон в той же Wi‑Fi).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Репозиторий: $ROOT"
BRANCH="$(git branch --show-current)"
echo "==> Текущая ветка: ${BRANCH}"

echo "==> git fetch"
git fetch origin --prune

echo "==> git pull (с явным remote, чтобы работало без upstream)"
if git show-ref --verify --quiet "refs/remotes/origin/${BRANCH}"; then
  git pull origin "${BRANCH}"
  git branch --set-upstream-to="origin/${BRANCH}" "${BRANCH}" 2>/dev/null || true
  echo "    Дальше обычный «git pull» в этой ветке тоже должен работать."
else
  echo "    На GitHub нет ветки origin/${BRANCH} — подтянуть нечего (сделай push или checkout на main)."
fi

echo "==> npm install"
npm install

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [[ -z "${LAN_IP}" ]]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [[ -n "${LAN_IP}" ]]; then
  echo ""
  echo "==> На телефоне открой: http://${LAN_IP}:5173/"
  echo "    (если порт другой — смотри строку Network в выводе Vite ниже)"
  echo ""
else
  echo ""
  echo "==> Не удалось определить IP (en0/en1). В выводе Vite ищи строку «Network»."
  echo ""
fi

echo "==> Запуск dev-сервера (host уже включён в vite.config)…"
exec npm run dev
