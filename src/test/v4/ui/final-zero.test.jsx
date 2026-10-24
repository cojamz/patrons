// Round III's summary never says "No end-game bonuses" over a member that scores at game end and came to nothing
// (blind tester, aminus r1 #5: P4 held Kingpin and Magnate, both +0). The engine names each such member (p.final.zero)
// and the summary says "Kingpin +0".
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, defById } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { parseRoundEnd, isRoundEnd } from '../../../v4/format.js';
import RoundEnd from '../../../v4/game/RoundEnd.jsx';

afterEach(cleanup);
const finish = seed => {
  const rand = seededRandom(seed);
  let s = createGame({ seats: ['Ana', 'Bo', 'Cy'].map(name => ({ name, kind: 'bot' })), seed }), before = s;
  for (let k = 0; k < 4000 && !s.over; k++) { before = s; s = applyMove(s, chooseBotMove(s, rand)); }
  return { before, after: s };
};

describe('end-game bonuses that came to nothing', () => {
  it('the engine names every game-end member: scored (cards) or +0 (zero)', () => {
    for (const seed of [3, 5, 8, 13]) {
      const { after: s } = finish(seed);
      for (const p of s.players) {
        const ender = p.members.filter(u => defById(s.cards[u].def).onGameEnd).sort();
        const named = [...p.final.cards.map(c => c.uid), ...p.final.zero.map(z => z.uid)].sort();
        expect(named).toEqual(ender);
      }
    }
  });
  it('the summary says "Kingpin +0" instead of "No end-game bonuses"', () => {
    const { before, after } = finish(5);
    for (const p of after.players) p.final = { total: 0, parts: [], cards: [], zero: [] };
    after.players[1].final.zero = [{ uid: 0, name: 'Kingpin' }, { uid: 1, name: 'Magnate' }];
    const info = { result: parseRoundEnd(after, after.log.filter(isRoundEnd).pop()), start: before, after, board: after };
    const { container } = render(<RoundEnd info={info} onNext={() => {}} autoMs={0} />);
    const line = container.querySelector('.re-final');
    expect(line.textContent).not.toMatch(/No end-game bonuses/);
    expect(line.textContent).toMatch(/Bo.*Kingpin \+0, Magnate \+0/);
    expect(line.textContent).toMatch(/final/);
  });
});
