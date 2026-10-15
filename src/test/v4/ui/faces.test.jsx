// The face registry (src/v4/game/faces/): a face draws inside each space while the Wheel keeps the space itself
// (data-slot, role, aria-label, data-option, the state classes), and the default look never loads a face.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import Wheel from '../../../v4/game/Wheel.jsx';
import { faceNames, faceStatus, boxOf, DEFAULT_BOX } from '../../../v4/game/faces/index.js';

const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
afterEach(cleanup);

function placing() {
  const rand = seededRandom(5);
  let s = createGame({ seats, seed: 5 });
  for (let k = 0; k < 400 && !(s.pending && s.pending.player === 0 && s.pending.kind === 'place' && Object.keys(s.slots).length >= 2); k++) s = applyMove(s, chooseBotMove(s, rand));
  const legal = new Map(s.pending.options.filter(o => o.kind === 'slot' && o.q != null).map(o => [`${o.q}-${o.i}`, o.id]));
  return { s, legal };
}
const wheel = (s, legal, look) => <Wheel state={s} legal={legal} onPick={() => {}} flash={new Set()} facing={0} onFacing={() => {}} meId={0} look={look} />;

describe('faces', () => {
  it('registers the built-ins and the face files by name', () => {
    expect(faceNames().slice(0, 2)).toEqual(['panels', 'sockets']); // engraved retired (Cory, 2026-10-15)
    expect(faceNames()).toContain('demo');
    expect(faceNames()).not.toContain('kit');
  });

  it('gives each space one status word', () => {
    expect(faceStatus({ legal: true, owner: 1, open: true })).toBe('lit');
    expect(faceStatus({ legal: false, owner: 1, open: true, fresh: { pid: 1 } })).toBe('fresh');
    expect(faceStatus({ legal: false, owner: 2, open: true })).toBe('taken');
    expect(faceStatus({ legal: false, owner: undefined, open: true })).toBe('open');
    expect(faceStatus({ legal: false, owner: undefined, open: false })).toBe('locked');
    expect(boxOf(null, 2)).toEqual(DEFAULT_BOX[2]);
    expect(boxOf({ box: { 2: [30, 20] } }, 2)).toEqual([30, 20]);
  });

  it('the default look draws no face; a face draws in every space and the Wheel keeps the space', async () => {
    const { s, legal } = placing();
    const def = render(wheel(s, legal, null));
    expect(def.container.querySelector('[data-face]')).toBeNull();
    expect(def.container.querySelectorAll('.face-svg').length).toBe(0);
    const n = def.container.querySelectorAll('[data-slot]').length;
    cleanup();
    const { container } = render(wheel(s, legal, 'demo'));
    await waitFor(() => expect(container.querySelectorAll('.slot .face-svg').length).toBe(n));
    expect(container.querySelector('.wheel-wrap').dataset.face).toBe('demo');
    const lit = [...container.querySelectorAll('.slot.lit')];
    expect(lit.length).toBe(legal.size);
    for (const el of lit.filter(e => !e.classList.contains('taken'))) {
      expect(el.getAttribute('role')).toBe('button');
      expect(el.dataset.option).toBe(legal.get(el.dataset.slot));
      expect(el.getAttribute('aria-label')).toMatch(/Open: you can take it/);
    }
    expect(container.querySelectorAll('.slot.taken').length).toBe(Object.keys(s.slots).length);
  });
});
