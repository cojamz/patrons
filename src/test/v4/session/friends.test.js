// Friends-proof online play: what happens when real people reload, close tabs, drop off, leave, or turn up late.
// Every scenario runs over the in-memory transport (fake timers, part of the gate) and, when V4_RTDB_EMULATOR is set
// (e.g. 127.0.0.1:9123, a Firebase RTDB emulator with database.rules.json loaded), over the real Firebase SDK too.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoom, joinRoom, createMemoryStore, createMemoryTransport, createFirebaseTransport, ROOM_ROOT } from '../../../v4/session/index.js';
import { getAt, splitPath } from '../../../v4/session/transport/tree.js';
import { until, untilFake, autoPlay, fingerprint } from './helpers.js';

const EMU = process.env.V4_RTDB_EMULATOR;

function memoryBackend() {
  const store = createMemoryStore();
  return {
    name: 'memory', fake: true,
    client: () => createMemoryTransport(store),
    peek: async path => getAt(store.data, splitPath(path)),
    wait: (cond, label) => untilFake(cond, { label, step: 20, maxSteps: 50000 }),
    pause: ms => vi.advanceTimersByTimeAsync(ms),
    end() {},
  };
}
function emulatorBackend() {
  const admin = createFirebaseTransport({ emulator: EMU });
  return {
    name: 'firebase emulator', fake: false,
    client: () => createFirebaseTransport({ emulator: EMU }),
    peek: path => admin.get(path),
    wait: (cond, label) => until(cond, { label, timeout: 60000 }),
    pause: ms => new Promise(r => setTimeout(r, ms)),
    end() { admin.close(); },
  };
}

const backends = [['memory', memoryBackend], ...(EMU ? [['firebase emulator', emulatorBackend]] : [])];
const started = lobby => new Promise(r => lobby.onStart(r));
const TIMEOUT = EMU ? 240000 : 60000;

for (const [label, make] of backends) {
  describe(`friends online (${label})`, () => {
    let be;
    const open = [];
    const setup = () => {
      be = make();
      if (be.fake) vi.useFakeTimers();
      return be;
    };
    afterEach(() => {
      for (const x of open.splice(0)) { try { x.lobby?.destroy(); x.t?.close(); } catch { /* already gone */ } }
      be?.end();
      vi.useRealTimers();
    });
    // host + guests, started; subAfterMs small so the takeover can be offered quickly
    async function table(names = ['G1', 'G2'], { bots = 0, seed = 21, subAfterMs = 400, start = true } = {}) {
      const ht = be.client();
      const host = await createRoom({ name: 'Hana', transport: ht, seed, botDelayMs: 0, subAfterMs });
      open.push({ t: ht, lobby: host.lobby });
      const guests = [];
      for (const name of names) {
        const t = be.client();
        const g = await joinRoom({ code: host.code, name, transport: t, botDelayMs: 0, subAfterMs });
        open.push({ t, lobby: g.lobby });
        guests.push({ t, name, ...g });
      }
      for (let i = 0; i < bots; i++) await host.lobby.addBot();
      await be.wait(() => host.lobby.getView().players.length === 1 + names.length + bots, 'everyone seated');
      if (!start) return { host: { t: ht, ...host }, guests };
      const all = [host, ...guests];
      const [hs, ...gss] = (await Promise.all([...all.map(x => started(x.lobby)), host.lobby.start()])).slice(0, all.length);
      guests.forEach((g, i) => { g.s = gss[i]; });
      await be.wait(() => [hs, ...gss].every(s => s.getState()), 'first state everywhere');
      return { host: { t: ht, s: hs, ...host }, guests };
    }
    const roomAt = code => be.peek(`${ROOM_ROOT}/${code}`);
    // a player "closes the tab": the socket drops (onDisconnect fires on the server) and nothing of theirs keeps running
    const closeTab = x => { x.lobby.destroy(); x.t.close(); };
    // a fresh tab on the same device / link: new connection, no session memory, only what the device remembers
    async function reopen(code, opts) {
      const t = be.client();
      const r = await joinRoom({ code, transport: t, botDelayMs: 0, subAfterMs: 400, ...opts });
      open.push({ t, lobby: r.lobby });
      return { t, ...r };
    }

    it('lobby view: code, host, who is connected, and why Start is waiting', async () => {
      setup();
      const ht = be.client();
      const host = await createRoom({ name: 'Hana', transport: ht, botDelayMs: 0 });
      open.push({ t: ht, lobby: host.lobby });
      let v = host.lobby.getView();
      expect(v).toMatchObject({ code: host.code, isHost: true, hostName: 'Hana', canStart: false, status: 'lobby' });
      expect(v.startHint).toMatch(/at least 2/);
      expect(v.players[0]).toMatchObject({ name: 'Hana', host: true, connected: true, away: false });
      const gt = be.client();
      const g = await joinRoom({ code: host.code, name: 'Gus', transport: gt, botDelayMs: 0 });
      open.push({ t: gt, lobby: g.lobby });
      await be.wait(() => host.lobby.getView().canStart, 'guest seated');
      expect(host.lobby.getView().startHint).toBe('');
      expect(g.lobby.getView()).toMatchObject({ isHost: false, hostName: 'Hana', canStart: false });
      closeTab({ t: gt, lobby: g.lobby });
      await be.wait(() => host.lobby.getView().players[1]?.away, 'guest shown as gone');
      v = host.lobby.getView();
      expect(v.players[1]).toMatchObject({ name: 'Gus', connected: false, away: true });
      expect(v.startHint).toMatch(/Waiting for Gus/);
    }, TIMEOUT);

    it('a guest who closed the tab mid-game gets the same seat back from the link (device memory), and the room shows them back', async () => {
      setup();
      const { host, guests } = await table();
      const g2 = guests[1];
      closeTab(g2);
      await be.wait(() => host.lobby.getView().players[2].away, 'G2 shown as gone');
      // the reopened link knows nothing but the ids this device used in that room
      const back = await reopen(host.code.toLowerCase(), { name: 'G2', knownIds: [g2.playerId] });
      expect(back).toMatchObject({ rejoined: true, playerId: g2.playerId });
      const s = await started(back.lobby);
      await be.wait(() => s.getState(), 'state after rejoin');
      expect(s.mySeats).toEqual([2]);
      await be.wait(() => !host.lobby.getView().players[2].away, 'G2 shown as back');
      // a stranger still can't join a running game where nobody has left
      await expect(reopen(host.code, { name: 'Zed' })).rejects.toThrow(/started/);
    }, TIMEOUT);

    it('a reload whose old connection drops late (stale onDisconnect) still ends with the player shown as connected', async () => {
      setup();
      const { host, guests } = await table(['G1']);
      const g1 = guests[0];
      // reload: the new tab rejoins with this tab's id while the old socket is still open...
      const again = await reopen(host.code, { playerId: g1.playerId });
      expect(again.rejoined).toBe(true);
      // ...and only then does the old socket go, firing its onDisconnect (connected: false) after the new tab's "here"
      closeTab(g1);
      await be.pause(50);
      await be.wait(() => host.lobby.getView().players[1].connected === true, 'G1 healed to connected');
      await be.pause(200);
      expect(host.lobby.getView().players[1]).toMatchObject({ connected: true, away: false });
      expect((await roomAt(host.code)).players[g1.playerId].connected).toBe(true);
    }, TIMEOUT);

    it('a newcomer takes a left seat by name; another name is told which seats are open', async () => {
      setup();
      const { host, guests } = await table();
      closeTab(guests[0]); // G1 is gone (lost phone: no device memory either)
      await be.wait(() => host.lobby.getView().players[1].away, 'G1 shown as gone');
      const err = await reopen(host.code, { name: 'Somebody' }).catch(e => e);
      expect(err.message).toMatch(/join with their name: G1/);
      expect(err.openSeats).toEqual([{ seat: 1, name: 'G1' }]);
      const back = await reopen(host.code, { name: ' g1 ' });
      expect(back).toMatchObject({ rejoined: true, tookSeat: 'G1', playerId: guests[0].playerId });
      const s = await started(back.lobby);
      await be.wait(() => s.getState(), 'state');
      expect(s.mySeats).toEqual([1]);
    }, TIMEOUT);

    it('a player gone on their turn: after N seconds the host can let a bot play for them; the game goes on; they take the seat back on return', async () => {
      setup();
      const { host, guests } = await table(['G1', 'G2'], { seed: 33, subAfterMs: 400 });
      const [g1, g2] = guests;
      const errors = [];
      const stops = [autoPlay(host.s, { seed: 1, errors }), autoPlay(g1.s, { seed: 2, errors })];
      // G2 drops the moment the game waits on them
      await be.wait(() => host.s.getState().pending?.player === 2, 'G2 to move');
      closeTab(g2);
      await be.wait(() => host.lobby.getView().players[2].away, 'G2 gone');
      const v0 = host.s.getState();
      expect(host.s.info.seats[2]).toMatchObject({ away: true, sub: false, canSub: false }); // not yet N seconds
      await expect(g1.s.letBotPlay(2)).rejects.toThrow(/host/);
      await be.wait(() => host.s.info.seats[2].canSub, 'host offered the takeover');
      expect(g1.s.info.seats[2].canSub).toBe(false); // only the host gets the button
      await host.s.letBotPlay(2);
      await be.wait(() => host.s.info.seats[2].sub && g1.s.info.seats[2].sub, 'everyone sees a bot standing in');
      // the game moves past G2's turns
      await be.wait(() => host.s.getState().history.length > v0.history.length + 12 || host.s.getState().over, 'play continues');
      expect(host.s.getState().history.slice(v0.history.length).some(([p]) => p === 2)).toBe(true);
      // G2 is back (same device): the seat is theirs again and the bot stops
      const back = await reopen(host.code, { name: 'G2', knownIds: [g2.playerId] });
      const s2 = await started(back.lobby);
      await be.wait(() => s2.getState() && !host.s.info.seats[2].sub && !host.s.info.seats[2].away, 'seat taken back');
      expect((await roomAt(host.code)).seats.s2.sub ?? null).toBe(null);
      stops.push(autoPlay(s2, { seed: 3, errors }));
      await be.wait(() => [host.s, g1.s, s2].every(s => s.getState()?.over), 'game over');
      expect(errors).toEqual([]);
      expect(new Set([host.s, g1.s, s2].map(s => fingerprint(s.getState()))).size).toBe(1);
      stops.forEach(f => f());
    }, TIMEOUT);

    it('a host whose phone sleeps (still reads as connected, but stops its heartbeat) is replaced after 15 s', async () => {
      setup();
      const { host, guests } = await table(['G1', 'G2'], { seed: 51, subAfterMs: 400 });
      const [g1, g2] = guests;
      const errors = [];
      const stops = [autoPlay(host.s, { seed: 1, errors }), autoPlay(g1.s, { seed: 2, errors }), autoPlay(g2.s, { seed: 3, errors })];
      await be.wait(() => host.s.getState().history.length > 4, 'some moves');
      // the host's phone locks: its code stops running, its socket still reads as connected
      stops[0]();
      host.lobby.destroy();
      await be.pause(8000);
      let room = await roomAt(host.code);
      expect(room.hostId).toBe(host.playerId); // a few seconds of silence isn't enough
      expect(room.players[host.playerId].connected).toBe(true);
      await be.wait(() => g1.lobby.getView().isHost, 'G1 takes over once the heartbeat is 15 s old');
      room = await roomAt(host.code);
      expect(room.players[host.playerId].connected).toBe(true); // Firebase still hadn't noticed: the heartbeat did
      const beat = room.hostBeat;
      await be.pause(6000);
      expect((await roomAt(host.code)).hostBeat).not.toBe(beat); // the new host beats
      // later the server notices the dead socket; the new host lets a bot play the old host's seat; the game ends
      host.t.close();
      await be.pause(1000);
      if (!g1.s.info.seats[0].canSub) console.log('DEBUG', JSON.stringify((await roomAt(host.code)).players), JSON.stringify(g1.s.info.seats[0]), g1.s.info.isHost, g1.lobby.getView().status);
      await be.wait(() => g1.s.info.seats[0].canSub, 'offered a bot for the old host');
      await g1.s.letBotPlay(0);
      await be.wait(() => g1.s.getState()?.over && g2.s.getState()?.over, 'game over');
      expect(errors).toEqual([]);
      stops.forEach(f => f());
    }, TIMEOUT);

    it('Leave mid-game hands your seat to a bot at once; the host closing the tab migrates host, and the new host can bot the old host’s seat', async () => {
      setup();
      const { host, guests } = await table(['G1', 'G2'], { seed: 44, subAfterMs: 400 });
      const [g1, g2] = guests;
      const errors = [];
      const stops = [autoPlay(host.s, { seed: 1, errors }), autoPlay(g1.s, { seed: 2, errors })];
      await g2.lobby.leave(); // the in-game Leave button
      await be.wait(() => host.s.info.seats[2].sub === true, 'G2 seat played by a bot');
      // now the host's phone dies: no Leave, the socket just goes
      await be.wait(() => host.s.getState().history.length > 6, 'some moves in');
      stops[0]();
      closeTab(host);
      await be.wait(() => g1.lobby.getView().isHost, 'G1 is the new host');
      expect(g1.s.info.isHost).toBe(true);
      await be.wait(() => g1.s.info.seats[0].canSub, 'new host offered a bot for the old host');
      await g1.s.letBotPlay(0);
      await be.wait(() => g1.s.getState()?.over, 'game over with two bots standing in');
      expect(errors).toEqual([]);
      const room = await roomAt(host.code);
      expect(room.status).toBe('over');
      expect(room.hostId).toBe(g1.playerId);
      stops.forEach(f => f());
    }, TIMEOUT);
  });
}

describe('device memory of rooms (saved.js)', () => {
  it('remembers every id this device used per room, newest last; forgets after 12 h; offers the latest code for 3 h', async () => {
    const { rememberRoom, roomIds, lastRoomCode } = await import('../../../v4/saved.js');
    localStorage.clear();
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
      rememberRoom('ABCDE', 'p1');
      rememberRoom('ABCDE', 'p2');
      rememberRoom('ABCDE', 'p1'); // seen again: moves to the end, no duplicate
      expect(roomIds('abcde')).toEqual(['p2', 'p1']);
      vi.setSystemTime(new Date('2026-10-14T11:00:00Z'));
      rememberRoom('FGHJK', 'p9');
      expect(lastRoomCode()).toBe('FGHJK');
      expect(roomIds('ZZZZZ')).toEqual([]);
      vi.setSystemTime(new Date('2026-10-14T15:00:00Z'));
      expect(lastRoomCode()).toBe(''); // older than 3 h: not offered on the home screen any more
      expect(roomIds('FGHJK')).toEqual(['p9']); // but a reopened link still finds the seat
      vi.setSystemTime(new Date('2026-10-15T00:00:00Z'));
      expect(roomIds('ABCDE')).toEqual([]); // 14 h: forgotten
    } finally { vi.useRealTimers(); localStorage.clear(); }
  });
});

describe('player emoji online', () => {
  it('each seat keeps its emoji into the game, through a reload and through a takeover by name', async () => {
    vi.useFakeTimers();
    const store = createMemoryStore();
    const wait = (c, l) => untilFake(c, { label: l, step: 20, maxSteps: 50000 });
    const ht = createMemoryTransport(store);
    const host = await createRoom({ name: 'Hana', emoji: '🦊', transport: ht, botDelayMs: 0, subAfterMs: 100 });
    const gt = createMemoryTransport(store);
    const g = await joinRoom({ code: host.code, name: 'Gus', emoji: '🐙', transport: gt, botDelayMs: 0 });
    await host.lobby.addBot('Botty', '🤖');
    await wait(() => host.lobby.getView().players.length === 3, 'seated');
    expect(host.lobby.getView().players.map(p => p.emoji)).toEqual(['🦊', '🐙', '🤖']);
    const [hs] = await Promise.all([started(host.lobby), started(g.lobby), host.lobby.start()]);
    await wait(() => hs.getState(), 'state');
    expect(hs.getState().players.map(p => p.emoji)).toEqual(['🦊', '🐙', '🤖']);
    expect(hs.info.seats.map(s => s.emoji)).toEqual(['🦊', '🐙', '🤖']);
    // Gus's phone dies; a newcomer takes his seat by name with another emoji: the seat (and game) keep 🐙
    g.lobby.destroy(); gt.close();
    await wait(() => host.lobby.getView().players[1].away, 'gone');
    const t2 = createMemoryTransport(store);
    const back = await joinRoom({ code: host.code, name: 'gus', emoji: '🐸', transport: t2, botDelayMs: 0 });
    expect(back.tookSeat).toBe('Gus');
    await wait(() => !host.lobby.getView().players[1].away, 'back');
    expect(host.lobby.getView().players[1].emoji).toBe('🐙');
    expect(store.data[ROOM_ROOT][host.code].seats.s1.emoji).toBe('🐙');
    host.lobby.destroy(); back.lobby.destroy();
    vi.useRealTimers();
  }, 60000);
});
