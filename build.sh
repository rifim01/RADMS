#!/bin/bash
set -e

# Route build based on Vercel project ID
if [ "$VERCEL_PROJECT_ID" = "prj_NfcN1dxUxTVAPgoe7xQvH8BsCnOh" ]; then
  echo ">>> Building frontend-dashboard..."
  APP="frontend-dashboard"
else
  echo ">>> Building frontend-driver..."
  APP="frontend-driver"
fi

cd "$APP"
npm install
npm run build

# Wipe then copy build output to /public at repo root
mkdir -p ../public
rm -rf ../public/*
cp -r dist/* ../public/

echo ">>> Done. Files: $(ls ../public | head -5)"
