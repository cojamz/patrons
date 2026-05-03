/**
 * Room management for The Favored multiplayer.
 *
 * Handles room creation, joining, leaving, presence detection,
 * and real-time room state subscriptions.
 *
 * Database schema:
 *   v3rooms/{roomCode}/
 *     host: "playerId"
 *     status: "lobby" | "drafting" | "playing" | "finished"
 *     settings: { playerCount, godSet }
 *     createdAt: serverTimestamp
 *     players/{playerId}: { name, ready, connected, lastSeen, slot }
 *     gameState: { ...serialized engine state }
 *     pendingDecision: { ...decision object | null }
 *     actions/{playerId}: { type, payload, timestamp }
 */
import { db, ref, set, get, onValue, onChildAdded, off, remove, update, onDisconnect, serverTimestamp, runTransaction, authReady } from './config.js';

// --- Room code generation ---

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10);
}

// --- Room CRUD ---

/**
 * Create a new room. The creator becomes the host.
 * @param {string} hostName - Display name of the host
 * @returns {{ roomCode: string, playerId: string }}
 */
export async function createRoom(hostName) {
  await authReady;
  // Try up to 5 times to find an unused code
  let roomCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    roomCode = generateRoomCode();
    const roomRef = ref(db, `v3rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) break;
    if (attempt === 4) throw new Error('Could not generate unique room code');
  }

  const playerId = generatePlayerId();

  const roomData = {
    host: playerId,
    status: 'lobby',
    settings: {
      playerCount: 2,
    },
    createdAt: serverTimestamp(),
    players: {
      [playerId]: {
        name: hostName,
        ready: false,
        connected: true,
        lastSeen: serverTimestamp(),
        slot: 0,
      },
    },
  };

  await set(ref(db, `v3rooms/${roomCode}`), roomData);

  // Set up presence: mark disconnected on tab close
  setupPresence(roomCode, playerId);

  return { roomCode, playerId };
}

/**
 * Join an existing room.
 * @param {string} roomCode - 4-character room code
 * @param {string} playerName - Display name
 * @returns {{ playerId: string, room: object }}
 */
export async function joinRoom(roomCode, playerName) {
  await authReady;
  const roomRef = ref(db, `v3rooms/${roomCode}`);

  // Read room metadata once to validate existence/status and get max players.
  // The actual seat allocation happens inside a transaction below to prevent
  // two concurrent joiners from grabbing the same slot.
  const roomSnap = await get(roomRef);
  if (!roomSnap.exists()) {
    throw new Error('Room not found');
  }
  const room = roomSnap.val();
  if (room.status !== 'lobby') {
    throw new Error('Game already started');
  }
  const maxPlayers = room.settings?.playerCount || 4;

  const playerId = generatePlayerId();
  let assignedSlot = null;

  // Atomic seat allocation. Firebase will retry the function if another
  // client commits a conflicting write between read and commit.
  const playersRef = ref(db, `v3rooms/${roomCode}/players`);
  const result = await runTransaction(playersRef, (currentPlayers) => {
    const players = currentPlayers || {};
    const count = Object.keys(players).length;
    if (count >= maxPlayers) {
      // Returning undefined aborts the transaction (no write).
      return;
    }
    const usedSlots = new Set(Object.values(players).map(p => p && p.slot));
    let slot = 0;
    while (usedSlots.has(slot)) slot++;
    assignedSlot = slot;
    return {
      ...players,
      [playerId]: {
        name: playerName,
        ready: false,
        connected: true,
        lastSeen: serverTimestamp(),
        slot,
      },
    };
  });

  if (!result.committed) {
    throw new Error('Room is full');
  }

  // Set up presence after the seat is committed.
  setupPresence(roomCode, playerId);

  return { playerId, room, slot: assignedSlot };
}

/**
 * Leave a room. If the leaving player is the host, transfer host to next player
 * or delete the room if empty.
 */
export async function leaveRoom(roomCode, playerId) {
  const roomRef = ref(db, `v3rooms/${roomCode}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) return;

  const room = snapshot.val();
  const players = room.players || {};

  // Remove this player
  await remove(ref(db, `v3rooms/${roomCode}/players/${playerId}`));

  const remainingIds = Object.keys(players).filter(id => id !== playerId);

  if (remainingIds.length === 0) {
    // Last player left — delete the room
    await remove(roomRef);
    return;
  }

  // Transfer host if needed
  if (room.host === playerId) {
    await update(ref(db, `v3rooms/${roomCode}`), {
      host: remainingIds[0],
    });
  }
}

/**
 * Toggle ready state for a player.
 */
export async function setReady(roomCode, playerId, ready) {
  await update(ref(db, `v3rooms/${roomCode}/players/${playerId}`), {
    ready,
    lastSeen: serverTimestamp(),
  });
}

/**
 * Update room settings (host only in practice, but not enforced here).
 */
export async function updateSettings(roomCode, settings) {
  await update(ref(db, `v3rooms/${roomCode}/settings`), settings);
}

/**
 * Set room status (lobby → drafting → playing → finished).
 */
export async function setRoomStatus(roomCode, status) {
  await update(ref(db, `v3rooms/${roomCode}`), { status });
}

// --- Real-time subscriptions ---

/**
 * Subscribe to full room state changes.
 * @param {string} roomCode
 * @param {function} callback - Called with room data on each change
 * @returns {function} unsubscribe function
 */
export function onRoomUpdate(roomCode, callback) {
  const roomRef = ref(db, `v3rooms/${roomCode}`);
  // onValue returns an unsubscribe function in Firebase v9+ modular SDK
  return onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
}

/**
 * Subscribe to individual player action submissions (host listens).
 * Uses onChildAdded so each action fires exactly once — no re-processing
 * when other actions are cleared or added.
 * @param {function} callback - Called with (fbPlayerId, actionData) per action
 * @returns {function} unsubscribe function
 */
export function onPlayerAction(roomCode, callback) {
  const actionsRef = ref(db, `v3rooms/${roomCode}/actions`);
  // onChildAdded returns the unsubscribe function directly in Firebase v9+
  return onChildAdded(actionsRef, (snapshot) => {
    const fbPlayerId = snapshot.key;
    const action = snapshot.val();
    if (fbPlayerId && action) callback(fbPlayerId, action);
  });
}

// --- State writes (host only) ---

/**
 * Write an atomic game snapshot to Firebase.
 * Single path write — eliminates partial-state sync issues.
 */
export async function writeSnapshot(roomCode, snapshot) {
  await set(ref(db, `v3rooms/${roomCode}/snapshot`), snapshot);
}

/**
 * Subscribe to atomic game snapshot changes (guest listens).
 * @returns {function} unsubscribe function
 */
export function onSnapshotUpdate(roomCode, callback) {
  const snapRef = ref(db, `v3rooms/${roomCode}/snapshot`);
  return onValue(snapRef, (snapshot) => {
    callback(snapshot.val());
  });
}

/**
 * Clear a player's submitted action (host clears after processing).
 */
export async function clearPlayerAction(roomCode, playerId) {
  await remove(ref(db, `v3rooms/${roomCode}/actions/${playerId}`));
}

// --- Presence system ---

/**
 * Set up Firebase presence detection for a player.
 * When the client disconnects, marks them as disconnected.
 */
function setupPresence(roomCode, playerId) {
  const connectedRef = ref(db, '.info/connected');
  const playerRef = ref(db, `v3rooms/${roomCode}/players/${playerId}`);

  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      // On disconnect: mark player as not connected
      onDisconnect(playerRef).update({
        connected: false,
        lastSeen: serverTimestamp(),
      });

      // Mark as connected now
      update(playerRef, {
        connected: true,
        lastSeen: serverTimestamp(),
      });
    }
  });
}

/**
 * Rejoin a room after reconnection (update presence).
 */
export async function rejoinRoom(roomCode, playerId) {
  const playerRef = ref(db, `v3rooms/${roomCode}/players/${playerId}`);
  const snapshot = await get(playerRef);

  if (!snapshot.exists()) {
    throw new Error('Player not found in room');
  }

  await update(playerRef, {
    connected: true,
    lastSeen: serverTimestamp(),
  });

  setupPresence(roomCode, playerId);
}
