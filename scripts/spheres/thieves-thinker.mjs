// One thinking seat (rollouts) vs greedy bots on the Black table. Does Black reward planning?
// Usage: node scripts/spheres/thieves-thinker.mjs [games=24] [mode=loot] [rollouts=6]
// Note: in loot mode the rollouts can't release loot piles at round start (that needs the engine hook),
// so the thinker's rollouts see loot as stuck; the real game loop below does release it.
import { install, setScoring, releaseLoot } from '../../src/engine/v4/content/thieves.js';
import { createGame, applyMove, chooseBotMove, actionAt } from '../../src/engine/v4/index.js';
import { chooseThinkerMove } from '../../src/engine/v4/thinker.js';
import { seededRandom } from '../../src/engine/v4/rng.js';

install();
const N = Number(process.argv[2] || 24), MODE = process.argv[3] || 'loot', R = Number(process.argv[4] || 6);
if (MODE !== 'control') setScoring(MODE);
let wins = 0, blackPlace = 0, places = 0, contestWins = 0, botBlack = 0, botPlaces = 0, stole = 0, botStole = 0;
for (let g = 1; g <= N; g++) {
  const rand = seededRandom(g * 7 + 3);
  const me = g % 4;
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 7000 + g, quadrants: ['gold', 'red', 'blue', MODE === 'control' ? 'green' : 'thieves'] });
  let last = s.round;
  while (!s.over) {
    const mv = s.pending.player === me ? chooseThinkerMove(s, rand, { rollouts: R }) : chooseBotMove(s, rand);
    const o = s.pending.options.find(x => x.id === mv.option);
    if (s.pending.kind === 'place') {
      const black = o.q === 3;
      if (s.pending.player === me) { places++; blackPlace += black; } else { botPlaces++; botBlack += black; }
    }
    s = applyMove(s, mv);
    if (MODE === 'loot' && s.round !== last) { s = structuredClone(s); releaseLoot(s); last = s.round; }
  }
  if (s.ranking[0] === me) wins++;
  for (const t of s.thefts || []) { if (t.by === me) stole += t.n; else botStole += t.n; }
  contestWins += s.players[me].contest;
  console.error(`${g}/${N}: thinker wins ${wins}`);
}
console.log(`[${MODE}] thinker win rate ${(100 * wins / N).toFixed(0)}% over ${N} games (25% = no better than greedy)`);
console.log(`thinker places on Black ${(100 * blackPlace / places).toFixed(0)}% of the time vs greedy ${(100 * botBlack / botPlaces).toFixed(0)}%; units stolen per game: thinker ${(stole / N).toFixed(1)} vs each greedy bot ${(botStole / N / 3).toFixed(1)}`);
