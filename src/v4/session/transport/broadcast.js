// Two (or more) browser tabs on the same origin share one store, with no network: the tree lives in
// localStorage and every write pings the other tabs over a BroadcastChannel. Writes are serialized across
// tabs with the Web Locks API when the browser has it. Meant for Playwright e2e of online play.
import { splitPath, getAt, setAt, updateAt, normalize, clone, pushKey, createListenerHub } from './tree.js';

/**
 * @param {string} [channelName]
 * @returns {import('./tree.js').Transport}
 */
export function createBroadcastTransport(channelName = 'patrons-v4') {
  const storageKey = `patrons-bt:${channelName}`;
  const channel = new BroadcastChannel(channelName);
  const load = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; }
  };
  const save = d => {
    try { localStorage.setItem(storageKey, JSON.stringify(d)); } catch (err) { console.error('[broadcast] save failed', err); }
  };
  let data = load();
  let closed = false;
  const hub = createListenerHub(segs => getAt(data, segs));
  const disconnects = new Map();

  const refresh = () => { if (closed) return; data = load(); hub.notify(); };
  channel.onmessage = refresh;

  const lock = fn => (globalThis.navigator?.locks?.request
    ? navigator.locks.request(storageKey, async () => fn())
    : Promise.resolve().then(fn));

  const mutate = fn => lock(() => {
    if (closed) throw new Error('closed');
    data = load();
    const out = fn();
    save(data);
    channel.postMessage(1);
    hub.notify();
    return out;
  });

  const fireDisconnects = () => {
    if (!disconnects.size) return;
    let d = load();
    for (const [p, v] of disconnects) d = setAt(d, splitPath(p), v);
    save(d);
    try { channel.postMessage(1); } catch { /* closing */ }
  };
  const onHide = () => fireDisconnects();
  globalThis.addEventListener?.('pagehide', onHide);

  return {
    kind: 'broadcast',
    ready: Promise.resolve(),
    async get(path) { data = load(); return clone(getAt(data, splitPath(path))); },
    set: (path, value) => mutate(() => { data = setAt(data, splitPath(path), value); }),
    update: (path, obj) => mutate(() => { data = updateAt(data, splitPath(path), obj); }),
    push: (path, value) => mutate(() => { const key = pushKey(); data = setAt(data, [...splitPath(path), key], value); return key; }),
    remove: path => mutate(() => { data = setAt(data, splitPath(path), null); }),
    transaction: (path, fn) => mutate(() => {
      const segs = splitPath(path);
      const cur = clone(getAt(data, segs));
      const next = fn(clone(cur));
      if (next === undefined) return { committed: false, value: cur };
      data = setAt(data, segs, next);
      return { committed: true, value: clone(getAt(data, segs)) };
    }),
    subscribe: (path, cb) => hub.value(path, cb),
    onChildAdded: (path, cb) => hub.child(path, cb),
    async onDisconnectSet(path, value) { disconnects.set(splitPath(path).join('/'), normalize(value)); },
    async cancelDisconnect(path) { disconnects.delete(splitPath(path).join('/')); },
    onConnectedChange(cb) { queueMicrotask(() => cb(!closed)); return () => {}; },
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
