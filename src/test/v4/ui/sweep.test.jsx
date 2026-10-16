// New Faces (Restock) sweeps the face-up row under the deck: its preview lists every member it sends away, and its
// space card says the whole row goes (a few by name), so nobody sweeps their own target by surprise. Spaces that sweep nothing list nothing.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, previewSpace, quadrant, cardDef } from '../../../engine/v4/index.js';
import { SpaceCard } from '../../../v4/game/HoverCards.jsx';
import { cachedPreview } from '../../../v4/game/Info.jsx';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];

function restockScene() {
  for (let seed = 1; seed < 40; seed++) {
    let s = createGame({ seats, seed, quadrants: ['gold', 'red', 'market', 'echo'] });
    for (let k = 0; k < 400 && !(s.pending && s.pending.kind === 'place' && s.pending.player === 0 && s.round >= 1); k++) s = applyMove(s, chooseBotMove(s, () => 0.3));
    const q = s.quadrants.indexOf('market');
    const i = quadrant('market').actions.findIndex(a => a.key === 'restock');
    if (s.pending.options.some(o => o.id === `slot:${q}-${i}`)) return { s, q, i };
  }
  return null;
}

describe('New Faces names what it sweeps', () => {
  it('the preview lists every face-up member it sends under the deck', () => {
    const { s, q, i } = restockScene();
    const pv = previewSpace(s, 0, q, i);
    expect([...pv.swept].sort((a, b) => a - b)).toEqual([...s.shop].sort((a, b) => a - b));
  });

  it('its space card names them, and a plain gain space sweeps nothing', () => {
    const { s, q, i } = restockScene();
    cachedPreview(s, 0, q, i);
    const { container } = render(<SpaceCard state={s} me={0} spaceKey={`${q}-${i}`} />);
    const named = [...container.querySelectorAll('[data-swept]')].flatMap(e => e.dataset.swept.split(' ').map(Number));
    expect(named.sort((a, b) => a - b)).toEqual([...s.shop].sort((a, b) => a - b));
    expect(container.textContent).toContain('Sweeps away');
    // the whole row is said as one (design pod: ten names were a wall of text about the row already on screen)
    expect(container.textContent).toMatch(/the whole row \(\d+\)/);
    void cardDef;
    cleanup();
    const g = s.quadrants.indexOf('gold');
    const plain = s.pending.options.find(o => o.q === g);
    expect(previewSpace(s, 0, plain.q, plain.i).swept).toEqual([]);
  });
});
