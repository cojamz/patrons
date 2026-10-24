// The seat's "each round" line is a dry run of next round's start, so conditional income read as guaranteed (f8):
// Late Bloomers showed +1 every round, and Clockmaker's +2 fell to +1 after a steal with no word why. A part that
// hangs on a condition now says it ("if fewest", "per 2 purple"), and the hover gives each member's rule.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, memberCount } from '../../../engine/v4/index.js';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { incomeTerms, incomeCondition } from '../../../v4/game/build.js';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const quadrants = ['purple', 'yellow', 'gold', 'red'];
const toPlace = s => { let t = s; for (let k = 0; k < 400 && !(t.pending && t.pending.kind === 'place' && t.round >= 1); k++) t = applyMove(t, chooseBotMove(t, () => 0.3)); return t; };
const give = (s, pid, def) => { const c = Object.values(s.cards).find(x => x.def === def); s.shop = s.shop.filter(u => u !== c.uid); s.pile = s.pile.filter(u => u !== c.uid); s.players[pid].members.push(c.uid); return c; };

describe('seat income says its conditions', () => {
  it('Clockmaker scales: "per 2 purple", with what you hold in the hover; Banker stays bare', () => {
    const s = toPlace(createGame({ seats, seed: 4, quadrants }));
    give(s, 0, 'purple.clockmaker');
    give(s, 0, 'gold.banker');
    s.players[0].res.purple = 4;
    const t = incomeTerms(s, s.players[0]);
    const purple = t.groups.find(g => g.parts.some(([r]) => r === 'purple'));
    expect(purple.cond).toBe('per 2 purple');
    expect(purple.parts.find(([r]) => r === 'purple')[1]).toBe(2);
    expect(t.groups.find(g => g.parts.some(([r]) => r === 'gold')).cond).toBeNull();
    expect(t.sources.find(x => x.name === 'Clockmaker').hold).toBe('4 purple held now');

    // after a steal the number drops, and the line still says why it moves
    const s2 = structuredClone(s); // a new state, as every move makes (the dry run is cached per state)
    s2.players[0].res.purple = 2;
    const after = incomeTerms(s2, s2.players[0]);
    const p2 = after.groups.find(g => g.parts.some(([r]) => r === 'purple'));
    expect(p2.parts.find(([r]) => r === 'purple')[1]).toBe(1);
    expect(p2.cond).toBe('per 2 purple');

    const { container } = render(<CultSeat state={s2} pid={0} me={0} mine />);
    expect(container.querySelector('.cs-income')).toBeNull();
    expect(container.querySelector('[data-member="purple.clockmaker"]')).not.toBeNull();
  });

  it('Late Bloomers is never shown as a sure +1: every part it touches says "if fewest"', () => {
    const s = toPlace(createGame({ seats, seed: 6, quadrants }));
    give(s, 0, 'yellow.latebloomer');
    for (const p of s.players.slice(1)) p.bonus = (p.bonus || 0) + 5; // Ana has the fewest followers
    const t = incomeTerms(s, s.players[0]);
    expect(t).not.toBeNull();
    const parts = t.groups.flatMap(g => g.parts.map(([r]) => [r, g.cond]));
    expect(parts.length).toBe(s.resources.length);
    for (const [, cond] of parts) expect(cond).toBe('if fewest');
    const { container } = render(<CultSeat state={s} pid={0} me={0} mine />);
    expect(container.querySelector('.cs-income')).toBeNull();
    expect(container.querySelector('[data-member="yellow.latebloomer"]')).not.toBeNull();
  });

  it('a member that always pays the same has no condition; an unknown "if" or "per" still gets one', () => {
    expect(incomeCondition({ key: 'banker', text: 'Now and at round start, +3 gold.' })).toBeNull();
    expect(incomeCondition({ key: 'zz', text: 'Now and at round start, if you lead, +2 red.' })).toBe('not always');
    expect(incomeCondition({ key: 'zz', text: 'Now and at round start, +1 red per member.' })).toBe('varies');
  });

  // live panel r1 (G4): a seat's "each round +3" named no member: Heir pays "at the start of round III", which the
  // round-start test missed, so the hover had no source
  it('Heir (round III only) is named as the source of its silver, "per member"', () => {
    const s = toPlace(createGame({ seats, seed: 4, quadrants: ['silver', 'yellow', 'gold', 'red'] }));
    s.round = 2;
    give(s, 0, 'silver.heir');
    const t = incomeTerms(structuredClone(s), s.players[0]);
    expect(t, 'Heir pays at the start of round III').not.toBeNull();
    expect(t.sources.map(x => x.name)).toContain('Heir');
    expect(t.groups.find(g => g.parts.some(([r]) => r === 'silver')).cond).toBe('per member');
  });

  // live panel r1 (G4): "+N more" hid members, so the "Most members" prize couldn't be counted off the seats
  it('seats show weighted member counts and keep individual figures accessible', () => {
    const s = toPlace(createGame({ seats, seed: 4, quadrants }));
    for (const c of Object.values(s.cards).filter(x => s.pile.includes(x.uid)).slice(0, 14)) give(s, 1, c.def);
    const { container } = render(<CultSeat state={s} pid={1} me={0} />);
    expect(container.querySelector('.cs-member-count').textContent).toBe(`${memberCount(s, s.players[1])} members`);
    expect(container.querySelector('.lt-cult-seat').getAttribute('aria-label')).toContain(`${memberCount(s, s.players[1])} members`);
    expect(container.querySelectorAll('.cs-member').length).toBeGreaterThan(6);
    // a rival's figures are off the keyboard's path (their seat's head opens the card listing them)
    for (const f of container.querySelectorAll('.cs-member .fig')) expect(f.getAttribute('tabindex')).toBe('-1');
  });
});
