// The words on the wheel and in a space's hover, as a newcomer reads them (design/eval/words/decipher-w3.md, from wave
// 3's blind testers). Guards what was fixed: no rulebook jargon on a panel, a gain that grows says so, and "You'd get"
// gives numbers when a pick decides it ("it depends on your pick / a rival decides part of it" was empty, w3b #20).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, previewSpace, quadrant, allQuadrantIds, cardDef } from '../../../engine/v4/index.js';
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
    // a space that does more than one thing says what grows (Cory, 2026-10-22)
    // the space's schedule by round, never "more each round" or "+4 next round" (Cory, Oct 24: both misread; /card-words)
    for (const [qid, key, says] of [['silver', 'toast', 'I\u00a0+3\u00a0· II\u00a0+6\u00a0· III\u00a0+9'], ['thieves', 'pickpocket', 'I\u00a03\u00a0· II\u00a04\u00a0· III\u00a05'], ['trading', 'pawn', 'I\u00a0+1\u00a0· II\u00a0+2\u00a0· III\u00a0+3']]) {
      for (const r of [1, 2, 3]) expect(lines(panelText(qid, { key }, r)), `${qid}.${key} round ${r}`).toContain(says);
      expect(lines(panelText(qid, { key }, 2)).join(' ')).not.toMatch(/next round|each round/);
    }
    // Cheap Seats now pays for held white at the same rate in every round, without a growing cap.
    for (const r of [1, 2, 3]) {
      const cheap = lines(panelText('trading', { key: 'buylow' }, r));
      expect(cheap).toContain('per 3 white you hold');
      expect(cheap.join(' ')).not.toMatch(/limit|more each round|buy/i);
    }
  });

  it('Build Up includes the inherent green gain; Golden Years shows this round\'s number, like its rule', () => {
    for (const r of [1, 2, 3]) {
      expect(panelText('echo', { key: 'chant' }, r).main).toBe(`+${r + 2} green`);
      const gold = panelText('gold', { key: 'rush' }, r);
      // "+2 gold × round" made a round III player do the math (text review, 2026-10-23)
      expect(gold.main).toBe(`+${2 * r} gold`);
      expect(gold.second).toBe('I\u00a0+2\u00a0· II\u00a0+4\u00a0· III\u00a0+6');
    }
  });

  it('keeps ownership and copy targets explicit without long inner-ring clauses', () => {
    const ownSpace = panelText('echo', { key: 'refrain' });
    expect(ownSpace.verb).toBe('Copy an action');
    expect(ownSpace.second).toBe('with your minion');
    const allOwn = panelText('echo', { key: 'eternity' });
    expect(allOwn.verb).toBe('Copy every action');
    expect(allOwn.second).toBe('with your minions');
    // Rival and own minions are distinct, as are the previous action and your own last action.
    expect(panelText('echo', { key: 'encore' }).second).toBe('with a rival minion');
    expect(panelText('echo', { key: 'echo' }).verb).toBe('Copy previous action');
    // The purple gain counts only your minions, not every piece on the wheel.
    expect(panelText('purple', { key: 'windup' }).second).toBe('per minion you placed');
  });

  it('Trade Seeds shows the gain before the swaps, and Churn its round gain before the 3 it sends', () => {
    const seeds = panelText('yellow', { key: 'transmute' });
    expect(seeds.main).toBe('+2 yellow');
    expect(seeds.second).toBe('then swap up to 3');
    // Churn became Savings in the round I rework (Oct 27): no sweep, +3/+4/+5
    const savings = panelText('market', { key: 'bargain' }, 2);
    expect(savings.main).toBe('+4 blue');
    expect(savings.second).toBe('I\u00a0+3\u00a0· II\u00a0+4\u00a0· III\u00a0+5');
    expect(panelText('trading', { key: 'pawn' }, 3).second).toBe('or 2 white per @f');
  });

  it('a space whose center or ring II panel drops line 2 is whole in line 1', () => {
    // w3b #18: "Extra turns for all purple" read as a group effect; w3b #19: "Ransom a member" read backwards
    expect(panelText('purple', { key: 'rally' }, 3).verb).toMatch(/^Two turns after this one$/);
    // w4b #5: "A rival's member or its cost" read as "I choose": the rival pays or loses, in line 1
    // shortened to fit on phones (v0.8.8 Magenta, 68c9bf0f): line 1 still says the rival decides, pay or lose
    expect(panelText('thieves', { key: 'ransom' }, 2).verb).toMatch(/^Rival pays or loses a member$/);
    expect(panelText('silver', { key: 'jubilee' }, 3).verb).toMatch(/per silver the richest rival holds/);
    // Shake Down's line 2 is the limit (Cory's wording pass, 2026-10-21; line 1 says the rival pays or loses it)
    expect(panelText('thieves', { key: 'ransom' }, 2).second).toBe('costing 5 or less');
  });

  it('says 1 of what, what a space costs, and whose cost (live panel r1)', () => {
    // "Others get 1" / "+1 to a rival": 1 of what
    expect(lines(panelText('gold', { key: 'jv' }, 1))).toContain('+1 gold to a rival');
    expect(lines(panelText('gold', { key: 'jv' }, 1)).join(' ')).not.toMatch(/you pick who/);
    expect(lines(panelText('silver', { key: 'toast' }, 2))).toContain('others get 2 silver');
    expect(lines(panelText('silver', { key: 'tide' }, 2))).toContain('others get 2 silver');
    for (const [qid, key, t] of panelEntries()) for (const l of lines(t)) expect(l, `${qid}.${key}`).not.toMatch(/\bget 1$/);
    // Cheap Seats grants followers for held white; it never describes a purchase or payment.
    const cs = panelText('trading', { key: 'buylow' }, 2);
    expect(cs.main).toBe('+1 @f');
    expect(cs.second).toBe('per 3 white you hold');
    expect(lines(cs).join(' ')).not.toMatch(/buy|spend|resource each/i);
    // Bury: what it does in line 1, what it pays in line 2 ("half its cost": the member's, never your pile's)
    const bury = panelText('market', { key: 'pricecheck' }, 2);
    expect(bury.verb).toBe('Bury a shop member');
    expect(bury.second).toBe('gain half its cost in blue');
  });

  it('Gather follows the round while Tithe counts the viewer’s members', () => {
    const s = createGame({ seats: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'bot' }], seed: 5, quadrants: ['market', 'red', 'gold', 'purple'] });
    s.recruits = 5;
    const t = panelText('red', quadrant('red').actions.find(x => x.key === 'turnout'), 1, s, 0);
    expect(t.main).toBe('+3 red');
    expect(t.second).toBe('I\u00a0+3\u00a0· II\u00a0+4\u00a0· III\u00a0+5');
    // Tithe: +1 gold per member you have, for the viewer
    const w = panelText('gold', quadrant('gold').actions.find(x => x.key === 'windfall'), 2, s, 0);
    expect(w.main).toBe(`+${s.players[0].members.length} gold`);
    // without a table: the printed rule
    expect(panelText('red', { key: 'turnout' }, 1).main).toBe('+3 red');
  });

  // Build Up (Oct 27): every color's 3/4/5
  it('Build Up prints its round gain', () => {
    const s = createGame({ seats: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'bot' }], seed: 5, quadrants: ['gold', 'echo'] });
    const a = quadrant('echo').actions.find(x => x.key === 'chant');
    expect(panelText('echo', a, 1, s, 0).main).toBe('+3 green');
    for (const r of [1, 2, 3]) expect(panelText('echo', a, r).main).toBe(`+${r + 2} green`);
  });

  it('Spree prints its blue and says it is 3 buys (Name Drop, the live-payout space, left with Blue\'s Oct 20 rework)', () => {
    const a = quadrant('market').actions.find(x => x.key === 'spree');
    const t = panelText('market', a, 3);
    expect([t.verb, t.second, t.note]).toEqual(['Recruit 3 times', 'this turn', '+3 blue']);
  });

  it('"You\'d get" says the likely and the best case, or the best pick, or the mix, in numbers', () => {
    const q = ['thieves', 'trading', 'purple', 'silver'];
    const seen = { ransom: null, gift: null };
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
    // ...the amount hangs on your own pick of member too, so it's "up to" (aminus r1 #3: "+4" read as promised, paid +2)
    expect(seen.ransom.likely).toMatch(/^up to \+\d+ (magenta|member)/);
    expect(seen.ransom.best).toMatch(/^\+\d+ (magenta|member)/);
    expect(seen.ransom.best).not.toBe(seen.ransom.likely);
    // one color of your choosing
    expect(seen.gift.text).toMatch(/\+2 of a color you pick$/);
    for (const y of Object.values(seen)) expect(JSON.stringify(y)).not.toMatch(/depends on|−-/);
  }, 120000);
});
