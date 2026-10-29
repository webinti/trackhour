#!/usr/bin/env bash
# Deploy on the VPS: pull, build, ship static assets next to the standalone server,
# then reload pm2 with the current .env.local.
set -euo pipefail
cd "$(dirname "$0")/.."

git pull origin main
npm install --no-audit --no-fund
npm run build

rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 status trackhour
