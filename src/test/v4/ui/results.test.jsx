// The final results name the same winners as the game-over cults: both come from format.js finalWinners (most
// followers, members breaking a follower tie).
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import Results from '../../../v4/game/Results.jsx';
import { finalWinners, breakdown } from '../../../v4/format.js';

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

  it('folds the columns that are the same for everyone, and every number opens what it\'s made of (w3b #52, w3a #40)', () => {
    for (const seed of [3, 5, 8]) {
      const s = finish(seed);
      const { container } = render(<Results state={s} onPlayAgain={() => {}} onHome={() => {}} />);
      const heads = [...container.querySelectorAll('.res-t th')].map(e => e.textContent);
      expect(heads).not.toContain('Yourself');
      expect(heads.includes('End-game')).toBe(s.players.some(p => breakdown(s, p).endGame !== 0));
      expect(heads.includes('During play')).toBe(s.players.some(p => breakdown(s, p).effects !== 0));
      // the columns still add up: leader and members, bought, during play, prizes (and end-game)
      for (const row of container.querySelectorAll('.res-t tbody tr')) {
        const cells = [...row.querySelectorAll('td')].slice(2).map(td => Number(td.textContent.replace('−', '-').replace('+', '')));
        expect(cells.slice(1).reduce((a, b) => a + b, 0)).toBe(cells[0]);
        // every number is a hover (Tip), not a bare cell
        for (const td of [...row.querySelectorAll('td')].slice(2)) expect(td.querySelector('[aria-label]')).not.toBeNull();
      }
      expect(container.querySelector('.results .hint').textContent).not.toMatch(/raid|sale/);
      cleanup();
    }
  });
});
