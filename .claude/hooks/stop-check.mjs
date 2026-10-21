// Stop: before a turn ends, make sure nothing Cory said or the thread did is left unsaved.
// Each check fires once per thing (a note, a dirty set), so it nudges and never loops.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
if (input.stop_hook_active) process.exit(0);
process.chdir(process.env.CLAUDE_PROJECT_DIR || input.cwd || '.');

const sh = c => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, CULTS_SESSION: input.session_id || process.env.CULTS_SESSION } }).toString().trim(); } catch { return ''; } };
const dir = '/tmp/cults-stop-check';
try { mkdirSync(dir, { recursive: true }); } catch {}
const once = key => { const f = `${dir}/${createHash('sha1').update(key).digest('hex')}`; if (existsSync(f)) return false; writeFileSync(f, ''); return true; };
const asks = [];

// 1. Cory's latest long note: design calls, verdicts and corrections get logged the same turn.
let note = null;
try {
  for (const l of readFileSync(input.transcript_path, 'utf8').split('\n')) {
    if (!l.includes('trust=\\"principal\\"') && !l.includes('author=\\"user\\"')) continue;
    const e = JSON.parse(l);
    if (e.type !== 'user') continue;
    const c = e.message?.content;
    const s = typeof c === 'string' ? c : (c || []).map(x => x.text || '').join(' ');
    const m = [...s.matchAll(/<(?:message|cited)[^>]*(?:from="human"|author="user")[^>]*id="(cmsg_\w+)"[^>]*>([\s\S]*?)<\/(?:message|cited)>/g)]
      .concat([...s.matchAll(/<cited id="(cmsg_\w+)" author="user"[^>]*>([\s\S]*?)<\/cited>/g)]);
    for (const [, id, body] of m) if (body.trim().length > 280) note = { id, at: new Date(e.timestamp).getTime() };
  }
} catch {}
if (note) {
  const logs = ['design/decisions.md', 'design/pitch-ledger.md', '.claude/rules/working-with-cory.md'];
  // Logged = a commit touching the file after the note, or an uncommitted edit to it (mtime lies after a checkout).
  const touched = logs.some(f => existsSync(f) && (Number(sh(`git log -1 --format=%ct -- ${f}`)) * 1000 > note.at || sh(`git status --porcelain -- ${f}`)));
  if (!touched && once(`note:${note.id}`)) asks.push(`Cory's note ${note.id} is long enough to carry calls. Log any design call to design/decisions.md (date, one line, why), any pitch verdict to design/pitch-ledger.md, any correction to how we work in .claude/rules/working-with-cory.md with a changelog line. If there is truly nothing to log, carry on.`);
}

// 1b. A finished job leaves a lesson: code commits this thread made, and nothing new in design/lessons/.
let started = 0;
try { started = new Date(JSON.parse(readFileSync(input.transcript_path, 'utf8').split('\n')[0]).timestamp || 0).getTime(); } catch {}
if (started) {
  const since = `--since=${Math.floor(started / 1000)}`;
  const code = sh(`git log ${since} --format=%h -- src scripts e2e .claude/hooks`);
  const lessons = sh(`git log ${since} --format=%h -- design/lessons`) || sh('git status --porcelain -- design/lessons');
  if (code && !lessons && once(`lesson:${input.session_id}:${code.split('\n')[0]}`)) asks.push('This thread committed code but left no lesson. If anything was slow, surprising or corrected, add one line to the matching design/lessons/<topic>.md (what happened · the rule · where it now lives). Nothing learned is a fine answer: carry on.');
}

// 2. Doc and harness edits get committed and pushed, so the next thread sees them.
const dirty = sh('git status --porcelain -- design .claude CLAUDE.md AGENTS.md scripts');
if (dirty && once(`dirty:${dirty}`)) asks.push(`Uncommitted docs/harness changes:\n${dirty.split('\n').slice(0, 8).join('\n')}\nCommit and push them (git pull --rebase first) unless they're mid-change.`);

// 3. The thread's line on the status board stays current.
const mine = sh('node scripts/status.mjs mine');
let rec = null; try { rec = JSON.parse(mine); } catch {}
if (!rec) {
  if (once(`nostatus:${input.session_id}`)) asks.push('This thread has no line on the status board. Run: node scripts/status.mjs set --thread "<thread title>" --state working|waiting|blocked|done --doing "…" --next "…" --eta "<Eastern 12h>" --cory "<what he owes, if waiting>".');
} else if (rec.state === 'working' && rec.ageMin > 20 && once(`stale:${rec.updated}`)) {
  asks.push(`Your status line is ${rec.ageMin} min old ("${rec.doing}"). Refresh it with node scripts/status.mjs set --doing … --next … --eta …, or set --state waiting/done.`);
}

if (asks.length) console.log(JSON.stringify({ decision: 'block', reason: asks.join('\n\n') }));
