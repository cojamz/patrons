// Two (or more) browser tabs of one browser profile share a store with no network. Meant for Playwright
// e2e of online play and local demos (?transport=broadcast).
//
// The tree lives in IndexedDB, written in readwrite transactions (atomic and serialized across tabs), and
// every commit pings the other tabs over a BroadcastChannel, which then re-read it. Each commit bumps a
// revision so out-of-order reads are ignored.
// Why not localStorage: in Chromium a localStorage write reaches other tabs asynchronously, so a tab can
// get the BroadcastChannel ping first, re-read stale data, and never hear about the change again (and
// read-modify-writes can lose updates). localStorage is only a fallback where IndexedDB is missing (jsdom),
// plus a debug mirror of the tree at `patrons-bt:<channel>`.
import { splitPath, getAt, setAt, updateAt, normalize, clone, pushKey, createListenerHub } from './tree.js';

const DB_NAME = 'patrons-bt';
const STORE = 'kv';

/** IndexedDB backend: read() and mutate(fn) over one { rev, data } record. */
function idbBackend(key) {
  const opened = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const blank = { rev: 0, data: null };
  return {
    async read() {
      const db = await opened;
      return new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result || blank);
        req.onerror = () => reject(req.error);
      });
    },
    /** fn(data) -> { data, out }. Runs inside one readwrite transaction. */
    async mutate(fn) {
      const db = await opened;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const st = tx.objectStore(STORE);
        let next = null, out;
        const req = st.get(key);
        req.onsuccess = () => {
          const cur = req.result || blank;
          try {
            const r = fn(cur.data);
            out = r.out;
            next = { rev: cur.rev + 1, data: r.data };
            st.put(next, key);
          } catch (err) { out = err; next = null; tx.abort(); }
        };
        tx.oncomplete = () => resolve({ rec: next, out });
        tx.onabort = () => reject(out instanceof Error ? out : tx.error || new Error('aborted'));
        tx.onerror = () => {};
      });
    },
  };
}

/** localStorage backend (no IndexedDB, e.g. jsdom). Fine within one process; not for real tabs. */
function lsBackend(key) {
  const load = () => { try { return JSON.parse(localStorage.getItem(key) || 'null') || { rev: 0, data: null }; } catch { return { rev: 0, data: null }; } };
  return {
    async read() { return load(); },
    async mutate(fn) {
      const cur = load();
      const r = fn(cur.data);
      const rec = { rev: cur.rev + 1, data: r.data };
      localStorage.setItem(key, JSON.stringify(rec));
      return { rec, out: r.out };
    },
  };
}

/**
 * @param {string} [channelName]
 * @returns {import('./tree.js').Transport}
 */
export function createBroadcastTransport(channelName = 'patrons-v4') {
  const key = `patrons-bt:${channelName}`;
  const useIdb = typeof indexedDB !== 'undefined' && !!indexedDB;
  const backend = useIdb ? idbBackend(key) : lsBackend(key + ':ls');
  const channel = new BroadcastChannel(channelName);
  let rev = -1;
  let data = null;
  let closed = false;
  let loaded = false;
  const hub = createListenerHub(segs => getAt(data, segs));
  const disconnects = new Map();

  const mirror = () => { if (useIdb) try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* debug only */ } };
  const adopt = rec => {
    if (!rec || rec.rev <= rev) return false;
    rev = rec.rev; data = rec.data ?? null;
    return true;
  };
  const refresh = () => backend.read().then(rec => { if (!closed && adopt(rec)) hub.notify(); }).catch(err => console.error('[broadcast] read failed', err));
  // A closing tab can't finish an IndexedDB write, so it announces its onDisconnect writes and the tabs still open
  // apply them (like the RTDB server does). Idempotent: every open tab may apply the same writes.
  channel.onmessage = ev => {
    const gone = ev && ev.data && ev.data.disconnect;
    if (Array.isArray(gone)) { if (!closed) mutate(d => { for (const [p, v] of gone) d = setAt(d, splitPath(p), v); return { data: d }; }).catch(() => {}); return; }
    refresh();
  };

  const ready = backend.read().then(rec => { adopt(rec); loaded = true; });

  const mutate = fn => ready.then(async () => {
    if (closed) throw new Error('closed');
    const { rec, out } = await backend.mutate(fn);
    if (adopt(rec)) { mirror(); hub.notify(); }
    try { channel.postMessage(rec.rev); } catch { /* closing */ }
    return out;
  });

  // Listeners registered before the first read wait for it, so they never see a fake "empty" value.
  const whenLoaded = reg => {
    if (loaded) return reg();
    let off = null, dead = false;
    ready.then(() => { if (!dead && !closed) off = reg(); });
    return () => { dead = true; off?.(); };
  };

  const fireDisconnects = () => {
    if (!disconnects.size) return Promise.resolve();
    const entries = [...disconnects];
    return backend.mutate(d => {
      for (const [p, v] of entries) d = setAt(d, splitPath(p), v);
      return { data: d };
    }).then(({ rec }) => { try { channel.postMessage(rec.rev); } catch { /* closing */ } }).catch(() => {});
  };
  const onHide = () => {
    if (disconnects.size) { try { channel.postMessage({ disconnect: [...disconnects] }); } catch { /* closing */ } }
    fireDisconnects();
  };
  globalThis.addEventListener?.('pagehide', onHide);

  return {
    kind: 'broadcast',
    ready,
    async get(path) {
      await ready;
      adopt(await backend.read());
      return clone(getAt(data, splitPath(path)));
    },
    set: (path, value) => mutate(d => ({ data: setAt(d, splitPath(path), value) })),
    update: (path, obj) => mutate(d => ({ data: updateAt(d, splitPath(path), obj) })),
    push: (path, value) => mutate(d => { const k = pushKey(); return { data: setAt(d, [...splitPath(path), k], value), out: k }; }),
    remove: path => mutate(d => ({ data: setAt(d, splitPath(path), null) })),
    transaction: (path, fn) => mutate(d => {
      const segs = splitPath(path);
      const cur = clone(getAt(d, segs));
      const next = fn(clone(cur));
      if (next === undefined) return { data: d, out: { committed: false, value: cur } };
      const nd = setAt(d, segs, next);
      return { data: nd, out: { committed: true, value: clone(getAt(nd, segs)) } };
    }),
    subscribe: (path, cb) => whenLoaded(() => hub.value(path, cb)),
    onChildAdded: (path, cb) => whenLoaded(() => hub.child(path, cb)),
    async onDisconnectSet(path, value) { disconnects.set(splitPath(path).join('/'), normalize(value)); },
    async cancelDisconnect(path) { disconnects.delete(splitPath(path).join('/')); },
    onConnectedChange(cb) { ready.then(() => { if (!closed) cb(true); }); return () => {}; },
    serverTime: () => Date.now(),
    close() {
      if (closed) return;
      fireDisconnects();
      closed = true;
      hub.clear();
      globalThis.removeEventListener?.('pagehide', onHide);
      channel.close();
    },
  };
}
