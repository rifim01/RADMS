#!/bin/bash
set -e

# Route build to correct app based on Vercel project ID
# Dashboard: prj_NfcN1dxUxTVAPgoe7xQvH8BsCnOh
# Driver:    prj_dny34CacqE4gNyMgxfXq5yptPRyG

if [ "$VERCEL_PROJECT_ID" = "prj_NfcN1dxUxTVAPgoe7xQvH8BsCnOh" ]; then
  echo ">>> Building frontend-dashboard..."
  cd frontend-dashboard
else
  echo ">>> Building frontend-driver..."
  cd frontend-driver
fi

npm install
npm run build
cp -r dist ../public
echo ">>> Build complete."
