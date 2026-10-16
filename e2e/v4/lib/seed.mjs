// Seeding a saved game into a tab, for the e2e (QA, 2026-10-15). The app saves the game when the page is left
// (saved.js: the deferred save flushes on pagehide), so "write the save, then reload" can lose the save to the page's
// own save-on-leave. seedSave installs it before the app's scripts run, once per tab: an init script writes it on the
// next document load and marks the tab (sessionStorage), so a later reload in the same test resumes the game as it
// stands, never the seed again.
//
//   await seedSave(page, save);               // then page.goto(url) (or page.reload()) and click Resume
//   await seedSave(page, save, { roundStart }); // the round-start snapshot too (the round card's baseline)
//   await seedSave(page, null, { clear: true }); // a tab with no saved game: every patrons.* key removed
//
// Each call is its own seed (its own once-flag), so a page can be seeded again later in a test: the newest call
// writes on the next load. A seed without a roundStart removes any stale one, so the save never resumes against
// another game's baseline.
let n = 0;
export async function seedSave(page, save, { roundStart = null, clear = false } = {}) {
  const flag = `patrons.e2e.seed.${process.pid}.${Date.now().toString(36)}.${++n}`;
  await page.addInitScript(([flag, v, rs, clear]) => {
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
      if (clear) for (const k of Object.keys(localStorage)) if (k.startsWith('patrons.')) localStorage.removeItem(k);
      if (v) localStorage.setItem('patrons.v4.local', JSON.stringify(v));
      if (rs) localStorage.setItem('patrons.v4.roundStart', JSON.stringify(rs));
      else if (v) localStorage.removeItem('patrons.v4.roundStart');
    } catch { /* storage blocked: the test sees no Resume and says so */ }
  }, [flag, save ?? null, roundStart ?? null, !!clear]);
}
