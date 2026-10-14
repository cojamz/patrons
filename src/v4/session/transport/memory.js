// In-process transport for tests: several clients share one store. Writes land after a microtask and
// listeners fire on later microtasks, so timing is async like RTDB. goOffline()/goOnline() simulate a
// dropped connection (onDisconnect writes fire, listeners go quiet, writes fail).
import { splitPath, getAt, setAt, updateAt, normalize, clone, pushKey, createListenerHub } from './tree.js';

/** @returns {{ data: any, clients: Set<any> }} */
export function createMemoryStore() {
  return { data: null, clients: new Set() };
}

/**
 * @param {ReturnType<typeof createMemoryStore>} [store]
 * @param {{ nullFirst?: boolean }} [opts] nullFirst: like RTDB with a cold cache, call a transaction's
 *   update function with null first (its result is discarded when the real value isn't null).
 * @returns {import('./tree.js').Transport & { goOffline(): void, goOnline(): void, store: any, isOnline(): boolean }}
 */
export function createMemoryTransport(store = createMemoryStore(), { nullFirst = true } = {}) {
  let online = true;
  let closed = false;
  const disconnects = new Map(); // path -> value; fires on every disconnect
  const connCbs = new Set();
  const hub = createListenerHub(segs => getAt(store.data, segs));
  const client = { hub, isOnline: () => online && !closed };
  store.clients.add(client);

  const tick = () => new Promise(r => queueMicrotask(r));
  const write = mutate => {
    store.data = mutate(store.data);
    for (const c of store.clients) if (c.isOnline()) c.hub.notify();
  };
  const op = async fn => {
    await tick();
    if (!online || closed) throw new Error('offline');
    return fn();
  };

  return {
    kind: 'memory',
    store,
    ready: Promise.resolve(),
    isOnline: () => online && !closed,
    get: path => op(() => clone(getAt(store.data, splitPath(path)))),
    set: (path, value) => op(() => { write(d => setAt(d, splitPath(path), value)); }),
    update: (path, obj) => op(() => { write(d => updateAt(d, splitPath(path), obj)); }),
    push: (path, value) => op(() => {
      const key = pushKey();
      write(d => setAt(d, [...splitPath(path), key], value));
      return key;
    }),
    remove: path => op(() => { write(d => setAt(d, splitPath(path), null)); }),
    transaction: (path, fn) => op(() => {
      const segs = splitPath(path);
      const cur = clone(getAt(store.data, segs));
      if (nullFirst && cur !== null) fn(null); // cold-cache first pass; real RTDB retries with the server value
      const next = fn(clone(cur));
      if (next === undefined) return { committed: false, value: cur };
      write(d => setAt(d, segs, next));
      return { committed: true, value: clone(getAt(store.data, segs)) };
    }),
    subscribe: (path, cb) => hub.value(path, cb),
    onChildAdded: (path, cb) => hub.child(path, cb),
    async onDisconnectSet(path, value) { disconnects.set(splitPath(path).join('/'), normalize(value)); },
    async cancelDisconnect(path) { disconnects.delete(splitPath(path).join('/')); },
    onConnectedChange(cb) { connCbs.add(cb); queueMicrotask(() => connCbs.has(cb) && cb(client.isOnline())); return () => connCbs.delete(cb); },
    serverTime: () => Date.now(),
    goOffline() {
      if (!online) return;
      online = false;
      for (const [p, v] of disconnects) write(d => setAt(d, splitPath(p), v));
      for (const cb of [...connCbs]) cb(false);
    },
    goOnline() {
      if (online || closed) return;
      online = true;
      hub.notify();
      for (const cb of [...connCbs]) cb(true);
    },
    close() {
      if (closed) return;
      if (online) for (const [p, v] of disconnects) write(d => setAt(d, splitPath(p), v));
      closed = true;
      hub.clear();
      store.clients.delete(client);
    },
  };
}
