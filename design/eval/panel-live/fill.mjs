// node fill.mjs <round> <sha>  → design/eval/panel-live/r<round>/{tester-a,tester-b,skeptic}.md
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const [round, sha] = process.argv.slice(2);
const show = p => execSync(`git show ${sha}:${p}`, { maxBuffer: 1 << 24 }).toString();
const brief = show('design/eval/critic-calibration/brief.md');
const body = brief.split('\n---\n')[1].trim();
const checklist = show('design/eval/critic-calibration/checklist.md');
const rulebook = show('design/rulebook.md');
const taste = show('design/taste.md');
const house = taste.slice(taste.indexOf("## Cory's own calls")).split('\n').slice(1).join('\n').trim();
const turnClarity = `6. **Turn clarity (Cory's check).** After every rival turn, before any hover and before opening the log, write one line in \`{DIR}/turns.md\`: who gained what, and why, read from the board alone. Then check it against the log. Every gain you couldn't name, named wrong, or only caught on the log is a finding, at least **major**. Count them: rival turns read right / total.`;
const extra = `\n\n## Laptop only\nPlay at the default laptop size (about 1270×700). Phone is out of scope this round: never use --device phone.\n`;
const tables = JSON.parse(process.env.TABLES);
const out = `design/eval/panel-live/r${round}`;
mkdirSync(out, { recursive: true });
for (const [role, t] of Object.entries(tables)) {
  const port = { 'tester-a': 9521, 'tester-b': 9522, skeptic: 9523 }[role];
  let p;
  if (role === 'skeptic') {
    const posture = show('.claude/agents/game-skeptic.md').split('\n---\n').slice(1).join('\n---\n').trim();
    p = `${posture}\n\n---\n# This run\nFresh and blind: you've never seen this game. The checklist is below, so you needn't open the repo's copy.\n\nURL: http://localhost:5190/ · eyes port: ${port} (\`export EYES_PORT=${port}\`, start with \`--name skeptic --port ${port}\`). Write to /tmp/patrons-skeptic/.\n\n## Your table\n${t}\n\n## Also, every run\n${turnClarity.replace('{DIR}', '/tmp/patrons-skeptic')}\n${extra}\n## House style (the designer's written calls; a violation is a finding)\n${house}\n\n## The checklist\n${checklist}\n\n## The rulebook\n${rulebook}\n`;
  } else {
    p = body.replace('## Five things every run must do (the misses that cost the last panel)', '## Six things every run must do (the misses that cost the last panel)')
      .replace(/(5\. \*\*Restraint before relabel\.\*\*[^\n]*\n)/, `$1${turnClarity}\n`)
      .replace('{ASSIGNMENT}', t + extra)
      .replace('{HOUSE_STYLE}', house).replace('{CHECKLIST}', checklist).replace('{RULEBOOK}', rulebook)
      .replaceAll('{URL}', 'http://localhost:5190/').replaceAll('{PORT}', String(port))
      .replaceAll('{NAME}', role).replaceAll('{DIR}', `/tmp/panel/${role}`);
  }
  if (process.env.FAST) p = fast(p);
  writeFileSync(`${out}/${role}.md`, p);
  console.log(role, p.length, (p.match(/\{[A-Z_]+\}/g) || []));
}

// FAST (from round 3, Cory: "why does grading take so long"): speed numbers come from the quiet gate, so the panel
// plays round I at Steady for feel and the rest at Quick, drops the finding quota and grades on enough evidence.
function fast(p) {
  const subs = [
    ["Play at a person's pace at the default speed, except for the speed ladder below.",
     "Play round I at the default speed (Steady) to judge feel and motion. From round II on, open the ☰ menu and set Speed to Quick, and keep moving: no lingering."],
    [/1\. \*\*Speed ladder\.\*\*[^\n]*/,
     "1. **Pace by eye (speed is measured elsewhere).** Skip the speed ladder and motion-log. In round I at Steady, say for each kind of chain (your placement, a bot turn, the round-end scoring) whether you could follow every step, with one `frames 8` each. Once, set Relaxed for a single bot turn: is it clearly slower? Then Quick."],
    ["At three moments (early round I, mid round II, round III) do a **hover sweep**", "Once, in round II, do a **hover sweep**"],
    ["In every hover sweep, read each hover's", "In the hover sweep, read each hover's"],
    ["For at least 12 placements", "For at least 8 placements"],
    ["for 12+ placements", "for 8+ placements"],
    [/1\. \*\*Speed ladder:\*\*[^\n]*/, "1. **Pace by eye (speed is measured elsewhere):** skip the speed ladder. In round I at Steady, one `frames 8` each for your placement, a bot turn and the round-end scoring: could you follow every step? Once, Relaxed for one bot turn: clearly slower? Then Quick."],
    [/11\. \*\*Speed ladder:\*\*[^\n]*/, "11. **Pace by eye:** for each chain you filmed at Steady, could you follow it, and was Relaxed clearly slower?"],
    [/- Then \*\*the speed ladder table\*\*[^\n]*/, "- Then **pace by eye**: one line per chain you filmed at Steady, and the Relaxed check."],
    ["- **List EVERYTHING, aiming for at least 40 findings.** Small ones count.", "- **List everything you found; there's no quota.** Small ones count."],
    ["list EVERYTHING, at least 40,", "list everything you found (no quota)"],
    [/- Time box: about 45 minutes of play[^\n]*/,
     "- Time box: about 20 minutes of play, then 5 to write up. Spend at most 2 minutes before the game starts. Play to the results screen at Quick, and don't re-walk a screen state you've already covered. Grade as soon as you have enough evidence for each grade line."],
    ["Then a second, shorter session that plays badly on purpose", "Then at most 5 minutes that play badly on purpose"],
  ];
  for (const [a, b] of subs) p = p.replace(a, b);
  p = p.replace('- Do the speed ladder and the hover-complete reads even when the default "seems fine".', '- Do the hover-complete reads even when the default "seems fine".');
  p = `**This round is a fast round, and these rules override anything below that conflicts:** speed is measured on a quiet machine elsewhere, so skip the speed ladder, motion-log and checklist 28a's ratios (judge pace by eye only). Play round I at Steady for feel, then Quick to the end. No finding quota. About 20 minutes of play, then grade as soon as you have the evidence.\n\n` + p;
  if (!/Time box: about 20/.test(p)) p += "\n\n## Time box\nAbout 20 minutes of play plus 5 minutes of abuse, then 5 to write up. Round I at Steady for feel, then Quick to the results screen. No finding quota: grade as soon as you have enough evidence.\n";
  return p;
}
