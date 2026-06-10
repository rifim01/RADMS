/**
 * RADMS - Attendance.gs
 * Staff attendance: check-in, check-out, and reporting.
 *
 * ATTENDANCE sheet columns:
 *   id | user_id | user_name | airport_id | date | check_in_time |
 *   check_out_time | check_in_lat | check_in_lng | check_out_lat | check_out_lng |
 *   method | duration_minutes | status | notes | created_at
 *
 * Supported check-in methods: GPS | QR | SELFIE
 * Attendance statuses: PRESENT | LATE | ABSENT | EARLY_LEAVE
 */

var ATTENDANCE_METHOD = {
  GPS:    'GPS',
  QR:     'QR',
  SELFIE: 'SELFIE'
};

var ATTENDANCE_STATUS = {
  PRESENT:     'PRESENT',
  LATE:        'LATE',
  ABSENT:      'ABSENT',
  EARLY_LEAVE: 'EARLY_LEAVE'
};

// Work-start time for lateness calculation (24-hour, local timezone)
var WORK_START_HOUR   = 7;
var WORK_START_MINUTE = 0;
var LATE_GRACE_MINUTES = 15; // Grace period before marking LATE

var ATTENDANCE_HEADERS = [
  'id', 'user_id', 'user_name', 'airport_id', 'date',
  'check_in_time', 'check_out_time',
  'check_in_lat', 'check_in_lng',
  'check_out_lat', 'check_out_lng',
  'method', 'duration_minutes', 'status', 'notes', 'created_at'
];

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Record a check-in for a user.
 *
 * @param {string} userId
 * @param {number} lat
 * @param {number} lng
 * @param {string} method  - GPS | QR | SELFIE
 * @returns {{ success: boolean, attendanceId?: string, status?: string }}
 */
function checkIn(userId, lat, lng, method) {
  try {
    if (!userId) return { success: false, error: 'userId is required' };

    var staffList = sheetToObjects(SHEET.STAFF);
    var staff = staffList.find(function(s) {
      return String(s.id) === String(userId) && s.status !== 'DELETED';
    });
    if (!staff) return { success: false, error: 'User not found' };

    var today = formatDate(new Date());

    // Prevent duplicate check-ins on the same day
    var existing = sheetToObjects(SHEET.ATTENDANCE);
    var todayRecord = existing.find(function(a) {
      return String(a.user_id) === String(userId)
          && String(a.date).substring(0, 10) === today;
    });
    if (todayRecord) return { success: false, error: 'Already checked in today' };

    var now      = new Date();
    var checkInTime = formatDateTime(now);
    var status   = _determineAttendanceStatus(now);
    var attendanceId = generateId();

    appendRow(SHEET.ATTENDANCE, {
      id:              attendanceId,
      user_id:         userId,
      user_name:       staff.name,
      airport_id:      staff.airport_id,
      date:            today,
      check_in_time:   checkInTime,
      check_out_time:  '',
      check_in_lat:    lat  || '',
      check_in_lng:    lng  || '',
      check_out_lat:   '',
      check_out_lng:   '',
      method:          method || ATTENDANCE_METHOD.GPS,
      duration_minutes: 0,
      status:          status,
      notes:           '',
      created_at:      checkInTime
    }, ATTENDANCE_HEADERS);

    return { success: true, attendanceId: attendanceId, status: status, checkInTime: checkInTime };
  } catch (err) {
    Logger.log('checkIn error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Record a check-out for a user.
 *
 * @param {string} userId
 * @param {number} lat
 * @param {number} lng
 * @returns {{ success: boolean, durationMinutes?: number }}
 */
function checkOut(userId, lat, lng) {
  try {
    if (!userId) return { success: false, error: 'userId is required' };

    var today    = formatDate(new Date());
    var sheet    = getSheet(SHEET.ATTENDANCE);
    var data     = sheet.getDataRange().getValues();
    var headers  = data[0].map(function(h) { return String(h).trim(); });

    var colUserId   = headers.indexOf('user_id');
    var colDate     = headers.indexOf('date');
    var colCheckOut = headers.indexOf('check_out_time');
    var colCheckIn  = headers.indexOf('check_in_time');
    var colDuration = headers.indexOf('duration_minutes');
    var colStatus   = headers.indexOf('status');
    var colLatOut   = headers.indexOf('check_out_lat');
    var colLngOut   = headers.indexOf('check_out_lng');

    var rowIdx = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][colUserId]) === String(userId)
          && String(data[i][colDate]).substring(0, 10) === today) {
        rowIdx = i;
        break;
      }
    }

    if (rowIdx === -1) return { success: false, error: 'No check-in record found for today' };

    var existingCheckOut = data[rowIdx][colCheckOut];
    if (existingCheckOut) return { success: false, error: 'Already checked out today' };

    var checkInTime  = new Date(data[rowIdx][colCheckIn]);
    var checkOutTime = new Date();
    var durationMs   = checkOutTime.getTime() - checkInTime.getTime();
    var durationMins = Math.round(durationMs / 60000);

    // Determine if early leave (less than 7 hours)
    var currentStatus = data[rowIdx][colStatus];
    if (durationMins < 7 * 60) {
      currentStatus = ATTENDANCE_STATUS.EARLY_LEAVE;
    }

    sheet.getRange(rowIdx + 1, colCheckOut + 1).setValue(formatDateTime(checkOutTime));
    sheet.getRange(rowIdx + 1, colDuration  + 1).setValue(durationMins);
    sheet.getRange(rowIdx + 1, colStatus    + 1).setValue(currentStatus);
    sheet.getRange(rowIdx + 1, colLatOut    + 1).setValue(lat || '');
    sheet.getRange(rowIdx + 1, colLngOut    + 1).setValue(lng || '');

    return { success: true, durationMinutes: durationMins, status: currentStatus };
  } catch (err) {
    Logger.log('checkOut error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get attendance records for a user within a date range.
 *
 * @param {string} userId
 * @param {string} startDate  - YYYY-MM-DD
 * @param {string} endDate    - YYYY-MM-DD
 * @returns {{ success: boolean, records: Object[], count: number }}
 */
function getAttendance(userId, startDate, endDate) {
  try {
    if (!userId) return { success: false, error: 'userId is required' };

    var records = sheetToObjects(SHEET.ATTENDANCE);
    var start   = startDate ? new Date(startDate) : new Date(0);
    var end     = endDate   ? new Date(endDate + 'T23:59:59') : new Date();

    var filtered = records.filter(function(r) {
      if (String(r.user_id) !== String(userId)) return false;
      var d = new Date(String(r.date).substring(0, 10));
      return d >= start && d <= end;
    });

    filtered.sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });

    return { success: true, records: filtered, count: filtered.length };
  } catch (err) {
    Logger.log('getAttendance error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get an attendance summary for all staff in an airport on a specific date.
 *
 * @param {string} airportId
 * @param {string} date       - YYYY-MM-DD; defaults to today
 * @returns {{ success: boolean, summary: Object, records: Object[] }}
 */
function getAttendanceSummary(airportId, date) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };

    var targetDate = date || formatDate(new Date());
    var records    = sheetToObjects(SHEET.ATTENDANCE);

    var dayRecords = records.filter(function(r) {
      return String(r.airport_id) === String(airportId)
          && String(r.date).substring(0, 10) === targetDate;
    });

    // Get total staff count for this airport
    var staffList  = sheetToObjects(SHEET.STAFF);
    var totalStaff = staffList.filter(function(s) {
      return String(s.airport_id) === String(airportId) && s.status !== 'DELETED';
    }).length;

    var summary = {
      date:        targetDate,
      airportId:   airportId,
      totalStaff:  totalStaff,
      present:     dayRecords.filter(function(r) { return r.status === ATTENDANCE_STATUS.PRESENT; }).length,
      late:        dayRecords.filter(function(r) { return r.status === ATTENDANCE_STATUS.LATE; }).length,
      earlyLeave:  dayRecords.filter(function(r) { return r.status === ATTENDANCE_STATUS.EARLY_LEAVE; }).length,
      absent:      0
    };
    summary.absent = totalStaff - dayRecords.length;

    return { success: true, summary: summary, records: dayRecords };
  } catch (err) {
    Logger.log('getAttendanceSummary error: ' + err.message);
    return { success: false, error: err.message };
  }
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Determine PRESENT or LATE based on clock-in time.
 */
function _determineAttendanceStatus(checkInDate) {
  var workStart = new Date(checkInDate);
  workStart.setHours(WORK_START_HOUR, WORK_START_MINUTE + LATE_GRACE_MINUTES, 0, 0);
  return checkInDate > workStart ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;
}
