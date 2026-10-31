# v0.8.3 shop sizing

Checked immutable source: `cf9e23c8caac423d34a463e137551bc63749d774`; public main `a189343`.

- Six focused existing UI checks and production build pass.
- `e2e/v4/shop-sizing.mjs`: eight viewport/color cases pass. 1270×700: cards 108.7×142.5, formerly about84×116; 1600×900:128.7×192.5. Tablet/phone132×166 in both modes.
- Both normal eight-color table groups use their eight longest rule texts. Exact card slots preserved through compact→details→compact, deck remains, prices and entire abilities fit. No normal desktop internal scroll or document width overflow.
- Independent read-only visual reviewer inspected four final production screenshots; no blocker. Root inspected detailed laptop and phone. Public source stamp/HTML verified by publisher; public desktop/phone visual inspection recorded separately.
- Existing member-click unit test selected the first `.lt-card`, now a follower offer; updated to `.lt-card[data-uid]` without removing its interaction assertions.
- Tiny desktop windows below680px height intentionally retain scrolling to avoid clipping. Tablet/phone retain their existing horizontal swipe; no claim that phones show every shop card simultaneously. No engine/rule or general animation changes.
