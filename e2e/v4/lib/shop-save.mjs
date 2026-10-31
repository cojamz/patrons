// Saved hot-seat games stopped at P1's buy step (before any click), for the pay-flow gate (e2e/v4/payflow.mjs) and the
// before/after shots in design/eval/panel-live/g2/: P1 with the resources, members and discount the test sets, and a
// member made face up. The Classic-like dialogs table (lib/dialog-save.mjs), P2–P4 bots.
import { createGame, applyMove, chooseBotMove } from '../../../src/engine/v4/index.js';
import { resume } from '../../../src/engine/v4/core.js';
import { seededRandom } from '../../../src/engine/v4/rng.js';
import { buildStamp } from './stamp.mjs';
import { freeCard } from './deal.mjs';
import { DIALOG_TABLE } from './dialog-save.mjs';

const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
const wrap = s => { s.build = buildStamp(); return { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() }; };

function give(s, pid, defId) {
  const c = s.cards[freeCard(s, defId)];
  s.shop = s.shop.filter(u => u !== c.uid); s.pile = s.pile.filter(u => u !== c.uid);
  s.players[pid].members.push(c.uid); c.recruitedRound = 0; c.recruitedBy = pid;
  return c.uid;
}
/** Puts a member (by def id) face up in the shop's first place; returns its uid. */
export function faceUp(s, defId) {
  if (s.shop.some(u => s.cards[u].def === defId)) return s.shop.find(u => s.cards[u].def === defId);
  const c = s.cards[freeCard(s, defId)];
  s.pile = s.pile.filter(u => u !== c.uid);
  s.pile.push(s.shop[0]);
  s.shop[0] = c.uid;
  return c.uid;
}

/** P1's buy step (round I or later): res, members (def ids), discount, rivals' resources, and `def` face up.
 *  Returns { save, uid } (uid: that member's). */
export function buySave({ def = 'gold.prospector', res = { gold: 3, red: 2, blue: 2, green: 3 }, members = [], discount = 0, seed = 3, rivals = null } = {}) {
  let s = createGame({ seats: SEATS, seed, quadrants: DIALOG_TABLE });
  const rand = seededRandom(seed);
  const ready = st => st.round >= 1 && st.pending && st.pending.player === 0 && st.pending.kind === 'buy';
  for (let n = 0; n < 2000 && !ready(s) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
  if (!ready(s)) throw new Error('shop-save: never reached P1’s buy step');
  s.players[0].res = { ...res };
  if (rivals) for (const q of s.players.slice(1)) q.res = { ...q.res, ...rivals };
  s.pile.push(...s.players[0].members); s.players[0].members = [];
  for (const d of members) give(s, 0, d);
  s.players[0].discount = discount;
  const uid = def ? faceUp(s, def) : null;
  resume(s);
  if (!(s.pending && s.pending.kind === 'buy' && s.pending.player === 0)) throw new Error('shop-save: not P1’s buy step after the edit');
  return { save: wrap(s), uid };
}
