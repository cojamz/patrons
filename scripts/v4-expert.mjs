#!/usr/bin/env node
// Expert-player games: four AI players (each a separate agent) play one game of Cults through this tool, and the
// designer reads the transcript. One game lives in a folder (state.json, meta.json, events.jsonl).
//
//   new <dir> [--seed N] [--colors a,b,c,d] [--names Ava,Ben,Cal,Dee]   start a game and write cards.md
//   wait <dir> <seat> [--max 100]     block until it is that seat's decision (or the game is over), then show the view
//   view <dir> <seat>                 the table as that seat sees it
//   move <dir> <seat> <option> [--why "..."] [--say "..."]
//   postgame <dir> <seat> "<text>"    the player's after-game note
//   status <dir>                      one line for the foreman
//   report <dir> [--out file]         the transcript for the designer (markdown)
//   data <dir>                        one JSON line of the game's numbers (for balance reads)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGame, applyMove, followers, memberCount, memberPrice, cardDef, contestTable, turnRail, previewSpace,
  quadrant, shopSize, TIERS, roundWorkers, openSlots,
} from '../src/engine/v4/index.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SIX = ['red', 'echo', 'thieves', 'purple', 'market', 'trading']; // the 2.0 colors
const NAMES = ['Ava', 'Ben', 'Cal', 'Dee'];
const ROMAN = ['', 'I', 'II', 'III'];
let DIR = '';

// Light personalities: how they play and a touch of how they talk. Rotated between games.
const STYLES = [[
  'a patient engine-builder. You like cheap members that pay every round and you distrust buying followers early.',
  'a contest hunter and blocker. You like taking the space a rival needs and winning color contests by a hair.',
  'a numbers person who counts what every resource and recruit is worth. You lean toward the efficient line and distrust fancy combos.',
  'an opportunist who hunts for odd combinations and swings late.',
], [
  'a numbers person who counts what every resource and recruit is worth and plays the efficient line.',
  'an opportunist who hunts for odd combinations and swings late.',
  'a patient engine-builder who waits for the right members and refuses to waste a recruit.',
  'a contest hunter and blocker who likes to deny rivals their favorite space.',
]];

// ---------- files, lock ----------
const f = (dir, n) => path.join(dir, n);
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, o) => { const t = `${p}.tmp${process.pid}`; fs.writeFileSync(t, JSON.stringify(o)); fs.renameSync(t, p); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function locked(dir, fn) {
  const lock = f(dir, '.lock');
  for (let i = 0; i < 400; i++) {
    try { fs.mkdirSync(lock); break; } catch {
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 30000) fs.rmdirSync(lock); } catch { /* raced */ }
      await sleep(50 + Math.random() * 50);
      if (i === 399) throw new Error('The table is busy; run the command again.');
    }
  }
  try { return await fn(); } finally { try { fs.rmdirSync(lock); } catch { /* gone */ } }
}
const load = dir => ({ s: readJson(f(dir, 'state.json')), meta: readJson(f(dir, 'meta.json')) });
const events = dir => (fs.existsSync(f(dir, 'events.jsonl')) ? fs.readFileSync(f(dir, 'events.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []);
const addEvents = (dir, list) => { if (list.length) fs.appendFileSync(f(dir, 'events.jsonl'), list.map(e => JSON.stringify({ t: Date.now(), ...e })).join('\n') + '\n'); };

// New log lines after a move. The engine can insert a line mid-log and caps the log, so compare as a multiset
// (in order of the new log) rather than by position.
function newLines(before, after) {
  const have = new Map();
  for (const l of before.log) have.set(l, (have.get(l) || 0) + 1);
  return after.log.filter(l => { const n = have.get(l) || 0; if (n > 0) { have.set(l, n - 1); return false; } return true; });
}

// ---------- words for cards and spaces ----------
const nm = (s, uid) => cardDef(s, uid).name;
const memberName = (s, uid) => { const c = s.cards[uid]; return c.copy ? `${nm(s, uid)} (copying ${defName(c.copy)})` : nm(s, uid); };
const defName = id => { try { return cardDef({ cards: { x: { def: id } } }, 'x').name; } catch { return id; } };
const costWords = d => { const col = d.quadrant && d.quadrant !== 'guest' ? colorWord(d.quadrant) : null; return [d.s ? `${d.s} ${col}` : '', d.w ? `${d.w} any` : ''].filter(Boolean).join(' + ') || 'free'; };
const colorWord = q => { try { return quadrant(q).resource; } catch { return q; } };
const sphereName = qid => quadrant(qid).name;
const actionText = a => (a.byRound ? `${(a.byRound.lines || []).map((l, i) => `${ROMAN[i + 1]}: ${l}`).join(' | ')}${a.byRound.rest ? ` ${a.byRound.rest}` : ''}` : a.text);

export function cardsMd(s) {
  const out = ['# Every card in this game', '', '## Spaces on the wheel', ''];
  s.quadrants.forEach(qid => {
    const q = quadrant(qid);
    out.push(`### ${q.name} (${q.resource}). Contest: ${q.scoring.label}: ${q.scoring.counts || ''}`);
    for (const a of q.actions) out.push(`- ${a.name} (${['', 'outer ring, opens round I', 'middle ring, opens round II', 'center, opens round III'][a.ring]}): ${actionText(a)}`);
    out.push('');
  });
  out.push('## Artifacts (one per color, picked before round I; the artifact comes with 1 resource of its color)', '');
  for (const qid of s.quadrants) { const u = s.artifacts[qid]; if (u !== undefined) out.push(`- ${sphereName(qid)}: ${nm(s, u)}: ${cardDef(s, u).text}`); }
  out.push('', '## Members (cost: a colored part paid only in the member\'s color, plus an "any" part; "worth" is its followers; the shop deals them from one deck, cheaper ones first)', '');
  const seen = new Set(), all = Object.values(s.cards).map(c => cardDef(s, c.uid)).filter(d => !Object.values(s.artifacts).some(u => s.cards[u].def === d.id));
  const groups = {};
  for (const d of all) { if (seen.has(d.id)) continue; seen.add(d.id); (groups[d.quadrant] ||= []).push(d); }
  for (const [qid, ds] of Object.entries(groups)) {
    out.push(`### ${qid === 'guest' ? 'Guests (no color)' : quadrant(qid).name}`);
    for (const d of ds.sort((x, y) => (x.s + x.w) - (y.s + y.w))) {
      const copies = all.filter(x => x.id === d.id).length;
      out.push(`- ${d.name} — cost ${costWords(d)}, worth ${d.f} follower${d.f === 1 ? '' : 's'}${(d.n ?? 1) !== 1 ? `, counts as ${d.n} members` : ''}${copies > 1 ? `, ${copies} copies` : ''}: ${d.text}`);
    }
    out.push('');
  }
  out.push('## Buying followers', '', ...TIERS.map(t => `- ${t.label} → +${t.get} followers (pay ${t.cost}, any colors, as often as you like; one recruit each)`), '');
  return out.join('\n');
}

// ---------- the view ----------
const range = ([a, b]) => (a === b ? `${a}` : `${a}..${b}`);
function youdWords(s, pid, q, i) {
  let pv;
  try { pv = previewSpace(s, pid, q, i, { cap: 40 }); } catch { return ''; }
  if (!pv) return '';
  const bits = [];
  const res = Object.entries(pv.you?.res || {}).filter(([, r]) => r[0] || r[1]).map(([c, r]) => `${r[1] < 0 || r[0] < 0 ? '' : '+'}${range(r)} ${c}`);
  if (res.length) bits.push(res.join(', '));
  const fo = pv.you?.followers; if (fo && (fo[0] || fo[1])) bits.push(`${fo[1] < 0 ? '' : '+'}${range(fo)} followers`);
  const mb = pv.you?.members; if (mb && (mb[0] || mb[1])) bits.push(`${mb[1] < 0 ? '' : '+'}${range(mb)} members`);
  const tn = pv.you?.turns; if (tn && (tn[0] || tn[1])) bits.push(`${range(tn)} extra turns`);
  const ro = Object.entries(pv.others?.res || {}).filter(([, r]) => r[0] || r[1]).map(([c, r]) => `${range(r)} ${c}`);
  if (ro.length) bits.push(`rivals together ${ro.join(', ')}`);
  const of = pv.others?.followers; if (of && (of[0] || of[1])) bits.push(`rivals followers ${range(of)}`);
  if (pv.asks?.length) bits.push(`then you choose: ${pv.asks.join('; ')}`);
  return bits.join('; ');
}

function renderOption(s, p, o, taskKind) {
  if (o.kind === 'slot') {
    const a = quadrant(s.quadrants[o.q]).actions[o.i];
    const joined = s.slots[`${o.q}-${o.i}`] !== undefined ? ' (taken: you would join it)' : '';
    const y = youdWords(s, p.id, o.q, o.i);
    return `${sphereName(s.quadrants[o.q])} · ${a.name}${joined}${y ? ` → you'd get: ${y}` : ''}`;
  }
  if (o.kind === 'card') {
    const uid = o.uid ?? o.target?.uid ?? o.value;
    if (taskKind !== 'buy') return `${memberName(s, uid)} [${costWords(cardDef(s, uid))}; worth ${cardDef(s, uid).f}] — ${cardDef(s, uid).text}`;
    o = { ...o, uid };
    const d = cardDef(s, o.uid), pr = memberPrice(s, p, o.uid);
    const price = pr.afford ? `you pay ${pr.total} (${pr.colored ? `${pr.colored} ${pr.color} + ` : ''}${pr.total - pr.colored} any)` : `short ${pr.short.text}`;
    return `Recruit ${memberName(s, o.uid)} [${costWords(d)}; ${price}; worth ${d.f}] — ${d.text}`;
  }
  if (o.kind === 'tier') {
    const t = TIERS.find(x => x.key === o.tier);
    return `Buy followers: ${t ? `${t.label}, pay ${t.cost} get +${t.get}` : o.label}`;
  }
  if (o.kind === 'pay') return `Pay ${o.label}${o.default ? ' (suggested)' : ''}${o.breaks?.length ? ` — spending this gives up your contest lead in ${o.breaks.join(', ')}` : ''}${o.cuts?.length ? ` — lowers a game-end bonus` : ''}`;
  if (o.id?.startsWith('use:')) { const uid = Number(o.id.slice(4)); return `Use ${memberName(s, uid)} — ${cardDef(s, uid).text}`; }
  if (o.kind === 'color' && taskKind === 'setup') return `${o.label}'s artifact: ${nm(s, s.artifacts[o.value])} — ${cardDef(s, s.artifacts[o.value]).text}`;
  if (o.kind === 'pass') return 'Pass (recruit nothing)';
  const extra = [];
  if (o.uid !== undefined && s.cards[o.uid]) extra.push(`${memberName(s, o.uid)}: ${cardDef(s, o.uid).text}`);
  if (o.hint !== undefined && typeof o.hint !== 'object') extra.push(`value hint ${o.hint}`);
  return `${o.label}${extra.length ? ` — ${extra.join('; ')}` : ''}`;
}

function tableView(s, meId, full = false) {
  const L = [];
  const round = s.round;
  L.push(round ? `ROUND ${ROMAN[round] || round}${s.over ? " — GAME OVER" : ""}   (leading a color's contest this round pays +${[4, 6, 10][Math.min(3, Math.max(1, round)) - 1]} followers, split if tied)` : "SETUP: pick artifacts");
  if (!s.over && round > 0) {
    const rail = turnRail(s), n = id => s.players[id].name;
    L.push(`Turns this round: ${[...rail.done.map(n), rail.current != null ? `[${n(rail.current)} now]` : '', ...rail.next.map(n)].filter(Boolean).join(' › ')}`);
  }
  L.push('', 'CULTS');
  for (const p of s.players) {
    const mem = p.members.map(u => memberName(s, u));
    const r = Object.entries(p.res).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(', ') || 'nothing';
    L.push(`- ${p.name}${p.id === meId ? ' (you)' : ''}: ${followers(s, p)} followers, ${memberCount(s, p)} members; holds ${r}; minions left this round ${p.left}${p.discount ? `; discount ${p.discount}` : ''}${p.artifact !== undefined ? `; artifact ${nm(s, p.artifact)}` : ''}`);
    L.push(`    members: ${mem.join(', ') || 'none'}`);
  }
  if (round > 0) {
    L.push('', 'THE WHEEL (each sphere is also a contest, scored at round end on what players hold right now; space texts are in cards.md, or run view --full)');
    const ct = contestTable(s);
    s.quadrants.forEach((qid, q) => {
      const c = ct[q], lead = c.winners.length ? `leading: ${c.winners.map(id => s.players[id].name).join(' & ')}` : 'nobody scoring yet';
      const rows = c.rows.filter(r => r.score > 0).map(r => `${s.players[r.player].name} ${r.count ?? r.score}`).join(', ');
      const spaces = quadrant(qid).actions.map((a, i) => {
        const key = `${q}-${i}`, who = s.slots[key], sq = s.squats?.[key] || [];
        const st = a.ring > round ? `dark till ${ROMAN[a.ring]}` : who === undefined ? 'OPEN' : `${s.players[who].name}${sq.length ? `+${sq.map(id => s.players[id].name).join(',')}` : ''}`;
        return full ? `\n    ${a.name} [${st}]: ${actionText(a)}` : `${a.name} [${st}]`;
      });
      L.push(`${sphereName(qid)} — ${c.label} (${lead}${rows ? `; ${rows}` : ''}): ${spaces.join(full ? '' : ', ')}`);
    });
    L.push('', `THE SHOP (${s.shop.length} face up; ${s.pile.length} in the pile)`);
    const me = s.players[meId];
    for (const u of s.shop) {
      const d = cardDef(s, u), pr = memberPrice(s, me, u);
      L.push(`- ${d.name} [${costWords(d)}; worth ${d.f}${(d.n ?? 1) !== 1 ? `, counts ${d.n}` : ''}]${pr.afford ? ' (you can afford)' : ` (you are short ${pr.short.text})`} — ${d.text}`);
    }
  }
  return L.join('\n');
}

function view(dir, seat, { fresh, full = false }) {
  const { s, meta } = load(dir);
  const me = s.players[seat];
  const evs = events(dir);
  const from = meta.seen[seat] ?? 0;
  const mine = evs.slice(from).filter(e => (e.type === 'log' || e.type === 'say') && e.seat !== seat);
  const out = [];
  out.push(`You are ${me.name} (seat ${seat}). Table: ${s.quadrants.map(sphereName).join(', ')}.`);
  if (fresh) {
    out.push('', 'SINCE YOU LAST LOOKED');
    out.push(...(mine.length ? mine.map(e => (e.type === 'say' ? `  ${s.players[e.seat].name} says: "${e.text}"` : `  ${e.text}`)) : ['  (nothing new)']));
    meta.seen[seat] = evs.length;
    writeJson(f(dir, 'meta.json'), meta);
  }
  out.push('', tableView(s, seat, full));
  if (s.over) {
    out.push('', 'FINAL', ...s.ranking.map((id, i) => `  ${i + 1}. ${s.players[id].name}: ${followers(s, s.players[id])} followers, ${memberCount(s, s.players[id])} members`));
    out.push('', `Game over. Write your postgame note: node scripts/v4-expert.mjs postgame ${dir} ${seat} "<text>"`);
    return out.join('\n');
  }
  if (s.pending?.player === seat) out.push('', decisionView(s, me));
  else if (s.pending) out.push('', `Not your decision: waiting on ${s.players[s.pending.player].name} (${s.pending.kind}).`);
  return out.join('\n');
}

function decisionView(s, me) {
  const t = s.pending;
  const L = [`YOUR DECISION (${t.kind}): ${t.prompt}`];
  t.options.forEach((o, i) => L.push(`  [${i + 1}] ${renderOption(s, me, o, t.kind)}`));
  L.push('', `Answer with: node scripts/v4-expert.mjs move ${DIR} ${me.id} <number> --why "..." [--say "..."]`);
  return L.join('\n');
}

// ---------- commands ----------
function parse(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); flags[k] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i]; } else pos.push(argv[i]);
  }
  return { pos, flags };
}

async function main() {
  const { pos, flags } = parse(process.argv.slice(2));
  const [cmd, dir, seatArg] = pos;
  const seat = seatArg !== undefined ? Number(seatArg) : null;
  DIR = dir;
  if (!cmd) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).join('\n')); return; }

  if (cmd === 'new') {
    fs.mkdirSync(dir, { recursive: true });
    const seed = Number(flags.seed || Math.floor(Math.random() * 90000) + 1000);
    const names = flags.names ? String(flags.names).split(',') : NAMES;
    const colors = flags.colors ? String(flags.colors).split(',') : shuffled(SIX, seed).slice(0, names.length);
    const s = createGame({ seats: names.map(name => ({ name, kind: 'human' })), seed, quadrants: colors });
    writeJson(f(dir, 'state.json'), s);
    writeJson(f(dir, 'meta.json'), { seed, names, colors, seen: {}, post: {}, startedAt: new Date().toISOString() });
    fs.writeFileSync(f(dir, 'cards.md'), cardsMd(s));
    fs.writeFileSync(f(dir, 'events.jsonl'), '');
    addEvents(dir, s.log.map(text => ({ type: 'log', text })));
    console.log(`Game ${dir}: seed ${seed}, table ${colors.join(', ')}, first to act: ${s.players[s.pending.player].name}`);
    return;
  }
  if (cmd === 'brief') {
    const meta = readJson(f(dir, 'meta.json'));
    const styles = STYLES[Number(flags.set || 0) % STYLES.length];
    const tpl = fs.readFileSync(f(ROOT, 'design/eval/expert-games/player-brief.md'), 'utf8');
    meta.names.forEach((name, i) => fs.writeFileSync(f(dir, `brief-${name}.md`), tpl.replaceAll('{NAME}', name).replaceAll('{DIR}', path.resolve(dir)).replaceAll('{SEAT}', String(i)).replaceAll('{STYLE}', styles[i])));
    console.log(`Wrote ${meta.names.length} briefs in ${dir}`);
    return;
  }
  if (cmd === 'view') { console.log(view(dir, seat, { fresh: false, full: !!flags.full })); return; }
  if (cmd === 'wait') {
    const max = Number(flags.max || 100) * 1000, t0 = Date.now();
    for (;;) {
      const s = readJson(f(dir, 'state.json'));
      if (s.over || s.pending?.player === seat) break;
      if (Date.now() - t0 > max) { console.log(`Still not your decision (waiting on ${s.players[s.pending.player].name}). Run wait again.`); return; }
      await sleep(1500);
    }
    await locked(dir, async () => console.log(view(dir, seat, { fresh: true })));
    return;
  }
  if (cmd === 'move') {
    const arg = pos[3];
    await locked(dir, async () => {
      const { s, meta } = load(dir);
      if (s.over) { console.log('The game is over.'); return; }
      if (s.pending?.player !== seat) { console.log(`Not your decision now (waiting on ${s.players[s.pending.player].name}). Run wait.`); return; }
      const opts = s.pending.options;
      const o = /^\d+$/.test(arg || '') ? opts[Number(arg) - 1] : opts.find(x => x.id === arg);
      if (!o) { console.log(`No such option "${arg}". Pick a number from the list:\n${decisionView(s, s.players[seat])}`); return; }
      const label = renderOption(s, s.players[seat], o, s.pending.kind);
      const round = s.round;
      const next = applyMove(s, { player: seat, option: o.id });
      writeJson(f(dir, 'state.json'), next);
      const ev = [{ type: 'move', seat, round, n: next.moves, kind: s.pending.kind, option: o.id, label, think: flags.why || flags.think || '', prompt: s.pending.prompt }];
      if (flags.say) ev.push({ type: 'say', seat, text: String(flags.say) });
      ev.push(...newLines(s, next).map(text => ({ type: 'log', text, by: seat })));
      addEvents(dir, ev);
      // your own view marks everything up to now as seen, so the next look shows only what others did
      meta.seen[seat] = events(dir).length;
      writeJson(f(dir, 'meta.json'), meta);
      const mine = newLines(s, next);
      console.log(`Done: ${label.slice(0, 160)}\nWhat happened:\n${mine.map(l => `  ${l}`).join('\n') || '  (nothing logged)'}`);
      if (next.over) console.log(`\nGAME OVER. ${next.ranking.map((id, i) => `${i + 1}. ${next.players[id].name} ${followers(next, next.players[id])}`).join(' · ')}\nNow run postgame.`);
      else if (next.pending?.player === seat) console.log(`\nYour turn continues.\n${tableView(next, seat).split('\n').slice(0, 2).join('\n')}\n\n${decisionView(next, next.players[seat])}`);
      else console.log(`\nYour decisions are finished for now. Run wait.`);
    });
    return;
  }
  if (cmd === 'postgame') {
    await locked(dir, async () => {
      const meta = readJson(f(dir, 'meta.json'));
      meta.post[seat] = pos.slice(3).join(' ');
      writeJson(f(dir, 'meta.json'), meta);
      console.log('Saved. Reply with your final place and score.');
    });
    return;
  }
  if (cmd === 'status') {
    const { s, meta } = load(dir);
    console.log(`${dir}: ${s.over ? 'OVER' : `round ${s.round}, ${s.pending ? `waiting on ${s.players[s.pending.player].name}` : 'idle'}, move ${s.moves}`}; postgames ${Object.keys(meta.post).length}/4; last event ${events(dir).slice(-1)[0] ? new Date(events(dir).slice(-1)[0].t).toISOString() : '-'}`);
    return;
  }
  if (cmd === 'report') { const md = report(dir); if (flags.out) fs.writeFileSync(flags.out, md); else console.log(md); return; }
  if (cmd === 'digest') {
    // plain chat-sized update of new turns since the last digest (pointer kept in the game folder)
    const { s, meta } = load(dir);
    const evs = events(dir), ptrFile = f(dir, 'digest.ptr');
    const from = fs.existsSync(ptrFile) ? Number(fs.readFileSync(ptrFile, 'utf8')) : 0;
    const out = [];
    for (const e of evs.slice(from)) {
      if (e.type === 'move' && ['place', 'buy', 'setup'].includes(e.kind) && !/^Pass|^Back/.test(e.label)) {
        const lab = e.label.replace(/ → you'd get:.*$/, '').replace(/ \[.*?\] —.*$/, '').replace(/^Recruit /, 'recruits ').replace(/^Buy followers: /, 'buys followers: ');
        out.push(`${meta.names[e.seat]} (R${ROMAN[e.round] || '0'}): ${lab}${e.think ? `\n   “${e.think}”` : ''}`);
      } else if (e.type === 'say') out.push(`💬 ${meta.names[e.seat]}: "${e.text}"`);
    }
    fs.writeFileSync(ptrFile, String(evs.length));
    const sc = s.players.map(p => `${p.name} ${followers(s, p)}`).join(', ');
    console.log(`${out.join('\n') || '(no new turns)'}\n\nScore now: ${sc}${s.over ? ' — GAME OVER' : ''}`);
    return;
  }
  if (cmd === 'html') { const h = reportHtml(dir); if (flags.out) fs.writeFileSync(flags.out, h); else console.log(h); return; }
  if (cmd === 'data') { console.log(JSON.stringify(gameData(dir))); return; }
  console.log(`Unknown command ${cmd}`);
}

function shuffled(a, seed) {
  const r = [...a]; let x = seed >>> 0 || 1;
  for (let i = r.length - 1; i > 0; i--) { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; const j = x % (i + 1); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

// ---------- transcript and data ----------
function report(dir) {
  const { s, meta } = load(dir);
  const evs = events(dir);
  const L = [`# Expert game ${path.basename(dir)}`, '', `Seed ${meta.seed}. Table: ${meta.colors.map(c => sphereName(c)).join(', ')}. Players: ${meta.names.join(', ')}.`];
  if (s.over) L.push('', `**Result:** ${s.ranking.map((id, i) => `${i + 1}. ${s.players[id].name} ${followers(s, s.players[id])}`).join(' · ')}`);
  L.push('', '(Each turn: what the player did, their private reasoning, what they said at the table, what happened.)', '');
  let round = 0;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.type === 'log') { if (/^Round (I|II|III)/.test(e.text) || /Game over|wins/.test(e.text)) L.push(`> ${e.text}`); else L.push(`    ${e.text}`); continue; }
    if (e.type === 'move') {
      if (e.round !== round) { round = e.round; L.push('', `## Round ${ROMAN[round] || round}`, ''); }
      if (['place', 'buy', 'setup'].includes(e.kind) || e.think) L.push(`**${meta.names[e.seat]}** — ${e.label}`);
      else L.push(`*${meta.names[e.seat]}* — ${e.label}`);
      if (e.think) L.push(`  _thinks:_ ${e.think}`);
    }
    if (e.type === 'say') L.push(`  💬 **${meta.names[e.seat]}:** "${e.text}"`);
  }
  L.push('', '## After the game', '');
  for (const [seat, text] of Object.entries(meta.post)) L.push(`**${meta.names[seat]}:** ${text}`, '');
  return L.join('\n');
}

const esc = x => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const HUES = ['#c2410c', '#1d6fb8', '#2f855a', '#8b4fb8'];
export function reportHtml(dir) {
  const { s, meta } = load(dir);
  const evs = events(dir);
  const done = s.over ? `Final: ${s.ranking.map((id, i) => `${i + 1}. ${meta.names[id]} ${followers(s, s.players[id])}`).join(' · ')}` : `Round ${ROMAN[s.round] || '–'} · move ${s.moves} · waiting on ${s.pending ? meta.names[s.pending.player] : '–'}`;
  const sc = s.players.map((p, i) => `<span class="chip" style="--h:${HUES[i]}">${meta.names[i]} <b>${followers(s, p)}</b></span>`).join('');
  const body = [];
  let round = -1, open = false;
  const closeTurn = () => { if (open) body.push('</div>'); open = false; };
  for (const e of evs) {
    if (e.type === 'move') {
      if (e.round !== round) { closeTurn(); round = e.round; body.push(`<h2>${round ? `Round ${ROMAN[round]}` : 'Artifact picks'}</h2>`); }
      const major = ['place', 'buy', 'setup'].includes(e.kind);
      closeTurn();
      body.push(`<div class="turn${major ? '' : ' minor'}" style="--h:${HUES[e.seat]}"><div class="who">${meta.names[e.seat]}</div><div class="act">${esc(e.label)}</div>${e.think ? `<div class="why">${esc(e.think)}</div>` : ''}`);
      open = true;
    } else if (e.type === 'say') body.push(`<div class="say" style="--h:${HUES[e.seat]}"><b>${meta.names[e.seat]}:</b> “${esc(e.text)}”</div>`);
    else if (e.type === 'log') body.push(`<div class="log">${esc(e.text)}</div>`);
  }
  closeTurn();
  const post = Object.entries(meta.post).map(([i, x]) => `<div class="turn" style="--h:${HUES[i]}"><div class="who">${meta.names[i]}</div><div class="why">${esc(x)}</div></div>`).join('');
  return `<title>Expert Game Transcript</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{--bg:#f6f5f2;--fg:#1c1b19;--mute:#6b6962;--card:#fff;--line:#dedbd3}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#171716;--fg:#ecebe6;--mute:#9a978e;--card:#222220;--line:#363632;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#171716;--fg:#ecebe6;--mute:#9a978e;--card:#222220;--line:#363632;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif;padding-block:12px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));max-width:720px;margin-inline:auto}
h1{font-size:20px;margin:0 0 4px}h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:28px 0 8px;border-bottom:1px solid var(--line);padding-bottom:4px}
.sub{color:var(--mute);font-size:13px}.chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.chip{border:1px solid var(--h);border-radius:99px;padding:2px 10px;font-size:13px}
.turn{background:var(--card);border-left:4px solid var(--h);padding:8px 10px;margin:10px 0 2px;border-radius:2px}.turn.minor{padding:3px 10px;opacity:.85}
.who{font-size:12px;font-weight:700;color:var(--h)}.act{font-weight:600}.why{color:var(--mute);margin-top:3px;font-size:14px}
.say{margin:2px 0 2px 14px;padding:3px 8px;border-left:2px solid var(--h);font-size:14px}.log{margin-left:14px;font-size:12.5px;color:var(--mute);overflow-wrap:anywhere}
</style>
<h1>Expert game ${esc(path.basename(dir))}</h1>
<div class="sub">${esc(meta.colors.map(sphereName).join(' · '))} · seed ${meta.seed}</div>
<div class="sub"><b>${esc(done)}</b></div><div class="chips">${sc}</div>
${body.join('\n')}
${post ? `<h2>After the game</h2>${post}` : ''}`;
}

export function gameData(dir) {
  const { s, meta } = load(dir);
  const evs = events(dir);
  return {
    game: path.basename(dir), seed: meta.seed, table: meta.colors, names: meta.names, over: s.over,
    ranking: s.ranking, final: s.players.map(p => ({ name: p.name, followers: followers(s, p), members: memberCount(s, p), bought: p.bought, contest: p.contest, final: p.final?.total || 0, memberDefs: p.members.map(u => s.cards[u].def), artifact: p.artifact !== undefined ? s.cards[p.artifact].def : null })),
    ledger: s.ledger || {}, picks: evs.filter(e => e.type === 'move' && e.kind === 'place').map(e => ({ seat: e.seat, round: e.round, space: e.label.split(' → ')[0] })),
    recruits: evs.filter(e => e.type === 'move' && /^Recruit /.test(e.label)).map(e => ({ seat: e.seat, round: e.round, card: e.label.replace(/^Recruit /, '').split(' [')[0] })),
    moves: s.moves,
  };
}

main().catch(e => { console.error(e.stack || String(e)); process.exit(1); });
