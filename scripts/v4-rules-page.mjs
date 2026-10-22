// The rules as a page of their own (https://cojamz.github.io/patrons/rules/): the same rulebook and glossary the
// game's "How to play" shows (design/rulebook.md, src/v4/glossary.js, drawn by HowToPlay's renderRules), rendered
// once to static HTML. v4-play.sh runs it on every ship, so the page always matches the build that's live.
// Usage: node scripts/v4-rules-page.mjs <out-dir> [source-root]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement as h, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const out = resolve(process.argv[2] || '.v4-rules');
const root = resolve(process.argv[3] || '.');
const vite = await createServer({ root, configFile: false, logLevel: 'error', server: { middlewareMode: true, watch: null },
  appType: 'custom', esbuild: { jsx: 'automatic' } });
try {
  const { renderRules } = await vite.ssrLoadModule('/src/v4/HowToPlay.jsx');
  const { RULEBOOK } = await vite.ssrLoadModule('/src/v4/rulebook.js');
  const { GLOSSARY } = await vite.ssrLoadModule('/src/v4/glossary.js');
  const { GAME_NAME, VERSION } = await vite.ssrLoadModule('/src/v4/version.js');
  const body = renderToStaticMarkup(h(Fragment, null,
    ...renderRules(RULEBOOK),
    h('h3', { id: 'glossary' }, 'Glossary'),
    h('dl', { className: 'glossary' }, ...GLOSSARY.filter(t => !t.legacy).flatMap(t => [h('dt', { key: `${t.key}t` }, t.word), h('dd', { key: `${t.key}d` }, t.def)]))));
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${GAME_NAME} rules</title>
<meta name="description" content="How to play ${GAME_NAME}, ${VERSION}.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&family=Alegreya+Sans:wght@400;500;700&display=swap">
<style>
:root{--paper:#f4ebd7;--paper-2:#eadfc4;--edge:#c2ae86;--ink:#2a1f17;--ink-2:#5f4e3d;--ink-3:#8a7760;--accent:#8a5a12;--table:#1d1611;
  --gold:#d49b27;--red:#c4533f;--blue:#4a80b8;--green:#3f9467;--any-top:var(--gold);--any-right:var(--blue);--any-bottom:var(--green);--any-left:var(--red)}
*{box-sizing:border-box}
html{background:var(--table)}
body{margin:0;background:var(--table);color:var(--ink);font:17px/1.55 'Alegreya Sans',system-ui,sans-serif}
main{max-width:720px;margin:24px auto;padding:28px 40px 32px;background:var(--paper);border:1px solid var(--edge);border-radius:6px}
h2{font:500 34px/1.15 Alegreya,Georgia,serif;margin:0 0 10px}
h3{font:500 23px/1.2 Alegreya,Georgia,serif;margin:26px 0 6px;color:var(--accent);border-top:1px solid var(--paper-2);padding-top:14px}
p{margin:6px 0}
ul,ol{margin:4px 0;padding-left:24px}
li{margin:3px 0}
b{color:var(--ink);font-weight:700}
.rules-mark{white-space:nowrap}
.rules-mark svg{vertical-align:-2px;margin-right:2px}
.glossary{margin:6px 0 0}
.glossary dt{font-weight:700;margin-top:10px}
.glossary dd{margin:2px 0 0 0;color:var(--ink-2)}
.top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:15px;color:var(--ink-3);margin-bottom:14px}
.top a,.foot a{color:var(--accent)}
.foot{margin-top:28px;font-size:14px;color:var(--ink-3);text-align:right}
@media (max-width:760px){main{margin:0;border:0;border-radius:0;padding:20px 16px}h2{font-size:28px}}
</style>
</head>
<body>
<main>
<div class="top"><span>${GAME_NAME} ${VERSION}</span><a href="../play/">Play ${GAME_NAME}</a></div>
${body}
<p class="foot">Same rules as "How to play" in the game's menu.</p>
</main>
</body>
</html>
`;
  mkdirSync(out, { recursive: true });
  writeFileSync(`${out}/index.html`, html);
  console.log(`Rules page: ${out}/index.html (${VERSION})`);
} finally {
  await vite.close();
}
