// Build markdown tables for the balance doc from report JSONs. Usage: node tables.mjs <hard4.json> <hard23.json> <norm4.json>
import { readFileSync } from 'node:fs';
const root = new URL('../src/engine/v4/content/index.js', import.meta.url).href;
const { allQuadrantIds, quadrant, guestMembers } = await import(root);
const [h4, h23, n4] = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')));
const color = {}; for (const id of allQuadrantIds()) color[id] = quadrant(id).name;
color.benders = 'Guest';
const text = {};
for (const id of allQuadrantIds()) for (const m of quadrant(id).members || []) text[`${m.name} (${id})`] = m;
for (const m of guestMembers()) text[`${m.name} (benders)`] = m;
const spaceText = {};
for (const id of allQuadrantIds()) for (const a of quadrant(id).actions || []) spaceText[`${id}: ${a.name}`] = a.text;
const row = (t, k) => t.memberTable.find(r => r.k === k);
const cell = r => (r ? `${r.lift >= 0 ? '+' : ''}${Math.round(r.lift * 100)} (${r.n})` : '–');
const keys = [...new Set([...h4.memberTable, ...h23.memberTable, ...n4.memberTable].map(r => r.k))];
const score = k => { const a = row(h4, k), b = row(h23, k); const xs = [a, b].filter(r => r && r.n >= 15); return xs.length ? xs.reduce((s, r) => s + r.lift * r.n, 0) / xs.reduce((s, r) => s + r.n, 0) : (row(n4, k)?.lift ?? 0); };
keys.sort((a, b) => score(b) - score(a));
const out = ['| Member | Color | Cost | What it does | Hard 4p | Hard 2-3p | Normal 4p |', '| --- | --- | --- | --- | --- | --- | --- |'];
for (const k of keys) {
  const name = k.replace(/ \(.*\)$/, ''), q = k.match(/\((.*)\)$/)[1];
  const r = row(n4, k) || row(h4, k) || row(h23, k);
  out.push(`| ${name} | ${color[q] || q} | ${r.cost} | ${(text[k]?.text || '').replace(/\|/g, '/')} | ${cell(row(h4, k))} | ${cell(row(h23, k))} | ${cell(row(n4, k))} |`);
}
console.log(out.join('\n'));
console.log('\n---SPACES---');
const srow = (t, k) => t.spaceTable.find(r => r.k === k);
const skeys = [...new Set([...h4.spaceTable, ...n4.spaceTable].map(r => r.k))];
skeys.sort((a, b) => ((srow(h4, b)?.lift ?? 0) + (srow(n4, b)?.lift ?? 0)) - ((srow(h4, a)?.lift ?? 0) + (srow(n4, a)?.lift ?? 0)));
const sc = r => (r ? `${r.lift >= 0 ? '+' : ''}${Math.round(r.lift * 100)}` : '–');
const so = ['| Space | Color | What it does | Hard 4p | Hard 2-3p | Normal 4p |', '| --- | --- | --- | --- | --- | --- |'];
for (const k of skeys) { const [q, n] = k.split(': '); so.push(`| ${n} | ${color[q] || q} | ${(spaceText[k] || '').replace(/\|/g, '/')} | ${sc(srow(h4, k))} | ${sc(srow(h23, k))} | ${sc(srow(n4, k))} |`); }
console.log(so.join('\n'));
console.log('\n---COLORS---');
for (const [lab, t] of [['Hard 4p', h4], ['Hard 2-3p', h23], ['Normal 4p', n4]]) console.log(lab, Object.entries(t.colors).map(([q, v]) => `${color[q]} ${v.n ? `${v.w / v.n >= v.e / v.n ? '+' : ''}${Math.round((v.w - v.e) / v.n * 100)} (${v.n})` : ''}`).join(', '));
for (const [lab, t] of [['Hard 4p', h4], ['Hard 2-3p', h23], ['Normal 4p', n4]]) console.log(lab, Object.entries(t.artifacts).map(([k, v]) => `${k} ${Math.round((v.w - v.e) / v.n * 100)} (${v.n})`).join(', '));
