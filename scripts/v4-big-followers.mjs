// The pure "big followers" strategy (never recruits, plays for follower buys) against 3 normal bots.
// Target (Cory): it wins about 25% of 4-player games. The buyer's seat rotates every game; ties split.
// Usage: node scripts/v4-big-followers.mjs [games=200] [firstGame=1] [--no-release] [--no-guests]
import { createGame, applyMove, followers } from '../src/engine/v4/index.js';
import { chooseBotMove, chooseFollowerBuyerMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const games = Number(args[0] || 200), first = Number(args[1] || 1);
const rules = { release: !flags.has('--no-release'), guests: !flags.has('--no-guests') };
let wins = 0, buyerF = 0, others = 0, released = 0;
for (let g = first; g < first + games; g++) {
  const rand = seededRandom(g * 7717 + 3);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, rules });
  const buyer = g % 4;
  while (!s.over) {
    const m = s.pending.player === buyer ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand);
    if (m.option.startsWith('release:')) released++;
    s = applyMove(s, m);
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  const tied = s.players.filter(p => followers(s, p) === top);
  if (tied.some(p => p.id === buyer)) wins += 1 / tied.length;
  buyerF += followers(s, s.players[buyer]);
  others += s.players.filter(p => p.id !== buyer).reduce((a, p) => a + followers(s, p), 0) / 3;
}
console.log(`big followers vs 3 normal bots, ${games} games (from ${first}), release ${rules.release ? 'on' : 'off'}, guests ${rules.guests ? 'on' : 'off'}`);
console.log(`buyer wins ${(100 * wins / games).toFixed(1)}% · buyer followers ${(buyerF / games).toFixed(1)} · others ${(others / games).toFixed(1)} · releases per game ${(released / games).toFixed(1)}`);
