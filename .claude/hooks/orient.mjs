// Printed into context at session start and after compaction: where things stand, in ~40 lines.
// Keep it short. Everything here is a pointer or a fact a fresh thread would otherwise re-derive.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const src = process.argv[2] || 'startup';
const sh = c => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const out = [];

let live = {};
try { live = JSON.parse(sh('git show origin/main:play/build.json')); } catch {}
const head = sh('git rev-parse --short HEAD');
const branch = sh('git rev-parse --abbrev-ref HEAD');
const ahead = live.commit ? sh(`git rev-list --count ${live.commit}..HEAD`) : '?';
out.push(`# Cults orientation (${src})`);
out.push(`Branch ${branch} at ${head}. Live play link: ${live.version || '?'} from ${String(live.commit || '?').slice(0, 7)}; this branch is ${ahead} commits past it.`);

const harnessDiff = sh('git diff --stat origin/main HEAD -- CLAUDE.md AGENTS.md .claude/settings.json .claude/hooks .claude/rules .claude/skills .claude/agents .claude/output-styles | tail -1');
if (harnessDiff) out.push(`Harness on main differs from this branch (${harnessDiff}). New threads load main's copy: run bash scripts/harness-sync-main.sh after committing harness changes.`);

const board = sh('node scripts/status.mjs board');
if (board) out.push('', board.replace(/^# .*\n/, '## Other threads\n'));

if (existsSync('design/HANDOFF.md')) {
  const h = readFileSync('design/HANDOFF.md', 'utf8').split('\n');
  const start = h.findIndex(l => /^#{1,2} /.test(l));
  const end = h.findIndex((l, i) => i > start && /^#{1,2} /.test(l));
  out.push('', '## HANDOFF.md, current section', ...h.slice(start + 1, end > 0 ? end : start + 25).filter(Boolean).slice(0, 18));
}

if (existsSync('design/decisions.md')) {
  const d = readFileSync('design/decisions.md', 'utf8').split('\n').filter(l => /^\s*[-*] /.test(l));
  out.push('', '## Last decisions (design/decisions.md)', ...d.slice(-6).map(l => l.slice(0, 220)));
}

out.push('', 'Before your first message to Cory: read .claude/output-styles/foreman.md. Before any design talk: design/strategy.md and design/pitch-ledger.md.',
  `Post your status as soon as you know your task: node scripts/status.mjs set --thread "<thread title>" --state working --doing "…" --next "…" --eta "<Eastern 12h>".`);
console.log(out.join('\n'));
