// Render the game's sounds (src/v4/sound.js) to .wav files, offline in Chromium, with the same code the game plays.
//   node scripts/v4-sounds.mjs [outDir] [--loud]       (default design/eval/sounds)
// Writes place, coin (and a handful of coins), fanfare, and several follower lines, and prints each one's peak.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const LOUD = args.includes('--loud');
const out = args.find(a => !a.startsWith('--')) || 'design/eval/sounds';
mkdirSync(out, { recursive: true });
// sound.js has no imports; drop its exports and the browser-only player, and run it as a plain script
const src = readFileSync(new URL('../src/v4/sound.js', import.meta.url), 'utf8')
  .split('// ---------- the player')[0].replace(/^export /gm, '');

const RATE = 44100;
// [file, [[voice, at seconds, seed, followers], …], length]
const JOBS = [
  ['place', [['place', 0.02, 3]], 0.25],
  ['place-x3', [['place', 0.02, 3], ['place', 0.5, 4], ['place', 1.0, 5]], 1.3],
  ['coin', [['coin', 0.02, 11]], 0.5],
  ['coins-handful', [0, 1, 2, 3].map(k => ['coin', 0.02 + k * 0.083, 20 + k]), 0.85],
  ['fanfare', [['fanfare', 0.02, 1]], 1.0],
  ...[101, 202, 303, 404, 505, 606].map((s, i) => [`follower-${i + 1}`, [['follower', 0.02, s]], 0.9]),
  // a haul of followers at once: a crowd as big as the haul, never one clip stacked
  ['followers-3', [['follower', 0.02, 31, 3]], 1.0],
  ['followers-6', [['follower', 0.02, 32, 6]], 1.1],
  ['followers-12', [['follower', 0.02, 33, 12]], 1.3],
  ['all-in-a-turn', [['place', 0.05, 3], ['coin', 0.55, 11], ['coin', 0.633, 12], ['coin', 0.716, 13], ['follower', 1.25, 202, 6], ['fanfare', 2.1, 1], ['follower', 2.9, 404]], 3.8],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.setContent('<!doctype html><title>sounds</title>');
await page.addScriptTag({ content: `${src}\nwindow.__voice = voice;` });
for (const [name, hits, len] of JOBS) {
  const data = await page.evaluate(async ({ hits, len, RATE }) => {
    const ctx = new OfflineAudioContext(2, Math.round(RATE * len), RATE);
    for (const [v, at, seed, n] of hits) window.__voice(ctx, ctx.destination, v, at, seed, n || 1);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), out = new Array(L.length * 2);
    for (let i = 0; i < L.length; i++) { out[2 * i] = L[i]; out[2 * i + 1] = R[i]; }
    return out;
  }, { hits, len, RATE });
  // the game's master (0.6); --loud lifts every file alike (+8 dB), for listening outside the game
  const s = data.map(x => x * 0.6 * (LOUD ? 2.5 : 1));
  const peak = s.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
  const rms = Math.sqrt(s.reduce((m, x) => m + x * x, 0) / s.length);
  writeFileSync(join(out, `${name}.wav`), wav(s));
  console.log(`${name.padEnd(16)} peak ${(20 * Math.log10(peak || 1e-9)).toFixed(1)} dB  rms ${(20 * Math.log10(rms || 1e-9)).toFixed(1)} dB`);
}
await browser.close();

function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((x, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x)) * 32767), 44 + i * 2));
  return b;
}
