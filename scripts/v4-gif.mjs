import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// Record a page as a crisp pixel-art GIF plus an MP4 (send Cory the MP4: the app plays video but shows a GIF as a still).
//   [STEP=1] node scripts/v4-gif.mjs <url> <out.gif> [ms=8000] [width=960] [fps=15]  (use fps 30 for motion Cory judges)  (STEP=1: exact frame stepping, best for the intro)   (GIF_READY=<css selector> waits for it before the clock starts)
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

// STEP=1: deterministic frame stepping for Web-Animations pages (the intro): load with &at=0, pause every animation,
// set its currentTime frame by frame and screenshot. No stutter on a busy box, exact timing. Real-time video otherwise.
if (process.env.STEP) {
  const fpsS = Number(fpsArg);
  const fdir = join(vdir, 'frames'); mkdirSync(fdir, { recursive: true });
  const b = await launchBrowser({ executablePath: browserPath });
  const pg = await b.newPage({ viewport: { width: 1270, height: 700 } });
  await pg.goto(url + (url.includes('at=') ? '' : (url.includes('?') ? '&' : '?') + 'at=0'), { waitUntil: 'load' });
  if (process.env.GIF_READY) await pg.waitForSelector(process.env.GIF_READY, { timeout: 20000 });
  await pg.waitForTimeout(800);
  const n = Math.round((ms / 1000) * fpsS);
  for (let i = 0; i < n; i++) {
    // a page can expose window.__introSeek(ms) to seek a multi-part timeline (the whole intro); else step every animation
    await pg.evaluate(t => { if (window.__introSeek) return window.__introSeek(t); for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } }, (i * 1000) / fpsS);
    await pg.screenshot({ path: join(fdir, `f${String(i).padStart(4, '0')}.png`) });
  }
  await b.close();
  const seq = ['-framerate', String(fpsS), '-i', join(fdir, 'f%04d.png')];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...seq, '-vf', `scale=${widthArg}:-1:flags=neighbor,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=none`, '-loop', '0', out]);
  const mp4s = out.replace(/\.gif$/, '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...seq, '-vf', 'scale=1270:-2:flags=neighbor', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4s]);
  rmSync(vdir, { recursive: true, force: true });
  console.log(`${out} ${(statSync(out).size / 1e6).toFixed(1)} MB (stepped, ${n} frames @ ${fpsS}fps); mp4: ${mp4s}`);
  process.exit(0);
}
const browser = await launchBrowser({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 }, recordVideo: { dir: vdir, size: { width: 1270, height: 700 } } });
const page = await ctx.newPage();
const t0 = Date.now();
// 'load', not 'networkidle': a Vite dev server keeps an HMR socket open, so networkidle waits ~5 s and the trim lands mid-beat
await page.goto(url, { waitUntil: 'load' });
if (process.env.GIF_READY) await page.waitForSelector(process.env.GIF_READY, { timeout: 20000 });
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
