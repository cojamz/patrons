// Bot-vs-bot simulation for quick balance reads. Usage: npm run sim:v4 -- [games=300] [players=4]
import { createGame, applyMove, chooseBotMove, followers, memberCount } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const games = Number(process.argv[2] || 300), n = Number(process.argv[3] || 4);
const stats = { wins: Array(n).fill(0), followers: [], members: [], leftoverGold: [], moves: [], startPicks: {} };
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g });
  while (!s.over) s = applyMove(s, chooseBotMove(s, rand));
  stats.wins[s.ranking[0]]++;
  for (const p of s.players) {
    stats.followers.push(followers(s, p)); stats.members.push(memberCount(s, p)); stats.leftoverGold.push(p.res.gold);
  }
  stats.moves.push(s.moves);
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`${games} games, ${n} players`);
console.log(`wins by seat: ${stats.wins.join(' / ')}`);
console.log(`avg followers ${avg(stats.followers)} · avg members ${avg(stats.members)} · avg leftover gold ${avg(stats.leftoverGold)} · avg moves ${avg(stats.moves)}`);
