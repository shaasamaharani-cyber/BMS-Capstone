const IMG = JSON.parse(figma.root.getSharedPluginData('bms', 'img') || '{}');
const FW = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Light', 'Extra Bold', 'Italic', 'Medium Italic', 'Semi Bold Italic', 'Bold Italic'];
async function fonts() {
  await Promise.all(FW.map((s) => figma.loadFontAsync({ family: 'Inter', style: s }).catch(() => {})));
  await Promise.all(['Regular', 'Medium', 'SemiBold', 'Bold'].map((s) => figma.loadFontAsync({ family: 'IBM Plex Mono', style: s }).catch(() => {})));
}
function paint(c) {
  const [h, a] = c.split('/');
  const p = { type: 'SOLID', color: { r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 } };
  if (a !== undefined) p.opacity = +a;
  return p;
}
function rgba(c) { const p = paint(c); return Object.assign({ a: p.opacity === undefined ? 1 : p.opacity }, p.color); }
function radius(n, r) {
  if (r === undefined) return;
  if (typeof r === 'number') n.cornerRadius = r;
  else { n.topLeftRadius = r[0]; n.topRightRadius = r[1]; n.bottomRightRadius = r[2]; n.bottomLeftRadius = r[3]; }
}
const MONO = { 'Semi Bold': 'SemiBold', 'Extra Bold': 'Bold', 'Light': 'Regular', 'Thin': 'Regular', 'Extra Light': 'Regular', 'Black': 'Bold' };
function build(s, parent) {
  let n;
  if (s.t === 't') {
    n = figma.createText();
    let st = s.wt || 'Regular';
    if (s.m) n.fontName = { family: 'IBM Plex Mono', style: (MONO[st] || st) + (s.i ? ' Italic' : '').replace('Regular Italic', 'Italic') };
    else n.fontName = { family: 'Inter', style: s.i ? (st === 'Regular' ? 'Italic' : st + ' Italic') : st };
    n.fontSize = s.f;
    n.characters = s.s;
    n.fills = [paint(s.c)];
    if (s.lh) n.lineHeight = { unit: 'PIXELS', value: s.lh };
    if (s.ls) n.letterSpacing = { unit: 'PIXELS', value: s.ls };
    if (s.u) n.textDecoration = 'UNDERLINE'; else if (s.st) n.textDecoration = 'STRIKETHROUGH';
    if (s.al) n.textAlignHorizontal = s.al === 'C' ? 'CENTER' : 'RIGHT';
    if (s.runs) for (const [a, b, q] of s.runs) {
      const qs = q.wt || 'Regular';
      n.setRangeFontName(a, b, q.m ? { family: 'IBM Plex Mono', style: (MONO[qs] || qs) } : { family: 'Inter', style: q.i ? (qs === 'Regular' ? 'Italic' : qs + ' Italic') : qs });
      n.setRangeFontSize(a, b, q.f); n.setRangeFills(a, b, [paint(q.c)]);
      n.setRangeTextDecoration(a, b, q.u ? 'UNDERLINE' : q.st ? 'STRIKETHROUGH' : 'NONE');
      n.setRangeLetterSpacing(a, b, { unit: 'PIXELS', value: q.ls || 0 });
    }
    n.name = s.s.slice(0, 40);
    parent.appendChild(n);
    if (s.nw && n.characters.length > 1) {
      n.textAutoResize = 'WIDTH_AND_HEIGHT';
      const d = (s.nw - n.width) / (n.characters.length);
      if (Math.abs(d) > 0.003) {
        if (s.runs) for (const [a, b, q] of s.runs) n.setRangeLetterSpacing(a, b, { unit: 'PIXELS', value: (q.ls || 0) + d });
        else n.letterSpacing = { unit: 'PIXELS', value: (s.ls || 0) + d };
      }
    }
    if (s.trunc && s.al) { n.textAutoResize = 'NONE'; n.resize(Math.max(1, s.w), s.lh); n.textTruncation = 'ENDING'; }
    else if (s.wr) { n.textAutoResize = 'HEIGHT'; n.resize(Math.max(1, s.w), n.height); }
    else n.textAutoResize = 'WIDTH_AND_HEIGHT';
    n.x = s.x; n.y = s.y;
    return n;
  }
  if (s.t === 's') {
    try { n = figma.createNodeFromSvg(s.v); } catch (e) { n = figma.createFrame(); n.fills = []; }
    n.name = 'icon'; parent.appendChild(n); n.x = s.x; n.y = s.y;
    if (Math.abs(n.width - s.w) > 0.5 || Math.abs(n.height - s.h) > 0.5) n.resize(Math.max(0.01, s.w), Math.max(0.01, s.h));
    return n;
  }
  if (s.t === 'i') {
    n = figma.createRectangle(); n.name = 'image'; parent.appendChild(n);
    n.x = s.x; n.y = s.y; n.resize(Math.max(0.01, s.w), Math.max(0.01, s.h));
    const h = IMG[s.k];
    n.fills = h ? [{ type: 'IMAGE', imageHash: h, scaleMode: s.fit || 'FIT' }] : [paint('#e9ecef')];
    radius(n, s.r);
    return n;
  }
  n = figma.createFrame();
  n.name = s.lk ? ((s.lk.tag === 'a' ? 'Link' : 'Button') + ' / ' + (s.lk.txt || s.n)).slice(0, 60) : s.n;
  parent.appendChild(n);
  n.x = s.x; n.y = s.y; n.resize(Math.max(0.01, s.w), Math.max(0.01, s.h));
  n.fills = s.gr ? [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: s.gr.map((c, i) => ({ position: i / (s.gr.length - 1), color: rgba(c) })) }] : s.bg ? [paint(s.bg)] : [];
  n.clipsContent = !!s.cl;
  if (s.bd) {
    n.strokes = [paint(s.bd[0])]; n.strokeAlign = 'INSIDE';
    const w = s.bd[1];
    if (typeof w === 'number') n.strokeWeight = w;
    else { n.strokeTopWeight = w[0]; n.strokeRightWeight = w[1]; n.strokeBottomWeight = w[2]; n.strokeLeftWeight = w[3]; }
    if (s.dash) n.dashPattern = [4, 3];
  }
  radius(n, s.r);
  if (s.sh) n.effects = s.sh.map((e) => ({ type: e[5] ? 'INNER_SHADOW' : 'DROP_SHADOW', color: rgba(e[0]), offset: { x: e[1], y: e[2] }, radius: e[3], spread: e[4], visible: true, blendMode: 'NORMAL' }));
  if (s.op !== undefined) n.opacity = s.op;
  if (s.lk) n.setSharedPluginData('bms', 'lk', JSON.stringify(s.lk));
  if (s.id) n.setSharedPluginData('bms', 'id', s.id);
  for (const c of s.c || []) build(c, n);
  return n;
}
return { fonts, build, paint, IMG };
