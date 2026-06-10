/**
 * RADMS - KPI.gs
 * Monthly KPI calculation for drivers.
 *
 * Score composition (total 0–100):
 *   Attendance       20%
 *   Queue Compliance 20%
 *   Pickup Activity  30%
 *   Response Time    20%
 *   Violations       10% (deducted)
 *
 * KPI sheet columns:
 *   id | driver_id | driver_name | airport_id | month | year |
 *   attendance_score | queue_score | pickup_score | response_score |
 *   violation_deduction | total_score | grade | calculated_at
 */

var KPI_HEADERS = [
  'id', 'driver_id', 'driver_name', 'airport_id', 'month', 'year',
  'attendance_score', 'queue_score', 'pickup_score', 'response_score',
  'violation_deduction', 'total_score', 'grade', 'calculated_at'
];

var KPI_WEIGHTS = {
  ATTENDANCE:        0.20,
  QUEUE_COMPLIANCE:  0.20,
  PICKUP_ACTIVITY:   0.30,
  RESPONSE_TIME:     0.20,
  VIOLATION:         0.10  // subtracted
};

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Calculate monthly KPI for a single driver.
 *
 * @param {string} driverId
 * @param {number} month   - 1–12
 * @param {number} year    - e.g. 2025
 * @returns {{ success: boolean, kpi?: Object }}
 */
function calculateKPI(driverId, month, year) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };
    month = Number(month) || new Date().getMonth() + 1;
    year  = Number(year)  || new Date().getFullYear();

    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var driver = driverResult.driver;

    // ── 1. Attendance score (20 pts) ────────────────────────────────────────
    var attendanceScore = _calcAttendanceScore(driverId, month, year);

    // ── 2. Queue compliance score (20 pts) ──────────────────────────────────
    var queueScore = _calcQueueComplianceScore(driverId, driver.airport_id, month, year);

    // ── 3. Pickup activity score (30 pts) ───────────────────────────────────
    var pickupScore = _calcPickupActivityScore(driverId, driver.airport_id, month, year);

    // ── 4. Response time score (20 pts) ─────────────────────────────────────
    var responseScore = _calcResponseTimeScore(driverId, driver.airport_id, month, year);

    // ── 5. Violation deduction (10 pts) ─────────────────────────────────────
    var violationDeduction = _calcViolationDeduction(driverId, month, year);

    // ── Total ────────────────────────────────────────────────────────────────
    var rawTotal = (attendanceScore  * KPI_WEIGHTS.ATTENDANCE)
                 + (queueScore       * KPI_WEIGHTS.QUEUE_COMPLIANCE)
                 + (pickupScore      * KPI_WEIGHTS.PICKUP_ACTIVITY)
                 + (responseScore    * KPI_WEIGHTS.RESPONSE_TIME)
                 - (violationDeduction * KPI_WEIGHTS.VIOLATION);

    // Normalise each component to its max contribution then scale to 0–100
    var totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));
    var grade      = _scoreToGrade(totalScore);

    var kpi = {
      driverId:           driverId,
      driverName:         driver.name,
      airportId:          driver.airport_id,
      month:              month,
      year:               year,
      attendanceScore:    Math.round(attendanceScore),
      queueScore:         Math.round(queueScore),
      pickupScore:        Math.round(pickupScore),
      responseScore:      Math.round(responseScore),
      violationDeduction: Math.round(violationDeduction),
      totalScore:         totalScore,
      grade:              grade,
      calculatedAt:       formatDateTime(new Date())
    };

    return { success: true, kpi: kpi };
  } catch (err) {
    Logger.log('calculateKPI error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Calculate and return KPI for every active driver at an airport.
 *
 * @param {string} airportId
 * @param {number} month
 * @param {number} year
 * @returns {{ success: boolean, report: Object[], month: number, year: number }}
 */
function getKPIReport(airportId, month, year) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };
    month = Number(month) || new Date().getMonth() + 1;
    year  = Number(year)  || new Date().getFullYear();

    var driversResult = getDrivers(airportId);
    if (!driversResult.success) return driversResult;

    var report = driversResult.drivers.map(function(driver) {
      var kpiResult = calculateKPI(driver.id, month, year);
      return kpiResult.success ? kpiResult.kpi : {
        driverId:   driver.id,
        driverName: driver.name,
        error:      kpiResult.error
      };
    });

    // Sort descending by total score
    report.sort(function(a, b) {
      return (b.totalScore || 0) - (a.totalScore || 0);
    });

    return { success: true, report: report, month: month, year: year, airportId: airportId };
  } catch (err) {
    Logger.log('getKPIReport error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Persist a pre-computed KPI record to the KPI sheet.
 * Overwrites any existing record for the same driver/month/year.
 *
 * @param {string} driverId
 * @param {number} month
 * @param {number} year
 * @param {Object} scores  - { attendanceScore, queueScore, pickupScore,
 *                             responseScore, violationDeduction, totalScore }
 * @returns {{ success: boolean }}
 */
function saveKPI(driverId, month, year, scores) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };
    if (!scores)   return { success: false, error: 'scores object is required' };

    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var driver = driverResult.driver;

    month = Number(month) || new Date().getMonth() + 1;
    year  = Number(year)  || new Date().getFullYear();

    // Check for existing record to avoid duplicates
    var sheet   = getSheet(SHEET.KPI);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim(); });

    var colDriverId = headers.indexOf('driver_id');
    var colMonth    = headers.indexOf('month');
    var colYear     = headers.indexOf('year');

    var existingRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][colDriverId]) === String(driverId)
          && Number(data[i][colMonth]) === Number(month)
          && Number(data[i][colYear])  === Number(year)) {
        existingRow = i;
        break;
      }
    }

    var totalScore = Number(scores.totalScore)
      || Math.round(
          (scores.attendanceScore  || 0) * KPI_WEIGHTS.ATTENDANCE
        + (scores.queueScore       || 0) * KPI_WEIGHTS.QUEUE_COMPLIANCE
        + (scores.pickupScore      || 0) * KPI_WEIGHTS.PICKUP_ACTIVITY
        + (scores.responseScore    || 0) * KPI_WEIGHTS.RESPONSE_TIME
        - (scores.violationDeduction || 0) * KPI_WEIGHTS.VIOLATION
      );

    var rowData = {
      id:                 existingRow === -1 ? generateId() : data[existingRow][headers.indexOf('id')],
      driver_id:          driverId,
      driver_name:        driver.name,
      airport_id:         driver.airport_id,
      month:              month,
      year:               year,
      attendance_score:   scores.attendanceScore    || 0,
      queue_score:        scores.queueScore         || 0,
      pickup_score:       scores.pickupScore        || 0,
      response_score:     scores.responseScore      || 0,
      violation_deduction: scores.violationDeduction || 0,
      total_score:        Math.min(100, Math.max(0, totalScore)),
      grade:              _scoreToGrade(totalScore),
      calculated_at:      formatDateTime(new Date())
    };

    if (existingRow === -1) {
      appendRow(SHEET.KPI, rowData, KPI_HEADERS);
    } else {
      // Update existing row in-place
      var orderedValues = KPI_HEADERS.map(function(h) { return rowData[h] !== undefined ? rowData[h] : ''; });
      sheet.getRange(existingRow + 1, 1, 1, orderedValues.length).setValues([orderedValues]);
    }

    return { success: true, kpi: rowData };
  } catch (err) {
    Logger.log('saveKPI error: ' + err.message);
    return { success: false, error: err.message };
  }
}

// ─── Score Calculators (Private) ─────────────────────────────────────────────

/**
 * Attendance score: workdays present / workdays in month × 100.
 * Staff's attendance records are used as a proxy (DRIVERS don't have attendance).
 * Returns 0–100.
 */
function _calcAttendanceScore(driverId, month, year) {
  try {
    var startDate = year + '-' + _pad(month) + '-01';
    var endDate   = year + '-' + _pad(month) + '-' + new Date(year, month, 0).getDate();
    var records   = sheetToObjects(SHEET.ATTENDANCE);

    var monthRecords = records.filter(function(r) {
      return String(r.user_id) === String(driverId)
          && String(r.date).substring(0, 7) === year + '-' + _pad(month);
    });

    var workingDays = _countWorkingDays(new Date(startDate), new Date(endDate));
    if (workingDays === 0) return 100;

    var presentDays = monthRecords.filter(function(r) {
      return r.status === 'PRESENT' || r.status === 'LATE';
    }).length;

    return Math.min(100, Math.round((presentDays / workingDays) * 100));
  } catch (e) {
    return 0;
  }
}

/**
 * Queue compliance: proportion of queue sessions where driver did not leave early.
 * Returns 0–100.
 */
function _calcQueueComplianceScore(driverId, airportId, month, year) {
  try {
    var history = sheetToObjects(SHEET.QUEUE_HISTORY);
    var monthHistory = history.filter(function(h) {
      return String(h.driver_id) === String(driverId)
          && String(h.airport_id) === String(airportId)
          && String(h.date).substring(0, 7) === year + '-' + _pad(month);
    });

    if (monthHistory.length === 0) return 0;

    var compliant = monthHistory.filter(function(h) {
      return h.status === 'COMPLETED';
    }).length;

    return Math.round((compliant / monthHistory.length) * 100);
  } catch (e) {
    return 0;
  }
}

/**
 * Pickup activity: number of completed pickups, capped at a target of 20/month.
 * Returns 0–100.
 */
function _calcPickupActivityScore(driverId, airportId, month, year) {
  try {
    var TARGET_PICKUPS = 20;
    var history = sheetToObjects(SHEET.QUEUE_HISTORY);

    var completed = history.filter(function(h) {
      return String(h.driver_id) === String(driverId)
          && String(h.airport_id) === String(airportId)
          && h.status === 'COMPLETED'
          && String(h.date).substring(0, 7) === year + '-' + _pad(month);
    }).length;

    return Math.min(100, Math.round((completed / TARGET_PICKUPS) * 100));
  } catch (e) {
    return 0;
  }
}

/**
 * Response time score: average minutes from CALLED to COMPLETED.
 * Target ≤ 5 minutes → 100 pts, 10+ minutes → 0 pts, linear interpolation.
 * Returns 0–100.
 */
function _calcResponseTimeScore(driverId, airportId, month, year) {
  try {
    var TARGET_MINUTES = 5;
    var MAX_MINUTES    = 10;

    var history = sheetToObjects(SHEET.QUEUE_HISTORY);
    var completed = history.filter(function(h) {
      return String(h.driver_id) === String(driverId)
          && String(h.airport_id) === String(airportId)
          && h.status === 'COMPLETED'
          && h.called_at && h.completed_at
          && String(h.date).substring(0, 7) === year + '-' + _pad(month);
    });

    if (completed.length === 0) return 50; // Neutral if no data

    var totalMinutes = completed.reduce(function(sum, h) {
      var calledAt    = new Date(h.called_at);
      var completedAt = new Date(h.completed_at);
      var diff = (completedAt - calledAt) / 60000;
      return sum + Math.max(0, diff);
    }, 0);

    var avgMinutes = totalMinutes / completed.length;

    if (avgMinutes <= TARGET_MINUTES) return 100;
    if (avgMinutes >= MAX_MINUTES)    return 0;

    return Math.round(((MAX_MINUTES - avgMinutes) / (MAX_MINUTES - TARGET_MINUTES)) * 100);
  } catch (e) {
    return 50;
  }
}

/**
 * Violation deduction: each violation deducts points (max 100 deduction).
 * Violations are sourced from QUEUE_HISTORY LEFT entries and manual violation notes.
 * Returns 0–100 (the amount to deduct).
 */
function _calcViolationDeduction(driverId, month, year) {
  try {
    var history = sheetToObjects(SHEET.QUEUE_HISTORY);

    var violations = history.filter(function(h) {
      return String(h.driver_id) === String(driverId)
          && h.status === 'LEFT'
          && String(h.date).substring(0, 7) === year + '-' + _pad(month);
    }).length;

    // Each violation deducts 20 pts from the 10% bucket (max 5 violations = 100)
    return Math.min(100, violations * 20);
  } catch (e) {
    return 0;
  }
}

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function _scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

function _pad(n) {
  return n < 10 ? '0' + n : String(n);
}

/**
 * Count Monday–Friday days (working days) between two Date objects, inclusive.
 */
function _countWorkingDays(start, end) {
  var count = 0;
  var cur   = new Date(start);
  while (cur <= end) {
    var day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
