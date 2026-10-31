// Hard learns by testing: every wave of `wave` games, two seats play the current lessons (the champion) and two play
// the champion plus a few changes (the challenger), on fresh 2.0 tables. The changes come from what worked at the
// last games' tables (a member, space or artifact in a winner's cult, rivals' included) and from nudging how it values
// members, contests and rivals. A change is kept only when the challenger seats out-score the champion seats.
// Then --eval plays the final lessons against the Hard before plans, with the buy-followers-only seat every 5th game.
// Usage: node scripts/v4-hard-tune.mjs [--games=100] [--wave=4] [--out=design/eval/hard-tune]
//        node scripts/v4-hard-tune.mjs --eval [--games=40] [--out=…]   (reads <out>/lessons.json)
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const KEEP = 1.5; // followers a challenger seat must beat a champion seat by, on average over the wave

async function playOne({ g, seats }) {
  // seats[i]: { lessons } for a Hard seat with a plan, { old: true } for the Hard before plans, { buyer: true }
  const { createGame, applyMove, followers, memberCount, allQuadrantIds, quadrant } = await import('../src/engine/v4/index.js');
  const { defById } = await import('../src/engine/v4/content/index.js');
  const { chooseBotMove, chooseFollowerBuyerMove } = await import('../src/engine/v4/bots.js');
  const { seededRandom } = await import('../src/engine/v4/rng.js');
  const { sphereVersion } = await import('../src/v4/tables.js');
  const rand = seededRandom(g * 7717 + 3);
  const pool = allQuadrantIds().filter(q => sphereVersion(q) === '2.0'), quads = [];
  while (quads.length < 4) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: seats.map(() => ({ kind: 'bot' })), seed: g, quadrants: quads });
  const minds = seats.map(x => ({ lessons: x.lessons || null }));
  const places = seats.map(() => ({}));
  while (!s.over) {
    const pl = s.pending.player, seat = seats[pl];
    const m = seat.buyer ? chooseFollowerBuyerMove(s, rand)
      : chooseBotMove(s, rand, { level: 'hard', maxMs: Infinity, mind: minds[pl], noPlan: !!seat.old });
    if (typeof m.option === 'string' && /^(slot|squat):/.test(m.option)) {
      const [q, i] = m.option.split(':')[1].split('-').map(Number);
      const a = quadrant(s.quadrants[q]).actions[i];
      if (a) { const k = `${s.quadrants[q]}:${a.key}`; places[pl][k] = (places[pl][k] || 0) + 1; }
    }
    s = applyMove(s, m);
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  return {
    game: g, table: quads,
    players: s.players.map((p, i) => ({
      seat: i, role: seats[i].role, followers: followers(s, p), win: followers(s, p) === top,
      plan: minds[i].log || [], members: p.members.map(u => s.cards[u].def), memberCount: memberCount(s, p),
      artifact: p.artifact !== undefined ? s.cards[p.artifact].def.split('.')[0] : null, bought: p.bonus, places: places[i],
      names: p.members.map(u => defById(s.cards[u].def).name),
    })),
  };
}

const neutral = () => ({ knobs: { memberBias: 1, k: 1, future: 1, spite: 1 }, members: {}, spaces: {}, artifacts: {}, styles: {}, tier: [0, 0, 0] });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// A few changes to try, drawn from what the last games' tables showed. Returns [{ what, apply(lessons) }].
function propose(last, champ, rand) {
  const pick = xs => xs[Math.floor(rand() * xs.length)];
  const all = last.flatMap(r => r.players);
  const winners = all.filter(p => p.win), losers = all.filter(p => !p.win);
  const ideas = [];
  const count = (ps, f) => { const c = {}; for (const p of ps) for (const k of f(p)) c[k] = (c[k] || 0) + 1; return c; };
  const wm = count(winners, p => p.members), lm = count(losers, p => p.members);
  const ws = count(winners, p => Object.keys(p.places)), ls = count(losers, p => Object.keys(p.places));
  const rate = (w, l, k) => (w[k] || 0) / Math.max(1, winners.length) - (l[k] || 0) / Math.max(1, losers.length);
  const best = (w, l) => Object.keys({ ...w, ...l }).sort((a, b) => rate(w, l, b) - rate(w, l, a));
  const mem = best(wm, lm), sp = best(ws, ls);
  if (mem.length) {
    const up = pick(mem.slice(0, 4));
    ideas.push({ what: `value ${up} more (in a winner's cult)`, apply: L => { L.members[up] = clamp((L.members[up] || 0) + 1.5, -4, 4); } });
    const down = pick(mem.slice(-4));
    ideas.push({ what: `value ${down} less (in losers' cults)`, apply: L => { L.members[down] = clamp((L.members[down] || 0) - 1.5, -4, 4); } });
  }
  if (sp.length) {
    const up = pick(sp.slice(0, 4)), down = pick(sp.slice(-4));
    ideas.push({ what: `use ${up} more (winners placed there)`, apply: L => { L.spaces[up] = clamp((L.spaces[up] || 0) + 1, -3, 3); } });
    ideas.push({ what: `use ${down} less (losers placed there)`, apply: L => { L.spaces[down] = clamp((L.spaces[down] || 0) - 1, -3, 3); } });
  }
  const art = pick(winners.map(p => p.artifact).filter(Boolean).concat(['x']));
  if (art !== 'x') ideas.push({ what: `pick the ${art} artifact more (a winner had it)`, apply: L => { L.artifacts[art] = clamp((L.artifacts[art] || 0) + 1.5, -4, 4); } });
  const knob = pick(['memberBias', 'k', 'future', 'spite']), dir = rand() < 0.5 ? 0.8 : 1.25;
  const knobWords = { memberBias: 'liking for members', k: 'value of member abilities', future: 'value of later contests', spite: 'attention to the leading rival' };
  ideas.push({ what: `${dir > 1 ? 'more' : 'less'} ${knobWords[knob]}`, apply: L => { L.knobs[knob] = clamp(L.knobs[knob] * dir, 0.25, 3); } });
  const r = Math.floor(rand() * 3), td = rand() < 0.5 ? 0.75 : -0.75;
  ideas.push({ what: `${td > 0 ? 'more' : 'fewer'} follower buys in round ${['I', 'II', 'III'][r]}`, apply: L => { L.tier[r] = clamp(L.tier[r] + td, -3, 3); } });
  const st = pick(['engine', 'contest', 'followers']), sd = rand() < 0.5 ? 1 : -1;
  ideas.push({ what: `${sd > 0 ? 'lean toward' : 'lean away from'} the ${st} style`, apply: L => { L.styles[st] = clamp((L.styles[st] || 0) + sd, -3, 3); } });
  // two or three of them at once
  const n = 2 + (rand() < 0.5 ? 1 : 0), out = [];
  while (out.length < n && ideas.length) out.push(ideas.splice(Math.floor(rand() * ideas.length), 1)[0]);
  return out;
}

if (!isMainThread) {
  playOne(workerData).then(r => parentPort.postMessage(r), e => parentPort.postMessage({ error: String(e.stack || e) }));
} else {
  const evalMode = process.argv.includes('--eval');
  const games = Number(arg('games', evalMode ? 40 : 100)), wave = Number(arg('wave', 4)), out = arg('out', 'design/eval/hard-tune');
  const { seededRandom } = await import('../src/engine/v4/rng.js');
  mkdirSync(out, { recursive: true });
  const self = fileURLToPath(import.meta.url);
  const run = (g, seats) => new Promise((res, rej) => {
    const w = new Worker(self, { workerData: { g, seats } });
    w.once('message', m => (m.error ? rej(new Error(m.error)) : res(m)));
    w.once('error', rej);
  });
  if (evalMode) {
    const lessons = JSON.parse(readFileSync(`${out}/lessons.json`, 'utf8'));
    for (let g = 5001; g < 5001 + games; g += 4) {
      const wv = await Promise.all(Array.from({ length: Math.min(4, 5001 + games - g) }, (_, k) => {
        const n = g + k, buyer = n % 5 === 0 ? n % 4 : -1;
        const seats = [0, 1, 2, 3].map(i => (i === buyer ? { buyer: true, role: 'buyer' } : i % 2 === n % 2 ? { old: true, role: 'old' } : { lessons, role: 'tuned' }));
        return run(n, seats);
      }));
      for (const r of wv) appendFileSync(`${out}/eval.jsonl`, JSON.stringify(r) + '\n');
      console.log(`eval ${g}-${g + wv.length - 1}`);
    }
  } else {
    let champ = existsSync(`${out}/lessons.json`) ? JSON.parse(readFileSync(`${out}/lessons.json`, 'utf8')) : neutral();
    const rand = seededRandom(424242);
    let last = [];
    let from = 1;
    if (existsSync(`${out}/games.jsonl`)) from = readFileSync(`${out}/games.jsonl`, 'utf8').trim().split('\n').length + 1;
    // a change that wins its wave is played a second wave before it's kept (one wave of 4 games swings ±5 followers)
    let pending = null;
    for (let g = from; g < from + games; g += wave) {
      const t0 = Date.now();
      const tries = pending ? pending.tries : last.length ? propose(last, champ, rand) : [{ what: 'nothing yet (first wave: champion against itself)', apply: () => {} }];
      const chall = pending ? pending.chall : JSON.parse(JSON.stringify(champ));
      if (!pending) for (const t of tries) t.apply(chall);
      const wv = await Promise.all(Array.from({ length: wave }, (_, k) => {
        const n = g + k;
        const seats = [0, 1, 2, 3].map(i => (i % 2 === n % 2 ? { lessons: chall, role: 'challenger' } : { lessons: champ, role: 'champion' }));
        return run(n, seats);
      }));
      const avg = role => { const xs = wv.flatMap(r => r.players.filter(p => p.role === role).map(p => p.followers)); return xs.reduce((a, b) => a + b, 0) / xs.length; };
      const diff = avg('challenger') - avg('champion');
      let verdict;
      if (!last.length) verdict = 'baseline';
      else if (pending) {
        const both = (pending.diff + diff) / 2;
        verdict = both >= KEEP && diff > 0 ? 'kept' : 'dropped on recheck';
        if (verdict === 'kept') champ = chall;
        pending = null;
      } else if (diff >= KEEP) { verdict = 'won, rechecking'; pending = { tries, chall, diff }; }
      else verdict = 'dropped';
      const line = { games: [g, g + wave - 1], tried: tries.map(t => t.what), diff: Number(diff.toFixed(2)), verdict };
      appendFileSync(`${out}/trials.jsonl`, JSON.stringify(line) + '\n');
      for (const r of wv) appendFileSync(`${out}/games.jsonl`, JSON.stringify(r) + '\n');
      writeFileSync(`${out}/lessons.json`, JSON.stringify(champ, null, 1));
      if (!pending) last = wv;
      console.log(`games ${g}-${g + wave - 1}: ${verdict} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}) ${tries.map(t => t.what).join('; ')} [${((Date.now() - t0) / 1000).toFixed(0)}s]`);
    }
  }
}
