// Prints every live sphere's spaces (ring, name, text), its contest, and its members (cost, worth, text),
// read straight from the engine, so a pitch starts from what's live, not from docs that lag.
// Usage: node .claude/skills/brainstorm/scripts/live-board.mjs [sphere ...] [--members]
import { quadrant, allQuadrantIds } from '../../../../src/engine/v4/index.js';
import { CUT } from '../../../../src/engine/v4/content/cull.js';
import { guestMembers } from '../../../../src/engine/v4/content/index.js';

const args = process.argv.slice(2);
const showMembers = args.includes('--members');
const want = args.filter(a => !a.startsWith('--'));
const ids = (want.length ? want : allQuadrantIds()).filter(id => !['guest', 'blue', 'green'].includes(id)); // blue/green are test stand-ins; the real ones are market and echo
const ROMAN = ['', 'I', 'II', 'III'];
// s = colored part, w = "any" part, f = followers it's worth, n = how many members it counts as
const card = (m, color) => `${m.s ? `${m.s} ${color} + ` : ''}${m.w} any, worth ${m.f}${m.n > 1 ? `, counts as ${m.n}` : ''}`;

for (const id of ids) {
  let q;
  try { q = quadrant(id); } catch { console.log(`? ${id}: not a sphere`); continue; }
  console.log(`\n## ${q.name} (${id}) · resource: ${q.resource}`);
  if (q.contest || q.scoring) console.log(`contest: ${JSON.stringify(q.contest?.text ?? q.contest?.label ?? q.scoring?.text ?? q.contest ?? q.scoring)}`);
  for (const a of [...q.actions].sort((x, y) => x.ring - y.ring)) console.log(`  ${ROMAN[a.ring] || a.ring}  ${a.name}: ${a.text}`);
  if (showMembers) for (const m of q.members.filter(m => !CUT.has(m.id))) console.log(`    · ${m.name} [${card(m, q.resource)}] ${m.text ?? ''}`);
}

if (showMembers && !want.length) {
  console.log('\n## Guests (no color, cost only "any")');
  for (const m of guestMembers().filter(m => !CUT.has(m.id))) console.log(`    · ${m.name} [${m.w} any, worth ${m.f}] ${m.text ?? ''}`);
}
