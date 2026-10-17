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
    for (const [qid, key] of [['purple', 'hourly'], ['silver', 'toast'], ['thieves', 'pickpocket'], ['trading', 'pawn']]) {
      for (const r of [1, 2]) expect(lines(panelText(qid, { key }, r)), `${qid}.${key} round ${r}`).toContain('more each round');
      expect(lines(panelText(qid, { key }, 3)), `${qid}.${key} round III`).not.toContain('more each round');
    }
    // Cheap Seats now pays for held white at the same rate in every round, without a growing cap.
    for (const r of [1, 2, 3]) {
      const cheap = lines(panelText('trading', { key: 'buylow' }, r));
      expect(cheap).toContain('per 3 white you hold');
      expect(cheap.join(' ')).not.toMatch(/limit|more each round|buy/i);
    }
  });

  it('Crescendo and Golden Years say the exact increase instead of an unspecified growing gain', () => {
    for (const [qid, key, color] of [['echo', 'chant', 'green'], ['gold', 'rush', 'gold']]) {
      for (const r of [1, 2, 3]) {
        const t = panelText(qid, { key }, r);
        expect(t.main).toBe(`+${2 * r} ${color}`);
        expect(t.second).toBe(r < 3 ? '+2 each new round' : null);
      }
    }
  });

  it('keeps ownership and copy targets explicit without long inner-ring clauses', () => {
    const ownSpace = panelText('echo', { key: 'refrain' });
    expect(ownSpace.verb).toBe('Copy a space');
    expect(ownSpace.second).toBe('with your minion');
    const allOwn = panelText('echo', { key: 'eternity' });
    expect(allOwn.verb).toBe('Copy every action');
    expect(allOwn.second).toBe('with your minions');
    // "Any" must stay distinct from your own minions, and "previous" from your own previous action.
    expect(panelText('echo', { key: 'encore' }).second).toBe('with a minion');
    expect(panelText('echo', { key: 'echo' }).verb).toBe('Copy previous action');
    // The purple gain counts only your minions, not every piece on the wheel.
    expect(panelText('purple', { key: 'windup' }).second).toBe('per minion you placed');
  });

  it('Trade Seeds shows the gain before the swaps, and Snap Up says the recruit is paid and optional', () => {
    const seeds = panelText('yellow', { key: 'transmute' });
    expect(seeds.main).toBe('+2 yellow');
    expect(seeds.second).toBe('then swap up to 3');
    const snap = panelText('market', { key: 'bargain' });
    expect(snap.second).toBe('may pay for a member');
    expect(snap.note).toBe('in any colors; extra buy');
    expect(panelText('trading', { key: 'pawn' }, 3).second).toBe('or 2 white per @f');
  });

  it('a space whose center or ring II panel drops line 2 is whole in line 1', () => {
    // w3b #18: "Extra turns for all purple" read as a group effect; w3b #19: "Ransom a member" read backwards
    expect(panelText('purple', { key: 'rally' }, 3).verb).toMatch(/^Your next 2 turns, now$/);
    // w4b #5: "A rival's member or its cost" read as "I choose": the rival pays or loses, in line 1
    expect(panelText('thieves', { key: 'ransom' }, 2).verb).toMatch(/^A rival pays a member’s cost, or loses it$/);
    expect(panelText('silver', { key: 'jubilee' }, 3).verb).toMatch(/per 2 silver held/);
    // Shake Down says what the rival pays: the member's cost (f8)
    expect(panelText('thieves', { key: 'ransom' }, 2).verb).toMatch(/pays a member’s cost/);
  });

  it('says 1 of what, what a space costs, and whose cost (live panel r1)', () => {
    // "Others get 1" / "+1 to a rival": 1 of what
    expect(lines(panelText('gold', { key: 'jv' }, 1))).toContain('+1 gold to a rival');
    expect(lines(panelText('gold', { key: 'jv' }, 1)).join(' ')).not.toMatch(/you pick who/);
    expect(lines(panelText('silver', { key: 'toast' }, 2))).toContain('others get 2 silver');
    expect(lines(panelText('silver', { key: 'tide' }, 2))).toContain('others get 1 silver');
    for (const [qid, key, t] of panelEntries()) for (const l of lines(t)) expect(l, `${qid}.${key}`).not.toMatch(/\bget 1$/);
    // Cheap Seats grants followers for held white; it never describes a purchase or payment.
    const cs = panelText('trading', { key: 'buylow' }, 2);
    expect(cs.main).toBe('+1 @f');
    expect(cs.second).toBe('per 3 white you hold');
    expect(lines(cs).join(' ')).not.toMatch(/buy|spend|resource each/i);
    // Show Off: half a member's cost, never "half your priciest" alone (read as half your biggest pile); whole in line 1
    expect(panelText('market', { key: 'pricecheck' }, 2).verb).toMatch(/^Gain half your priciest member’s cost$/);
  });

  it('a space that pays per something shows this turn\'s gain big, its rate small (round 3 skeptic: Bandwagon "+1" paid +5)', () => {
    const s = createGame({ seats: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'bot' }], seed: 5, quadrants: ['market', 'red', 'gold', 'purple'] });
    s.recruits = 5;
    const t = panelText('red', quadrant('red').actions.find(x => x.key === 'turnout'), 1, s, 0);
    expect(t.main).toBe('+5 red');
    expect(t.second).toBe('1 per recruit by all');
    // Tithe: +1 gold per member you have, for the viewer
    const w = panelText('gold', quadrant('gold').actions.find(x => x.key === 'windfall'), 2, s, 0);
    expect(w.main).toBe(`+${s.players[0].members.length} gold`);
    // without a table: the printed rule
    expect(panelText('red', { key: 'turnout' }, 1).main).toBe('+1 red');
  });

  it('Name Drop prints this turn\'s real payout big, with its rule small under it (f8)', () => {
    const s = createGame({ seats: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'bot' }], seed: 5, quadrants: ['market', 'red', 'gold', 'yellow'] });
    const a = quadrant('market').actions.find(x => x.key === 'showroom');
    const blue = s.shop.filter(u => cardDef(s, u).quadrant === 'market').length;
    const t = panelText('market', a, 1, s);
    expect(t.main).toBe(`+${1 + blue} blue`);
    expect(t.second).toBe('1, +1 per blue in the shop');
    // without a table (the decipher table, the strip) it's the printed rule
    expect(panelText('market', a, 1).main).toBe('+1 blue');
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
    // ...the amount hangs on your own pick of member too, so it's "up to" (aminus r1 #3: "+4" read as promised, paid +2)
    expect(seen.ransom.likely).toMatch(/^up to \+\d+ (magenta|member)/);
    expect(seen.ransom.best).toMatch(/^\+\d+ (magenta|member)/);
    expect(seen.ransom.best).not.toBe(seen.ransom.likely);
    // every pick worth the same: the two ends of the mix
    expect(seen.pawn.text).toMatch(/^\+\d+ followers? or \+\d+ white$/);
    // your pick: your best pick's numbers
    // your pick: the best pick's gains as "up to", never a promise (w4 skeptic #10)
    expect(seen.sellhigh).toEqual({ text: expect.stringMatching(/^up to \+\d+ white, −\d+ followers?$/), note: 'your pick' });
    // one color of your choosing
    expect(seen.gift.text).toMatch(/\+2 of a color you pick$/);
    for (const y of Object.values(seen)) expect(JSON.stringify(y)).not.toMatch(/depends on|−-/);
  }, 120000);
});
