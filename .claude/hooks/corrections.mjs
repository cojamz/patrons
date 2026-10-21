// UserPromptSubmit: catch Cory correcting how Claude works, queue it for every thread, and count repeats.
// The queue is shared (/mnt/project-files/harness/corrections.jsonl), so a repeat in another thread still counts.
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const prompt = String(input.prompt || '');

// Only Cory's own words: messages from a human principal, or his cited messages in a relay.
const bodies = [...prompt.matchAll(/<message[^>]*from="human"[^>]*trust="principal"[^>]*>([\s\S]*?)<\/message>/g),
  ...prompt.matchAll(/<cited[^>]*author="user"[^>]*>([\s\S]*?)<\/cited>/g)].map(m => m[1].trim()).filter(Boolean);
if (!bodies.length) process.exit(0);

const CUES = [/\bno[,.!]/i, /\bdon'?t\b/i, /\bstop\b/i, /\bnot relevant\b/i, /\bi (said|told you|asked)\b/i, /\bagain\b/i,
  /\bwhy (are|did|do) you\b/i, /\bwhat the (fuck|hell)\b/i, /\btoo (long|much|aggressive|slow)\b/i, /\bslop\b/i,
  /\bthat'?s (wrong|not)\b/i, /\bnever\b/i, /\binstead\b/i, /\bshould(n'?t)? (be|have)\b/i, /\bidk what\b/i];
const STOP = new Set('the a an and or but to of in on for with is it that this you your i me my we our be are was were what how why just so not no do dont don\'t its it\'s at as by from about'.split(' '));
const words = t => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));

const dir = existsSync('/mnt/project-files') ? '/mnt/project-files/harness' : `${process.env.CLAUDE_PROJECT_DIR || '.'}/.status`;
const file = process.env.CULTS_CORRECTIONS_FILE || `${dir}/corrections.jsonl`;
let past = [];
try { past = readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch {}

const notes = [];
for (const body of bodies) {
  const hits = CUES.filter(r => r.test(body)).length;
  if (!hits || past.some(p => p.text === body)) continue;
  const w = words(body);
  const similar = past.filter(p => {
    const v = words(p.text); const inter = [...w].filter(x => v.has(x)).length;
    return inter >= 2 && inter / Math.min(w.size, v.size || 1) >= 0.3;
  });
  try { mkdirSync(file.replace(/\/[^/]*$/, ''), { recursive: true }); appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), session: input.session_id, text: body.slice(0, 600) }) + '\n'); } catch {}
  past.push({ text: body });
  const quote = body.length > 200 ? body.slice(0, 200) + '…' : body;
  notes.push(`Cory's message may correct how we work: "${quote}"` + (similar.length
    ? `\nIt resembles ${similar.length} earlier correction(s): ${similar.slice(-3).map(p => `"${p.text.slice(0, 120)}"`).join('; ')}. A repeat must become a check (hook, test or script) this turn, not another sentence.`
    : `\nIf it is a correction, fold it into .claude/rules/working-with-cory.md with a changelog line, and add a lesson in design/lessons/, this turn.`));
}
if (notes.length) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: notes.join('\n\n') } }));
