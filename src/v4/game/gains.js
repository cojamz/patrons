// What moved between two states, and where each piece came from (Cory, 2026-10-15: "animations for actions and
// follower gain, member gain, etc, should all go clearly directly to their source on the screen"). Pure: read from
// the engine's state diff (resources, followers, members) and its log (whose member did it, who bought what), never
// from labels on screen. GameScreen hands the result to flight.js (flyPieces), which finds the places on screen.
import { followers, cardDef } from '../../engine/v4/index.js';
import { newLogLines } from '../format.js';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Sources and targets: { kind: 'slot', key } a wheel space · { kind: 'member', pid, def } a member in a cult ·
 * { kind: 'stack', pid, r } a cult's resource stack · { kind: 'crowd', pid } a cult's members · { kind: 'card', uid } a
 * shop card (where it was) · { kind: 'rate', n } the follower buy for +n · { kind: 'hub' } the middle of the wheel ·
 * { kind: 'total', pid } a cult's follower count.
 * Returns [{ what: 'res'|'fol', r?, n, from, to }] in the order they should fly (losses first, then gains).
 */
export function gainsBetween(before, state) {
  if (!before || !state || before === state || before.seed !== state.seed) return [];
  if (!(state.moves > before.moves)) return []; // an undo or a reload: nothing travels
  const lines = newLogLines(before, state);
  const newRound = state.round !== before.round;
  const actor = before.pending ? before.pending.player : null;
  const placed = newRound ? [] : Object.keys(state.slots).filter(k => before.slots[k] === undefined);
  const placedKey = placed.length ? placed[placed.length - 1] : null;
  const R = state.resources;
  const d = state.players.map((p, i) => Object.fromEntries(R.map(r => [r, (p.res[r] || 0) - (before.players[i].res[r] || 0)])));
  const out = [];
  const take = (pid, r, n, from, to) => { if (n > 0) out.push({ what: 'res', r, n, from, to }); };

  // 1. a member's own line ("Bo's Treasurer: +4 gold.", "Bo +1 silver (Ana's Retinue).") sends from that member
  for (const p of state.players) {
    for (const u of p.members) {
      let def;
      try { def = cardDef(state, u); } catch { continue; }
      const own = new RegExp(`(^|\\(|\\s)${esc(p.name)}'s ${esc(def.name)}(?![A-Za-z0-9À-ɏ])`);
      for (const l of lines) {
        if (!own.test(l)) continue;
        for (const m of l.matchAll(/(?:^|[\s(])([^\s(:]+) \+(\d+) (\w+)|: \+(\d+) (\w+)/g)) {
          const who = m[1] ? state.players.find(x => x.name === m[1]) : p;
          const n = Number(m[2] || m[4]), r = m[3] || m[5];
          if (!who || !R.includes(r) || !(d[who.id][r] > 0)) continue;
          const k = Math.min(n, d[who.id][r]);
          d[who.id][r] -= k;
          take(who.id, r, k, { kind: 'member', pid: p.id, def: def.id }, { kind: 'stack', pid: who.id, r });
        }
      }
    }
  }
  // 2. one player's loss is another's gain (a steal, a gift): straight from stack to stack
  for (const r of R) {
    for (const g of state.players) {
      for (const q of state.players) {
        if (g.id === q.id || !(d[g.id][r] > 0) || !(d[q.id][r] < 0)) continue;
        const k = Math.min(d[g.id][r], -d[q.id][r]);
        d[g.id][r] -= k; d[q.id][r] += k;
        take(g.id, r, k, { kind: 'stack', pid: q.id, r }, { kind: 'stack', pid: g.id, r });
      }
    }
  }
  // 3. what's left of a loss went somewhere: the card recruited, the followers bought, the space's trade, else the bank
  const recruited = state.players.map((p, i) => p.members.filter(u => !before.players[i].members.includes(u) && before.shop.includes(u)));
  const boughtN = state.players.map((p, i) => (p.bonus || 0) - (before.players[i].bonus || 0));
  for (const p of state.players) {
    for (const r of R) {
      if (!(d[p.id][r] < 0)) continue;
      const to = recruited[p.id].length ? { kind: 'card', uid: recruited[p.id][0] }
        : boughtN[p.id] > 0 ? { kind: 'rate', n: boughtN[p.id] }
          : placedKey && p.id === actor ? { kind: 'slot', key: placedKey } : { kind: 'hub' };
      out.unshift({ what: 'res', r, n: -d[p.id][r], from: { kind: 'stack', pid: p.id, r }, to, pay: true });
      d[p.id][r] = 0;
    }
  }
  // 4. what's left of a gain: the space just taken (the placer's take and any spill to rivals), a member released or a
  // new round's income (from the cult's members), else the middle of the wheel
  const released = lines.some(l => / released .* for /.test(l));
  for (const p of state.players) {
    for (const r of R) {
      if (!(d[p.id][r] > 0)) continue;
      const from = placedKey ? { kind: 'slot', key: placedKey } : newRound || (released && p.id === actor) ? { kind: 'crowd', pid: p.id } : { kind: 'hub' };
      take(p.id, r, d[p.id][r], from, { kind: 'stack', pid: p.id, r });
      d[p.id][r] = 0;
    }
  }
  // 5. followers: a buy flies from the rate, a recruit from the card's old place, a space's gift from the space.
  // Round-end prizes are the Reckoning's (it flies them itself).
  if (!newRound) {
    for (const p of state.players) {
      const f = followers(state, p) - followers(before, before.players[p.id]);
      if (!(f > 0)) continue;
      const from = boughtN[p.id] > 0 ? { kind: 'rate', n: boughtN[p.id] }
        : recruited[p.id].length ? { kind: 'card', uid: recruited[p.id][0] }
          : placedKey ? { kind: 'slot', key: placedKey } : { kind: 'hub' };
      out.push({ what: 'fol', n: f, from, to: { kind: 'total', pid: p.id } });
    }
  }
  return out;
}
