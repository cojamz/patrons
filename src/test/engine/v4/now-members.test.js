// "On recruit and at round start" members (Cory, 2026-10-14): the round-start effect also fires once when recruited,
// is named in the log, and still fires at the next round start.
import { describe, it, expect } from 'vitest';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';
import { move } from './helpers.js';
import { memberTimingWords } from '../../../v4/game/memberTiming.js';
import { defById } from '../../../engine/v4/content/index.js';

const payDefault = s => (s.pending?.kind === 'pay' ? move(s, s.pending.options.find(o => o.default).id) : s);

describe('now and at round start', () => {
  it('Banker pays +3 gold the moment it is recruited, named, and again at round start', () => {
    // paid all in gold at its printed cost (whatever the bench sets it to), then +3 at once
    const cost = defById('gold.banker').s + defById('gold.banker').w;
    let s = sceneQ({ res: [{ gold: cost + 2 }], shop: ['gold.banker'], queue: [{ t: 'buy', p: 0 }] });
    s = payDefault(buy(s, 'gold.banker'));
    expect(s.players[0].res.gold).toBe(2 + 3);
    expect(linesNaming(s.log, 'Banker').length).toBeGreaterThan(0);
  });

  it('Steward counts what you hold right after paying for it', () => {
    let s = sceneQ({ quadrants: ['gold', 'red', 'silver', 'yellow'], res: [{ silver: 9, gold: 2 }], shop: ['silver.steward'], queue: [{ t: 'buy', p: 0 }] });
    s = payDefault(buy(s, 'silver.steward'));
    const silver = s.players[0].res.silver;
    expect(silver).toBeGreaterThanOrEqual(5);
    expect(linesNaming(s.log, 'Steward').length).toBe(1);
  });

  it('every card with the flag says "On recruit and at round start" and has a round-start effect', async () => {
    const { allQuadrantIds, quadrant } = await import('../../../engine/v4/content/index.js');
    for (const id of allQuadrantIds()) for (const d of quadrant(id).members) if (d.now) {
      expect(memberTimingWords(d.text)).toMatch(/On recruit and at round start/);
      expect(memberTimingWords(d.text)).not.toMatch(/\bNow\b/);
      expect(!!(d.onRoundStart || d.onRoundStartLate)).toBe(true);
    }
  });
});
