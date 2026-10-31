// Where the UI gets its sessions. Local play comes from session/local.js. The online pieces are picked up
// from src/v4/session/ when they exist (import.meta.glob returns {} for missing files, so this builds either way).
export { createLocalSession } from './session/local.js';
import { perfTransport } from './perf.js';

const found = import.meta.glob('./session/*.js', { eager: true });
const pick = name => Object.values(found).map(m => m[name]).find(Boolean);

// createRoom({name, transport}) / joinRoom({code, name, transport}) -> { lobby }
export const createRoom = pick('createRoom') || null;
export const joinRoom = pick('joinRoom') || null;
export const rejoinRoom = pick('rejoinRoom') || null;
const firebase = pick('createFirebaseTransport');
const broadcast = pick('createBroadcastTransport');
/** Firebase in production; `?transport=broadcast` plays across tabs of one browser (tests, local demos). */
/** Which transport this page uses: 'broadcast' with ?transport=broadcast, else 'firebase'. */
export const transportKind = () => (new URLSearchParams(location.search).get('transport') === 'broadcast' ? 'broadcast' : 'firebase');
export function makeTransport(kind = transportKind()) {
  const want = kind;
  // perfTransport: `?lag=MS` delays the network both ways, `?trace=1` logs round trips; else the transport itself
  if (want === 'broadcast' && broadcast) return perfTransport(broadcast());
  if (firebase) return perfTransport(firebase());
  throw new Error('No online transport available.');
}
export const onlineReady = !!(createRoom && joinRoom);
