/**
 * RADMS - Queue.gs
 * Driver queue management (FIFO) per airport.
 *
 * Active queue is stored in DRIVERS sheet (queue_position, queue_status, queue_joined_at).
 * Completed/historical entries are written to QUEUE_HISTORY.
 *
 * DRIVERS sheet additional columns used by Queue module:
 *   queue_position | queue_status | queue_joined_at | queue_airport_id
 *
 * QUEUE_HISTORY sheet columns:
 *   id | driver_id | driver_name | airport_id | queue_position |
 *   status | joined_at | called_at | completed_at | date
 */

var QUEUE_STATUS = {
  WAITING:   'WAITING',
  CALLED:    'CALLED',
  COMPLETED: 'COMPLETED',
  LEFT:      'LEFT'
};

var QUEUE_HISTORY_HEADERS = [
  'id', 'driver_id', 'driver_name', 'airport_id', 'queue_position',
  'status', 'joined_at', 'called_at', 'completed_at', 'date'
];

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Get the current active queue for an airport (WAITING + CALLED entries),
 * sorted by queue_position ascending.
 *
 * @param {string} airportId
 * @returns {{ success: boolean, queue: Object[], count: number }}
 */
function getQueue(airportId) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };

    var drivers = sheetToObjects(SHEET.DRIVERS);
    var inQueue = drivers.filter(function(d) {
      return String(d.queue_airport_id) === String(airportId)
          && (d.queue_status === QUEUE_STATUS.WAITING || d.queue_status === QUEUE_STATUS.CALLED)
          && d.status !== 'DELETED';
    });

    // Sort by queue_position (numeric)
    inQueue.sort(function(a, b) {
      return Number(a.queue_position) - Number(b.queue_position);
    });

    var result = inQueue.map(function(d) {
      return {
        driverId:      d.id,
        driverName:    d.name,
        vehicleType:   d.vehicle_type,
        vehiclePlate:  d.vehicle_plate,
        queuePosition: d.queue_position,
        queueStatus:   d.queue_status,
        joinedAt:      d.queue_joined_at
      };
    });

    return { success: true, queue: result, count: result.length };
  } catch (err) {
    Logger.log('getQueue error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Add a driver to the queue (FIFO).  Driver must not already be in an active queue.
 *
 * @param {string} driverId
 * @param {string} airportId
 * @returns {{ success: boolean, queuePosition?: number }}
 */
function joinQueue(driverId, airportId) {
  try {
    if (!driverId)  return { success: false, error: 'driverId is required' };
    if (!airportId) return { success: false, error: 'airportId is required' };

    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var driver = driverResult.driver;

    // Check if already in queue
    if (driver.queue_status === QUEUE_STATUS.WAITING || driver.queue_status === QUEUE_STATUS.CALLED) {
      return { success: false, error: 'Driver is already in the queue' };
    }

    // Determine next queue position (max existing + 1)
    var queueResult = getQueue(airportId);
    var nextPosition = 1;
    if (queueResult.success && queueResult.count > 0) {
      var maxPos = Math.max.apply(null, queueResult.queue.map(function(q) {
        return Number(q.queuePosition) || 0;
      }));
      nextPosition = maxPos + 1;
    }

    var now = formatDateTime(new Date());

    var updateResult = updateDriver(driverId, {
      queue_position:   nextPosition,
      queue_status:     QUEUE_STATUS.WAITING,
      queue_joined_at:  now,
      queue_airport_id: airportId,
      online:           'TRUE'
    });

    if (!updateResult.success) return updateResult;

    return { success: true, queuePosition: nextPosition, joinedAt: now };
  } catch (err) {
    Logger.log('joinQueue error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Remove a driver from the active queue and log the departure.
 *
 * @param {string} driverId
 * @param {string} airportId
 * @returns {{ success: boolean }}
 */
function leaveQueue(driverId, airportId) {
  try {
    if (!driverId)  return { success: false, error: 'driverId is required' };
    if (!airportId) return { success: false, error: 'airportId is required' };

    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var driver = driverResult.driver;

    if (driver.queue_status !== QUEUE_STATUS.WAITING && driver.queue_status !== QUEUE_STATUS.CALLED) {
      return { success: false, error: 'Driver is not in an active queue' };
    }

    var now = formatDateTime(new Date());

    // Log to history before clearing
    _writeQueueHistory(driver, airportId, QUEUE_STATUS.LEFT, now, null, now);

    // Clear queue fields on driver
    var updateResult = updateDriver(driverId, {
      queue_position:   '',
      queue_status:     '',
      queue_joined_at:  '',
      queue_airport_id: ''
    });

    // Re-number remaining queue
    if (updateResult.success) {
      _reNumberQueue(airportId);
    }

    return updateResult;
  } catch (err) {
    Logger.log('leaveQueue error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Call a driver from the queue (changes status from WAITING to CALLED).
 * Staff action — a dispatcher calls the first driver.
 *
 * @param {string} driverId
 * @param {string} airportId
 * @returns {{ success: boolean }}
 */
function callDriver(driverId, airportId) {
  try {
    if (!driverId)  return { success: false, error: 'driverId is required' };
    if (!airportId) return { success: false, error: 'airportId is required' };

    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var driver = driverResult.driver;

    if (driver.queue_status !== QUEUE_STATUS.WAITING) {
      return { success: false, error: 'Driver is not in WAITING status' };
    }

    var now = formatDateTime(new Date());

    var updateResult = updateDriver(driverId, {
      queue_status: QUEUE_STATUS.CALLED,
      queue_called_at: now
    });

    // Push a notification to the driver
    try {
      sendNotification('DRIVER_' + driverId, 'Anda Dipanggil!',
        'Silakan menuju area penjemputan segera.', airportId);
    } catch (notifErr) {
      Logger.log('callDriver notification warning: ' + notifErr.message);
    }

    return updateResult;
  } catch (err) {
    Logger.log('callDriver error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Mark a pickup as completed, write to QUEUE_HISTORY, and remove driver from active queue.
 *
 * @param {string} driverId
 * @param {string} airportId
 * @returns {{ success: boolean }}
 */
function completePickup(driverId, airportId) {
  try {
    if (!driverId)  return { success: false, error: 'driverId is required' };
    if (!airportId) return { success: false, error: 'airportId is required' };

    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var driver = driverResult.driver;

    if (driver.queue_status !== QUEUE_STATUS.CALLED) {
      return { success: false, error: 'Driver must be in CALLED status to complete pickup' };
    }

    var now = formatDateTime(new Date());

    _writeQueueHistory(driver, airportId, QUEUE_STATUS.COMPLETED,
      driver.queue_joined_at, driver.queue_called_at, now);

    // Clear queue fields
    var updateResult = updateDriver(driverId, {
      queue_position:   '',
      queue_status:     QUEUE_STATUS.COMPLETED,
      queue_joined_at:  '',
      queue_airport_id: ''
    });

    if (updateResult.success) {
      _reNumberQueue(airportId);
    }

    return updateResult;
  } catch (err) {
    Logger.log('completePickup error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get QUEUE_HISTORY entries for an airport on a given date (YYYY-MM-DD).
 *
 * @param {string} airportId
 * @param {string} date       - YYYY-MM-DD; defaults to today
 * @returns {{ success: boolean, history: Object[] }}
 */
function getQueueHistory(airportId, date) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };

    var targetDate = date || formatDate(new Date());
    var history    = sheetToObjects(SHEET.QUEUE_HISTORY);

    var filtered = history.filter(function(h) {
      return String(h.airport_id) === String(airportId)
          && String(h.date).substring(0, 10) === targetDate;
    });

    filtered.sort(function(a, b) {
      return Number(a.queue_position) - Number(b.queue_position);
    });

    return { success: true, history: filtered, count: filtered.length };
  } catch (err) {
    Logger.log('getQueueHistory error: ' + err.message);
    return { success: false, error: err.message };
  }
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Append one record to QUEUE_HISTORY.
 */
function _writeQueueHistory(driver, airportId, status, joinedAt, calledAt, completedAt) {
  appendRow(SHEET.QUEUE_HISTORY, {
    id:             generateId(),
    driver_id:      driver.id,
    driver_name:    driver.name,
    airport_id:     airportId,
    queue_position: driver.queue_position || '',
    status:         status,
    joined_at:      joinedAt    || '',
    called_at:      calledAt    || '',
    completed_at:   completedAt || '',
    date:           formatDate(new Date())
  }, QUEUE_HISTORY_HEADERS);
}

/**
 * Re-number queue positions for an airport after a departure.
 * Assigns sequential integers starting at 1 in order of queue_joined_at.
 */
function _reNumberQueue(airportId) {
  try {
    var sheet   = getSheet(SHEET.DRIVERS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim(); });

    var idxAirport  = headers.indexOf('queue_airport_id');
    var idxStatus   = headers.indexOf('queue_status');
    var idxPosition = headers.indexOf('queue_position');
    var idxJoined   = headers.indexOf('queue_joined_at');

    if (idxAirport === -1 || idxStatus === -1 || idxPosition === -1) return;

    // Collect rows in queue sorted by joined_at
    var inQueue = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idxAirport]) === String(airportId)
          && (data[i][idxStatus] === QUEUE_STATUS.WAITING
           || data[i][idxStatus] === QUEUE_STATUS.CALLED)) {
        inQueue.push({ rowIdx: i, joinedAt: data[i][idxJoined] });
      }
    }

    inQueue.sort(function(a, b) {
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });

    inQueue.forEach(function(entry, pos) {
      sheet.getRange(entry.rowIdx + 1, idxPosition + 1).setValue(pos + 1);
    });
  } catch (err) {
    Logger.log('_reNumberQueue warning: ' + err.message);
  }
}
