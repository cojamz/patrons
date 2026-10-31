// A chain of Hard games where every Hard seat plays with a game plan and the notes of all the games before
// (src/engine/v4/mind.js). Games run `parallel` at a time; each wave starts from the notes of every finished game,
// so game g learns from games 1..g-parallel at least. 4 seats on random 2.0 tables (Cory, Oct 24), and every 5th
// game one seat only buys followers (the buy-followers-only check). Hard is uncapped, so a run repeats exactly.
// Usage: node scripts/v4-hard-learn.mjs [--games=100] [--parallel=4] [--from=1] [--out=design/eval/hard-learn]
//   --fresh-each: no notes carried (the control); --no-plan: the Hard before plans.
//   --mix [--notes=<memory.json>]: two planning Hard seats against two of the Hard before plans, notes fixed.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const flag = k => process.argv.includes(`--${k}`);

async function playOne({ g, memory, noPlan, mix }) {
  const { createGame, applyMove, followers, memberCount, allQuadrantIds, quadrant } = await import('../src/engine/v4/index.js');
  const { defById } = await import('../src/engine/v4/content/index.js');
  const { chooseBotMove, chooseFollowerBuyerMove } = await import('../src/engine/v4/bots.js');
  const { seededRandom } = await import('../src/engine/v4/rng.js');
  const { sphereVersion } = await import('../src/v4/tables.js');
  const rand = seededRandom(g * 7717 + 3);
  const pool = allQuadrantIds().filter(q => sphereVersion(q) === '2.0'), quads = [];
  while (quads.length < 4) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, quadrants: quads });
  const buyer = g % 5 === 0 ? g % 4 : -1;
  const minds = s.players.map(() => ({ memory }));
  // --mix: two seats play the Hard before plans (seats 1 and 3 in odd games, 0 and 2 in even ones)
  const old = i => i % 2 === g % 2;
  const places = s.players.map(() => ({}));
  while (!s.over) {
    const pl = s.pending.player;
    const m = pl === buyer ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, { level: 'hard', maxMs: Infinity, mind: minds[pl], noPlan: noPlan || (mix && old(pl)) });
    if (typeof m.option === 'string' && /^(slot|squat):/.test(m.option)) {
      const [q, i] = m.option.split(':')[1].split('-').map(Number);
      const a = quadrant(s.quadrants[q]).actions[i];
      if (a) { const k = `${s.quadrants[q]}:${a.key}`; places[pl][k] = (places[pl][k] || 0) + 1; }
    }
    s = applyMove(s, m);
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  const name = d => { try { return defById(d).name; } catch { return d; } };
  const final = { ...s, log: [], queue: [] };
  return {
    final,
    // the plan a seat opened with is what memory credits (the strategy it picked early)
    seats: s.players.map((p, i) => ({ plan: minds[i].log?.[0] ? { style: minds[i].log[0].style, colors: minds[i].log[0].colors } : null, places: places[i], onlyFollowers: i === buyer })),
    row: {
      game: g, table: quads, buyer, notesFrom: memory?.games || 0,
      players: s.players.map((p, i) => ({
        seat: i, followers: followers(s, p), win: followers(s, p) === top, buyer: i === buyer, oldHard: !!mix && old(i),
        plan: minds[i].log || [], members: p.members.map(u => name(s.cards[u].def)), memberCount: memberCount(s, p),
        artifact: p.artifact !== undefined ? s.cards[p.artifact].def.split('.')[0] : null,
        bought: p.bonus, places: places[i],
      })),
    },
  };
}

if (!isMainThread) {
  playOne(workerData).then(r => parentPort.postMessage(r), e => parentPort.postMessage({ error: String(e.stack || e) }));
} else {
  const games = Number(arg('games', 100)), parallel = Number(arg('parallel', 4)), from = Number(arg('from', 1));
  const out = arg('out', 'design/eval/hard-learn');
  const fresh = flag('fresh-each'), noPlan = flag('no-plan'), mix = flag('mix');
  // --mix --notes=<memory.json>: the planning seats play with those notes (not updated)
  const notes = arg('notes', null);
  const { newMemory, learnFromGame } = await import('../src/engine/v4/mind.js');
  mkdirSync(`${out}/notes`, { recursive: true });
  const memPath = `${out}/memory.json`;
  let memory = notes ? JSON.parse(readFileSync(notes, 'utf8')) : !fresh && from > 1 && existsSync(memPath) ? JSON.parse(readFileSync(memPath, 'utf8')) : newMemory();
  const self = fileURLToPath(import.meta.url);
  const run = g => new Promise((res, rej) => {
    const w = new Worker(self, { workerData: { g, memory: fresh && !notes ? null : memory, noPlan, mix } });
    w.once('message', m => (m.error ? rej(new Error(m.error)) : res(m)));
    w.once('error', rej);
  });
  for (let g = from; g < from + games; g += parallel) {
    const t0 = Date.now();
    const wave = await Promise.all(Array.from({ length: Math.min(parallel, from + games - g) }, (_, k) => run(g + k)));
    for (const r of wave) {
      if (!fresh && !mix) learnFromGame(memory, r.final, r.seats);
      appendFileSync(`${out}/games.jsonl`, JSON.stringify(r.row) + '\n');
    }
    writeFileSync(memPath, JSON.stringify(memory));
    if (!fresh && memory.games % 20 === 0) writeFileSync(`${out}/notes/after-${memory.games}.json`, JSON.stringify(memory));
    console.log(`games ${g}-${g + wave.length - 1} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}
