// Pick your emoji (Cory, 2026-10-14): one per table, a random free one for bots and for anyone who doesn't pick,
// people outrank bots. And the bot level the host picks online reaches the game. Local and online (in-memory
// transport; also the real Firebase SDK when V4_RTDB_EMULATOR is set, as in friends.test.js).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { freeEmojis, randomFreeEmoji, settleEmojis, takeEmoji } from '../../../v4/emojiPick.js';
import { emojiIds } from '../../../v4/art/emojis.js';
import { createLocalSession } from '../../../v4/session/local.js';
import { createRoom, joinRoom, createMemoryStore, createMemoryTransport, createFirebaseTransport, ROOM_ROOT } from '../../../v4/session/index.js';
import { botLevel } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { until, untilFake } from './helpers.js';

const IDS = emojiIds();
const distinct = list => new Set(list).size === list.length;

describe('emoji picks (pure)', () => {
  it('has the 20 drawn emojis to offer', () => {
    expect(IDS.length).toBe(20);
    expect(distinct(IDS)).toBe(true);
  });
  it('a random free emoji is never one someone holds, reaches every free one, and is null when none is left', () => {
    const taken = IDS.slice(0, 17);
    const rand = seededRandom(5);
    const seen = new Set();
    for (let k = 0; k < 300; k++) {
      const e = randomFreeEmoji(taken, rand);
      expect(taken).not.toContain(e);
      expect(IDS).toContain(e);
      seen.add(e);
    }
    expect([...seen].sort()).toEqual(freeEmojis(taken).sort());
    expect(randomFreeEmoji(IDS)).toBe(null);
  });
  it('settles a table: everyone gets one, none twice; people keep picks (lower seat wins a clash); bots yield', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const seats = settleEmojis([
        { kind: 'human', emoji: 'cat' }, { kind: 'bot', emoji: 'wizard' }, { kind: 'human', emoji: 'cat' }, { kind: 'human', emoji: 'wizard' },
      ], seededRandom(seed));
      const got = seats.map(s => s.emoji);
      expect(distinct(got)).toBe(true);
      got.forEach(e => expect(IDS).toContain(e));
      expect(got[0]).toBe('cat'); // the lower seat keeps a clash
      expect(got[3]).toBe('wizard'); // a person outranks the bot
      expect(got[1]).not.toBe('wizard');
    }
    const empty = settleEmojis([{ kind: 'human' }, { kind: 'empty' }, { kind: 'bot' }]);
    expect(empty[1].emoji).toBeUndefined();
    expect(distinct([empty[0].emoji, empty[2].emoji])).toBe(true);
  });
  it('a pick refuses a person’s emoji and moves a bot off its own', () => {
    const seats = [{ kind: 'human', emoji: 'cat' }, { kind: 'human', emoji: 'frog' }, { kind: 'bot', emoji: 'bee' }];
    expect(takeEmoji(seats, 0, 'frog')).toBe(null);
    const next = takeEmoji(seats, 0, 'bee', seededRandom(3));
    expect(next[0].emoji).toBe('bee');
    expect(next[2].emoji).not.toBe('bee');
    expect(distinct(next.map(s => s.emoji))).toBe(true);
  });
});

describe('emoji picks (local game)', () => {
  it('a new game keeps each person’s pick and gives bots and the undecided a random free one, none twice', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = createLocalSession({ seed, botDelayMs: 1e9, seats: [
        { name: 'Ann', kind: 'human', emoji: 'wizard' }, { name: 'B1', kind: 'bot' }, { name: 'Cy', kind: 'human' }, { name: 'B2', kind: 'bot', emoji: 'wizard' },
      ] });
      const got = s.getState().players.map(p => p.emoji);
      expect(got[0]).toBe('wizard');
      expect(distinct(got)).toBe(true);
      got.forEach(e => expect(IDS).toContain(e));
      s.destroy();
    }
  });
  it('is the same for the same seed (a replay or a reload shows the same faces)', () => {
    const seats = [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'bot' }, { name: 'C', kind: 'bot' }];
    const a = createLocalSession({ seed: 9, botDelayMs: 1e9, seats });
    const b = createLocalSession({ seed: 9, botDelayMs: 1e9, seats });
    expect(a.getState().players.map(p => p.emoji)).toEqual(b.getState().players.map(p => p.emoji));
    a.destroy(); b.destroy();
  });
});

const EMU = process.env.V4_RTDB_EMULATOR;
function memoryBackend() {
  const store = createMemoryStore();
  const admin = createMemoryTransport(store);
  return {
    client: () => createMemoryTransport(store),
    seats: async code => store.data[ROOM_ROOT][code].seats,
    poke: (code, seat, emoji) => admin.set(`${ROOM_ROOT}/${code}/seats/s${seat}/emoji`, emoji),
    wait: (cond, label) => untilFake(cond, { label, step: 20, maxSteps: 50000 }),
    fake: true, end() {},
  };
}
function emulatorBackend() {
  const admin = createFirebaseTransport({ emulator: EMU });
  return {
    client: () => createFirebaseTransport({ emulator: EMU }),
    seats: code => admin.get(`${ROOM_ROOT}/${code}/seats`),
    poke: (code, seat, emoji) => admin.set(`${ROOM_ROOT}/${code}/seats/s${seat}/emoji`, emoji),
    wait: (cond, label) => until(cond, { label, timeout: 60000 }),
    fake: false, end() { admin.close(); },
  };
}
const backends = [['memory', memoryBackend], ...(EMU ? [['firebase emulator', emulatorBackend]] : [])];
const started = lobby => new Promise(r => lobby.onStart(r));
const viewEmojis = lobby => lobby.getView().players.map(p => p.emoji);

for (const [label, make] of backends) {
  describe(`emoji picks and bot levels online (${label})`, () => {
    let be;
    const open = [];
    const keep = x => { open.push(x); return x; };
    afterEach(() => { for (const x of open.splice(0)) { try { x.lobby?.destroy(); } catch { /* gone */ } } be?.end(); if (be?.fake) vi.useRealTimers(); });

    it('one per table: a taken wish gets a random free one, a person’s pick is refused, a bot gives its up, a race has one winner', async () => {
      be = make();
      if (be.fake) vi.useFakeTimers();
      const host = keep(await createRoom({ name: 'Hana', emoji: 'wizard', transport: be.client(), botDelayMs: 0 }));
      const gus = keep(await joinRoom({ code: host.code, name: 'Gus', emoji: 'wizard', transport: be.client(), botDelayMs: 0 }));
      const pia = keep(await joinRoom({ code: host.code, name: 'Pia', transport: be.client(), botDelayMs: 0 }));
      await host.lobby.addBot(undefined, undefined, 'hard');
      await be.wait(() => host.lobby.getView().players.length === 4, 'four seats');
      let got = viewEmojis(host.lobby);
      expect(got[0]).toBe('wizard');
      expect(distinct(got)).toBe(true);
      got.forEach(e => expect(IDS).toContain(e));
      expect(host.lobby.getView().players.map(p => p.bot)).toEqual([undefined, undefined, undefined, 'hard']);

      // Gus can't take Hana's; he can take the bot's, and the bot picks another
      await expect(gus.lobby.setEmoji('wizard')).rejects.toThrow(/Hana has that one/);
      const botHad = got[3];
      await gus.lobby.setEmoji(botHad);
      await be.wait(() => viewEmojis(host.lobby)[1] === botHad && viewEmojis(host.lobby)[3] !== botHad, 'bot moved over');
      got = viewEmojis(host.lobby);
      expect(distinct(got)).toBe(true);
      expect(IDS).toContain(got[3]);

      // Gus and Pia both reach for the same free one at the same moment: exactly one gets it
      const prize = freeEmojis(got)[0];
      const race = await Promise.allSettled([gus.lobby.setEmoji(prize), pia.lobby.setEmoji(prize)]);
      expect(race.filter(r => r.status === 'fulfilled').length).toBe(1);
      expect(race.find(r => r.status === 'rejected').reason.message).toMatch(/has that one/);
      await be.wait(() => viewEmojis(host.lobby).includes(prize), 'race settled');
      got = viewEmojis(host.lobby);
      expect(got.filter(e => e === prize).length).toBe(1);
      expect(distinct(got)).toBe(true);

      // the picks and the bot's level go into the game
      const [hs] = await Promise.all([started(host.lobby), started(gus.lobby), started(pia.lobby), host.lobby.start()]);
      await be.wait(() => hs.getState(), 'state');
      const st = hs.getState();
      expect(st.players.map(p => p.emoji)).toEqual(got);
      expect(st.players.map((p, i) => (p.kind === 'bot' ? botLevel(st, i) : p.bot))).toEqual([undefined, undefined, undefined, 'hard']);
      await expect(gus.lobby.setEmoji(freeEmojis(got)[0])).rejects.toThrow(/started/);
    }, EMU ? 240000 : 60000);

    it('a bot added without a level plays Normal; seats with no emoji or a clash are settled when the host starts', async () => {
      be = make();
      if (be.fake) vi.useFakeTimers();
      const host = keep(await createRoom({ name: 'Hana', emoji: 'cat', transport: be.client(), botDelayMs: 1e7 }));
      await host.lobby.addBot();
      await host.lobby.addBot(undefined, 'cat', 'easy'); // a wish someone holds: a random free one instead
      await be.wait(() => host.lobby.getView().players.length === 3, 'three seats');
      expect(host.lobby.getView().players.map(p => p.bot)).toEqual([undefined, 'normal', 'easy']);
      expect(distinct(viewEmojis(host.lobby))).toBe(true);
      // an older client (or a hand edit) left a clash and a blank: the host's start settles both, the lower seat keeping its own
      await be.poke(host.code, 2, 'cat');
      await be.poke(host.code, 1, null);
      await be.wait(() => viewEmojis(host.lobby)[2] === 'cat' && !viewEmojis(host.lobby)[1], 'poked');
      const [hs] = await Promise.all([started(host.lobby), host.lobby.start()]);
      await be.wait(() => hs.getState(), 'state');
      const st = hs.getState();
      const got = st.players.map(p => p.emoji);
      expect(got[0]).toBe('cat');
      expect(distinct(got)).toBe(true);
      got.forEach(e => expect(IDS).toContain(e));
      expect([1, 2].map(i => botLevel(st, i))).toEqual(['normal', 'easy']);
      const seats = await be.seats(host.code);
      expect([0, 1, 2].map(i => seats[`s${i}`].emoji)).toEqual(got);
    }, EMU ? 240000 : 60000);
  });
}
