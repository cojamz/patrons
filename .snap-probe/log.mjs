import { createGame, applyMove, chooseBotMove } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
let s = createGame({ seats: [{ name: 'Ana', kind: 'bot' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }], seed: 7 });
const rand = seededRandom(7);
let n0 = 0;
for (let k = 0; k < 400 && !s.over; k++) { s = applyMove(s, chooseBotMove(s, rand)); }
const lines = s.log.map(l => typeof l === 'string' ? l : JSON.stringify(l));
console.log(lines.slice(0, 120).join('\n'));
console.log(Object.keys(s.players[0]));
