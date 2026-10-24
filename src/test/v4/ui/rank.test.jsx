// Who's next and who's winning (meta round 2, #7): one ranked line of the engine's followers, the leader lit and the
// margin on hover; and the turns in words on your cult: "your turn in N" (rivals' seats say nothing: Cory dropped "next")
// (Cory, 2026-10-16: the turn-order rail is gone).
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, followers, memberCount, turnRail } from '../../../engine/v4/index.js';
import { rankRows, seatRanks } from '../../../v4/game/RankRow.jsx';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { turnPlaces, seatTurns } from '../../../v4/game/seats.js';
import { turnSequence, currentTurn } from '../../../v4/format.js';
import { contextFor } from '../../../engine/v4/core.js';
import { turnsNow } from '../../../engine/v4/content/purple.js';

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
      const out = { id: r.id, f: Number(tot.dataset.followers), place: Number(tot.dataset.rank), lead: /\blead\b/.test(tot.className), title: tot.title, who: container.querySelector('.cs-who b').textContent };
      cleanup();
      return out;
    });
    expect(shown.map(e => e.f)).toEqual(rows.map(r => r.f));
    // places follow the ranking: never better than an earlier row's, equal only on a full tie
    for (let k = 1; k < shown.length; k++) expect(shown[k].place).toBeGreaterThanOrEqual(shown[k - 1].place);
    expect(shown[0].place).toBe(1);
    expect(shown.map(e => e.place)).toEqual(rows.map(r => ranks[r.id].place));
    const level = rows.every(r => r.f === rows[0].f && r.m === rows[0].m);
    // the leader's total is lit (no place pills: the totals say the rest, the margin is on hover)
    if (level) expect(shown.some(e => e.lead)).toBe(false); else { expect(shown[0].lead).toBe(true); expect(shown.filter(e => e.lead).map(e => e.id)).toEqual(rows.filter(r => ranks[r.id].lead).map(r => r.id)); }
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
    expect(container.querySelector('.cs-total').dataset.rank).toBeUndefined();
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
  });
  it('the seats say the turns in words: "your turn in N" on yours, nothing on a rival\'s (Cory: "next" dropped)', () => {
    let s = until(createGame({ seats, seed: 43 }), t => t.round >= 1 && t.pending && t.pending.kind === 'place' && t.current !== 0);
    const r = turnRail(s);
    const seq = [r.current, ...r.next].filter(p => p != null);
    const k = seq.indexOf(0);
    const want = { 0: k < 0 ? 'done this round' : k === 1 ? '→' : `your turn in ${k}` };
    const words = seatTurns(s, 0);
    expect(Object.fromEntries(Object.entries(words).map(([p, w]) => [p, w.say]))).toEqual(want);
    for (const p of s.players) {
      const { container } = render(<CultSeat state={s} pid={p.id} me={0} mine={p.id === 0} />);
      const el = container.querySelector('.cs-turn');
      expect(el ? el.textContent : null).toBe(want[p.id] ?? null);
      // it explains itself: its own hover card (w2a #28), said to touch and screen readers too
      if (el) expect(el.getAttribute('aria-label')).toMatch(/turn|places|placements/i);
      expect(container.querySelector('.cs-order')).toBeNull();
      cleanup();
    }
    // your own turn: "your turn" ("two turns in a row" when the snake turns on you); no rival's seat says anything
    let t = until(s, x => x.pending && x.pending.kind === 'place' && x.current === 0);
    const tr = turnRail(t);
    const mine = seatTurns(t, 0);
    expect(mine[0].say).toBe(tr.next[0] === 0 ? 'two turns in a row' : 'your turn');
    expect(Object.keys(mine)).toEqual(['0']);
    expect(Object.values(mine).some(w => w.say === 'next' || w.kind === 'next')).toBe(false);
    // before round I and with no viewer: nothing on yours
    expect(seatTurns(createGame({ seats, seed: 42 }), 0)).toEqual({});
    expect(seatTurns(s, null)).toEqual({});
  });
  it('turns taken early (Crunch Time) read as your own turns moved up: not extra, the seats count them right', () => {
    let s = until(createGame({ seats, seed: 43 }), t => t.round >= 1 && t.pending && t.pending.kind === 'place');
    const me = s.current;
    turnsNow(contextFor(s), s.players[me], 2, 'Crunch Time');
    const seq = turnSequence(s);
    expect(seq.filter(t => t.kind === 'extra')).toHaveLength(0); // all 12 are the round's own placements
    expect(seq.filter(t => t.kind === 'snake')).toHaveLength(12);
    expect(seq.slice(0, 3).map(t => t.pid)).toEqual([me, me, me]);
    expect(seq.slice(1, 3).map(t => t.early)).toEqual(['Crunch Time', 'Crunch Time']);
    expect(seatTurns(s, me)[me].say).toBe('two turns in a row');
    expect(turnPlaces(s, me).places[me].title).toMatch(/taken early \(Crunch Time\), not an extra one/);
    // the seat after the early turns counts them right
    const r = turnRail(s);
    const after = r.next.find(p => p !== me);
    expect(seatTurns(s, after)[after].say).toBe(`your turn in ${r.next.indexOf(after) + 1}`);
    // play into the early turn: the headline names Crunch Time, not "extra turn"
    s = until(s, t => t.pending && t.pending.kind === 'place' && (t.turns || []).length === 2);
    expect(s.current).toBe(me);
    const c = currentTurn(s);
    expect(c.again).toBe(true);
    expect(c.early).toBe('Crunch Time');
  });
});
