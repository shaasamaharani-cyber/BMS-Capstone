// Re-draws a Chart.js chart into a recording 2D context and returns an SVG string with vector paths and text.
window.__chartSvg = function (cv) {
  const Chart = window.__Chart;
  const ch = Chart && Chart.getChart(cv);
  if (!ch) return null;
  const real = document.createElement('canvas').getContext('2d');
  const r2 = (v) => Math.round(v * 100) / 100;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const W = ch.width, H = ch.height;
  const out = [];
  const st = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, dash: [], dashOff: 0, font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic', alpha: 1, cap: 'butt', join: 'miter', m: [1, 0, 0, 1, 0, 0] };
  const stack = [];
  let path = [];
  const tp = (x, y) => { const m = st.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; };
  function colorAttr(v, kind) {
    if (typeof v !== 'string') return `${kind}="none"`;
    real.fillStyle = '#000'; real.fillStyle = v; const c = real.fillStyle;
    let a = st.alpha, hex = c;
    const m = c.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/);
    if (m) { hex = '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join(''); a *= +m[4]; }
    return `${kind}="${hex}"` + (a < 1 ? ` ${kind}-opacity="${r2(a)}"` : '');
  }
  const P = {
    moveTo(x, y) { path.push('M' + tp(x, y).map(r2).join(' ')); },
    lineTo(x, y) { path.push('L' + tp(x, y).map(r2).join(' ')); },
    bezierCurveTo(a, b, c, d, x, y) { path.push('C' + [...tp(a, b), ...tp(c, d), ...tp(x, y)].map(r2).join(' ')); },
    quadraticCurveTo(a, b, x, y) { path.push('Q' + [...tp(a, b), ...tp(x, y)].map(r2).join(' ')); },
    closePath() { path.push('Z'); },
    rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); },
    arc(cx, cy, r, a0, a1, ccw) {
      let sweep = a1 - a0;
      if (ccw) { if (sweep > 0) sweep -= Math.PI * 2; } else if (sweep < 0) sweep += Math.PI * 2;
      if (Math.abs(sweep) > Math.PI * 2) sweep = Math.sign(sweep) * Math.PI * 2;
      const n = Math.max(4, Math.ceil(Math.abs(sweep) / (Math.PI / 12)));
      for (let i = 0; i <= n; i++) {
        const a = a0 + (sweep * i) / n; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        if (i === 0 && !path.length) this.moveTo(x, y); else this.lineTo(x, y);
      }
    },
    ellipse(cx, cy, rx, ry, rot, a0, a1, ccw) { this.arc(cx, cy, rx, a0, a1, ccw); },
  };
  function strokeAttrs() {
    let s = colorAttr(st.strokeStyle, 'stroke') + ` stroke-width="${r2(st.lineWidth * Math.hypot(st.m[0], st.m[1]))}" stroke-linecap="${st.cap}" stroke-linejoin="${st.join}"`;
    if (st.dash.length) s += ` stroke-dasharray="${st.dash.join(' ')}"`;
    return s;
  }
  function pathFrom(p) { return p && p.__r ? p.__r : path; }
  const ctx = {
    canvas: cv,
    get fillStyle() { return st.fillStyle; }, set fillStyle(v) { st.fillStyle = v; },
    get strokeStyle() { return st.strokeStyle; }, set strokeStyle(v) { st.strokeStyle = v; },
    get lineWidth() { return st.lineWidth; }, set lineWidth(v) { st.lineWidth = v; },
    get font() { return st.font; }, set font(v) { st.font = v; },
    get textAlign() { return st.textAlign; }, set textAlign(v) { st.textAlign = v; },
    get textBaseline() { return st.textBaseline; }, set textBaseline(v) { st.textBaseline = v; },
    get globalAlpha() { return st.alpha; }, set globalAlpha(v) { st.alpha = v; },
    get lineCap() { return st.cap; }, set lineCap(v) { st.cap = v; },
    get lineJoin() { return st.join; }, set lineJoin(v) { st.join = v; },
    get lineDashOffset() { return st.dashOff; }, set lineDashOffset(v) { st.dashOff = v; },
    miterLimit: 10, shadowBlur: 0, shadowColor: 'transparent', shadowOffsetX: 0, shadowOffsetY: 0, globalCompositeOperation: 'source-over', imageSmoothingEnabled: true, direction: 'ltr',
    save() { stack.push(JSON.parse(JSON.stringify(st))); },
    restore() { const s = stack.pop(); if (s) Object.assign(st, s); },
    setLineDash(d) { st.dash = d || []; }, getLineDash() { return st.dash; },
    setTransform(a, b, c, d, e, f) { if (typeof a === 'object') { st.m = [a.a, a.b, a.c, a.d, a.e, a.f]; } else st.m = [a, b, c, d, e, f]; },
    resetTransform() { st.m = [1, 0, 0, 1, 0, 0]; },
    getTransform() { const m = st.m; return new DOMMatrix(m); },
    transform(a, b, c, d, e, f) { const m = st.m; st.m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]]; },
    translate(x, y) { this.transform(1, 0, 0, 1, x, y); },
    scale(x, y) { this.transform(x, 0, 0, y, 0, 0); },
    rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.transform(c, s, -s, c, 0, 0); },
    beginPath() { path = []; },
    moveTo: P.moveTo, lineTo: P.lineTo, bezierCurveTo: P.bezierCurveTo, quadraticCurveTo: P.quadraticCurveTo, closePath: P.closePath, rect: P.rect, arc: P.arc, ellipse: P.ellipse,
    roundRect(x, y, w, h) { P.rect.call(ctx, x, y, w, h); },
    clip() {}, clearRect() {}, drawImage() {}, isPointInPath() { return false; },
    fill(p) { const d = (pathFrom(p)).join(''); if (d && typeof st.fillStyle === 'string') out.push(`<path d="${d}" ${colorAttr(st.fillStyle, 'fill')}/>`); },
    stroke(p) { const d = (pathFrom(p)).join(''); if (d && st.lineWidth > 0) out.push(`<path d="${d}" fill="none" ${strokeAttrs()}/>`); },
    fillRect(x, y, w, h) { const sv = path; path = []; P.rect.call(ctx, x, y, w, h); this.fill(); path = sv; },
    strokeRect(x, y, w, h) { const sv = path; path = []; P.rect.call(ctx, x, y, w, h); this.stroke(); path = sv; },
    measureText(t) { real.font = st.font; return real.measureText(t); },
    fillText(t, x, y) {
      real.font = st.font; const mt = real.measureText(t);
      let dx = 0; const al = st.textAlign;
      if (al === 'center') dx = -mt.width / 2; else if (al === 'right' || al === 'end') dx = -mt.width;
      let dy = 0; const asc = mt.fontBoundingBoxAscent, des = mt.fontBoundingBoxDescent;
      if (st.textBaseline === 'middle') dy = (asc - des) / 2; else if (st.textBaseline === 'top' || st.textBaseline === 'hanging') dy = asc; else if (st.textBaseline === 'bottom' || st.textBaseline === 'ideographic') dy = -des;
      const fm = st.font.match(/(?:(italic)\s+)?(?:(normal|bold|bolder|lighter|\d{3})\s+)?([\d.]+)px/);
      const size = fm ? +fm[3] : 12; const wt = fm && fm[2] ? fm[2].replace('normal', '400').replace('bold', '700') : '400';
      const m = st.m;
      out.push(`<text transform="matrix(${m.map(r2).join(' ')})" x="${r2(x + dx)}" y="${r2(y + dy)}" font-family="Inter" font-size="${size}" font-weight="${wt}" ${colorAttr(st.fillStyle, 'fill')}>${esc(t)}</text>`);
    },
    strokeText() {}, createLinearGradient() { return { addColorStop() {} }; }, createPattern() { return null; },
    getImageData() { return real.getImageData(0, 0, 1, 1); }, putImageData() {},
  };
  // Path2D recording for cached line paths
  ch.getSortedVisibleDatasetMetas().forEach((m) => { if (m.dataset) { m.dataset._path = undefined; } });
  const proto = Path2D.prototype;
  const saved = {};
  ['moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'closePath', 'rect', 'arc', 'ellipse'].forEach((k) => {
    saved[k] = proto[k];
    proto[k] = function (...a) { if (!this.__r) this.__r = []; const sv = path; path = this.__r; P[k].apply(ctx, a); this.__r = path; path = sv; return saved[k].apply(this, a); };
  });
  const old = ch.ctx;
  const holders = [ch, ...ch.boxes, ...ch.getSortedVisibleDatasetMetas().map((m) => m.controller)];
  if (ch.legend) holders.push(ch.legend); if (ch.titleBlock) holders.push(ch.titleBlock); if (ch.tooltip) holders.push(ch.tooltip);
  const swapped = [];
  for (const h of holders) for (const k of ['ctx', '_ctx']) if (h && h[k] === old) { h[k] = ctx; swapped.push([h, k]); }
  try { ch.draw(); } catch (e) { out.push(`<!-- ${esc(e.message)} -->`); }
  for (const [h, k] of swapped) h[k] = old;
  Object.assign(proto, saved);
  ch.getSortedVisibleDatasetMetas().forEach((m) => { if (m.dataset) { m.dataset._path = undefined; } });
  ch.draw();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
};
