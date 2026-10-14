// Board renderer for the vision frames: a printed paper wheel on the table, upright pixel icons, rings that open by round.
(function () {
  const MID = { gold: 90, silver: 180, magenta: 270, green: 0 };
  const pol = (cx, cy, r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  function wedge(cx, cy, r0, r1, a0, a1) {
    const [x0, y0] = pol(cx, cy, r1, a0), [x1, y1] = pol(cx, cy, r1, a1), [x2, y2] = pol(cx, cy, r0, a1), [x3, y3] = pol(cx, cy, r0, a0);
    const big = a1 - a0 > 180 ? 1 : 0;
    return `M${x0},${y0} A${r1},${r1} 0 ${big} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${big} 0 ${x3},${y3} Z`;
  }
  function render(host, B) {
    const D = B.size, R = D / 2, cx = R, cy = R, round = B.round || 1;
    const f = { rim: .935, o0: .56, m0: .385, i0: .235 };
    let svg = `<svg width="${D}" height="${D}" viewBox="0 0 ${D} ${D}" style="position:absolute;inset:0;overflow:visible">
      <defs>
        <radialGradient id="pp" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#f7efdd"/><stop offset=".8" stop-color="#ecdfc3"/><stop offset="1" stop-color="#dccba6"/></radialGradient>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 .10 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#pp)"/>`;
    for (const q of B.quads) {
      const m = MID[q.id], a0 = m - 45, a1 = m + 45;
      const lit = B.focus ? B.focus === q.id : true;
      svg += `<path d="${wedge(cx, cy, f.o0 * R, f.rim * R, a0, a1)}" fill="${q.color}" opacity="${lit ? .26 : .14}"/>`;
      svg += `<path d="${wedge(cx, cy, f.rim * R, R, a0, a1)}" fill="${q.color}" opacity="${lit ? .9 : .5}"/>`;
      svg += `<path d="${wedge(cx, cy, f.m0 * R, f.o0 * R, a0, a1)}" fill="${q.color}" opacity="${round >= 2 ? .2 : .07}"/>`;
      svg += `<path d="${wedge(cx, cy, f.i0 * R, f.m0 * R, a0, a1)}" fill="${q.color}" opacity="${round >= 3 ? .2 : .05}"/>`;
    }
    // closed rings get a carved, shadowed look
    if (round < 2) svg += `<circle cx="${cx}" cy="${cy}" r="${f.o0 * R}" fill="rgba(70,50,25,.10)"/>`;
    if (round < 3) svg += `<circle cx="${cx}" cy="${cy}" r="${f.m0 * R}" fill="rgba(70,50,25,.08)"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${R}" filter="url(#grain)" fill="#000"/>`;
    for (const r of [f.rim, f.o0, f.m0, f.i0]) svg += `<circle cx="${cx}" cy="${cy}" r="${r * R}" fill="none" stroke="rgba(42,31,23,.35)" stroke-width="${r === f.rim ? 1.4 : 1}"/>`;
    for (const a of [45, 135, 225, 315]) { const [x0, y0] = pol(cx, cy, f.i0 * R, a), [x1, y1] = pol(cx, cy, R, a); svg += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="rgba(42,31,23,.45)" stroke-width="1.4"/>`; }
    svg += `<circle cx="${cx}" cy="${cy}" r="${R - .5}" fill="none" stroke="#7a6244" stroke-width="1.5"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${f.i0 * R}" fill="#2a1f17"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${f.i0 * R - 5}" fill="none" stroke="rgba(243,230,200,.18)"/>`;
    svg += `</svg>`;
    let html = `<div class="board" style="position:absolute;left:${B.x - R}px;top:${B.y - R}px;width:${D}px;height:${D}px;filter:drop-shadow(0 18px 22px rgba(0,0,0,.55)) drop-shadow(0 2px 2px rgba(0,0,0,.5))">${svg}`;
    // hub: round marker
    const numerals = ['I', 'II', 'III'];
    html += `<div class="hub" style="position:absolute;left:${cx - 50}px;top:${cy - 34}px;width:100px;text-align:center;color:#f3e6c8;font-family:var(--serif)">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#bfa984">Round</div>
      <div style="font-size:34px;font-weight:700;line-height:1">${numerals[round - 1]}</div>
      <div style="display:flex;gap:5px;justify-content:center;margin-top:3px">${[1, 2, 3].map(i => `<span style="width:6px;height:6px;border-radius:50%;${i <= round ? 'background:#ffd99a' : 'border:1px solid #8f7f66'}"></span>`).join('')}</div></div>`;
    for (const q of B.quads) {
      const m = MID[q.id];
      const dim = B.focus && B.focus !== q.id;
      // outer ring sockets (round I)
      q.spaces.forEach((sp, i) => {
        const a = m + (i - 1) * 27.5;
        const [x, y] = pol(cx, cy, .748 * R, a);
        const d = Math.round(.25 * R);
        const id = q.id + '-' + i;
        const hov = B.hover === id;
        const legal = !sp.taken && B.legal !== false;
        html += `<div class="sock ${hov ? 'hov' : ''} ${sp.taken ? 'taken' : ''} ${legal ? 'legal' : ''}" style="--q:${q.color};left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px;${dim ? 'opacity:.55;' : ''}">
          <div class="ico">${PX.sprite(sp.icon, 2)}</div>
          <div class="yl">${sp.y}</div>
          ${sp.taken ? `<div class="wk ${sp.taken.fresh ? 'fresh' : ''}">${PX.sprite('acolyte', 2, { robe: sp.taken.robe, sig: sp.taken.sig })}</div>` : ''}
          ${hov && B.ghost ? `<div class="wk ghost">${PX.sprite('acolyte', 2, B.ghost)}</div>` : ''}
        </div>`;
      });
      // middle + inner sockets: engraved until their round
      [-17, 17].forEach((o, i) => {
        const [x, y] = pol(cx, cy, .468 * R, m + o); const d = round >= 2 ? Math.round(.2 * R) : 22;
        html += `<div class="sock2 ${round >= 2 ? 'open' : ''}" style="--q:${q.color};left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px"></div>`;
      });
      { const [x, y] = pol(cx, cy, .31 * R, m); const d = 20; html += `<div class="sock2" style="--q:${q.color};left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px"></div>`; }
      // ring numerals for closed rings (once, in the gold quadrant gap)
      // rim plaque: the contest. Leader shown by default; standings on hover.
      const [px, py] = pol(cx, cy, (B.compact && (m === 0 || m === 180) ? .86 : .968) * R, m);
      const pl = q.plaque || {};
      html += `<div class="plaque ${pl.hover ? 'hov' : ''}" style="--q:${q.color};left:${px}px;top:${py}px">
        ${PX.sprite(q.glyph, 2)}${B.compact ? '' : `<span class="r">${q.rule}</span>`}<span class="rw">+${2 * round}</span>
        ${q.leader ? `<span class="ld">${PX.sprite('acolyte', 1, { robe: q.leader.robe, sig: q.leader.sig })}</span>` : `<span class="ld none">—</span>`}
      </div>`;
    }
    // closed ring labels
    const [lx2, ly2] = pol(cx, cy, .468 * R, 45), [lx3, ly3] = pol(cx, cy, .31 * R, 45);
    if (round < 2) html += `<div class="rn" style="left:${lx2}px;top:${ly2}px">II</div>`;
    if (round < 3) html += `<div class="rn" style="left:${lx3}px;top:${ly3}px">III</div>`;
    html += `</div>`;
    host.insertAdjacentHTML('beforeend', html);
  }
  const css = `
  .sock{position:absolute;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
    background:radial-gradient(circle at 50% 38%, #fbf5e7, #efe3c8 70%);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--q) 70%,#5a4630),inset 0 2px 4px rgba(60,40,15,.25),0 1px 0 rgba(255,255,255,.6)}
  .sock .ico{margin-top:-4px}
  .sock .yl{font-family:var(--serif);font-weight:700;font-size:12.5px;color:#2a1f17;line-height:1;display:flex;align-items:center;gap:2px;white-space:nowrap}
  .sock .yl .px svg{width:13px;height:13px}
  .sock.legal{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--q) 80%,#5a4630),inset 0 2px 4px rgba(60,40,15,.25),0 0 0 3px rgba(255,217,154,.0),0 0 14px 2px rgba(255,200,120,.45)}
  .sock.taken .ico,.sock.taken .yl{opacity:.28}
  .sock .wk{position:absolute;left:50%;top:50%;transform:translate(-50%,-56%);filter:drop-shadow(0 3px 2px rgba(0,0,0,.45))}
  .sock .wk.fresh::after{content:"";position:absolute;left:-9px;top:-7px;right:-9px;bottom:-5px;border-radius:50%;border:2px dashed #e0a23a;opacity:.9}
  .sock .wk.ghost{opacity:.55;filter:none}
  .sock.hov{transform:scale(1.08);z-index:2;box-shadow:inset 0 0 0 2.5px #2a1f17,0 0 0 4px #ffd99a,0 8px 18px rgba(0,0,0,.45)}
  .sock2{position:absolute;border-radius:50%;border:1.5px dashed color-mix(in srgb,var(--q) 55%,#6e5a40);opacity:.55}
  .rn{position:absolute;transform:translate(-50%,-50%);font-family:var(--sans);font-weight:700;font-size:10px;letter-spacing:.14em;color:#7a6548;opacity:.85;background:#e4d6b8;padding:0 4px;border-radius:6px}
  .plaque{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:5px;padding:3px 8px 3px 6px;border-radius:12px;
    background:#f4ebd7;color:#2a1f17;font-size:11.5px;font-weight:600;white-space:nowrap;box-shadow:0 0 0 1.5px var(--q),0 3px 6px rgba(0,0,0,.35);z-index:3}
  .plaque .px svg{width:14px;height:14px}
  .plaque .r{letter-spacing:.01em}
  .plaque .rw{font-family:var(--serif);font-weight:700;color:#7a4f10}
  .plaque .ld{display:inline-flex;width:20px;height:20px;border-radius:50%;background:#2a1f17;align-items:center;justify-content:center;margin-right:-4px}
  .plaque .ld svg{width:16px;height:16px}
  .plaque .ld.none{background:transparent;color:#a08b6c;width:auto}
  .plaque.hov{box-shadow:0 0 0 2px #2a1f17,0 0 0 5px #ffd99a,0 6px 12px rgba(0,0,0,.4)}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  window.Board = { render, pol };
})();
