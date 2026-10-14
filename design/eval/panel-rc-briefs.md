# Release-candidate panel briefs (v0.2)

Fire these the moment the release candidate is frozen and its full gate is green. Every tester is a fresh agent, blind: it gets only `{URL}` (the frozen build, served from `.v4-panel/<n>`) and the rulebook text pasted from `design/rulebook.md` at that commit (`{RULEBOOK}`). Never the repo. Screenshots go in `/tmp/patrons-shots/<role>/`. Playwright: executablePath `/opt/pw-browsers/chromium`, never `playwright install`; if `playwright` won't resolve from /tmp, load it with createRequire from `/home/user/patrons/node_modules` (library only).

Shared rules for all four (paste into each prompt):
- Time box: about 30 minutes of play, then write up. Stop at a natural point; one full game plus part of a second is enough.
- Keep a move log in a file: each move and a short note on why you took it. (Never ask testers to "write your reasoning": that wording tripped the API's safeguards.)
- Report "felt unfair or unfun" moments, on either side, and whether you could have seen them coming.
- End with "table talk": five lines real players would say after the game.
- Separate "the screen confused me" from "the game itself is weak".

## 1. Laptop newcomer (subagent: playtester)
You've never played this game. Open {URL}/?intro=1 at 1270×700, watch or skip the intro, start a local game against 3 Normal bots on the Classic table, and play to win. Grade A–F: first five minutes, knowing what to do each turn, knowing why your numbers changed, round end, fun. Top 8 issues worst first, each with a screenshot path and the smallest fix.

## 2. Phone by touch (subagent: playtester)
You're on an iPhone 13 (Playwright devices['iPhone 13'], hasTouch, tap only, no hover, long-press for details). Open {URL}/?intro=0, start a local game against 3 bots, and play a full game by touch. Check: every target tappable without zooming, nothing clipped or overlapping, long-press gives the details a hover would, no sideways scroll, the wheel usable with a thumb. Top 8 issues with screenshots.

## 3. Saboteur (subagent: playtester)
Break it. Open {URL}/?intro=0 at 1270×700. Spam clicks, double-tap buys, press Undo mid-animation, reload mid-turn and mid-Reckoning, use only the keyboard for a round, resize the window mid-game, press Back, open two tabs of the same game, click illegal spaces and unaffordable cards. Report every crash, stuck state, wrong number, lost turn or silent failure with exact steps to reproduce and a screenshot. Grade robustness A–F.

## 4. Game skeptic (subagent: game-skeptic), last
Runs after 1–3 are triaged and fixed. Brief: the agent file's own; give {URL} and {RULEBOOK}; SHIP needs A- or better. Time box 40 minutes.

## After the panel
- Verify every single-tester claim on the frozen build before fixing; two or more testers on the same thing = confirmed.
- Save each report to `design/eval/panel-rc-<role>.md`; the triage list goes to the agents by owner area.
