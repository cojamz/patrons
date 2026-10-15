// Reads a filmstrip's probe.json (film.mjs with PROBE=1) and reports what makes motion look rough, exactly (fake clock):
//  - kinks: a flying ghost's path turning sharply between two frames mid-flight (a polyline "arc" with a corner);
//  - cut-offs: an animation started on an element while another one replacing the same property was still running
//    there (the second snaps the first away: a stack mid-settle jumping to a dip, a chip mid-hop jumping to a ring);
//  - the chain's span: first and last ghost seen, and how long ghosts were in the air.
//   node design/prototypes/motion/probe.mjs <film outdir> [--json]
import { readFileSync } from 'node:fs';

const [dir] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const P = JSON.parse(readFileSync(`${dir}/probe.json`, 'utf8'));

// ---- kinks ----
const paths = new Map();
for (const fr of P.tracks) for (const [id, cls, x, y] of fr.g) { if (!paths.has(id)) paths.set(id, { cls, pts: [] }); paths.get(id).pts.push([fr.t, x, y]); }
const kinks = [];
let firstGhost = Infinity, lastGhost = -Infinity;
for (const [id, { cls, pts }] of paths) {
  firstGhost = Math.min(firstGhost, pts[0][0]); lastGhost = Math.max(lastGhost, pts[pts.length - 1][0]);
  // the direction of travel between frames; a turn of more than 30° in one frame, while it moves at least 3px a frame
  let worst = 0, at = null;
  for (let i = 2; i < pts.length; i++) {
    const ax = pts[i - 1][1] - pts[i - 2][1], ay = pts[i - 1][2] - pts[i - 2][2], bx = pts[i][1] - pts[i - 1][1], by = pts[i][2] - pts[i - 1][2];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la < 3 || lb < 3) continue;
    const ang = Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))) * 180 / Math.PI;
    if (ang > worst) { worst = ang; at = pts[i - 1][0]; }
  }
  if (worst > 30) kinks.push({ id, cls: cls.trim(), turn: Math.round(worst), at });
}

// ---- cut-offs ----
const TRANSFORM = new Set(['transform', 'translate', 'scale', 'rotate']);
const group = p => (TRANSFORM.has(p) ? 'transform' : p);
const byEl = new Map();
for (const a of P.anims) { if (a.ghost) continue; if (!byEl.has(a.id)) byEl.set(a.id, []); byEl.get(a.id).push(a); }
const cuts = [];
for (const list of byEl.values()) {
  list.sort((a, b) => a.born - b.born);
  for (let i = 1; i < list.length; i++) {
    const b = list[i];
    if (b.composite === 'add') continue;
    for (let j = 0; j < i; j++) {
      const a = list[j];
      const end = a.born + a.delay + a.dur;
      const start = b.born + b.delay;
      if (start <= a.born + a.delay || start >= end - 8) continue; // b begins inside a's run (not at its very end)
      const shared = b.props.map(group).filter(p => a.props.map(group).includes(p));
      // translate on one and scale on the other compose (separate properties); transform replaces them all
      const clash = shared.filter(p => p !== 'transform' || a.props.includes('transform') || b.props.includes('transform') || a.props.some(x => b.props.includes(x)));
      if (clash.length) cuts.push({ el: b.label, first: a.props.join('+'), then: b.props.join('+'), into: Math.round(start - a.born - a.delay), of: a.dur });
    }
  }
}
const sum = {};
for (const c of cuts) { const k = `${c.el}: ${c.first} cut by ${c.then}`; sum[k] = (sum[k] || 0) + 1; }
const out = { ghosts: paths.size, inAir: isFinite(firstGhost) ? [firstGhost, lastGhost] : null, kinks: kinks.length, kinkList: kinks.slice(0, 20), cuts: cuts.length, cutKinds: sum };
console.log(JSON.stringify(out, null, process.argv.includes('--json') ? 0 : 1));
