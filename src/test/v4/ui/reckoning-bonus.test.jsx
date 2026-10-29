// End-game bonus cards on the Reckoning (QA, Oct 28): Snob counts blue members by worth (a member worth 2 followers
// counts as 2, countMembersOfColor), and the card's number is the prize the engine paid; its rule text ends in one period.
import { it, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { resume, followers } from '../../../engine/v4/core.js';
import Reckoning, { reckonSteps } from '../../../v4/game/Reckoning.jsx';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
vi.mock('../../../v4/game/flight.js', async o => ({ ...(await o()), motionOK: () => false }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('Snob with worth-2 and worth-3 blue members: the card shows the prize paid, and "you have." ends once', () => {
  let s = sceneQ({ quadrants: ['gold', 'red', 'market', 'green'], round: 3, left: 0, queue: [{ t: 'finish' }],
    members: [['market.snob', 'market.shopaholic', 'market.windowdresser'], []] });
  s = resume(s);
  const paid = s.players[0].final.cards.find(c => c.name === 'Snob').n;
  expect(paid).toBe(1 + 1 + 1); // three cards, three blue members: worth isn't members (Cory, 2026-10-29)
  const info = { after: s, board: s, result: { round: 'III', rows: [] } };
  const snob = reckonSteps(info).find(x => x.kind === 'bonus' && x.rule === 'Snob');
  expect(snob.prize).toBe(paid);
  expect(snob.rows[0].shown).toBe(paid);
  vi.useFakeTimers();
  const { container } = render(<Reckoning info={info} root={null} onDone={() => {}} />);
  for (let i = 0; i < 40 && !/from Snob/.test(container.textContent); i++) act(() => { vi.advanceTimersByTime(1000); });
  expect(container.textContent).toContain(`+${paid} followers from Snob`);
  expect(container.querySelector('.reckon-counts').textContent).toBe('Game End: +1 follower per blue member you have.');
  expect(followers(s, s.players[0])).toBeGreaterThan(paid);
});
