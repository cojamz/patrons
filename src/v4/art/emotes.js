// The little drawings beside the quick lines in table talk (Cory, 2026-10-29: "the emotes should include a little emoji
// with them. in the same cult style as our existing minion emojis"). Same family as the minions (art/emojis.js):
// 16×16, the shared letters (k ink, w cream, c cream shade, s skin, t skin shade, o candle glow, x soft black, b blush),
// digits from each drawing's own colours, and the renderer adds the 1px outer outline.
import { withOutline, pixelPaths } from './index.js';

const SHARED = { k: '#1c1410', w: '#f6eedb', c: '#cbbd9c', s: '#f1c49b', t: '#c88b62', o: '#ffd66e', x: '#2e2430', b: '#ee8f8a' };
const YELLOW = ['#b48a1f', '#f2c94a', '#fbe596'];
const GOLD = ['#a8761a', '#e3b23c', '#f8dc86'];
const RED = ['#8f2a22', '#d4473a', '#f0866c'];
const ORANGE = ['#a5521b', '#e8892f', '#f7b866'];
const BROWN = ['#6a3d1d', '#b06a2e', '#dd9c58'];
const SKY = ['#2c5590', '#4f8bd0', '#8db9ea'];

// a round face (yellow, lit from the top left) that the faces below draw their features onto
const FACE = [
  '................',
  '.....332222.....',
  '...3322222221...',
  '..322222222221..',
  '..322222222221..',
  '.32222222222221.',
  '.22222222222221.',
  '.22222222222221.',
  '.22222222222221.',
  '.22222222222221.',
  '.12222222222211.',
  '..122222222211..',
  '..112222222111..',
  '....11111111....',
  '................',
  '................',
];
// features over FACE: a dot or a space keeps the face underneath
const face = over => FACE.map((r, y) => [...r].map((ch, x) => (over[y] && over[y][x] && over[y][x] !== ' ' && over[y][x] !== '.' ? over[y][x] : ch)).join(''));

/** One drawing per quick line, keyed by the line (session/talk.js QUICK_LINES). */
const EMOTES = {
  // ✨ two four-point sparkles
  Blessings: { pal: YELLOW, px: [
    '................',
    '......33........',
    '......33........',
    '......33........',
    '.....3322.......',
    '....332222......',
    '.333322222111...',
    '.333222221111...',
    '....222211......',
    '.....2211.......',
    '......11....22..',
    '......11....22..',
    '......11...2222.',
    '............22..',
    '............22..',
    '................',
  ] },
  // 🙏 hands pressed together
  Thanks: { pal: SKY, px: [
    '................',
    '.......st.......',
    '......skks......',
    '......skks......',
    '.....sskkst.....',
    '.....sskkst.....',
    '....ssskksst....',
    '....ssskksst....',
    '...sssskkssst...',
    '...sssskkssst...',
    '...ssssktssst...',
    '....tsskktst....',
    '.....3322221....',
    '.....2222221....',
    '.....1111111....',
    '................',
  ] },
  // 👍 a thumb up
  'Well played': { pal: SKY, px: [
    '................',
    '.......ss.......',
    '......ssst......',
    '......ssst......',
    '.....ssst.......',
    '.....ssst.......',
    '.321sssssssst...',
    '.221ssssssssst..',
    '.221sssskkkkkt..',
    '.221ssssssssst..',
    '.221sssskkkkt...',
    '.221sssssssst...',
    '.211ssssskkkt...',
    '.111.tttttttt...',
    '................',
    '................',
  ] },
  // 😬 wide eyes, gritted teeth, a bead of sweat
  Oops: { pal: YELLOW, px: face([
    '............6',
    '...........665',
    '...........654',
    '...ww....ww.54',
    '...wk....wk...',
    '...ww....ww...',
    '',
    '.b.wwwwwwwww.b',
    '...wkwkwkwkw..',
    '...wwwwwwwww..',
  ]), extra: SKY },
  // 🔥 a flame
  'Heretic!': { pal: [...RED, ORANGE[1], ORANGE[2]], px: [
    '................',
    '.......3........',
    '......32........',
    '......322...3...',
    '.....3222..32...',
    '..3..32222.322..',
    '..2.3222222222..',
    '.32322244222221.',
    '.22222445422221.',
    '.22224455542221.',
    '.2224455ww5421..',
    '.122455ww55421..',
    '..124555555421..',
    '...1244444421...',
    '....11111111....',
    '................',
  ] },
  // ⏳ an hourglass running low
  'The end is near': { pal: [...BROWN, YELLOW[1], YELLOW[2]], px: [
    '................',
    '..322222222221..',
    '..111111111111..',
    '...wc......cw...',
    '...wc......cw...',
    '....wc5445cw....',
    '.....wc44cw.....',
    '......w44w......',
    '......wc4w......',
    '.....wc.4cw.....',
    '....wc..4.cw....',
    '...wc..544.cw...',
    '...wc54444.cw...',
    '..322222222221..',
    '..111111111111..',
    '................',
  ] },
  // ⚡ a bolt from above
  'Repent!': { pal: YELLOW, px: [
    '................',
    '........33332...',
    '.......32222....',
    '......32222.....',
    '.....32222......',
    '....32222.......',
    '...3222233332...',
    '..322222222.....',
    '.......2222.....',
    '......2221......',
    '.....2221.......',
    '....2221........',
    '...2221.........',
    '..221...........',
    '................',
    '................',
  ] },
  // 💰 a tied sack of coin
  'Mine now': { pal: [...BROWN], px: [
    '................',
    '......3221......',
    '.......21.......',
    '.....xxxxxx.....',
    '......3221......',
    '.....322221.....',
    '....322oo221....',
    '...32oo22oo21...',
    '..322oo2222221..',
    '..32222oo22221..',
    '..3222222oo221..',
    '..32oo22oo2221..',
    '..1222ooo22211..',
    '...1122222111...',
    '.....111111.....',
    '................',
  ] },
  // 😠 brows down, a scowl
  'Not my minion!': { pal: RED, px: face([
    '',
    '',
    '',
    '..kk......kk..',
    '...kkk..kkk...',
    '....k.....k...',
    '...wk....wk...',
    '...ww....ww...',
    '',
    '.....kkkkk....',
    '....k.....k...',
  ]) },
  // 😏 one brow up, eyes aside, a smirk
  'Nice try': { pal: YELLOW, px: face([
    '',
    '',
    '..........kk..',
    '...kkk...k....',
    '..............',
    '...wwk...wwk..',
    '...www...www..',
    '..............',
    '...........k..',
    '..........k...',
    '.....kkkkk....',
  ]) },
  // 👑 a crown with three gems
  'Bow down': { pal: [...GOLD, RED[1], RED[2]], px: [
    '................',
    '................',
    '.5.....5.....5..',
    '545...545...545.',
    '.3.....3.....3..',
    '.32...323...32..',
    '.322.32223.322..',
    '.3222222222222..',
    '.3222222222221..',
    '.2225222522251..',
    '.2254225422541..',
    '.2222222222221..',
    '.3333333333331..',
    '.1111111111111..',
    '................',
    '................',
  ] },
  // 🕯️ a lit candle
  'Pray for me': { pal: [...BROWN], px: [
    '................',
    '.......o........',
    '......ooo.......',
    '......owo.......',
    '......owo.......',
    '.......k........',
    '.....wwwwwc.....',
    '.....wwwwwc.....',
    '....wwwwwwc.....',
    '....wwwwwwc.....',
    '.....wwwwwc.....',
    '.....wwwwwc.....',
    '.....wwwwwc.....',
    '...3222222221...',
    '...1111111111...',
    '................',
  ] },
};

const runs = (px, pal) => {
  const out = [];
  withOutline(px).forEach((r, y) => { let x = 0; while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.' && ch !== ' ' && pal[ch]) out.push({ x, y, w, fill: pal[ch] }); x += w; } });
  return out;
};
const cache = new Map();
/** The drawing for a quick line: { size, rects, paths }, or null for anything typed. */
export function emoteArt(line) {
  if (cache.has(line)) return cache.get(line);
  const e = Object.prototype.hasOwnProperty.call(EMOTES, line) ? EMOTES[line] : null;
  let out = null;
  if (e) {
    const pal = { ...SHARED };
    e.pal.forEach((hex, i) => { pal[String(i + 1)] = hex; });
    if (e.extra) e.extra.forEach((hex, i) => { pal[String(e.pal.length + i + 1)] = hex; }); // Oops: its sweat, after the face
    const rects = runs(e.px, pal);
    out = { size: 16, rects, paths: pixelPaths(rects) };
  }
  cache.set(line, out);
  return out;
}
/** The lines that have a drawing. */
export const emoteLines = () => Object.keys(EMOTES);
