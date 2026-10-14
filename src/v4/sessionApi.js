// Where the UI gets its sessions. Local play comes from session/local.js. The online pieces are picked up
// from src/v4/session/ when they exist (import.meta.glob returns {} for missing files, so this builds either way).
export { createLocalSession } from './session/local.js';

const found = import.meta.glob('./session/*.js', { eager: true });
const pick = name => Object.values(found).map(m => m[name]).find(Boolean);

// createRoom({name, transport}) / joinRoom({code, name, transport}) -> { lobby }
export const createRoom = pick('createRoom') || null;
export const joinRoom = pick('joinRoom') || null;
export const defaultTransport = pick('createFirebaseTransport') || pick('defaultTransport') || null;
export const onlineReady = !!(createRoom && joinRoom);
