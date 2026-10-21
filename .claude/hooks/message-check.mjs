// PreToolUse on messages to Cory: bounce the voice rules he has corrected more than twice.
// Hard rules always bounce. Length bounces once; resending the identical text means "he asked for detail".
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const text = String(input.tool_input?.text ?? '');
if (!text.trim()) process.exit(0);

// Strip code spans and URLs so paths and links don't trip the checks.
const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '').replace(/https?:\/\/\S+/g, '');
const lines = text.split('\n').filter(l => l.trim());
const numbered = lines.filter(l => /^\s*\d+[.)] /.test(l)).length;
const words = prose.split(/\s+/).filter(Boolean).length;

const hard = [];
if (/^\s*\|.*\|\s*$/m.test(text) && /\|\s*:?-{3,}/.test(text)) hard.push('no tables');
if (/^\s*#{1,6} /m.test(text)) hard.push('no headers');
if (/^\s*[-*]?\s*\*\*[^*]+:\*\*/m.test(text)) hard.push('no bold-label report voice');
if (/\bUTC\b|\b\d{1,2}:\d{2}\s?Z\b|\b(1[3-9]|2[0-3]):[0-5]\d\b/.test(prose)) hard.push("times in Cory's Eastern 12-hour clock, like 7:43pm");
if (/—/.test(prose)) hard.push('no em dashes; use a comma, period or parentheses');
const tics = [/\bfair point\b/i, /\bhere['’]s what\b/i, /\bthe real test\b/i, /\bwant me to\b/i, /\blet me know if\b/i,
  /\bgreat question\b/i, /\bi apologi[sz]e\b/i, /\bsorry\b/i, /\babsolutely\b/i, /\bhappy to\b/i, /\bshould i\b.*\?/i];
const hit = tics.filter(r => r.test(prose)).map(r => prose.match(r)[0]);
if (hit.length) hard.push(`drop the AI tics or offers: "${hit.join('", "')}"`);
const internals = prose.match(/\b(sessions?|subagents?|wakes?|coordinator|cmsg_\w+)\b/i);
if (internals) hard.push(`don't talk about internals ("${internals[0]}"); name the thread or say what's happening in the game`);

if (/\bv[34]\b(?!\.\d)/i.test(prose)) hard.push('"v3"/"v4" mean nothing to Cory; say "the old game" / "the game" (version numbers like v0.8.11 are fine)');
if (/\bnetlify\b/i.test(prose)) hard.push("don't mention Netlify; it's retired and its red check is noise (Cory corrected this twice)");

const soft = [];
const maxLines = numbered >= 2 ? Math.max(8, numbered + 3) : 8;
if (lines.length > maxLines) soft.push(`${lines.length} lines (cap ${maxLines}); put the rest in a file and link it`);
if (words > (numbered >= 2 ? 220 : 160)) soft.push(`${words} words; cut to the result, what's next and any ask`);

if (!hard.length && !soft.length) process.exit(0);

const dir = '/tmp/cults-message-check';
const key = createHash('sha1').update(text).digest('hex');
if (!hard.length) {
  // Second identical send after a length bounce goes through: Claude decided the detail was asked for.
  try { mkdirSync(dir, { recursive: true }); } catch {}
  if (existsSync(`${dir}/${key}`)) process.exit(0);
  try { writeFileSync(`${dir}/${key}`, ''); } catch {}
}
const reason = `Message to Cory bounced (foreman voice): ${[...hard, ...soft].join('; ')}.` +
  (hard.length ? ' Rewrite and send again.' : ' Shorten it, or resend the identical text if he asked for this detail.');
console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
