// Use the existing Linux browser when present; otherwise Playwright's platform-native install.
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
export const browserPath = process.env.V4_BROWSER || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : chromium.executablePath());
