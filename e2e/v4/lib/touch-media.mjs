// A real phone's media features for an emulated one. Playwright's device emulation (devices['iPhone 13'], or
// isMobile + hasTouch) leaves (pointer: coarse) and (hover: none) false, so the app's touch-only paths (hover.js
// hoverless, parts.jsx sheetMode, GameScreen's tap-to-open card) never ran in our phone gates. Chrome's own
// emulation sets them over CDP. Call touchMedia(page) on every phone page, before its first navigation; it holds
// across that page's navigations and reloads.
export const TOUCH_MEDIA = [
  { name: 'pointer', value: 'coarse' }, { name: 'any-pointer', value: 'coarse' },
  { name: 'hover', value: 'none' }, { name: 'any-hover', value: 'none' },
];

/** Makes `page` read as a touch-only screen; returns its CDP session. */
export async function touchMedia(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features: TOUCH_MEDIA });
  return cdp;
}

/** Null when the (navigated) page really reads as touch-only, else what's wrong: assert it once per run. */
export async function touchMediaProblem(page, label = 'phone page') {
  const m = await page.evaluate(() => ({
    hoverNone: matchMedia('(hover: none)').matches, anyHoverNone: matchMedia('(any-hover: none)').matches,
    coarse: matchMedia('(pointer: coarse)').matches, anyCoarse: matchMedia('(any-pointer: coarse)').matches,
  }));
  const off = Object.entries(m).filter(([, v]) => !v).map(([k]) => k);
  return off.length ? `${label}: touch media emulation is off (${off.join(', ')} false), so touch-only code paths don't run` : null;
}
