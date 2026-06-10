/**
 * RADMS - Notification.gs
 * In-app notifications and emergency alerts.
 *
 * NOTIFICATIONS sheet columns:
 *   id | target_role | target_user_id | airport_id | title | message |
 *   type | is_read | read_by | created_at | read_at
 *
 * Firebase push notifications are sent via FCM REST API.
 * Configure FIREBASE_SERVER_KEY and FIREBASE_DB_URL in Script Properties.
 */

// ─── Firebase Configuration ──────────────────────────────────────────────────
// Set these values in Apps Script → Project Settings → Script Properties:
//   FIREBASE_SERVER_KEY : your FCM legacy server key (from Firebase Console)
//   FIREBASE_DB_URL     : your Realtime Database URL, e.g.
//                         https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app
var FIREBASE_SERVER_KEY = PropertiesService.getScriptProperties().getProperty('FIREBASE_SERVER_KEY') || '';
var FIREBASE_DB_URL     = PropertiesService.getScriptProperties().getProperty('FIREBASE_DB_URL')     || '';
var FCM_ENDPOINT        = 'https://fcm.googleapis.com/fcm/send';

var NOTIFICATION_TYPE = {
  INFO:      'INFO',
  WARNING:   'WARNING',
  EMERGENCY: 'EMERGENCY',
  QUEUE:     'QUEUE'
};

var NOTIFICATIONS_HEADERS = [
  'id', 'target_role', 'target_user_id', 'airport_id',
  'title', 'message', 'type', 'is_read', 'read_by', 'created_at', 'read_at'
];

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Create and broadcast a notification to all users of a given role in an airport.
 * Also attempts to send a Firebase push notification.
 *
 * @param {string} targetRole    - DRIVER | STAFF | SUPERVISOR | ADMIN | DRIVER_{id}
 * @param {string} title
 * @param {string} message
 * @param {string} airportId
 * @returns {{ success: boolean, notificationId?: string }}
 */
function sendNotification(targetRole, title, message, airportId) {
  try {
    if (!targetRole || !title || !message) {
      return { success: false, error: 'targetRole, title, and message are required' };
    }

    var notificationId = generateId();
    var now            = formatDateTime(new Date());

    appendRow(SHEET.NOTIFICATIONS, {
      id:              notificationId,
      target_role:     targetRole,
      target_user_id:  '', // populated when targeting a specific user (DRIVER_{id} prefix)
      airport_id:      airportId || '',
      title:           title,
      message:         message,
      type:            NOTIFICATION_TYPE.INFO,
      is_read:         'FALSE',
      read_by:         '',
      created_at:      now,
      read_at:         ''
    }, NOTIFICATIONS_HEADERS);

    // Attempt FCM push (non-fatal if it fails)
    _sendFCMNotification(targetRole, airportId, title, message, NOTIFICATION_TYPE.INFO);

    return { success: true, notificationId: notificationId };
  } catch (err) {
    Logger.log('sendNotification error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve unread notifications for a user.
 * Matches on target_role (the user's role) and, if airportId is set, filters by airport.
 *
 * @param {string} userId
 * @param {string} role
 * @returns {{ success: boolean, notifications: Object[], count: number }}
 */
function getNotifications(userId, role) {
  try {
    if (!userId || !role) return { success: false, error: 'userId and role are required' };

    // Determine the user's airport
    var airportId = _getUserAirportId(userId, role);

    var allNotifs = sheetToObjects(SHEET.NOTIFICATIONS);
    var relevant  = allNotifs.filter(function(n) {
      // Broadcast to role (e.g. "STAFF") or direct to user (e.g. "DRIVER_<id>")
      var roleMatch = n.target_role === role
                   || n.target_role === role + '_' + userId
                   || n.target_role === 'DRIVER_' + userId;

      // Airport filter: global notifications have no airportId
      var airportMatch = !n.airport_id
                      || String(n.airport_id) === String(airportId);

      // Not yet read by this user
      var unread = String(n.is_read).toUpperCase() !== 'TRUE'
                || !_isReadByUser(n.read_by, userId);

      return roleMatch && airportMatch && unread;
    });

    // Return most-recent first
    relevant.sort(function(a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return { success: true, notifications: relevant, count: relevant.length };
  } catch (err) {
    Logger.log('getNotifications error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Mark a notification as read by a specific user.
 *
 * @param {string} notificationId
 * @param {string} userId
 * @returns {{ success: boolean }}
 */
function markAsRead(notificationId, userId) {
  try {
    if (!notificationId || !userId) {
      return { success: false, error: 'notificationId and userId are required' };
    }

    var sheet   = getSheet(SHEET.NOTIFICATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim(); });

    var colId      = headers.indexOf('id');
    var colIsRead  = headers.indexOf('is_read');
    var colReadBy  = headers.indexOf('read_by');
    var colReadAt  = headers.indexOf('read_at');

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][colId]) === String(notificationId)) {
        var existingReadBy = String(data[i][colReadBy] || '');
        var updatedReadBy  = existingReadBy
          ? existingReadBy + ',' + userId
          : userId;

        sheet.getRange(i + 1, colIsRead + 1).setValue('TRUE');
        sheet.getRange(i + 1, colReadBy + 1).setValue(updatedReadBy);
        sheet.getRange(i + 1, colReadAt + 1).setValue(formatDateTime(new Date()));

        return { success: true };
      }
    }

    return { success: false, error: 'Notification not found' };
  } catch (err) {
    Logger.log('markAsRead error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Panic button — send an emergency alert from a driver's location to all supervisors.
 *
 * @param {string} driverId
 * @param {number} lat
 * @param {number} lng
 * @returns {{ success: boolean, notificationId?: string }}
 */
function sendEmergencyAlert(driverId, lat, lng) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };

    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var driver = driverResult.driver;

    var title   = 'DARURAT: ' + driver.name;
    var message = 'Pengemudi ' + driver.name
                + ' membutuhkan bantuan!'
                + (lat && lng ? ' Lokasi: ' + lat + ', ' + lng : '')
                + ' Plat: ' + (driver.vehicle_plate || '-');

    var notifId = generateId();
    var now     = formatDateTime(new Date());

    appendRow(SHEET.NOTIFICATIONS, {
      id:              notifId,
      target_role:     'SUPERVISOR',
      target_user_id:  '',
      airport_id:      driver.airport_id,
      title:           title,
      message:         message,
      type:            NOTIFICATION_TYPE.EMERGENCY,
      is_read:         'FALSE',
      read_by:         '',
      created_at:      now,
      read_at:         ''
    }, NOTIFICATIONS_HEADERS);

    // High-priority FCM push
    _sendFCMNotification('SUPERVISOR', driver.airport_id, title, message, NOTIFICATION_TYPE.EMERGENCY);

    // Also write to Firebase Realtime Database for real-time listening
    _writeFirebaseEmergency(driverId, driver, lat, lng, now);

    return { success: true, notificationId: notifId };
  } catch (err) {
    Logger.log('sendEmergencyAlert error: ' + err.message);
    return { success: false, error: err.message };
  }
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Send a push notification via Firebase Cloud Messaging (FCM) Legacy HTTP API.
 * Requires FIREBASE_SERVER_KEY to be set in Script Properties.
 * Targets the "/topics/<role>_<airportId>" topic.
 */
function _sendFCMNotification(targetRole, airportId, title, message, type) {
  try {
    if (!FIREBASE_SERVER_KEY) {
      Logger.log('FCM: FIREBASE_SERVER_KEY not configured — skipping push');
      return;
    }

    var topic   = '/topics/' + String(targetRole).toUpperCase().replace(/[^A-Z0-9_]/g, '_')
                + (airportId ? '_' + airportId : '');
    var payload = {
      to: topic,
      priority: type === NOTIFICATION_TYPE.EMERGENCY ? 'high' : 'normal',
      notification: {
        title: title,
        body:  message,
        sound: type === NOTIFICATION_TYPE.EMERGENCY ? 'emergency' : 'default'
      },
      data: {
        type:      type,
        airportId: airportId || '',
        timestamp: new Date().toISOString()
      }
    };

    var response = UrlFetchApp.fetch(FCM_ENDPOINT, {
      method:             'POST',
      contentType:        'application/json',
      headers:            { Authorization: 'key=' + FIREBASE_SERVER_KEY },
      payload:            JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('FCM error ' + code + ': ' + response.getContentText());
    }
  } catch (e) {
    Logger.log('_sendFCMNotification warning: ' + e.message);
  }
}

/**
 * Write an emergency record to Firebase Realtime Database.
 * Path: /emergencies/<driverId>/<timestamp>
 */
function _writeFirebaseEmergency(driverId, driver, lat, lng, timestamp) {
  try {
    if (!FIREBASE_DB_URL) {
      Logger.log('Firebase: FIREBASE_DB_URL not configured — skipping RTDB write');
      return;
    }

    var path    = FIREBASE_DB_URL + '/emergencies/' + driverId + '/' + new Date().getTime() + '.json';
    var payload = {
      driverId:    driverId,
      driverName:  driver.name,
      airportId:   driver.airport_id,
      lat:         lat  || null,
      lng:         lng  || null,
      timestamp:   timestamp,
      resolved:    false
    };

    UrlFetchApp.fetch(path, {
      method:             'PUT',
      contentType:        'application/json',
      payload:            JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('_writeFirebaseEmergency warning: ' + e.message);
  }
}

/**
 * Look up airport_id for a user (driver or staff).
 */
function _getUserAirportId(userId, role) {
  try {
    if (role === 'DRIVER') {
      var dr = getDriver(userId);
      return dr.success ? dr.driver.airport_id : '';
    }
    var staffList = sheetToObjects(SHEET.STAFF);
    var staff     = staffList.find(function(s) { return String(s.id) === String(userId); });
    return staff ? staff.airport_id : '';
  } catch (e) {
    return '';
  }
}

/**
 * Check whether a comma-separated readBy string includes a given userId.
 */
function _isReadByUser(readBy, userId) {
  if (!readBy) return false;
  return String(readBy).split(',').some(function(id) {
    return id.trim() === String(userId);
  });
}
