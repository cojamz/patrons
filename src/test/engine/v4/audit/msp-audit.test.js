// @vitest-environment node
// Audit (market / purple / silver): cards whose effect may not match their text. Each test pins what the engine does.
import { describe, it, expect } from 'vitest';
import { take, move } from '../helpers.js';
import { sceneQ } from '../cards-helpers.js';

const QP = ['gold', 'red', 'purple', 'silver'];
const QM = ['gold', 'trading', 'market', 'purple'];
const sc = (quadrants, o) => sceneQ({ quadrants, ...o });

describe('audit', () => {
  it('Sweet Talk: "swap any of your silver" offers only half or all', () => {
    const s = take(sc(QP, { round: 2, res: [{ silver: 2 }] }), 'silver.tongue'); // 2 + 4 = 6 silver
    const ids = s.pending.options.map(o => o.id);
    expect(s.players[0].res.silver).toBe(6);
    expect(ids.filter(x => x.startsWith('swap:red:'))).toEqual(['swap:red:3', 'swap:red:6']);
    expect(ids).not.toContain('swap:red:1');
  });

  it('Lamplighter: "+1 purple per minion you get this round" counts Extra Hand in round III (Cory 2026-10-15)', () => {
    const s = sc(QP, { members: [['purple.lamplighter', 'benders.extrahand']], queue: [{ t: 'round', r: 3 }] });
    expect(s.players[0].workers).toBe(6);
    expect(s.players[0].res.purple).toBe(6);
  });

  it('Show Off: half of a 3-cost member rounds down to 1 (text never says rounded down)', () => {
    const s = take(sc(QM, { round: 2, members: [['trading.shareholder']] }), 'market.pricecheck');
    expect(s.players[0].res.blue).toBe(1);
  });

  it('Overseer: 1 purple held gives nothing (half, rounded down)', () => {
    const s = take(sc(QP, { round: 2, res: [{}, { purple: 1 }], members: [[], ['purple.overseer']] }), 'purple.overtime');
    expect(s.players[1].res.purple).toBe(1);
  });

  it('Night Owl at 4 players never fires in round I', () => {
    const order = [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3];
    let s = sc(QP, { n: 4, round: 1, members: [['purple.nightowl']], queue: order.map(p => ({ t: 'turn', p })) });
    let p0 = 0;
    while (s.pending && s.round === 1) {
      if (s.pending.kind === 'place') { if (s.pending.player === 0) p0++; s = move(s, s.pending.options.find(o => o.kind === 'slot').id); }
      else if (s.pending.kind === 'buy') s = move(s, 'pass');
      else s = move(s, s.pending.options[0].id);
      if (!s.queue.some(t => t.t === 'turn') && s.pending?.kind !== 'place' && s.pending?.kind !== 'buy') break;
    }
    expect(p0).toBe(3);
    expect(s.log.some(l => /P1's Night Owl: no free space this round, so no extra turn/.test(l))).toBe(true);
  });

  it('Bookkeeper pays once the extra (true last) minion\'s turn ends, not on the Overtime minion (Cory 2026-10-15)', () => {
    // P1 has 2 on the board and 1 left; takes Overtime (3rd), then the extra turn places a 4th
    let s = sc(QP, { round: 2, left: 1, slots: { '0-0': 0, '0-1': 0 }, members: [['purple.bookkeeper']], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = take(s, 'purple.overtime');
    expect(s.players[0].res.purple).toBe(0); // not the last minion: an extra turn is coming
    while (s.pending?.kind === 'buy') s = move(s, 'pass');
    s = move(s, s.pending.options.find(o => o.kind === 'slot').id);
    while (s.pending?.kind === 'buy' && s.pending.player === 0) s = move(s, 'pass');
    expect(s.players[0].res.purple).toBe(2); // floor(4/2) when the last turn ends
  });

  it('Bookkeeper + Night Owl: the same pay whichever card you bought first (Cory 2026-10-15)', () => {
    const run = members => {
      let s = sc(QP, { round: 2, left: 1, slots: { '0-0': 0, '0-1': 0, '0-2': 0, '0-3': 0 }, members: [members], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
      s = take(s, 'purple.hourly'); // 5 purple; 5th minion
      while (s.pending?.kind === 'buy') s = move(s, 'pass');
      s = move(s, s.pending.options.find(o => o.kind === 'slot').id); // Night Owl's 6th
      while (s.pending?.kind === 'buy' && s.pending.player === 0) s = move(s, 'pass');
      return s.players[0].res.purple - 5;
    };
    expect(run(['purple.bookkeeper', 'purple.nightowl'])).toBe(3); // floor(6/2)
    expect(run(['purple.nightowl', 'purple.bookkeeper'])).toBe(3);
  });
});

describe('audit: log lines', () => {
  it('Grand Host: Toast and Rising Tide log what the taker got, doubled', () => {
    let s = take(sc(QP, { round: 2, members: [['silver.grandhost']] }), 'silver.toast');
    expect(s.players[0].res.silver).toBe(12);
    expect(s.log.some(l => /raised a toast: \+12 silver/.test(l))).toBe(true);
    s = take(sc(QP, { round: 2, res: [{}, { silver: 5 }], members: [['silver.grandhost']] }), 'silver.tide');
    expect(s.players[0].res.silver).toBe(6);
    expect(s.log.some(l => /Rising Tide: \+1 silver to everyone else, then \+6 silver/.test(l))).toBe(true);
  });
});
