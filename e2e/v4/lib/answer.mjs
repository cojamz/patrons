// One way for every e2e to answer the table, the way a person would (QA, 2026-10-15). Choices moved onto the board
// (boardPick.js): a rival's seat, a resource stack, a wheel space, a shop card is now the answer, and the keyboard list
// is Tab-only; drivers that clicked only ".prompt.choice button"s waited forever (Kickback asks for a rival's seat).
//
// answerChoice(page, opts) answers whatever is pending for the person at the device:
//   - the pay sheet: its Pay button (the suggested way), else Enter in the sheet;
//   - board targets and buttons alike, by their data-option: seats, stacks, members, spaces, shop cards, plain buttons;
//   - a pair (boardPick.js comboStep, the trade picker): yours first (@pick:x), then theirs; once one is lifted
//     (@unpick on screen) it never puts it back or switches, which would only go round in circles;
//   - never a toggle (a free on/off switch would loop), Back, or @unpick.
// It returns what it clicked, { id, kind: 'pay'|'pick'|'option' }, or null when nothing on screen answers.
// Round cards ([data-next-round]) and hand-offs ([data-handoff]) aren't answers: the drivers press those themselves.
//
// opts:
//   prefer   ids matching these (RegExp or string prefix), in this order, before the rest (page order)
//   last     ids matching these go after everything else (memory.mjs: Pass last)
//   avoid    ids matching these are never clicked (benders.mjs: release:)
//   panelFirst  the choice panel's and dialogs' own answers before the board's (online.mjs)
//   skip     rotate the candidates by this many (a driver that saw its last click change nothing tries the next)
//   domFallback  when every real click is refused (a hover card over the target), park the pointer and press the
//            element directly (online.mjs tests the online flow, not hit-testing)
//   timeout  per real click, ms (default 1500)
//   press    (el) => truthy when it pressed el: the driver's own way to press a candidate instead of Playwright's click
//            (online.mjs: a person's press, which doesn't wait for a starved page to show two still frames)

const SKIP = id => !id || id.startsWith('toggle:') || id === 'back' || id === '@unpick';
const matches = (id, p) => (p instanceof RegExp ? p.test(id) : typeof p === 'function' ? p(id) : id.startsWith(p));
const rank = (id, list) => { const k = list.findIndex(p => matches(id, p)); return k < 0 ? list.length : k; };

export async function answerChoice(page, { prefer = [], last = [], avoid = [], panelFirst = false, skip = 0, domFallback = false, timeout = 1500, press = null } = {}) {
  // Every element handle this takes is let go before it returns: a handle pins its element, and a detached one pins its
  // whole old tree, for as long as the page lives (memory.mjs read 27k DOM nodes on results: old shops, wheels, seats).
  const held = [];
  try { return await answer(page, held, { prefer, last, avoid, panelFirst, skip, domFallback, timeout, press }); } finally { for (const h of held) h.dispose().catch(() => {}); }
}

async function answer(page, held, { prefer, last, avoid, panelFirst, skip, domFallback, timeout, press }) {
  const keep = h => { if (h) held.push(h); return h; };
  // the pay sheet holds the keyboard: Pay (the suggested way is already in the cost), else Enter
  const sheet = keep(await page.$('.dialog.pay'));
  if (sheet) {
    const go = keep(await page.$('.dialog.pay [data-option]:not([data-option="back"]):not([disabled])'));
    const id = go ? await go.getAttribute('data-option').catch(() => null) : null;
    if (go) { try { await go.click({ timeout }); return { id, kind: 'pay' }; } catch { /* covered: Enter below */ } }
    await sheet.press('Enter').catch(() => {});
    return { id: id || 'Enter', kind: 'pay' };
  }
  const els = await page.$$('[data-option]:not([disabled]):not([aria-disabled="true"])');
  held.push(...els);
  if (!els.length) return null;
  const meta = await page.evaluate(es => es.map(e => [e.getAttribute('data-option'), !!e.parentElement?.closest('.prompt.choice, [role="dialog"]')]), els).catch(() => []);
  const second = meta.some(m => m[0] === '@unpick');
  let cands = els.map((el, i) => ({ el, i, id: meta[i]?.[0], panel: !!meta[i]?.[1] }))
    .filter(c => !SKIP(c.id) && !(second && c.id.startsWith('@pick:')) && !avoid.some(p => matches(c.id, p)));
  cands.sort((a, b) => (panelFirst ? (b.panel - a.panel) : 0) || rank(a.id, prefer) - rank(b.id, prefer)
    || (last.some(p => matches(a.id, p)) - last.some(p => matches(b.id, p))) || a.i - b.i);
  if (!cands.length) return null;
  if (skip) cands = cands.map((_, k) => cands[(k + skip) % cands.length]);
  const kindOf = id => (id.startsWith('@pick:') ? 'pick' : 'option');
  for (const c of cands) {
    try {
      if (press) { if (await press(c.el)) return { id: c.id, kind: kindOf(c.id) }; continue; }
      await c.el.click({ timeout }); return { id: c.id, kind: kindOf(c.id) };
    } catch { /* covered, moved or gone: the next */ }
  }
  if (domFallback) {
    await page.mouse.move(1, 1).catch(() => {});
    for (const c of cands) {
      if (await c.el.evaluate(e => { if (!e.isConnected) return false; e.click(); return true; }).catch(() => false)) return { id: c.id, kind: kindOf(c.id) };
    }
  }
  return null;
}
