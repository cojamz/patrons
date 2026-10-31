#!/usr/bin/env node
// One live status line per thread, rendered into a single board Cory can scan.
// Usage:
//   node scripts/status.mjs set --thread "Harness rework" --state working --doing "…" --next "…" [--eta "9:30pm"] [--cory "what he owes"]
//   node scripts/status.mjs board        # print the board (and rewrite board.md / board.html)
//   node scripts/status.mjs mine         # print this thread's line (used by hooks)
//   node scripts/status.mjs touch        # refresh head/dirty/updated without changing words (PreCompact)
// States: working · waiting (on Cory) · blocked · done.
// Files live in /mnt/project-files/status/ (shared by every thread); elsewhere (Codex, a laptop) in .status/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const SHARED = '/mnt/project-files/status';
const DIR = process.env.CULTS_STATUS_DIR || (existsSync('/mnt/project-files') ? SHARED : '.status');
const STALE_MIN = 30;
const STATES = ['working', 'waiting', 'blocked', 'done'];

const [cmd = 'board', ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) args[rest[i].slice(2)] = rest[i + 1]?.startsWith('--') || rest[i + 1] === undefined ? true : rest[++i];
}

const session = process.env.CULTS_SESSION || 'local';
const sh = c => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const eastern = d => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })
  .format(d).replace(' ', '').toLowerCase();
const day = d => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(d);

mkdirSync(DIR, { recursive: true });
const all = () => readdirSync(DIR).filter(f => f.endsWith('.json'))
  .map(f => { try { return JSON.parse(readFileSync(join(DIR, f), 'utf8')); } catch { return null; } })
  .filter(Boolean);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const findMine = () => all().find(r => r.session === session);

function git() {
  const head = sh('git rev-parse --short HEAD');
  const branch = sh('git rev-parse --abbrev-ref HEAD');
  const dirty = sh('git status --porcelain').split('\n').filter(Boolean).length;
  return { head, branch, dirty };
}

function write(rec) {
  rec.updated = new Date().toISOString();
  Object.assign(rec, git());
  writeFileSync(join(DIR, `${rec.id}.json`), JSON.stringify(rec, null, 2) + '\n');
  render();
  return rec;
}

function line(r, now = new Date()) {
  const age = Math.round((now - new Date(r.updated)) / 60000);
  const stale = r.state === 'working' && age > STALE_MIN;
  const when = `${day(new Date(r.updated))} ${eastern(new Date(r.updated))}`;
  const bits = [`${r.thread}`, r.state + (stale ? ` (quiet ${age} min)` : ''), r.doing];
  if (r.next) bits.push(`next: ${r.next}`);
  if (r.eta) bits.push(`ETA ${r.eta}`);
  if (r.cory) bits.push(`needs Cory: ${r.cory}`);
  return { text: bits.join(' · ') + ` · ${when}`, stale, r };
}

function render() {
  const now = new Date();
  const order = { waiting: 0, blocked: 1, working: 2, done: 3 };
  const rows = all().filter(r => r.state !== 'done' || now - new Date(r.updated) < 864e5)
    .sort((a, b) => order[a.state] - order[b.state] || new Date(b.updated) - new Date(a.updated))
    .map(r => line(r, now));
  const live = sh('git show origin/main:play/build.json');
  let liveLine = '';
  try { const b = JSON.parse(live); liveLine = `Live: ${b.version} (${b.commit.slice(0, 7)})`; } catch {}
  const md = [`# Threads, ${day(now)} ${eastern(now)} Eastern`, liveLine, '',
    ...rows.map(x => `- ${x.text}`), ''].join('\n');
  writeFileSync(join(DIR, 'board.md'), md);
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const html = `<!doctype html><meta charset="utf-8"><title>Threads</title><style>
:root{--bg:#faf8f4;--fg:#222;--mute:#777;--warn:#b5651d;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#1b1a18;--fg:#eee;--mute:#999;--warn:#e0a060;--card:#262421}}
body{background:var(--bg);color:var(--fg);font:15px/1.4 system-ui,sans-serif;margin:16px;max-width:760px}
li{background:var(--card);list-style:none;margin:6px 0;padding:8px 12px;border-radius:8px}
.s{font-weight:600}.m{color:var(--mute)}.q{color:var(--warn)}ul{padding:0}</style>
<h3>Threads · ${esc(day(now))} ${esc(eastern(now))}</h3><p class="m">${esc(liveLine)}</p><ul>
${rows.map(({ r, stale }) => `<li><span class="s">${esc(r.thread)}</span> · <span class="${stale || r.state !== 'working' ? 'q' : ''}">${esc(r.state)}${stale ? ' (quiet)' : ''}</span><br>${esc(r.doing)}${r.next ? `<br><span class="m">next: ${esc(r.next)}${r.eta ? ' · ETA ' + esc(r.eta) : ''}</span>` : ''}${r.cory ? `<br><span class="q">needs Cory: ${esc(r.cory)}</span>` : ''}</li>`).join('\n')}
</ul>`;
  writeFileSync(join(DIR, 'board.html'), html);
  return rows;
}

if (cmd === 'set') {
  const prev = findMine();
  const thread = args.thread || prev?.thread;
  if (!thread) { console.error('First call needs --thread "<this thread\'s title>"'); process.exit(2); }
  if (args.state && !STATES.includes(args.state)) { console.error(`--state is one of ${STATES.join(', ')}`); process.exit(2); }
  const rec = { ...(prev || {}), id: prev?.id || slug(thread), thread, session };
  for (const k of ['state', 'doing', 'next', 'eta', 'cory']) if (args[k] !== undefined) rec[k] = args[k] === true ? '' : args[k];
  rec.state ||= 'working';
  if (!rec.doing) { console.error('--doing is required the first time'); process.exit(2); }
  if (args.state && args.state !== 'waiting' && args.cory === undefined) rec.cory = '';
  console.log(line(write(rec)).text);
} else if (cmd === 'touch') {
  const r = findMine(); if (r) write(r);
} else if (cmd === 'mine') {
  const r = findMine();
  if (!r) { console.log('none'); process.exit(1); }
  const age = Math.round((Date.now() - new Date(r.updated)) / 60000);
  console.log(JSON.stringify({ ...r, ageMin: age }));
} else {
  const rows = render();
  console.log(readFileSync(join(DIR, 'board.md'), 'utf8').trim() || 'No threads yet.');
  if (!rows.length) console.log('(no thread has posted a status yet)');
}
