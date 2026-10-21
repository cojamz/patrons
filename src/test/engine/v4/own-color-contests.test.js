// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createGame, contestTable, memberWeight, contextFor } from '../../../engine/v4/core.js';
import { quadrant, defById } from '../../../engine/v4/content/index.js';
import { standings, bannerText } from '../../../v4/format.js';
import { ruleWords } from '../../../v4/shorts.js';
const seats = ['Ana', 'Bo', 'Cy', 'Di'].map(name => ({ name, kind: 'bot' }));
const arcs = ['blue', 'green', 'purple', 'trading'];
function table(qid) {
  const s = createGame({ seats, seed: 5, quadrants: [qid, 'gold', 'silver', 'yellow'] });
  s.players.forEach(p => { p.members = []; for (const r of s.resources) p.res[r] = 0; });
  return s;
}
describe('own-color arc contests', () => {
  it.each(['red', 'echo', 'thieves', 'market'])('%s uses held resources even when another cult has more printed members', qid => {
    const s = table(qid), resource = quadrant(qid).resource;
    const own = Object.keys(s.cards).map(Number).filter(u => defById(s.cards[u].def).quadrant === qid);
    s.players[0].members = own.slice(0, 4);
    s.players[0].res[resource] = 1;
    s.players[1].res[resource] = 7;
    const row = contestTable(s).find(c => c.qid === qid);
    expect(row.winners).toEqual([1]);
    expect(row.rows.find(r => r.player === 0).count).toBe(1);
    expect(row.rows.find(r => r.player === 1).count).toBe(7);
    expect(row.label.toLowerCase()).toBe(`most ${resource}`);
    const shown = standings(s).find(c => c.qid === qid);
    expect(shown.rule.toLowerCase()).toBe(row.label.toLowerCase());
    expect(shown.leaders).toEqual(row.winners);
    expect(shown.rows.map(r => [r.id, r.shown])).toEqual(row.rows.map(r => [r.player, r.count]));
    expect(bannerText(qid, 1)).not.toContain('MEMBERS');
    expect(ruleWords(qid, row.label)).toBe(`${row.label} resources`);
  });
  it('Magenta follows held resources through ties, spending and empty piles', () => {
    const s = table('thieves');
    s.players[0].members = Object.keys(s.cards).map(Number).filter(u => defById(s.cards[u].def).quadrant === 'thieves');
    s.players[0].res.gold = 99;
    const winners = () => contestTable(s).find(c => c.qid === 'thieves').winners;
    expect(winners()).toEqual([]);
    s.players[1].res.magenta = 8;
    s.players[2].res.magenta = 8;
    expect(winners()).toEqual([1, 2]);
    s.players[1].res.magenta -= 1;
    expect(winners()).toEqual([2]);
    s.players[2].res.magenta = 0;
    expect(winners()).toEqual([1]);
  });
  it.each(arcs)('%s counts own-color printed member quantity, never resources or other colors', qid => {
    const s = table(qid), own = Object.keys(s.cards).map(Number).filter(u => defById(s.cards[u].def).quadrant === qid);
    const foreign = Object.keys(s.cards).map(Number).filter(u => defById(s.cards[u].def).quadrant !== qid);
    s.players[0].members = [own[0]];
    s.players[1].members = foreign.slice(0, 5);
    for (const r of s.resources) s.players[1].res[r] = 99;
    let row = contestTable(s).find(c => c.qid === qid);
    expect(row.winners).toEqual([0]);
    expect(row.rows.find(r => r.player === 0).count).toBe(memberWeight(s, own[0]));
    expect(row.rows.find(r => r.player === 1).count).toBe(0);
    s.players[0].members = own.slice(0, 3);
    const expected = own.slice(0, 3).reduce((n, uid) => n + memberWeight(s, uid), 0);
    row = contestTable(s).find(c => c.qid === qid);
    expect(row.rows.find(r => r.player === 0).count).toBe(expected);
    expect(row.label.toLowerCase()).toBe(`most ${quadrant(qid).resource} members`);
    expect(row.counts).toContain('printed member quantity');
    expect(standings(s).find(c => c.qid === qid).rule.toLowerCase()).toBe(row.label.toLowerCase());
    expect(bannerText(qid, 1)).toContain('MEMBERS');
    expect(ruleWords(qid, row.label)).toBe(row.label);
  });
  it('retains Gold, Silver and Yellow resource/set rules', () => {
    const s = table('red'), ctx = contextFor(s);
    for (const r of s.resources) s.players[0].res[r] = 9;
    s.players[1].members = Object.keys(s.cards).map(Number).slice(0, 8);
    for (const qid of ['gold', 'silver', 'yellow']) {
      expect(quadrant(qid).scoring.score(ctx, s.players[0])).toBe(9);
      expect(quadrant(qid).scoring.score(ctx, s.players[1])).toBe(0);
      expect(contestTable(s).find(c => c.qid === qid).winners).toEqual([0]);
    }
  });
});
