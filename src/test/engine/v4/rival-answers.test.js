// @vitest-environment node
// A rival's answer on your turn is told honestly (blind testers, aminus r1 #3, #4): Shake Down says whose call it was,
// what they gave and why that much (the member's cost, as the card says); Poach says when the victim gets no
// replacement and why. The log says it, and so does the turn card (format.js turnStory).
import { describe, it, expect } from 'vitest';
import { take, move } from './helpers.js';
import { table, useCosts, uidIn } from './cards-helpers-b.js';
import { turnStory } from '../../../v4/format.js';

const Q = ['gold', 'red', 'thieves', 'market'];
useCosts({ 'red.twins': [2, 2], 'red.intern': [2, 0], 'red.bigfamily': [4, 4], 'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'red.volunteer': [0, 0] });
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const cardOpt = (s, def, who) => `card:${uidIn(s, def, who)}`;
const story = (a, b) => turnStory(a, b, 0, null).lines.join(' | ');

describe('Shake Down: the rival chooses, and the card says what they paid and why', () => {
  it('pays its cost (2, not the 4 cap) and says so', () => {
    const s0 = table(Q, { round: 2, res: [{}, { red: 3 }], members: [[], ['red.twins', 'red.intern']], shop: ROW });
    const s = move(move(take(s0, 'thieves.ransom'), cardOpt(s0, 'red.intern', 1)), 'pay');
    expect(s.players[0].res.magenta).toBe(2);
    expect(s.log).toContain('P2 chose to pay 2 (2 red) to keep Intern: its cost is 2.');
    expect(story(s0, s)).toMatch(/P2 paid 2 to keep Intern \(its cost\)/);
  });
  it('the holder\'s question names the colors they would pay, the same ones taken if they pay (card audit #23)', () => {
    const s0 = table(Q, { round: 2, res: [{}, { red: 3, gold: 2 }], members: [[], ['red.twins', 'red.intern']], shop: ROW });
    const asked = move(take(s0, 'thieves.ransom'), cardOpt(s0, 'red.twins', 1));
    expect(asked.pending.player).toBe(1);
    expect(asked.pending.prompt).toBe('P1 holds your Twins to ransom: pay 4 (2 red, 2 gold) to keep it?');
    expect(asked.pending.options.find(o => o.id === 'pay').label).toBe('Pay P1 4 (2 red, 2 gold) to keep Twins');
    const paid = move(asked, 'pay');
    expect(paid.log).toContain('P2 chose to pay 4 (2 red, 2 gold) to keep Twins: its cost is 4.');
  });
  it('lets it go: "rather than pay", or "couldn’t pay" when they hold too little', () => {
    const s0 = table(Q, { round: 2, res: [{}, { red: 3 }], members: [[], ['red.twins', 'red.intern']], shop: ROW });
    const let1 = move(move(take(s0, 'thieves.ransom'), cardOpt(s0, 'red.intern', 1)), 'let');
    expect(let1.log).toContain('P2 chose to let Intern go to P1 rather than pay 2.');
    expect(story(s0, let1)).toMatch(/P2 let Intern go rather than pay 2/);
    // too little to pay: no question with one answer (skeptic r2), it just goes
    const cant = move(take(s0, 'thieves.ransom'), cardOpt(s0, 'red.twins', 1));
    expect(cant.pending?.player).not.toBe(1);
    expect(cant.log).toContain('P2 couldn\'t pay 4 (held 3), so lost Twins to P1.');
    expect(story(s0, cant)).toMatch(/P2 couldn’t pay 4, so lost Twins/);
  });
});

describe('Poach: no replacement is said plainly', () => {
  it('nothing face up costs that little: the log and the turn card say why', () => {
    // Intern costs 2; nothing face up costs 2 or less (Volunteer, at 0, is taken out of the row)
    const s0 = table(Q, { round: 3, left: 5, members: [[], ['red.intern']], shop: ['gold.tycoon', 'red.bigfamily', 'red.twins', 'gold.taxman'] });
    s0.shop = s0.shop.filter(u => s0.cards[u].def !== 'red.volunteer' && s0.cards[u].def !== 'red.intern');
    const s = move(take(s0, 'thieves.heist'), cardOpt(s0, 'red.intern', 1));
    expect(s.log).toContain('P2 gets no replacement: nothing in the shop costs 2 or less.');
    expect(story(s0, s)).toMatch(/P2 gets no replacement: nothing in the shop costs 2 or less/);
  });
});

describe('gains on your turn say why', () => {
  it('Sweet Talk names its +1 silver to each rival, on the log and the turn card (panel tester C: unexplained +1)', () => {
    const s0 = table(['silver', 'gold', 'red', 'market'], { n: 3, round: 2, shop: ROW });
    const s = move(take(s0, 'silver.tongue'), 'keep');
    expect(s.log).toContain("P3 +1 silver (P1's Sweet Talk).");
    expect(story(s0, s)).toMatch(/Sweet Talk: P3 \+1 silver/);
  });
  it('Top Up on a tie says why it paid each tied color, on the turn card too (panel tester C)', () => {
    const s0 = table(['yellow', 'gold', 'red', 'market'], { res: [{ gold: 2, red: 1, yellow: 1, blue: 2 }], shop: ROW });
    const s = take(s0, 'yellow.bloom');
    expect(story(s0, s)).toMatch(/Top Up: .*tie for the fewest \(\d each\), so \+1 of each/);
  });
});

describe('a skipped buy says so on the turn card', () => {
  it('nothing affordable: "nothing affordable to buy" (blind tester B: silent before round-end scoring)', () => {
    const s0 = table(Q, { res: [{}], shop: ROW.filter(d => d !== 'red.volunteer') });
    s0.shop = s0.shop.filter(u => s0.cards[u].def !== 'red.volunteer');
    const s = take(s0, 'red.turnout'); // +0 red: nobody has recruited yet
    expect(s.log.some(l => /^P1 couldn't buy anything\.$/.test(l))).toBe(true);
    expect(story(s0, s)).toMatch(/nothing affordable to buy/);
  });
});
