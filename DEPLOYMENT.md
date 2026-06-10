# RADMS — Deployment Guide

This guide covers deploying both frontend applications to Vercel as separate projects,
and configuring them to talk to the Google Apps Script backend.

---

## Prerequisites

- [Vercel account](https://vercel.com) (free tier is sufficient)
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`
- Both frontends must have a `.env.local` file with the required variables (see README).
- The Google Apps Script Web App must already be deployed (see README → Apps Script Deployment).

---

## Project 1 — frontend-dashboard (Staff/Admin Portal)

### First-time setup via CLI

```bash
cd /path/to/RADMS/frontend-dashboard

# Log in to Vercel (browser window will open)
vercel login

# Link or create Vercel project
vercel link
# Answer prompts:
#   Set up and deploy? Y
#   Scope: <your team or personal>
#   Link to existing project? N (first time)
#   Project name: radms-dashboard
#   Directory: ./  (already in frontend-dashboard)
#   Auto-detected framework: Vite

# Set environment variables (do NOT commit .env.local to git)
vercel env add VITE_API_BASE_URL
# Paste your Apps Script Web App URL when prompted
# Select: Production, Preview, Development

vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_DATABASE_URL
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_VAPID_KEY

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Dashboard setup (alternative to CLI)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your Git repository.
3. Set **Root Directory** to `frontend-dashboard`.
4. Framework: **Vite** (auto-detected).
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add all `VITE_*` environment variables in the Environment Variables section.
8. Click **Deploy**.

### Custom domain (optional)
In Vercel Dashboard → Project → Domains → Add `dashboard.rifim.org` or similar.

---

## Project 2 — frontend-driver (Driver PWA)

The driver app is a Progressive Web App (PWA) and should be deployed as a separate
Vercel project so it can have its own domain and push notification origin.

### First-time setup via CLI

```bash
cd /path/to/RADMS/frontend-driver

vercel link
# Project name: radms-driver

# Add environment variables (same VITE_* set as above)
vercel env add VITE_API_BASE_URL
vercel env add VITE_FIREBASE_API_KEY
# ... (repeat for all Firebase vars)
vercel env add VITE_FIREBASE_VAPID_KEY   # required for web push

vercel --prod
```

### Vercel Dashboard setup

1. New project → import same repository.
2. **Root Directory**: `frontend-driver`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add all environment variables.
6. Deploy.

### PWA / HTTPS note
Vercel provides HTTPS by default on all deployments, which is required for:
- Service Workers (PWA offline support)
- Web Push Notifications (requires VAPID key)
- Geolocation API (driver GPS)
- Camera API (selfie check-in)

---

## Environment Variables Reference

| Variable | Used by | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | Both | Google Apps Script Web App URL |
| `VITE_FIREBASE_API_KEY` | Both | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Both | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | Both | Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID` | Both | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Both | `<project>.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Both | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Both | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | driver | Web Push VAPID public key |

---

## CI/CD with GitHub

Vercel automatically re-deploys on every push to the connected Git repository.

- Pushes to `main` → **Production** deployment
- Pushes to any other branch → **Preview** deployment (unique URL)

### Recommended branch strategy

```
main          ──► Production (both Vercel projects auto-deploy)
develop       ──► Staging preview
feature/*     ──► Per-PR preview
```

To prevent auto-deploy on `main` and require manual promotion:
Vercel Dashboard → Project → Settings → Git → set Production Branch protection.

---

## Rollback

In Vercel Dashboard → Deployments tab:
1. Find the previous successful deployment.
2. Click the three-dot menu → **Promote to Production**.

Or via CLI:
```bash
vercel rollback [deployment-url]
```

---

## Google Apps Script — Versioning

Each Apps Script deployment is immutable. When you push code changes:

1. In the Apps Script editor: Deploy → Manage Deployments.
2. Edit the existing deployment → bump the version.
3. Or create a new deployment and update `VITE_API_BASE_URL` in both Vercel projects.

> Tip: Use a stable URL alias by always editing (not creating) your Web App deployment
> so the URL stays the same.

---

## Health Check

After deploying, verify the backend is reachable:

```bash
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=ping"
# Expected: { "success": true, "message": "RADMS API v1.0 ..." }
```

For frontends, open the Vercel deployment URL in a browser and confirm the login page loads.
