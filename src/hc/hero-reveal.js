/* Hypercube hero reveal, live-site version.
   Runs on the Sport, Mobiliteit and Over Hypercube pages (NL + EN). The hero (title, image, menu) is built around the
   page's own tab component: the menu under the image and the markers on the image open the theme's original tabs.
   Order on every page: title -> image (+ menu; trains / cube drawing) -> text. Everything plays once, on the way down.
   Requires GSAP 3.12 + ScrollTrigger + CustomEase (loaded before this file). ASCII-only on purpose. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const LINE = 26, RED = '#FF0000', BLACK = '#1D1D1B', BLUE = '#0000FF', YELLOW = '#FFCC00';
  const CH = 10.5;                                         // IBM Plex Mono 15px advance (0.6em) + 1.5px tracking
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const press = g => { g.classList.add('press'); setTimeout(() => g.classList.remove('press'), 140); };

  /* ---------- layout helpers: header height, content width, full-width wrapper at the top of the document ---------- */
  function measureFrame() {
    const header = document.querySelector('#header-outer');
    root.style.setProperty('--hc-header', (header ? header.offsetHeight : 0) + 'px');
    document.querySelectorAll('.hc-shift').forEach(shift => {
      const parent = shift.parentElement, cs = getComputedStyle(parent);
      const inner = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      root.style.setProperty('--hc-cw', Math.min(inner, document.documentElement.clientWidth - 32) + 'px');
      // stretch to the window width and start at the very top of the document (the fixed header overlays it)
      shift.style.marginLeft = '0px'; shift.style.width = '';
      const r = shift.getBoundingClientRect();
      shift.style.marginLeft = -r.left + 'px';
      shift.style.width = document.documentElement.clientWidth + 'px';
      const cur = parseFloat(shift.style.marginTop) || 0;
      shift.style.marginTop = (cur - (r.top + scrollY)) + 'px';
    });
  }

  /* ---------- linked hover: an image marker and its menu item act as one ---------- */
  function makeLink() {
    const items = {};
    const all = k => (items[k] ? items[k].els : []);
    return {
      add(k, node, opts) { const it = (items[k] = items[k] || { els: [] }); it.els.push(node); if (opts && opts.onHover) it.onHover = opts.onHover; },
      enter(k) { for (const j in items) if (j !== k) all(j).forEach(e => e.classList.remove('on')); all(k).forEach(e => e.classList.add('on')); if (items[k] && items[k].onHover) items[k].onHover(); },
      leave(k) { all(k).forEach(e => e.classList.remove('on')); },
      press(k) { all(k).forEach(press); },
      onClick: null,
    };
  }
  function wire(node, k, link) {
    node.addEventListener('pointerenter', () => link.enter(k));
    node.addEventListener('pointerleave', () => link.leave(k));
    node.addEventListener('focus', () => link.enter(k));
    node.addEventListener('blur', () => link.leave(k));
    node.addEventListener('pointerdown', () => link.press(k));
    node.addEventListener('click', e => { e.preventDefault(); link.onClick && link.onClick(k); });
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); link.press(k); link.onClick && link.onClick(k); } });
  }
  function chip(parent, label, x, y, anchor) {           // label on a white chip; anchor: start | middle | end
    const w = label.length * CH + 22, rx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    el('rect', { x: rx, y: y - 15, width: w, height: 30, fill: '#FFFFFF', class: 'hc-cb' }, parent);
    const t = el('text', { x: rx + w / 2, y: y + 5.5, 'text-anchor': 'middle', class: 'hc-svgt' }, parent); t.textContent = label.toUpperCase();
    return { x: rx, w };
  }
  const twoLines = label => { const i = label.indexOf('&'); return i > 0 ? [label.slice(0, i + 1).trim(), label.slice(i + 1).trim()] : [label]; };

  /* ================= SPORT: a field that fuses football, basketball and hockey; the ball is passed ================= */
  function buildSport(host, keys, labels, link) {
    const POS = { hq: [640, 180], diensten: [150, 230], rankings: [1130, 230], opdrachtgevers: [330, 440], cases: [950, 440] };
    const svg = el('svg', { viewBox: '0 0 1280 500', role: 'group', 'aria-label': labels.join(', ') });
    const clip = el('clipPath', { id: 'hc-clip-sport' }, el('defs', {}, svg)); el('rect', { width: 1280, height: 500 }, clip);
    const g = el('g', { 'clip-path': 'url(#hc-clip-sport)' }, svg);
    el('rect', { width: 1280, height: 500, fill: '#F2F2EF' }, g);
    const FL = 40, FR = 1240, GY = 64, BOX = { x: 460, y: GY, w: 360, h: 220 }, GOAL = { w: 128, d: 40 };
    el('rect', { x: FL, y: GY, width: FR - FL, height: 500 - GY + 10, fill: '#FFFFFF' }, g);
    for (let y = GY + 62; y < 500; y += 124) el('rect', { x: FL, y, width: FR - FL, height: 62, fill: '#F6F6F3' }, g);
    const zones = el('g', { fill: 'none', stroke: BLUE, 'stroke-width': LINE }, g);
    el('path', { d: `M${FL + 56} ${GY} A56 56 0 0 1 ${FL} ${GY + 56} M${FR - 56} ${GY} A56 56 0 0 0 ${FR} ${GY + 56}` }, zones);
    el('path', { d: `M240 ${GY} A400 400 0 0 0 1040 ${GY}`, pathLength: 2000, 'stroke-dasharray': '64 36', 'stroke-dashoffset': 82, stroke: YELLOW }, zones);
    const lines = el('g', { fill: 'none', stroke: BLACK, 'stroke-width': LINE, 'stroke-linejoin': 'miter' }, g);
    el('path', { d: `M${FL} 520 V${GY} H${FR} V520` }, lines);
    el('rect', { x: BOX.x, y: BOX.y, width: BOX.w, height: BOX.h }, lines);
    const gx = 640 - GOAL.w / 2, post = GY - LINE / 2;
    el('path', { d: `M${gx} ${post} V${GY - GOAL.d} H${gx + GOAL.w} V${post}`, fill: 'none', stroke: BLUE, 'stroke-width': LINE, 'stroke-linejoin': 'miter' }, g);
    const nodes = keys.map((k, i) => {
      const [x, y] = POS[k], ls = twoLines(labels[i]);
      const n = el('g', { class: 'hc-pl', tabindex: 0, role: 'link', 'aria-label': labels[i], transform: `translate(${x} ${y})` }, g);
      const w = Math.max(...ls.map(l => l.length)) * CH + 22, h = ls.length * 21 + 10;
      el('rect', { x: -Math.max(64, w / 2 + 6), y: -36, width: Math.max(128, w + 12), height: 36 + 22 + h + 8, fill: 'transparent' }, n);
      el('rect', { x: -w / 2, y: 22, width: w, height: h, fill: '#FFFFFF', class: 'hc-cb' }, n);
      ls.forEach((t, j) => { const tx = el('text', { x: 0, y: 42 + j * 21, 'text-anchor': 'middle', class: 'hc-svgt' }, n); tx.textContent = t.toUpperCase(); });
      el('rect', { x: -15, y: -15, width: 30, height: 30, fill: '#FFFFFF', stroke: RED, 'stroke-width': 7, class: 'hc-n' }, n);
      return { k, x, y, g: n };
    });
    const fx = el('g', { 'pointer-events': 'none' }, g), trails = el('g', {}, fx);
    const dot = el('circle', { r: 11, fill: YELLOW, stroke: BLACK, 'stroke-width': 3.5 }, fx);
    const HOLD = { x: 22, y: -24 };
    let holder = nodes[0], pos = { x: holder.x + HOLD.x, y: holder.y + HOLD.y }, flight = null;
    dot.setAttribute('cx', pos.x); dot.setAttribute('cy', pos.y);
    const ease = x => (x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    function pass(to) {
      if (to === holder && !flight) return;
      const from = { x: pos.x, y: pos.y }, end = { x: to.x + HOLD.x, y: to.y + HOLD.y };
      const dx = end.x - from.x, dy = end.y - from.y, len = Math.hypot(dx, dy) || 1;
      const ctrl = { x: (from.x + end.x) / 2 - dy * .18, y: (from.y + end.y) / 2 + dx * .18 };
      const trail = el('path', { d: `M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`, fill: 'none', stroke: BLACK, 'stroke-width': 3, 'stroke-dasharray': '7 9', opacity: .55 }, trails);
      trail.style.transition = 'opacity .9s ease .25s'; requestAnimationFrame(() => requestAnimationFrame(() => (trail.style.opacity = 0)));
      setTimeout(() => trail.remove(), 1300);
      holder = to;
      const dur = reduce ? 0 : Math.min(520, 260 + len * .45), t0 = performance.now(), id = {}; flight = id;
      const step = now => {
        if (flight !== id) return;
        const u = dur ? Math.min(1, (now - t0) / dur) : 1, e = ease(u), v = 1 - e;
        pos = { x: v * v * from.x + 2 * v * e * ctrl.x + e * e * end.x, y: v * v * from.y + 2 * v * e * ctrl.y + e * e * end.y };
        dot.setAttribute('cx', pos.x.toFixed(1)); dot.setAttribute('cy', pos.y.toFixed(1));
        if (u < 1) requestAnimationFrame(step); else flight = null;
      };
      requestAnimationFrame(step);
    }
    nodes.forEach(n => { link.add(n.k, n.g, { onHover: () => pass(n) }); wire(n.g, n.k, link); });
    host.appendChild(svg);
    return {};
  }

  /* ================= MOBILITEIT: network; each train runs to its stop and is absorbed ================= */
  function buildMobility(host, keys, labels, link) {
    const svg = el('svg', { viewBox: '0 0 1280 500', role: 'group', 'aria-label': labels.join(', ') });
    el('rect', { width: 1280, height: 500 }, el('clipPath', { id: 'hc-clip-mob' }, el('defs', {}, svg)));
    const g = el('g', { 'clip-path': 'url(#hc-clip-mob)' }, svg);
    el('rect', { width: 1280, height: 500, fill: '#FFFFFF' }, g);
    const P = {};
    P.black = el('path', { d: 'M120 0 L240 120 H560', fill: 'none', stroke: BLACK, 'stroke-width': LINE }, g);
    P.yellow = el('path', { d: 'M140 500 L280 360 H1280', fill: 'none', stroke: YELLOW, 'stroke-width': LINE }, g);
    P.blue = el('path', { d: 'M0 140 L120 260 H1280', fill: 'none', stroke: BLUE, 'stroke-width': LINE }, g);
    el('path', { d: `M900 ${260 - LINE / 2 - 9} V${260 + LINE / 2 + 9}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': LINE + 14 }, g);   // white casing where red passes over blue
    P.red = el('path', { d: 'M900 500 V0', fill: 'none', stroke: RED, 'stroke-width': LINE }, g);
    const DEF = {
      hq: { line: 'black', c: BLACK, x: 560, y: 120, chip: [44, 0, 'start'], start: 40 },
      diensten: { line: 'blue', c: BLUE, x: 330, y: 260, chip: [0, 52, 'middle'], start: 30 },
      opdrachtgevers: { line: 'yellow', c: YELLOW, x: 900, y: 360, chip: [44, 52, 'start'], start: 30 },
      cases: { line: 'red', c: RED, x: 900, y: 120, chip: [44, 0, 'start'], start: 30 },
    };
    const SQ = 54, BORDER = 9.6, IN = SQ - 2 * BORDER, TR = 42, TS = BORDER;
    // draw order: red last so its train passes over the yellow stop
    const order = ['hq', 'diensten', 'opdrachtgevers', 'cases'].filter(k => keys.includes(k));
    const stops = order.map(k => {
      const s = DEF[k], label = labels[keys.indexOf(k)], path = P[s.line], total = path.getTotalLength();
      let best = 0, bd = 1e9;
      for (let i = 0; i <= 600; i++) { const L = total * i / 600, p = path.getPointAtLength(L), d = Math.hypot(p.x - s.x, p.y - s.y); if (d < bd) { bd = d; best = L; } }
      const grp = el('g', { class: 'hc-stn', tabindex: 0, role: 'link', 'aria-label': label, transform: `translate(${s.x} ${s.y})`, style: `--lc:${s.c}` }, g);
      const lbl = el('g', {}, grp);
      const [cx, cy, anchor] = s.chip;
      const c = chip(lbl, label, cx, cy, anchor);
      const hh = SQ / 2 + 6, hx = Math.min(-hh, c.x - 6), hw = Math.max(c.x + c.w + 6, hh) - hx;
      el('rect', { x: hx, y: -hh, width: hw, height: Math.max(2 * hh, cy + 15 + hh + 6), fill: 'transparent' }, grp);
      el('rect', { x: -SQ / 2, y: -SQ / 2, width: SQ, height: SQ, fill: s.c, class: 'hc-st' }, grp);
      const p0 = path.getPointAtLength(s.start);
      const train = el('rect', { x: p0.x - s.x - TR / 2, y: p0.y - s.y - TR / 2, width: TR, height: TR, rx: TR / 2, fill: '#FFFFFF', stroke: s.c, 'stroke-width': TS, class: 'hc-tr' }, grp);
      link.add(k, grp); wire(grp, k, link);
      return { k, s, path, stopLen: best, train, lbl, prog: { p: 0 } };
    });
    host.appendChild(svg);
    const place = st => {
      const L = st.s.start + (st.stopLen - st.s.start) * st.prog.p, pt = st.path.getPointAtLength(L);
      st.train.setAttribute('x', (pt.x - st.s.x - TR / 2).toFixed(2)); st.train.setAttribute('y', (pt.y - st.s.y - TR / 2).toFixed(2));
    };
    const absorbed = st => { st.train.setAttribute('x', -IN / 2); st.train.setAttribute('y', -IN / 2); st.train.setAttribute('width', IN); st.train.setAttribute('height', IN); st.train.setAttribute('rx', 0); st.train.setAttribute('stroke-width', 0); };
    return {
      finished() { stops.forEach(absorbed); },
      prepare() { stops.forEach(st => gsap.set(st.lbl, { autoAlpha: 0 })); },
      extend(tl, from, E) {
        stops.forEach((st, i) => {
          const at = from + .1 + i * .2;
          tl.fromTo(st.prog, { p: 0 }, { p: 1, duration: 1.1, ease: E.glide, onUpdate: () => place(st) }, at);
          tl.fromTo(st.train, { attr: { x: -TR / 2, y: -TR / 2, width: TR, height: TR, rx: TR / 2, 'stroke-width': TS } },
            { attr: { x: -IN / 2, y: -IN / 2, width: IN, height: IN, rx: 0, 'stroke-width': 0 }, duration: .28, ease: 'power3.out', immediateRender: false }, at + 1.1);
          tl.fromTo(st.lbl, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: .25, ease: 'power2.out' }, at + 1.2);
        });
        return from + .1 + (stops.length - 1) * .2 + 1.5;
      },
    };
  }

  /* ================= OVER HYPERCUBE: the hypercube, drawn flat with a trim-path reveal ================= */
  function buildAbout(host, keys, labels, link) {
    const L = 190, C = .59, CX = 640, CY = 250, SW = 20;
    const AX = [[L, 0], [0, -L], [C * L, -C * L], [C * L, C * L]];
    const COL = [RED, BLUE, YELLOW, BLACK], ORDER = [3, 2, 1, 0];          // red drawn last: on top at the corners
    const svg = el('svg', { viewBox: '0 0 1280 500', role: 'group', 'aria-label': labels.join(', ') });
    el('rect', { width: 1280, height: 500, fill: '#FFFFFF' }, svg);
    const pos = v => { let x = CX - (L + 2 * C * L) / 2, y = CY + L / 2; for (let k = 0; k < 4; k++) if (v >> k & 1) { x += AX[k][0]; y += AX[k][1]; } return [x, y]; };
    const cube = el('g', { fill: 'none', 'stroke-width': SW, 'stroke-linecap': 'round' }, svg);
    const edges = [];
    for (const k of ORDER) for (let v = 0; v < 16; v++) {
      if (v >> k & 1) continue;
      let a = pos(v), b = pos(v | 1 << k);
      if (Math.hypot(b[0] - CX, b[1] - CY) < Math.hypot(a[0] - CX, a[1] - CY)) { const t = a; a = b; b = t; }
      const near = Math.hypot(a[0] - CX, a[1] - CY), len = Math.hypot(b[0] - a[0], b[1] - a[1]), angle = Math.atan2(a[1] - CY, a[0] - CX);
      // trim path in real units (no pathLength: WebKit ignores it on <line>)
      const line = el('line', { x1: a[0].toFixed(2), y1: a[1].toFixed(2), x2: b[0].toFixed(2), y2: b[1].toFixed(2), stroke: COL[k],
        'stroke-dasharray': `${len.toFixed(2)} ${(len + 2 * SW).toFixed(2)}`, 'stroke-dashoffset': len.toFixed(2) }, cube);
      edges.push({ line, near, len, angle });
    }
    const bits = (x, y, z, w) => x | y << 1 | z << 2 | w << 3;
    const CORNER = { over: [bits(0, 1, 1, 0), 'end'], team: [bits(1, 1, 1, 1), 'start'], vacature: [bits(0, 1, 0, 0), 'end'], contact: [bits(0, 0, 0, 0), 'end'], locatie: [bits(1, 0, 0, 1), 'start'] };
    const nodes = keys.map((k, i) => {
      const [x, y] = pos(CORNER[k][0]), side = CORNER[k][1];
      const g = el('g', { class: 'hc-pl', tabindex: 0, role: 'link', 'aria-label': labels[i] }, svg);
      const inner = el('g', { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})` }, g);
      const c = chip(inner, labels[i], side === 'end' ? -26 : 26, 0, side);
      const hx = Math.min(-21, c.x - 6), hw = Math.max(c.x + c.w + 6, 21) - hx;
      el('rect', { x: hx, y: -24, width: hw, height: 48, fill: 'transparent' }, inner);
      el('rect', { x: -15, y: -15, width: 30, height: 30, fill: '#FFFFFF', stroke: BLACK, 'stroke-width': 7, class: 'hc-n' }, inner);
      link.add(k, g); wire(g, k, link);
      return { k, g, x, y };
    });
    host.appendChild(svg);
    return {
      finished() { edges.forEach(e => e.line.setAttribute('stroke-dashoffset', 0)); },
      prepare() {
        edges.forEach(e => gsap.set(e.line, { autoAlpha: 0 }));
        nodes.forEach(n => gsap.set(n.g, { scale: 0, autoAlpha: 0, svgOrigin: `${n.x} ${n.y}` }));
      },
      extend(tl, from, E) {
        // centre -> out: inner tips first, equal distances taken in order around the centre; starts evenly spaced
        const start = from + .1, SPREAD = 1.6, DRAW = 1.0;
        const ord = edges.slice().sort((p, q) => (Math.round(p.near / 8) - Math.round(q.near / 8)) || (p.angle - q.angle));
        ord.forEach((e, i) => {
          const at = start + (i / (ord.length - 1)) * SPREAD;
          tl.set(e.line, { autoAlpha: 1 }, at);
          tl.fromTo(e.line, { attr: { 'stroke-dashoffset': e.len } }, { attr: { 'stroke-dashoffset': 0 }, duration: DRAW, ease: E.glide, immediateRender: false }, at);
        });
        const built = start + SPREAD + DRAW, POP = .5, STAGGER = .16;
        nodes.forEach((n, i) => tl.fromTo(n.g, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: POP, ease: 'back.out(2.2)', svgOrigin: `${n.x} ${n.y}`, immediateRender: false }, built + .1 + i * STAGGER));
        return built + .1 + (nodes.length - 1) * STAGGER + POP;
      },
    };
  }

  /* ================= text: random 3-6 word groups, keeping links and bold text intact ================= */
  function splitGroups(p) {
    const texts = []; const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) texts.push(walker.currentNode);
    const words = []; texts.forEach((t, ti) => { (t.nodeValue.match(/\S+/g) || []).forEach(() => words.push(ti)); });
    const n = words.length; if (!n) return [];
    const sizes = []; for (let left = n; left > 0;) { const s = Math.min(left, 3 + Math.floor(Math.random() * 4)); sizes.push(s); left -= s; }
    const last = sizes.length - 1;
    if (last > 0 && sizes[last] < 3) { if (sizes[last - 1] + sizes[last] <= 6) { sizes[last - 1] += sizes[last]; sizes.pop(); } else { const need = 3 - sizes[last]; sizes[last - 1] -= need; sizes[last] += need; } }
    const groupOf = []; sizes.forEach((s, gi) => { for (let i = 0; i < s; i++) groupOf.push(gi); });
    const groups = sizes.map(() => []);
    let w = 0;
    texts.forEach(t => {
      const parts = t.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
      let span = null, spanGroup = -1;
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { if (span) span.appendChild(document.createTextNode(part)); else frag.appendChild(document.createTextNode(part)); return; }
        const gi = groupOf[w++];
        if (span && gi !== spanGroup) {               // close the previous group's span; its trailing space moves outside
          const tail = span.lastChild && /^\s+$/.test(span.lastChild.nodeValue || '') ? span.removeChild(span.lastChild) : null;
          frag.appendChild(span); if (tail) frag.appendChild(tail); span = null;
        }
        if (!span) { span = document.createElement('span'); span.className = 'hc-grp'; spanGroup = gi; groups[gi].push(span); }
        span.appendChild(document.createTextNode(part));
      });
      if (span) { const tail = span.lastChild && /^\s+$/.test(span.lastChild.nodeValue || '') ? span.removeChild(span.lastChild) : null; frag.appendChild(span); if (tail) frag.appendChild(tail); }
      t.parentNode.replaceChild(frag, t);
    });
    return groups;                                     // array of groups; each group = its spans (may span inline elements)
  }

  /* ================= one hero page ================= */
  const KEYS = { sport: ['hq', 'diensten', 'cases', 'opdrachtgevers', 'rankings'], mobility: ['hq', 'diensten', 'cases', 'opdrachtgevers'], about: ['over', 'team', 'contact', 'locatie', 'vacature'] };
  const BUILD = { sport: buildSport, mobility: buildMobility, about: buildAbout };

  function initPage(page) {
    const type = page.dataset.page;
    const stage = page.querySelector('.hc-stage'), heroHost = page.querySelector('.hc-hero'), menu = page.querySelector('.hc-menu');
    const copy = page.querySelector('.hc-copy');
    const tabbed = copy.querySelector('.tabbed');
    const nav = tabbed && tabbed.querySelector(':scope > ul.wpb_tabs_nav');
    const tabAs = nav ? [...nav.querySelectorAll(':scope > li > a')] : [];
    if (nav) nav.classList.add('hc-nav-hidden');
    const keys = KEYS[type].slice(0, tabAs.length);
    const labels = tabAs.map(a => a.textContent.replace(/\s+/g, ' ').trim());
    const panes = tabbed ? [...tabbed.querySelectorAll(':scope > .wpb_tab')] : [];

    // menu under the image, built from the page's own tabs
    const link = makeLink();
    const LC = { mobility: { hq: BLACK, diensten: BLUE, cases: RED, opdrachtgevers: YELLOW } }[type] || {};
    const items = keys.map((k, i) => {
      const a = document.createElement('a');
      a.className = 'hc-mi' + (i === 0 ? ' active' : ''); a.href = tabAs[i].getAttribute('href') || '#'; a.dataset.k = k;
      if (LC[k]) a.style.setProperty('--lc', LC[k]);
      a.innerHTML = '<span class="hc-m" aria-hidden="true"></span>'; a.appendChild(document.createTextNode(labels[i]));
      menu.appendChild(a); link.add(k, a); wire(a, k, link);
      return a;
    });
    const art = BUILD[type](heroHost, keys, labels, link);

    // clicking a menu item or an image marker opens the theme's own tab, then brings its content into view
    const revealedPanes = new Set([0]);
    let ownScrollUntil = 0;
    link.onClick = k => {
      const i = keys.indexOf(k); if (i < 0) return;
      tabAs[i].click();
      items.forEach((a, j) => a.classList.toggle('active', j === i));
      requestAnimationFrame(() => {
        const pane = panes[i];
        if (pane && !revealedPanes.has(i) && !reduce && window.gsap) { revealedPanes.add(i); quickReveal(pane); }
        const top = copy.getBoundingClientRect().top;
        if (top > innerHeight * .75 || top < 0) { ownScrollUntil = performance.now() + 1500; window.scrollTo({ top: scrollY + top - (parseFloat(getComputedStyle(root).getPropertyValue('--hc-header')) || 0) - 20, behavior: reduce ? 'auto' : 'smooth' }); }
      });
    };
    function quickReveal(pane) {                       // a newly opened tab: its text arrives quickly, in reading order
      pane.querySelectorAll('.wpb_text_column p').forEach(p => {
        if (p.textContent.trim().length < 60 || p.closest('.hc-done')) return;
        const groups = splitGroups(p); p.classList.add('hc-done');
        groups.forEach((spans, i) => gsap.fromTo(spans, { left: 30, autoAlpha: 0 }, { left: 0, autoAlpha: 1, duration: .45, ease: 'power2.out', delay: i * .05 }));
      });
    }
    return { page, stage, heroHost, menu, copy, items, art, panes, ownScroll: () => performance.now() < ownScrollUntil };
  }

  /* ================= run ================= */
  function start() {
    const pages = [...document.querySelectorAll('.hc-page')];
    const home = document.querySelector('.hc-home3d');
    measureFrame();
    addEventListener('resize', () => measureFrame());
    // the theme adjusts its own spacing after load: align again once it has settled
    const settle = () => { measureFrame(); if (window.ScrollTrigger && pages.length) ScrollTrigger.refresh(); };
    addEventListener('load', settle);
    document.fonts && document.fonts.ready.then(settle);
    [300, 1200].forEach(t => setTimeout(settle, t));
    if (!pages.length) { root.classList.remove('js-hc'); return; }
    const P = pages.map(initPage);

    if (reduce || !window.gsap || !window.ScrollTrigger) {           // the finished page, no motion
      P.forEach(p => { p.art.finished && p.art.finished(); p.page.querySelector('h2.hc-title').style.opacity = 1; p.page.querySelector('.hc-sq').style.visibility = 'visible';
        p.page.querySelectorAll('.hc-gsq, .hc-gtitle, .hc-cue').forEach(e => (e.style.display = 'none')); placeCopy(p); });
      root.classList.remove('js-hc');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const CE = window.CustomEase; if (CE) gsap.registerPlugin(CE);
    const E = CE ? { inOut: CE.create('hc.inOut', '0.76,0,0.24,1'), glide: CE.create('hc.glide', '0.55,0.05,0.2,1'), settle: CE.create('hc.settle', '0.83,0,0.17,1'), reveal: CE.create('hc.reveal', '0.16,1,0.3,1') }
      : { inOut: 'power4.inOut', glide: 'power2.inOut', settle: 'expo.inOut', reveal: 'expo.out' };

    function placeCopy(p) {                          // the tab content follows 36px under the menu
      const bottom = p.menu.offsetTop + p.menu.offsetHeight;
      const mt = -Math.max(0, p.stage.offsetHeight - bottom - 36) + 'px';
      if (p.copy.style.marginTop === mt) return false; p.copy.style.marginTop = mt; return true;
    }

    const revealing = [];
    P.forEach(p => {
      const { page, stage } = p;
      const sq = stage.querySelector('.hc-sq'), title = stage.querySelector('h2.hc-title'), t1 = title.querySelector('.hc-t1'), t2 = title.querySelector('.hc-t2');
      const rect = stage.querySelector('.hc-gsq rect'), gt = stage.querySelector('.hc-gtitle'), g1 = gt.querySelector('.hc-t1'), g2 = gt.querySelector('.hc-t2');
      const hero = p.heroHost, cue = stage.querySelector('.hc-cue');
      const m = {};
      function measure() {
        const R = stage.getBoundingClientRect();
        const rel = e => { const r = e.getBoundingClientRect(); return { x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height }; };
        m.sq = rel(sq); m.t1 = rel(t1); m.t2 = rel(t2);
        m.b = parseFloat(getComputedStyle(sq).borderTopWidth);
        const head = parseFloat(getComputedStyle(root).getPropertyValue('--hc-header')) || 0;
        const vw = document.documentElement.clientWidth, vh = innerHeight;
        m.S = Math.min(vw * .84, (vh - head) * .8);
        m.cx = vw / 2 - R.left; m.cy = head + (vh - head) / 2;
        m.s0 = Math.min(.8 * m.S / Math.max(m.t1.w, m.t2.w), .34 * m.S / m.t1.h);
        m.gap = m.t1.h * .06;
        const rowW = (m.t2.x + m.t2.w) - m.sq.x;
        m.dx = m.cx - (m.sq.x + rowW / 2); m.dy = m.cy - (m.sq.y + m.sq.h / 2);
        gsap.set([g1, g2], { transformOrigin: '50% 0%' });
        gsap.set(g1, { left: m.t1.x, top: m.t1.y }); gsap.set(g2, { left: m.t2.x, top: m.t2.y });
        gt.style.visibility = 'visible';
      }
      measure();
      placeCopy(p);
      ScrollTrigger.addEventListener('refresh', () => { if (placeCopy(p)) requestAnimationFrame(() => ScrollTrigger.refresh()); });

      const box = { x: 0, y: 0, w: 0, sw: 8 };
      const draw = () => { rect.setAttribute('x', box.x + box.sw / 2); rect.setAttribute('y', box.y + box.sw / 2); rect.setAttribute('width', Math.max(0, box.w - box.sw)); rect.setAttribute('height', Math.max(0, box.w - box.sw)); rect.setAttribute('stroke-width', box.sw); };
      const stackX = t => m.cx - (t.x + t.w / 2);
      const topLine = sc => m.cy - m.t1.h * sc - m.gap * sc - m.t1.y;
      const botLine = sc => m.cy + m.gap * sc - m.t2.y;

      const tl = gsap.timeline({ paused: true });
      const T = { shrink: 0, spread: .7, join: 1.25, settle: 2.15, image: 3.25 };
      tl.addLabel('k-open', 0).addLabel('k-centred', 2.0).addLabel('k-landed', 3.17).addLabel('k-shown', 4.3);
      // 1 shrink - 2 spread on X - 3 join on one line (still centred) - 4 settle (square leads, words follow)
      tl.fromTo(box, { x: () => m.cx - m.S / 2, y: () => m.cy - m.S / 2, w: () => m.S, sw: () => Math.max(10, m.S * .03) },
        { x: () => m.sq.x + m.dx, y: () => m.sq.y + m.dy, w: () => m.sq.w, sw: () => m.b, duration: 1, ease: E.inOut, onUpdate: draw }, T.shrink);
      tl.fromTo(g1, { x: () => stackX(m.t1), y: () => topLine(m.s0), scale: () => m.s0 }, { x: () => stackX(m.t1), y: () => topLine(1), scale: 1, duration: .87, ease: E.glide, force3D: false }, T.shrink + .08);
      tl.fromTo(g2, { x: () => stackX(m.t2), y: () => botLine(m.s0), scale: () => m.s0 }, { x: () => stackX(m.t2), y: () => botLine(1), scale: 1, duration: .87, ease: E.glide, force3D: false }, T.shrink + .08);
      tl.to(cue, { autoAlpha: 0, duration: .2, ease: 'none' }, T.shrink);
      tl.to(g1, { x: () => m.dx, duration: .75, ease: E.glide, force3D: false }, T.spread);
      tl.to(g2, { x: () => m.dx, duration: .77, ease: E.glide, force3D: false }, T.spread + .08);
      tl.to(g1, { y: () => m.dy, duration: .6, ease: E.inOut, force3D: false }, T.join);
      tl.to(g2, { y: () => m.dy, duration: .6, ease: E.inOut, force3D: false }, T.join);
      tl.fromTo(box, { x: () => m.sq.x + m.dx, y: () => m.sq.y + m.dy, w: () => m.sq.w, sw: () => m.b },
        { x: () => m.sq.x, y: () => m.sq.y, w: () => m.sq.w, sw: () => m.b, duration: .8, ease: E.settle, onUpdate: draw, immediateRender: false }, T.settle);
      tl.to([g1, g2], { x: 0, y: 0, duration: .8, ease: E.settle, force3D: false }, T.settle + .12);
      // 5 image (rises 110px while fading in), then the menu item by item
      tl.fromTo(hero, { y: 110, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, ease: E.reveal }, T.image);
      tl.fromTo(p.items, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .5, ease: E.glide, stagger: .08 }, T.image + .5);
      if (p.art.prepare) p.art.prepare();
      let len = Math.max(4.3, tl.duration());
      if (p.art.extend) { len = p.art.extend(tl, len, E); tl.addLabel('k-done', len); }
      tl.to({}, { duration: .3 }, len);
      const readyAt = len;
      let shownResolve, shownFired = false; const shown = new Promise(r => (shownResolve = r));
      const check = () => { if (!shownFired && tl.time() >= readyAt - 1e-3) { shownFired = true; shownResolve(); } };

      // forward only; the playhead eases towards the furthest point reached
      let reached = 0, st = null;
      const advance = v => { if (v <= reached + 1e-4) return; reached = v; gsap.to(tl, { progress: reached, duration: 1.2, ease: 'power2.out', overwrite: true, onUpdate: check, onComplete: check }); };
      const keypoints = () => Object.values(tl.labels).map(t => t / tl.duration()).sort((a, b) => a - b);
      st = ScrollTrigger.create({
        trigger: stage, start: 'top top', end: () => '+=' + Math.round(innerHeight * (len + .3) * .62),
        pin: page, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => advance(self.progress),
        snap: { snapTo: v => (st && st.direction < 0) ? v : (keypoints().find(k => k >= v - 1e-4) ?? v), inertia: false, duration: { min: .35, max: 1.1 }, delay: .1, ease: 'power2.inOut' },
      });
      p.st = st;
      // the pin freezes the page at the height it had when measured; opening another tab (or an image loading)
      // changes the content height, so re-measure and the rest of the page (footer) follows the new bottom
      if (window.ResizeObserver) {
        let h = p.copy.offsetHeight, t = 0;
        new ResizeObserver(() => {
          const n = p.copy.offsetHeight; if (Math.abs(n - h) < 2) return; h = n;
          clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 60);
        }).observe(p.copy);
      }
      ScrollTrigger.addEventListener('refresh', () => {
        measure(); const at = tl.progress(); tl.invalidate().progress(1, true).progress(at); draw();
        reached = Math.max(reached, st ? st.progress : 0);
        if (reached > at + 1e-4) gsap.to(tl, { progress: reached, duration: 1.2, ease: 'power2.out', overwrite: true, onUpdate: check, onComplete: check });
      });

      // the tab content sits just under the menu, i.e. inside the first screen on short or narrow windows:
      // keep it out of sight (and clicks) while the title and image play, bring it in as the text starts
      gsap.set(p.copy, { opacity: 0, pointerEvents: 'none' });
      shown.then(() => gsap.to(p.copy, { opacity: 1, duration: .45, ease: 'power1.out', onComplete: () => gsap.set(p.copy, { clearProps: 'opacity,pointerEvents' }) }));

      // text of the first tab: paragraphs in sequence, each in 3-6 word groups (reading order), after the image
      let chain = shown;
      page.querySelectorAll('.hc-reveal').forEach(par => {
        const groups = splitGroups(par);
        groups.forEach(spans => gsap.set(spans, { left: 36 + Math.random() * 28, autoAlpha: 0 }));
        par.style.visibility = 'visible';
        const tlp = gsap.timeline({ paused: true });
        groups.forEach((spans, i) => tlp.to(spans, { left: 0, autoAlpha: 1, duration: .55, ease: E.glide }, i * .13));
        revealing.push({ p: par, tlp, page });
        const onScreen = new Promise(res => ScrollTrigger.create({ trigger: par, pinnedContainer: page, start: 'top bottom', once: true, onEnter: res }));
        chain = chain.then(() => onScreen).then(() => new Promise(res => { tlp.eventCallback('onComplete', res); tlp.play(); }));
      });
    });

    // keep pace: a reveal that falls behind your scrolling speeds up (up to 10x); pushing against the gate: at least 3x
    gsap.ticker.add(() => {
      for (const r of revealing) {
        if (!r.tlp.isActive()) continue;
        const b = r.p.getBoundingClientRect();
        const target = gsap.utils.clamp(0, 1, (innerHeight * .7 - b.top) / Math.max(1, b.height));
        const lag = target - r.tlp.progress();
        let want = lag > .02 ? Math.min(10, 1 + lag * 14) : 1;
        if ((r.page.__pushUntil || 0) > performance.now()) want = Math.max(want, 3);
        const now = r.tlp.timeScale(); r.tlp.timeScale(now + (want - now) * .15);
      }
    });

    // scroll gate: you can't scroll past the image until the text on screen has fully appeared
    const op = e => +getComputedStyle(e).opacity;
    const gates = P.map(p => ({ p, groups: [...p.page.querySelectorAll('.hc-reveal .hc-grp')], y() { return this.p.st ? this.p.st.end + this.p.heroHost.offsetTop + this.p.heroHost.offsetHeight : Infinity; } }));
    // only words that are on screen count (the theme hides closed tabs by moving them 9999px off to the left)
    const pending = g => g.groups.some(e => { const r = e.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.top < innerHeight - 8 && op(e) < .99; });
    const nextGate = () => gates.find(g => g.y() > scrollY - 2);
    const hold = (g, by) => {
      if (g.p.ownScroll()) return false;
      const G = g.y(); if (scrollY + by < G - 1 || !pending(g)) return false;
      if (scrollY < G - 1) scrollTo(0, G);
      g.p.page.__pushUntil = performance.now() + 450; return true;
    };
    addEventListener('wheel', e => { if (e.deltaY <= 0) return; const g = nextGate(); if (g && hold(g, e.deltaY)) e.preventDefault(); }, { passive: false });
    let touchY = null;
    addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchmove', e => { if (touchY === null) return; const dy = touchY - e.touches[0].clientY; if (dy <= 0) return; const g = nextGate(); if (g && hold(g, dy)) e.preventDefault(); }, { passive: false });
    addEventListener('keydown', e => {
      const step = { ArrowDown: 40, PageDown: innerHeight * .9, ' ': innerHeight * .9, End: 1e9 }[e.key];
      if (!step || (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]'))) return;
      const g = nextGate(); if (g && hold(g, step)) e.preventDefault();
    });
    addEventListener('scroll', () => {
      for (const g of gates) { const G = g.y(); if (!g.p.ownScroll() && scrollY > G + 1 && scrollY < G + innerHeight && pending(g)) { scrollTo(0, G); g.p.page.__pushUntil = performance.now() + 450; break; } }
    }, { passive: true });

    root.classList.remove('js-hc');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
