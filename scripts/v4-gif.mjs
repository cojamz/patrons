// Record a page as a crisp pixel-art GIF plus an MP4 (send Cory the MP4: the app plays video but shows a GIF as a still).
//   node scripts/v4-gif.mjs <url> <out.gif> [ms=8000] [width=960] [fps=15]
// e.g. node scripts/v4-gif.mjs "http://localhost:5324/?lab=intro&beat=1" design/prototypes/vision/shots/intro2-beat1.gif 5000
// Records at 1270×700 in Chromium, trims the page-load lead-in, and converts with a generated palette and no dithering
// (nearest-neighbour scaling) so pixel art stays sharp. Keeps the GIF under ~15 MB by lowering fps/width if needed.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const [url, out, msArg = '8000', widthArg = '960', fpsArg = '15'] = process.argv.slice(2);
if (!url || !out) { console.error('usage: node scripts/v4-gif.mjs <url> <out.gif> [ms] [width] [fps]'); process.exit(2); }
const ms = Number(msArg);
const vdir = join(tmpdir(), `v4-gif-${process.pid}`);
mkdirSync(vdir, { recursive: true });
mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 }, recordVideo: { dir: vdir, size: { width: 1270, height: 700 } } });
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(url, { waitUntil: 'networkidle' });
const lead = (Date.now() - t0) / 1000; // seconds of blank load at the start of the video
await page.waitForTimeout(ms);
await ctx.close();
await browser.close();
const webm = join(vdir, readdirSync(vdir).find(f => f.endsWith('.webm')));
const keep = out.replace(/\.gif$/, '.webm');
renameSync(webm, keep);

const make = (width, fps) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(Math.max(0, lead - 0.1)), '-t', String(ms / 1000), '-i', keep,
  '-vf', `fps=${fps},scale=${width}:-1:flags=neighbor,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=none`, '-loop', '0', out]);
let width = Number(widthArg), fps = Number(fpsArg);
make(width, fps);
while (statSync(out).size > 15e6 && width > 480) { width = Math.round(width * 0.8); fps = Math.max(8, fps - 2); make(width, fps); }
// an MP4 beside it too: the Claude app shows a GIF as a still, but plays an MP4
const mp4 = out.replace(/\.gif$/, '.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(Math.max(0, lead - 0.1)), '-t', String(ms / 1000), '-i', keep, '-vf', 'scale=1270:-2:flags=neighbor', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4]);
rmSync(vdir, { recursive: true, force: true });
console.log(`${out} ${(statSync(out).size / 1e6).toFixed(1)} MB, ${width}px @ ${fps}fps; mp4: ${mp4}; webm: ${keep}`);
