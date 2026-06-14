import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_DRIVERS } from '../services/mockData.js';
import { findDriverByNik } from '../services/sheetsService.js';
import { setDriverOnlineStatus } from '../services/supabaseService.js';

const AuthContext = createContext(null);

const SESSION_KEY = 'radms_driver_session';
const DRIVER_KEY = 'radms_driver_data';

export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session dari localStorage saat init
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    const savedDriver = localStorage.getItem(DRIVER_KEY);

    if (savedSession && savedDriver) {
      try {
        const session = JSON.parse(savedSession);
        const driverData = JSON.parse(savedDriver);
        // Validasi session masih valid (24 jam)
        if (Date.now() - session.loginAt < 24 * 60 * 60 * 1000) {
          setDriver(driverData);
        } else {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(DRIVER_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(DRIVER_KEY);
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login dengan nomor HP dan password
   * @param {string} phone
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = useCallback(async (nik, nameInput) => {
    setError(null);
    if (!nik.trim() || !nameInput.trim()) {
      const msg = 'Masukkan ID Driver dan Nama Anda.';
      setError(msg);
      return { success: false, error: msg };
    }
    try {
      // Try Google Sheets first
      let foundDriver = null;
      try {
        const sheetDriver = await findDriverByNik(nik.trim());
        if (sheetDriver) {
          const sheetName = sheetDriver.name.toLowerCase();
          const input     = nameInput.trim().toLowerCase();
          if (sheetName.includes(input) || input.includes(sheetName.split(' ')[0])) {
            foundDriver = sheetDriver;
          }
        }
      } catch { /* fallback below */ }

      // Fallback: mock data (for demo/development)
      if (!foundDriver) {
        const cleanNik  = nik.replace(/\D/g, '');
        const mockFound = MOCK_DRIVERS.find(d => (d.nik || d.id || '').replace(/\D/g,'') === cleanNik);
        if (mockFound) {
          foundDriver = { id: mockFound.id, nik: mockFound.nik || mockFound.id, name: mockFound.name, airportId: mockFound.airportId, vehicle: mockFound.vehicle || '', plateNumber: mockFound.plateNumber || '' };
        }
      }

      if (!foundDriver) {
        const msg = 'ID Driver tidak ditemukan. Pastikan NIK sesuai data RIFIM.';
        setError(msg);
        return { success: false, error: msg };
      }


      const driverData = {
        id: foundDriver.id || foundDriver.nik,
        nik: foundDriver.nik,
        name: foundDriver.name,
        airportId: foundDriver.airportId,
        vehicle: foundDriver.vehicle || '',
        plateNumber: foundDriver.plateNumber || '',
        online: false,
      };
      const session = { loginAt: Date.now(), driverId: driverData.id };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(DRIVER_KEY, JSON.stringify(driverData));
      setDriver(driverData);
      return { success: true };
    } catch {
      const msg = 'Terjadi kesalahan. Coba lagi.';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  /**
   * Logout driver
   */
  const logout = useCallback(async () => {
    if (driver) setDriverOnlineStatus(driver.id, false).catch(() => {});
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DRIVER_KEY);
    sessionStorage.clear();
    setDriver(null);
    setError(null);
  }, [driver]);

  /**
   * Update data driver (simulasi)
   * @param {Object} updates
   */
  const updateDriver = useCallback((updates) => {
    setDriver((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(DRIVER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    driver,
    loading,
    error,
    isAuthenticated: !!driver,
    login,
    logout,
    updateDriver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
