import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoom, joinRoom, createMemoryStore, createMemoryTransport, createLocalSession, ROOM_ROOT } from '../../../v4/session/index.js';
import { cleanTalk, QUICK_LINES, TALK_MAX, TALK_GAP_MS } from '../../../v4/session/talk.js';
import { until, pause } from './helpers.js';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

const started = lobby => new Promise(r => lobby.onStart(r));

describe('table talk', () => {
  it('cleans what is said', () => {
    expect(cleanTalk('  so   much\nspace ')).toBe('so much space');
    expect(cleanTalk('x'.repeat(200))).toHaveLength(TALK_MAX);
    expect(cleanTalk('   ')).toBe('');
    expect(QUICK_LINES.length).toBeGreaterThanOrEqual(12);
  });

  it('online: a line said at one seat reaches every client, from that seat only', async () => {
    const store = createMemoryStore();
    const host = await createRoom({ name: 'Host', transport: createMemoryTransport(store), seed: 3, botDelayMs: 0 });
    const g = await joinRoom({ code: host.code, name: 'G1', transport: createMemoryTransport(store), botDelayMs: 0 });
    const [hs, gs] = await Promise.all([started(host.lobby), started(g.lobby), host.lobby.start()]);
    await until(() => hs.getState() && gs.getState(), { label: 'first state' });
    const heard = [];
    hs.onTalk(t => heard.push(t));
    expect(gs.say(1, 'Heretic!')).toBe(true);
    expect(gs.say(0, 'not my seat')).toBe(false); // the host's seat
    await until(() => hs.talk.length === 1 && gs.talk.length === 1, { label: 'talk delivered' });
    expect(heard).toHaveLength(1);
    expect(hs.talk[0]).toMatchObject({ seat: 1, text: 'Heretic!' });
    expect(gs.say(1, 'again')).toBe(false); // too soon
    await pause(TALK_GAP_MS + 10);
    expect(gs.say(1, 'again')).toBe(true);
    // a forged line (someone writing for a seat that isn't theirs) is ignored
    const forger = createMemoryTransport(store);
    await forger.push(`${ROOM_ROOT}/${host.code}/talk`, { seat: 0, by: 'nobody', text: 'forged', at: 1, logAt: 0 });
    await until(() => gs.talk.length === 2, { label: 'second line' });
    await pause(50);
    expect(hs.talk.map(t => t.text)).toEqual(['Heretic!', 'again']);
    host.lobby.destroy(); g.lobby.destroy();
  });

  it('local: the people at the screen can talk, bots never do', () => {
    const s = createLocalSession({ seats: [{ name: 'You' }, { name: 'Bot', kind: 'bot' }], seed: 5, botDelayMs: 0 });
    const heard = [];
    s.onTalk(t => heard.push(t.text));
    expect(s.say(1, 'beep')).toBe(false);
    expect(s.say(0, '  Oops  ')).toBe(true);
    expect(heard).toEqual(['Oops']);
    expect(s.talk[0]).toMatchObject({ seat: 0, logAt: s.getState().log.length });
    s.destroy();
  });
});
