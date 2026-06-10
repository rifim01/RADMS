/**
 * RADMS - Report.gs
 * Operational reporting: daily, weekly, monthly, and national summaries.
 *
 * REPORTS sheet columns (persisted summaries):
 *   id | airport_id | report_type | period | total_drivers | online_drivers |
 *   total_queues | completed_pickups | avg_wait_minutes | avg_response_minutes |
 *   attendance_rate | kpi_avg | generated_at
 */

var REPORT_TYPE = {
  DAILY:    'DAILY',
  WEEKLY:   'WEEKLY',
  MONTHLY:  'MONTHLY',
  NATIONAL: 'NATIONAL'
};

var REPORTS_HEADERS = [
  'id', 'airport_id', 'report_type', 'period',
  'total_drivers', 'online_drivers',
  'total_queues', 'completed_pickups',
  'avg_wait_minutes', 'avg_response_minutes',
  'attendance_rate', 'kpi_avg', 'generated_at'
];

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Generate a daily operations summary for one airport.
 *
 * @param {string} airportId
 * @param {string} date       - YYYY-MM-DD; defaults to today
 * @returns {{ success: boolean, report: Object }}
 */
function getDailyReport(airportId, date) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };

    var targetDate = date || formatDate(new Date());
    var queueData  = _getQueueStatsForPeriod(airportId, targetDate, targetDate);
    var attendance = getAttendanceSummary(airportId, targetDate);
    var drivers    = getDrivers(airportId);

    var onlineCount = drivers.success
      ? drivers.drivers.filter(function(d) { return String(d.online) === 'TRUE'; }).length
      : 0;

    var report = {
      reportType:          REPORT_TYPE.DAILY,
      airportId:           airportId,
      period:              targetDate,
      totalDrivers:        drivers.success  ? drivers.count  : 0,
      onlineDrivers:       onlineCount,
      totalQueues:         queueData.totalQueues,
      completedPickups:    queueData.completedPickups,
      avgWaitMinutes:      queueData.avgWaitMinutes,
      avgResponseMinutes:  queueData.avgResponseMinutes,
      attendanceRate:      attendance.success
                             ? _calcRate(
                                 attendance.summary.present + attendance.summary.late,
                                 attendance.summary.totalStaff
                               )
                             : 0,
      generatedAt:         formatDateTime(new Date())
    };

    _persistReport(airportId, REPORT_TYPE.DAILY, targetDate, report);

    return { success: true, report: report };
  } catch (err) {
    Logger.log('getDailyReport error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a weekly summary.
 *
 * @param {string} airportId
 * @param {string} weekStart  - YYYY-MM-DD (Monday of the week)
 * @returns {{ success: boolean, report: Object }}
 */
function getWeeklyReport(airportId, weekStart) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };

    var startDate = weekStart || _getMondayOfCurrentWeek();
    var endDate   = _addDays(startDate, 6);
    var period    = startDate + ' to ' + endDate;

    var queueData  = _getQueueStatsForPeriod(airportId, startDate, endDate);
    var drivers    = getDrivers(airportId);

    var report = {
      reportType:         REPORT_TYPE.WEEKLY,
      airportId:          airportId,
      period:             period,
      weekStart:          startDate,
      weekEnd:            endDate,
      totalDrivers:       drivers.success ? drivers.count : 0,
      totalQueues:        queueData.totalQueues,
      completedPickups:   queueData.completedPickups,
      avgWaitMinutes:     queueData.avgWaitMinutes,
      avgResponseMinutes: queueData.avgResponseMinutes,
      generatedAt:        formatDateTime(new Date())
    };

    _persistReport(airportId, REPORT_TYPE.WEEKLY, period, report);

    return { success: true, report: report };
  } catch (err) {
    Logger.log('getWeeklyReport error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a monthly summary.
 *
 * @param {string} airportId
 * @param {number} month   - 1–12
 * @param {number} year    - e.g. 2025
 * @returns {{ success: boolean, report: Object }}
 */
function getMonthlyReport(airportId, month, year) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };

    month = Number(month) || new Date().getMonth() + 1;
    year  = Number(year)  || new Date().getFullYear();

    var startDate = year + '-' + _pad2(month) + '-01';
    var lastDay   = new Date(year, month, 0).getDate();
    var endDate   = year + '-' + _pad2(month) + '-' + lastDay;
    var period    = year + '-' + _pad2(month);

    var queueData  = _getQueueStatsForPeriod(airportId, startDate, endDate);
    var kpiReport  = getKPIReport(airportId, month, year);
    var drivers    = getDrivers(airportId);

    var kpiAvg = 0;
    if (kpiReport.success && kpiReport.report.length > 0) {
      var sum = kpiReport.report.reduce(function(s, k) {
        return s + (Number(k.totalScore) || 0);
      }, 0);
      kpiAvg = Math.round(sum / kpiReport.report.length);
    }

    var report = {
      reportType:         REPORT_TYPE.MONTHLY,
      airportId:          airportId,
      period:             period,
      month:              month,
      year:               year,
      totalDrivers:       drivers.success ? drivers.count : 0,
      totalQueues:        queueData.totalQueues,
      completedPickups:   queueData.completedPickups,
      avgWaitMinutes:     queueData.avgWaitMinutes,
      avgResponseMinutes: queueData.avgResponseMinutes,
      kpiAvg:             kpiAvg,
      generatedAt:        formatDateTime(new Date())
    };

    _persistReport(airportId, REPORT_TYPE.MONTHLY, period, report);

    return { success: true, report: report };
  } catch (err) {
    Logger.log('getMonthlyReport error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a national summary across all airports for a given month.
 *
 * @param {number} month
 * @param {number} year
 * @returns {{ success: boolean, report: Object }}
 */
function getNationalReport(month, year) {
  try {
    month = Number(month) || new Date().getMonth() + 1;
    year  = Number(year)  || new Date().getFullYear();

    var airports = sheetToObjects(SHEET.AIRPORTS);
    var period   = year + '-' + _pad2(month);

    var airportReports = airports
      .filter(function(a) { return a.status !== 'DELETED'; })
      .map(function(a) {
        var result = getMonthlyReport(String(a.id), month, year);
        return result.success ? result.report : { airportId: a.id, airportName: a.name, error: result.error };
      });

    // Aggregate totals
    var totals = airportReports.reduce(function(acc, r) {
      acc.totalDrivers       += Number(r.totalDrivers)     || 0;
      acc.completedPickups   += Number(r.completedPickups) || 0;
      acc.totalQueues        += Number(r.totalQueues)      || 0;
      return acc;
    }, { totalDrivers: 0, completedPickups: 0, totalQueues: 0 });

    var report = {
      reportType:        REPORT_TYPE.NATIONAL,
      period:            period,
      month:             month,
      year:              year,
      totalAirports:     airportReports.length,
      totalDrivers:      totals.totalDrivers,
      completedPickups:  totals.completedPickups,
      totalQueues:       totals.totalQueues,
      airportBreakdown:  airportReports,
      generatedAt:       formatDateTime(new Date())
    };

    return { success: true, report: report };
  } catch (err) {
    Logger.log('getNationalReport error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a CSV string from an array of objects.
 *
 * @param {Object[]} data
 * @param {string}   filename  - hint only, not enforced server-side
 * @returns {{ success: boolean, csv?: string, filename?: string }}
 */
function exportToCSV(data, filename) {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'No data to export' };
    }

    var headers = Object.keys(data[0]);
    var rows    = [headers.join(',')];

    data.forEach(function(row) {
      var cells = headers.map(function(h) {
        var val = row[h] !== undefined ? String(row[h]) : '';
        // Escape double-quotes and wrap in quotes if value contains comma/quote/newline
        if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1 || val.indexOf('\n') !== -1) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      });
      rows.push(cells.join(','));
    });

    var csvString = rows.join('\n');

    return {
      success:  true,
      csv:      csvString,
      filename: filename || ('export_' + formatDate(new Date()) + '.csv'),
      rows:     data.length
    };
  } catch (err) {
    Logger.log('exportToCSV error: ' + err.message);
    return { success: false, error: err.message };
  }
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Compute queue statistics from QUEUE_HISTORY for a date range.
 */
function _getQueueStatsForPeriod(airportId, startDate, endDate) {
  var history  = sheetToObjects(SHEET.QUEUE_HISTORY);
  var start    = new Date(startDate);
  var end      = new Date(endDate + 'T23:59:59');

  var filtered = history.filter(function(h) {
    var d = new Date(String(h.date).substring(0, 10));
    return String(h.airport_id) === String(airportId) && d >= start && d <= end;
  });

  var completed = filtered.filter(function(h) { return h.status === 'COMPLETED'; });

  // Average wait time (joined_at → called_at)
  var waitTimes = completed
    .filter(function(h) { return h.joined_at && h.called_at; })
    .map(function(h) {
      return Math.max(0, (new Date(h.called_at) - new Date(h.joined_at)) / 60000);
    });

  // Average response time (called_at → completed_at)
  var responseTimes = completed
    .filter(function(h) { return h.called_at && h.completed_at; })
    .map(function(h) {
      return Math.max(0, (new Date(h.completed_at) - new Date(h.called_at)) / 60000);
    });

  return {
    totalQueues:        filtered.length,
    completedPickups:   completed.length,
    avgWaitMinutes:     waitTimes.length     ? Math.round(_avg(waitTimes))     : 0,
    avgResponseMinutes: responseTimes.length ? Math.round(_avg(responseTimes)) : 0
  };
}

function _avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce(function(s, v) { return s + v; }, 0) / arr.length;
}

function _calcRate(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function _persistReport(airportId, reportType, period, report) {
  try {
    appendRow(SHEET.REPORTS, {
      id:                  generateId(),
      airport_id:          airportId,
      report_type:         reportType,
      period:              period,
      total_drivers:       report.totalDrivers       || 0,
      online_drivers:      report.onlineDrivers      || 0,
      total_queues:        report.totalQueues        || 0,
      completed_pickups:   report.completedPickups   || 0,
      avg_wait_minutes:    report.avgWaitMinutes      || 0,
      avg_response_minutes: report.avgResponseMinutes || 0,
      attendance_rate:     report.attendanceRate     || 0,
      kpi_avg:             report.kpiAvg             || 0,
      generated_at:        formatDateTime(new Date())
    }, REPORTS_HEADERS);
  } catch (e) {
    Logger.log('_persistReport warning: ' + e.message);
  }
}

function _getMondayOfCurrentWeek() {
  var d   = new Date();
  var day = d.getDay();
  var diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

function _addDays(dateStr, days) {
  var d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function _pad2(n) {
  return n < 10 ? '0' + n : String(n);
}
