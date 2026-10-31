// Past games: the last few games played on this device, kept as records so one can be saved afterward (a game that
// went wrong, or one worth keeping), and "Save game", which downloads a game as notation text (notation.js).
// - Every state a session shows passes through record.js's trackState; this keeps that game's record in localStorage,
//   at most once a second and at once when the game ends. Online, every player's own device keeps its copy.
// - KEEP games, newest first; a game is known by its seed and seats, so a resumed game updates its own entry.
import { gameRecord, onTrack } from './record.js';
import { toNotation } from './notation.js';

const KEY = 'patrons.v4.games';
export const KEEP = 12;

const gameId = st => `${st.seed}|${st.players.map(p => p.name).join('|')}`;

/** Past games, newest first: [{ id, at, round, over, names, record }]. */
export function pastGames() {
  try {
    const list = JSON.parse(globalThis.localStorage?.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter(g => g && g.record && Array.isArray(g.record.moves)) : [];
  } catch { return []; }
}

/** Writes this state's game into the list now. */
export function keepGame(st) {
  if (!st || !Array.isArray(st.players) || !Array.isArray(st.history) || !st.history.length) return;
  const id = gameId(st);
  const entry = { id, at: Date.now(), round: st.round, over: !!st.over, names: st.players.map(p => p.name), record: gameRecord(st) };
  const list = [entry, ...pastGames().filter(g => g.id !== id)].slice(0, KEEP);
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(list)); } catch { /* private window or full: this game isn't kept */ }
}

let waiting = null, latest = null, lastOver = null;
onTrack(st => {
  latest = st;
  const id = gameId(st);
  if (st.over && lastOver !== id) { lastOver = id; clearTimeout(waiting); waiting = null; keepGame(st); return; }
  if (!waiting) waiting = setTimeout(() => { waiting = null; keepGame(latest); }, 1000);
});

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const day = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** The file "Save game" downloads: { name, text }. Notation when it replays here; else the record as JSON, so nothing is lost. */
export function gameFile(record, at = Date.now()) {
  const base = `cults-${day(at)}-${record.seats.map(s => slug(s.name)).join('-')}`;
  try { return { name: `${base}.txt`, text: toNotation(record), type: 'text/plain' }; } catch {
    return { name: `${base}.json`, text: JSON.stringify(record, null, 1), type: 'application/json' };
  }
}

/** Downloads the game; returns false when the browser refused. */
export function saveGame(record, at) {
  try {
    const f = gameFile(record, at);
    const url = URL.createObjectURL(new Blob([f.text], { type: f.type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: f.name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch { return false; }
}
