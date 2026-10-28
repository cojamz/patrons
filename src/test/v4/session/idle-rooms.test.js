import { describe, it, expect } from 'vitest';
import { createMemoryStore, createMemoryTransport, createRoom } from '../../../v4/session/index.js';
import { sweepIdleRooms, lastActive, IDLE_MS, INDEX_PATH, ROOM_ROOT } from '../../../v4/session/online.js';

const HOUR = 60 * 60 * 1000;

describe('idle rooms are cleared after two hours', () => {
  it('deletes a room quiet for two hours, keeps one with recent life', async () => {
    const store = createMemoryStore();
    const t = createMemoryTransport(store);
    await t.ready;
    const now = 10 * HOUR;
    await t.set(`${ROOM_ROOT}/OLDAA`, { game: 'v4', createdAt: now - 3 * HOUR, state: { at: now - IDLE_MS - 1 } });
    await t.set(`${ROOM_ROOT}/LIVEA`, { game: 'v4', createdAt: now - 5 * HOUR, hostBeat: now - 1000 });
    await t.set(`${ROOM_ROOT}/MOVEA`, { game: 'v4', createdAt: now - 5 * HOUR, players: { p1: { lastSeen: now - HOUR } } });
    await t.set(INDEX_PATH, { OLDAA: now - 3 * HOUR, LIVEA: now - 3 * HOUR, MOVEA: now - 3 * HOUR, GONEA: now - 3 * HOUR, NEWAA: now - 60000 });

    const gone = await sweepIdleRooms(t, { now });
    expect(gone.sort()).toEqual(['GONEA', 'OLDAA']);
    expect(await t.get(`${ROOM_ROOT}/OLDAA`)).toBeNull();
    expect(await t.get(`${ROOM_ROOT}/LIVEA`)).not.toBeNull();
    expect(await t.get(`${ROOM_ROOT}/MOVEA`)).not.toBeNull();
    const index = await t.get(INDEX_PATH);
    expect(Object.keys(index).sort()).toEqual(['LIVEA', 'MOVEA', 'NEWAA']);
    expect(index.LIVEA).toBe(now - 1000); // refreshed to the room's own last sign of life
  });

  it('lastActive takes the newest of made, moves, heartbeat and players', () => {
    expect(lastActive({ createdAt: 1, state: { at: 5 }, hostBeat: 3, players: { a: { lastSeen: 9 }, b: {} } })).toBe(9);
    expect(lastActive(null)).toBe(0);
  });

  it('a new room is listed in the index', async () => {
    const store = createMemoryStore();
    const t = createMemoryTransport(store);
    const { code, lobby } = await createRoom({ name: 'Host', transport: t });
    await new Promise(r => setTimeout(r, 0));
    expect(typeof (await t.get(`${INDEX_PATH}/${code}`))).toBe('number');
    lobby.destroy?.();
  });
});
