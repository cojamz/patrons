// "+1 of its color" for any card (Cory, 2026-10-30): a guest has no color, so nothing; Dabblers counts as every color,
// so its owner picks one of the table's colors (benders.pickColor).
export function gainColorOf(ctx, p, def, who) {
  if (def.everyColor) {
    const colors = ctx.state.quadrants.map(q => ctx.quadrant(q).resource).filter(r => ctx.state.resources.includes(r));
    if (!colors.length) return;
    ctx.choose(p, `${who}: +1 of which color?`, colors.map(r => ({ id: r, label: r[0].toUpperCase() + r.slice(1), kind: 'choice', value: r })), 'benders.pickColor', { who });
    return;
  }
  const r = ctx.quadrant(def.quadrant)?.resource;
  if (ctx.state.resources.includes(r)) ctx.gain(p, r, 1);
}
