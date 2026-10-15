// Who's next and who's winning (meta round 2, #7): one ranked line of the engine's followers, the leader lit and the
// margin on hover; and each cult shows its place in what's left of this round's turn order.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, followers, memberCount, turnRail } from '../../../engine/v4/index.js';
import { rankRows, seatRanks } from '../../../v4/game/RankRow.jsx';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { turnPlaces } from '../../../v4/game/seats.js';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }, { name: 'Di', kind: 'bot' }];
const until = (s, ok) => { for (let k = 0; k < 800 && !ok(s); k++) s = applyMove(s, chooseBotMove(s, () => 0.35)); return s; };

describe('who is winning, on the chairs (no score row, Cory 2026-10-15)', () => {
  it('each chair shows its place by the engine followers (members break ties), the leader lit, the margin on hover', () => {
    let s = until(createGame({ seats, seed: 41 }), t => t.round >= 2 && t.pending && t.pending.kind === 'place');
    const rows = rankRows(s, 0);
    for (let k = 1; k < rows.length; k++) {
      const a = rows[k - 1], b = rows[k];
      expect(a.f > b.f || (a.f === b.f && a.m >= b.m)).toBe(true);
    }
    for (const r of rows) expect(r.f).toBe(followers(s, s.players[r.id]));
    const ranks = seatRanks(s, 0);
    const shown = rows.map(r => {
      const { container } = render(<CultSeat state={s} pid={r.id} me={0} mine={r.id === 0} />);
      const tot = container.querySelector('.cs-total');
      const out = { id: r.id, f: Number(tot.dataset.followers), place: Number(tot.dataset.rank), lead: /\blead\b/.test(tot.className), title: tot.querySelector('[data-rank] .rk, .rk').title, text: tot.querySelector('.rk').textContent, who: container.querySelector('.cs-who b').textContent };
      cleanup();
      return out;
    });
    expect(shown.map(e => e.f)).toEqual(rows.map(r => r.f));
    // places follow the ranking: never better than an earlier row's, equal only on a full tie
    for (let k = 1; k < shown.length; k++) expect(shown[k].place).toBeGreaterThanOrEqual(shown[k - 1].place);
    expect(shown[0].place).toBe(1);
    expect(shown.map(e => e.place)).toEqual(rows.map(r => ranks[r.id].place));
    const level = rows.every(r => r.f === rows[0].f && r.m === rows[0].m);
    if (level) expect(shown.some(e => e.lead)).toBe(false); else expect(shown[0].lead).toBe(true);
    const top = rows[0], second = rows.find(r => r.f < top.f || r.m < top.m);
    if (second && top.f > second.f) expect(shown[0].title).toContain(`by ${top.f - second.f}`);
    for (const e of shown.slice(1)) if (!e.lead) expect(e.title).toMatch(/behind/);
    expect(shown.find(e => e.id === 0).who).toBe('You');
    expect(memberCount(s, s.players[0])).toBeGreaterThanOrEqual(0);
  });
  it('shows no place before round I', () => {
    const s = createGame({ seats, seed: 42 });
    expect(seatRanks(s, 0)).toEqual({});
    const { container } = render(<CultSeat state={s} pid={0} me={0} mine />);
    expect(container.querySelector('.cs-total [data-rank], .cs-total .rk')).toBeNull();
  });
});

describe('turn order on the cults', () => {
  it("each cult shows its next placement, counting the snake's double: now, next, in N, done", () => {
    let s = until(createGame({ seats, seed: 43 }), t => t.round >= 1 && t.pending && t.pending.kind === 'place');
    const r = turnRail(s);
    const seq = [r.current, ...r.next].filter(p => p != null);
    const { places } = turnPlaces(s);
    for (const p of s.players) {
      const k = seq.indexOf(p.id);
      expect(places[p.id].label).toBe(k < 0 ? 'done' : k === 0 ? 'now' : k === 1 ? 'next' : `in ${k}`);
      expect(places[p.id].twice).toBe(k >= 0 && seq[k + 1] === p.id);
    }
    // at a snake turnaround the seat that ends the pass places twice: its chip says so, and NEXT is that same seat
    let t = s;
    for (let n = 0; n < 200 && !(t.pending && t.pending.kind === 'place' && turnRail(t).next[0] === t.current); n++) t = applyMove(t, chooseBotMove(t, () => 0.35));
    const tp = turnPlaces(t);
    expect(tp.places[t.current].label).toBe('now');
    expect(tp.places[t.current].twice).toBe(true);
    expect(tp.places[t.current].title).toMatch(/snake order/);
    expect(Object.values(tp.places).filter(x => x.label === 'next')).toHaveLength(0);
    for (const p of s.players) {
      const { container } = render(<CultSeat state={s} pid={p.id} me={0} mine={p.id === 0} />);
      const pill = container.querySelector('.cs-order');
      expect(pill.dataset.order).toBe(places[p.id].label);
      expect(pill.getAttribute('title')).toBeTruthy();
      cleanup();
    }
  });
});
