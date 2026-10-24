# Red v0.8.0 verification

Checked source: c643d186702476108cb3a0e5b56eb39a88734647. Published main: 99a7ee83979cd9d654f8bead7f26c975124ad0ab. Public v0.8.0 full stamp and HTML verified by v4-play.sh.

- App/engine source frozen in f891939d. Subsequent two commits change browser fixtures only.
- Immutable 189b064a: 216 focused tests pass, one historical replay skipped because current content differs; deterministic equivalent plus seeded stale-choice slice pass. Production build pass.
- Immutable c643d186: 23 focused Red/picker tests pass, production build pass, all six browser cases pass. Desktop 1270×700 and iPhone 13: rival/rival Even Swap; own/shop Promote; Green Encore copying rival Promote and choosing fresh targets. Exact final owners, resources, cards and shop compared with engine; buying restored after animations; no page errors. Root inspected desktop picker and phone settled screenshots.
- Earlier browser attempts failed because fixture used retired Intern, then because reused browser contexts auto-resumed the previous game. Fixed fixture and isolated each scenario. No app change or weakened assertions for either failure.
- Boundary coverage: promotion +2 and cheaper, demotion -2 or cheaper, total printed cost, any owner, same-container exchange, no phantom refills, card conservation, actor-only Recruit/Now/passives, guard protections, stale choices, unused Extra Hand return/reacquisition, Doppelganger acquisition and fresh Green swap choices. Stolen Stunt Double can replay the still-resolving Heist.
- No full-suite, long full-game, independent-device RTDB, performance or balance verdict claimed for this batch. Existing Red members retained intentionally. Member discussion: ../../spheres/red-members-2026-10-18.md.

Harness improvement: `check:v4 --quick --tests <comma-separated files>` states explicit scoped coverage; keeps registry imports from turning related-test selection into an entire suite. Defaults unchanged. App-check gate completed in 36 seconds after fixture fixes.

## Public confirmation

All six scenarios passed against https://cojamz.github.io/patrons/play/ after deployment, using isolated browser contexts. Root inspected public desktop copy-Promote and phone Promote picker screenshots. Public log and representative screenshots retained here. Minor polish follow-ups: turn toast overlaps part of phone picker; incoming shop member omitted from turn toast. Both logged in todo; targets and final ownership remain correct.

Public build.json: version v0.8.0, commit c643d186702476108cb3a0e5b56eb39a88734647, builtAt 2026-10-19T01:05:09.016Z (Oct18 Eastern). Subsequent source commits may update docs/browser evidence without changing public runtime.
