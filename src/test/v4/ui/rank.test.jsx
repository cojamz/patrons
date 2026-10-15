// Who's next and who's winning (meta round 2, #7): one ranked line of the engine's followers, the leader lit and the
// margin on hover; and each cult shows its place in what's left of this round's turn order.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, followers, memberCount, turnRail } from '../../../engine/v4/index.js';
import RankRow, { rankRows } from '../../../v4/game/RankRow.jsx';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { turnPlaces } from '../../../v4/game/seats.js';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }, { name: 'Di', kind: 'bot' }];
const until = (s, ok) => { for (let k = 0; k < 800 && !ok(s); k++) s = applyMove(s, chooseBotMove(s, () => 0.35)); return s; };

describe('ranked row', () => {
  it('lists every player by the engine followers (members break ties), leader lit, margin in the title', () => {
    let s = until(createGame({ seats, seed: 41 }), t => t.round >= 2 && t.pending && t.pending.kind === 'place');
    const rows = rankRows(s, 0);
    for (let k = 1; k < rows.length; k++) {
      const a = rows[k - 1], b = rows[k];
      expect(a.f > b.f || (a.f === b.f && a.m >= b.m)).toBe(true);
    }
    for (const r of rows) expect(r.f).toBe(followers(s, s.players[r.id]));
    const { container } = render(<RankRow state={s} me={0} />);
    const shown = [...container.querySelectorAll('[data-rank] .rk')];
    expect(shown.map(e => Number(e.dataset.pid))).toEqual(rows.map(r => r.id));
    expect(shown.map(e => Number(e.dataset.followers))).toEqual(rows.map(r => r.f));
    const level = rows.every(r => r.f === rows[0].f && r.m === rows[0].m);
    if (level) expect(container.querySelector('.rk.lead')).toBeNull(); else expect(shown[0].className).toMatch(/\blead\b/);
    const top = rows[0], second = rows.find(r => r.f < top.f || r.m < top.m);
    if (second && top.f > second.f) expect(shown[0].title).toContain(`by ${top.f - second.f}`);
    for (const e of shown.slice(1)) if (!/\blead\b/.test(e.className)) expect(e.title).toMatch(/behind/);
    expect(container.textContent).toContain('You');
    expect(memberCount(s, s.players[0])).toBeGreaterThanOrEqual(0);
  });
  it('shows nothing before round I', () => {
    const s = createGame({ seats, seed: 42 });
    const { container } = render(<RankRow state={s} me={0} />);
    expect(container.querySelector('[data-rank]')).toBeNull();
  });
});

describe('turn order on the cults', () => {
  it("each cult shows its place in the round's remaining turn order: now, next, 3rd…", () => {
    let s = until(createGame({ seats, seed: 43 }), t => t.round >= 1 && t.pending && t.pending.kind === 'place');
    const r = turnRail(s);
    const order = [];
    for (const p of [r.current, ...r.next]) if (p != null && !order.includes(p)) order.push(p);
    const { places } = turnPlaces(s);
    expect(places[order[0]].label).toBe('now');
    if (order[1] != null) expect(places[order[1]].label).toBe('next');
    if (order[2] != null) expect(places[order[2]].label).toBe('3rd');
    for (const p of s.players) {
      const { container } = render(<CultSeat state={s} pid={p.id} me={0} mine={p.id === 0} />);
      const pill = container.querySelector('.cs-order');
      expect(pill.dataset.order).toBe(places[p.id].label);
      expect(pill.getAttribute('title')).toBeTruthy();
      cleanup();
    }
  });
});
