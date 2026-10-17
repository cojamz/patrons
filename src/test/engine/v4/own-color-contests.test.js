// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createGame, contestTable, memberWeight, contextFor } from '../../../engine/v4/core.js';
import { quadrant, defById } from '../../../engine/v4/content/index.js';
import { standings, bannerText } from '../../../v4/format.js';
import { ruleWords } from '../../../v4/shorts.js';
const seats = ['Ana', 'Bo', 'Cy', 'Di'].map(name => ({ name, kind: 'bot' }));
const arcs = ['red', 'blue', 'green', 'market', 'echo', 'purple', 'trading', 'thieves'];
function table(qid) {
  const s = createGame({ seats, seed: 5, quadrants: [qid, 'gold', 'silver', 'yellow'] });
  s.players.forEach(p => { p.members = []; for (const r of s.resources) p.res[r] = 0; });
  return s;
}
describe('own-color arc contests', () => {
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
