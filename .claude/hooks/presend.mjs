// Run before every message to Cory. Chat threads don't run the repo's hooks (checked Oct 31: no SessionStart,
// PreToolUse or Stop hook fires there), so the voice check, the card-text check and new rules come from here.
//
//   node .claude/hooks/presend.mjs <<'EOF'
//   the exact message text
//   EOF
//
// Exit 0: send it. Exit 1: fix what it says and run it again. New rules from other threads print either way.
// --ok "Name" skips one card name that is a plain word here ("cover the cost"). --pitch marks a design pitch.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const okNames = new Set(args.flatMap((a, i) => (a === '--ok' ? [args[i + 1]] : [])));
const pitch = args.includes('--pitch');
const text = readFileSync(0, 'utf8').trim();
const problems = [];
const notes = [];

// 1. New rules from any thread since this thread last looked (shared folder, so it reaches running threads).
const LIVE = '/mnt/project-files/harness/rules-live.md';
const SEEN = '/tmp/cults-presend/rules-seen';
try {
  const all = readFileSync(LIVE, 'utf8').split('\n').filter(l => /^- /.test(l));
  let seen = 0;
  try { seen = Number(readFileSync(SEEN, 'utf8')) || 0; } catch {}
  if (all.length > seen) {
    console.log(`NEW RULES since this thread last checked (follow them in this message):\n${all.slice(seen).join('\n')}\n`);
    mkdirSync(dirname(SEEN), { recursive: true });
    writeFileSync(SEEN, String(all.length));
  }
} catch {}

if (!text) { console.log('No text on stdin.'); process.exit(1); }

// 2. The voice rules (the same check the hook would run).
const mc = spawnSync('node', [join(root, '.claude/hooks/message-check.mjs')], {
  input: JSON.stringify({ tool_input: { text } }), encoding: 'utf8',
});
if (mc.stdout.trim()) {
  try {
    const r = JSON.parse(mc.stdout).hookSpecificOutput.permissionDecisionReason;
    const hard = !/resend the identical text/.test(r);
    (hard ? problems : notes).push(r.replace(/^Message to Cory bounced \(foreman voice\): /, 'Voice: '));
  } catch {}
}

// 3. Every space or member named comes with its card text (Cory, Oct 31: "I DONT HAVE THE ACTION NAMES MEMORIZED").
const STOP = new Set('with from that this your their they them each when then than into onto also every round rival rivals gain gains take takes have more less once only after before which other until'.split(' '));
const words = s => s.toLowerCase().replace(/[’']/g, '').match(/[a-z]{4,}/g)?.filter(w => !STOP.has(w)) ?? [];
let cards = [];
try {
  const eng = await import(join(root, 'src/engine/v4/index.js'));
  const con = await import(join(root, 'src/engine/v4/content/index.js'));
  let cut = new Set();
  try { cut = (await import(join(root, 'src/engine/v4/content/cull.js'))).CUT; } catch {}
  for (const id of eng.allQuadrantIds()) {
    if (['guest', 'blue', 'green'].includes(id)) continue;
    let q; try { q = eng.quadrant(id); } catch { continue; }
    for (const a of q.actions || []) cards.push({ name: a.name, text: a.text || '' });
    for (const m of q.members || []) if (!cut.has(m.id)) cards.push({ name: m.name, text: m.text || '' });
  }
  for (const m of con.guestMembers?.() || []) if (!cut.has(m.id)) cards.push({ name: m.name, text: m.text || '' });
} catch (e) { notes.push(`Card check skipped (couldn't load the cards: ${e.message}).`); }

const prose = text.replace(/https?:\/\/\S+/g, '');
const lines = prose.split('\n');
const missing = [];
for (const c of cards) {
  if (!c.name || okNames.has(c.name) || c.name.length < 3) continue;
  const re = new RegExp(`(^|[^\\w])${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`);
  const cw = [...new Set(words(c.text))];
  for (let i = 0; i < lines.length; i++) {
    if (!re.test(lines[i])) continue;
    // its text belongs on the same line or the next one: a quote of 5+ words, or most of the card's own words
    const near = (lines[i] + ' ' + (lines[i + 1] || '')).replace(c.name, '');
    const quoted = /["“][^"”]{20,}["”]/.test(near) || /[:(]\s*\S+(\s+\S+){4,}/.test(near.split(c.name).pop() || near);
    const nw = new Set(words(near));
    const overlap = cw.length ? cw.filter(w => nw.has(w)).length / cw.length : 1;
    if (!(overlap >= 0.4 || (quoted && overlap >= 0.2) || (quoted && cw.length < 3))) { missing.push(`${c.name} ("${c.text.slice(0, 70)}${c.text.length > 70 ? '…' : ''}")`); break; }
  }
}
if (missing.length) problems.push(`Card text missing. Quote each card in full, next to its name, every time: ${missing.join('; ')}. If a name is only a plain word here, add --ok "Name".`);

// 4. A design pitch: the checklist in .claude/rules/pitching.md, done in writing before sending.
const looksLikePitch = pitch || (/(^|\n)\s*\d+[.)] .*["“]/.test(text) && /\b(pitch|idea|could|new space|new member|round I{1,3}\b)/i.test(text));
if (looksLikePitch) {
  notes.push('Pitch: before sending, for each idea you wrote down (1) one played turn at 4 players vs the best other space, by name and number, (2) both sides of every "choose": if one side always wins for the chooser, cut it, (3) who at the table feels it. Ideas that fail any of these are cut, not sent. See .claude/rules/pitching.md.');
}

for (const n of notes) console.log(`note: ${n}`);
if (problems.length) {
  console.log(`DON'T SEND YET:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('OK to send.');
