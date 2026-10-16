// Saves and rooms outlive the code that made them: every deploy can change cards. A save or room from other rules
// content is never resumed, joined or hosted by this build; it's set aside (record kept) or refused with a message.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLocalSession, createRoom, joinRoom, rejoinRoom, createMemoryStore, createMemoryTransport, ROOM_ROOT } from '../../../v4/session/index.js';
import { VERSION_MISMATCH } from '../../../v4/session/online.js';
import { CONTENT_HASH, SHAPE_HASH, BUILD, contentManifest, hashContent, stateProblem, newGame } from '../../../v4/session/record.js';
import { defById } from '../../../engine/v4/index.js';
import { loadLocal, saveLocal, staleSave, staleRecord, markStaleSeen, setAsideLocal, ROUND_START } from '../../../v4/saved.js';

const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }];
const fresh = () => createLocalSession({ seats, seed: 7, botDelayMs: 1e9 });

describe('content hash and stamps', () => {
  it('stamps every new game (local and online) with this build’s content hash, and an empty move list', () => {
    const s = fresh();
    expect(s.getState().build).toEqual({ ...BUILD });
    expect(s.getState().build.content).toBe(CONTENT_HASH);
    expect(s.getState().history).toEqual([]);
    s.destroy();
  });

  it('changes when a cost, a flag or an id changes, but not when wording does', () => {
    const def = defById('gold.' + contentManifest().quadrants.find(q => q.id === 'gold').members[0].id.split('.')[1]);
    const base = hashContent(contentManifest());
    expect(base).toBe(SHAPE_HASH); // the shape part; CONTENT_HASH adds the rules-source hash (content-hash.test.js)
    const text = def.text;
    def.text = 'Reworded entirely.';
    expect(hashContent(contentManifest())).toBe(base);
    def.text = text;
    def.w += 1;
    expect(hashContent(contentManifest())).not.toBe(base);
    def.w -= 1;
    def.someNewFlag = true;
    expect(hashContent(contentManifest())).not.toBe(base);
    delete def.someNewFlag;
    expect(hashContent(contentManifest())).toBe(base);
  });

  it('stateProblem: ok for this build; "version" for other or no stamp; "broken" when an id no longer resolves', () => {
    const st = newGame({ seats, seed: 3 });
    expect(stateProblem(st)).toBe(null);
    expect(stateProblem({ ...st, build: { ...st.build, content: 'older' } }).kind).toBe('version');
    const { build, ...unstamped } = st; // eslint-disable-line no-unused-vars
    expect(stateProblem(unstamped).kind).toBe('version');
    const renamed = structuredClone(st);
    renamed.cards[0].def = 'gold.renamedAway';
    expect(stateProblem(renamed)).toMatchObject({ kind: 'broken' });
    expect(stateProblem(renamed).message).toMatch(/Unknown member/);
    const noQuad = structuredClone(st);
    noQuad.quadrants[3] = 'killedSphere';
    expect(stateProblem(noQuad).kind).toBe('broken');
  });
});

describe('local saves from another version', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('a save from this build resumes as before', () => {
    const st = newGame({ seats, seed: 5 });
    saveLocal({ seats }, st);
    expect(loadLocal()?.state).toEqual(st);
    expect(staleSave()).toBe(null);
  });

  it('a save from older content is never returned: it is set aside, unseen, with its record kept', () => {
    const st = newGame({ seats, seed: 5 });
    const old = { ...st, build: { ...st.build, content: 'olderContent' } };
    saveLocal({ seats }, old);
    localStorage.setItem(ROUND_START, JSON.stringify({ seed: old.seed, round: old.round, names: 'Ana|Bo', state: old }));
    expect(loadLocal()).toBe(null);
    expect(loadLocal()).toBe(null); // idempotent; and the round-start fallback is gone too
    expect(localStorage.getItem(ROUND_START)).toBe(null);
    const v = staleSave();
    expect(v).toMatchObject({ reason: 'version', seen: false });
    expect(v.state).toEqual(old);
    const rec = staleRecord();
    expect(rec).toMatchObject({ kind: 'patrons.v4.record', seed: 5, moves: [], quadrants: st.quadrants });
    expect(rec.state).toEqual(old);
    markStaleSeen();
    expect(staleSave().seen).toBe(true);
  });

  it('a pre-stamp save (no build at all) and one with a killed card are both set aside, not resumed', () => {
    const st = newGame({ seats, seed: 9 });
    const { build, history, ...prestamp } = st; // eslint-disable-line no-unused-vars
    saveLocal({ seats }, prestamp);
    expect(loadLocal()).toBe(null);
    expect(staleSave().reason).toBe('version');
    const killed = structuredClone(st);
    killed.cards[2].def = 'red.killedCard';
    saveLocal({ seats }, killed);
    expect(loadLocal()).toBe(null);
    expect(staleSave()).toMatchObject({ reason: 'broken' });
  });

  it('the error screen’s start-new sets the live save aside as a crash (already seen), so nothing resumes into it', () => {
    const st = newGame({ seats, seed: 4 });
    saveLocal({ seats }, st);
    setAsideLocal('boom');
    expect(loadLocal()).toBe(null);
    expect(staleSave()).toMatchObject({ reason: 'crash', message: 'boom', seen: true });
  });
});

describe('online rooms from another version', () => {
  const room = (store, code) => store.data[ROOM_ROOT][code];

  it('rooms are stamped; a join, a rejoin and hosting are all refused across a content change', async () => {
    const store = createMemoryStore();
    const host = await createRoom({ name: 'Host', transport: createMemoryTransport(store), seed: 3, botDelayMs: 0 });
    expect(room(store, host.code).build).toEqual({ ...BUILD });
    const guest = await joinRoom({ code: host.code, name: 'G', transport: createMemoryTransport(store) });
    const started = new Promise(r => guest.lobby.onStart(r));
    await host.lobby.start();
    const gs = await started;
    await vi.waitUntil(() => gs.getState());
    expect(gs.getState().build.content).toBe(CONTENT_HASH);
    expect(room(store, host.code).build.content).toBe(CONTENT_HASH);

    // a deploy: the room now says other content (as if made by the old build)
    room(store, host.code).build = { ...BUILD, content: 'olderContent' };
    await expect(joinRoom({ code: host.code, name: 'X', transport: createMemoryTransport(store) })).rejects.toThrow(VERSION_MISMATCH);
    await expect(rejoinRoom({ code: host.code, playerId: guest.playerId, transport: createMemoryTransport(store) })).rejects.toThrow(VERSION_MISMATCH);
    // a room from before stamps is refused the same way
    delete room(store, host.code).build;
    await expect(joinRoom({ code: host.code, playerId: guest.playerId, transport: createMemoryTransport(store) })).rejects.toThrow(/different version/);
    host.lobby.destroy(); guest.lobby.destroy();
  });

  it('a client never takes the host role in a room made by other content', async () => {
    const store = createMemoryStore();
    const host = await createRoom({ name: 'Host', transport: createMemoryTransport(store), seed: 3, botDelayMs: 0 });
    await host.lobby.addBot();
    const started = new Promise(r => host.lobby.onStart(r));
    await host.lobby.start();
    const hs = await started;
    await vi.waitUntil(() => hs.getState());
    // the bot seat is the host's to play; with the room's content changed under it, the host loop must not run
    const v0 = room(store, host.code).state.version;
    room(store, host.code).build = { ...BUILD, content: 'olderContent' };
    // nudge a room change so the lobby re-evaluates hosting
    await createMemoryTransport(store).update(`${ROOM_ROOT}/${host.code}`, { touched: 1 });
    // Queue deliberately even if the pending seat is a bot: this tests the host backstop, not local turn validation.
    hs.submit({ option: hs.getState().pending.options[0].id }, { skipLocalCheck: true }).catch(() => {}); // never answered: nobody hosts
    await new Promise(r => setTimeout(r, 30));
    expect(room(store, host.code).moves).toBeTruthy(); // the move sits unconsumed
    expect(room(store, host.code).state.version).toBe(v0); // nobody applied the move: no host for a mismatched room
    host.lobby.destroy();
  });
});
