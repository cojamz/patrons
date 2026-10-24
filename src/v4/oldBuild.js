// A room made by another release's rules: open that release instead, so a reload after a deploy still sits you back down.
// scripts/v4-play.sh keeps the last few releases at play/v/<version>/ (play/ itself is always the newest), each a full
// build with relative paths, sharing this origin's storage, so the seat this device remembers rejoins there.

/** The page that serves `version`, or null when it isn't published (or is this page). */
export async function oldBuildUrl(version, loc = location, get = fetch) {
  if (!/^v\d+\.\d+\.\d+$/.test(String(version || ''))) return null;
  const m = loc.pathname.match(/^(.*\/play\/)(?:v\/[^/]+\/)?/);
  if (!m) return null; // the dev server and tests: no published releases
  const root = m[1];
  const here = m[0];
  const served = async dir => {
    try {
      const r = await get(`${dir}build.json?t=${Date.now()}`, { cache: 'no-store' });
      return r.ok ? (await r.json()).version : null;
    } catch { return null; }
  };
  for (const dir of [root, `${root}v/${version}/`]) {
    if (dir === here) continue;
    if ((await served(dir)) === version) return `${loc.origin}${dir}${loc.search}${loc.hash}`;
  }
  return null;
}
