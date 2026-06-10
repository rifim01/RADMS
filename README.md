# RADMS — RIFIM Airport Driver Management System

A full-stack system for managing airport taxi/driver queues, attendance, KPIs, and real-time
location tracking across all airports operated by RIFIM.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│                                                                 │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐  │
│  │  frontend-dashboard     │   │  frontend-driver            │  │
│  │  (React + Vite)         │   │  (React + Vite + PWA)       │  │
│  │  Staff / Admin / Nat'l  │   │  Driver mobile app          │  │
│  │  Deployed on Vercel     │   │  Deployed on Vercel         │  │
│  └────────────┬────────────┘   └─────────────┬───────────────┘  │
└───────────────┼─────────────────────────────┼───────────────────┘
                │  HTTPS (REST JSON)           │  HTTPS (REST JSON)
                ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              Google Apps Script Web App (Backend)                │
│                                                                  │
│  Code.gs         – HTTP router (doPost / doGet)                  │
│  Auth.gs         – Login, token generation & verification        │
│  Driver.gs       – Driver CRUD + GPS location updates            │
│  Queue.gs        – FIFO queue management per airport             │
│  Attendance.gs   – Staff check-in / check-out                    │
│  KPI.gs          – Monthly KPI calculation (5 dimensions)        │
│  Report.gs       – Daily / weekly / monthly / national reports   │
│  Notification.gs – In-app + FCM push notifications               │
└──────────────────────────────┬───────────────────────────────────┘
                               │  SpreadsheetApp service
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              Google Sheets (Primary Database)                    │
│                                                                  │
│  AIRPORTS  │ DRIVERS      │ STAFF        │ ATTENDANCE            │
│  QUEUE_HISTORY             │ TRACKING_LOG │ KPI                  │
│  REPORTS   │ NOTIFICATIONS │ TOKENS                              │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │  Firebase SDK / REST API
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              Firebase (Real-time layer)                          │
│                                                                  │
│  Realtime Database  – live GPS, queue state, emergencies         │
│  Authentication     – UID ↔ token binding                        │
│  Cloud Messaging    – push notifications (FCM)                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Module Descriptions

| File | Purpose |
|------|---------|
| `Code.gs` | HTTP entry point. Routes `action` params to the correct handler. Shared utilities (`getSheet`, `sheetToObjects`, `appendRow`, `generateId`, `formatDate`). |
| `Auth.gs` | HMAC-SHA256 signed tokens. `loginDriver` (phone+password), `loginStaff` (email+password), `verifyToken`, `generateToken`. Tokens expire in 7 days and are stored in the TOKENS sheet for revocation. |
| `Driver.gs` | Full driver lifecycle: `createDriver`, `getDriver`, `getDrivers`, `updateDriver`, `deleteDriver` (soft), `updateDriverLocation` (logs to TRACKING_LOG), `updateDriverStatus`. |
| `Queue.gs` | FIFO queue per airport: `joinQueue`, `leaveQueue`, `callDriver`, `completePickup`. All terminal events are appended to QUEUE_HISTORY. Active queue is stored in extra columns on the DRIVERS sheet. |
| `Attendance.gs` | `checkIn` / `checkOut` with GPS coordinates and method (GPS/QR/Selfie). Auto-detects LATE (>15 min after 07:00) and EARLY_LEAVE (<7 h shift). `getAttendanceSummary` aggregates per-airport counts. |
| `KPI.gs` | Monthly scoring: Attendance 20%, Queue Compliance 20%, Pickup Activity 30%, Response Time 20%, Violation deduction 10%. `getKPIReport` runs all drivers for an airport. `saveKPI` upserts into the KPI sheet. |
| `Report.gs` | `getDailyReport`, `getWeeklyReport`, `getMonthlyReport`, `getNationalReport`. All persist a summary row to the REPORTS sheet. `exportToCSV` generates a properly-escaped CSV string. |
| `Notification.gs` | `sendNotification` (role-broadcast), `getNotifications` (unread for user), `markAsRead`, `sendEmergencyAlert` (panic button → FCM high-priority + Firebase RTDB write). |

---

## Required Google Sheets Structure

Create one Google Spreadsheet and add the following sheets (tabs). The first row of each sheet must be the header row exactly as shown.

### AIRPORTS
`id | name | city | province | iata_code | address | status | created_at`

### DRIVERS
`id | name | phone | password_hash | airport_id | license_number | vehicle_type | vehicle_plate | status | online | lat | lng | speed | last_location_update | queue_position | queue_status | queue_joined_at | queue_called_at | queue_airport_id | created_at | updated_at | deleted_at`

### STAFF
`id | name | email | password_hash | role | airport_id | phone | status | created_at | updated_at`

Roles: `STAFF` | `SUPERVISOR` | `ADMIN` | `NATIONAL_ADMIN`

### ATTENDANCE
`id | user_id | user_name | airport_id | date | check_in_time | check_out_time | check_in_lat | check_in_lng | check_out_lat | check_out_lng | method | duration_minutes | status | notes | created_at`

### QUEUE_HISTORY
`id | driver_id | driver_name | airport_id | queue_position | status | joined_at | called_at | completed_at | date`

### TRACKING_LOG
`id | driver_id | airport_id | lat | lng | speed | timestamp`

### KPI
`id | driver_id | driver_name | airport_id | month | year | attendance_score | queue_score | pickup_score | response_score | violation_deduction | total_score | grade | calculated_at`

### REPORTS
`id | airport_id | report_type | period | total_drivers | online_drivers | total_queues | completed_pickups | avg_wait_minutes | avg_response_minutes | attendance_rate | kpi_avg | generated_at`

### NOTIFICATIONS
`id | target_role | target_user_id | airport_id | title | message | type | is_read | read_by | created_at | read_at`

### TOKENS
`token | userId | role | airportId | createdAt | expiresAt | revoked`

---

## Google Apps Script Deployment

### Prerequisites
- A Google account with access to Google Sheets and Apps Script.
- [clasp](https://github.com/google/clasp) (optional, for CLI deployment): `npm install -g @google/clasp`

### Steps

1. **Create the Google Spreadsheet**
   - Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
   - Add all sheet tabs listed above with correct headers.
   - Copy the Spreadsheet ID from the URL:  
     `https://docs.google.com/spreadsheets/d/**<SPREADSHEET_ID>**/edit`

2. **Create a new Apps Script project**
   - Go to [script.google.com](https://script.google.com) → New Project.
   - Delete the default `Code.gs` content.
   - Copy each `.gs` file from `apps-script/` into separate script files with matching names.
   - Replace `appsscript.json` (enable "Show appsscript.json" in Project Settings first).

3. **Set Script Properties**
   - Project Settings → Script Properties → Add the following:

   | Key | Value |
   |-----|-------|
   | `SPREADSHEET_ID` | Your spreadsheet ID (step 1) |
   | `TOKEN_SECRET` | A long random string (min 32 chars) |
   | `FIREBASE_SERVER_KEY` | FCM Legacy Server Key from Firebase Console |
   | `FIREBASE_DB_URL` | Your Firebase RTDB URL |

4. **Deploy as Web App**
   - Deploy → New Deployment → Type: Web App.
   - Execute as: **Me (your Google account)**.
   - Who has access: **Anyone** (anonymous requests are authenticated via the token layer).
   - Copy the **Web App URL** — this is your `VITE_API_BASE_URL`.

5. **Update frontend environment variables** (see section below).

### Using clasp (optional)
```bash
cd apps-script
clasp login
clasp create --type webapp --title "RADMS"
clasp push
```

---

## Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → Create Project.
2. **Authentication** → Enable Email/Password provider.
3. **Realtime Database** → Create database in `asia-southeast1` region.
4. Import `firebase.rules.json` under Database → Rules.
5. **Project Settings** → Service accounts → Generate new private key (for backend if needed).
6. **Project Settings** → General → Add web app → copy the Firebase config object.
7. **Cloud Messaging** → Copy the Legacy Server Key → paste into Apps Script property `FIREBASE_SERVER_KEY`.

---

## Frontend Setup

Both frontends are standard Vite + React projects.

### frontend-dashboard (Staff / Admin portal)
```bash
cd frontend-dashboard
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

### frontend-driver (Driver mobile PWA)
```bash
cd frontend-driver
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

### Environment Variables

Create `.env.local` in each frontend directory:

```
# Google Apps Script Web App URL
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Firebase config
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

---

## Test Login Credentials

> Add these rows to your Google Sheets manually for initial testing.
> Passwords are SHA-256(password + TOKEN_SECRET).  
> Use the `hashPassword` function directly in the Apps Script editor to generate hashes.

| Type | Email / Phone | Password | Role |
|------|--------------|----------|------|
| Staff (Admin) | admin@rifim.org | admin123 | ADMIN |
| Staff (Supervisor) | supervisor@sby.rifim.org | super123 | SUPERVISOR |
| Staff | staff@sby.rifim.org | staff123 | STAFF |
| Driver | +6281234567890 | driver123 | DRIVER |
| National Admin | national@rifim.org | national123 | NATIONAL_ADMIN |

---

## API Quick Reference

All requests go to the Apps Script Web App URL.

### Authentication (POST, no token required)
```
POST { action: "loginDriver", phone, password }
POST { action: "loginStaff",  email, password }
```

### Drivers (GET)
```
GET ?action=getDrivers&token=...&airportId=...
GET ?action=getDriver&token=...&driverId=...
```

### Queue (POST)
```
POST { action: "joinQueue",      token, driverId, airportId }
POST { action: "callDriver",     token, driverId, airportId }
POST { action: "completePickup", token, driverId, airportId }
```

### Attendance (POST / GET)
```
POST { action: "checkIn",  token, userId, lat, lng, method }
POST { action: "checkOut", token, userId, lat, lng }
GET  ?action=getAttendanceSummary&token=...&airportId=...&date=YYYY-MM-DD
```

### KPI (GET)
```
GET ?action=calculateKPI&token=...&driverId=...&month=1&year=2025
GET ?action=getKPIReport&token=...&airportId=...&month=1&year=2025
```

### Reports (GET)
```
GET ?action=getDailyReport&token=...&airportId=...&date=YYYY-MM-DD
GET ?action=getMonthlyReport&token=...&airportId=...&month=1&year=2025
GET ?action=getNationalReport&token=...&month=1&year=2025
```

---

## License

Proprietary — RIFIM internal use only.
