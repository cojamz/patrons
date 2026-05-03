/**
 * Firebase configuration for The Favored multiplayer.
 *
 * Initializes Firebase app + Realtime Database.
 * Uses the same project as the legacy v0 code (cornycolonies).
 * Safe against double-init if legacy compat code also loads.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, onChildAdded, off, push, remove, update, onDisconnect, serverTimestamp, runTransaction } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB0c0iUOG3llUzLd9FhQ6Qc1qCB0DoajVw",
  authDomain: "cornycolonies.firebaseapp.com",
  databaseURL: "https://cornycolonies-default-rtdb.firebaseio.com",
  projectId: "cornycolonies",
  storageBucket: "cornycolonies.firebasestorage.app",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const auth = getAuth(app);

// Sign in anonymously so Firebase rules (auth != null) are satisfied.
// Returns a promise that resolves when auth is ready.
const authReady = signInAnonymously(auth).catch(err => {
  console.warn('Firebase anonymous auth failed:', err.message);
});

export { db, ref, set, get, onValue, onChildAdded, off, push, remove, update, onDisconnect, serverTimestamp, runTransaction, auth, authReady };
export default db;
