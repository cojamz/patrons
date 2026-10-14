// Firebase Realtime Database transport. Reuses the deployed project config from src/v3/firebase/config.js,
// loaded lazily so importing the session layer never signs in or opens a socket by itself.
// RTDB quirks handled here: values are JSON-cleaned (RTDB rejects `undefined`), every call waits for
// anonymous auth (rules need auth != null), and onDisconnect writes are re-armed after each reconnect.
//
// Emulator: `createFirebaseTransport({ emulator: '127.0.0.1:9000' })` (or `?rtdb=127.0.0.1:9000` on the page) talks
// to a local RTDB emulator instead, with a mock signed-in user, through the same SDK calls. Each emulator transport
// is its own app and its own socket, like a separate browser, so tests can drop one (goOffline) and the server runs
// its onDisconnect writes. Only localhost hosts are accepted, so a link can't point players at someone's server.
import { serverTimestamp } from 'firebase/database';

const cleanJson = v => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const NAMESPACE = 'cornycolonies-default-rtdb';

/** 'host:port' if it names a local emulator, else null. */
export function emulatorHost(spec) {
  const m = /^(localhost|127\.0\.0\.1|\[::1\]):(\d{2,5})$/.exec(String(spec || '').trim());
  return m ? `${m[1]}:${m[2]}` : null;
}
/** The emulator named by `?rtdb=` on this page, if any. */
export const urlEmulator = () => {
  try { return emulatorHost(new URLSearchParams(globalThis.location?.search || '').get('rtdb')); } catch { return null; }
};

let emuCount = 0;
async function loadEmulator(spec) {
  const [{ initializeApp, deleteApp }, dbm] = await Promise.all([import('firebase/app'), import('firebase/database')]);
  const [host, port] = [spec.slice(0, spec.lastIndexOf(':')), Number(spec.slice(spec.lastIndexOf(':') + 1))];
  const uid = `emu${Date.now().toString(36)}${(emuCount++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const app = initializeApp({ projectId: 'cornycolonies', databaseURL: `http://${host}:${port}?ns=${NAMESPACE}` }, uid);
  const db = dbm.getDatabase(app);
  dbm.connectDatabaseEmulator(db, host, port, { mockUserToken: { sub: uid, user_id: uid } });
  return { ...dbm, db, app, auth: { currentUser: { uid } }, authReady: Promise.resolve(), dispose: () => { dbm.goOffline(db); return deleteApp(app); } };
}

/**
 * @param {{ emulator?: string|null }} [opts]
 * @returns {import('./tree.js').Transport & { goOffline(): void, goOnline(): void }}
 */
export function createFirebaseTransport({ emulator = urlEmulator() } = {}) {
  const emu = emulatorHost(emulator);
  let modPromise = null;
  const load = () => (modPromise ??= (emu ? loadEmulator(emu) : import('../../../v3/firebase/config.js')).then(async m => {
    await m.authReady;
    if (!m.auth?.currentUser) console.warn('[firebase] anonymous auth not ready; writes may be refused by rules');
    return m;
  }));
  const at = (m, path) => m.ref(m.db, path);
  const disconnects = new Map();
  const connCbs = new Set();
  let connUnsub = null;
  let closed = false;
  const unsubs = new Set();

  // One .info/connected listener re-arms onDisconnect writes and tells the session layer.
  function watchConnection() {
    if (connUnsub) return;
    connUnsub = () => {};
    load().then(m => {
      if (closed) return;
      const off = m.onValue(at(m, '.info/connected'), snap => {
        const up = snap.val() === true;
        if (up) for (const [p, v] of disconnects) m.onDisconnect(at(m, p)).set(v).catch(err => console.warn('[firebase] onDisconnect', err));
        for (const cb of [...connCbs]) cb(up);
      });
      connUnsub = off;
    });
  }

  function listen(path, attach) {
    let off = null;
    let dead = false;
    load().then(m => { if (!dead && !closed) off = attach(m, at(m, path)); });
    const stop = () => { dead = true; off?.(); unsubs.delete(stop); };
    unsubs.add(stop);
    return stop;
  }

  return {
    kind: emu ? 'firebase-emulator' : 'firebase',
    ready: load().then(() => {}),
    async get(path) { const m = await load(); return (await m.get(at(m, path))).val(); },
    async set(path, value) { const m = await load(); await m.set(at(m, path), cleanJson(value)); },
    async update(path, obj) { const m = await load(); await m.update(at(m, path), cleanJson(obj)); },
    async push(path, value) {
      const m = await load();
      const r = m.push(at(m, path));
      await m.set(r, cleanJson(value));
      return r.key;
    },
    async remove(path) { const m = await load(); await m.remove(at(m, path)); },
    async transaction(path, fn) {
      const m = await load();
      const res = await m.runTransaction(at(m, path), cur => {
        const next = fn(cur);
        return next === undefined ? undefined : cleanJson(next);
      }, { applyLocally: false });
      return { committed: res.committed, value: res.snapshot.val() };
    },
    subscribe: (path, cb) => listen(path, (m, r) => m.onValue(r, snap => cb(snap.val()))),
    onChildAdded: (path, cb) => listen(path, (m, r) => m.onChildAdded(r, snap => cb(snap.key, snap.val()))),
    async onDisconnectSet(path, value) {
      disconnects.set(path, cleanJson(value));
      watchConnection();
      const m = await load();
      await m.onDisconnect(at(m, path)).set(cleanJson(value));
    },
    async cancelDisconnect(path) {
      disconnects.delete(path);
      const m = await load();
      await m.onDisconnect(at(m, path)).cancel();
    },
    onConnectedChange(cb) { connCbs.add(cb); watchConnection(); return () => connCbs.delete(cb); },
    serverTime: () => serverTimestamp(),
    /** Drops this client's socket (the server runs its onDisconnect writes); goOnline() reconnects. */
    goOffline() { load().then(m => m.goOffline(m.db)); },
    goOnline() { load().then(m => m.goOnline(m.db)); },
    close() {
      if (closed) return;
      closed = true;
      for (const stop of [...unsubs]) stop();
      connCbs.clear();
      connUnsub?.();
      // an emulator client is its own app: close its socket too, like a closed tab
      if (emu && modPromise) modPromise.then(m => m.dispose?.()).catch(() => {});
    },
  };
}
