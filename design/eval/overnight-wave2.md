# Wave 2: merged findings (2026-10-15, ~07:20 UTC)

Two blind screen-only testers on the frozen w2 build (8f93858), brief v3. Tester A was a newcomer: one full game on Classic, then round I on a random table. Tester B was a strategist: one full game against Hard bots on a random table. Each graded it C+. A logged 53 findings, B logged 54, one of them a blocker. Full reports are in wave2/tester-a/report.md and wave2/tester-b/report.md.

What both praised: the turn status and the open spaces were unmistakable; picking on the board, with flights that read; the space and rim hovers ("You'd get", "Why", the standings); the seat hovers listing each member with its state; a round end you could narrate; results that tell the story.

## Ranked themes, each routed to an owner
1. **Hidden harm and silent automation.** A Raider raid was missing from the since-strip (blocker). Big Spender fired by itself. An auto-pass hid what Open Door gave. Safecracker's use was wasted and shown nowhere. Fixed: the strip is now built from the effect stream. In progress: members UX (cues, idle uses) and motion (a beat before scoring).
2. **Panels drop the condition that decides the gain.** Gain each color (per full set), Lie Low (protection), the per-round-number spaces (Your Call, Cheap Seats, Help Yourself, Toast), Harvest (other colors), Goody Bags (everyone gets 1), Poach (it's from a rival). Detail designer: a decipher pass over every sphere.
3. **Choices still on text sheets.** Snap Up's payment, Talent Scout, Your Call, Release. Dialogs pod.
4. **Steal limits and reasons.** Redistribute's count was wrong, Crime Wave's limit was unstated, and error reasons were wrong. Fixed by the engine agent.
5. **Hovers far from their target.** Rival seat cards, own seat members, names in the strip, the rail. Members UX and detail designer.
6. **Crowded seats in round III.** 16px member sprites overlap the income line, rival leaders read as padlocks, and you can't read a rival's plan. Art director and members UX (marks on rivals' ready members, "safe this round").
7. **Results.** Columns didn't add up and abilities missed mid-game triggers. Fixed by the engine's follower ledger and the new Yourself and "During play" columns.
8. **Pay predictability.** Instant buy vs the pay sheet; a refilled card sliding under the pointer; the default payment throwing away a rim lead; Extra Hand dead in round III. Dialogs pod and engine agent.
9. **Duplicates.** Header and step tab, payment shown three times, results totals shown twice, the turn told three ways. Detail designer and dialogs pod.
10. **Overlaps.** The header subline under the menu, toasts running off screen (fixed), steal pills covering the follower counts. Art director and detail designer.

Neither tester could judge latency: the box sat at load 19–37. Speed comes from the quiet-machine run of 79dee80.
