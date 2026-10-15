// What bends a member's price, and what releasing it gives back: short lines for the pay dialog and the member card.
// Read off the engine, never off card names: the price is core.js memberPrice (the one price rule), the release is
// core.js releaseRefund / canRelease, and the rule-changers are the same member flags the price rule reads
// (costReduction, goldPaysDouble, anyColorPart), named by the cards that carry them.
import { cardDef, defById, quadrant, memberPrice } from '../../engine/v4/index.js';
import { canRelease, releaseRefund } from '../../engine/v4/core.js';

const defsOf = card => [defById(card.def), ...(card.copy ? [defById(card.copy)] : [])];
const colorOf = def => { try { return quadrant(def.quadrant).resource; } catch { return def.quadrant; } };

/**
 * Every rule-changer that bends what p pays for member uid right now, one short line each: [{ key, text }].
 * "Penny Pincher: your gold counts double", "Your discount: −4 off this member (used up)"…, then the price it comes
 * to when that differs from the printed one ("Comes to 2 instead of 6").
 */
export function priceNotes(state, p, uid) {
  const out = [];
  if (!p || uid == null || !state.cards[uid]) return out;
  const def = cardDef(state, uid);
  const printed = (def.s || 0) + (def.w || 0);
  if (!printed) return out;
  if (p.discount) out.push({ key: 'discount', text: `Your discount: −${p.discount} off this member (then it’s used up)` });
  for (const u of p.members) {
    for (const d of defsOf(state.cards[u])) {
      if (d.costReduction) out.push({ key: `cut:${u}`, text: `${d.name}: −${d.costReduction === true ? 1 : d.costReduction} off every member` });
      if (d.goldPaysDouble) out.push({ key: `gold:${u}`, text: `${d.name}: your gold counts double` });
      if (d.anyColorPart && def.s) out.push({ key: `any:${u}`, text: `${d.name}: its colored part can be paid in any colors` });
    }
  }
  const c = colorOf(def);
  if (def.s && !state.resources.includes(c)) out.push({ key: 'colorless', text: `Colorless here: its ${def.s} ${c} is paid in any colors (${c} isn’t on this table)` });
  let total = null;
  try { total = memberPrice(state, p, uid).total; } catch { /* an older engine */ }
  if (out.length && total != null && total !== printed) out.push({ key: 'total', text: `Comes to ${total} instead of ${printed}${p.members.some(u => defsOf(state.cards[u]).some(d => d.goldPaysDouble)) ? ' (each gold pays 2)' : ''}` });
  return out;
}

/**
 * What releasing member uid would give back, from the engine: { ok, text }, or null when the table has no release.
 * "Release: 4 gold back", "Release: 2 back, in any colors (…)", "Can’t be released: no colored part"…
 * owner: the player holding it (null for a card in the shop or the pile: then only what it would give back).
 */
export function releaseNote(state, uid, owner = null) {
  if (!state.rules || !state.rules.release || uid == null || !state.cards[uid]) return null;
  const back = releaseRefund(state, uid);
  const c = colorOf(cardDef(state, uid));
  if (!back.n) return { ok: false, text: 'Can’t be released: no colored part' };
  const card = state.cards[uid];
  if (owner) {
    if (card.used) return { ok: false, text: 'Can’t be released: already used' };
    if (card.recruitedRound === state.round && card.recruitedBy === owner.id) return { ok: false, text: 'Can’t be released yet: recruited this round' };
  }
  const gives = back.color ? `Release: ${back.n} ${back.color} back` : `Release: ${back.n} back, in any colors (its colored part is ${c}, not on this table)`;
  if (owner && !canRelease(state, owner)) return { ok: true, text: `${gives}, from next round (one release a round)` };
  return { ok: true, text: gives };
}
