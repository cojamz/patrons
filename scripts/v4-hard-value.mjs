// A series of Hard games that learn what a position is worth (mind.js fitValueModel). All four seats play Hard with a
// plan and the current value model; positions are sampled through every game, and after each wave of `wave` games
// the model is refit on every game so far, so each wave plays with what all the earlier games taught.
// Then --eval: each table twice, the learning Hard in seats 0 and 2, then 1 and 3, against the Hard before plans;
// every 5th table also has a buy-followers-only seat.
// Usage: node scripts/v4-hard-value.mjs [--games=100] [--wave=4] [--out=design/eval/hard-value]
//        node scripts/v4-hard-value.mjs --eval [--tables=20] [--out=…]   (reads <out>/model.json)
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const EVERY = 5; // a position sampled every this many moves

async function playOne({ g, seats, model, sample }) {
  // seats[i]: { role, old?: the Hard before plans, buyer?: buys followers only }
  const { createGame, applyMove, followers, memberCount, allQuadrantIds, quadrant } = await import('../src/engine/v4/index.js');
  const { defById } = await import('../src/engine/v4/content/index.js');
  const { chooseBotMove, chooseFollowerBuyerMove, boundaryParts } = await import('../src/engine/v4/bots.js');
  const { seededRandom } = await import('../src/engine/v4/rng.js');
  const { sphereVersion } = await import('../src/v4/tables.js');
  const rand = seededRandom(g * 7717 + 3);
  const pool = allQuadrantIds().filter(q => sphereVersion(q) === '2.0'), quads = [];
  while (quads.length < 4) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: seats.map(() => ({ kind: 'bot' })), seed: g, quadrants: quads });
  const minds = seats.map(x => (x.old ? {} : { valueModel: model }));
  const taken = [];
  let k = 0, round = s.round;
  while (!s.over) {
    if (sample && s.round >= 1 && s.pending?.kind === 'place' && (s.round !== round || k % EVERY === 0)) taken.push({ round: s.round, parts: boundaryParts(s) });
    round = s.round; k++;
    const pl = s.pending.player, seat = seats[pl];
    const m = seat.buyer ? chooseFollowerBuyerMove(s, rand)
      : chooseBotMove(s, rand, { level: 'hard', maxMs: Infinity, mind: minds[pl], noPlan: !!seat.old });
    s = applyMove(s, m);
  }
  const fol = s.players.map(p => followers(s, p)), top = Math.max(...fol);
  return {
    game: g, table: quads,
    samples: taken.flatMap(t => t.parts.map((x, i) => ({ round: t.round, x, y: fol[i] }))),
    players: s.players.map((p, i) => ({
      seat: i, role: seats[i].role, followers: fol[i], win: fol[i] === top, plan: minds[i].log || [],
      names: p.members.map(u => defById(s.cards[u].def).name), memberCount: memberCount(s, p), bought: p.bonus,
      artifact: p.artifact !== undefined ? s.cards[p.artifact].def.split('.')[0] : null,
    })),
  };
}

if (!isMainThread) {
  playOne(workerData).then(r => parentPort.postMessage(r), e => parentPort.postMessage({ error: String(e.stack || e) }));
} else {
  const evalMode = process.argv.includes('--eval');
  const out = arg('out', 'design/eval/hard-value'), wave = Number(arg('wave', 4));
  const { fitValueModel } = await import('../src/engine/v4/mind.js');
  mkdirSync(out, { recursive: true });
  const self = fileURLToPath(import.meta.url);
  const run = data => new Promise((res, rej) => {
    const w = new Worker(self, { workerData: data });
    w.once('message', m => (m.error ? rej(new Error(m.error)) : res(m)));
    w.once('error', rej);
  });
  if (evalMode) {
    const model = JSON.parse(readFileSync(`${out}/model.json`, 'utf8'));
    const tables = Number(arg('tables', 20));
    const jobs = [];
    for (let t = 0; t < tables; t++) for (const side of [0, 1]) {
      const n = 6001 + t, buyer = n % 5 === 0 ? 3 : -1;
      jobs.push({ g: n, model, sample: false, seats: [0, 1, 2, 3].map(i => (i === buyer ? { buyer: true, role: 'buyer' } : i % 2 === side ? { role: 'learned' } : { old: true, role: 'old' })) });
    }
    for (let j = 0; j < jobs.length; j += 4) {
      const wv = await Promise.all(jobs.slice(j, j + 4).map(run));
      for (const r of wv) appendFileSync(`${out}/eval.jsonl`, JSON.stringify({ ...r, samples: undefined }) + '\n');
      console.log(`eval ${j + wv.length}/${jobs.length}`);
    }
  } else {
    const games = Number(arg('games', 100));
    const samples = [];
    let model = null;
    for (let g = 1; g <= games; g += wave) {
      const t0 = Date.now();
      const wv = await Promise.all(Array.from({ length: Math.min(wave, games - g + 1) }, (_, k) => run({ g: g + k, model, sample: true, seats: [0, 1, 2, 3].map(() => ({ role: 'hard' })) })));
      for (const r of wv) { samples.push(...r.samples); appendFileSync(`${out}/games.jsonl`, JSON.stringify({ ...r, samples: undefined, modelFrom: model ? model.games : 0 }) + '\n'); }
      model = { ...fitValueModel(samples), games: g + wv.length - 1 };
      writeFileSync(`${out}/model.json`, JSON.stringify(model));
      appendFileSync(`${out}/models.jsonl`, JSON.stringify(model) + '\n');
      const w = r => model.rounds[r].w.map(v => v.toFixed(2)).join(' ');
      console.log(`games ${g}-${g + wv.length - 1} [${((Date.now() - t0) / 1000).toFixed(0)}s] samples ${samples.length}; I: ${w(1)} | II: ${w(2)} | III: ${w(3)}`);
    }
  }
}
