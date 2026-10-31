// One tab owns the local game at a time (saboteur, RC1: two tabs of one game ran two games into one save, and the
// loser's moves vanished). The newest tab to open the game claims it: it writes { tab, at } under OWNER_KEY and says
// so on a BroadcastChannel. Any other tab that held the game hears it (the channel, or the storage event as a
// fallback, or its own next check of the key) and lets go: its bots stop, it stops saving, it says so on screen.
// Saves check the key before every write, so a tab that has lost the game can never overwrite the owner's save.
import { createEmitter } from './emitter.js';

export const OWNER_KEY = 'patrons.v4.owner';
export const OWNER_CHANNEL = 'patrons.v4.owner';

const randomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * @param {{ storage: Storage, channel?: { postMessage(m: any): void, addEventListener?: Function, removeEventListener?: Function, close?: Function }|null,
 *   events?: { addEventListener: Function, removeEventListener: Function }|null, id?: string, key?: string, now?: () => number }} opts
 *   `storage` is shared by every tab (localStorage); `channel` a BroadcastChannel; `events` receives 'storage' events (window).
 * @returns {{ id: string, claim(): void, owns(): boolean, holding(): boolean, release(): void, onLost(fn: () => void): () => void, destroy(): void }}
 */
export function createTabLease({ storage, channel = null, events = null, id = randomId(), key = OWNER_KEY, now = Date.now }) {
  const lost = createEmitter();
  let held = false; // this tab claimed the game and nobody has claimed it since
  const read = () => {
    try { const v = JSON.parse(storage.getItem(key) || 'null'); return v && typeof v.tab === 'string' ? v : null; } catch { return null; }
  };
  const lose = () => { if (!held) return; held = false; lost.emit(); };
  const onMessage = e => { const m = e && e.data; if (m && m.type === 'claim' && m.tab !== id) lose(); };
  const onStorage = e => {
    if (!e || e.key !== key || !e.newValue) return;
    try { const v = JSON.parse(e.newValue); if (v && v.tab !== id) lose(); } catch { /* ignore */ }
  };
  if (channel && channel.addEventListener) channel.addEventListener('message', onMessage);
  if (events && events.addEventListener) events.addEventListener('storage', onStorage);

  return {
    id,
    /** This tab takes the game: every other tab that held it lets go. */
    claim() {
      held = true;
      try { storage.setItem(key, JSON.stringify({ tab: id, at: now() })); } catch { /* storage full or blocked: the channel still tells the others */ }
      try { if (channel) channel.postMessage({ type: 'claim', tab: id }); } catch { /* ignore */ }
    },
    /** May this tab write the game? Yes unless another tab has claimed it (no claim at all: yes). Noticing a loss here fires onLost. */
    owns() {
      const v = read();
      if (v && v.tab !== id) { lose(); return false; }
      return true;
    },
    holding: () => held,
    /** The game is done here (its results are on screen): stop listening for claims and clear our mark. */
    release() {
      held = false;
      const v = read();
      if (v && v.tab === id) { try { storage.removeItem(key); } catch { /* ignore */ } }
    },
    onLost: fn => lost.on(fn),
    destroy() {
      held = false;
      lost.clear();
      if (channel && channel.removeEventListener) channel.removeEventListener('message', onMessage);
      if (events && events.removeEventListener) events.removeEventListener('storage', onStorage);
    },
  };
}
