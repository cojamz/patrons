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
    p = `You are game-skeptic (your agent brief is your posture). Fresh and blind: you've never seen this game.\n\nURL: http://localhost:5190/ · eyes port: ${port} (\`export EYES_PORT=${port}\`, start with \`--name skeptic --port ${port}\`). Write to /tmp/patrons-skeptic/.\n\n## Your table\n${t}\n\n## Also, every run\n${turnClarity.replace('{DIR}', '/tmp/patrons-skeptic')}\n${extra}\n## House style (the designer's written calls; a violation is a finding)\n${house}\n\n## The checklist\n${checklist}\n\n## The rulebook\n${rulebook}\n`;
  } else {
    p = body.replace('## Five things every run must do (the misses that cost the last panel)', '## Six things every run must do (the misses that cost the last panel)')
      .replace(/(5\. \*\*Restraint before relabel\.\*\*[^\n]*\n)/, `$1${turnClarity}\n`)
      .replace('{ASSIGNMENT}', t + extra)
      .replace('{HOUSE_STYLE}', house).replace('{CHECKLIST}', checklist).replace('{RULEBOOK}', rulebook)
      .replaceAll('{URL}', 'http://localhost:5190/').replaceAll('{PORT}', String(port))
      .replaceAll('{NAME}', role).replaceAll('{DIR}', `/tmp/panel/${role}`);
  }
  writeFileSync(`${out}/${role}.md`, p);
  console.log(role, p.length, (p.match(/\{[A-Z_]+\}/g) || []));
}
