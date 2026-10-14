# In flight (resume list if a usage limit kills agents)

Updated 2026-10-14. If agents died, restart each from its brief below, after checking git log for what already landed.

1. Cost change + top tier: members ×2, 6-follower buy costs 8, new 10→10 tier. Tune so pure "big followers" wins ~25% (15–30%) with ~6–7 members/player; also measure pricier tiers 3→1, 5→3, 8→6. Docs: design/eval/follower-buy-variants.md, design/eval/top-tier.md.
2. Table picker (UI agent): register all spheres, pick any 4 in setup or ?table=…, colors for every resource. Then UI fixes from panel 7 (V laptop, W phone, X saboteur). PRIORITY: reload near game end erased a hot-seat game; prompt pill stuck after Undo.
3. Cross-sphere integration: src/test/engine/v4/fuzz-tables.test.js plus targeted interaction tests; fix real bugs; list unclear rules for Cory.
4. Smarter bots: bots.js/thinker.js. Fix hoarding and over-recruiting; Easy/Normal/Hard levels.
5. Rule-bending members (design/rule-benders.md, Cory approved): Squatter, Big Spender, Freelancer (Yellow), Insider, Extra Hand (careful), Front-runner, Straggler, plus Release as a base rule on trial. Purple's old Straggler gets renamed.
6. After 1–2 land: apply critic-default adjustments to the five draft spheres, freeze a build, run a blind panel on MIXED tables (including Magenta, Purple, Echo) with the "felt unfair or unfun" section, fix, then send Cory a link.
