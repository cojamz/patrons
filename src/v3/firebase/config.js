/**
 * Firebase configuration for The Favored multiplayer.
 *
 * Initializes Firebase app + Realtime Database.
 * Uses the same project as the legacy v0 code (cornycolonies).
 * Safe against double-init if legacy compat code also loads.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off, push, remove, update, onDisconnect, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB0c0iUOG3llUzLd9FhQ6Qc1qCB0DoajVw",
  authDomain: "cornycolonies.firebaseapp.com",
  databaseURL: "https://cornycolonies-default-rtdb.firebaseio.com",
  projectId: "cornycolonies",
  storageBucket: "cornycolonies.firebasestorage.app",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { db, ref, set, get, onValue, off, push, remove, update, onDisconnect, serverTimestamp };
export default db;
