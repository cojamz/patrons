// Writes .xc/names.json: member/artifact id -> "Name (color) s/w f" for the cross-check reports.
import { writeFileSync } from 'node:fs';
import { allQuadrantIds, quadrant } from '../../src/engine/v4/index.js';
import { guestMembers } from '../../src/engine/v4/content/index.js';
const out = {};
for (const d of [...allQuadrantIds().flatMap(q => quadrant(q).members), ...guestMembers()]) out[d.id] = `${d.name} ${d.s}/${d.w} f${d.f}`;
writeFileSync('.xc/names.json', JSON.stringify(out));
