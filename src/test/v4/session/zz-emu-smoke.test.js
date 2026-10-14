import { describe, it, expect } from 'vitest';
import { createRoom, joinRoom, createFirebaseTransport } from '../../../v4/session/index.js';
import { until, autoPlay, fingerprint } from './helpers.js';
const EMU = process.env.V4_RTDB_EMULATOR;
describe.skipIf(!EMU)('emu smoke', () => {
  it('host + guest + bot full game over the RTDB emulator', async () => {
    const a = createFirebaseTransport({ emulator: EMU }), b = createFirebaseTransport({ emulator: EMU });
    const host = await createRoom({ name: 'A', transport: a, botDelayMs: 0, seed: 9 });
    console.log('room', host.code);
    const guest = await joinRoom({ code: host.code, name: 'B', transport: b, botDelayMs: 0 });
    await host.lobby.addBot();
    const started = l => new Promise(r => l.onStart(r));
    const [hs, gs] = await Promise.all([started(host.lobby), started(guest.lobby), host.lobby.start()]);
    const errors = [];
    const stops = [autoPlay(hs, { seed: 1, errors }), autoPlay(gs, { seed: 2, errors })];
    await until(() => hs.getState()?.over && gs.getState()?.over, { timeout: 120000, label: 'game over' });
    expect(errors).toEqual([]);
    expect(fingerprint(hs.getState())).toBe(fingerprint(gs.getState()));
    console.log('versions', hs.info.version, gs.info.version);
    stops.forEach(f => f());
    hs.destroy(); gs.destroy(); a.close(); b.close();
  }, 180000);
});
