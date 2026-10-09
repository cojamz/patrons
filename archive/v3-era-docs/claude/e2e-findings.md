# E2E Scenario Findings

Generated: 2026-03-02T01:24:35.120Z

## Summary
- Scenarios passed: 2
- Scenarios failed: 2
- Total findings: 9
- Screenshots taken: 8

## Errors (1)
- **[Console Error Audit]** Scenario crashed: locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('button:has-text("Confirm")').first()[22m
[2m    - locator resolved to <button disabled tabindex="0" class="px-8 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200">Confirm Selection</button>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m  - element was detached from the DOM, retrying[22m


## Warnings (2)
- **[full-game-flow]** No clickable action spaces found at turn 0 [📸](/Users/cory/Cursor Projects/Patrons/.claude/screenshots/e2e/004-full-game-flow-no-actions.png)
- **[ui-element-audit]** Round indicator: NOT found in page text [📸](/Users/cory/Cursor Projects/Patrons/.claude/screenshots/e2e/006-ui-element-audit-initial.png)

## Info (6)
- **[full-game-flow]** Game board loaded successfully
- **[full-game-flow]** Played 0 turns
- **[ui-element-audit]** Game title/header: present
- **[ui-element-audit]** Player info: present
- **[ui-element-audit]** Resources: present
- **[decision-types]** Saw 0 decision types: 
