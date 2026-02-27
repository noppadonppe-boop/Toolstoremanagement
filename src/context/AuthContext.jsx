import React, { createContext, useContext, useState } from 'react';
import { USERS } from './mockData';

const AuthContext = createContext(null);

export const ROLE_PERMISSIONS = {
  MD: ['dashboard', 'inventory', 'requisitions', 'booking', 'borrow', 'repairs', 'writeoff', 'reports'],
  Admin: ['dashboard', 'inventory', 'requisitions', 'booking', 'borrow', 'repairs', 'writeoff', 'reports'],
  ProcurementManager: ['dashboard', 'inventory', 'writeoff'],
  PM: ['dashboard', 'inventory', 'requisitions', 'borrow'],
  CM: ['dashboard', 'requisitions'],
  StoreMain: ['dashboard', 'inventory', 'requisitions', 'booking'],
  StoreSite: ['dashboard', 'inventory', 'booking', 'borrow', 'repairs'],
  Supervisor: ['dashboard', 'booking'],
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const login = (username, password) => {
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setError('');
      return true;
    }
    setError('Invalid username or password');
    return false;
  };

  const logout = () => setCurrentUser(null);

  const hasPermission = (module) => {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role]?.includes(module) ?? false;
  };

  const canManageSite = (siteId) => {
    if (!currentUser) return false;
    if (['MD', 'Admin', 'ProcurementManager', 'StoreMain'].includes(currentUser.role)) return true;
    return currentUser.siteId === siteId;
  };

  return (
    <AuthContext.Provider value={{ currentUser, error, login, logout, hasPermission, canManageSite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
