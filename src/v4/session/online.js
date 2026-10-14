// Online play, host-authoritative, over any Transport (Firebase, memory, BroadcastChannel).
//
// Room layout (under v3rooms/<CODE>, the only path the deployed DB rules allow writes to):
//   game: 'v4'  code  hostId  status: 'lobby'|'playing'|'over'  seed  createdAt
//   build:        { schema, content, id }  // the rules content hash + build id that made the room (record.js);
//                                          // a client with other content can't join, rejoin or host it
//   notice:       { id, kind, seat, message, detail, at } // host-reported problem (a bot move threw), shown to all
//   seats/s<i>:   { kind: 'human'|'bot', name, id?, sub? } // id = playerId for humans. Compacted to s0..sN-1 at start.
//                 sub: 'bot' = the player left and the host let a bot play for them; cleared the moment they're back
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
/** How long a player has to be gone before the host is offered "let a bot play for them". */
export const SUB_AFTER_MS = 15000;
// Test hooks on the page URL (?subAfter=ms), like ?botDelay: e2e can't wait 15 s per scenario.
const urlNumber = key => { try { return Number(new URLSearchParams(globalThis.location?.search || '').get(key)) || 0; } catch { return 0; } };
const defaultSubAfter = () => urlNumber('subAfter') || SUB_AFTER_MS;
const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
// A player's emoji (display only): kept short, so a pasted paragraph can't ride along in every snapshot.
const cleanEmoji = e => (typeof e === 'string' ? e.trim().slice(0, 16) : '');
const withEmoji = e => (cleanEmoji(e) ? { emoji: cleanEmoji(e) } : {});

export const newRoomCode = () => randomId(5, CODE_CHARS);
export const newPlayerId = () => 'p' + randomId(11);
const roomPath = code => `${ROOM_ROOT}/${code}`;
const normCode = code => String(code || '').trim().toUpperCase();

/** Seats as a sorted list: [{ seat, kind, name, id?, emoji?, sub? }]. */
export function seatList(room) {
  return Object.entries(room?.seats || {})
    .map(([k, v]) => ({ seat: Number(String(k).replace(/^s/, '')), kind: v?.kind || 'human', name: v?.name || '', ...(v?.id ? { id: v.id } : {}), ...withEmoji(v?.emoji), ...(v?.sub ? { sub: v.sub } : {}) }))
    .filter(s => Number.isInteger(s.seat))
    .sort((a, b) => a.seat - b.seat);
}

const isConnected = (room, s) => s.kind === 'bot' || room?.players?.[s.id]?.connected === true;

/**
 * @typedef {{ id: string, name: string, seat: number, connected: boolean, kind: 'human'|'bot',
 *   host: boolean, away: boolean, awayMs: number, sub: boolean, canSub: boolean }} LobbyPlayer
 *   away: a person who isn't connected; sub: a bot is playing for them until they're back;
 *   canSub: (host's view) gone long enough that the host may let a bot play for them.
 * @typedef {{ code: string, hostId: string|null, hostName: string, status: 'lobby'|'playing'|'over'|'closed', seed: number|null,
 *   players: LobbyPlayer[], seats: number, maxSeats: number, canStart: boolean, startHint: string,
 *   me: { playerId: string, seat: number|null }, isHost: boolean, subAfterMs: number, selfOnline?: boolean }} LobbyView
 *   selfOnline: this client's own connection is up (Lobby.getView adds it).
 */

function lobbyView(room, code, playerId, { awaySince = new Map(), subAfterMs = SUB_AFTER_MS, now = Date.now() } = {}) {
  if (!room) {
    return { code, hostId: null, hostName: '', status: 'closed', seed: null, players: [], seats: 0, maxSeats: MAX_SEATS, canStart: false, startHint: 'This room is closed.', me: { playerId, seat: null }, isHost: false, subAfterMs };
  }
  const list = seatList(room);
  const status = room.status || 'lobby';
  const isHost = room.hostId === playerId;
  const players = list.map(s => {
    const connected = isConnected(room, s);
    const away = s.kind === 'human' && !connected;
    const awayMs = away && awaySince.has(s.id) ? Math.max(0, now - awaySince.get(s.id)) : 0;
    const sub = s.kind === 'human' && s.sub === 'bot';
    return {
      id: s.kind === 'bot' ? `bot:${s.seat}` : s.id, name: s.name, ...withEmoji(s.emoji), seat: s.seat, connected, kind: s.kind,
      host: s.kind === 'human' && s.id === room.hostId, away, awayMs, sub,
      canSub: isHost && status === 'playing' && away && !sub && s.id !== playerId && awayMs >= subAfterMs,
    };
  });
  const mine = list.find(s => s.kind === 'human' && s.id === playerId);
  const startHint = status !== 'lobby' ? 'The game has started.'
    : players.length < MIN_SEATS ? `Need at least ${MIN_SEATS} players: invite a friend or add a bot.`
      : players.some(p => p.away) ? `Waiting for ${players.filter(p => p.away).map(p => p.name).join(' and ')} to reconnect (or remove them).`
        : '';
  return {
    code, hostId: room.hostId ?? null, hostName: list.find(s => s.id === room.hostId)?.name || '', status, seed: room.seed ?? null,
    table: parseTable(room.table) ? { mode: room.tableMode || 'custom', quadrants: parseTable(room.table) } : null,
    players, seats: players.length, maxSeats: MAX_SEATS,
    canStart: isHost && status === 'lobby' && players.length >= MIN_SEATS, startHint,
    me: { playerId, seat: mine ? mine.seat : null }, isHost, subAfterMs,
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
 * @param {{ name: string, transport: import('./transport/tree.js').Transport, playerId?: string, seed?: number, botDelayMs?: number, subAfterMs?: number }} opts
 * @returns {Promise<{ code: string, playerId: string, lobby: Lobby }>}
 */
export async function createRoom({ name, emoji, transport, playerId = newPlayerId(), seed, table = null, botDelayMs = 450, subAfterMs }) {
  if (!transport) throw new Error('createRoom needs a transport.');
  await transport.ready;
  const now = Date.now();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = newRoomCode();
    const room = {
      game: 'v4', code, hostId: playerId, status: 'lobby', createdAt: now, build: { ...BUILD },
      seed: Number.isFinite(seed) ? seed >>> 0 : Math.floor(Math.random() * 2 ** 31),
      seats: { s0: { kind: 'human', name: name || 'Host', id: playerId, ...withEmoji(emoji) } },
      ...roomTable(table),
      players: { [playerId]: { name: name || 'Host', connected: true, lastSeen: now } },
    };
    // Creates only if the code is free. (A cold-cache null pass returns the room; RTDB retries with the real value.)
    const res = await transport.transaction(roomPath(code), cur => (cur === null || cur === undefined ? room : undefined));
    if (res.committed && res.value?.hostId === playerId && res.value?.createdAt === now) {
      const lobby = openLobby({ transport, code, playerId, botDelayMs, subAfterMs });
      await lobby.ready;
      return { code, playerId, lobby };
    }
  }
  throw new Error('Could not find a free room code. Try again.');
}

/**
 * Join a room by code, or take your seat back. Who you are, in this order:
 * 1. `playerId`: this tab's own seat (a reload).
 * 2. `knownIds`: ids this device held in the room before (a closed tab, reopened from the invite link). The first one
 *    whose player isn't connected; once the game has started, also the only one this device held even if it still
 *    looks connected (a phone killed mid-game can take the server a minute to notice).
 * 3. Once the game has started: a seat whose player has left, with your name; or the one seat a bot is playing for
 *    someone who left. Taking it back clears the bot.
 * Otherwise a new seat, in the lobby only. `onlyRejoin`: never take a new or someone else's seat (an invite link
 * reopened on a device that was in the room tries this first, and falls back to the join form).
 * @param {{ code: string, name?: string, transport: import('./transport/tree.js').Transport, playerId?: string,
 *   knownIds?: string[], onlyRejoin?: boolean, botDelayMs?: number, subAfterMs?: number }} opts
 * @returns {Promise<{ code: string, playerId: string, lobby: Lobby, rejoined: boolean, tookSeat?: string }>}
 */
export async function joinRoom({ code, name, emoji, transport, playerId, knownIds = [], onlyRejoin = false, botDelayMs = 450, subAfterMs }) {
  if (!transport) throw new Error('joinRoom needs a transport.');
  await transport.ready;
  code = normCode(code);
  const room = await transport.get(roomPath(code));
  if (!room) throw new Error('Room not found.');
  if (room.game !== 'v4') throw new Error('That code belongs to an old (v3) game.');
  // Mixed builds would apply different rules to one state (or crash on an unknown card): refuse, rejoins included.
  if (!sameBuild(room)) throw new Error(VERSION_MISMATCH);

  const status = room.status || 'lobby';
  const humans = seatList(room).filter(s => s.kind === 'human' && s.id);
  const gone = s => room.players?.[s.id]?.connected !== true;
  const known = humans.filter(s => (knownIds || []).includes(s.id));
  let back = (playerId && humans.find(s => s.id === playerId)) || known.find(gone)
    || (status !== 'lobby' && known.length === 1 ? known[0] : null);
  let tookSeat = null;
  if (!back && onlyRejoin) throw new Error('You are no longer seated in that room.');
  if (!back && status !== 'lobby') {
    const left = humans.filter(gone);
    const subbed = left.filter(s => s.sub === 'bot');
    back = left.find(s => name && sameName(s.name, name)) || (subbed.length === 1 ? subbed[0] : null);
    if (back) tookSeat = back.name;
    else if (left.length) {
      const names = left.map(s => s.name).join(' or ');
      throw Object.assign(new Error(`That game has started. To take the seat of a player who left, join with their name: ${names}.`), { openSeats: left.map(s => ({ seat: s.seat, name: s.name })) });
    } else throw new Error('That game has already started and every seat is taken. If it was your seat, wait a moment and try again.');
  }

  // Reconnect: mark this player here, and take the seat back from a bot playing for them.
  if (back) {
    const patch = { [`players/${back.id}/connected`]: true, [`players/${back.id}/lastSeen`]: transport.serverTime() };
    if (name && !tookSeat) patch[`players/${back.id}/name`] = name;
    for (const s of humans) if (s.id === back.id && s.sub) patch[`seats/s${s.seat}/sub`] = null;
    await transport.update(roomPath(code), patch);
    const lobby = openLobby({ transport, code, playerId: back.id, botDelayMs, subAfterMs });
    await lobby.ready;
    return { code, playerId: back.id, lobby, rejoined: true, ...(tookSeat ? { tookSeat } : {}) };
  }

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
      seats: { ...(r.seats || {}), [`s${seat}`]: { kind: 'human', name: nick, id, ...withEmoji(emoji) } },
      players: { ...(r.players || {}), [id]: { name: nick, connected: true, lastSeen: Date.now() } },
    };
  });
  if (!res.committed || !res.value) throw new Error(res.value ? why : 'Room not found.');
  if (!seatList(res.value).some(s => s.id === id)) throw new Error(why);
  const lobby = openLobby({ transport, code, playerId: id, botDelayMs, subAfterMs });
  await lobby.ready;
  return { code, playerId: id, lobby, rejoined: false };
}

/** Reclaim a seat with a stored playerId. Same as joinRoom with playerId, but fails rather than taking a new seat. */
export async function rejoinRoom({ code, playerId, transport, botDelayMs = 450, subAfterMs }) {
  await transport.ready;
  const room = await transport.get(roomPath(normCode(code)));
  if (!room || room.game !== 'v4') throw new Error('Room not found.');
  if (!seatList(room).some(s => s.kind === 'human' && s.id === playerId)) throw new Error('You are no longer seated in that room.');
  return joinRoom({ code, playerId, transport, botDelayMs, subAfterMs });
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

function openLobby({ transport, code, playerId, botDelayMs, subAfterMs = defaultSubAfter() }) {
  const base = roomPath(code);
  const myConnPath = `${base}/players/${playerId}/connected`;
  let room = null;
  let gotFirst = false;
  let destroyed = false;
  let electing = false;
  let session = null;
  let host = null;
  let up = false; // this client's own connection
  let leaving = false;
  let healedAt = 0;
  const awaySince = new Map(); // playerId -> when this client first saw them gone (local clock)
  let awayTimer = null;
  const views = createEmitter();
  const starts = createEmitter();
  let resolveReady;
  const ready = new Promise(r => { resolveReady = r; });
  const view = () => ({ ...lobbyView(room, code, playerId, { awaySince, subAfterMs }), selfOnline: up });

  transport.onDisconnectSet(myConnPath, false).catch(() => {});
  const offConn = transport.onConnectedChange?.(u => {
    const was = up;
    up = !!u;
    if (up) imHere(true);
    if (was !== up && gotFirst && !destroyed) { views.emit(view()); session?.roomChanged(); }
  }) || (() => {});

  const offRoom = transport.subscribe(base, value => {
    if (destroyed) return;
    room = value && value.game === 'v4' ? value : null;
    onRoom();
    if (!gotFirst) { gotFirst = true; resolveReady(); }
  });

  const mySeatsIn = r => seatList(r).filter(s => s.kind === 'human' && s.id === playerId);

  // While this client is connected, the room should say so, and no bot should be playing its seat. Fixes the late
  // onDisconnect of an old tab or socket (a reload, a phone waking up) and takes the seat back from a bot on return.
  function imHere(force = false) {
    if (destroyed || leaving || !room || !up) return;
    const mine = mySeatsIn(room);
    if (!mine.length) return;
    const subbed = mine.filter(s => s.sub);
    if (!force && room.players?.[playerId]?.connected === true && !subbed.length) return;
    const now = Date.now();
    if (!force && now - healedAt < 1000) return; // one write per change; the room echo settles it
    healedAt = now;
    const patch = { [`players/${playerId}/connected`]: true, [`players/${playerId}/lastSeen`]: transport.serverTime() };
    for (const s of subbed) patch[`seats/s${s.seat}/sub`] = null;
    transport.update(base, patch).catch(() => {});
  }

  // Track who's gone (and since when) so the host can be offered a bot for them once they've been gone long enough.
  function trackAway() {
    const now = Date.now();
    const humans = room ? seatList(room).filter(s => s.kind === 'human' && s.id) : [];
    for (const id of [...awaySince.keys()]) if (!humans.some(s => s.id === id)) awaySince.delete(id);
    let next = Infinity;
    for (const s of humans) {
      if (room.players?.[s.id]?.connected === true) { awaySince.delete(s.id); continue; }
      if (!awaySince.has(s.id)) awaySince.set(s.id, now);
      const left = awaySince.get(s.id) + subAfterMs - now;
      if (left > 0) next = Math.min(next, left);
    }
    clearTimeout(awayTimer);
    awayTimer = null;
    // re-announce when someone crosses the line, so "let a bot play for them" appears without another room change
    if (next < Infinity && !destroyed) awayTimer = setTimeout(() => { awayTimer = null; if (!destroyed) { trackAway(); views.emit(view()); session?.roomChanged(); } }, next + 5);
  }

  function onRoom() {
    const status = room?.status;
    trackAway();
    if ((status === 'playing' || status === 'over') && room.state && !session) {
      session = createOnlineSession({ transport, base, code, playerId, getRoom: () => room, getView: view, lobby: api });
      starts.emit(session);
    }
    // never host a room made by other rules content (joinRoom already refuses; this is the backstop)
    const shouldHost = !!room && room.hostId === playerId && (status === 'playing' || status === 'over') && sameBuild(room);
    if (shouldHost && !host) host = startHost({ transport, base, getRoom: () => room, botDelayMs });
    if (!shouldHost && host) { host.stop(); host = null; }
    host?.roomChanged();
    session?.roomChanged();
    views.emit(view());
    imHere();
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
    getView: view,
    subscribe(fn) {
      const off = views.on(fn);
      if (gotFirst) fn(view());
      return off;
    },
    /**
     * Host, mid-game: a bot plays this seat until its player is back (they take it back just by rejoining).
     * Only for a person who isn't connected; the button shows once they've been gone `subAfterMs` (view.canSub).
     */
    async letBotPlay(seat) {
      await ready;
      if (!room) throw new Error('The room is gone.');
      if (room.hostId !== playerId) throw new Error('Only the host can hand a seat to a bot.');
      if ((room.status || 'lobby') !== 'playing') throw new Error('The game isn’t running.');
      const s = seatList(room).find(x => x.seat === seat);
      if (!s || s.kind !== 'human' || !s.id) throw new Error('That seat has no player to stand in for.');
      if (s.id === playerId) throw new Error('You can’t hand your own seat to a bot.');
      if (room.players?.[s.id]?.connected === true) throw new Error(`${s.name} is back.`);
      const res = await transport.transaction(`${base}/seats/s${seat}`, cur => {
        if (cur === null || cur === undefined) return null; // cold-cache pass
        if (cur.kind !== 'human' || cur.id !== s.id) return undefined;
        return { ...cur, sub: 'bot' };
      });
      if (!res.committed || res.value?.sub !== 'bot') throw new Error('Couldn’t hand that seat to a bot. Try again.');
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
        list.forEach((s, i) => { seats[`s${i}`] = { kind: s.kind, name: s.name, ...(s.id ? { id: s.id } : {}), ...withEmoji(s.emoji) }; });
        const seed = Number.isFinite(r.seed) ? r.seed : Math.floor(Math.random() * 2 ** 31);
        const quadrants = parseTable(r.table);
        const game = newGame({ seats: list.map(s => ({ name: s.name, kind: s.kind, ...withEmoji(s.emoji) })), seed, ...(quadrants ? { quadrants } : {}) });
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
          for (const s of list) seats[`s${s.seat}`] = { kind: s.kind, name: s.name, ...(s.id ? { id: s.id } : {}), ...withEmoji(s.emoji) };
          const players = { ...(r.players || {}) };
          delete players[playerId];
          const hostId = r.hostId === playerId ? humans[0].id : r.hostId;
          return { ...r, seats, players, hostId };
        }).catch(() => {});
      } else if (room) {
        // Leaving a running game gives the seat to a bot at once, so nobody waits; rejoining takes it back.
        leaving = true;
        const patch = { [`players/${playerId}/connected`]: false, [`players/${playerId}/lastSeen`]: transport.serverTime() };
        if (room.status === 'playing') for (const s of mySeatsIn(room)) patch[`seats/s${s.seat}/sub`] = 'bot';
        await transport.update(base, patch).catch(() => {});
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
      clearTimeout(awayTimer);
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

function createOnlineSession({ transport, base, code, playerId, getRoom, getView, lobby }) {
  let state = null;
  let version = 0;
  let destroyed = false;
  const subs = createEmitter();
  const waiting = new Map(); // mid -> { resolve, reject }
  const inflight = new Map(); // signature -> promise (same move twice = one submission)
  let seenNotice = getRoom()?.notice?.id ?? null; // a notice from before this session (a rejoin) isn't news

  const mySeats = () => seatList(getRoom()).filter(s => s.kind === 'human' && s.id === playerId).map(s => s.seat);
  // seats[i] lines up with state.players[i] (seats are compacted at start): who's here, who's gone, who a bot plays for
  const info = () => {
    const room = getRoom();
    const v = getView();
    return {
      mode: 'online', roomCode: code, isHost: room?.hostId === playerId, playerId,
      seats: v.players.map(p => ({ seat: p.seat, name: p.name, ...withEmoji(p.emoji), kind: p.kind, connected: p.connected, host: p.host, away: p.away, awayMs: p.awayMs, sub: p.sub, canSub: p.canSub, me: p.id === playerId })),
      subAfterMs: v.subAfterMs, selfOnline: v.selfOnline,
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
    /** Host: a bot plays this seat until its player is back (see lobby.letBotPlay). */
    letBotPlay: seat => lobby.letBotPlay(seat),
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

  // a bot seat, or a person's seat a bot is standing in for (sub) until they're back
  const botPlays = seat => { const s = getRoom()?.seats?.[`s${seat}`]; return s?.kind === 'bot' || (s?.kind === 'human' && s.sub === 'bot'); };

  function scheduleBot() {
    clearTimeout(botTimer);
    botTimer = null;
    if (stopped || !cur || cur.over || !cur.pending) return;
    const seat = cur.pending.player;
    if (!botPlays(seat)) return;
    const V = ver;
    botTimer = setTimeout(() => {
      botTimer = null; // fired: a stale id here would stop roomChanged() from ever rescheduling
      enqueue(async () => {
        if (stopped || ver !== V || !cur.pending || cur.pending.player !== seat || !botPlays(seat)) return;
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
