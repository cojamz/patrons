// @vitest-environment node
// Stale choices: a queued choice whose options name cards (Open Door, Open Door, Hand-pick, Bargain, Clearance,
// Swap Sides, a copy's free member…) can wait while other things happen first. A Tribute Band copying Open Door
// in the buy step queued "Open Door: which of the cheapest members?" behind the player's own buy; the buy took one of
// those cards and picking it threw "Card 30 is not in the shop" (found by the remote bots session). Core now pins
// where each named card was (option.at) and shows only the options whose cards are still there; none left, the
// choice resolves to nothing with a log line (no rescue gain).
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { applyMove, isLegal, resume, createGame } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { take, move, pinCosts } from './helpers.js';
import { table } from './cards-helpers-b.js';
import { checkInvariants } from './fuzz-runner.js';
import { games } from './budget.js';

const N = (q, k) => quadrant(q).actions.find(a => a.key === k).name; // by key: space names get renamed
const where = (s, u) => (s.shop.includes(u) ? 'shop' : s.pile.includes(u) ? 'pile' : `p${s.players.find(p => p.members.includes(u))?.id}`);
const cardOf = o => Number(String(o.id ?? o.option).split(':')[1]); // an option, or a move
// another player takes a face-up card (a buy, a steal…): out of the row, the pile refills its slot
function takeAway(s, uid, to) {
  const i = s.shop.indexOf(uid);
  s.shop.splice(i, 1, ...(s.pile.length ? [s.pile.shift()] : []));
  s.players[to].members.push(uid);
}

describe('a queued choice never offers a card that moved', () => {
  // The bots repro (fixtures/bots-repro-open-door.json, 2026-10-14 content): P1 takes Open Door, then in the buy step
  // uses Tribute Band to copy it ("doing it again"). That queued "Open Door: which of the cheapest members?" behind
  // the buy, the buy took Stylist (card 30), and picking Stylist in the choice threw. Now (gut call, 2026-10-15) a
  // member used in the buy step resolves its whole effect first: the choice comes right away, then the buy step
  // returns with options that reflect the recruit.
  it('the bots repro: Tribute Band copying Open Door in the buy step asks Open Door first; the buy then reflects the recruit', ctx => {
    const rec = JSON.parse(readFileSync(new URL('./fixtures/bots-repro-open-door.json', import.meta.url), 'utf8'));
    let s = structuredClone(rec.start);
    const use = rec.moves.findIndex(m => m.option.startsWith('use:'));
    for (const m of rec.moves.slice(0, use + 1)) {
      // made on 2026-10-14 content: if the cards changed under it, it no longer describes a reachable game
      if (!isLegal(s, m)) { ctx.skip(`fixture no longer replays on this content (${JSON.stringify(m)})`); return; }
      s = applyMove(s, m);
    }
    const me = rec.moves[use].player, stylist = 30;
    expect(s.pending.kind).toBe('choose'); // the copy's choice first, not the buy
    expect(s.pending.prompt).toMatch(/^Open Door: /);
    expect(s.pending.options.map(cardOf)).toContain(stylist);
    const res = { ...s.players[me].res };
    s = applyMove(s, { player: me, option: `card:${stylist}` });
    expect(where(s, stylist)).toBe(`p${me}`);
    expect(s.players[me].res).toEqual(res); // free
    expect(s.pending.kind).toBe('buy'); // then the buy step resumes, fresh
    expect(s.pending.options.map(o => o.id)).not.toContain(`card:${stylist}`);
    for (const o of s.pending.options.filter(o => o.kind === 'card' && !o.fromPile)) expect(s.shop).toContain(o.uid);
    const rand = seededRandom(7);
    for (let k = 0; !s.over && k < 3000; k++) s = applyMove(s, chooseBotMove(s, rand, { level: 'easy' }));
    expect(s.over).toBe(true);
  });

  // The same, built from today's cards (the fixture above skips once the cards change under it): Tribute Band used in
  // the buy step copies Tryout, and the copy's shop-member choice comes before the buy step returns.
  it('a member used in the buy step resolves its choice first: Tribute Band copying Tryout, then a fresh buy', () => {
    const Q = ['gold', 'red', 'market', 'echo'];
    let s = table(Q, { round: 2, members: [['echo.dejavu']], res: [{ red: 2 }], shop: ['gold.banker', 'echo.evergreen', 'red.twins', 'red.intern'] });
    s = take(s, N('red', 'evenswap'));
    expect(s.pending.kind).toBe('choose');
    s = move(s, s.pending.options.find(o => cardOf(o) === s.shop[0]).id); // Banker: +3 gold
    expect(s.pending.kind).toBe('buy');
    const use = s.pending.options.find(o => o.kind === 'use');
    s = move(s, use.id);
    expect(s.pending.kind).toBe('choose'); // the copy's question now, not after the buy
    expect(s.pending.prompt).toMatch(/^Tryout: /); // a copy does Tryout itself
    const pick = s.shop[1]; // Evergreen: +2 green
    s = move(s, `card:${pick}`);
    expect(where(s, pick)).toBe('shop'); // it stays in the shop
    expect(s.players[0].res).toMatchObject({ gold: 3, green: 2 });
    expect(s.pending.kind).toBe('buy'); // then the buy step, fresh
    expect(s.pending.options.map(o => o.id)).not.toContain(use.id);
  });

  it('Hand-pick: a card taken away is dropped from the choice; all taken, it resolves to nothing with a log line', () => {
    let s = table(['gold', 'red', 'market', 'echo'], { round: 3, left: 5, shop: ['red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'] });
    s = take(s, N('red', 'take'));
    const offered = s.pending.options.map(cardOf);
    expect(offered.length).toBeGreaterThan(1);
    takeAway(s, offered[0], 1);
    s = resume(s);
    expect(s.pending.options.map(cardOf)).toEqual(offered.slice(1).filter(u => s.shop.includes(u)));
    for (const u of s.pending.options.map(cardOf)) takeAway(s, u, 1);
    s = resume(s);
    expect(s.pending?.kind).not.toBe('choose'); // the choice is gone, the turn goes on (P1 can't afford a buy)
    expect(s.players[0].members).toEqual([]); // no rescue gain
    expect(s.log.some(l => l.startsWith(`${N('red', 'take')}: nothing left to choose`))).toBe(true);
  });

  it('Promote drops a pair when its outgoing member changes cults', () => {
    let s = table(['gold', 'red', 'market', 'echo'], { n: 3, round: 2, members: [['red.twins'], ['red.bigfamily'], ['gold.taxman']], shop: ['red.volunteer'] });
    s = take(s, N('red', 'hireup'));
    const outgoing = s.players[1].members[0];
    const pair = s.pending.options.find(o => o.value[0] === outgoing);
    expect(pair).toBeTruthy();
    s.players[1].members = [];
    s.players[2].members.push(outgoing);
    s = resume(s);
    expect(s.pending.options.map(o => o.id)).not.toContain(pair.id);
  });

});

// Fuzz: seeded easy-bot games; whenever a choice offers face-up cards, sometimes a rival takes one away first (as a
// buy behind the choice would), and whenever a queued choice waits behind a buy, the buyer sometimes buys a card it
// offers. Nothing may throw, and no pending choice may name a card that moved (checkInvariants).
const GAMES = games(60);
const TABLES = [['gold', 'red', 'market', 'echo'], ['red', 'thieves', 'market', 'echo'], ['red', 'market', 'trading', 'echo'], ['gold', 'red', 'thieves', 'market']];
describe(`stale-choice fuzz: ${GAMES} seeded games`, () => {
  it('buying or taking away a card a queued choice offers never throws and is never offered again', () => {
    let staled = 0, boughtAway = 0;
    for (let g = 0; g < GAMES; g++) {
      const rand = seededRandom(9100 + g * 13);
      let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 9100 + g, quadrants: TABLES[g % TABLES.length] });
      for (let k = 0; !s.over && k < 3000; k++) {
        const pend = s.pending;
        if (pend.kind === 'choose') {
          const face = pend.options.filter(o => o.at && Object.values(o.at).includes('shop'));
          if (face.length && rand() < 0.35) {
            const o = face[Math.floor(rand() * face.length)];
            const u = Number(Object.entries(o.at).find(([, w]) => w === 'shop')[0]);
            takeAway(s, u, (pend.player + 1) % s.players.length);
            s = resume(s);
            staled++;
            checkInvariants(s, { seed: 9100 + g, move: k });
            continue;
          }
        }
        if (pend.kind === 'buy') {
          // a choice of this player's queued behind this buy, offering a card the buy can take
          const queued = s.queue.slice(1).find(t => t.t === 'choose' && t.p === pend.player);
          const hit = queued && pend.options.find(o => o.kind === 'card' && queued.options.some(q => q.at?.[o.uid] === 'shop'));
          if (hit && rand() < 0.7) {
            s = move(s, hit.id);
            boughtAway++;
            checkInvariants(s, { seed: 9100 + g, move: k });
            continue;
          }
        }
        s = applyMove(s, chooseBotMove(s, rand, { level: 'easy' }));
        if (g < 10) checkInvariants(s, { seed: 9100 + g, move: k });
      }
      expect(s.over, `game ${g} finished`).toBe(true);
    }
    expect(staled).toBeGreaterThan(GAMES / 4); // the fuzz really did take cards away under open choices
    void boughtAway;
  });
});
