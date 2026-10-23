// Every space's words, side by side with what the engine actually does, for each round.
// For each space: the rule text, the hover's per-round lines, the wheel panel's lines, the short and pip faces, and a
// probe: a real bot-played position at that round, P1 takes the space (first real choice each time), and the sheet
// prints every change it made (resources, followers, members, turns, log). Then mechanical flags.
//   node .claude/skills/review-text/scripts/text-sheet.mjs [sphere ...] [--rounds 1,2,3] [--out file.md]
// Sphere ids: red echo thieves market purple gold silver yellow trading. Default: all.
import { writeFileSync } from 'node:fs';
import { createGame, applyMove, chooseBotMove, quadrant, allQuadrantIds } from '../../../../src/engine/v4/index.js';
import { followers, cardDef, resume } from '../../../../src/engine/v4/core.js';
import { seededRandom } from '../../../../src/engine/v4/rng.js';
import { shortEffect, pipEffect } from '../../../../src/v4/shorts.js';
import { panelText, lineText } from '../../../../src/v4/game/panelText.js';

const argv = process.argv.slice(2);
const flag = k => { const i = argv.indexOf(k); return i < 0 ? null : argv.splice(i, 2)[1]; };
const out = flag('--out');
const rounds = (flag('--rounds') || '1,2,3').split(',').map(Number);
const want = argv.filter(a => !a.startsWith('--'));
const SPHERES = (want.length ? want : allQuadrantIds()).filter(id => !['guest', 'blue', 'green', 'benders'].includes(id));
const ROMAN = ['', 'I', 'II', 'III'];
const lines = [];
const say = s => lines.push(s);
const flags = [];
const flagIt = (where, what) => flags.push(`- ${where}: ${what}`);

// a 4-player table with this sphere first and three others, bots play until P1 places in round r with rivals down
const FILL = ['gold', 'red', 'thieves', 'echo', 'purple', 'silver', 'yellow', 'market', 'trading'];
function position(sphere, r, pile = 'lean') {
  const quads = [sphere, ...FILL.filter(x => x !== sphere)].slice(0, 4);
  const seats = [0, 1, 2, 3].map(i => ({ name: `P${i + 1}`, kind: 'bot' }));
  for (let seed = 1; seed < 60; seed++) {
    let s = createGame({ seats, seed, quadrants: quads });
    const rand = seededRandom(seed);
    const ready = x => x.round === r && x.pending && x.pending.player === 0 && x.pending.kind === 'place' && Object.keys(x.slots).length >= 2;
    for (let n = 0; n < 4000 && !ready(s) && !(s.round > r) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
    if (!ready(s)) continue;
    // an uneven pile (fewest/most reads differ), rivals with some of everything and some followers
    s.resources.forEach((c, k) => { s.players[0].res[c] = pile === 'lean' ? [3, 2, 1, 0][k % 4] : 3 + (k === 0 ? 1 : 0); });
    s.players.slice(1).forEach((p, i) => { for (const c of s.resources) p.res[c] = 2 + i; p.bonus = Math.max(p.bonus, 2 + 2 * i); });
    return s;
  }
  return null;
}

const snap = s => ({
  res: s.players.map(p => ({ ...p.res })), fol: s.players.map(p => followers(s, p)),
  mem: s.players.map(p => p.members.map(u => cardDef(s, u).name)), shop: s.shop.map(u => cardDef(s, u).name),
  log: s.log.length, queue: s.queue.filter(t => t.t === 'turn').map(t => `P${t.p + 1}`).join(' '),
});
function diff(a, b, s) {
  const out = [];
  s.players.forEach((p, i) => {
    const parts = [];
    for (const c of s.resources) { const d = (b.res[i][c] || 0) - (a.res[i][c] || 0); if (d) parts.push(`${d > 0 ? '+' : ''}${d} ${c}`); }
    const df = b.fol[i] - a.fol[i]; if (df) parts.push(`${df > 0 ? '+' : ''}${df} followers`);
    const gone = a.mem[i].filter(x => !b.mem[i].includes(x)), got = b.mem[i].filter(x => !a.mem[i].includes(x));
    if (got.length) parts.push(`members in: ${got.join(', ')}`);
    if (gone.length) parts.push(`members out: ${gone.join(', ')}`);
    if (parts.length) out.push(`${i ? `P${i + 1}` : 'P1 (taker)'} ${parts.join(', ')}`);
  });
  const shopOut = a.shop.filter(x => !b.shop.includes(x));
  if (shopOut.length) out.push(`shop lost: ${shopOut.join(', ')}`);
  if (a.queue !== b.queue) out.push(`turns ahead: ${a.queue || '-'} → ${b.queue || '-'}`);
  return out;
}
// the first real choice: never back/undo/pass/"don't"; prefer one that moves something
const SKIP = /^(back|undo|pass|cancel|@unpick|none|noswap|no-swap|skip|done|keep|dont|don't)/i;
function probe(sphere, key, r, pile) {
  const s0 = position(sphere, r, pile);
  if (!s0) return { err: 'no position reached' };
  const i = quadrant(sphere).actions.findIndex(a => a.key === key);
  const occupant = s0.slots[`0-${i}`];
  delete s0.slots[`0-${i}`];
  let s = resume(s0);
  const before = snap(s);
  const opt = s.pending && s.pending.options.find(o => o.kind === 'slot' && o.q === 0 && o.i === i);
  if (!opt) return { err: `space not offered (${s.pending && s.pending.kind})` };
  const asks = [];
  try {
    s = applyMove(s, { player: 0, option: opt.id });
    // answer P1's own follow-up choices until the recruit, the next placement or someone else's turn
    for (let n = 0; n < 12 && s.pending && s.pending.player === 0 && !['buy', 'place'].includes(s.pending.kind); n++) {
      const os = s.pending.options;
      const pick = os.find(o => o.default && !SKIP.test(String(o.id))) || os.find(o => !SKIP.test(String(o.id)) && !SKIP.test(String(o.label || ''))) || os[0];
      asks.push(`${s.pending.prompt || s.pending.kind} → ${pick.label || pick.id}`);
      s = applyMove(s, { player: 0, option: pick.id });
    }
  } catch (e) { return { err: e.message, asks }; }
  return { changes: diff(before, snap(s), s), asks, log: s.log.slice(before.log).map(String), occupant, next: s.pending ? `${s.pending.kind} for P${s.pending.player + 1}` : 'none' };
}

// ---------- the sheet ----------
const nums = t => (String(t).match(/\d+/g) || []).map(Number);
for (const id of SPHERES) {
  const q = quadrant(id);
  say(`\n## ${q.name} (${id})`);
  for (const a of [...q.actions].sort((x, y) => x.ring - y.ring)) {
    say(`\n### ${a.name} · ring ${ROMAN[a.ring]} · ${id}.${a.key}`);
    say(`- rule: ${a.text}`);
    if (a.byRound) say(`- hover by round: ${a.byRound.lead ? `[lead] ${a.byRound.lead} ` : ''}${a.byRound.lines.map((l, k) => `${ROMAN[k + 1]}: ${l}`).join(' | ')}${a.byRound.rest ? ` [rest] ${a.byRound.rest}` : ''}`);
    const scalesInText = /round II|round III|× ?round|each round/i.test(a.text);
    if (scalesInText && !a.byRound) flagIt(`${a.name}`, 'the rule grows by round but has no per-round hover lines, so the hover never shows this round\'s number');
    if (a.byRound) {
      // the hover lines must say what the rule says: same numbers per round
      const ruleNums = nums(a.text), byNums = a.byRound.lines.flatMap(nums);
      for (const n of byNums) if (!ruleNums.includes(n)) flagIt(a.name, `hover line number ${n} is not in the rule text`);
      const rw = new Set(a.text.toLowerCase().match(/[a-z’']+/g)), bw = a.byRound.lines.join(' ').toLowerCase().match(/[a-z’']+/g) || [];
      const extra = [...new Set(bw.filter(w => !rw.has(w) && !rw.has(w.replace(/s$/, '')) && !rw.has(`${w}s`)))];
      if (extra.length) flagIt(a.name, `hover lines use words the rule doesn't: ${extra.join(', ')}`);
    }
    for (const r of rounds) {
      if (a.ring > r) continue;
      const pt = panelText(id, a, r);
      const panel = [pt.main || pt.verb, pt.second, pt.note && lineText(pt.note)].filter(Boolean);
      say(`- round ${ROMAN[r]} wheel panel: ${panel.map(x => `"${x}"`).join(' / ')} · short "${shortEffect(id, a, r)}" · pips "${pipEffect(id, a, r)}"`);
      if (scalesInText && !panel.join(' ').match(/\d/)) flagIt(`${a.name} round ${ROMAN[r]}`, 'panel shows no number though the rule grows by round');
      // two piles: lean (3/2/1/0 by color, so "fewest" and "none of" bite) and full (3 of each, 4 of the sphere's own)
      for (const pile of ['lean', 'full']) {
        const pr = probe(id, a.key, r, pile);
        if (pr.err) { say(`  - ${pile} pile: probe failed: ${pr.err}`); flagIt(`${a.name} round ${ROMAN[r]}`, `probe failed: ${pr.err}`); continue; }
        say(`  - ${pile} pile did: ${pr.changes.length ? pr.changes.join('; ') : 'nothing visible'}${pr.occupant !== undefined ? ` (space freed from P${pr.occupant + 1} for the probe)` : ''}`);
        if (pr.asks.length) say(`    asked: ${pr.asks.join(' · ')}`);
        if (pr.log.length) say(`    log: ${pr.log.join(' | ')}`);
        say(`    then: ${pr.next}`);
      }
    }
  }
}
// stale face entries: a short/pip/panel key that names no live space
say('\n## Mechanical flags');
say(flags.length ? [...new Set(flags)].join('\n') : '- none');
const text = lines.join('\n') + '\n';
if (out) { writeFileSync(out, text); console.log(`wrote ${out} (${flags.length} flags)`); } else process.stdout.write(text);
