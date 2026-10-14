// Online play, host-authoritative, over any Transport (Firebase, memory, BroadcastChannel).
//
// Room layout (under v3rooms/<CODE>, the only path the deployed DB rules allow writes to):
//   game: 'v4'  code  hostId  status: 'lobby'|'playing'|'over'  seed  createdAt
//   build:        { schema, content, id }  // the rules content hash + build id that made the room (record.js);
//                                          // a client with other content can't join, rejoin or host it
//   notice:       { id, kind, seat, message, detail, at } // host-reported problem (a bot move threw), shown to all
//   seats/s<i>:   { kind: 'human'|'bot', name, id? }   // id = playerId for humans. Compacted to s0..sN-1 at start.
//   players/<id>: { name, connected, lastSeen }
//   state:        { stateJson, version, lastMove, recent, at } // engine state as a STRING (RTDB mangles arrays/nulls)
//   moves/<key>:  { by, seat, move:{player, option}, n, mid } // guests (and the host) push; host consumes
//   rejects/<playerId>/<key>: { mid, reason }                // host's answer to a refused move
// Codes are 5 characters, so they can't collide with v3's 4-character rooms.
import { isLegal, chooseBotMove } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import { parseTable } from '../tables.js';
import { createEmitter, randomId } from './emitter.js';
import { moveProblem, normalizeMove } from './local.js';
import { BUILD, CONTENT_HASH, newGame, step, trackState, botStep, reportProblem } from './record.js';

/** Shown when a room was made by a build with different rules content (a deploy happened in between). */
export const VERSION_MISMATCH = 'That room is on a different version of Cults. Refresh this page and try again; if it still won’t join, the host should refresh and make a new room.';
const sameBuild = room => !!(room && room.build && room.build.content === CONTENT_HASH);

export const ROOM_ROOT = 'v3rooms';
export const MAX_SEATS = 4;
export const MIN_SEATS = 2;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
const RECENT_KEEP = 24;

export const newRoomCode = () => randomId(5, CODE_CHARS);
export const newPlayerId = () => 'p' + randomId(11);
const roomPath = code => `${ROOM_ROOT}/${code}`;
const normCode = code => String(code || '').trim().toUpperCase();

/** Seats as a sorted list: [{ seat, kind, name, id? }]. */
export function seatList(room) {
  return Object.entries(room?.seats || {})
    .map(([k, v]) => ({ seat: Number(String(k).replace(/^s/, '')), kind: v?.kind || 'human', name: v?.name || '', ...(v?.id ? { id: v.id } : {}) }))
    .filter(s => Number.isInteger(s.seat))
    .sort((a, b) => a.seat - b.seat);
}

const isConnected = (room, s) => s.kind === 'bot' || room?.players?.[s.id]?.connected === true;

/**
 * @typedef {{ id: string, name: string, seat: number, connected: boolean, kind: 'human'|'bot' }} LobbyPlayer
 * @typedef {{ code: string, hostId: string|null, status: 'lobby'|'playing'|'over'|'closed', seed: number|null,
 *   players: LobbyPlayer[], seats: number, maxSeats: number, canStart: boolean,
 *   me: { playerId: string, seat: number|null }, isHost: boolean }} LobbyView
 */

function lobbyView(room, code, playerId) {
  if (!room) {
    return { code, hostId: null, status: 'closed', seed: null, players: [], seats: 0, maxSeats: MAX_SEATS, canStart: false, me: { playerId, seat: null }, isHost: false };
  }
  const list = seatList(room);
  const players = list.map(s => ({
    id: s.kind === 'bot' ? `bot:${s.seat}` : s.id, name: s.name, seat: s.seat, connected: isConnected(room, s), kind: s.kind,
  }));
  const mine = list.find(s => s.kind === 'human' && s.id === playerId);
  const isHost = room.hostId === playerId;
  return {
    code, hostId: room.hostId ?? null, status: room.status || 'lobby', seed: room.seed ?? null,
    table: parseTable(room.table) ? { mode: room.tableMode || 'custom', quadrants: parseTable(room.table) } : null,
    players, seats: players.length, maxSeats: MAX_SEATS,
    canStart: isHost && (room.status || 'lobby') === 'lobby' && players.length >= MIN_SEATS,
    me: { playerId, seat: mine ? mine.seat : null }, isHost,
  };
}

/** The room's table fields: `table` as "gold,red,blue,green" (RTDB keeps strings as-is), plus how it was picked. */
function roomTable(t) {
  const q = t && parseTable((t.quadrants || []).join(','));
  return q ? { table: q.join(','), tableMode: t.mode || 'custom' } : {};
}

// ---------------------------------------------------------------------------------------------
// Lobby entry points

/**
 * Create a room; the creator is host and takes seat 0.
 * @param {{ name: string, transport: import('./transport/tree.js').Transport, playerId?: string, seed?: number, botDelayMs?: number }} opts
 * @returns {Promise<{ code: string, playerId: string, lobby: Lobby }>}
 */
export async function createRoom({ name, transport, playerId = newPlayerId(), seed, table = null, botDelayMs = 450 }) {
  if (!transport) throw new Error('createRoom needs a transport.');
  await transport.ready;
  const now = Date.now();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = newRoomCode();
    const room = {
      game: 'v4', code, hostId: playerId, status: 'lobby', createdAt: now, build: { ...BUILD },
      seed: Number.isFinite(seed) ? seed >>> 0 : Math.floor(Math.random() * 2 ** 31),
      seats: { s0: { kind: 'human', name: name || 'Host', id: playerId } },
      ...roomTable(table),
      players: { [playerId]: { name: name || 'Host', connected: true, lastSeen: now } },
    };
    // Creates only if the code is free. (A cold-cache null pass returns the room; RTDB retries with the real value.)
    const res = await transport.transaction(roomPath(code), cur => (cur === null || cur === undefined ? room : undefined));
    if (res.committed && res.value?.hostId === playerId && res.value?.createdAt === now) {
      const lobby = openLobby({ transport, code, playerId, botDelayMs });
      await lobby.ready;
      return { code, playerId, lobby };
    }
  }
  throw new Error('Could not find a free room code. Try again.');
}

/**
 * Join a room by code. Pass a stored playerId to reclaim your seat after a reload or drop.
 * @param {{ code: string, name?: string, transport: import('./transport/tree.js').Transport, playerId?: string, botDelayMs?: number }} opts
 * @returns {Promise<{ code: string, playerId: string, lobby: Lobby, rejoined: boolean }>}
 */
export async function joinRoom({ code, name, transport, playerId, botDelayMs = 450 }) {
  if (!transport) throw new Error('joinRoom needs a transport.');
  await transport.ready;
  code = normCode(code);
  const room = await transport.get(roomPath(code));
  if (!room) throw new Error('Room not found.');
  if (room.game !== 'v4') throw new Error('That code belongs to an old (v3) game.');
  // Mixed builds would apply different rules to one state (or crash on an unknown card): refuse, rejoins included.
  if (!sameBuild(room)) throw new Error(VERSION_MISMATCH);

  // Reconnect: same playerId, still seated.
  if (playerId && seatList(room).some(s => s.kind === 'human' && s.id === playerId)) {
    await transport.update(`${roomPath(code)}/players/${playerId}`, {
      connected: true, lastSeen: transport.serverTime(), ...(name ? { name } : {}),
    });
    const lobby = openLobby({ transport, code, playerId, botDelayMs });
    await lobby.ready;
    return { code, playerId, lobby, rejoined: true };
  }
  if ((room.status || 'lobby') !== 'lobby') throw new Error('That game has already started.');

  const id = playerId || newPlayerId();
  const nick = name || 'Player';
  let why = 'Room is full.';
  const res = await transport.transaction(roomPath(code), r => {
    if (r === null || r === undefined) return null; // cold cache: RTDB retries with the real value
    if ((r.status || 'lobby') !== 'lobby') { why = 'That game has already started.'; return undefined; }
    const list = seatList(r);
    if (list.some(s => s.id === id)) return r;
    const used = new Set(list.map(s => s.seat));
    let seat = 0;
    while (used.has(seat)) seat++;
    if (seat >= MAX_SEATS) { why = 'Room is full.'; return undefined; }
    return {
      ...r,
      seats: { ...(r.seats || {}), [`s${seat}`]: { kind: 'human', name: nick, id } },
      players: { ...(r.players || {}), [id]: { name: nick, connected: true, lastSeen: Date.now() } },
    };
  });
  if (!res.committed || !res.value) throw new Error(res.value ? why : 'Room not found.');
  if (!seatList(res.value).some(s => s.id === id)) throw new Error(why);
  const lobby = openLobby({ transport, code, playerId: id, botDelayMs });
  await lobby.ready;
  return { code, playerId: id, lobby, rejoined: false };
}

/** Reclaim a seat with a stored playerId. Same as joinRoom with playerId, but fails rather than taking a new seat. */
export async function rejoinRoom({ code, playerId, transport, botDelayMs = 450 }) {
  await transport.ready;
  const room = await transport.get(roomPath(normCode(code)));
  if (!room || room.game !== 'v4') throw new Error('Room not found.');
  if (!seatList(room).some(s => s.kind === 'human' && s.id === playerId)) throw new Error('You are no longer seated in that room.');
  return joinRoom({ code, playerId, transport, botDelayMs });
}

// ---------------------------------------------------------------------------------------------
// Lobby: watches the room, runs presence, host election, and (when host) the host loop.

/**
 * @typedef {{
 *   code: string, playerId: string, transport: any, ready: Promise<void>,
 *   getView(): LobbyView,
 *   subscribe(fn: (view: LobbyView) => void): () => void,
 *   addBot(name?: string): Promise<number>,
 *   removeSeat(seat: number): Promise<void>,
 *   setSeed(seed: number): Promise<void>,
 *   setTable(table: { mode: string, quadrants: string[] }): Promise<void>,
 *   start(): Promise<void>,
 *   leave(): Promise<void>,
 *   onStart(cb: (session: any) => void): () => void,
 *   readonly session: any,
 *   destroy(): void,
 * }} Lobby
 */

function openLobby({ transport, code, playerId, botDelayMs }) {
  const base = roomPath(code);
  const myConnPath = `${base}/players/${playerId}/connected`;
  let room = null;
  let gotFirst = false;
  let destroyed = false;
  let electing = false;
  let session = null;
  let host = null;
  const views = createEmitter();
  const starts = createEmitter();
  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });

  transport.onDisconnectSet(myConnPath, false).catch(() => {});
  const offConn = transport.onConnectedChange?.(up => {
    if (up && !destroyed && room && seatList(room).some(s => s.id === playerId)) {
      transport.update(`${base}/players/${playerId}`, { connected: true, lastSeen: transport.serverTime() }).catch(() => {});
    }
  }) || (() => {});

  const offRoom = transport.subscribe(base, value => {
    if (destroyed) return;
    room = value && value.game === 'v4' ? value : null;
    onRoom();
    if (!gotFirst) { gotFirst = true; resolveReady(); }
  });

  function onRoom() {
    const status = room?.status;
    if ((status === 'playing' || status === 'over') && room.state && !session) {
      session = createOnlineSession({ transport, base, code, playerId, getRoom: () => room, lobby: api });
      starts.emit(session);
    }
    // never host a room made by other rules content (joinRoom already refuses; this is the backstop)
    const shouldHost = !!room && room.hostId === playerId && (status === 'playing' || status === 'over') && sameBuild(room);
    if (shouldHost && !host) host = startHost({ transport, base, getRoom: () => room, botDelayMs });
    if (!shouldHost && host) { host.stop(); host = null; }
    host?.roomChanged();
    session?.roomChanged();
    views.emit(lobbyView(room, code, playerId));
    elect();
  }

  // If the host has dropped, the lowest-seat connected human claims the role.
  function elect() {
    if (!room || electing || destroyed) return;
    const old = room.hostId;
    if (old && room.players?.[old]?.connected === true) return;
    if (room.players?.[playerId]?.connected !== true) return;
    const first = seatList(room).find(s => s.kind === 'human' && room.players?.[s.id]?.connected === true);
    if (!first || first.id !== playerId) return;
    electing = true;
    transport.transaction(`${base}/hostId`, cur => {
      if (cur === null || cur === undefined) return old ? null : playerId; // null pass: RTDB retries with the real value
      return cur === old ? playerId : undefined;
    }).catch(() => {}).finally(() => { electing = false; });
  }

  async function hostOnly(what) {
    await ready;
    if (!room) throw new Error('The room is gone.');
    if (room.hostId !== playerId) throw new Error(`Only the host can ${what}.`);
    if ((room.status || 'lobby') !== 'lobby') throw new Error('The game has already started.');
  }

  const api = {
    code, playerId, transport, ready,
    getView: () => lobbyView(room, code, playerId),
    subscribe(fn) {
      const off = views.on(fn);
      if (gotFirst) fn(lobbyView(room, code, playerId));
      return off;
    },
    async addBot(name) {
      await hostOnly('add bots');
      let seat = -1;
      const res = await transport.transaction(`${base}/seats`, seats => {
        if (seats === null || seats === undefined) return null;
        const used = new Set(seatList({ seats }).map(s => s.seat));
        seat = 0;
        while (used.has(seat)) seat++;
        if (seat >= MAX_SEATS) return undefined;
        return { ...seats, [`s${seat}`]: { kind: 'bot', name: name || `Bot ${seat + 1}` } };
      });
      if (!res.committed || !res.value) throw new Error('The table is full.');
      return seat;
    },
    async removeSeat(seat) {
      await hostOnly('remove seats');
      const s = seatList(room).find(x => x.seat === seat);
      if (!s) return;
      if (s.id === playerId) throw new Error("The host can't remove their own seat.");
      const patch = { [`seats/s${seat}`]: null };
      if (s.id) patch[`players/${s.id}`] = null;
      await transport.update(base, patch);
    },
    async setSeed(seed) {
      await hostOnly('set the seed');
      await transport.update(base, { seed: Number(seed) >>> 0 });
    },
    /** Host: which 4 spheres the game uses ({ mode, quadrants }). Guests see it in the lobby view. */
    async setTable(table) {
      await hostOnly('pick the table');
      const t = roomTable(table);
      if (!t.table) throw new Error('That table can’t be played.');
      await transport.update(base, t);
    },
    async start() {
      await hostOnly('start');
      const res = await transport.transaction(base, r => {
        if (r === null || r === undefined) return null;
        if ((r.status || 'lobby') !== 'lobby' || r.hostId !== playerId) return undefined;
        const list = seatList(r);
        if (list.length < MIN_SEATS || list.length > MAX_SEATS) return undefined;
        const seats = {};
        list.forEach((s, i) => { seats[`s${i}`] = { kind: s.kind, name: s.name, ...(s.id ? { id: s.id } : {}) }; });
        const seed = Number.isFinite(r.seed) ? r.seed : Math.floor(Math.random() * 2 ** 31);
        const quadrants = parseTable(r.table);
        const game = newGame({ seats: list.map(s => ({ name: s.name, kind: s.kind })), seed, ...(quadrants ? { quadrants } : {}) });
        return {
          ...r, seats, seed, status: 'playing', startedAt: Date.now(), build: { ...BUILD },
          state: { stateJson: JSON.stringify(game), version: 1, lastMove: null, recent: '', at: Date.now() },
          moves: null, rejects: null,
        };
      });
      if (!res.committed || res.value?.status !== 'playing') throw new Error(`Need ${MIN_SEATS} to ${MAX_SEATS} seats to start.`);
    },
    async leave() {
      await ready;
      if (room && (room.status || 'lobby') === 'lobby') {
        await transport.cancelDisconnect?.(myConnPath).catch(() => {});
        await transport.transaction(base, r => {
          if (r === null || r === undefined) return null;
          const list = seatList(r).filter(s => s.id !== playerId);
          const humans = list.filter(s => s.kind === 'human');
          if (!humans.length) return null; // last human out closes the room
          const seats = {};
          for (const s of list) seats[`s${s.seat}`] = { kind: s.kind, name: s.name, ...(s.id ? { id: s.id } : {}) };
          const players = { ...(r.players || {}) };
          delete players[playerId];
          const hostId = r.hostId === playerId ? humans[0].id : r.hostId;
          return { ...r, seats, players, hostId };
        }).catch(() => {});
      } else if (room) {
        await transport.update(`${base}/players/${playerId}`, { connected: false, lastSeen: transport.serverTime() }).catch(() => {});
      }
      api.destroy();
    },
    onStart(cb) {
      const off = starts.on(cb);
      if (session) cb(session);
      return off;
    },
    get session() { return session; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      offRoom();
      offConn();
      host?.stop();
      host = null;
      session?._teardown();
      views.clear();
      starts.clear();
    },
  };
  return api;
}

// ---------------------------------------------------------------------------------------------
// Online session: the same contract as the local one. Guests never run the rules; they show the
// host's snapshots and push moves.

function createOnlineSession({ transport, base, code, playerId, getRoom, lobby }) {
  let state = null;
  let version = 0;
  let destroyed = false;
  const subs = createEmitter();
  const waiting = new Map(); // mid -> { resolve, reject }
  const inflight = new Map(); // signature -> promise (same move twice = one submission)
  let seenNotice = getRoom()?.notice?.id ?? null; // a notice from before this session (a rejoin) isn't news

  const mySeats = () => seatList(getRoom()).filter(s => s.kind === 'human' && s.id === playerId).map(s => s.seat);
  const info = () => {
    const room = getRoom();
    return {
      mode: 'online', roomCode: code, isHost: room?.hostId === playerId, playerId,
      seats: seatList(room).map(s => ({ name: s.name, kind: s.kind, connected: isConnected(room, s) })),
      version,
    };
  };

  const offState = transport.subscribe(`${base}/state`, node => {
    if (destroyed || !node || typeof node.version !== 'number' || typeof node.stateJson !== 'string') return;
    if (state && node.version <= version) return; // out-of-order or repeated snapshot
    let next;
    try { next = JSON.parse(node.stateJson); } catch { return; }
    state = next;
    version = node.version;
    trackState(state);
    const done = new Set(String(node.recent || '').split(',').filter(Boolean));
    if (node.lastMove?.mid) done.add(node.lastMove.mid);
    for (const [mid, w] of [...waiting]) if (done.has(mid)) { waiting.delete(mid); w.resolve(state); }
    subs.emit(state, info());
  });

  const rejectsPath = `${base}/rejects/${playerId}`;
  const offRejects = transport.onChildAdded(rejectsPath, (key, val) => {
    const w = val?.mid && waiting.get(val.mid);
    if (w) { waiting.delete(val.mid); w.reject(new Error(val.reason || 'Move refused.')); }
    transport.remove(`${rejectsPath}/${key}`).catch(() => {});
  });

  function submit(raw, { skipLocalCheck = false } = {}) {
    if (destroyed) return Promise.reject(new Error('Session closed.'));
    const move = normalizeMove(state, raw);
    if (!skipLocalCheck) {
      const problem = moveProblem(state, move, mySeats());
      if (problem) return Promise.reject(new Error(problem));
    } else if (!state) return Promise.reject(new Error('The game has not started.'));
    const sig = `${move.player}|${move.option}|${version}`;
    if (inflight.has(sig)) return inflight.get(sig);
    const mid = randomId(12);
    const p = new Promise((resolve, reject) => { waiting.set(mid, { resolve, reject }); });
    inflight.set(sig, p);
    const clear = () => inflight.delete(sig);
    p.then(clear, clear);
    transport.push(`${base}/moves`, { by: playerId, seat: move.player, move, n: version, mid, at: transport.serverTime() })
      .catch(err => {
        const w = waiting.get(mid);
        if (w) { waiting.delete(mid); w.reject(new Error(`Couldn't send the move: ${err?.message || err}`)); }
      });
    return p;
  }

  return {
    getState: () => state,
    subscribe(fn) {
      const off = subs.on(fn);
      if (state) fn(state, info());
      return off;
    },
    submit,
    get mySeats() { return mySeats(); },
    get info() { return info(); },
    get lobby() { return lobby; },
    /** Tears down the whole online connection (lobby, host loop, listeners). */
    destroy() { lobby.destroy(); },
    roomChanged() {
      const n = !destroyed && getRoom()?.notice;
      if (n && n.id && n.id !== seenNotice) { seenNotice = n.id; reportProblem({ kind: n.kind, seat: n.seat, message: n.message, detail: n.detail }); }
      if (state && !destroyed) subs.emit(state, info());
    },
    _teardown() {
      if (destroyed) return;
      destroyed = true;
      offState();
      offRejects();
      for (const w of waiting.values()) w.reject(new Error('Session closed.'));
      waiting.clear();
      subs.clear();
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Host loop: validate and apply moves, publish versioned snapshots, run bot seats.

function startHost({ transport, base, getRoom, botDelayMs }) {
  let cur = null;
  let ver = 0;
  let recent = [];
  let stopped = false;
  let botTimer = null;
  let chain = Promise.resolve();
  const enqueue = fn => {
    chain = chain.then(() => (stopped ? undefined : fn())).catch(err => {
      console.error('[v4 host]', err);
      reportProblem({ kind: 'host', message: 'The host hit a problem running the game.', detail: String(err?.message || err) });
    });
  };
  // Problems the whole table should see go on the room (every client's session reports them); local if that fails.
  const notify = p => transport.set(`${base}/notice`, { id: randomId(8), kind: p.kind, seat: p.seat ?? -1, message: p.message, detail: p.detail || '', at: Date.now() })
    .catch(() => reportProblem(p));

  function adopt(node) {
    if (!node || typeof node.version !== 'number' || (cur && node.version <= ver)) return false;
    try { cur = JSON.parse(node.stateJson); } catch { return false; }
    ver = node.version;
    recent = String(node.recent || '').split(',').filter(Boolean);
    return true;
  }

  enqueue(async () => { adopt(await transport.get(`${base}/state`)); scheduleBot(); });
  const offMoves = transport.onChildAdded(`${base}/moves`, (key, rec) => enqueue(() => handle(key, rec, 0)));
  const offState = transport.subscribe(`${base}/state`, node => { if (!stopped && adopt(node)) scheduleBot(); });

  async function commit(next, lastMove) {
    const V = ver;
    const nextRecent = [...recent, lastMove.mid].slice(-RECENT_KEEP);
    const node = { stateJson: JSON.stringify(next), version: V + 1, lastMove, recent: nextRecent.join(','), at: Date.now() };
    let res;
    try {
      res = await transport.transaction(`${base}/state`, c => {
        if (c === null || c === undefined) return null; // cold-cache pass; RTDB retries with the real node
        return c.version === V ? node : undefined;
      });
    } catch { return false; }
    if (res.committed && res.value?.version === V + 1 && res.value?.lastMove?.mid === lastMove.mid) {
      if (ver === V) { cur = next; ver = V + 1; recent = nextRecent; }
      if (next.over && getRoom()?.status !== 'over') transport.update(base, { status: 'over' }).catch(() => {});
      scheduleBot();
      return true;
    }
    if (res.value) adopt(res.value);
    return false;
  }

  const drop = key => transport.remove(`${base}/moves/${key}`).catch(() => {});

  async function refuse(key, rec, reason) {
    if (rec?.by && rec.by !== 'bot') {
      await transport.set(`${base}/rejects/${rec.by}/${key}`, { mid: rec.mid || '', reason }).catch(() => {});
    }
    await drop(key);
  }

  async function handle(key, rec, attempt) {
    if (stopped) return;
    if (!rec || !rec.move || !cur) return drop(key);
    if (rec.mid && recent.includes(rec.mid)) return drop(key); // already applied (duplicate delivery)
    const seat = getRoom()?.seats?.[`s${rec.seat}`];
    const move = { player: rec.move.player, option: rec.move.option };
    let reason = null;
    if (!seat || seat.kind !== 'human' || seat.id !== rec.by) reason = "That seat isn't yours.";
    else if (move.player !== rec.seat) reason = 'Move is for a different seat.';
    else if (cur.over) reason = 'The game is over.';
    else if (rec.n !== ver) reason = 'Stale move: the game had moved on.';
    else if (!cur.pending || cur.pending.player !== move.player) reason = 'Not your turn.';
    else if (!isLegal(cur, move)) reason = `Illegal move: ${move.option}`;
    if (reason) return refuse(key, rec, reason);

    let next;
    try { next = step(cur, move); } catch (err) { return refuse(key, rec, err.message || 'Illegal move.'); }
    if (await commit(next, { mid: rec.mid || key, seat: rec.seat, option: move.option, by: rec.by })) return drop(key);
    if (!stopped && attempt < 2) return handle(key, rec, attempt + 1); // someone else wrote; re-check against fresh state
  }

  function scheduleBot() {
    clearTimeout(botTimer);
    botTimer = null;
    if (stopped || !cur || cur.over || !cur.pending) return;
    const seat = cur.pending.player;
    if (getRoom()?.seats?.[`s${seat}`]?.kind !== 'bot') return;
    const V = ver;
    botTimer = setTimeout(() => {
      botTimer = null; // fired: a stale id here would stop roomChanged() from ever rescheduling
      enqueue(async () => {
        if (stopped || ver !== V || !cur.pending || cur.pending.player !== seat) return;
        const rand = seededRandom(((cur.seed ?? 1) ^ Math.imul(V, 2654435761)) >>> 0);
        // a bot move that throws is logged and replaced by the first option that applies cleanly; the table is told
        const r = botStep(cur, st => chooseBotMove(st, rand), { tag: 'v4 host', seat, report: notify });
        if (!r.state) return; // no option applies at all: the 'stuck' notice says the game can't continue
        const ok = await commit(r.state, { mid: `bot-${V}`, seat, option: r.move.option, by: 'bot' });
        if (!ok && !stopped && ver === V) setTimeout(scheduleBot, Math.max(50, botDelayMs)); // e.g. offline: try again
      });
    }, botDelayMs);
  }

  return {
    roomChanged() { if (!botTimer) scheduleBot(); },
    stop() {
      stopped = true;
      clearTimeout(botTimer);
      offMoves();
      offState();
    },
  };
}
