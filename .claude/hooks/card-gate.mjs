// PreToolUse on Edit/Write: the first edit to a card file in a thread asks whether it's Cory's confirmed call.
// "Never start building a pick he hasn't confirmed" as a check. Retrying the same edit goes through.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const path = String(input.tool_input?.file_path || '');
if (!/src\/engine\/v4\/content\/[^/]+\.js$/.test(path)) process.exit(0);
const dir = '/tmp/cults-card-gate';
const key = `${dir}/${String(input.session_id || 'x').replace(/\W/g, '')}-${path.split('/').pop()}`;
if (existsSync(key)) process.exit(0);
try { mkdirSync(dir, { recursive: true }); writeFileSync(key, ''); } catch {}
const reason = `Card file ${path.split('/').pop()}: before changing what a card does, its call must be Cory's and logged in design/decisions.md (or it's a bug fix that keeps his rule). If so, retry the same edit. If not, ask him first as a numbered pick.`;
console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
