// A rule that grows by round reads as "I: … / II: … / III: …" lines, this round lit and the others dimmed (Cory,
// 2026-10-18), in the space's hover, the member card and the seat's member list. The lines come from the def's byRound;
// its text stays the rule.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, allQuadrantIds, quadrant, defById } from '../../../engine/v4/index.js';
import { guestMembers } from '../../../engine/v4/content/index.js';
import { RuleText, MemberCard } from '../../../v4/game/Info.jsx';
import { memberRows } from '../../../v4/game/memberUse.js';

afterEach(cleanup);
const GROWS = /× round|in round I\b|per round number/i;
const everything = () => [
  ...allQuadrantIds().flatMap(id => [...quadrant(id).actions.map(a => [`${id}.${a.key}`, a]), ...(quadrant(id).members || []).map(m => [`${id}.${m.key}`, m])]),
  ...guestMembers().map(m => [m.id || m.key, m]),
];

describe('rules that grow by round', () => {
  it('every space and member whose rule grows by round has its three lines', () => {
    const found = everything().filter(([, d]) => GROWS.test(d.text || ''));
    expect(found.length).toBeGreaterThanOrEqual(10);
    for (const [id, d] of found) {
      expect(d.byRound, id).toBeTruthy();
      expect(d.byRound.lines, id).toHaveLength(3);
    }
  });

  it('the lines say what the space pays in each round', () => {
    const num = l => Number(l.match(/\d+/)[0]);
    for (const [qid, key] of [['gold', 'rush'], ['red', 'turnout'], ['purple', 'hourly'], ['echo', 'chant']]) {
      const a = quadrant(qid).actions.find(x => x.key === key);
      for (const r of [1, 2, 3]) expect(num(a.byRound.lines[r - 1]), `${qid}.${key} round ${r}`).toBe(a.estimate({ state: { round: r } }));
    }
  });

  it('the hover lights this round and dims the others', () => {
    const a = quadrant('gold').actions.find(x => x.key === 'rush');
    const { container } = render(<RuleText def={a} round={2} />);
    const lines = [...container.querySelectorAll('[data-round-line]')];
    expect(lines.map(l => l.textContent.replace(/\s+/g, ''))).toEqual(['I:+2', 'II:+4', 'III:+6']);
    expect(lines.map(l => l.classList.contains('now'))).toEqual([false, true, false]);
    expect(lines[1].getAttribute('aria-current')).toBe('true');
    expect(container.querySelector('[data-by-round]').dataset.byRound).toBe('2');
  });

  it('a rule that doesn’t grow reads as its text', () => {
    const a = quadrant('gold').actions.find(x => x.key === 'discount');
    const { container } = render(<RuleText def={a} round={2} />);
    expect(container.querySelector('[data-by-round]')).toBeNull();
    expect(container.textContent).toMatch(/costs 4 less/);
  });

  it('the member card and the seat list show the lines (lead, then rounds)', () => {
    const s = createGame({ seats: [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }], seed: 3, quadrants: ['gold', 'market', 'red', 'echo'] });
    const c = Object.values(s.cards).find(x => x.def === 'market.planner');
    s.round = 3;
    const { container } = render(<MemberCard state={s} uid={c.uid} />);
    expect(container.querySelector('.br-lead').textContent).toMatch(/your next member costs/);
    expect([...container.querySelectorAll('[data-round-line].now')].map(l => l.dataset.roundLine)).toEqual(['3']);
    cleanup();
    s.shop = s.shop.filter(u => u !== c.uid); s.pile = s.pile.filter(u => u !== c.uid);
    s.players[0].members.push(c.uid);
    const row = memberRows(s, 0, 0).find(r => r.def.id === 'market.planner');
    expect(row.byRound.def).toBe(defById('market.planner'));
    expect(row.text).toMatch(/per round number/); // the text is still the whole rule
  });
});
