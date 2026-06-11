#!/bin/bash
# ============================================================
# RADMS Deploy Script
# Jalankan dari root folder RADMS:  bash deploy.sh
# Requires: git, node, npm, vercel CLI (npm i -g vercel)
# ============================================================

set -e

BRANCH="claude/blissful-lamport-xlnc5i"
ROOT=$(pwd)

echo ""
echo "=============================="
echo "  RADMS — Final Deploy Script"
echo "=============================="
echo ""

# 1. Pastikan di folder yang benar
if [ ! -d "frontend-dashboard" ] || [ ! -d "frontend-driver" ]; then
  echo "ERROR: Jalankan script ini dari folder root RADMS"
  exit 1
fi

# 2. Pull latest dari branch
echo ">>> [1/6] Pull latest dari GitHub..."
git fetch origin $BRANCH
git checkout $BRANCH
git pull origin $BRANCH
echo "    OK"

# 3. Build dashboard
echo ""
echo ">>> [2/6] Build frontend-dashboard..."
cd "$ROOT/frontend-dashboard"
npm install --silent
npm run build
echo "    Build OK — dist siap"

# 4. Build driver
echo ""
echo ">>> [3/6] Build frontend-driver..."
cd "$ROOT/frontend-driver"
npm install --silent
npm run build
echo "    Build OK — dist siap"

# 5. Deploy dashboard ke Vercel
echo ""
echo ">>> [4/6] Deploy dashboard ke Vercel (radms-dashboard)..."
cd "$ROOT/frontend-dashboard"
vercel --prod --yes
echo "    Deploy dashboard OK"

# 6. Deploy driver ke Vercel
echo ""
echo ">>> [5/6] Deploy driver ke Vercel (radms-driver)..."
cd "$ROOT/frontend-driver"
vercel --prod --yes
echo "    Deploy driver OK"

# 7. Done
echo ""
echo ">>> [6/6] Selesai!"
echo ""
echo "=============================="
echo "  URL Production:"
echo "  Dashboard : https://radms-dashboard.vercel.app"
echo "  Driver    : https://radms-driver.vercel.app"
echo "=============================="
echo ""
