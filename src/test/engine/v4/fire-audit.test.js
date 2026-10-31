// @vitest-environment node
// Fire audit gate (Cory: every number on the table traces to a log line). Seeded mixed tables, normal bots: every
// member with an effect that gets recruited must leave a log line naming it as acting at least once.
// scripts/v4-fire-audit.mjs is the long report; this is the fast gate. Each block covers a group of spheres.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { namesCard } from './cards-helpers.js';
import { runFireAudit, silentMembers } from './fire-audit-runner.js';

/** A plain member ("Worth 2 followers.", "No effect.", "Counts as 3 members.") has nothing to fire: its number is a
 *  count the contests read, not a payout. Goes by the printed text: some members with effects have no hooks of their
 *  own (their sphere reads them by key, like Green's Choir, Muse, Wallflower). */
export const plain = def => /^(Free\. )?(No effect\.|Worth \d+ followers\.|Counts as \d+ members\.)$/.test(def.text.trim());

/**
 * Play `games` seeded 4-bot games over `tables`; per member id: games it was held (recruited, or dealt), games a
 * log line named it acting. `hand` (def ids) is dealt round-robin, `perSeat` to each seat before the first move
 * (from the pile, or from the face-up row), so every member is held often enough to show whether it fires. `rules` go to createGame.
 */
export function audit(tables, games, { seed = 3100, hand = [], perSeat = 0, rules = {} } = {}) {
  const st = {};
  let deal = 0;
  for (let g = 0; g < games; g++) {
    const quads = tables[g % tables.length];
    let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: seed + g, quadrants: quads, rules });
    const onTable = hand.filter(id => quads.includes(id.split('.')[0]));
    for (const p of s.players) for (let j = 0; j < perSeat && onTable.length; j++) {
      const id = onTable[deal++ % onTable.length];
      const k = s.pile.findIndex(u => s.cards[u].def === id);
      if (k >= 0) p.members.push(s.pile.splice(k, 1)[0]);
      else {
        // face up: deal it from the row and refill its slot from the pile, so a deal never silently misses (cutting
        // Keepsake shifted the deal and Muse sat face up in 2 of its 3 deals)
        const f = s.shop.findIndex(u => s.cards[u].def === id);
        if (f >= 0 && s.pile.length) { p.members.push(s.shop[f]); s.shop[f] = s.pile.shift(); }
      }
    }
    const rand = seededRandom(seed + g * 7 + 1);
    const full = [...s.log];
    const held = new Set();
    let k = 0;
    while (!s.over && k++ < 8000) {
      for (const p of s.players) for (const u of p.members) held.add(s.cards[u].def);
      const n0 = s.log.length, last = s.log[n0 - 1];
      s = applyMove(s, chooseBotMove(s, rand));
      full.push(...(s.log.length > n0 ? s.log.slice(n0) : s.log.slice(s.log.lastIndexOf(last) + 1)));
    }
    if (!s.over) throw new Error(`${quads.join(',')} seed ${seed + g} did not finish`);
    full.push(...s.players.flatMap(p => p.final?.parts || []));
    for (const q of quads) for (const def of quadrant(q).members) {
      if (plain(def) || !held.has(def.id)) continue;
      const e = (st[def.id] ||= { name: def.name, held: 0, fired: 0 });
      e.held++;
      if (full.some(l => namesCard(l, def.name))) e.fired++;
    }
  }
  return st;
}

describe('fire audit: Blue, Magenta, White, Green', () => {
  const GROUP = ['market', 'thieves', 'trading', 'echo'];
  // Bodyguard changes no number (it only refuses a steal). Social Climber pays only on a Release, and this audit plays
  // with Release off; cards-market.test.js covers it.
  // Magnate pays only from white left at game end (1 follower per 3); normal bots spend white down because any
  // follower buy beats that rate, so it fires about 1 hold in 13 (ledger) and 4 holds can all miss. Since the
  // 2026-10-14 White rework changed these seeds' games it does; cards-trading.test.js (Magnate) covers its line.
  // See design/eval/card-ledger-b.md.
  // Double Agent acts only when recruited, and this audit deals it straight into hands, so a dealt one never acts; it
  // passed only while a bot happened to recruit a second copy (balance pass 3 moved those games).
  // cards-thieves.test.js (Double Agent) covers its line.
  // Hoarder fires only when its bot chooses to, in round III with 3+ non-white; the 6/7/8 shop (2026-10-23) has bots
  // spending down by then in all 6 games it was held. cards-trading.test.js (Hoarder) covers its line.
  const EXEMPT = new Set(['thieves.watchdog', 'market.climber', 'trading.magnate', 'thieves.doubleagent', 'trading.hoarder']);
  // Agents denies copy targets without changing a number, like Bodyguard's steal protection. Keep it in the dealt
  // hands (preserving the audit's coverage distribution), but require no payout log from this pure restriction.
  // green-redesign-pressure.test.js verifies that it blocks both its owner's and rivals' copies, including copies of Agents.
  // Cashier only acts when recruited; dealt into a starting hand it never does (Sleep In's +3, 2026-10-25, moved the
  // seeded games so it was dealt, never recruited, in 3). cards-trading (Cashier) covers its line.
  // Doppelganger is the same: "When recruited" only. It passed while bots recruited one; Even Swap's +2 red (2026-10-25)
  // moved the games so it was only dealt, in 4. cards-echo (Doppelganger) covers its line.
  // Makeover ("When recruited" only) and Wallflower (doubles only while no rival has fewer followers), both cut from the
  // deck, went silent when the Oct 25 member deck changes moved the games; cards-market-concepts and cards-echo cover their lines.
  // (Translator, like Wallflower, names itself only when its owner copies resources; held 3 games without a copy after
  // the +1 wild on every member, Oct 27, moved the games. cards-echo covers it.)
  const QUIET_RESTRICTIONS = new Set(['echo.agents', 'trading.cashier', 'echo.doppel', 'market.makeover', 'echo.wallflower', 'echo.translator',
    'market.snob', // Snob pays only for blue members at game end; Shoplifter 7 and Heiress 9 (Oct 30) moved the games so its owners had none. cards-market covers it
    'market.restocker']); // Restocker: bots held it in 4 seeded games without using it once Out of Style went back to per member (Oct 28); cards-member-structure covers it
  const TABLES = [
    ['thieves', 'market', 'trading', 'echo'], ['gold', 'thieves', 'trading', 'echo'], ['red', 'market', 'thieves', 'echo'],
    ['gold', 'market', 'trading', 'echo'], ['red', 'thieves', 'market', 'trading'],
  ];
  const hand = GROUP.flatMap(q => quadrant(q).members).filter(d => !plain(d) && !EXEMPT.has(d.id) && !d.artifact).map(d => d.id); // artifact-only cards are never members
  it('every member with an effect, once held, leaves a log line naming it (seeded mixed tables, normal bots)', () => {
    // Release off: bots release dealt members early, and this gate is about naming, not balance
    const st = audit(TABLES, 24, { hand, perSeat: 3, rules: { release: false } });
    const silent = hand.filter(id => !QUIET_RESTRICTIONS.has(id) && st[id]?.held >= 3 && !st[id].fired).map(id => `${id} (held in ${st[id].held} games, never named)`);
    // Light Fingers is dealt in only 2 of these games; it reached a third through a bot's recruit until the shop went
    // 5/6/7 (2026-10-21) moved the seeded games. Still judged when held 3+; cards-thieves.test.js (Light Fingers) covers it.
    // Lookout and Cashier fell under 3 holds when White's rework and Help Yourself's follower steal (2026-10-22) moved the games; cards-thieves (Lookout) and cards-trading (Cashier) cover them.
    // Extortionist fell under 3 holds after the Oct 23-24 Magenta playtest calls moved the games; cards-thieves covers it.
    // Impostors and Reseller (cut from the deck, still dealt here) fell under 3 holds when the Oct 24 member structure (six
    // new members, three cut) moved the games; cards-echo and cards-market cover them.
    // Shopaholics, Fence and Doppelganger fell under 3 holds when Gather's +3 (Oct 25) moved the games; spheres/market (Shopaholics), interactions (Fence) and cards-echo (Doppelganger) cover them.
    const THIN = new Set(['thieves.lightfingers', 'thieves.lookout', 'trading.cashier', 'thieves.extortionist', 'echo.impostor', 'market.reseller', 'market.shopaholic', 'thieves.fence', 'echo.doppel',
      'market.onlooker', 'echo.groupie', // cut cards under 3 holds after the Oct 25 member deck changes; cards-market and cards-echo cover them
      'market.patroness', // under 3 holds when Extortionist at 6 (Oct 25) moved the games; cards-market (Patroness) covers it
      'market.stylist', 'echo.ensemble', 'echo.dejavu', 'market.auctioneer', 'echo.wallflower', // under 3 holds when +1 wild on every member and the round I rework (Oct 27-28) moved the games; cards-market and cards-echo cover them
      'market.sommelier', // cut from the deck; under 3 holds when neutral in Out of Style (Oct 28) moved the games; cards-market covers it
      'market.connoisseur', // under 3 holds when Tiebreaker at 5 (Oct 28) moved the games; cards-market (Connoisseur) covers it
      'market.restocker', // under 3 holds when Encore's On Recruit copy and Sleep In's growth (Oct 28) moved the games; cards-member-structure covers it
      'market.doorman', 'market.planner', // under 3 holds when Cory's 15 guests and Launderers' split (Oct 28) moved the games; cards-market covers them (Planner is cut)
      'thieves.shoplifter', 'echo.translator', // under 3 holds when Green grew to 16 (Oct 28) moved the games; recruit-definition (Shoplifter) and cards-echo (Translator, cut) cover them
      'thieves.snitch']); // under 3 holds when the Oct 29 balance prices moved the games; cards-thieves (Snitch) covers it
    const unseen = hand.filter(id => !THIN.has(id) && !(st[id]?.held >= 3));
    expect(silent).toEqual([]);
    expect(unseen).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Gold, Red, Purple, Silver, Yellow and the guest members (benders): mixed tables from the cross-sphere fuzz,
// normal bots, via fire-audit-runner.js (also scripts/v4-fire-audit.mjs). Ledger: design/eval/card-ledger-a.md.
// Normal, not easy (2026-10-15): since the bots retune, easy is "normal played carelessly" and undervalues members by
// design, so it recruits few and late (Investor in round III never sees a round start) and the gate stopped
// reaching Apprentice, Corner-Cutter, Investor and Rainmaker. Normal plays members the way a person would.
const SPHERES = ['gold', 'red', 'purple', 'silver', 'yellow'];
// Members that may stay unnamed on bot tables, with why (see design/eval/card-ledger-a.md).
// Conditional cards that can go a whole bot game without their condition; each has a named test of its own.
const ALLOW = {
  // seeded games moved with +1 wild and the round I rework (Oct 27-28): recruited in 4-5 games without the trigger coming up
  'yellow.matchmaker': 'pays only for a recruit in a new member color; its 2 owners in the Yellow 2.0 sample (Oct 31) recruited none (cards-yellow)',
  'silver.dowager': 'a plain worth-3 member the audit counts (cards-silver)',
  'purple.courier': 'pays only on two turns in a row (courier.test.js)',
  // bots almost never buy it at 12 (Hard bot read, Oct 24); recruited once in the Oct 25 sample
  'silver.grandhost': 'doubles silver from Silver spaces, rarely bought (cards-silver: Grand Host)',
  'purple.lateriser': 'needs the fewest followers at a round start, bought before it (cards-purple: Late Risers)',
  'yellow.harmonist': 'pays only with a full set at game end (cards-yellow: Harmonist)',
  // since 10-for-10 is unlimited, bots convert their purple before game end, so a holder can end with fewer than 3
  'purple.patience': 'pays only on 3+ purple still held at game end (cards-purple: Timekeeper)',
  // Overtime and Crunch Time went free (2026-10-15): only Taskmaster still pays purple for a turn, and both are cut
  // extra turns got rarer when Purple's spaces moved turns instead (2026-10-22); the Purple members are being redone
  'purple.foreman': 'pays only on an extra turn, from members now (cards-purple: Foreman)',
  // the Oct 29 balance-run followers moved the seeded games: recruited once, its paid turn never bought
  'purple.taskmaster': 'pays 5 purple for a turn, rarely worth it to a bot (cards-purple: Taskmaster)',
  // Promote +3 red and Recruiter's color (Oct 30) moved the seeded games: recruited in 4, never set gold aside
  // the Oct 30 prices (Shoplifter, Heiress, Coach, Mob…) moved the seeded games again
  'purple.closer': 'pays only when its owner places the round’s last minion, which these games never gave it (cards-purple: Closer)',
  'gold.investor': 'sets gold aside at Round Start only when a bot sees the double (cards-gold: Investor)',
  'purple.doubletime': 'halves only Taskmaster’s paid turn now (cards-purple: Corner-Cutter); cut from the deck',
  // like Bodyguard and Agents above: a pure restriction (its cult's members drop out of every swap's options) that
  // changes no number, so there is no payout line to name it (v0.8.2 Red deck)
  'red.loyalists': 'only removes its cult from swap options (red-members-hooks / red-members-pressure: Loyalists)',
  // needs its holder to Promote/Demote a rival's member out of their cult; the 5/6/7 shop (2026-10-21) moved the
  // seeded games where a bot did
  // White's rework (2026-10-22) moved the seeded games: these were held in a game or two without their moment coming
  'trading.cashier': 'acts only on its own recruit; a holder who got it by a swap or steal never sees it (cards-trading: Cashier)',
  'market.shopaholic': 'a pure allowance (a second buy) that shows only when its holder buys twice (cards-market: Shopaholics)',
  'thieves.lookout': 'pays only when a rival steals from someone else while it is unspent (cards-thieves: Lookout)',
  // Help Yourself taking followers (2026-10-22) moved the seeded games; its own tests name it when it fires
  'yellow.admirer': 'pays only when a rival recruits a color its holder has none of (cards-yellow: Admirer)',
  'red.movementpenalty': 'pays only when you move a rival’s member out of their cult (red-members-hooks: Deprogrammers)',
  // cut from the deck since 2026-10-18 (tests still deal it); the Oct 24 member structure moved the seeded games off its moment
  'purple.overseer': 'pays only when a rival takes an extra turn; cut from the deck (cards-purple: Overseer)',
  // Saboteur joining the deck (Oct 28) moved the seeded games: recruited in one game without a 2-at-once gain after
  'yellow.gleaner': 'pays only on an action giving 2+ of another color at once; cut from the deck (cards-yellow: Gleaner)',
  // the Oct 29 balance prices moved the seeded games: recruited in one game without an action gaining yellow after
  'yellow.farmer': 'pays only when an action gains its holder yellow (cards-yellow: Farmer)',
  // Con Men at 7 and Promote/Demote reaching rivals (Oct 29) moved the seeded games: held in 3 games whose holders had
  // no catch-up left by their last buy, where bots use it (cards-yellow: Rainmaker's bot test)
  'yellow.rainmaker': 'pays only when used, and bots wait for a big catch-up or their last buy (cards-yellow: Rainmaker)',
};

describe('namesCard: what counts as a line naming a card', () => {
  it('counts the engine’s and content’s trace forms', () => {
    for (const [l, n] of [
      ["P1's Banker: +3 gold.", 'Banker'], ['P2 +1 silver (P1\'s Retinue).', 'Retinue'], ['P1 uses Big Spender.', 'Big Spender'],
      ['P1 used Lottery Winner: +7 gold.', 'Lottery Winner'], ['Tycoon +3', 'Tycoon'], ['P1 recruited Banker (1 gold; Sponsor saves 2).', 'Sponsor'],
      ['P1 recruited Banker (2 gold; Penny Pincher: gold counts double).', 'Penny Pincher'], ["P1's Taskmaster: pays 3 purple for an extra turn (Corner-Cutter: 5 → 3).", 'Corner-Cutter'],
      ['Round II begins. P1 picks first. (P1\'s Front-runner: always picks first.)', 'Front-runner'],
    ]) expect(namesCard(l, n), l).toBe(true);
  });
  it('does not count lines that only move the card', () => {
    for (const [l, n] of [
      ['P1 recruited Banker (2 gold, 1 red).', 'Banker'], ['P1 traded Intern for P2\'s Banker.', 'Banker'],
      ['P1 released Banker to the bottom of the pile, for 2 gold.', 'Banker'], ["P1's Doppelganger copies Banker.", 'Banker'],
      ['P1 pulled a heist: P2\'s Banker.', 'Banker'], ['P1 sent Banker to the bottom of the pile.', 'Banker'],
    ]) expect(namesCard(l, n), l).toBe(false);
  });
});

describe('fire audit gate (Gold, Red, Purple, Silver, Yellow, guests)', () => {
  it('every recruited member with an effect is named acting at least once', () => {
    const { crashes, stats } = runFireAudit({ games: 140, spheres: SPHERES, levels: ['normal', 'normal', 'normal', 'normal'] });
    expect(crashes).toEqual([]);
    const silent = silentMembers(stats, [...SPHERES, 'benders'], ALLOW).map(e => `${e.name} (${e.def}): recruited in ${e.rec} games, never named`);
    expect(silent).toEqual([]);
    // the sample reaches most of the cards it judges
    expect(Object.keys(stats).length).toBeGreaterThan(60);
    // bounded by its game count, not the clock: 140 normal-bot games take ~2 min alone and well past the 10-minute
    // default when the whole suite shares a loaded box (it timed out there, 2026-10-15)
  }, 30 * 60_000);
});
