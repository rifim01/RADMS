import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_DRIVERS } from '../services/mockData.js';

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
  const login = useCallback(async (phone, password) => {
    setError(null);

    // Simulasi network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Bersihkan nomor HP
    const cleanPhone = phone.replace(/\D/g, '').replace(/^62/, '0');

    const foundDriver = MOCK_DRIVERS.find(
      (d) => d.phone.replace(/\D/g, '') === cleanPhone && d.password === password
    );

    if (!foundDriver) {
      const errMsg = 'Nomor HP atau password salah. Coba lagi.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }

    if (foundDriver.status !== 'active') {
      const errMsg = 'Akun Anda tidak aktif. Hubungi administrator.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }

    // Simpan session
    const session = { loginAt: Date.now(), driverId: foundDriver.id };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(DRIVER_KEY, JSON.stringify(foundDriver));

    setDriver(foundDriver);
    return { success: true };
  }, []);

  /**
   * Logout driver
   */
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DRIVER_KEY);
    sessionStorage.clear();
    setDriver(null);
    setError(null);
  }, []);

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
