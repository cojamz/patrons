import { describe, it, expect } from 'vitest';
import { createRoom, joinRoom, createBroadcastTransport } from '../../../v4/session/index.js';
import { until, autoPlay, fingerprint } from './helpers.js';

// jsdom shares one localStorage, and Node's BroadcastChannel delivers between instances: a stand-in for two tabs.
describe.skipIf(typeof BroadcastChannel === 'undefined' || typeof localStorage === 'undefined')('broadcast transport', () => {
  it('two "tabs" play a full game with a bot', async () => {
    const name = `t-${Math.random().toString(36).slice(2)}`;
    const a = createBroadcastTransport(name), b = createBroadcastTransport(name);
    const host = await createRoom({ name: 'A', transport: a, botDelayMs: 0, seed: 9 });
    const guest = await joinRoom({ code: host.code, name: 'B', transport: b, botDelayMs: 0 });
    await host.lobby.addBot();
    const started = l => new Promise(r => l.onStart(r));
    const [hs, gs] = await Promise.all([started(host.lobby), started(guest.lobby), host.lobby.start()]);
    const errors = [];
    const stops = [autoPlay(hs, { seed: 1, errors }), autoPlay(gs, { seed: 2, errors })];
    await until(() => hs.getState()?.over && gs.getState()?.over, { timeout: 20000, label: 'game over' });
    expect(errors).toEqual([]);
    expect(fingerprint(hs.getState())).toBe(fingerprint(gs.getState()));
    stops.forEach(f => f());
    hs.destroy(); gs.destroy(); a.close(); b.close();
  });
});
