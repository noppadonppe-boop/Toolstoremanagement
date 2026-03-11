import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { isSessionExpired, getRemainingMinutes } from '../services/sessionService';
import { logout as authServiceLogout } from '../services/authService';

const COLL = 'CMG Tool Store Management';
const ROOT = 'root';

const AuthContext = createContext(null);

export const ROLES = [
  'SuperAdmin', 'MD', 'Admin', 'ProcurementManager',
  'PM', 'CM', 'StoreMain', 'StoreSite', 'Supervisor',
];

export const ROLE_PERMISSIONS = {
  SuperAdmin:          ['dashboard', 'inventory', 'requisitions', 'booking', 'borrow', 'repairs', 'writeoff', 'reports', 'admin', 'projects'],
  MD:                  ['dashboard', 'inventory', 'requisitions', 'booking', 'borrow', 'repairs', 'writeoff', 'reports'],
  Admin:               ['dashboard', 'inventory', 'requisitions', 'booking', 'borrow', 'repairs', 'writeoff', 'reports', 'admin', 'projects'],
  ProcurementManager:  ['dashboard', 'inventory', 'writeoff'],
  PM:                  ['dashboard', 'inventory', 'requisitions', 'booking', 'borrow', 'repairs', 'writeoff', 'reports'],
  CM:                  ['dashboard', 'inventory', 'requisitions', 'booking', 'borrow', 'repairs', 'writeoff', 'reports'],
  StoreMain:           ['dashboard', 'inventory', 'requisitions', 'booking'],
  StoreSite:           ['dashboard', 'inventory', 'booking', 'borrow', 'repairs'],
  Supervisor:          ['dashboard', 'booking'],
};

// Adapt Firestore profile to shape expected by existing Topbar / Sidebar
// authPhotoURL = รูปจาก Firebase Auth (Google) — ใช้ถ้ามี จะได้แสดงรูปบัญชี Google
function adaptProfile(profile, authPhotoURL = null) {
  if (!profile) return null;
  const roles = Array.isArray(profile.role) ? profile.role : (profile.role ? [profile.role] : ['Supervisor']);
  const primaryRole = roles[0] || 'Supervisor';
  const initials = [profile.firstName?.[0], profile.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const photoURL = authPhotoURL || profile.photoURL || null;
  const uid = profile.uid || profile.id || null;
  return {
    ...profile,
    uid,
    id: uid,
    name:   `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email,
    role:   primaryRole,
    roles,
    avatar: photoURL || initials,
    siteId: profile.assignedProjects?.[0] || 'HQ',
  };
}

export function AuthProvider({ children }) {
  const [firebaseUser,       setFirebaseUser]       = useState(undefined); // undefined = loading
  const [userProfile,        setUserProfile]        = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [sessionMinutesLeft, setSessionMinutesLeft] = useState(0);
  const [error,              setError]              = useState('');
  const timerRef = useRef(null);

  // ── Fetch profile from Firestore (silent failure) ─────────────────────────
  const fetchProfile = useCallback(async (uid) => {
    try {
      const snap = await getDoc(doc(db, COLL, ROOT, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  }, []);

  // ── Force re-fetch (called from pages when needed) ─────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    const profile = await fetchProfile(auth.currentUser.uid);
    setUserProfile(adaptProfile(profile, auth.currentUser.photoURL || null));
  }, [fetchProfile]);

  // ── Set profile from login result (avoids Firestore read delay / race) ───
  const setProfileFromLogin = useCallback((profile) => {
    if (profile) setUserProfile(adaptProfile(profile, auth.currentUser?.photoURL || null));
  }, []);

  // ตั้งทั้ง firebaseUser + profile จากผลล็อกอินเลย เพื่อให้ redirect ทำงานกดครั้งเดียว (ไม่ต้องรอ onAuthStateChanged)
  const setAuthStateFromLogin = useCallback((fbUser, profile) => {
    if (fbUser) setFirebaseUser(fbUser);
    if (profile) setUserProfile(adaptProfile(profile, fbUser?.photoURL || null));
    // สำคัญ: ปิด loading ทันที ไม่ต้องรอ onAuthStateChanged
    setSessionMinutesLeft(getRemainingMinutes());
    setLoading(false);
  }, []);

  // ── Main auth state listener ──────────────────────────────────────────────
  // Delay profile fetch so login flow (setProfileFromLogin) can run first and never get overwritten by null.
  useEffect(() => {
    let delayTimeoutId = null;

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      if (isSessionExpired()) {
        authServiceLogout().then(() => {
          setFirebaseUser(null);
          setUserProfile(null);
          setLoading(false);
        });
        return;
      }

      setFirebaseUser(fbUser);
      setSessionMinutesLeft(getRemainingMinutes());
      setLoading(false);

      // Delay fetch so that loginWithGoogle() + setProfileFromLogin() complete first (same sign-in).
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
      delayTimeoutId = window.setTimeout(async () => {
        delayTimeoutId = null;
        if (auth.currentUser?.uid !== fbUser.uid) return;
        const profile = await fetchProfile(fbUser.uid);
        if (auth.currentUser?.uid !== fbUser.uid) return;
        if (profile) setUserProfile(adaptProfile(profile, fbUser.photoURL || null));
        // If null, never set — leave profile from setProfileFromLogin() if any
      }, 200);
    });

    return () => {
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
      unsubscribe();
    };
  }, [fetchProfile]);

  // ── Session countdown timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(async () => {
      if (isSessionExpired()) {
        await authServiceLogout();
        setFirebaseUser(null);
        setUserProfile(null);
      } else {
        setSessionMinutesLeft(getRemainingMinutes());
      }
    }, 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [firebaseUser]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authServiceLogout();
    setFirebaseUser(null);
    setUserProfile(null);
    setError('');
  }, []);

  // ── Permission helpers ────────────────────────────────────────────────────
  const isSuperAdmin = userProfile
    ? (userProfile.roles || [userProfile.role]).includes('SuperAdmin')
    : false;

  /** มีสิทธิ์เข้าถึง module ใดๆ ตาม roles ที่มี (SuperAdmin ผ่านทุก module) */
  const hasPermission = useCallback((module) => {
    if (!userProfile) return false;
    if (isSuperAdmin) return true;
    const roles = userProfile.roles || [userProfile.role];
    return roles.some(r => ROLE_PERMISSIONS[r]?.includes(module));
  }, [userProfile, isSuperAdmin]);

  /** มีบทบาทอย่างน้อยหนึ่งใน allowedRoles (SuperAdmin ผ่านทุก action) */
  const hasAnyRole = useCallback((allowedRoles) => {
    if (!userProfile || !Array.isArray(allowedRoles) || allowedRoles.length === 0) return false;
    if (isSuperAdmin) return true;
    const roles = userProfile.roles || [userProfile.role];
    const normalized = Array.isArray(roles) ? roles : [roles];
    return normalized.some(r => allowedRoles.includes(r));
  }, [userProfile, isSuperAdmin]);

  const canManageSite = useCallback((siteId) => {
    if (!userProfile) return false;
    const roles = userProfile.roles || [userProfile.role];
    if (roles.some(r => ['MD', 'Admin', 'SuperAdmin', 'ProcurementManager', 'StoreMain'].includes(r))) return true;
    return userProfile.siteId === siteId;
  }, [userProfile]);

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      currentUser: userProfile,  // backward-compat alias
      loading,
      sessionMinutesLeft,
      error, setError,
      refreshProfile,
      setProfileFromLogin,
      setAuthStateFromLogin,
      logout,
      hasPermission,
      hasAnyRole,
      canManageSite,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
