// The end-game scoring (FinalScore.jsx; taste rule 11): every pop traces to the engine's count. The leader's followers,
// each member's people and what members grant at game end add up to each player's final total, in finished games with
// and without end-game bonuses, and the engine names the member behind every bonus (p.final.cards).
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, followers, cardDef } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { scoreSteps, finalGrants, BEATS } from '../../../v4/game/finalScore.js';
import { reckonSteps, unpaidFollowers } from '../../../v4/game/Reckoning.jsx';
import FinalScore, { plan } from '../../../v4/game/FinalScore.jsx';
import CultSeat from '../../../v4/game/CultSeat.jsx';

afterEach(cleanup);
const finish = (seed, n = 4) => {
  const rand = seededRandom(seed);
  const seats = ['Ana', 'Bo', 'Cy', 'Di'].slice(0, n).map(name => ({ name, kind: 'bot' }));
  let s = createGame({ seats, seed });
  for (let k = 0; k < 4000 && !s.over; k++) s = applyMove(s, chooseBotMove(s, rand));
  return s;
};
const games = [3, 5, 8, 13, 21, 34].map(seed => finish(seed, seed % 2 ? 4 : 3));

describe('end-game scoring pops', () => {
  it('add up to each player\'s final total, beat by beat in order', () => {
    for (const s of games) {
      expect(s.over).toBe(true);
      for (const p of s.players) {
        const steps = scoreSteps(s, p);
        expect(steps.reduce((t, x) => t + x.n, 0)).toBe(followers(s, p));
        // followers first, then members, then grants
        const order = steps.map(x => BEATS.indexOf(x.beat));
        expect([...order].sort((a, b) => a - b)).toEqual(order);
        // every member worth something pops once, over its own head
        expect(steps.filter(x => x.beat === 'members').map(x => x.uid).sort()).toEqual(p.members.filter(u => cardDef(s, u).f !== 0).sort());
      }
    }
  });

  it('pops each end-game bonus over the member that scored it', () => {
    const withBonus = games.filter(s => s.players.some(p => p.final.total));
    expect(withBonus.length).toBeGreaterThan(0);
    for (const s of withBonus) for (const p of s.players) {
      const g = finalGrants(s, p);
      expect(g.reduce((t, x) => t + x.n, 0)).toBe(p.final.total);
      for (const x of g) {
        expect(p.members).toContain(x.uid);
        expect(p.final.parts).toContain(`${x.name} ${x.n > 0 ? '+' : '−'}${Math.abs(x.n)}`);
      }
      // an old save without final.cards reads the same grants from the parts' names
      const old = { ...p, final: { total: p.final.total, parts: p.final.parts } };
      expect(finalGrants(s, old).map(x => [x.name, x.n])).toEqual(g.map(x => [x.name, x.n]));
    }
  });

  it('plans pops that sum to each total, seats in step, one beat after another', () => {
    for (const s of games) {
      const order = s.ranking;
      const pops = plan(s, order, () => null);
      for (const pid of order) expect(pops.filter(p => p.pid === pid).reduce((t, p) => t + p.n, 0)).toBe(followers(s, s.players[pid]));
      const at = pops.map(p => p.at);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
      for (let k = 1; k < pops.length; k++) if (pops[k].beat !== pops[k - 1].beat) expect(BEATS.indexOf(pops[k].beat)).toBeGreaterThan(BEATS.indexOf(pops[k - 1].beat));
    }
  });

  it('shows the final totals and lights the winner when motion is off', () => {
    const s = games[0];
    const { container } = render(<FinalScore state={s} me={0} hover={null} onPick={() => {}} CultSeat={CultSeat} />);
    expect(container.querySelector('.over-cults').dataset.scored).toBe('done');
    for (const el of container.querySelectorAll('.over-seat')) {
      const pid = Number(el.dataset.pid);
      expect(Number(el.dataset.final)).toBe(followers(s, s.players[pid]));
      expect(el.querySelector('.cs-total').dataset.followers).toBe(String(followers(s, s.players[pid])));
    }
    expect(container.querySelectorAll('.over-seat.won').length).toBeGreaterThan(0);
  });
  it('pays end-game grants after contests, with totals changing only as each award arrives', () => {
    const s = games.find(s => s.players.some(p => p.final.total));
    const info = { result: { round: 'III', rows: [] }, after: s, board: s };
    const steps = reckonSteps(info);
    const firstBonus = steps.findIndex(r => r.kind === 'bonus');
    expect(firstBonus).toBeGreaterThan(0);
    expect(steps.slice(firstBonus).every(r => r.kind === 'bonus')).toBe(true);
    for (const p of s.players) {
      const bonus = steps.filter(r => r.kind === 'bonus' && r.pid === p.id);
      expect(bonus.reduce((n, r) => n + r.prize, 0)).toBe(p.final.total);
      for (const row of bonus) {
        expect(p.members).toContain(row.uid);
        expect(row.rule).toBe(finalGrants(s, p).find(g => g.uid === row.uid).name);
      }
    }
    for (let paid = 0; paid <= steps.length; paid++) {
      const unpaid = unpaidFollowers(info, paid);
      for (const p of s.players) {
        const landed = steps.slice(0, paid).filter(r => r.winners.includes(p.id)).reduce((n, r) => n + r.prize, 0);
        const all = steps.filter(r => r.winners.includes(p.id)).reduce((n, r) => n + r.prize, 0);
        expect(followers(s, p) - (unpaid[p.id]?.bonus || 0)).toBe(followers(s, p) - all + landed);
      }
    }
    expect(unpaidFollowers(info, steps.length)).toEqual({});
  });

  it('keeps the results totals final after the round-scoring sequence', () => {
    const s = games[0];
    const { container } = render(<FinalScore animate={false} state={s} me={0} hover={null} onPick={() => {}} CultSeat={CultSeat} />);
    expect(container.querySelector('.over-cults').dataset.scored).toBe('done');
    expect(container.querySelectorAll('[data-score-pop]').length).toBe(0);
    for (const el of container.querySelectorAll('.over-seat')) {
      const pid = Number(el.dataset.pid);
      expect(el.querySelector('.cs-total').dataset.followers).toBe(String(followers(s, s.players[pid])));
    }
  });

});
