// Child processes and preview servers that can't outlive the harness script that started them.
//
// - runChild: every child runs in its own process group (detached), so one kill takes its whole tree (vitest and its
//   fork workers, vite build and esbuild, an e2e script and its chromium). A child's group is killed the moment the
//   child exits, all groups are killed when this process exits, on SIGINT/SIGTERM/SIGHUP and on an uncaught error,
//   and a tiny detached reaper kills them even if this process is SIGKILLed (it watches an IPC channel that closes
//   when we die). Before this, `npx vite preview` was killed as npx alone and vite lived on for hours.
// - servePreview: `vite preview` runs inside this process (Vite's API), so it dies with us however we die. It refuses
//   a busy port before starting, and confirms the server answering is ours (a one-off token file in the outDir, plus
//   the outDir's index.html asset hash) before anyone tests against it.
import { spawn, spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

// the real bin scripts behind node_modules/.bin/vite and .bin/vitest, run with this node (no npx, no shell in between)
export const VITE = resolve('node_modules/vite/bin/vite.js');
export const VITEST = resolve('node_modules/vitest/vitest.mjs');

const groups = new Set();
let reaper = null;
let installed = false;

function killGroup(pgid, sig) { try { process.kill(-pgid, sig); } catch { /* already gone */ } }
export function killAll(sig = 'SIGKILL') { for (const g of groups) killGroup(g, sig); }

function install() {
  if (installed) return;
  installed = true;
  process.on('exit', () => killAll('SIGKILL'));
  for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
    process.on(sig, () => { console.error(`\n${sig}: stopping ${groups.size} child process group(s)`); killAll('SIGTERM'); process.exit(code); });
  }
  // the reaper: outlives a SIGKILL of this process, kills what we left behind, then exits
  const code = `const g=new Set();const k=s=>{for(const p of g){try{process.kill(-p,s)}catch{}}};`
    + `process.on('message',m=>{if(m&&m.add)g.add(m.add);if(m&&m.del)g.delete(m.del)});`
    + `process.on('disconnect',()=>{if(!g.size)process.exit(0);k('SIGTERM');setTimeout(()=>{k('SIGKILL');process.exit(0)},1500)});`;
  try {
    reaper = spawn(process.execPath, ['-e', code], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    reaper.on('error', () => { reaper = null; });
    reaper.unref();
    reaper.channel?.unref();
  } catch { reaper = null; }
}
const tell = msg => { try { reaper?.connected && reaper.send(msg); } catch { /* the reaper is optional */ } };

/**
 * spawn() in its own process group, tracked until it exits (then its whole group is killed: no grandchild lingers).
 * opts: { env, quiet } — quiet captures stdout+stderr into child.output instead of printing them.
 */
export function runChild(cmd, args, { env = {}, quiet = false } = {}) {
  install();
  const child = spawn(cmd, args, { detached: true, stdio: ['ignore', quiet ? 'pipe' : 'inherit', quiet ? 'pipe' : 'inherit'], env: { ...process.env, ...env } });
  child.output = '';
  if (quiet) { child.stdout.on('data', d => (child.output += d)); child.stderr.on('data', d => (child.output += d)); }
  if (child.pid) { groups.add(child.pid); tell({ add: child.pid }); }
  child.on('exit', () => { if (child.pid) { killGroup(child.pid, 'SIGKILL'); groups.delete(child.pid); tell({ del: child.pid }); } });
  return child;
}

/** Resolves to the child's exit code once it has closed (a spawn error counts as 1). */
export const exitOf = child => new Promise(res => { child.on('error', () => res(1)); child.on('close', code => res(code ?? 1)); });

// ---------- preview servers ----------

/** True when something accepts connections on this port (IPv4 or IPv6 localhost). */
export async function portBusy(port) {
  const probe = host => new Promise(res => {
    const s = createConnection({ host, port });
    const done = v => { s.destroy(); res(v); };
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
    s.setTimeout(1500, () => done(false));
  });
  return (await Promise.all([probe('127.0.0.1'), probe('::1')])).some(Boolean);
}

/** Who listens on the port, best effort (for the refusal message). */
function whoListens(port) {
  try {
    const out = spawnSync('ss', ['-ltnpH', `sport = :${port}`], { encoding: 'utf8' }).stdout || '';
    const pids = [...new Set([...out.matchAll(/pid=(\d+)/g)].map(m => m[1]))];
    return pids.map(pid => { try { return `pid ${pid}: ${readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').join(' ').trim()}`; } catch { return `pid ${pid}`; } }).join('; ');
  } catch { return ''; }
}

export function busyMessage(port) {
  const who = whoListens(port);
  return `port ${port} is busy${who ? ` (${who})` : ''}: a stale server there would answer with another build. Pick another V4_PORT, or stop that server.`;
}

const assetHash = html => (html.match(/\/assets\/index-[\w-]+\.js/) || [null])[0];

/**
 * Serves outDir with `vite preview` inside this process. Throws with a clear message when the port is busy, the
 * server can't start, or the server answering isn't serving this outDir. Returns { url, close }.
 */
export async function servePreview({ outDir, port, host }) {
  if (await portBusy(port)) throw new Error(busyMessage(port));
  const html = readFileSync(join(outDir, 'index.html'), 'utf8');
  const token = `check-token-${randomUUID()}.txt`;
  const nonce = randomUUID();
  writeFileSync(join(outDir, token), nonce);
  const { preview } = await import('vite');
  let server;
  try {
    server = await preview({ build: { outDir }, preview: { port, strictPort: true, ...(host ? { host } : {}) }, logLevel: 'warn' });
  } catch (err) {
    rmSync(join(outDir, token), { force: true });
    throw new Error(`preview server could not start on port ${port}: ${err.message}`);
  }
  const url = `http://localhost:${port}`;
  const close = async () => { rmSync(join(outDir, token), { force: true }); await server.close().catch(() => {}); };
  try {
    // ours: the one-off token comes back, and the page carries this build's entry script
    const got = await (await fetch(`${url}/${token}`)).text();
    if (got.trim() !== nonce) throw new Error(`the server on port ${port} did not serve this run's token from ${outDir}: another server answered`);
    const page = await (await fetch(`${url}/`)).text();
    const want = assetHash(html);
    if (want && !page.includes(want)) throw new Error(`the server on port ${port} serves another build (expected ${want})`);
  } catch (err) {
    await close();
    throw err;
  }
  rmSync(join(outDir, token), { force: true });
  return { url, close };
}
