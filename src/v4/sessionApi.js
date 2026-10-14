// Where the UI gets its sessions. Local play comes from session/local.js. The online pieces are picked up
// from src/v4/session/ when they exist (import.meta.glob returns {} for missing files, so this builds either way).
export { createLocalSession } from './session/local.js';

const found = import.meta.glob('./session/*.js', { eager: true });
const pick = name => Object.values(found).map(m => m[name]).find(Boolean);

// createRoom({name, transport}) / joinRoom({code, name, transport}) -> { lobby }
export const createRoom = pick('createRoom') || null;
export const joinRoom = pick('joinRoom') || null;
const firebase = pick('createFirebaseTransport');
const broadcast = pick('createBroadcastTransport');
/** Firebase in production; `?transport=broadcast` plays across tabs of one browser (tests, local demos). */
export function makeTransport() {
  const want = new URLSearchParams(location.search).get('transport');
  if (want === 'broadcast' && broadcast) return broadcast();
  if (firebase) return firebase();
  throw new Error('No online transport available.');
}
export const onlineReady = !!(createRoom && joinRoom);
