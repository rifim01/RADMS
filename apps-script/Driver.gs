/**
 * RADMS - Driver.gs
 * Driver CRUD and real-time status/location management.
 *
 * DRIVERS sheet columns:
 *   id | name | phone | password_hash | airport_id | license_number |
 *   vehicle_type | vehicle_plate | status | online | lat | lng | speed |
 *   last_location_update | created_at | updated_at | deleted_at
 *
 * TRACKING_LOG sheet columns:
 *   id | driver_id | airport_id | lat | lng | speed | timestamp
 */

var DRIVER_STATUS = {
  ACTIVE:   'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED:  'DELETED'
};

var DRIVER_HEADERS = [
  'id', 'name', 'phone', 'password_hash', 'airport_id',
  'license_number', 'vehicle_type', 'vehicle_plate',
  'status', 'online', 'lat', 'lng', 'speed',
  'last_location_update', 'created_at', 'updated_at', 'deleted_at'
];

var TRACKING_HEADERS = [
  'id', 'driver_id', 'airport_id', 'lat', 'lng', 'speed', 'timestamp'
];

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Return all active (non-deleted) drivers for a given airport.
 *
 * @param {string} airportId
 * @returns {{ success: boolean, drivers: Object[] }}
 */
function getDrivers(airportId) {
  try {
    if (!airportId) return { success: false, error: 'airportId is required' };

    var drivers = sheetToObjects(SHEET.DRIVERS);
    var filtered = drivers.filter(function(d) {
      return String(d.airport_id) === String(airportId)
          && d.status !== DRIVER_STATUS.DELETED;
    }).map(sanitizeDriver);

    return { success: true, drivers: filtered, count: filtered.length };
  } catch (err) {
    Logger.log('getDrivers error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Return a single driver by ID.
 *
 * @param {string} driverId
 * @returns {{ success: boolean, driver?: Object }}
 */
function getDriver(driverId) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };

    var drivers = sheetToObjects(SHEET.DRIVERS);
    var driver  = drivers.find(function(d) {
      return String(d.id) === String(driverId) && d.status !== DRIVER_STATUS.DELETED;
    });

    if (!driver) return { success: false, error: 'Driver not found' };

    return { success: true, driver: sanitizeDriver(driver) };
  } catch (err) {
    Logger.log('getDriver error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Add a new driver.
 *
 * @param {Object} data - { name, phone, password, airport_id, license_number,
 *                          vehicle_type, vehicle_plate }
 * @returns {{ success: boolean, driverId?: string }}
 */
function createDriver(data) {
  try {
    if (!data) return { success: false, error: 'Driver data is required' };

    var required = ['name', 'phone', 'password', 'airport_id'];
    for (var i = 0; i < required.length; i++) {
      if (!data[required[i]]) {
        return { success: false, error: 'Missing required field: ' + required[i] };
      }
    }

    // Prevent duplicate phone numbers within the same airport
    var existing = sheetToObjects(SHEET.DRIVERS);
    var duplicate = existing.find(function(d) {
      return String(d.phone).trim() === String(data.phone).trim()
          && String(d.airport_id)   === String(data.airport_id)
          && d.status !== DRIVER_STATUS.DELETED;
    });
    if (duplicate) return { success: false, error: 'Phone number already registered for this airport' };

    var now      = formatDateTime(new Date());
    var driverId = generateId();

    var row = {
      id:                   driverId,
      name:                 data.name,
      phone:                data.phone,
      password_hash:        hashPassword(data.password),
      airport_id:           data.airport_id,
      license_number:       data.license_number  || '',
      vehicle_type:         data.vehicle_type    || '',
      vehicle_plate:        data.vehicle_plate   || '',
      status:               DRIVER_STATUS.ACTIVE,
      online:               'FALSE',
      lat:                  '',
      lng:                  '',
      speed:                0,
      last_location_update: '',
      created_at:           now,
      updated_at:           now,
      deleted_at:           ''
    };

    appendRow(SHEET.DRIVERS, row, DRIVER_HEADERS);

    return { success: true, driverId: driverId };
  } catch (err) {
    Logger.log('createDriver error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update driver profile fields.
 *
 * @param {string} driverId
 * @param {Object} data  - any subset of driver fields (except id, password_hash)
 * @returns {{ success: boolean }}
 */
function updateDriver(driverId, data) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };
    if (!data)     return { success: false, error: 'Update data is required' };

    var sheet  = getSheet(SHEET.DRIVERS);
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function(h) { return String(h).trim(); });

    var idCol = headers.indexOf('id');
    var rowIdx = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][idCol]) === String(driverId)) {
        rowIdx = i;
        break;
      }
    }
    if (rowIdx === -1) return { success: false, error: 'Driver not found' };

    // If password is being updated, hash it
    if (data.password) {
      data.password_hash = hashPassword(data.password);
      delete data.password;
    }

    // Never allow direct id or created_at override
    delete data.id;
    delete data.created_at;
    data.updated_at = formatDateTime(new Date());

    // Update each provided field
    Object.keys(data).forEach(function(key) {
      var col = headers.indexOf(key);
      if (col !== -1) {
        sheet.getRange(rowIdx + 1, col + 1).setValue(data[key]);
      }
    });

    return { success: true };
  } catch (err) {
    Logger.log('updateDriver error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Soft-delete a driver (sets status = DELETED, records deleted_at).
 *
 * @param {string} driverId
 * @returns {{ success: boolean }}
 */
function deleteDriver(driverId) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };

    return updateDriver(driverId, {
      status:     DRIVER_STATUS.DELETED,
      deleted_at: formatDateTime(new Date()),
      online:     'FALSE'
    });
  } catch (err) {
    Logger.log('deleteDriver error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update driver GPS location and append a tracking log entry.
 *
 * @param {string} driverId
 * @param {number} lat
 * @param {number} lng
 * @param {number} speed  - km/h
 * @returns {{ success: boolean }}
 */
function updateDriverLocation(driverId, lat, lng, speed) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };

    var now = formatDateTime(new Date());

    // Get driver's airport_id for tracking log
    var driverResult = getDriver(driverId);
    if (!driverResult.success) return driverResult;
    var airportId = driverResult.driver.airport_id;

    // Update driver row
    var locationUpdate = updateDriver(driverId, {
      lat:                  lat  || 0,
      lng:                  lng  || 0,
      speed:                speed || 0,
      last_location_update: now
    });
    if (!locationUpdate.success) return locationUpdate;

    // Append to TRACKING_LOG
    appendRow(SHEET.TRACKING_LOG, {
      id:        generateId(),
      driver_id: driverId,
      airport_id: airportId,
      lat:       lat   || 0,
      lng:       lng   || 0,
      speed:     speed || 0,
      timestamp: now
    }, TRACKING_HEADERS);

    return { success: true };
  } catch (err) {
    Logger.log('updateDriverLocation error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Toggle a driver's online/offline status.
 *
 * @param {string}  driverId
 * @param {boolean} online
 * @returns {{ success: boolean }}
 */
function updateDriverStatus(driverId, online) {
  try {
    if (!driverId) return { success: false, error: 'driverId is required' };

    return updateDriver(driverId, {
      online: online ? 'TRUE' : 'FALSE'
    });
  } catch (err) {
    Logger.log('updateDriverStatus error: ' + err.message);
    return { success: false, error: err.message };
  }
}
