// Game notation: a game record as text a person can read, like chess notation, that replays the exact game.
//
//   [Game "Cults"] [Version "v0.9.0"] [Seed "20261014"] [Colors "Gold, Magenta, Purple, White"] ... (one tag a line)
//   Round I
//   1. Bot 3  Help Yourself: Bot 2's gold, Ana's magenta · +1 followers (1 magenta)
//   2. Ana  Stash · pass
//   {Ana's turn is skipped (Sleep In).}
//
// - A move line is "<n>. <name>  <move>, <move>…" ("<n>… <name>" for a reply on someone else's turn). Each move is the name of the option the player picked, as the game
//   showed it (counts like "(4)" dropped when the name is still unique at that point; "#2" added when two options read
//   the same). Payments go in parentheses, a buy after " · ", choices after ": " and ", ".
// - Every other line is a comment: tags, round headings, {notes from the log}. Reading ignores them, apart from tags.
// - Reading replays from the seed and matches each move against the options on offer at that point, so the text is
//   the authority: `fromNotation(toNotation(rec))` gives back the same move list, and a hand-edited line either replays
//   or says exactly where it stops.
import { followers, logSince } from '../../engine/v4/core.js';
import { allQuadrantIds, quadrant } from '../../engine/v4/content/index.js';
import { RECORD_KIND, SCHEMA, BUILD, parseRecord, replayRecord, step } from './record.js';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const roman = r => ROMAN[r] || String(r);
const BOOL_RULES = ['release', 'guests', 'cull', 'artifacts'];

const raw = o => String(o.label ?? o.id).replace(/\s+/g, ' ').trim();
const clean = o => {
  const s = raw(o).replace(/\s\(\d+\)$/, '').replace(/\s·\s\d+\s[a-z]+$/, '');
  return o.kind === 'pass' || o.kind === 'done' ? s.toLowerCase() : s;
};

/** The written name of each option on offer, unique within the decision (same order as `options`). */
export function optionTokens(options) {
  const count = f => options.reduce((m, o) => m.set(f(o), (m.get(f(o)) || 0) + 1), new Map());
  const c1 = count(clean), c2 = count(raw), seen = new Map();
  return options.map(o => {
    const t = c1.get(clean(o)) === 1 ? clean(o) : raw(o);
    if (c2.get(raw(o)) === 1 || c1.get(clean(o)) === 1) return t;
    const k = (seen.get(t) || 0) + 1;
    seen.set(t, k);
    return k === 1 ? t : `${t} #${k}`;
  });
}

// how a move is joined to the one before it on the same line
const joiner = (kind, i) => (kind === 'pay' ? ' (' : kind === 'buy' ? ' · ' : i === 1 ? ': ' : ', ');

const colorName = id => {
  const name = quadrant(id).name;
  return allQuadrantIds().filter(q => quadrant(q).name === name).length === 1 ? name : `${name} (${id})`;
};
const colorId = s => {
  const t = s.trim().replace(/^.*\((\w+)\)$/, '$1');
  const hits = allQuadrantIds().filter(q => q === t || quadrant(q).name.toLowerCase() === t.toLowerCase());
  if (hits.includes(t)) return t;
  if (hits.length !== 1) throw new Error(`Unknown color "${t}".`);
  return hits[0];
};

const rulesText = rules => Object.entries(rules || {}).map(([k, v]) => (v === true ? k : v === false ? `no ${k}` : `${k}=${v}`)).join(', ');
function parseRules(s) {
  const out = {};
  for (const part of s.split(',').map(x => x.trim()).filter(Boolean)) {
    const m = part.match(/^([A-Za-z]+)=(.+)$/);
    if (m) out[m[1]] = /^-?\d+(\.\d+)?$/.test(m[2]) ? Number(m[2]) : m[2] === 'true' ? true : m[2] === 'false' ? false : m[2];
    else if (part.startsWith('no ')) out[part.slice(3)] = false;
    else out[part] = true;
  }
  return out;
}

const seatText = s => [s.kind === 'bot' ? `bot ${s.bot || 'normal'}` : s.kind, s.emoji].filter(Boolean).join(' ');
const tag = (k, v) => `[${k} "${String(v).replace(/"/g, "'")}"]`;

// log lines worth keeping as notes: rounds, skipped turns, the end
const NOTE = /^(Round [IVX]+ ends\.|Game over\.)|turn is skipped/;
function freshLog(before, after) {
  if (after.length >= before.length && after[before.length - 1] === before[before.length - 1]) return after.slice(before.length);
  const at = after.lastIndexOf(before[before.length - 1]);
  return at >= 0 ? after.slice(at + 1) : [];
}

/** A record (object or JSON) as notation text. Throws if the record doesn't replay on this build. */
export function toNotation(input) {
  const rec = parseRecord(input);
  let state = replayRecord(rec, { upTo: 0 }).state;
  if (!state) throw new Error("Couldn't set up this game on this version.");
  const out = [
    tag('Game', 'Cults'), tag('Version', rec.build?.version || rec.made?.version || '?'), tag('Seed', rec.seed),
    tag('Colors', rec.quadrants.map(colorName).join(', ')), tag('Rules', rulesText(rec.rules)),
    ...rec.seats.map((s, i) => `[Seat${i + 1} "${s.name}" "${seatText(s)}"]`),
  ];
  const head = out.length;
  out.push('', 'Artifacts');
  let line = null, n = 0, round = state.round, i = 0, notes = [];
  // a line ends when the next turn starts, so a note lands after the whole turn
  const flush = () => { if (line) out.push(line.text + (line.open ? ')' : '')); line = null; for (const l of notes) out.push(`{${l}}`); notes = []; };
  for (const [player, option] of rec.moves) {
    const pend = state.pending;
    if (!pend) throw new Error(`Move ${i + 1}: no decision is pending.`);
    const at = pend.options.findIndex(o => o.id === option);
    if (at < 0 || pend.player !== player) throw new Error(`Move ${i + 1} (P${player + 1} ${option}) doesn't replay on this version.`);
    const token = optionTokens(pend.options)[at];
    if (state.round !== round) { flush(); round = state.round; n = 0; out.push('', `Round ${roman(round)}`); }
    const turn = pend.kind === 'place' || pend.kind === 'setup';
    if (!line || turn || line.player !== player) {
      flush();
      // a reply on someone else's turn (paying to keep a member, say) is "3…", like black's move in chess
      line = { player, count: 1, open: false, text: `${turn || !n ? `${++n}.` : `${n}…`} ${state.players[player].name}  ${token}` };
    } else {
      if (line.open) { line.text += ')'; line.open = false; }
      line.text += joiner(pend.kind, line.count) + token;
      line.open = pend.kind === 'pay';
      line.count++;
    }
    const next = step(state, { player, option });
    notes.push(...(state.logN != null && next.logN > state.logN ? logSince(next, state.logN) : freshLog(state.log, next.log)).filter(l => NOTE.test(l)));
    state = next;
    i++;
  }
  flush();
  if (state.over) {
    const ranked = state.players.map(p => ({ name: p.name, f: followers(state, p) })).sort((a, b) => b.f - a.f);
    out.splice(head, 0, tag('Result', ranked.map(r => `${r.name} ${r.f}`).join(', ')));
  } else out.splice(head, 0, tag('Result', `unfinished, ${state.round ? `round ${roman(state.round)}` : 'artifacts'}`));
  out.splice(head + 1, 0, tag('Moves', rec.moves.length), tag('Content', rec.build?.content || '?'));
  return out.join('\n') + '\n';
}

/**
 * Notation text back to a record, by replaying it. Throws a plain message naming the line that stops it.
 * The record carries this build's stamp only if the text's Content tag matches.
 */
export function fromNotation(text) {
  const lines = String(text).split(/\r?\n/);
  const tags = {}, seats = [];
  for (const l of lines) {
    const m = l.match(/^\[(\w+)\s+"([^"]*)"(?:\s+"([^"]*)")?\]\s*$/);
    if (!m) continue;
    if (/^Seat\d+$/.test(m[1])) {
      const [kind, ...rest] = (m[3] || 'human').split(/\s+/);
      const s = { name: m[2], kind };
      if (kind === 'bot' && rest[0]) s.bot = rest.shift();
      if (rest[0]) s.emoji = rest.join(' ');
      seats[Number(m[1].slice(4)) - 1] = s;
    } else tags[m[1]] = m[2];
  }
  if (tags.Game !== 'Cults') throw new Error('Not a Cults game (no [Game "Cults"] line).');
  if (!tags.Seed || !tags.Colors || !seats.length) throw new Error('The game is missing its Seed, Colors or Seat lines.');
  const rec = {
    kind: RECORD_KIND, schema: SCHEMA,
    build: tags.Content && tags.Content === BUILD.content ? { ...BUILD } : { schema: SCHEMA, content: tags.Content || null, id: null, version: tags.Version || null },
    made: BUILD, seed: /^\d+$/.test(tags.Seed) ? Number(tags.Seed) : tags.Seed,
    quadrants: tags.Colors.split(',').map(colorId), rules: parseRules(tags.Rules || ''),
    seats: seats.filter(Boolean), moves: [],
  };
  let state = replayRecord({ ...rec, moves: [] }).state;
  if (!state) throw new Error("Couldn't set up this game on this version.");
  lines.forEach((l, li) => {
    const m = l.match(/^\s*\d+(?:\.|…)\s+(.*)$/);
    if (!m) return;
    const where = `Line ${li + 1} ("${l.trim()}")`;
    let rest = m[1];
    const pend0 = state.pending;
    if (!pend0) throw new Error(`${where}: the game is already over.`);
    const name = state.players[pend0.player].name;
    if (!rest.startsWith(name)) throw new Error(`${where}: it's ${name}'s move here.`);
    rest = rest.slice(name.length);
    let first = true;
    for (;;) {
      rest = rest.replace(first ? /^\s+/ : /^(\)|\s*\(|:\s|,\s|\s·\s|\s+)+/, '');
      if (!rest.trim().replace(/^\)+$/, '')) break;
      const pend = state.pending;
      if (!pend) throw new Error(`${where}: the game is over before "${rest}".`);
      const tokens = optionTokens(pend.options);
      // longest name that matches here and ends at a separator or the end of the line
      const hit = tokens.map((t, k) => ({ t, k }))
        .filter(({ t }) => rest.startsWith(t) && /^($|\)|\s|:|,)/.test(rest.slice(t.length)))
        .sort((a, b) => b.t.length - a.t.length)[0];
      if (!hit) throw new Error(`${where}: "${rest}" isn't one of ${state.players[pend.player].name}'s choices here (${tokens.join(' | ')}).`);
      const move = { player: pend.player, option: pend.options[hit.k].id };
      state = step(state, move);
      rec.moves.push([move.player, move.option]);
      rest = rest.slice(hit.t.length);
      first = false;
    }
  });
  return rec;
}
