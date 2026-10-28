// Bump the player-facing release and add a real changelog entry before checking/committing.
import {readFileSync,writeFileSync} from 'node:fs';
const [kind,...words]=process.argv.slice(2),note=words.join(' ').trim();
if(!['patch','point','minor'].includes(kind)||!note)throw new Error('Usage: npm run version:v4 -- patch|point|minor "Player-facing change summary"');
const path='src/v4/version.js',source=readFileSync(path,'utf8');
const match=source.match(/export const VERSION = 'v(\d+)\.(\d+)\.(\d+)';/);
if(!match)throw new Error('Expected semantic VERSION in src/v4/version.js');
let [major,minor,patch]=match.slice(1).map(Number);
// (Cory, Oct 28: "stop iterating the version number so quickly") a small publish is a sub-step: v0.9.8 → v0.9.801 →
// v0.9.802; `point` moves to the next whole step (v0.9.8xx → v0.9.9) for a release he'd call one
if(kind==='minor'){minor++;patch=0;}else if(kind==='point')patch=patch>=100?Math.floor(patch/100)+1:patch+1;else patch=patch>=100?patch+1:patch*100+1;
const version=`v${major}.${minor}.${patch}`,date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const changelog=readFileSync('CHANGELOG.md','utf8'),heading='\n## ';
const at=changelog.indexOf(heading);
if(at<0)throw new Error('Expected release sections in CHANGELOG.md');
writeFileSync(path,source.replace(match[0],`export const VERSION = '${version}';`));
writeFileSync('CHANGELOG.md',changelog.slice(0,at)+`\n## ${version} — ${date}\n\n- ${note}\n`+changelog.slice(at));
console.log(`${match[0].match(/v[\d.]+/)[0]} → ${version}; update verification/release status after shipping.`);
