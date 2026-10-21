#!/usr/bin/env node
// Starting prices for member concepts, before the sim sweep sets the real ones (design/member-process.md step 6).
// Cory, Oct 21: "my members aren't priced the best right now", so the backtest below only shows the arithmetic sits
// near his intuition; it is not the standard. Every yield is a short sum over the "typical game" table below.
// The model and its rules: design/member-pricing.md.
//
//   node scripts/member-price.mjs            backtest + the Magenta deck as it is
//   node scripts/member-price.mjs --json     the same, as JSON

// A typical 4-player game, for a player who wants the card (Claude's read of the live rules, Oct 21; core.js:
// minions 3/4/5, one buy a turn, follower packs 1/5/10 at 1-for-1, contests 2/4/6 halved on a tie, shop 5/6/7).
// Index 0/1/2 = the card is bought in round I/II/III, about mid-round.
export const GAME = {
  roundStarts: [2, 1, 0], // round starts still to come
  myRecruits: [5, 3.5, 1.5], // members you recruit after this one
  rivalBig5: [2, 1.5, 0.7], // follower buys of 5 or more, per rival, after this one
  steals: [4, 3, 1], // steals from spaces you make after this one (a thief)
  stealsFromLeader: [2.5, 2, 0.7], // of those, from the player with the most followers
  stealsAtMe: [3, 2.5, 1], // resources rivals steal from you after this one (a table with a thief)
  bodiesAtEnd: 7, // members you hold at game end, multi-body cards counted as their bodies
  buy: [0, 0.5, 1.5], // what one extra buy is worth, by round (resources bind early, buys bind late)
};

// Cory's price rules, as the model applies them (design/member-pricing.md says where each comes from):
// 1. price = followers printed + what the ability yields, in the build that wants it, for the round it's bought.
// 2. Halves round down: when in doubt, a step cheaper.
// 3. A card that brings a whole extra member or minion sits on his ladder (8 to 10), whatever the sum says.
// 4. Nothing above 10 (his ceiling, Oct 18).
export function price(card) {
  const raw = card.f + card.y;
  let p = Math.min(10, Math.ceil(raw - 0.5)); // nearest, halves down
  if (card.extra) p = Math.max(8, p);
  return Math.max(0, p);
}

const g = GAME;
// fit: the prices Cory set on the Red ladder (Oct 18). test: every other price of his under today's economy, and
// his "too dear" calls (a hit is a price below the one he called too dear).
export const BACKTEST = [
  { set: 'fit', name: 'Volunteer', f: 1, y: 0, his: 0, why: 'a body, no ability' },
  { set: 'fit', name: 'Twins', f: 2, y: 0, his: 2, why: 'two bodies' },
  { set: 'fit', name: 'Loyalists', f: 2, y: 1.5 * 1.5 + 0.5, his: 5, why: 'blocks ~1.5 swaps of your members (~1.5 each), plus a body' },
  { set: 'fit', name: 'Panel', f: 3, y: 1.5 + 1.5, his: 6, why: 'one Promote (+2 cost, ~1.5) and 3 bodies for Patriarch/Host (~1.5)' },
  { set: 'fit', name: 'Mentor & Protégé', f: 1, y: 1.5 + 1 + 1 + g.buy[1], extra: true, his: 8, why: 'the cheapest shop member (~1.5 followers, ~1 ability), one On Recruit trigger, a buy saved' },
  { set: 'fit', name: 'Mob', f: 5, y: 5 + 4, his: 10, why: '+1 per red member: its own 5 and ~4 more' },
  { set: 'test', name: 'Crew', f: 2, y: 0, his: 2, why: 'two followers' },
  { set: 'test', name: 'Shift Crew', f: 2, y: 0, his: 2, why: 'two followers' },
  { set: 'test', name: 'Retinue', f: 3, y: -1, his: 2, why: 'three followers; 3 silver to rivals is ~1 against you' },
  { set: 'test', name: 'Chefs', f: 2, y: 10, his: 9, why: 'once, in round III: +3 of each of 4 colors, ~10 of it usable' },
  { set: 'test', name: 'Extra Hand', f: 1, y: 2.5 + g.buy[2], extra: true, his: 9, why: 'a round III minion placed after the snake (~2.5) and one more buy' },
  { set: 'test', name: 'Front-runner', f: 1, y: 1.5 + 2, his: 5, why: 'first pick in rounds II and III' },
  { set: 'test', name: 'Launderer', f: 1, y: 2.5 + 1, his: 6, tol: 1, why: 'recolor once: about one contest swung (~2.5) and colored parts paid (~1)' },
  { set: 'test', name: 'Squatter', f: 1, y: 0.5 + 1 + 1.5, tooDear: 7, why: 'the best space when it is taken: ~+0.5 / +1 / +1.5 over your other pick' },
  { set: 'test', name: 'Freelancer', f: 1, y: 1.5, tooDear: 7, why: 'colored parts in any colors: ~1.5 over a game' },
  { set: 'test', name: 'Straggler', f: 1, y: 1.5 + 2, tooDear: 5, why: 'one leftover space in rounds II and III (~1.5, ~2)' },
  { set: 'test', name: 'Tiebreaker', f: 1, y: 2.5, tooDear: 6, why: 'about one tie a game you are in: the full prize, not half' },
  { set: 'test', name: 'Oct 12 two-follower member', f: 2, y: 0, tooDear: 4, why: 'two followers' },
];

export function grade(c) {
  const p = price(c);
  if (c.tooDear !== undefined) return { p, hit: p < c.tooDear, off: p - (c.tooDear - 1) };
  return { p, hit: Math.abs(p - c.his) <= (c.tol ?? 1), off: p - c.his };
}

// The live Magenta deck priced by the same rules (a thief at 4 players). magenta: what the card asks in magenta;
// a thief earns about 5 magenta in a whole game (+1 a Magenta space, 4 to 6 spaces), and paying it loses the contest.
export const MAGENTA = [
  { name: 'Crew', now: [1, 1], f: 2, y: 0, why: 'two followers' },
  { name: 'Cutpurse', now: [2, 2], f: 1, y: 1 + g.roundStarts[0], why: 'now and 2 round starts: 3 stolen' },
  { name: 'Desperado', now: [2, 2], f: 1, y: 2.5, why: 'doubles base steals while you trail: about half the time' },
  { name: 'Robin Hood', now: [2, 2], f: 1, y: g.stealsFromLeader[0], why: '~2.5 steals from the follower leader after round I' },
  { name: 'Kingpin', now: [4, 0], f: 1, y: 2, why: 'game end, ~4 magenta held: +2' },
  { name: 'Grifter', now: [4, 2], f: 1, y: 3, why: 'bought in round III with ~6 bodies: 3 stolen' },
  { name: 'Sticky Fingers', now: [4, 4], f: 1, y: g.steals[0], why: '+1 on ~4 steals from spaces after round I' },
  { name: 'Bodyguard', now: [4, 2], f: 1, y: g.stealsAtMe[1] + 1.5, why: '~2.5 resources kept, and Shake Down/Poach/Double Agent can\'t touch you (~1.5)' },
  { name: 'Double Agent', now: [4, 2], f: 1, y: 6 + 1, extra: true, why: 'a rival\'s best member (~6) for this blank one, and the rival is down one (~1)' },
  { name: 'Extortionist', now: [8, 2], f: 1, y: 3 * g.rivalBig5[1] * 2, why: '3 rivals x ~1.5 buys of 5+ after round II x 2 taken' },
];

const json = process.argv.includes('--json');
const rows = BACKTEST.map(c => ({ ...c, ...grade(c) }));
const mag = MAGENTA.map(c => ({ ...c, p: price(c), nowTotal: c.now[0] + c.now[1] }));
if (json) {
  console.log(JSON.stringify({ game: GAME, backtest: rows, magenta: mag }, null, 2));
} else {
  for (const set of ['fit', 'test']) {
    const r = rows.filter(c => c.set === set);
    console.log(`\n${set === 'fit' ? 'Fit (his Red ladder)' : 'Test (his other prices and "too dear" calls)'}: ${r.filter(c => c.hit).length}/${r.length} within a step`);
    for (const c of r) {
      const his = c.tooDear !== undefined ? `<${c.tooDear}` : String(c.his);
      console.log(`  ${c.hit ? 'hit ' : 'MISS'} ${c.name.padEnd(28)} model ${String(c.p).padStart(2)}  his ${his.padStart(3)}   ${c.why}`);
    }
  }
  console.log('\nMagenta as dealt today (colored+any = total), against the model:');
  for (const c of mag) {
    const d = c.p - c.nowTotal;
    console.log(`  ${c.name.padEnd(15)} now ${c.now[0]}+${c.now[1]}=${String(c.nowTotal).padStart(2)}  model ${String(c.p).padStart(2)} ${d ? (d > 0 ? `(${d} too cheap)` : `(${-d} too dear)`) : '(on price)'}   ${c.why}`);
  }
  console.log(`  Magenta asked by the deck: ${MAGENTA.reduce((a, c) => a + c.now[0], 0)}; a thief earns about 5 a game.`);
}
