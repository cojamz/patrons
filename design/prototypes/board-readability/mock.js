// Board-readability sketches: shared mock state and chrome. Action names and texts are the real v4 content
// (gold, thieves = Magenta, echo = Green, silver), copied from the engine on 2026-10-14.
// The moment: round I, P2 / P3 / P4 have each placed one worker, it is your (P1's) turn to place.
// `main` / `sub` are the terse board summaries used by mock A; tokens {gold} {magenta} {green} {silver} {any} are gems.
(function () {
  const M = (window.M = {});
  M.round = 1;
  M.ringValue = [2, 4, 6];
  M.players = [
    { id: 0, name: 'P1', me: true, pc: '#f4efe2', f: 1, res: { gold: 2, magenta: 0, green: 1, silver: 0 }, left: 3 },
    { id: 1, name: 'P2', pc: '#ff8fb1', f: 1, res: { gold: 3, magenta: 0, green: 1, silver: 1 }, left: 2 },
    { id: 2, name: 'P3', pc: '#b9a2ff', f: 1, res: { gold: 1, magenta: 0, green: 3, silver: 2 }, left: 2 },
    { id: 3, name: 'P4', pc: '#ffa94d', f: 1, res: { gold: 2, magenta: 0, green: 2, silver: 1 }, left: 2 },
  ];
  M.colors = ['gold', 'magenta', 'green', 'silver'];
  // Order on the wheel (as in the live game): Gold bottom, Magenta left, Green top, Silver right.
  M.quadrants = [
    {
      id: 'gold', name: 'Gold', c: 'var(--gold)', center: 180,
      rule: 'Most gold', stat: p => p.res.gold, note: 'gold counts as any color when you buy followers',
      actions: [
        { ring: 1, name: 'Joint Venture', short: 'Joint', text: '+3 gold, and +1 gold to a player you choose.', main: '+3{gold}', sub: '& gift 1{gold}' },
        { ring: 1, name: 'Rush', text: '+2 gold per round number (2 / 4 / 6).', main: '+2{gold}', sub: '2 / 4 / 6' },
        { ring: 1, name: 'Discount', text: 'Your next member costs 4 less, off any part of its cost.', main: '−4 cost', sub: 'next member' },
        { ring: 2, name: 'Steal', text: 'Take up to 3 gold from rivals, split however you like.', main: 'take 3{gold}', sub: 'from rivals' },
        { ring: 2, name: 'Windfall', text: '+1 gold per member you have.', main: '+1{gold} each', sub: 'per member' },
        { ring: 3, name: 'Strike', text: 'Double your gold.', main: '×2{gold}', sub: '' },
      ],
    },
    {
      id: 'thieves', name: 'Magenta', c: 'var(--magenta)', center: 270,
      rule: 'Most Magenta members', stat: () => 0, note: '',
      actions: [
        { ring: 1, name: 'Pickpocket', text: 'Take 2 / 3 / 4 resources (by round) from rivals, split as you like.', main: 'steal 2', sub: '2 / 3 / 4' },
        { ring: 1, name: 'Tip-off', text: 'Take 1 resource from each player holding more than you.', main: 'steal 1', sub: 'each richer' },
        { ring: 1, name: 'Hideout', text: 'Take 1 resource from a rival. Then no one can steal resources from you this round.', main: 'steal 1', sub: '+ safe' },
        { ring: 2, name: 'Rob', text: 'Take 3 resources from rivals, at least 1 from each.', main: 'steal 3', sub: '1+ each' },
        { ring: 2, name: 'Ransom', text: 'Pick a rival’s member costing 6 or less. They pay you its cost to keep it, or it’s yours.', main: 'ransom', sub: 'member ≤6' },
        { ring: 3, name: 'Heist', text: 'Take any rival’s member. They recruit any face-up member costing up to the same, free.', main: 'take member', sub: '' },
      ],
    },
    {
      id: 'echo', name: 'Green', c: 'var(--green)', center: 0,
      rule: 'Most green', stat: p => p.res.green, note: '',
      actions: [
        { ring: 1, name: 'Hum', text: '+3 green.', main: '+3{green}', sub: '' },
        { ring: 1, name: 'Chant', text: '+2 green per round number (2 / 4 / 6).', main: '+2{green}', sub: '2 / 4 / 6' },
        { ring: 1, name: 'Echo', text: 'Copy any outer-ring space taken this round.', main: 'copy ↺', sub: '3 to copy' },
        { ring: 2, name: 'Encore', text: 'Copy any space taken this round (not the center).', main: 'copy ↺', sub: 'any taken' },
        { ring: 2, name: 'Recall', text: 'Copy any space taken last round.', main: 'copy ↺', sub: 'last round' },
        { ring: 3, name: 'Eternity', text: 'Copy every space you took this round.', main: 'copy all', sub: '' },
      ],
    },
    {
      id: 'silver', name: 'Silver', c: 'var(--silver)', center: 90,
      rule: 'Most silver', stat: p => p.res.silver, note: '',
      actions: [
        { ring: 1, name: 'Toast', text: '+3 silver per round number (3 / 6 / 9), and everyone else +1 silver.', main: '+3{silver}', sub: 'others +1{silver}' },
        { ring: 1, name: 'Gift', text: '+2 silver and +2 of another color; everyone else gets 1 of that color.', main: '+2{silver} +2{any}', sub: 'others +1{any}' },
        { ring: 1, name: 'Alms', text: '+4 silver, and a rival you choose gets 2 of a color you choose.', main: '+4{silver}', sub: 'a rival +2{any}' },
        { ring: 2, name: 'Silver Tongue', short: 'Silver', text: '+4 silver, then swap any of your silver for one other color, one for one. Everyone else +1 silver.', main: '+4{silver} swap', sub: '' },
        { ring: 2, name: 'Rising Tide', short: 'Rising', text: 'Everyone else +1 silver. Then gain half the silver of the richest rival (rounded up).', main: '½ top {silver}', sub: '' },
        { ring: 3, name: 'Jubilee', text: 'Gain 1 follower per 2 silver you hold (keep the silver). Everyone else +2 silver.', main: '{silver}→followers', sub: '' },
      ],
    },
  ];
  // Who sits where: key = "q-i". Since your turn: P2 Rush, P3 Gift, P4 Pickpocket.
  M.slots = { '0-1': 1, '3-1': 2, '1-0': 3 };
  M.recent = [['0-1', 1], ['3-1', 2], ['1-0', 3]];
  M.last = 'P4 took <b>Pickpocket</b>: 1 gold from you, 1 green from P3';

  M.shop = [
    { name: 'Prospector', c: 'var(--gold)', f: 1, eff: 'Whenever an action gains you gold, +1 more.', cost: [['gold', 2], ['any', 2]] },
    { name: 'Banker', c: 'var(--gold)', f: 1, eff: 'At round start, +3 gold.', cost: [['gold', 2], ['any', 2]] },
    { name: 'Light Fingers', c: 'var(--magenta)', f: 1, eff: 'Whenever a rival recruits a member costing 8 or more, take 1 resource from them.', cost: [['magenta', 4], ['any', 4]] },
    { name: 'Crew', c: 'var(--magenta)', f: 2, eff: 'Worth 2 followers.', cost: [['magenta', 2], ['any', 2]] },
    { name: 'Choir', c: 'var(--green)', f: 1, eff: 'Whenever you copy a space, +1 green.', cost: [['green', 4], ['any', 2]] },
    { name: 'Steward', c: 'var(--silver)', f: 1, eff: 'At round start, +1 silver per 3 silver you hold.', cost: [['silver', 2], ['any', 2]] },
  ];
  M.buys = [['+1 <span class="lg">follower</span>', 'Pay 2<span class="lg"> · any</span>'], ['+3 <span class="lg">followers</span>', 'Pay 4<span class="lg"> · 2+ colors</span>'], ['+6 <span class="lg">followers</span>', 'Pay 8<span class="lg"> · 3+ colors</span>'], ['+10 <span class="lg">followers</span>', 'Pay 10<span class="lg"> · 4+ colors</span>']];

  M.roman = n => ['', 'I', 'II', 'III'][n];
  M.key = (q, i) => `${q}-${i}`;
  M.esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  M.dot = c => (c === 'any' ? '<i class="d any"></i>' : `<i class="d" style="--c:var(--${c})"></i>`);
  M.player = id => M.players[id];

  // Geometry: angles in degrees clockwise from straight up; (0,0) is the hub.
  M.polar = (a, r) => { const t = (a - 90) * Math.PI / 180; return [r * Math.cos(t), r * Math.sin(t)]; };
  M.sector = (a0, a1, r0, r1) => {
    const [x0, y0] = M.polar(a0, r1), [x1, y1] = M.polar(a1, r1), [x2, y2] = M.polar(a1, r0), [x3, y3] = M.polar(a0, r0);
    const big = a1 - a0 > 180 ? 1 : 0;
    return `M${x0},${y0} A${r1},${r1} 0 ${big} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${big} 0 ${x3},${y3}Z`;
  };
  /** Each space's angle: same order as the live wheel (first action clockwise-most). */
  M.angleOf = (q, a, i, spans) => {
    const Q = M.quadrants[q];
    const same = Q.actions.filter(x => x.ring === a.ring);
    const idx = Q.actions.filter((x, j) => x.ring === a.ring && j < i).length;
    if (same.length === 1) return Q.center;
    const span = spans[a.ring];
    return Q.center + span / 2 - idx * (span / (same.length - 1));
  };

  M.standing = Q => {
    const rows = M.players.map(p => ({ p, v: Q.stat(p) }));
    const top = Math.max(...rows.map(r => r.v));
    return { top, leaders: top > 0 ? rows.filter(r => r.v === top).map(r => r.p) : [], me: rows[0].v };
  };
  const who = p => (p.me ? 'you' : p.name);

  // ---- chrome renderers ----
  M.renderBar = (el, say) => {
    el.innerHTML = `<h1>Patrons</h1><span class="round">Round I <small>· 3 workers each</small></span>
      <span class="say"><i></i>${say}</span><span class="last">Last: ${M.last}</span>
      <span class="btns"><button class="btn">How to play</button> <button class="btn">Leave</button></span>`;
  };
  M.renderStrip = el => {
    el.innerHTML = M.players.map(p => `
      <div class="p${p.me ? ' me turn' : ''}" style="--pc:${p.pc}">
        <span class="nm"><i></i>${p.name}${p.me ? ' <em>you</em>' : ''}</span>
        <span class="fol"><b class="num">${p.f}</b><small>follower</small></span>
        <span class="res num">${M.colors.map(c => `<span>${M.dot(c)}${p.res[c]}</span>`).join('')}</span>
        <span class="wk">${'●'.repeat(p.left)} <small>${p.left} left</small></span>
      </div>`).join('');
  };
  M.contestHTML = Q => {
    const st = M.standing(Q);
    const v = M.ringValue[M.round - 1];
    const lead = st.leaders.length ? `${st.leaders.map(who).join(' & ')} <b class="num">${st.top}</b>${st.leaders.some(p => p.me) ? '' : ` <small>· you ${st.me}</small>`}` : 'no one yet';
    return { rule: `${Q.rule} <b class="num">+${v}</b>`, lead };
  };
  M.renderContests = el => {
    el.innerHTML = M.quadrants.map(Q => {
      const c = M.contestHTML(Q);
      return `<div class="contest" style="--c:${Q.c}"><span class="c1"><i></i>${c.rule.replace(/^Most /, '')}</span><span class="c2">${c.lead}</span></div>`;
    }).join('');
  };
  M.costHTML = cost => cost.map(([c, n]) => `${M.dot(c)}${n} ${c}`).join(' + ');
  M.renderShop = (el, { effect = true, compact = false } = {}) => {
    el.innerHTML = M.shop.map(m => `
      <div class="card" style="--c:${m.c}">
        <div class="t"><span>${m.name}</span><span class="num">${m.f}★</span></div>
        ${effect ? `<div class="eff">${m.eff}</div>` : ''}
        <div class="cost num">${compact ? m.cost.map(([c, n]) => M.dot(c) + n).join(' + ') : M.costHTML(m.cost)}</div>
      </div>`).join('');
  };
  M.renderBuy = el => {
    el.innerHTML = M.buys.map(([b, s]) => `<div class="fb"><b>${b}</b><span>${s}</span></div>`).join('') + '<div class="fb pass">Pass</div>';
  };
  M.renderLegend = el => {
    el.innerHTML = '<span>Since your turn:</span>' + M.recent.map(([k, pid]) => {
      const [q, i] = k.split('-').map(Number);
      const p = M.player(pid);
      return `<span class="mv" style="--pc:${p.pc}"><i></i>${p.name} ${M.quadrants[q].actions[i].name}</span>`;
    }).join('');
  };
})();
