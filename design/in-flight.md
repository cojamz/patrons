# Current state — Red v0.8.0 release candidate, October 18

- Cory authorized the six new Red actions. Engine lane and UI lane are integrated; root owns the immutable scoped check, desktop/phone verification and deployment.
- Existing Red members are retained for Cory's next redesign. No inherent-resource changes to other colors.
- Public remains v0.7.0 until the full v0.8.0 stamp and UI are verified. Red spec: spheres/red-redesign-2026-10-18.md.
- Test only the affected contracts and a small seeded stale-choice slice; no redundant full-game simulations. New `check:v4 --quick --tests <comma-separated files>` provides an explicit scoped verdict when registry imports make `--related` select everything.
- Planned preview: port 5322. Browser evidence: eval/red-v080/. Next: immutable check, verify picker/movement on desktop and phone, publish checked SHA, verify public.
