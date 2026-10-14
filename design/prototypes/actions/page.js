// Builds a mock page from an option's renderer (window.OPT): ?view=wheel (the 1270×700 laptop frame) or
// ?view=quadrant (the Gold quadrant at 2×, a hover card, and the same language on other verbs).
(function () {
  const { Q, SEATS, STATE, RING, RIM, qCenter, polar, arc, spaces, res, emoji, INK } = AK;
  const S = 209 / 200;                 // px per wheel unit on the laptop frame (the build's wheel: r = 209px)
  const VB = 226;                      // half the stage, in units (the build's viewBox is 452 wide)
  const HALF = VB * S;                 // stage half-size in px
  const CX = 634, CY = 312.5;          // the wheel's centre on the frame (measured on the build screenshot)
  const view = new URLSearchParams(location.search).get('view') || 'wheel';
  const mix = AK.mix;

  // ---------- the wheel ----------
  function textArcD(center, half, r) {
    const top = Math.abs(((center % 360) + 540) % 360 - 180) < 90;
    const [ax, ay] = polar(top ? center - half : center + half, r);
    const [bx, by] = polar(top ? center + half : center - half, r);
    return `M${ax * S},${ay * S} A${r * S},${r * S} 0 0 ${top ? 1 : 0} ${bx * S},${by * S}`;
  }
  /** The wheel as HTML: paper (svg, px), spaces, minions, hub, rim leaders. Positions are px from the wheel centre. */
  function wheelHTML(O) {
    const ring = O.ring || RING;
    const rimR = O.rim || RIM;
    const round = STATE.round;
    let paper = `<defs><radialGradient id="ltPaper" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#f4ebd7"/><stop offset=".8" stop-color="#eadfc4"/><stop offset="1" stop-color="#d9caa8"/></radialGradient>${O.defs || ''}</defs>`;
    paper += `<circle cx="0" cy="0" r="${200 * S}" fill="url(#ltPaper)"/>`;
    Q.forEach((q, qi) => {
      const c = qCenter(qi), a0 = c - 45, a1 = c + 45;
      [1, 2, 3].forEach(t => {
        const R = ring[t], open = t <= round;
        paper += `<path class="band r${t}${open ? ' open' : ''}" d="${arc(a0, a1, R.r0 * S, R.r1 * S)}" fill="${INK[q.res]}" fill-opacity="${O.bandOpacity ? O.bandOpacity(t, open) : (open ? 0.26 : 0.06)}"/>`;
      });
      paper += `<path d="${arc(a0, a1, rimR.r0 * S, rimR.r1 * S)}" fill="${INK[q.res]}" fill-opacity=".9"/>`;
    });
    for (const r of [rimR.r0, ring[1].r0, ring[2].r0, ring[3].r0]) paper += `<circle cx="0" cy="0" r="${r * S}" fill="none" stroke="rgba(42,31,23,.32)" stroke-width="1"/>`;
    Q.forEach((q, qi) => {
      const [x0, y0] = polar(qCenter(qi) - 45, ring[3].r0), [x1, y1] = polar(qCenter(qi) - 45, 200);
      paper += `<line x1="${x0 * S}" y1="${y0 * S}" x2="${x1 * S}" y2="${y1 * S}" stroke="rgba(42,31,23,.42)" stroke-width="1.3"/>`;
    });
    if (O.paperExtra) paper += O.paperExtra(S);
    paper += `<circle cx="0" cy="0" r="${199.5 * S}" fill="none" stroke="#7a6244" stroke-width="1.5"/>`;
    paper += `<circle cx="0" cy="0" r="${(O.hubR || ring[3].r0) * S}" fill="#2a1f17" stroke="rgba(243,230,200,.18)"/>`;
    // the rim rules: text on the arc, measured and centred with the leaders' emojis after it (filled in by layoutRim)
    Q.forEach((q, qi) => {
      const lead = STATE.leaders[q.id];
      const text = `${q.rule.toUpperCase()}  ·  +2${lead.length ? '  ·' : ''}`;
      const c = qCenter(qi);
      paper += `<path id="rimarc-${qi}" d="${textArcD(c, 44, (rimR.r0 + rimR.r1) / 2)}" fill="none"/>`;
      paper += `<text class="rim-rule" data-q="${qi}" font-size="${11 * S}" dominant-baseline="central"><textPath href="#rimarc-${qi}" startOffset="0">${text}</textPath></text>`;
    });
    let html = `<svg class="paper" viewBox="${-HALF} ${-HALF} ${2 * HALF} ${2 * HALF}" width="${2 * HALF}" height="${2 * HALF}">${paper}</svg>`;
    // spaces
    for (const sp of spaces(O.ringR || null, O.spans || null)) {
      const { a } = sp;
      const [x, y] = [sp.xy[0] * S, sp.xy[1] * S];
      const open = sp.ring <= round;
      const owner = STATE.taken[a.id];
      const can = open && owner === undefined;
      const cls = ['sp', `r${sp.ring}`, `q-${a.qid}`, open ? 'open' : 'locked', owner !== undefined ? 'taken' : '', can ? 'can' : '', STATE.newest === a.id ? 'fresh' : ''].filter(Boolean).join(' ');
      html += `<div class="${cls}" data-id="${a.id}" style="left:${HALF + x}px;top:${HALF + y}px;--c:${INK[a.res]};--ang:${sp.ang}deg">${O.space(sp, { open, owner, can })}${owner !== undefined ? `<span class="minion">${emoji(SEATS[owner].emoji, O.minionPx || 24)}</span>` : ''}${STATE.newest === a.id ? '<span class="fresh-ring"></span>' : ''}</div>`;
    }
    html += `<div class="hub"><small>Round</small><b>I</b><span class="pips"><i class="on"></i><i></i><i></i></span></div>`;
    return `<div class="wheel" style="width:${2 * HALF}px;height:${2 * HALF}px">${html}<div class="rim-emojis"></div></div>`;
  }
  /** After the wheel is in the DOM: centre each rim rule with its leaders' emojis on the same arc. */
  function layoutRim(root, O) {
    const svg = root.querySelector('svg.paper');
    const host = root.querySelector('.rim-emojis');
    const E = O.rimEmojiPx || 16, GAP = 5;
    Q.forEach((q, qi) => {
      const lead = STATE.leaders[q.id];
      const t = svg.querySelector(`text[data-q="${qi}"]`);
      const tp = t.querySelector('textPath');
      const path = svg.querySelector(`#rimarc-${qi}`);
      const L = path.getTotalLength();
      const len = t.getComputedTextLength();
      const total = len + (lead.length ? GAP + lead.length * E + (lead.length - 1) * 2 : 0);
      const start = (L - total) / 2;
      tp.setAttribute('startOffset', start.toFixed(1));
      lead.forEach((id, k) => {
        const s = start + len + GAP + k * (E + 2) + E / 2;
        const p = path.getPointAtLength(s);
        const el = document.createElement('span');
        el.className = 'rim-emoji';
        el.style.left = `${HALF + p.x}px`; el.style.top = `${HALF + p.y}px`;
        el.innerHTML = emoji(SEATS[id].emoji, E);
        el.title = `${SEATS[id].name} leads`;
        host.appendChild(el);
      });
    });
  }

  const BASE_CSS = `
  .wheel{position:relative;filter:drop-shadow(0 18px 22px rgba(0,0,0,.55)) drop-shadow(0 2px 2px rgba(0,0,0,.5))}
  .wheel svg.paper{position:absolute;inset:0;overflow:visible}
  .wheel .rim-rule{fill:rgba(255,249,236,.96);font-family:'Alegreya Sans',sans-serif;font-weight:700;letter-spacing:.14em;paint-order:stroke;stroke:rgba(42,31,23,.18);stroke-width:.6}
  .wheel .rim-emoji{position:absolute;transform:translate(-50%,-50%);line-height:0;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45));z-index:6}
  .wheel .rim-emoji svg{display:block}
  .wheel .hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;color:#f3e6c8;font-family:'Alegreya',serif;line-height:1;z-index:1}
  .wheel .hub small{font-family:'Alegreya Sans',sans-serif;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#bfa984}
  .wheel .hub b{font-size:23px;font-weight:700;margin-top:1px}
  .wheel .hub .pips{display:flex;gap:4px;margin-top:3px}
  .wheel .hub .pips i{width:6px;height:6px;border-radius:50%;border:1px solid #8f7f66}
  .wheel .hub .pips i.on{background:#ffd99a;border-color:#ffd99a}
  .wheel .sp{position:absolute;transform:translate(-50%,-50%);z-index:2}
  .wheel .sp .minion{position:absolute;line-height:0;z-index:5;pointer-events:none}
  .wheel .sp .minion svg{display:block}
  .px{display:block}
  `;

  // ---------- the laptop frame: the real build, with the old wheel cut out and the corners set to this moment ----------
  const ROWS = [
    { seat: 1, x: 27, y: 114.5, g: 13, f: 12, gap: 7 },
    { seat: 2, x: 950, y: 114.5, g: 13, f: 12, gap: 7 },
    { seat: 3, x: 950, y: 532.5, g: 13, f: 12, gap: 7 },
    { seat: 0, x: 27.8, y: 524.8, g: 18.4, f: 16.1, gap: 8, mine: true },
  ];
  function frame(O) {
    document.body.classList.add('frame');
    const cv = document.createElement('canvas');
    cv.width = 1270; cv.height = 700; cv.className = 'shot';
    document.body.appendChild(cv);
    const img = new Image();
    img.src = 'base-laptop.png';
    const ready = new Promise(res => { img.onload = res; });
    ready.then(() => {
      const g = cv.getContext('2d');
      g.drawImage(img, 0, 0);
      // the old wheel and its shadow: a feathered hole (the page's own walnut shows through: same CSS as the build)
      g.save();
      g.globalCompositeOperation = 'destination-out';
      g.translate(CX, 330); g.scale(1, 255 / 250);
      const rg = g.createRadialGradient(0, 0, 222, 0, 0, 250);
      rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 250, 0, Math.PI * 2); g.fill();
      g.restore();
      // one floating minion fewer for each rival who has placed; their resource rows are redrawn below
      for (const [x, y, w, h] of [[75, 39, 22, 22], [996, 37, 23, 24], [996, 455, 23, 24], [20, 108, 190, 26], [944, 108, 190, 26], [944, 526, 190, 26]]) g.clearRect(x, y, w, h);
      g.clearRect(24, 518, 220, 30);
      g.fillStyle = 'rgba(255,206,140,.08)'; g.fillRect(24, 518, 220, 30); // your chair keeps its lamp tint
    });
    // resource rows for this moment
    let rows = '';
    for (const r of ROWS) {
      const p = SEATS[r.seat].res;
      rows += `<div class="resrow" style="left:${r.x}px;top:${r.y}px;gap:${r.gap}px;font-size:${r.f}px">` + ['gold', 'red', 'blue', 'green'].map(k =>
        `<span class="st${p[k] ? '' : ' zero'}">${res(k, r.g)}<b>${p[k]}</b></span>`).join('') + '</div>';
    }
    const tag = `<div class="mock-tag"><b>${O.n}</b><span>${O.title}</span><small>${O.tag}</small></div>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = rows + tag + `<div class="wheel-at" style="left:${CX - HALF}px;top:${CY - HALF}px">${wheelHTML(O)}</div>`;
    document.body.appendChild(wrap);
    return ready;
  }
  const FRAME_CSS = `
  html,body{margin:0}
  body{width:1270px;height:700px;overflow:hidden;position:relative;font-family:'Alegreya Sans',sans-serif;
    background:
      radial-gradient(ellipse 70% 80% at 28% 52%, rgba(255,206,140,.13), rgba(255,206,140,.03) 55%, transparent 75%),
      repeating-linear-gradient(92deg, rgba(0,0,0,0) 0 9px, rgba(0,0,0,.07) 9px 10px, rgba(255,255,255,.012) 10px 23px, rgba(0,0,0,.05) 23px 24px),
      repeating-linear-gradient(88deg, rgba(255,220,180,.018) 0 41px, rgba(0,0,0,.06) 41px 43px),
      linear-gradient(180deg,#221a14,#1a140f);
    background-attachment:fixed;background-color:#1d1611}
  canvas.shot{position:absolute;left:0;top:0}
  .resrow{position:absolute;display:flex;align-items:center;color:#f3e6c8;font-weight:700;line-height:1}
  .resrow .st{display:inline-flex;align-items:center;gap:2px}
  .resrow .st.zero{opacity:.35}
  .resrow svg{display:block}
  .wheel-at{position:absolute}
  .mock-tag{position:absolute;left:22px;top:178px;width:300px;display:grid;grid-template-columns:auto 1fr;column-gap:10px;row-gap:2px;align-items:baseline;color:#b09f82}
  .mock-tag b{grid-row:span 2;font-family:'Alegreya',serif;font-size:40px;line-height:.9;color:#ffd99a}
  .mock-tag span{font-family:'Alegreya',serif;font-size:17px;color:#f3e6c8}
  .mock-tag small{font-size:12px;line-height:1.3}
  `;

  // ---------- the close-up: the Gold quadrant at 2×, a hover card, and the same language on other verbs ----------
  function quadrant(O) {
    document.body.classList.add('closeup');
    const hover = AK.action(O.hoverId || 'gold.jv');
    const vocab = [
      ['green.hum', 'plain gain'], ['gold.steal', 'steal'], ['green.echo', 'copy'],
      ['blue.clearance', 'discount'], ['red.hire', 'free recruit'], ['gold.windfall', 'per member'],
    ];
    const vocabHTML = vocab.map(([id, label]) => {
      const a = AK.action(id);
      return `<figure class="voc"><div class="voc-cell q-${a.qid}" style="--c:${INK[a.res]}">${O.vocab(a)}</div><figcaption><b>${label}</b><span>${a.name}${a.proposal ? '<i>*</i>' : ''}</span></figcaption></figure>`;
    }).join('');
    document.body.innerHTML = `
      <header><b>${O.n}</b><div><h1>${O.title}</h1><p>${O.blurb}</p></div></header>
      <section class="zoom"><div class="clip"><div class="zoomer" style="left:${350 - 2 * HALF}px;top:${(O.zoomTop ?? 26) - 2 * HALF}px"><div style="zoom:2">${wheelHTML(O)}</div></div></div><p class="cap">Gold quadrant at 2×, round I. P3’s frog is on Golden Years; the ring II and III spaces are not open yet.</p></section>
      <aside>
        <h2>Hover</h2>
        <div class="peek"><div class="pk-head"><b>${hover.name}</b>${hover.proposal ? `<em>proposed name · was ${hover.was}</em>` : ''}</div><p>${hover.text}</p><div class="pk-get"><small>YOU’D GET</small><span>${O.hoverGet || `+3 ${res('gold', 14)} now, then 1 ${res('gold', 14)} to a rival you pick`}</span></div></div>
        <h2>The same language on other verbs <small>(2×)</small></h2>
        <div class="vocab">${vocabHTML}</div>
        <p class="note">* Gold and Red names are proposals from design/eval/action-names-calibration.md (not yet graded). Blue and Green keep today’s names.</p>
      </aside>`;
    return Promise.resolve();
  }
  const CLOSEUP_CSS = `
  html,body{margin:0}
  body.closeup{width:1270px;min-height:820px;background:#1d1611 linear-gradient(180deg,#221a14,#1a140f);color:#f3e6c8;font-family:'Alegreya Sans',sans-serif;display:grid;grid-template-columns:700px 1fr;grid-template-rows:auto 1fr;gap:16px 28px;padding:22px 26px;box-sizing:border-box}
  .closeup header{grid-column:1 / -1;display:flex;gap:16px;align-items:center}
  .closeup header > b{font-family:'Alegreya',serif;font-size:58px;line-height:.8;color:#ffd99a}
  .closeup h1{font-family:'Alegreya',serif;font-weight:700;font-size:26px;margin:0}
  .closeup header p{margin:2px 0 0;color:#b09f82;font-size:15px;max-width:1050px}
  .closeup .zoom .clip{position:relative;width:700px;height:500px;overflow:hidden;border-radius:14px;background:
      repeating-linear-gradient(92deg, rgba(0,0,0,0) 0 9px, rgba(0,0,0,.07) 9px 10px, rgba(255,255,255,.012) 10px 23px, rgba(0,0,0,.05) 23px 24px),#241b14;box-shadow:inset 0 0 0 1px rgba(243,230,200,.1)}
  .closeup .zoomer{position:absolute}
  .closeup .cap{color:#b09f82;font-size:13.5px;margin:8px 2px 0}
  .closeup aside h2{font-family:'Alegreya',serif;font-size:18px;font-weight:500;margin:0 0 10px;color:#cbb894}
  .closeup aside h2 small{font-family:'Alegreya Sans',sans-serif;font-size:13px;color:#8f7f66}
  .closeup .peek{background:linear-gradient(180deg,#f4ebd7,#eadfc4);color:#2a1f17;border-radius:10px;box-shadow:0 0 0 1px rgba(80,60,30,.25),0 12px 30px rgba(0,0,0,.55);width:300px;padding:12px 14px;margin-bottom:24px}
  .closeup .peek .pk-head{display:flex;flex-direction:column;gap:1px}
  .closeup .peek b{font-family:'Alegreya',serif;font-size:21px}
  .closeup .peek em{font-size:12px;color:#8a7760}
  .closeup .peek p{margin:6px 0 8px;font-size:15px;line-height:1.3}
  .closeup .peek .pk-get{border-top:1px solid rgba(42,31,23,.15);padding-top:6px;display:flex;flex-direction:column;gap:2px;font-size:14px}
  .closeup .peek .pk-get svg{display:inline-block;vertical-align:-2px}
  .closeup .peek .pk-get small{font-size:10.5px;letter-spacing:.14em;color:#8a7760}
  .closeup .vocab{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 14px}
  .closeup .voc{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px}
  .closeup .voc-cell{position:relative;display:grid;place-items:center;min-height:120px}
  .closeup .voc figcaption{display:flex;flex-direction:column;align-items:center;gap:0;font-size:13px;color:#b09f82}
  .closeup .voc figcaption b{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#f3e6c8}
  .closeup .voc figcaption i{color:#ffd99a;font-style:normal}
  .closeup .note{color:#8f7f66;font-size:12.5px;margin-top:18px;max-width:500px}
  `;

  async function boot() {
    const O = window.OPT;
    const st = document.createElement('style');
    st.textContent = BASE_CSS + (view === 'wheel' ? FRAME_CSS : CLOSEUP_CSS) + (O.css || '');
    document.head.appendChild(st);
    await (view === 'wheel' ? frame(O) : quadrant(O));
    await document.fonts.ready;
    document.querySelectorAll('.wheel').forEach(w => layoutRim(w, O));
    if (O.after) O.after(document);
    document.body.dataset.ready = '1';
  }
  window.MOCK = { boot, S, HALF, view };
  addEventListener('DOMContentLoaded', boot);
})();
