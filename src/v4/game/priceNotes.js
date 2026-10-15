// What bends a member's price: short lines for the pay dialog. Read off the engine, never off card names: the price is
// core.js memberPrice (the one price rule), and the rule-changers are the same member flags the price rule reads
// (costReduction, goldPaysDouble, anyColorPart), named by the cards that carry them.
import { cardDef, defById, quadrant, memberPrice } from '../../engine/v4/index.js';

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
