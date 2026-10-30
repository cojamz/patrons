// Reads a v4-hard-learn.mjs run and prints how play changed over the series, 20 games at a time (markdown).
// Usage: node scripts/v4-hard-learn-report.mjs <run dir> [window=20]
import { readFileSync, existsSync } from 'node:fs';
import { quadrant, defById } from '../src/engine/v4/content/index.js';

const dir = process.argv[2] || 'design/eval/hard-learn', W = Number(process.argv[3] || 20);
const rows = readFileSync(`${dir}/games.jsonl`, 'utf8').trim().split('\n').map(l => JSON.parse(l)).sort((a, b) => a.game - b.game);
const color = q => { try { return quadrant(q).name; } catch { return q; } };
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : 'n/a');
const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const top = (counts, n = 5) => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(', ');
const out = [];
const mix = rows.some(r => r.players.some(p => p.oldHard));
out.push(`# ${mix ? 'Planning Hard vs the Hard before plans' : 'Hard chain'}: ${rows.length} games (${dir})`, '');

const bots = r => r.players.filter(p => !p.buyer);
for (let i = 0; i < rows.length; i += W) {
  const win = rows.slice(i, i + W);
  const seats = win.flatMap(bots);
  const styles = {}, styleWins = {}, colors = {}, arts = {}, members = {}, winMembers = {}, spaces = {};
  let changes = 0;
  for (const p of seats) {
    if (p.oldHard) continue;
    const open = p.plan[0];
    if (open) {
      styles[open.style] = (styles[open.style] || 0) + 1;
      if (p.win) styleWins[open.style] = (styleWins[open.style] || 0) + 1;
      colors[color(open.colors[0])] = (colors[color(open.colors[0])] || 0) + 1;
    }
    changes += Math.max(0, p.plan.length - 1);
    if (p.artifact) arts[color(p.artifact)] = (arts[color(p.artifact)] || 0) + 1;
    for (const m of p.members) { members[m] = (members[m] || 0) + 1; if (p.win) winMembers[m] = (winMembers[m] || 0) + 1; }
    for (const [k, c] of Object.entries(p.places || {})) {
      const [q, key] = k.split(':');
      const a = quadrant(q).actions.find(x => x.key === key);
      const name = `${a ? a.name : key} (${color(q)})`;
      spaces[name] = (spaces[name] || 0) + c;
    }
  }
  const winners = win.flatMap(r => r.players.filter(p => p.win));
  const buyerGames = win.filter(r => r.buyer >= 0);
  const buyerWins = buyerGames.filter(r => r.players[r.buyer].win).length;
  out.push(`## Games ${win[0].game}-${win.at(-1).game}${win[0].notesFrom !== undefined ? ` (notes from ${win[0].notesFrom}+ games)` : ''}`);
  if (mix) {
    const neu = seats.filter(p => !p.oldHard), old = seats.filter(p => p.oldHard);
    out.push(`- Planning Hard won ${pct(neu.filter(p => p.win).length, neu.length)} of its seats, avg ${avg(neu.map(p => p.followers)).toFixed(1)} followers; the Hard before plans ${pct(old.filter(p => p.win).length, old.length)}, avg ${avg(old.map(p => p.followers)).toFixed(1)}`);
  }
  out.push(
    `- Opening styles: ${Object.entries(styles).map(([s, n]) => `${s} ${n} (won ${pct(styleWins[s] || 0, n)})`).join(', ')}`,
    `- First color picked: ${top(colors, 6)}`,
    `- Artifacts taken: ${top(arts, 6)}`,
    `- Plan changes mid-game: ${(changes / Math.max(1, seats.filter(p => !p.oldHard).length)).toFixed(2)} a seat`,
    `- Winner's followers ${avg(winners.map(p => p.followers)).toFixed(1)}, every bot seat ${avg(seats.map(p => p.followers)).toFixed(1)}; members ${avg(seats.map(p => p.memberCount)).toFixed(1)} a seat; followers bought ${avg(seats.map(p => p.bought)).toFixed(1)} a seat`,
    `- Buy-followers-only seat won ${buyerWins} of ${buyerGames.length}`,
    `- Most recruited: ${top(members, 6)}`,
    `- In winners' cults: ${top(winMembers, 6)}`,
    `- Busiest spaces: ${top(spaces, 6)}`,
    '',
  );
}
const all = rows.flatMap(bots);
const bg = rows.filter(r => r.buyer >= 0);
out.push(`Buy-followers-only seat, whole run: won ${bg.filter(r => r.players[r.buyer].win).length} of ${bg.length} games (${pct(bg.filter(r => r.players[r.buyer].win).length, bg.length)}).`);
out.push(`Average bot seat: ${avg(all.map(p => p.followers)).toFixed(1)} followers.`, '');

if (existsSync(`${dir}/memory.json`)) {
  const mem = JSON.parse(readFileSync(`${dir}/memory.json`, 'utf8'));
  const name = id => { try { return defById(id).name; } catch { return id; } };
  const read = (kind, label, n = 6) => {
    const xs = Object.entries(mem[kind] || {}).filter(([, s]) => s.n >= 2).map(([k, s]) => [label(k), s.sum / s.n, s.n]);
    xs.sort((a, b) => b[1] - a[1]);
    const f = ([k, v, c]) => `${k} ${v >= 0 ? '+' : ''}${v.toFixed(1)} (${c.toFixed(0)})`;
    out.push(`- ${kind}: best ${xs.slice(0, n).map(f).join(', ')}; worst ${xs.slice(-n).reverse().map(f).join(', ')}`);
  };
  out.push(`## What the notes say after ${mem.games} games (followers over the table average, weight of evidence)`);
  read('styles', s => s, 3);
  read('colors', color);
  read('artifacts', color);
  read('members', name, 8);
  read('spaces', k => { const [q, key] = k.split(':'); const a = quadrant(q).actions.find(x => x.key === key); return `${a ? a.name : key} (${color(q)})`; }, 8);
}
console.log(out.join('\n'));
