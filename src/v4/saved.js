// Reload-proofing. Local games save their state and setup on every change; online games remember the room and
// your player id so a reload rejoins your seat. Everything is wrapped: storage can be missing or full.
const LOCAL = 'patrons.v4.local';
const ONLINE = 'patrons.v4.online';

const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

/** { config, state, savedAt } or null. Finished games aren't kept. */
export const loadLocal = () => { const v = read(LOCAL); return v && v.state && !v.state.over ? v : null; };
export const saveLocal = (config, state) => write(LOCAL, state && !state.over ? { config, state, savedAt: Date.now() } : null);
export const clearLocal = () => write(LOCAL, null);

/** { code, playerId, transport } or null. */
export const loadOnline = () => read(ONLINE);
export const saveOnline = v => write(ONLINE, v);
export const clearOnline = () => write(ONLINE, null);
