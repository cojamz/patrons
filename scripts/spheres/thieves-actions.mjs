// Action value on the Black table: force one seat's first placement of a round onto an action, compare against
// the same games where the bot chose freely. Black's actions are read against Cory's anchors on the same ring.
// Usage: node scripts/spheres/thieves-actions.mjs [games=120] [mode=loot]
import { install, setScoring, releaseLoot } from '../../src/engine/v4/content/thieves.js';
import { createGame, applyMove, chooseBotMove, followers, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';

install();
const N = Number(process.argv[2] || 120), MODE = process.argv[3] || 'loot';
setScoring(MODE);
const QUADS = ['gold', 'red', 'blue', 'thieves'];
const LIST = [
  ['Joint Venture', 1], ['Rush', 1], ['Hire', 1], ['Pickpocket', 1], ['Hideout', 1], ['Fence', 1],
  ['Steal', 2], ['Windfall', 2], ['Hire Up', 2], ['Trade', 2], ['Rob', 2], ['Ransom', 2],
  ['Strike', 3], ['Take', 3], ['Heist', 3],
];
function play(seed, force) {
  const rand = seededRandom(seed * 104729 + 7);
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed, quadrants: QUADS });
  let last = s.round, done = !force, ok = !force;
  const seat = seed % 4;
  while (!s.over) {
    let mv = chooseBotMove(s, rand);
    if (!done && s.round === force[1] && s.pending.kind === 'place' && s.pending.player === seat) {
      const o = s.pending.options.find(x => actionAt(s, x.q, x.i).name === force[0]);
      done = true;
      if (o) { mv = { player: seat, option: o.id }; ok = true; }
    }
    s = applyMove(s, mv);
    if (MODE === 'loot' && s.round !== last) { s = structuredClone(s); releaseLoot(s); last = s.round; }
  }
  return ok ? followers(s, s.players[seat]) : null;
}
const control = [];
for (let g = 1; g <= N; g++) control.push(play(g, null));
console.log(`Action value (${N} games, scoring ${MODE}): followers vs the bot's own first pick that round. Forced as the seat's FIRST pick of the round.`);
for (const f of LIST) {
  let d = 0, n = 0;
  for (let g = 1; g <= N; g++) { const v = play(g, f); if (v !== null) { d += v - control[g - 1]; n++; } }
  console.log(`R${f[1]} ${f[0].padEnd(14)} ${(n ? d / n : NaN).toFixed(2).padStart(6)}  (n=${n})`);
}
