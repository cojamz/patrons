// Shared scene data + builders for frames 2-4 (real content: tables gold / silver / thieves / echo).
(function () {
  const sp = (n, z = 1, o) => PX.sprite(n, z, o);
  const inl = (n, z = 1, o) => sp(n, z, o).replace('<svg', '<svg style="display:inline-block;vertical-align:-2px"');
  const SEAT = { you: { robe: 'bone', sig: 'star' }, wren: { robe: 'ebony', sig: 'eye' }, ossian: { robe: 'clay', sig: 'hand' }, ilse: { robe: 'slate', sig: 'flame' } };
  const Q = { gold: '#c99327', silver: '#8794a2', magenta: '#b2386c', green: '#3d8c66' };
  const CARDS = {
    underdog: { n: 'Underdog', q: 'gold', p: 'up', tm: 'While', cost: [4, 'gold', 2], f: 1, text: 'While anyone has more gold than you, your gold gains are doubled.' },
    seed: { n: 'Seed Money', q: 'gold', p: 'sprout', tm: 'On recruit', cost: [4, 'gold', 0], f: 1, text: 'When recruited: gain gold equal to your member count.' },
    prospector: { n: 'Prospector', q: 'gold', p: 'coin', tm: 'Whenever', cost: [2, 'gold', 2], f: 1, text: 'Whenever an action gains you gold, +1 more.' },
    cutpurse: { n: 'Cutpurse', q: 'magenta', p: 'dagger', tm: 'Round start', cost: [2, 'magenta', 2], f: 1, text: 'At round start, take 1 resource from the rival holding the most.' },
    robin: { n: 'Robin Hood', q: 'magenta', p: 'bow', tm: 'Whenever', cost: [2, 'magenta', 2], f: 1, text: 'Whenever you steal from the player with the most followers, +1 follower.' },
    crew: { n: 'Crew', q: 'magenta', p: 'mask', tm: 'Worth 2', cost: [1, 'magenta', 1], f: 2, text: 'Worth 2 followers.' },
    muse: { n: 'Muse', q: 'green', p: 'lyre', tm: 'Whenever', cost: [2, 'green', 2], f: 1, text: 'Whenever a rival copies one of your spaces, +2 green.' },
    choir: { n: 'Choir', q: 'green', p: 'note', tm: 'Whenever', cost: [4, 'green', 2], f: 1, text: 'Whenever you copy a space, +1 green.' },
    retinue: { n: 'Retinue', q: 'silver', p: 'cup', tm: 'On recruit', cost: [2, 'silver', 2], f: 2, text: 'Worth 2 followers. When recruited, everyone else +1 silver.' },
    steward: { n: 'Steward', q: 'silver', p: 'key', tm: 'Round start', cost: [2, 'silver', 2], f: 1, text: 'At round start, +1 silver per 3 silver you hold.' },
    banker: { n: 'Banker', q: 'gold', p: 'coin', tm: 'Round start', cost: [2, 'gold', 2], f: 1, text: 'At round start, +3 gold.' },
  };
  const SHOP = ['underdog', 'seed', 'prospector', 'cutpurse', 'robin', 'crew', 'muse', 'choir', 'retinue', 'steward'];
  const QUADS = (taken = {}) => [
    { id: 'gold', color: Q.gold, glyph: 'gold', rule: 'Most', spaces: [
      { icon: 'joint', y: `+3${sp('gold')}+1→`, taken: taken.joint }, { icon: 'rush', y: `+2${sp('gold')}`, taken: taken.rush }, { icon: 'discount', y: '−4 cost', taken: taken.discount }] },
    { id: 'silver', color: Q.silver, glyph: 'silver', rule: 'Most', spaces: [
      { icon: 'toast', y: `+3${sp('silver')}`, taken: taken.toast }, { icon: 'gift', y: `+2${sp('silver')}+2${sp('any')}`, taken: taken.gift }, { icon: 'alms', y: `+4${sp('silver')}`, taken: taken.alms }] },
    { id: 'magenta', color: Q.magenta, glyph: 'magenta', rule: 'Most members', spaces: [
      { icon: 'pickpocket', y: 'steal 2', taken: taken.pickpocket }, { icon: 'tipoff', y: 'steal 1s', taken: taken.tipoff }, { icon: 'hideout', y: 'steal 1', taken: taken.hideout }] },
    { id: 'green', color: Q.green, glyph: 'green', rule: 'Most', spaces: [
      { icon: 'hum', y: `+3${sp('green')}`, taken: taken.hum }, { icon: 'chant', y: `+2${sp('green')}`, taken: taken.chant }, { icon: 'echo', y: 'copy', taken: taken.echo }] },
  ];
  function rail(rows, z = 2) {
    return rows.map(([n, s, f, w, u, last, now, delta], i) => `
      ${i ? `<span class="arrow">${rows.dir || '◂'}</span>` : ''}
      <div class="seat ${now ? 'now' : ''}">${sp('acolyte', z, s)}
        <div class="who">${n}<small>${last ? 'last: ' + inl(last).replace('vertical-align:-2px', 'vertical-align:-3px;width:14px;height:14px') : '&nbsp;'}</small></div>
        <div class="score">${f}${sp('follower', 2)}${delta ? `<span class="dl">${delta}</span>` : ''}</div>
        ${w ? `<div class="wk">${Array.from({ length: w }, (_, k) => `<span class="${k < u ? 'used' : ''}"></span>`).join('')}</div>` : ''}
      </div>`).join('');
  }
  function costHTML(c, z = 2, miss) {
    const [s, col, w] = c.cost;
    return `<span class="cost"><span class="rz ${miss ? 'miss' : ''}"><b>${s}</b>${sp(col, z)}</span>${w ? `<span class="rz"><b>${w}</b>${sp('any', z)}</span>` : ''}</span>`;
  }
  function card(id, opt = {}) {
    const c = CARDS[id];
    if (opt.rules) return `<div class="card paper rules ${opt.cls || ''}" style="--q:${Q[c.q]}">
      <div class="tband"><span>${c.tm}</span></div>
      <div class="por">${sp('acolyte', 2, { robe: c.q, prop: c.p })}${opt.need ? `<span class="need">need ${opt.need}</span>` : ''}</div>
      <div class="nm">${c.n}</div>
      <p class="tx">${c.text}</p>
      <div class="ft">${costHTML(c, 2, opt.miss)}<span class="val">${c.f}${sp('follower', 1)}</span></div>
      ${opt.tick ? `<span class="tick">${opt.tick}</span>` : ''}
    </div>`;
    return `<div class="card paper ${opt.cls || ''}" style="--q:${Q[c.q]}">
      <div class="band"></div>
      <div class="art">${sp('acolyte', 3, { robe: c.q, prop: c.p })}</div>
      <div class="nm">${c.n}</div><div class="tm">${c.tm}</div>
      <div class="ft">${costHTML(c)}<span class="val">${c.f}${sp('follower', 1)}</span></div>
      ${opt.tick ? `<span class="tick">${opt.tick}</span>` : ''}
    </div>`;
  }
  function stacks(res, lift = {}, z = 3) {
    return res.map(([c, n]) => `
      <div class="stack ${n ? '' : 'zero'}"><div class="coins">${Array.from({ length: Math.max(n, 1) }, (_, i) => `<span class="${i >= n - (lift[c] || 0) ? 'lift' : ''}">${sp(c, z)}</span>`).join('')}</div><div class="n">${n}</div></div>`).join('');
  }
  const css = `
  .card.rules .tband{height:16px;background:var(--q);color:#fff8e8;font-size:9.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;padding:0 4px 0 7px}
  .card.rules .por{position:relative;height:34px;margin:4px 6px 0;border-radius:4px;display:flex;align-items:center;justify-content:space-between;padding:0 4px 0 8px;background:radial-gradient(circle at 50% 70%, color-mix(in srgb,var(--q) 28%,var(--paper)), color-mix(in srgb,var(--q) 10%,var(--paper-2)) 70%);box-shadow:inset 0 0 0 1px rgba(42,31,23,.16)}
  .card.rules .por > svg{width:28px;height:28px}
  .card.rules .nm{margin:4px 8px 0;font-size:13.5px}
  .card.rules .tx{font-size:11.2px;line-height:1.2;color:var(--ink);margin:3px 8px 0}
  .card .need{font-size:10px;font-weight:700;letter-spacing:0;text-transform:none;color:#7c2a1c;background:#fbe7dc;border-radius:7px;padding:0 4px;display:inline-flex;align-items:center;gap:1px}
  .card .need svg{width:9px;height:9px}
  .card.off{filter:brightness(.62) saturate(.55)}
  .card.lift{transform:translateY(-10px);box-shadow:0 0 0 2px #2a1f17,0 0 0 5px #ffd99a,0 16px 26px rgba(0,0,0,.6)}
  .card.ok{box-shadow:0 0 0 1px rgba(80,60,30,.25),0 0 16px 1px rgba(255,200,120,.35),0 6px 14px -6px rgba(0,0,0,.7)}
  .rz.miss b{color:#9a3b2a}
  .stack .coins .lift{transform:translateY(-10px);filter:drop-shadow(0 0 3px #ffd99a) drop-shadow(0 6px 3px rgba(0,0,0,.5))}
  .stack .coins span{display:block;line-height:0;margin-top:-14px}
  .stack .coins span:first-child{margin-top:0}
  .seat .dl{font-family:var(--sans);font-size:11px;font-weight:700;color:#1d1611;background:#ffd99a;border-radius:8px;padding:0 5px;margin-left:3px}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  window.Scene = { sp, inl, SEAT, Q, CARDS, SHOP, QUADS, rail, card, stacks, costHTML };
})();
