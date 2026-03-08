import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, runTransaction,
  serverTimestamp, increment, collection, addDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { setSessionExpiry, clearSession } from './sessionService';

const COLL = 'CMG-Tool-Store-Management';
const ROOT = 'root';

const userDocRef  = (uid) => doc(db, COLL, ROOT, 'users', uid);
const appMetaRef  = ()    => doc(db, COLL, ROOT, 'appMeta', 'config');
const activityCol = ()    => collection(db, COLL, ROOT, 'activityLogs');

// ── Helpers ───────────────────────────────────────────────────────────────────
export async function fetchUserProfile(uid) {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

async function createUserProfile(uid, email, firstName, lastName, position) {
  return runTransaction(db, async (tx) => {
    const metaSnap   = await tx.get(appMetaRef());
    const isFirstUser = !metaSnap.exists() || !metaSnap.data().firstUserRegistered;

    const profile = {
      uid,
      email,
      firstName,
      lastName,
      position: position || '',
      role:   isFirstUser ? ['SuperAdmin'] : ['Supervisor'],
      status: isFirstUser ? 'approved'    : 'pending',
      assignedProjects: [],
      createdAt: serverTimestamp(),
      photoURL: null,
      isFirstUser,
    };

    tx.set(userDocRef(uid), profile);

    if (isFirstUser) {
      tx.set(appMetaRef(), { firstUserRegistered: true, totalUsers: 1, createdAt: serverTimestamp() });
    } else if (metaSnap.exists()) {
      tx.update(appMetaRef(), { totalUsers: increment(1) });
    } else {
      tx.set(appMetaRef(), { firstUserRegistered: true, totalUsers: 1, createdAt: serverTimestamp() });
    }

    return profile;
  });
}

function logActivity(action, userId, email, extra = {}) {
  addDoc(activityCol(), {
    action, userId, email, timestamp: serverTimestamp(), ...extra,
  }).catch(() => {});
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  // Set expiry IMMEDIATELY after sign-in to avoid race condition with onAuthStateChanged
  setSessionExpiry();

  await cred.user.getIdToken(true);
  const profile = await fetchUserProfile(cred.user.uid);

  logActivity('LOGIN', cred.user.uid, email, { method: 'email' });
  return profile;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);

  // Set expiry IMMEDIATELY after sign-in to avoid race condition with onAuthStateChanged
  setSessionExpiry();

  const existing = await fetchUserProfile(cred.user.uid);

  if (existing) {
    logActivity('LOGIN', cred.user.uid, cred.user.email, { method: 'google' });
    return existing;
  }

  // New Google user — create profile
  const parts   = (cred.user.displayName || '').split(' ');
  const profile = await createUserProfile(
    cred.user.uid, cred.user.email,
    parts[0] || '', parts.slice(1).join(' ') || '', '',
  );

  logActivity('REGISTER', cred.user.uid, cred.user.email, { method: 'google', isFirstUser: profile.isFirstUser });
  return profile;
}

export async function registerWithEmail(email, password, firstName, lastName, position) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Set expiry IMMEDIATELY after sign-in to avoid race condition with onAuthStateChanged
  setSessionExpiry();

  const profile = await createUserProfile(cred.user.uid, email, firstName, lastName, position);

  logActivity('REGISTER', cred.user.uid, email, { method: 'email', isFirstUser: profile.isFirstUser });
  return profile;
}

export async function logout() {
  clearSession();
  await signOut(auth);
}
