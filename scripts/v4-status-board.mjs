// Refresh the conversation's project board from the tracked release/work status and original-note audit.
import { readFileSync, writeFileSync } from 'node:fs';
const path = process.argv[2];
if (!path) throw new Error('Pass the existing project-board fragment path');
const status = JSON.parse(readFileSync('design/project-status.json', 'utf8'));
status.updated = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date());
status.feedback = readFileSync('design/feedback-audit-2026-10-16.md', 'utf8').split('\n').filter(l => /^\| \d+ \|/.test(l)).map(l => { const p=l.split('|');return {name:p[2].trim().replace(/[*`]/g,''),status:p[3].trim().replace(/[*`]/g,'')}; });
const json = JSON.stringify(status).replace(/</g, '\\u003c');
let html = readFileSync(path, 'utf8');
html = html.replace(/(<script type="application\/json" id="cpb-data">)[\s\S]*?(<\/script>)/, (_,a,b)=>a+json+b);
writeFileSync(path, html);
console.log(`Project board refreshed: ${status.work.length} workstreams, ${status.feedback.length} feedback items`);
