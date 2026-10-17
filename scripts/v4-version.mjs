// Bump the player-facing release and add a real changelog entry before checking/committing.
import {readFileSync,writeFileSync} from 'node:fs';
const [kind,...words]=process.argv.slice(2),note=words.join(' ').trim();
if(!['patch','minor'].includes(kind)||!note)throw new Error('Usage: npm run version:v4 -- patch|minor "Player-facing change summary"');
const path='src/v4/version.js',source=readFileSync(path,'utf8');
const match=source.match(/export const VERSION = 'v(\d+)\.(\d+)\.(\d+)';/);
if(!match)throw new Error('Expected semantic VERSION in src/v4/version.js');
let [major,minor,patch]=match.slice(1).map(Number);
if(kind==='minor'){minor++;patch=0;}else patch++;
const version=`v${major}.${minor}.${patch}`,date=new Date().toISOString().slice(0,10);
const changelog=readFileSync('CHANGELOG.md','utf8'),heading='\n## ';
const at=changelog.indexOf(heading);
if(at<0)throw new Error('Expected release sections in CHANGELOG.md');
writeFileSync(path,source.replace(match[0],`export const VERSION = '${version}';`));
writeFileSync('CHANGELOG.md',changelog.slice(0,at)+`\n## ${version} — ${date} — unreleased\n\n- ${note}\n`+changelog.slice(at));
console.log(`${match[0].match(/v[\d.]+/)[0]} → ${version}; update verification/release status after shipping.`);
