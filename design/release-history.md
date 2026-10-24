# Release history: evidence and milestones

Audited 2026-10-17 against the source branch `claude/gifted-newton-3lcy3i` and freshly fetched `origin/main`. Dates below use America/New_York (EDT in October). Links point to immutable commits; source checkpoints and published builds are listed separately.

## Version evidence

- **v0.2** is recorded in [`src/v4/version.js` at 20573121](https://github.com/cojamz/patrons/blob/205731217a93ffb499fcc3804fe140653df4a336/src/v4/version.js), added October 14. The preceding rename commit mentions v0.2 but does not yet contain that file.
- **v0.5** replaces v0.2 in [b180cd6c](https://github.com/cojamz/patrons/commit/b180cd6cdab2cf0f4dd507537085b82e783e49de), October 15. It remains the version recorded in the last verified published source, [6c1e97eb](https://github.com/cojamz/patrons/blob/6c1e97eb4bef2d4050f6dba1a70c94886f0ddd36/src/v4/version.js).
- **v0.6.0** is the current release candidate; it is not established as published by this audit.
- No local or remote Git tags were present at audit time. No v0.3 or v0.4 release is inferred. “v3” and “v4” in older development documents identify game generations, not evidence of semantic release versions.

## October source milestones

These describe committed changes. Publication is established only by the deployment records in the next section.

| Date (EDT) | Source checkpoint | Milestone |
| --- | --- | --- |
| Oct 9 | [1db190a4](https://github.com/cojamz/patrons/commit/1db190a494ba15c252d5b45cb2df8d9ba621aa68), [6e8adb90](https://github.com/cojamz/patrons/commit/6e8adb90a4d7fef2589bf46accbde43835a116c2) | Working-style document, design log, and v4 rework plan. |
| Oct 13 | [b5693042](https://github.com/cojamz/patrons/commit/b569304249d1c5694f4375cc81c845b37ed503c3), [f354fdd2](https://github.com/cojamz/patrons/commit/f354fdd28f10cd10abcc8f2b7f9a0d1f45ddcfcb), [e0b8598f](https://github.com/cojamz/patrons/commit/e0b8598fe1b678dcd00080c21c4110444fd44931) | Deterministic task-queue engine; local hotseat and host-authoritative online sessions; v4 UI becomes the default entry. These commits are dated Oct 14 in UTC. |
| Oct 14 | [20573121](https://github.com/cojamz/patrons/commit/205731217a93ffb499fcc3804fe140653df4a336) | Central game name/version source records Cults v0.2. |
| Oct 15 | [bc019a2b](https://github.com/cojamz/patrons/commit/bc019a2b77fdc9bf9bfc90adfbf6e4a5ec5749ae), [b180cd6c](https://github.com/cojamz/patrons/commit/b180cd6cdab2cf0f4dd507537085b82e783e49de) | Initial play-line performance, card wording and price passes; then v0.5 rules, readable seats/scoring, and portable verification. |
| Oct 16 | [ffc44bca](https://github.com/cojamz/patrons/commit/ffc44bca00f94bc71b63ee4a00d2a82a94cd49a0), [c8dd8a99](https://github.com/cojamz/patrons/commit/c8dd8a997c527f4e19ed2529b214f463aa5b1b50), [bd2bb87f](https://github.com/cojamz/patrons/commit/bd2bb87f9dfce28d99f0dbde130870a567eafb1f) | Speed-change stalls, member-origin gains and landing sound; compact eight-member market, Echo/recruit-bonus fixes, sequencing and wheel outlines; brighter shops and clearer targets. |
| Oct 16 | [3d97c4d2](https://github.com/cojamz/patrons/commit/3d97c4d2e6c55feb88a9d6777f1b50d56f7f7d3d), [eecddbae](https://github.com/cojamz/patrons/commit/eecddbae08ebd4e747eaec053d7c630f2846e683) | Compact deck browsing and compositor rendering verification; explicit round-scaling formulas. |
| Oct 17 | [8097779a](https://github.com/cojamz/patrons/commit/8097779aa818201fc007d44d7f8b5f324b0c7f44), [981705b9](https://github.com/cojamz/patrons/commit/981705b9dec29e2afe013075ee98e768b1ed4f34), [6c1e97eb](https://github.com/cojamz/patrons/commit/6c1e97eb4bef2d4050f6dba1a70c94886f0ddd36) | Clarified resource draft, member counts and half-prize ties; scoring verification/reconstruction; wheel-wide filter replaced. Last source represented by the fetched public build marker. |
| Oct 17, after that build | [ae2fc11a](https://github.com/cojamz/patrons/commit/ae2fc11a2ff4616e9954b3dbe9a0f05a0d054ffd), [526abdda](https://github.com/cojamz/patrons/commit/526abdda1c0a3cd5f82be4158fdc1ccd94a2190e), [ea406700](https://github.com/cojamz/patrons/commit/ea406700b26493b789ae9696b1fafdb39e83652e), [f27be278](https://github.com/cojamz/patrons/commit/f27be2789a401865a6f0be8d6bf8de96c2a9f925) | Source-only checkpoints: swap-loop/geometry caching, obsolete-preview cancellation, actual animation completion, own-color contests and feedback fixes. These commits do not establish a deployed release or a completed release gate. |

## Recorded GitHub Pages builds

The `main` branch carries the built `play/` game. A deployment commit records an update of those published files; it is distinct from its source commit. This audit checks repository deployment evidence, not a historical uptime record.

| Deployment commit time (EDT) | Deployment record | Recorded source build / change |
| --- | --- | --- |
| Oct 15, 17:14:46 | [62f9c0cc](https://github.com/cojamz/patrons/commit/62f9c0cc36776563eab3726ed1b10ef026ede272) | First built v4 game at `/patrons/play/`; commit body explicitly preserves the old v3 root. No `play/build.json` source marker exists in this commit. |
| Oct 15, 20:48:20 | [63d20d78](https://github.com/cojamz/patrons/commit/63d20d786291a8279bccae0389bed0609eb308d7) | `bc019a2`, following several same-evening play-build refreshes. |
| Oct 16, 11:47:59 | [a4b46277](https://github.com/cojamz/patrons/commit/a4b46277ce34660e3bae362da77ec14ff71806ed) | Blank root play link fixed by forwarding to the built game. |
| Oct 16, 12:00:53 | [177d964b](https://github.com/cojamz/patrons/commit/177d964ba40f288bcdc6a8d8eddc1443cf789be4) | `ffc44bc`. |
| Oct 16, 12:14:55 | [53200b73](https://github.com/cojamz/patrons/commit/53200b730921baa723c5db388f1f89be7361cdfb) | `c8dd8a9`. |
| Oct 16, 12:26:02 | [9e119350](https://github.com/cojamz/patrons/commit/9e119350ca761cc35e9d37116027a022e9611b73) | `bd2bb87`. |
| Oct 16, 20:51:51 | [be2c240f](https://github.com/cojamz/patrons/commit/be2c240fade73c88c093b4c22b0141b03852748a) | `eecddba`. |
| Oct 17, 10:06:37 | [f71fd9a7](https://github.com/cojamz/patrons/commit/f71fd9a7d61ccb079e52c7e8cf53b49cb8f1c709) | `6c1e97e`; fetched `origin/main:play/build.json` records full source SHA `6c1e97eb4bef2d4050f6dba1a70c94886f0ddd36`. |

## Earlier game history

The March 2026 entries retained in `CHANGELOG.md` belong to the earlier game line. Useful source anchors are [121b75e5](https://github.com/cojamz/patrons/commit/121b75e563a22152d5b9d31717f13476e84fc04f) (March 1 engine/v3 data foundation), [c01b99a3](https://github.com/cojamz/patrons/commit/c01b99a340bb3cda94bd3503768c49e6406d41fe) (March 1 React UI/playtesting), and [86ea3d1d](https://github.com/cojamz/patrons/commit/86ea3d1d6c6314911fb16d673cd78d54902b67dd) (May 2 multiplayer verification). The legacy changelog's Netlify references are preserved historical records, not newly verified deployments.

## Rechecking the evidence

- Source/version history: `git log --format="%H %cI %s" -- src/v4/version.js` and `git show <source>:src/v4/version.js`.
- Published build history: fetch `origin/main`; inspect `git log origin/main -- play/build.json play/index.html` and `git show origin/main:play/build.json`.
- Tag evidence: `git tag` and `git ls-remote --tags origin`.
- This is a curated milestone index. The complete repository history remains the authoritative record for omitted checkpoints.
