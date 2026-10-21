import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { panelText } from '../../../v4/game/panelText.js';
import { shortEffect, pipEffect } from '../../../v4/shorts.js';
import { giftPick, boardPicker } from '../../../v4/game/boardPick.js';
import { youdWords } from '../../../v4/game/Info.jsx';
import GiftCard from '../../../v4/game/GiftCard.jsx';
import { sceneQ } from '../../engine/v4/cards-helpers.js';

describe('Magenta action wording and one-stack theft', () => {
  it('separates scaling theft, followers, protection and the inherent color gain', () => {
    for (const round of [1, 2, 3]) {
      const pick = panelText('thieves', { key: 'pickpocket' }, round);
      expect(pick.verb).toBe(`Steal ${round}, +${round} @f`);
      expect(pick.second).toBe('+1 magenta');
      const safe = panelText('thieves', { key: 'hideout' }, round);
      expect(safe.verb).toBe(`Steal ${round}; safe from steals`);
      expect(safe.second).toBe('this round');
      expect(safe.note).toBe('+1 magenta');
      expect(shortEffect('thieves', { key: 'pickpocket' }, round)).toContain(`steal ${round}`);
    }
    const occupied = panelText('thieves', { key: 'tipoff' });
    expect(`${occupied.verb} ${occupied.second}`).toBe('Steal 1 per magenta action already holding a minion');
    expect(occupied.note).toBe('+1 magenta');
    expect(panelText('thieves', { key: 'ransom' }, 2).second).toBe('costing 5 or less');
    expect(panelText('thieves', { key: 'rob' }, 2).second).toBe('one color, rounded down');
    expect(pipEffect('thieves', { key: 'rob' }, 2)).toBe('steal half a one-color pile');
  });

  it('shows each exact half-stack amount without a Take All or coin-by-coin plan', () => {
    const s = sceneQ({ quadrants: ['thieves', 'red', 'gold', 'echo'], n: 3, round: 2,
      res: [{}, { gold: 7, red: 3 }, { gold: 4 }] });
    const options = [[1, 'gold', 3], [1, 'red', 1], [2, 'gold', 2]].map(([pid, res, n]) => ({
      id: `take:${pid}:${res}`, kind: 'take', value: [pid, res], target: { pid, res }, take: n,
      label: `Take ${n} ${res} from P${pid + 1}`,
    }));
    s.queue = [{ t: 'choose', p: 0, h: 'thieves.halfPile' }];
    s.pending = { kind: 'choose', player: 0, prompt: 'Pile Theft: choose a rival’s one-color pile', options };
    const g = giftPick(s, s.pending);
    expect(g).toMatchObject({ kind: 'steal', halfPile: true, plan: null, left: null, head: 'Steal half a pile' });
    expect(g.seconds.map(x => x.o.id)).toEqual(options.map(o => o.id));
    expect(boardPicker(s, s.pending).seats[1].res.gold.take).toBe(3);
    const html = renderToStaticMarkup(<GiftCard state={s} gift={g} onFirst={() => {}} onAnswer={() => {}} busy={false} />);
    expect(html).toContain('Take 3 gold from P2 (has 7)');
    expect(html).toContain('Steal half a pile');
    expect(html).toContain('−3');
    expect(html).not.toContain('Take all');
    expect(html).not.toContain('data-left=');
  });
});


it('does not describe original-color theft choices as swaps, including stealing Magenta', () => {
  const state = { resources: ['gold', 'magenta'], players: [{ id: 0 }, { id: 1 }] };
  const change = res => ({ res, followers: 1, members: 0, turns: 0, early: 0, discount: 0, swapped: 0 });
  const a = change({ gold: 1, magenta: 1 }), b = change({ gold: 0, magenta: 2 });
  const pv = { exact: false, tied: true, asks: ['Help Yourself: take 1'], theirAsks: [], you: { res: { gold: [0, 1], magenta: [1, 2] }, followers: [1, 1], members: [0, 0], turns: [0, 0], discount: [0, 0] },
    others: { res: { gold: [-1, 0], magenta: [-1, 0] }, followers: [0, 0], members: [0, 0] }, mix: [a, b], best: a, likely: a };
  expect(youdWords(pv, state, 'magenta')).toEqual({ text: '+1 magenta, +1 follower; steal 1 in colors you pick', note: null });
});
