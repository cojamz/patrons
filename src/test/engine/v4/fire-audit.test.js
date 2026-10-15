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
  const EXEMPT = new Set(['thieves.watchdog', 'market.climber', 'trading.magnate']);
  const TABLES = [
    ['thieves', 'market', 'trading', 'echo'], ['gold', 'thieves', 'trading', 'echo'], ['red', 'market', 'thieves', 'echo'],
    ['gold', 'market', 'trading', 'echo'], ['red', 'thieves', 'market', 'trading'],
  ];
  const hand = GROUP.flatMap(q => quadrant(q).members).filter(d => !plain(d) && !EXEMPT.has(d.id)).map(d => d.id);
  it('every member with an effect, once held, leaves a log line naming it (seeded mixed tables, normal bots)', () => {
    // Release off: bots release dealt members early, and this gate is about naming, not balance
    const st = audit(TABLES, 24, { hand, perSeat: 3, rules: { release: false } });
    const silent = hand.filter(id => st[id]?.held >= 3 && !st[id].fired).map(id => `${id} (held in ${st[id].held} games, never named)`);
    const unseen = hand.filter(id => !(st[id]?.held >= 3));
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
  'purple.lateriser': 'needs the fewest followers at a round start, bought before it (cards-purple: Late Riser)',
  'yellow.harmonist': 'pays only with a full set at game end (cards-yellow: Harmonist)',
  // since 10-for-10 is unlimited, bots convert their purple before game end, so a holder can end with fewer than 3
  'purple.patience': 'pays only on 3+ purple still held at game end (cards-purple: Timekeeper)',
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
