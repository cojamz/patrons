// Public API of the v4 session layer: connects the pure engine to a screen, locally or online.
export { createLocalSession, moveProblem } from './local.js';
export { createRoom, joinRoom, rejoinRoom, seatList, newRoomCode, ROOM_ROOT, MAX_SEATS, MIN_SEATS } from './online.js';
export { createMemoryStore, createMemoryTransport } from './transport/memory.js';
export { createBroadcastTransport } from './transport/broadcast.js';
export { createFirebaseTransport } from './transport/firebase.js';
