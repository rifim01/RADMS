/**
 * RADMS - Auth.gs
 * Authentication: login, token generation and verification.
 *
 * Token format (Base64-encoded JSON):
 *   { userId, role, airportId, exp }
 * Signed with HMAC-SHA256 using the TOKEN_SECRET script property.
 *
 * Sheet columns expected:
 *   DRIVERS : id | name | phone | password_hash | airport_id | status | ...
 *   STAFF   : id | name | email | password_hash | role | airport_id | status | ...
 *   TOKENS  : token | userId | role | airportId | createdAt | expiresAt | revoked
 */

var TOKEN_SECRET   = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET') || 'radms-secret-key';
var TOKEN_TTL_DAYS = 7; // Token valid for 7 days

// ─── Public Functions ─────────────────────────────────────────────────────────

/**
 * Authenticate a driver by phone number and password.
 *
 * @param {string} phone
 * @param {string} password  - plaintext (will be hashed and compared)
 * @returns {{ success: boolean, token?: string, driver?: Object, error?: string }}
 */
function loginDriver(phone, password) {
  try {
    if (!phone || !password) {
      return { success: false, error: 'Phone and password are required' };
    }

    var drivers = sheetToObjects(SHEET.DRIVERS);
    var driver  = drivers.find(function(d) {
      return String(d.phone).trim() === String(phone).trim() && d.status !== 'DELETED';
    });

    if (!driver) {
      return { success: false, error: 'Driver not found' };
    }

    var hashedInput = hashPassword(password);
    if (driver.password_hash !== hashedInput) {
      return { success: false, error: 'Invalid credentials' };
    }

    var token = generateToken(driver.id, 'DRIVER', driver.airport_id);

    return {
      success: true,
      token: token,
      driver: sanitizeDriver(driver)
    };
  } catch (err) {
    Logger.log('loginDriver error: ' + err.message);
    return { success: false, error: 'Login failed: ' + err.message };
  }
}

/**
 * Authenticate a staff member by email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, token?: string, role?: string, staff?: Object, error?: string }}
 */
function loginStaff(email, password) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    var staffList = sheetToObjects(SHEET.STAFF);
    var staff     = staffList.find(function(s) {
      return String(s.email).trim().toLowerCase() === String(email).trim().toLowerCase()
          && s.status !== 'DELETED';
    });

    if (!staff) {
      return { success: false, error: 'Staff member not found' };
    }

    var hashedInput = hashPassword(password);
    if (staff.password_hash !== hashedInput) {
      return { success: false, error: 'Invalid credentials' };
    }

    var token = generateToken(staff.id, staff.role, staff.airport_id);

    return {
      success: true,
      token: token,
      role: staff.role,
      staff: sanitizeStaff(staff)
    };
  } catch (err) {
    Logger.log('loginStaff error: ' + err.message);
    return { success: false, error: 'Login failed: ' + err.message };
  }
}

/**
 * Verify a token string.
 *
 * @param {string} token
 * @returns {{ valid: boolean, userId?: string, role?: string, airportId?: string, reason?: string }}
 */
function verifyToken(token) {
  try {
    if (!token) {
      return { valid: false, reason: 'No token provided' };
    }

    // Decode: token = base64(payload) + '.' + base64(signature)
    var parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, reason: 'Malformed token' };
    }

    var payloadJson = Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString();
    var payload     = JSON.parse(payloadJson);

    // Check expiry
    if (!payload.exp || new Date().getTime() > payload.exp) {
      return { valid: false, reason: 'Token expired' };
    }

    // Verify signature
    var expectedSig = computeSignature(parts[0]);
    if (expectedSig !== parts[1]) {
      return { valid: false, reason: 'Invalid token signature' };
    }

    // Check revocation table
    if (isTokenRevoked(token)) {
      return { valid: false, reason: 'Token has been revoked' };
    }

    return {
      valid:     true,
      userId:    payload.userId,
      role:      payload.role,
      airportId: payload.airportId
    };
  } catch (err) {
    Logger.log('verifyToken error: ' + err.message);
    return { valid: false, reason: 'Token verification failed: ' + err.message };
  }
}

/**
 * Generate a signed token for a user.
 *
 * @param {string} userId
 * @param {string} role    - DRIVER | STAFF | SUPERVISOR | ADMIN | NATIONAL_ADMIN
 * @param {string} airportId
 * @returns {string}  token string
 */
function generateToken(userId, role, airportId) {
  var now    = new Date();
  var expiry = new Date(now.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  var payload = {
    userId:    userId,
    role:      role,
    airportId: airportId,
    iat:       now.getTime(),
    exp:       expiry.getTime()
  };

  var payloadBase64 = Utilities.base64Encode(JSON.stringify(payload));
  var signature     = computeSignature(payloadBase64);
  var token         = payloadBase64 + '.' + signature;

  // Persist to TOKENS sheet for revocation support
  _persistToken(token, userId, role, airportId, now, expiry);

  return token;
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Compute HMAC-SHA256 signature over data using TOKEN_SECRET.
 */
function computeSignature(data) {
  var rawKey  = Utilities.newBlob(TOKEN_SECRET).getBytes();
  var rawData = Utilities.newBlob(data).getBytes();
  var hmac    = Utilities.computeHmacSha256Signature(rawData, rawKey);
  return Utilities.base64Encode(hmac);
}

/**
 * Hash a plaintext password with SHA-256.
 */
function hashPassword(password) {
  var rawBytes = Utilities.newBlob(password + TOKEN_SECRET).getBytes();
  var digest   = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawBytes);
  return Utilities.base64Encode(digest);
}

/**
 * Check whether a token appears in the TOKENS sheet as revoked.
 */
function isTokenRevoked(token) {
  try {
    var tokens = sheetToObjects(SHEET.TOKENS);
    var record = tokens.find(function(t) { return t.token === token; });
    return record && String(record.revoked).toUpperCase() === 'TRUE';
  } catch (e) {
    // If TOKENS sheet doesn't exist yet, nothing is revoked
    return false;
  }
}

/**
 * Write a new token record to the TOKENS sheet.
 */
function _persistToken(token, userId, role, airportId, createdAt, expiresAt) {
  try {
    var headers = ['token', 'userId', 'role', 'airportId', 'createdAt', 'expiresAt', 'revoked'];
    appendRow(SHEET.TOKENS, {
      token:     token,
      userId:    userId,
      role:      role,
      airportId: airportId,
      createdAt: formatDateTime(createdAt),
      expiresAt: formatDateTime(expiresAt),
      revoked:   'FALSE'
    }, headers);
  } catch (e) {
    // Non-fatal: log but do not break login flow
    Logger.log('_persistToken warning: ' + e.message);
  }
}

/**
 * Remove sensitive fields before returning a driver object to the client.
 */
function sanitizeDriver(driver) {
  var safe = Object.assign({}, driver);
  delete safe.password_hash;
  return safe;
}

/**
 * Remove sensitive fields before returning a staff object to the client.
 */
function sanitizeStaff(staff) {
  var safe = Object.assign({}, staff);
  delete safe.password_hash;
  return safe;
}
