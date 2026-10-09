# Meta notes on the evaluator

- 2026-10-09 (Cory): the forge was far too slow and too granular. Every pass re-ran lints, item pricing and judges on each sphere in isolation, with a 6-agent team, up to 3 passes, and only 2 agents running at a time. That cost hours and gave no verdicts. Lessons:
  - Evaluate coarse to fine. A holistic screen first (is it distinct, fun and clear; keep, fix or kill), then playtests at mixed tables (the real test), and pricing and lints only on the finalists.
  - Judge spheres side by side, not alone. Comparison shows overlap and parity faster.
  - Fan out with background agents (no concurrency cap) rather than one capped workflow, when the agent count is small.
  - The per-sphere pass bar (mean of 3.8 or better) was too strict for early concepts. Every one of 12 spheres got a "revise". The bar belongs at the polish stage.
