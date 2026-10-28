// Use the existing Linux browser when present; otherwise Playwright's platform-native install.
// V4_ENGINE=firefox runs a gate or probe in Firefox (Cory plays Firefox on a Mac; every gate was Chrome-only until
// Oct 28). Firefox has no CDP: scripts that throttle the CPU or read heap through newCDPSession check `cdpOk` first.
import { existsSync } from 'node:fs';
import { chromium, firefox } from 'playwright';
export const engine = (process.env.V4_ENGINE || 'chromium').toLowerCase();
if (!['chromium', 'firefox'].includes(engine)) throw new Error(`V4_ENGINE=${engine}: use chromium or firefox`);
export const cdpOk = engine === 'chromium';
export const browserPath = engine === 'firefox' ? undefined
  : process.env.V4_BROWSER || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : chromium.executablePath());
const FIREFOX_MISSING = 'Firefox is not installed here. It needs cdn.playwright.dev and playwright.download.prss.microsoft.com '
  + 'allowed in the environment\'s network settings, then: npx playwright install firefox (the bootstrap hook tries it each session).';
export async function launchBrowser(opts = {}) {
  if (engine === 'chromium') return chromium.launch(opts);
  const path = process.env.V4_BROWSER || firefox.executablePath();
  if (!existsSync(path)) throw new Error(FIREFOX_MISSING);
  // Chrome-only switches (--disable-gpu, autoplay policy) mean nothing to Firefox
  const { executablePath, args, ...rest } = opts;
  return firefox.launch({ ...rest, executablePath: path });
}
