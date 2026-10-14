// The final results name the same winners as the game-over cults: both come from format.js finalWinners (most
// followers, members breaking a follower tie).
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import Results from '../../../v4/game/Results.jsx';
import { finalWinners } from '../../../v4/format.js';

afterEach(cleanup);
const finish = seed => {
  const rand = seededRandom(seed);
  let s = createGame({ seats: [{ name: 'Ana', kind: 'bot' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }], seed });
  for (let k = 0; k < 3000 && !s.over; k++) s = applyMove(s, chooseBotMove(s, rand));
  return s;
};

describe('Results winners', () => {
  it('name exactly finalWinners in finished games', () => {
    for (const seed of [3, 5, 8, 13]) {
      const s = finish(seed);
      expect(s.over).toBe(true);
      const { container } = render(<Results state={s} onPlayAgain={() => {}} onHome={() => {}} />);
      const named = container.querySelector('.results .win span').textContent;
      expect(named).toBe(finalWinners(s).map(id => s.players[id].name).join(' & '));
      cleanup();
    }
  });
});
