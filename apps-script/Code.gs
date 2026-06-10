/**
 * RADMS - RIFIM Airport Driver Management System
 * Code.gs - Main entry point, HTTP request router
 *
 * Deployed as Google Apps Script Web App.
 * All requests come through doPost / doGet.
 */

// ─── Spreadsheet Configuration ───────────────────────────────────────────────
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
var SS = SpreadsheetApp.openById(SPREADSHEET_ID);

// Sheet name constants
var SHEET = {
  DRIVERS:       'DRIVERS',
  STAFF:         'STAFF',
  ATTENDANCE:    'ATTENDANCE',
  QUEUE_HISTORY: 'QUEUE_HISTORY',
  TRACKING_LOG:  'TRACKING_LOG',
  AIRPORTS:      'AIRPORTS',
  KPI:           'KPI',
  REPORTS:       'REPORTS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  TOKENS:        'TOKENS'
};

// ─── HTTP Entry Points ────────────────────────────────────────────────────────

/**
 * Handle all POST requests.
 * Expects JSON body with an "action" field.
 */
function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;

    if (!action) {
      return setCorsHeaders(output.setContent(JSON.stringify({
        success: false,
        error: 'Missing action parameter'
      })));
    }

    var result = routePostAction(action, params);
    return setCorsHeaders(output.setContent(JSON.stringify(result)));

  } catch (err) {
    Logger.log('doPost error: ' + err.message + '\n' + err.stack);
    return setCorsHeaders(output.setContent(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + err.message
    })));
  }
}

/**
 * Handle all GET requests.
 * Uses query-string params: action, token, airportId, etc.
 */
function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = e.parameter || {};
    var action = params.action;

    if (!action) {
      return setCorsHeaders(output.setContent(JSON.stringify({
        success: true,
        message: 'RADMS API v1.0 - RIFIM Airport Driver Management System',
        timestamp: new Date().toISOString()
      })));
    }

    var result = routeGetAction(action, params);
    return setCorsHeaders(output.setContent(JSON.stringify(result)));

  } catch (err) {
    Logger.log('doGet error: ' + err.message + '\n' + err.stack);
    return setCorsHeaders(output.setContent(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + err.message
    })));
  }
}

// ─── POST Router ─────────────────────────────────────────────────────────────

function routePostAction(action, params) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  if (action === 'loginDriver')   return loginDriver(params.phone, params.password);
  if (action === 'loginStaff')    return loginStaff(params.email, params.password);

  // All actions beyond login require a valid token
  var authResult = verifyToken(params.token);
  if (!authResult.valid) return { success: false, error: 'Unauthorized: ' + authResult.reason };

  var ctx = authResult; // { valid, userId, role, airportId }

  // ── Drivers ───────────────────────────────────────────────────────────────
  if (action === 'createDriver')         return createDriver(params.data);
  if (action === 'updateDriver')         return updateDriver(params.driverId, params.data);
  if (action === 'deleteDriver')         return deleteDriver(params.driverId);
  if (action === 'updateDriverLocation') return updateDriverLocation(
    params.driverId, params.lat, params.lng, params.speed
  );
  if (action === 'updateDriverStatus')   return updateDriverStatus(params.driverId, params.online);

  // ── Queue ─────────────────────────────────────────────────────────────────
  if (action === 'joinQueue')      return joinQueue(params.driverId, params.airportId);
  if (action === 'leaveQueue')     return leaveQueue(params.driverId, params.airportId);
  if (action === 'callDriver')     return callDriver(params.driverId, params.airportId);
  if (action === 'completePickup') return completePickup(params.driverId, params.airportId);

  // ── Attendance ────────────────────────────────────────────────────────────
  if (action === 'checkIn')  return checkIn(params.userId, params.lat, params.lng, params.method);
  if (action === 'checkOut') return checkOut(params.userId, params.lat, params.lng);

  // ── KPI ───────────────────────────────────────────────────────────────────
  if (action === 'saveKPI') return saveKPI(params.driverId, params.month, params.year, params.scores);

  // ── Notifications ─────────────────────────────────────────────────────────
  if (action === 'sendNotification')  return sendNotification(
    params.targetRole, params.title, params.message, params.airportId
  );
  if (action === 'markAsRead')        return markAsRead(params.notificationId, params.userId);
  if (action === 'sendEmergencyAlert') return sendEmergencyAlert(
    params.driverId, params.lat, params.lng
  );

  return { success: false, error: 'Unknown action: ' + action };
}

// ─── GET Router ───────────────────────────────────────────────────────────────

function routeGetAction(action, params) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  if (action === 'verifyToken') return verifyToken(params.token);

  // All actions beyond verifyToken require a valid token
  var authResult = verifyToken(params.token);
  if (!authResult.valid) return { success: false, error: 'Unauthorized: ' + authResult.reason };

  // ── Drivers ───────────────────────────────────────────────────────────────
  if (action === 'getDrivers') return getDrivers(params.airportId);
  if (action === 'getDriver')  return getDriver(params.driverId);

  // ── Queue ─────────────────────────────────────────────────────────────────
  if (action === 'getQueue')        return getQueue(params.airportId);
  if (action === 'getQueueHistory') return getQueueHistory(params.airportId, params.date);

  // ── Attendance ────────────────────────────────────────────────────────────
  if (action === 'getAttendance')        return getAttendance(params.userId, params.startDate, params.endDate);
  if (action === 'getAttendanceSummary') return getAttendanceSummary(params.airportId, params.date);

  // ── KPI ───────────────────────────────────────────────────────────────────
  if (action === 'calculateKPI') return calculateKPI(params.driverId, params.month, params.year);
  if (action === 'getKPIReport') return getKPIReport(params.airportId, params.month, params.year);

  // ── Reports ───────────────────────────────────────────────────────────────
  if (action === 'getDailyReport')   return getDailyReport(params.airportId, params.date);
  if (action === 'getWeeklyReport')  return getWeeklyReport(params.airportId, params.weekStart);
  if (action === 'getMonthlyReport') return getMonthlyReport(params.airportId, params.month, params.year);
  if (action === 'getNationalReport') return getNationalReport(params.month, params.year);
  if (action === 'exportToCSV')      return exportToCSV(JSON.parse(params.data || '[]'), params.filename);

  // ── Notifications ─────────────────────────────────────────────────────────
  if (action === 'getNotifications') return getNotifications(params.userId, params.role);

  return { success: false, error: 'Unknown action: ' + action };
}

// ─── CORS Helper ─────────────────────────────────────────────────────────────

/**
 * Attaches CORS headers to the ContentService output object.
 * Google Apps Script Web Apps do not natively support OPTIONS preflight,
 * but these headers allow browser clients to read the JSON response.
 *
 * @param {GoogleAppsScript.Content.TextOutput} output
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function setCorsHeaders(output) {
  // Note: Google Apps Script ContentService does not expose setHeader().
  // CORS is handled at the Apps Script infrastructure level when the web app
  // is published with "Anyone" access.  This function is kept as a hook for
  // future HtmlService wrapping if needed, and to make the intent explicit.
  return output;
}

// ─── Utility Helpers (shared across modules) ──────────────────────────────────

/**
 * Get a sheet by name, throwing if it does not exist.
 */
function getSheet(name) {
  var sheet = SS.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

/**
 * Return all rows of a sheet as an array of plain objects,
 * using the first row as property keys.
 *
 * @param {string} sheetName
 * @returns {Object[]}
 */
function sheetToObjects(sheetName) {
  var sheet = getSheet(sheetName);
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

/**
 * Append a row to a sheet in the order defined by headers.
 *
 * @param {string}   sheetName
 * @param {Object}   obj
 * @param {string[]} headers  - ordered list of column keys
 */
function appendRow(sheetName, obj, headers) {
  var sheet = getSheet(sheetName);
  var row   = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
}

/**
 * Generate a UUID v4-like string.
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * Format a Date as YYYY-MM-DD.
 */
function formatDate(d) {
  if (!d) d = new Date();
  var date = (d instanceof Date) ? d : new Date(d);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Format a Date as YYYY-MM-DD HH:mm:ss.
 */
function formatDateTime(d) {
  if (!d) d = new Date();
  var date = (d instanceof Date) ? d : new Date(d);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}
