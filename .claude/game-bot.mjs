/**
 * Patrons Game Bot — Full-game Playwright automation for UX testing.
 *
 * Plays a complete 3-round game against AI, handling ALL modal types,
 * validating game state transitions, and detecting bugs.
 *
 * Usage:
 *   node .claude/game-bot.mjs [options]
 *
 * Options:
 *   --width=N        Viewport width (default: 1440)
 *   --height=N       Viewport height (default: 900)
 *   --prefix=NAME    Screenshot prefix (default: "game")
 *   --no-screenshots Skip screenshots (just play)
 *   --verbose        Extra console logging
 *   --url=URL        Dev server URL (default: http://localhost:5173)
 *
 * Output: Screenshots in .claude/screenshots/ + JSON summary to stdout
 *
 * Exit codes:
 *   0 = game completed (may still have issues logged)
 *   1 = fatal error (crash, timeout, stuck)
 *   2 = bugs detected (unhandled modals, missing UI, etc.)
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = resolve(__dirname, 'screenshots');
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (key, def) => {
  const a = args.find(a => a.startsWith(`--${key}=`));
  return a ? a.split('=').slice(1).join('=') : def;
};
const hasFlag = (key) => args.includes(`--${key}`);

const WIDTH = parseInt(getArg('width', '1440'));
const HEIGHT = parseInt(getArg('height', '900'));
const PREFIX = getArg('prefix', 'game');
const TAKE_SCREENSHOTS = !hasFlag('no-screenshots');
const VERBOSE = hasFlag('verbose');
const BASE_URL = getArg('url', 'http://localhost:5173');

// Safety limits
const MAX_ACTIONS = 200;    // max total actions before declaring stuck
const MODAL_TIMEOUT = 15000; // max ms waiting for a modal to resolve
const TURN_TIMEOUT = 30000;  // max ms for a single turn cycle
const AI_WAIT_MS = 4000;     // wait for AI to finish its turn

let shotNum = 0;
const screenshots = [];
const issues = [];
const log = (msg) => VERBOSE && console.error(`[bot] ${msg}`);

// ============================================================================
// Screenshot helper
// ============================================================================
async function shot(page, label, annotation = '') {
  if (!TAKE_SCREENSHOTS) return;
  shotNum++;
  const num = String(shotNum).padStart(2, '0');
  const filename = `${PREFIX}-${num}-${label}.png`;
  const path = resolve(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path });
  screenshots.push({ num: shotNum, filename, label, annotation });
  log(`Screenshot: ${filename}${annotation ? ` — ${annotation}` : ''}`);
}

function addIssue(category, message, details = {}) {
  const issue = { category, message, ...details };
  issues.push(issue);
  console.error(`[ISSUE] ${category}: ${message}`);
}

// ============================================================================
// Modal detection & handling
// ============================================================================
async function hasModal(page) {
  return page.evaluate(() => {
    const overlays = document.querySelectorAll('.fixed.inset-0');
    return Array.from(overlays).some(el => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    });
  });
}

async function getModalInfo(page) {
  return page.evaluate(() => {
    const overlays = document.querySelectorAll('.fixed.inset-0');
    for (const overlay of overlays) {
      const s = getComputedStyle(overlay);
      if (s.display === 'none' || s.visibility === 'hidden') continue;

      // Check for AI draft waiting screen — these are full-screen overlays with just text
      const text = overlay.textContent?.trim() || '';
      if (text === 'Setting up draft...' || text.endsWith('is choosing...')) {
        return { type: 'ai_waiting', title: text, buttons: [], visible: true, fullText: text };
      }

      // Find title — include h1 (round transition uses h1 for "Round 1" / "Game Over")
      const titleEl = overlay.querySelector('h1, h2, h3, [class*="text-xl"], [class*="text-lg"]');
      const title = titleEl?.textContent?.trim() || '';

      // Find all buttons
      const btns = Array.from(overlay.querySelectorAll('button')).filter(b => b.offsetParent !== null);
      const buttons = btns.map(b => ({
        text: b.textContent.trim().substring(0, 80),
        disabled: b.disabled,
      }));

      // Full text for pattern matching
      const fullText = overlay.textContent || '';
      const titleLower = title.toLowerCase();

      // Detect type by priority
      let type = 'unknown';

      // Bug sentinel: unhandled decision type
      if (fullText.includes('Unhandled decision type')) {
        type = 'UNHANDLED_BUG';
      } else if (titleLower.includes('choose your people') || titleLower.includes('champion')) {
        type = 'champion_draft';
      } else if (fullText.includes('Power Card Slot') || fullText.includes('Choose Your People')) {
        type = 'champion_draft';
      } else if (titleLower.includes('nullif')) {
        type = 'nullifier';
      } else if (titleLower.includes('choose a color') || titleLower.includes('color') || titleLower.includes('spend all')) {
        // ChooseColor modal — has color buttons (Gold, Black, Green, Yellow) with possible "(N available)" suffix
        const hasColorBtns = btns.some(b => /\b(Gold|Black|Green|Yellow)\b/i.test(b.textContent));
        if (hasColorBtns || buttons.some(b => b.text.includes('Select a Color') || b.text.includes('Choose '))) {
          type = 'choose_color';
        }
      }

      if (type === 'unknown') {
        // Check button text for round transition/game over (title may be in h1 that our selector missed, or empty)
        const hasRoundBtn = buttons.some(b =>
          /Begin Round|View Final Standings|Game Over/i.test(b.text)
        );
        const hasRoundText = fullText.includes('Round Complete') || fullText.includes('Final Results') || fullText.includes('Game Over');

        if (hasRoundBtn || hasRoundText) {
          type = 'round_transition';
        } else if (
          titleLower.includes('target')
          || titleLower.includes('choose a target')
          || titleLower.includes('choose a player')
        ) {
          type = 'target_player';
        } else if (titleLower.includes('steal') && overlay.querySelector('.grid.grid-cols-2')) {
          type = 'gem_selection';
        } else if (
          (titleLower.includes('resource') || titleLower.includes('choose'))
          && overlay.querySelector('.grid.grid-cols-2')
        ) {
          type = 'gem_selection';
        } else if (titleLower.includes('action')) {
          type = 'action_choice';
        } else if (titleLower.includes('redistribute')) {
          type = 'redistribute';
        } else if (titleLower.includes('discard')) {
          type = 'discard_artifact';
        } else if (titleLower.includes('round') || titleLower.includes('game over') || titleLower.includes('final')) {
          type = 'round_transition';
        } else if (buttons.some(b => b.text.toLowerCase().includes('confirm selection'))) {
          if (overlay.querySelector('.grid.grid-cols-2')) {
            type = 'gem_selection';
          } else {
            type = 'confirmation';
          }
        } else if (buttons.some(b => b.text.toLowerCase().includes('confirm'))) {
          type = 'confirmation';
        } else if (buttons.some(b => b.text.includes('Select a Color'))) {
          type = 'choose_color';
        }
      }

      return { type, title, buttons, visible: true, fullText: fullText.substring(0, 300) };
    }
    return { type: 'none', title: '', buttons: [], visible: false, fullText: '' };
  });
}

async function handleModal(page, modalInfo) {
  const { type, title, buttons } = modalInfo;
  log(`Handling modal: ${type} — "${title}"`);

  switch (type) {
    case 'ai_waiting': {
      // AI is drafting or processing — just wait, don't click anything
      log(`AI waiting: "${title}" — waiting 2s`);
      await page.waitForTimeout(2000);
      return true; // Signal that we handled it (by waiting)
    }

    case 'UNHANDLED_BUG': {
      // This is a BUG — an unhandled decision type in the UI
      const decisionType = modalInfo.fullText.match(/Unhandled decision type:\s*(\w+)/)?.[1] || 'unknown';
      addIssue('unhandled_decision', `Unhandled decision type: ${decisionType}`, {
        title,
        decisionType,
        screenshot: `modal-unhandled-${decisionType}`,
      });
      await shot(page, `bug-unhandled-${decisionType}`, `BUG: Unhandled decision type "${decisionType}"`);
      // Try to dismiss with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      return true;
    }

    case 'champion_draft': {
      const champBtn = page.locator('.fixed.inset-0 button').filter({ hasText: /Power Card Slot/i }).first();
      if (await champBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await champBtn.click({ force: true });
        log('Selected champion');
        await page.waitForTimeout(800);
        return true;
      }
      const anyBtn = page.locator('.fixed.inset-0 button').first();
      await anyBtn.click({ force: true });
      await page.waitForTimeout(800);
      return true;
    }

    case 'nullifier': {
      const actionBtn = page.locator('.fixed.inset-0 button').filter({ hasText: /gold|black|green|yellow/i }).first();
      if (await actionBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await actionBtn.click({ force: true });
        log('Placed nullifier');
        await page.waitForTimeout(600);
        return true;
      }
      const anyAction = page.locator('.fixed.inset-0 button').nth(1);
      if (await anyAction.isVisible({ timeout: 500 }).catch(() => false)) {
        await anyAction.click({ force: true });
        await page.waitForTimeout(600);
        return true;
      }
      return false;
    }

    case 'target_player': {
      const modal = page.locator('.fixed.inset-0');
      const playerCards = modal.locator('button').filter({ hasText: /Favor/i });
      const cardCount = await playerCards.count();
      log(`Found ${cardCount} player cards in target modal`);

      if (cardCount > 0) {
        await playerCards.first().click({ force: true });
        log('Clicked player card');
        await page.waitForTimeout(300);
      }

      // Look for "Target <Name>" confirm button
      for (let attempt = 0; attempt < 5; attempt++) {
        const targetBtn = modal.locator('button').filter({ hasText: /^Target /i }).first();
        try {
          if (await targetBtn.isVisible({ timeout: 300 })) {
            if (!(await targetBtn.isDisabled())) {
              await targetBtn.click({ force: true });
              log('Confirmed target player');
              await page.waitForTimeout(600);
              return true;
            }
          }
        } catch {}
        await page.waitForTimeout(150);
      }

      // Fallback
      const allBtns = modal.locator('button');
      const btnCount = await allBtns.count();
      for (let i = 0; i < btnCount; i++) {
        const btn = allBtns.nth(i);
        try {
          const text = (await btn.textContent()).trim();
          const disabled = await btn.isDisabled();
          if (!disabled && (text.startsWith('Target') || text.includes('Confirm'))) {
            await btn.click({ force: true });
            log(`Fallback target confirm: "${text}"`);
            await page.waitForTimeout(600);
            return true;
          }
        } catch {}
      }
      return false;
    }

    case 'gem_selection': {
      const modal = page.locator('.fixed.inset-0');
      const grid = modal.locator('.grid.grid-cols-2');

      const allGridBtns = grid.locator('button');
      const gridBtnCount = await allGridBtns.count();

      // Collect indices of "+" buttons
      const plusIndices = [];
      for (let i = 0; i < gridBtnCount; i++) {
        const txt = await allGridBtns.nth(i).textContent().catch(() => '');
        if (txt.trim() === '+') {
          plusIndices.push(i);
        }
      }
      log(`Gem selection: found ${plusIndices.length} plus buttons out of ${gridBtnCount} total`);

      if (plusIndices.length === 0) {
        log('No plus buttons found in gem selection grid');
        return false;
      }

      // Click + buttons round-robin
      for (let attempt = 0; attempt < 20; attempt++) {
        const idx = plusIndices[attempt % plusIndices.length];
        const btn = allGridBtns.nth(idx);

        try {
          const isDisabled = await btn.isDisabled();
          if (!isDisabled) {
            await btn.click({ force: true });
            log(`Clicked + button at index ${idx}`);
            await page.waitForTimeout(150);
          }
        } catch (e) {
          log(`Error clicking + button: ${e.message}`);
        }

        // Check if "Confirm Selection" is now enabled
        const confirmBtn = modal.locator('button').filter({ hasText: 'Confirm Selection' }).first();
        try {
          const confirmVisible = await confirmBtn.isVisible({ timeout: 100 });
          if (confirmVisible) {
            const confirmDisabled = await confirmBtn.isDisabled();
            if (!confirmDisabled) {
              await confirmBtn.click({ force: true });
              log('Confirmed gem selection');
              await page.waitForTimeout(600);
              return true;
            }
          }
        } catch {}
      }

      log('Failed to complete gem selection after 20 attempts');
      return false;
    }

    case 'choose_color': {
      const modal = page.locator('.fixed.inset-0');

      // Click first available color button — text contains "Gold", "Black", "Green", or "Yellow"
      // (may also include "(N available)" suffix)
      const colorBtns = modal.locator('button').filter({ hasText: /\b(Gold|Black|Green|Yellow)\b/i });
      // Exclude the confirm button (which says "Choose Gold" etc.)
      const allColorBtns = [];
      const totalBtns = await colorBtns.count();
      for (let i = 0; i < totalBtns; i++) {
        const text = await colorBtns.nth(i).textContent().catch(() => '');
        // Color option buttons don't start with "Choose" or "Select"
        if (!text.trim().startsWith('Choose') && !text.trim().startsWith('Select')) {
          allColorBtns.push(i);
        }
      }
      const colorCount = allColorBtns.length;
      log(`ChooseColor: found ${colorCount} color buttons (from ${totalBtns} total)`);

      if (colorCount > 0) {
        // Pick a random color option
        const pick = allColorBtns[Math.floor(Math.random() * colorCount)];
        await colorBtns.nth(pick).click({ force: true });
        log(`Clicked color option ${pick}`);
        await page.waitForTimeout(300);
      }

      // Confirm — button text changes to "Choose <Color>"
      for (let attempt = 0; attempt < 5; attempt++) {
        const confirmBtn = modal.locator('button').filter({ hasText: /^Choose /i }).first();
        try {
          if (await confirmBtn.isVisible({ timeout: 300 })) {
            if (!(await confirmBtn.isDisabled())) {
              await confirmBtn.click({ force: true });
              log('Confirmed color choice');
              await page.waitForTimeout(600);
              return true;
            }
          }
        } catch {}
        await page.waitForTimeout(150);
      }
      return false;
    }

    case 'action_choice': {
      const modal = page.locator('.fixed.inset-0');
      // Click first action option
      const options = modal.locator('button').filter({ has: page.locator('span') });
      const firstOpt = options.first();
      if (await firstOpt.isVisible({ timeout: 1000 }).catch(() => false)) {
        await firstOpt.click({ force: true });
        await page.waitForTimeout(400);
      }
      const confirmBtn = modal.locator('button').filter({ hasText: /Confirm/i }).first();
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (!(await confirmBtn.isDisabled())) {
          await confirmBtn.click({ force: true });
          log('Confirmed action choice');
          await page.waitForTimeout(600);
          return true;
        }
      }
      return false;
    }

    case 'redistribute': {
      // Redistribute modal — try to find a confirm button
      const modal = page.locator('.fixed.inset-0');
      const confirmBtn = modal.locator('button').filter({ hasText: /Confirm|Done|Apply/i }).first();
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (!(await confirmBtn.isDisabled())) {
          await confirmBtn.click({ force: true });
          log('Confirmed redistribution');
          await page.waitForTimeout(600);
          return true;
        }
      }
      // Fallback: just accept current distribution
      return false;
    }

    case 'discard_artifact': {
      // Pick first artifact to discard
      const modal = page.locator('.fixed.inset-0');
      const artifactBtns = modal.locator('button').first();
      if (await artifactBtns.isVisible({ timeout: 500 }).catch(() => false)) {
        await artifactBtns.click({ force: true });
        await page.waitForTimeout(400);
      }
      const confirmBtn = modal.locator('button').filter({ hasText: /Confirm|Discard/i }).first();
      if (await confirmBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        if (!(await confirmBtn.isDisabled())) {
          await confirmBtn.click({ force: true });
          log('Confirmed artifact discard');
          await page.waitForTimeout(600);
          return true;
        }
      }
      return false;
    }

    case 'round_transition': {
      const fullTextLower = (modalInfo.fullText || '').toLowerCase();
      const isGameOver = title.toLowerCase().includes('game over')
        || fullTextLower.includes('game over')
        || fullTextLower.includes('final results')
        || buttons.some(b => b.text.includes('View Final Standings'));

      if (isGameOver) {
        log('GAME OVER detected!');
        await shot(page, 'game-over', 'Game Over screen');
        // Do NOT click "View Final Standings" — it reloads the page and starts a new game
        return 'game_over';
      }

      // Mid-game round transition — click "Begin Round N"
      const continueBtn = page.locator('.fixed.inset-0 button')
        .filter({ hasText: /Begin Round|Continue/i }).first();
      if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await shot(page, 'round-transition', `Round transition: "${title}"`);
        await continueBtn.click({ force: true });
        log('Dismissed round transition');
        await page.waitForTimeout(1000);
        return true;
      }
      return false;
    }

    case 'confirmation': {
      const confirmBtn = page.locator('.fixed.inset-0 button')
        .filter({ hasText: /Confirm|OK|Continue|Done/i }).first();
      if (await confirmBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        if (!(await confirmBtn.isDisabled())) {
          await confirmBtn.click({ force: true });
          log('Dismissed confirmation');
          await page.waitForTimeout(500);
          return true;
        }
      }
      return false;
    }

    default: {
      addIssue('unknown_modal', `Unknown modal type: "${title}"`, { buttons: buttons.map(b => b.text) });
      await shot(page, `unknown-modal`, `Unknown modal: "${title}"`);

      // Try clicking any enabled button
      for (const btnInfo of buttons) {
        if (!btnInfo.disabled && btnInfo.text.length > 0) {
          const btn = page.locator('.fixed.inset-0 button')
            .filter({ hasText: btnInfo.text.substring(0, 20) }).first();
          if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
            await btn.click({ force: true });
            log(`Generic dismiss: clicked "${btnInfo.text.substring(0, 30)}"`);
            await page.waitForTimeout(600);
            return true;
          }
        }
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      return false;
    }
  }
}

/**
 * Clear all visible modals, returning count cleared.
 * Returns 'game_over' string if game over screen detected.
 */
async function clearAllModals(page, maxAttempts = 20) {
  let count = 0;
  for (let i = 0; i < maxAttempts; i++) {
    if (!(await hasModal(page))) return count;
    const info = await getModalInfo(page);
    if (!info.visible) return count;
    await shot(page, `modal-${info.type}-${count}`, `Modal: ${info.type} — "${info.title}"`);
    const result = await handleModal(page, info);

    if (result === 'game_over') return 'game_over';

    if (!result) {
      log(`Could not handle modal type: ${info.type}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      if (!(await hasModal(page))) return count;
      await page.mouse.click(10, 10);
      await page.waitForTimeout(500);
    }
    count++;
  }
  return count;
}

// ============================================================================
// Game state reading
// ============================================================================
async function getGameState(page) {
  return page.evaluate(() => {
    const state = {
      hasModal: false,
      isMyTurn: false,
      canEndTurn: false,
      availableActions: 0,
      occupiedActions: 0,
      round: 0,
      boardVisible: false,
      phase: 'unknown',
      playerResources: {},
      playerFavor: 0,
      playerWorkers: 0,
      aiThinking: false,
    };

    // Check modals
    const overlays = document.querySelectorAll('.fixed.inset-0');
    state.hasModal = Array.from(overlays).some(el => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    });

    // End turn button state
    const endBtn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.trim().toUpperCase() === 'END TURN');
    if (endBtn) {
      state.canEndTurn = !endBtn.disabled && endBtn.offsetParent !== null;
    }

    // Count actual action spaces — only buttons with tier badge prefix
    // NOTE: ActionSpace buttons are NEVER disabled in the DOM.
    // Occupied actions use opacity: 0.6 and cursor: default.
    // Available actions use opacity: 1 and cursor: pointer.
    const allBtns = Array.from(document.querySelectorAll('button'));
    for (const btn of allBtns) {
      const rect = btn.getBoundingClientRect();
      if (rect.height >= 28 && rect.height <= 42 && rect.width > 80 && rect.top > 50 && rect.top < 700) {
        const text = btn.textContent.trim();
        if (/^(I{1,3}|R[123])[A-Z]/.test(text)) {
          const s = getComputedStyle(btn);
          const opacity = parseFloat(s.opacity);
          const isInteractive = s.cursor === 'pointer' && opacity >= 0.9;
          if (isInteractive) state.availableActions++;
          else state.occupiedActions++;
        }
      }
    }

    // Round info — scan visible text elements for "Round N" or "Round N of 3"
    const hudEl = document.querySelector('.fixed.top-0');
    const hudText = hudEl?.textContent || '';
    // Try HUD first
    let roundMatch = hudText.match(/Round\s+(\d)\b/i);
    // Fallback: look at visible elements specifically (not full body text to avoid false matches)
    if (!roundMatch) {
      // Check breadcrumb, phase indicators, or other small HUD elements
      const indicators = document.querySelectorAll('span, div, p');
      for (const el of indicators) {
        if (el.children.length > 2) continue; // Skip containers
        const t = el.textContent.trim();
        // Only match short text like "Round 1", "Round 2 of 3", etc.
        if (t.length < 20) {
          const m = t.match(/Round\s+(\d)\b/i);
          if (m) { roundMatch = m; break; }
        }
      }
    }
    if (roundMatch) state.round = parseInt(roundMatch[1]);

    // Board visibility
    const boardGrid = Array.from(document.querySelectorAll('*')).find(el => {
      const s = getComputedStyle(el);
      return s.display === 'grid' && el.children.length >= 2 && el.getBoundingClientRect().height > 200;
    });
    state.boardVisible = !!boardGrid;

    // Is it my turn? Look for active end turn button (reliable signal)
    state.isMyTurn = state.canEndTurn;

    // AI thinking: check if END TURN is visible but disabled (AI is doing things)
    const endBtn2 = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.trim().toUpperCase() === 'END TURN');
    if (endBtn2 && endBtn2.disabled && endBtn2.offsetParent !== null) {
      state.aiThinking = true;
    }

    // Try to read player resources from the player panel
    const panelText = document.querySelector('[class*="player-panel"], [class*="PlayerPanel"]')?.textContent || '';
    const resourceMatch = panelText.match(/(\d+)/g);
    // (Resources are displayed in the panel but hard to parse generically)

    return state;
  });
}

async function placeWorker(page) {
  // Find AVAILABLE action buttons — skip occupied/locked/nullified ones.
  // ActionSpace buttons are NEVER disabled; they use opacity + cursor to indicate state:
  //   Available: opacity=1, cursor=pointer
  //   Occupied:  opacity=0.6, cursor=default
  //   Nullified: opacity=0.5, cursor=default
  //   Locked:    opacity=0.35, cursor=default
  const candidates = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const actionBtns = [];

    for (const btn of btns) {
      const rect = btn.getBoundingClientRect();
      // Action space buttons: ~36px tall, in the board area
      if (rect.height >= 28 && rect.height <= 42 && rect.width > 80 && rect.top > 50 && rect.top < 700) {
        const text = btn.textContent.trim();
        // Action buttons have a tier badge: "I", "II", "III" followed by uppercase action name
        if (/^I{1,3}[A-Z]/.test(text)) {
          const s = getComputedStyle(btn);
          const opacity = parseFloat(s.opacity);
          const isInteractive = s.cursor === 'pointer' && opacity >= 0.9;
          if (!isInteractive) continue; // Skip occupied/locked/nullified actions
          actionBtns.push({
            text: text.substring(0, 50),
            centerX: Math.round(rect.x + rect.width / 2),
            centerY: Math.round(rect.y + rect.height / 2),
            opacity,
          });
        }
      }
    }
    return actionBtns;
  });

  if (candidates.length === 0) {
    log('No available actions on focused god — will try other gods');
    return null;
  }

  // Pick a random available action
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Use Playwright's native click (proper mouse events, works with motion.button)
  await page.mouse.click(chosen.centerX, chosen.centerY);
  log(`Placed worker: "${chosen.text}" at (${chosen.centerX}, ${chosen.centerY})`);
  await page.waitForTimeout(800);
  return chosen.text;
}

async function endTurn(page) {
  const endBtn = page.locator('button').filter({ hasText: /^END TURN$/i }).first();
  try {
    if (await endBtn.isVisible({ timeout: 1000 })) {
      if (!(await endBtn.isDisabled())) {
        await endBtn.click({ force: true });
        log('Ended turn');
        await page.waitForTimeout(1200);
        return true;
      }
    }
  } catch {}
  return false;
}

async function focusGod(page, index) {
  const clicked = await page.evaluate((idx) => {
    for (const el of document.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      if (s.display === 'grid' && el.children.length >= 2 && el.getBoundingClientRect().height > 200) {
        const child = el.children[idx];
        if (child) {
          child.click();
          return true;
        }
      }
    }
    return false;
  }, index);

  if (clicked) {
    await page.waitForTimeout(400);
    log(`Focused god ${index}`);
  }
  return clicked;
}

async function getGodCount(page) {
  return page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      if (s.display === 'grid' && el.children.length >= 2 && el.getBoundingClientRect().height > 200) {
        return el.children.length;
      }
    }
    return 4;
  });
}

// ============================================================================
// Console error capture
// ============================================================================
function setupConsoleCapture(page) {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known noise
      if (text.includes('favicon') || text.includes('404')) return;
      consoleErrors.push(text.substring(0, 200));
      log(`CONSOLE ERROR: ${text.substring(0, 100)}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message.substring(0, 200)}`);
    addIssue('page_error', err.message.substring(0, 200));
  });
  return consoleErrors;
}

// ============================================================================
// Main playthrough — full 3-round game
// ============================================================================
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();

  const summary = {
    screenshots: [],
    turnsPlayed: 0,
    modalsHandled: 0,
    roundsCompleted: 0,
    gameCompleted: false,
    actionsPlaced: [],
    issues: [],
    consoleErrors: [],
    timing: { start: Date.now() },
  };

  const consoleErrors = setupConsoleCapture(page);

  try {
    // ── PHASE 1: Setup ──
    log('Phase 1: Navigate to game');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await shot(page, 'setup', 'Game setup screen');

    // Dismiss rules interstitial if present — keep clicking Next/Skip until we see BEGIN GAME
    for (let i = 0; i < 10; i++) {
      const beginBtn = page.locator('button').filter({ hasText: /BEGIN GAME/i }).first();
      if (await beginBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await beginBtn.click();
        log('Clicked BEGIN GAME');
        await page.waitForTimeout(1500);
        break;
      }
      // Try dismiss rules slides
      const nextBtn = page.locator('button').filter({ hasText: /Next|Skip|Got it|Continue/i }).first();
      if (await nextBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await nextBtn.click({ force: true });
        log('Dismissed rules slide');
        await page.waitForTimeout(500);
      }
    }

    // ── PHASE 2: Handle draft + initial modals ──
    log('Phase 2: Draft & setup modals');
    // Keep clearing modals until the board is actually visible (no more draft overlays)
    for (let attempt = 0; attempt < 30; attempt++) {
      if (await hasModal(page)) {
        const modalResult = await clearAllModals(page, 10);
        if (typeof modalResult === 'number') summary.modalsHandled += modalResult;
      }

      // Check if the board is actually ready (no full-screen overlays)
      const boardReady = await page.evaluate(() => {
        const overlays = document.querySelectorAll('.fixed.inset-0');
        const hasBlockingOverlay = Array.from(overlays).some(el => {
          const s = getComputedStyle(el);
          return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
        });
        // Board is ready when no overlay and the grid is visible
        const boardGrid = Array.from(document.querySelectorAll('*')).find(el => {
          const s = getComputedStyle(el);
          return s.display === 'grid' && el.children.length >= 2 && el.getBoundingClientRect().height > 200;
        });
        return !hasBlockingOverlay && !!boardGrid;
      });

      if (boardReady) {
        log(`Board ready after ${attempt + 1} attempts`);
        break;
      }
      log(`Board not ready (attempt ${attempt + 1}), waiting...`);
      await page.waitForTimeout(1000);
    }

    // ── PHASE 3: Board ready ──
    log('Phase 3: Board ready — take baseline screenshots');
    await shot(page, 'board-ready', 'Game board after setup');

    const godCount = await getGodCount(page);
    for (let i = 0; i < godCount; i++) {
      if (await focusGod(page, i)) {
        await shot(page, `god-${i}-focused`, `God area ${i} focused`);
      }
    }
    await focusGod(page, 0);

    // ── PHASE 4: Play full game ──
    log('Phase 4: Playing full game');
    let totalActions = 0;
    let consecutiveFailures = 0;
    let currentRound = 1;
    let gameOver = false;

    while (!gameOver && totalActions < MAX_ACTIONS) {
      totalActions++;
      log(`\n--- Action cycle ${totalActions} (Round ${currentRound}) ---`);

      // Handle any pending modals
      if (await hasModal(page)) {
        const modalResult = await clearAllModals(page, 10);
        if (modalResult === 'game_over') {
          gameOver = true;
          break;
        }
        if (typeof modalResult === 'number') summary.modalsHandled += modalResult;
      }

      const state = await getGameState(page);
      log(`State: actions=${state.availableActions}, canEnd=${state.canEndTurn}, round=${state.round}, myTurn=${state.isMyTurn}, aiThinking=${state.aiThinking}`);

      // Track round changes
      if (state.round > currentRound) {
        currentRound = state.round;
        summary.roundsCompleted++;
        await shot(page, `round-${currentRound}-start`, `Round ${currentRound} started`);
        log(`=== ROUND ${currentRound} STARTED ===`);
      }

      // If AI is thinking, wait for it
      if (state.aiThinking && !state.canEndTurn) {
        log('AI is thinking, waiting...');
        await page.waitForTimeout(AI_WAIT_MS);

        // Handle any modals that appeared during AI turn
        if (await hasModal(page)) {
          const modalResult = await clearAllModals(page, 10);
          if (modalResult === 'game_over') {
            gameOver = true;
            break;
          }
          if (typeof modalResult === 'number') summary.modalsHandled += modalResult;
        }
        continue;
      }

      // Place a worker if possible
      let workerPlaced = false;
      if (!state.hasModal) {
        // Snapshot occupied count before attempting placement
        const preOccupied = state.occupiedActions;

        // Try placing on current god first; if no available actions, cycle through other gods
        let actionText = await placeWorker(page);
        if (!actionText) {
          // Current god has no available actions — try focusing each god
          const gc = await getGodCount(page);
          for (let gi = 0; gi < gc; gi++) {
            await focusGod(page, gi);
            await page.waitForTimeout(400);
            actionText = await placeWorker(page);
            if (actionText) break;
          }
        }
        if (actionText) {
          summary.actionsPlaced.push(actionText);
          await page.waitForTimeout(500);

          // Handle any decision modals triggered by the action
          if (await hasModal(page)) {
            const modalResult = await clearAllModals(page, 10);
            if (modalResult === 'game_over') {
              gameOver = true;
              break;
            }
            if (typeof modalResult === 'number') summary.modalsHandled += modalResult;
          }

          // Verify the worker was actually placed (occupied count should increase)
          const postState = await getGameState(page);
          if (postState.occupiedActions > preOccupied || postState.availableActions < state.availableActions) {
            workerPlaced = true;
            log(`Worker confirmed: occupied ${preOccupied} → ${postState.occupiedActions}, available ${state.availableActions} → ${postState.availableActions}`);
          } else {
            // Worker was NOT placed — don't assume success
            workerPlaced = false;
            log(`Worker NOT placed (occupied: ${preOccupied} → ${postState.occupiedActions}, available: ${state.availableActions} → ${postState.availableActions})`);
          }
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
        }
      }

      // Only end turn if we actually placed a worker (or the game is waiting for us to end)
      if (workerPlaced) {
        const postPlaceState = await getGameState(page);
        if (postPlaceState.canEndTurn) {
          const ended = await endTurn(page);
          if (ended) {
            summary.turnsPlayed++;
            log(`Turn ${summary.turnsPlayed} completed`);

            // Wait for post-turn processing and AI
            await page.waitForTimeout(1500);

            // Handle any post-turn modals (round transition, etc.)
            if (await hasModal(page)) {
              const modalResult = await clearAllModals(page, 10);
              if (modalResult === 'game_over') {
                gameOver = true;
                break;
              }
              if (typeof modalResult === 'number') summary.modalsHandled += modalResult;
            }

            // Wait for AI turn(s)
            await page.waitForTimeout(AI_WAIT_MS);

            // Handle any modals from AI actions (round transitions, etc.)
            if (await hasModal(page)) {
              const modalResult = await clearAllModals(page, 10);
              if (modalResult === 'game_over') {
                gameOver = true;
                break;
              }
              if (typeof modalResult === 'number') summary.modalsHandled += modalResult;
            }

            consecutiveFailures = 0;
          }
        }
      } else if (!state.hasModal && state.availableActions === 0) {
        // No actions available — check if we need to end turn or wait
        if (state.canEndTurn) {
          await endTurn(page);
          summary.turnsPlayed++;
          await page.waitForTimeout(AI_WAIT_MS);
          if (await hasModal(page)) {
            const modalResult = await clearAllModals(page, 10);
            if (modalResult === 'game_over') { gameOver = true; break; }
            if (typeof modalResult === 'number') summary.modalsHandled += modalResult;
          }
        } else {
          log('Waiting for game to advance...');
          await page.waitForTimeout(2000);
          consecutiveFailures++;
        }
      } else if (!workerPlaced) {
        // Couldn't place a worker — wait and retry
        log('Worker not placed, waiting...');
        await page.waitForTimeout(1000);
        consecutiveFailures++;
      }

      // Safety: too many failures = stuck
      if (consecutiveFailures >= 5) {
        addIssue('stuck', `Bot stuck after ${consecutiveFailures} consecutive failures at action cycle ${totalActions}`, {
          round: currentRound,
          turnsPlayed: summary.turnsPlayed,
        });
        await shot(page, `stuck-cycle${totalActions}`, 'Bot appears stuck');

        // Recovery: try escape, then screenshot
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        if (await hasModal(page)) {
          await clearAllModals(page, 10);
        }
        consecutiveFailures = 0;

        // If still stuck after recovery, break
        const recoveryState = await getGameState(page);
        if (!recoveryState.canEndTurn && recoveryState.availableActions === 0) {
          addIssue('fatal_stuck', 'Bot could not recover from stuck state');
          break;
        }
      }
    }

    if (totalActions >= MAX_ACTIONS) {
      addIssue('timeout', `Hit max actions limit (${MAX_ACTIONS}) without game completing`);
    }

    summary.gameCompleted = gameOver;
    summary.roundsCompleted = currentRound;

    // ── PHASE 5: Final captures ──
    log('Phase 5: Final captures');
    await shot(page, 'final-state', `Final game state — ${gameOver ? 'COMPLETED' : 'INCOMPLETE'}`);

    // Focus each god for final state
    for (let i = 0; i < godCount; i++) {
      if (await focusGod(page, i)) {
        await shot(page, `final-god-${i}`, `Final state, god ${i} focused`);
      }
    }

    // Player panels
    const playerTabs = page.locator('button').filter({ hasText: /^Player \d/ });
    const tabCount = await playerTabs.count();
    for (let i = 0; i < tabCount; i++) {
      try {
        await playerTabs.nth(i).click({ force: true });
        await page.waitForTimeout(300);
        await shot(page, `final-player-${i + 1}`, `Player ${i + 1} panel`);
      } catch {}
    }

    // Different viewports
    for (const [w, h, label] of [[1024, 768, 'tablet'], [1920, 1080, 'desktop-xl']]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(400);
      await shot(page, `viewport-${label}`, `${w}x${h} viewport`);
    }

  } catch (err) {
    addIssue('fatal', err.message);
    log(`Fatal error: ${err.message}`);
    try { await shot(page, 'error-state', `Error: ${err.message.substring(0, 80)}`); } catch {}
  } finally {
    summary.timing.end = Date.now();
    summary.timing.durationMs = summary.timing.end - summary.timing.start;
    summary.screenshots = screenshots;
    summary.issues = issues;
    summary.consoleErrors = consoleErrors;

    // Output JSON summary to stdout
    console.log(JSON.stringify(summary, null, 2));

    await browser.close();

    // Exit code based on results
    if (issues.some(i => i.category === 'fatal' || i.category === 'fatal_stuck')) {
      process.exit(1);
    }
    if (issues.some(i => i.category === 'unhandled_decision' || i.category === 'page_error')) {
      process.exit(2);
    }
    process.exit(0);
  }
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message, stack: e.stack }));
  process.exit(1);
});
