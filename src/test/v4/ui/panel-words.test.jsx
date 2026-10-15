// The words on the wheel and in a space's hover, as a newcomer reads them (design/eval/words/decipher-w3.md, from wave
// 3's blind testers). Guards what was fixed: no rulebook jargon on a panel, a gain that grows says so, and "You'd get"
// gives numbers when a pick decides it ("it depends on your pick / a rival decides part of it" was empty, w3b #20).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, previewSpace, quadrant, allQuadrantIds } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { panelText, panelEntries } from '../../../v4/game/panelText.js';
import { youdWords } from '../../../v4/game/Info.jsx';

const lines = t => [t.main, t.verb, t.second, t.note].filter(Boolean);

describe('panel words (w3)', () => {
  it('no word a newcomer has to look up or misreads: loose, ransom, redo, on sale, per round number', () => {
    for (const [qid, key, t] of panelEntries()) for (const l of lines(t)) expect(l, `${qid}.${key}`).not.toMatch(/\b(loose|ransom|redo|on sale|round number|anyone)\b/i);
    // the hover's rule sentence says a run by rounds in words ("+2 in round I, +4 in round II…"), never "per round number"
    for (const id of allQuadrantIds()) for (const a of quadrant(id).actions) expect(a.text, a.id).not.toMatch(/per round number/i);
  });

  it('a gain that grows by round says so in rounds I and II, and not in III (w3a #54: "+2●" read as flat)', () => {
    for (const [qid, key] of [['gold', 'rush'], ['purple', 'hourly'], ['echo', 'chant'], ['silver', 'toast'], ['thieves', 'pickpocket'], ['trading', 'buylow'], ['trading', 'pawn']]) {
      for (const r of [1, 2]) expect(lines(panelText(qid, { key }, r)), `${qid}.${key} round ${r}`).toContain('more each round');
      expect(lines(panelText(qid, { key }, 3)), `${qid}.${key} round III`).not.toContain('more each round');
    }
  });

  it('a space whose center or ring II panel drops line 2 is whole in line 1', () => {
    // w3b #18: "Extra turns for all purple" read as a group effect; w3b #19: "Ransom a member" read backwards
    expect(panelText('purple', { key: 'rally' }, 3).verb).toMatch(/your purple for 2 extra turns/);
    expect(panelText('thieves', { key: 'ransom' }, 2).verb).toMatch(/member or its cost/);
    expect(panelText('silver', { key: 'jubilee' }, 3).verb).toMatch(/per 2 silver held/);
  });

  it('"You\'d get" says the likely and the best case, or the best pick, or the mix, in numbers', () => {
    const q = ['thieves', 'trading', 'purple', 'silver'];
    const seen = { ransom: null, pawn: null, sellhigh: null, gift: null };
    for (let seed = 1; seed < 40 && Object.values(seen).some(v => !v); seed++) {
      let s = createGame({ seats: [0, 1, 2, 3].map(i => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: q });
      const rand = seededRandom(seed);
      for (let n = 0; n < 2500 && !s.over; n++) {
        if (s.pending.kind === 'place' && s.round >= 2) {
          for (const o of s.pending.options.filter(x => x.kind === 'slot')) {
            const a = quadrant(s.quadrants[o.q]).actions[o.i];
            if (!(a.key in seen) || seen[a.key]) continue;
            const pv = previewSpace(s, s.pending.player, o.q, o.i);
            if (!pv || pv.exact) continue;
            const y = youdWords(pv, s, quadrant(s.quadrants[o.q]).resource);
            if (a.key === 'ransom' && y.likely) seen.ransom = y;
            if (a.key !== 'ransom') seen[a.key] = y;
          }
        }
        s = applyMove(s, chooseBotMove(s, rand));
      }
    }
    // a rival decides (pay, or lose the member): the likely case and the best case, both in numbers, and not the same
    expect(seen.ransom.likely).toMatch(/^\+\d+ (magenta|member)/);
    expect(seen.ransom.best).toMatch(/^\+\d+ (magenta|member)/);
    expect(seen.ransom.best).not.toBe(seen.ransom.likely);
    // every pick worth the same: the two ends of the mix
    expect(seen.pawn.text).toMatch(/^\+\d+ followers? or \+\d+ white$/);
    // your pick: your best pick's numbers
    expect(seen.sellhigh).toEqual({ text: expect.stringMatching(/^\+\d+ white, −\d+ followers?$/), note: 'your best pick' });
    // one color of your choosing
    expect(seen.gift.text).toMatch(/\+2 of a color you pick$/);
    for (const y of Object.values(seen)) expect(JSON.stringify(y)).not.toMatch(/depends on|−-/);
  }, 120000);
});
