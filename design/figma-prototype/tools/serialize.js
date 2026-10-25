// Walks a rendered DOM subtree and returns a compact tree for the Figma builder.
// Coordinates of each node are relative to its nearest emitted frame ancestor.
window.__ser = function (root, opts) {
  opts = opts || {};
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = {};
  function col(s) {
    if (!s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') return null;
    if (cache[s] !== undefined) return cache[s];
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    // alpha from canvas is premultiplied-ish; recover straight color
    let a = d[3] / 255;
    let out = null;
    if (a > 0.003) {
      const h = (v) => v.toString(16).padStart(2, '0');
      // read alpha precisely from string when present
      const m = s.match(/\/\s*([\d.]+%?)\s*\)$/) || (/^rgba|^hsla/.test(s) ? s.match(/()(?:,\s*)([\d.]+)\s*\)$/) : null);
      if (m) { const v = m[1] || m[2]; a = v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); }
      out = '#' + h(d[0]) + h(d[1]) + h(d[2]) + (a < 0.999 ? '/' + (+a.toFixed(3)) : '');
    }
    cache[s] = out; return out;
  }
  const W = { 100: 'Thin', 200: 'Extra Light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semi Bold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black' };
  const px = (v) => parseFloat(v) || 0;
  const r1 = (v) => Math.round(v * 10) / 10;
  const images = opts.images || {};
  function imgKey(src, el) {
    if (!images[src]) {
      try {
        const c = document.createElement('canvas');
        const bb = el.getBoundingClientRect();
        const sc = Math.min(1, (bb.width * 2) / (el.naturalWidth || 1));
        const w = Math.max(1, Math.round((el.naturalWidth || bb.width) * sc)), h = Math.max(1, Math.round((el.naturalHeight || bb.height) * sc));
        c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(el, 0, 0, w, h);
        images[src] = c.toDataURL('image/png').split(',')[1];
      } catch (e) { images[src] = null; }
    }
    return src;
  }
  function shadows(s) {
    if (!s || s === 'none') return null;
    const parts = s.split(/,(?![^(]*\))/);
    const out = [];
    for (const p of parts) {
      const cm = p.match(/(rgba?\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+)/i);
      const rest = p.replace(cm ? cm[0] : '', '').trim();
      const inset = /inset/.test(rest);
      const n = rest.replace('inset', '').trim().split(/\s+/).map(px);
      const c = col(cm ? cm[0] : 'rgba(0,0,0,0.2)');
      if (!c) continue;
      out.push([c, n[0] || 0, n[1] || 0, n[2] || 0, n[3] || 0, inset ? 1 : 0]);
    }
    return out.length ? out : null;
  }
  function boxStyle(cs, node) {
    const bg = col(cs.backgroundColor); if (bg) node.bg = bg;
    const sides = ['Top', 'Right', 'Bottom', 'Left'];
    const bw = sides.map((s) => cs['border' + s + 'Style'] === 'none' || cs['border' + s + 'Style'] === 'hidden' ? 0 : px(cs['border' + s + 'Width']));
    const bcIdx = bw.findIndex((w) => w > 0);
    if (bcIdx >= 0) {
      const c = col(cs['border' + sides[bcIdx] + 'Color']);
      if (c) node.bd = [c].concat(bw.every((w) => w === bw[0]) ? [bw[0]] : [bw]);
      if (cs['border' + sides[bcIdx] + 'Style'] === 'dashed') node.dash = 1;
    }
    const rr = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(px);
    if (rr.some((v) => v)) node.r = rr.every((v) => v === rr[0]) ? rr[0] : rr;
    const sh = shadows(cs.boxShadow); if (sh) node.sh = sh;
    if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
      const cols = (cs.backgroundImage.match(/(rgba?\([^)]*\)|oklch\([^)]*\))/g) || []).map(col).filter(Boolean);
      if (cols.length >= 2) node.gr = cols;
    }
  }
  const mcv = document.createElement('canvas').getContext('2d');
  function measure(text, c) {
    mcv.font = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
    const ls = c.letterSpacing && c.letterSpacing !== 'normal' ? px(c.letterSpacing) : 0;
    return mcv.measureText(text).width + ls * text.length;
  }
  function fontInfo(cs) {
    const fam = cs.fontFamily.toLowerCase();
    let wt = parseInt(cs.fontWeight, 10) || 400; wt = Math.min(900, Math.max(100, Math.round(wt / 100) * 100));
    const o = { f: r1(px(cs.fontSize)), wt: W[wt] };
    if (/mono|consolas|menlo/.test(fam)) o.m = 1;
    if (cs.fontStyle === 'italic') o.i = 1;
    const c = col(cs.color); o.c = c || '#000000';
    const ls = cs.letterSpacing; if (ls && ls !== 'normal' && px(ls)) o.ls = r1(px(ls));
    if (cs.lineHeight !== 'normal') o.lh = r1(px(cs.lineHeight));
    const td = cs.textDecorationLine; if (td && td.includes('underline')) o.u = 1; if (td && td.includes('line-through')) o.st = 1;
    return o;
  }
  function tf(s, cs) {
    const t = cs.textTransform;
    if (t === 'uppercase') return s.toUpperCase();
    if (t === 'lowercase') return s.toLowerCase();
    if (t === 'capitalize') return s.replace(/\b\w/g, (m) => m.toUpperCase());
    return s;
  }
  function textNodes(group, cs, ox, oy, out) {
    const pre = /pre/.test(cs.whiteSpace);
    while (group.length && !/\S/.test(group[0].data)) group.shift();
    while (group.length && !/\S/.test(group[group.length - 1].data)) group.pop();
    if (!group.length) return;
    const tn = group[0], tl = group[group.length - 1];
    let raw = group.map((g) => g.data).join('');
    const range = document.createRange(); range.setStart(tn, 0); range.setEnd(tl, tl.data.length);
    if (!pre) {
      const st = tn.data.search(/\S/); let en = tl.data.length; while (en > 0 && /\s/.test(tl.data[en - 1])) en--;
      range.setStart(tn, st); range.setEnd(tl, en);
      raw = range.toString().replace(/\s+/g, ' ');
    }
    place(range, raw, cs, tn, ox, oy, out, pre);
  }
  function place(range, raw, cs, tn, ox, oy, out, pre, runs) {
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0.5 && r.height > 0.5);
    if (!rects.length) return;
    // group rects into lines
    const lines = [];
    for (const r of rects) {
      const l = lines.find((L) => Math.abs(L.top - r.top) < 2);
      if (l) { l.left = Math.min(l.left, r.left); l.right = Math.max(l.right, r.right); l.bottom = Math.max(l.bottom, r.bottom); }
      else lines.push({ top: r.top, left: r.left, right: r.right, bottom: r.bottom });
    }
    const fi = fontInfo(cs);
    const lh = fi.lh || Math.round(fi.f * 1.21);
    const left = Math.min(...lines.map((l) => l.left)), right = Math.max(...lines.map((l) => l.right));
    const top = lines[0].top, contentH = lines[0].bottom - lines[0].top;
    let text = raw;
    if (!pre) {
      text = text.trim();
    }
    if (!runs) text = tf(text, cs);
    const n = Object.assign({ t: 't', s: text, x: r1(left - ox), y: r1(top - (lh - contentH) / 2 - oy), w: r1(right - left) }, fi);
    if (lines.length > 1) {
      n.wr = 1; n.w = r1(right - left + 2);
      const ta = cs.textAlign; if (ta === 'center' || ta === 'right' || ta === 'end') n.al = ta === 'center' ? 'C' : 'R';
      let blk = tn.parentElement; while (blk.parentElement && getComputedStyle(blk).display.startsWith('inline')) blk = blk.parentElement;
      const bcs = getComputedStyle(blk), bb = blk.getBoundingClientRect();
      const cl = bb.left + px(bcs.borderLeftWidth) + px(bcs.paddingLeft), cw = bb.width - px(bcs.borderLeftWidth) - px(bcs.paddingLeft) - px(bcs.paddingRight) - px(bcs.borderRightWidth);
      if (ta === 'center' || Math.abs(lines[0].left - cl) < 3) { n.x = r1(cl - ox); n.w = r1(cw); }
    }
    n.lh = lh;
    if (runs) { n.runs = runs.map((r) => [r[0], r[1], r[2]]); n.nw = r1(runs.reduce((acc, r) => acc + measure(text.slice(r[0], r[1]), r[3]), 0)); }
    else n.nw = r1(measure(text, cs));
    out.push(n);
  }
  function inlineOnly(el, depth) {
    let hasEl = false;
    for (const ch of el.childNodes) {
      if (ch.nodeType === 3) continue;
      if (ch.nodeType !== 1) continue;
      const t = ch.tagName.toLowerCase();
      if (['svg', 'img', 'input', 'button', 'a', 'select', 'textarea', 'canvas', 'br'].includes(t)) return false;
      const c = getComputedStyle(ch);
      if (c.display === 'none') continue;
      if (c.display !== 'inline' || c.position !== 'static') return false;
      if (col(c.backgroundColor) || (c.borderTopStyle !== 'none' && px(c.borderTopWidth)) || (c.borderBottomStyle !== 'none' && px(c.borderBottomWidth)) || px(c.paddingLeft) || px(c.marginLeft) || px(c.marginRight)) return false;
      if (!inlineOnly(ch, depth + 1)) return false;
      hasEl = true;
    }
    return depth > 0 || hasEl;
  }
  function richText(el, cs, ox, oy, out) {
    const nodes = [];
    (function rec(e) { for (const ch of e.childNodes) { if (ch.nodeType === 3) nodes.push(ch); else if (ch.nodeType === 1 && getComputedStyle(ch).display !== 'none') rec(ch); } })(el);
    let text = '', runs = [];
    for (const tn of nodes) {
      const pcs = getComputedStyle(tn.parentElement);
      let piece = tn.data.replace(/\s+/g, ' ');
      if (piece.startsWith(' ') && (text === '' || text.endsWith(' '))) piece = piece.slice(1);
      if (!piece) continue;
      piece = tf(piece, pcs);
      const st = fontInfo(pcs);
      runs.push([text.length, text.length + piece.length, st, pcs]);
      text += piece;
    }
    const lead = text.length - text.trimStart().length;
    text = text.trim();
    runs = runs.map(([a, b, st, pc]) => [Math.max(0, a - lead), Math.min(text.length, b - lead), st, pc]).filter(([a, b]) => b > a);
    if (!text) return;
    const first = nodes.find((n) => /\S/.test(n.data)), last = [...nodes].reverse().find((n) => /\S/.test(n.data));
    const range = document.createRange();
    range.setStart(first, first.data.search(/\S/)); let en = last.data.length; while (en > 0 && /\s/.test(last.data[en - 1])) en--; range.setEnd(last, en);
    const uniq = new Set(runs.map((r) => JSON.stringify(r[2])));
    place(range, text, cs, first, ox, oy, out, false, uniq.size > 1 ? runs : null);
  }
  function svgStr(el) {
    const clone = el.cloneNode(true);
    const cs = getComputedStyle(el);
    const color = col(cs.color) || '#000000';
    const hexOnly = color.split('/')[0];
    const all = [clone, ...clone.querySelectorAll('*')];
    const orig = [el, ...el.querySelectorAll('*')];
    all.forEach((n, i) => {
      const ocs = getComputedStyle(orig[i]);
      for (const a of ['fill', 'stroke']) {
        const v = ocs[a];
        if (v && v !== 'none') { const c = col(v); if (c) n.setAttribute(a, c.split('/')[0]); }
        else if (v === 'none') n.setAttribute(a, 'none');
      }
      if (ocs.strokeWidth && orig[i].tagName !== 'svg') n.setAttribute('stroke-width', ocs.strokeWidth);
      n.removeAttribute('class'); n.removeAttribute('style');
    });
    const b = el.getBoundingClientRect();
    clone.setAttribute('width', b.width); clone.setAttribute('height', b.height);
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return clone.outerHTML.replace(/currentColor/g, hexOnly).replace(/\s+/g, ' ').replace(/> </g, '><');
  }
  function nameOf(el) {
    const cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/).filter(Boolean)
      .map((c) => c.replace(/^_?([a-zA-Z0-9-]+?)_[a-zA-Z0-9-]{5,}$/, '$1').replace(/^_/, ''))[0];
    const tag = el.tagName.toLowerCase();
    const label = (el.getAttribute('aria-label') || '').slice(0, 30);
    return label ? tag + ' · ' + label : cls ? tag + '.' + cls : tag;
  }
  function walk(el, ox, oy, out, clip) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
    if (opts.skip && opts.skip(el)) return;
    const b = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const zpos = (cs.position === 'absolute' || cs.position === 'fixed') ? 1 : 0;
    if (clip && (b.right < clip.l || b.left > clip.r || b.bottom < clip.t || b.top > clip.b) && cs.position !== 'fixed') return;
    if (tag === 'svg') {
      if (b.width < 1) return;
      out.push({ t: 's', x: r1(b.left - ox), y: r1(b.top - oy), w: r1(b.width), h: r1(b.height), v: svgStr(el), z: zpos || undefined });
      return;
    }
    if (tag === 'img') {
      const k = imgKey(el.currentSrc || el.src, el);
      const n = { t: 'i', x: r1(b.left - ox), y: r1(b.top - oy), w: r1(b.width), h: r1(b.height), k: k };
      const rr = px(cs.borderTopLeftRadius); if (rr) n.r = rr;
      n.fit = cs.objectFit === 'cover' ? 'FILL' : 'FIT';
      out.push(n); return;
    }
    if (tag === 'canvas') {
      const svg = window.__chartSvg && window.__chartSvg(el);
      if (svg) { out.push({ t: 's', x: r1(b.left - ox), y: r1(b.top - oy), w: r1(b.width), h: r1(b.height), v: svg }); return; }
      try { const d = el.toDataURL('image/png').split(',')[1]; const k = 'canvas:' + location.pathname + ':' + Math.round(b.top) + ':' + Math.round(b.left); images[k] = d;
        out.push({ t: 'i', x: r1(b.left - ox), y: r1(b.top - oy), w: r1(b.width), h: r1(b.height), k: k, fit: 'FILL' }); } catch (e) {}
      return;
    }
    const node = { t: 'f', n: nameOf(el), x: r1(b.left - ox), y: r1(b.top - oy), w: r1(b.width), h: r1(b.height) };
    if (zpos) node.z = 1;
    boxStyle(cs, node);
    if (+cs.opacity < 1) node.op = +cs.opacity;
    const CV = ['hidden', 'auto', 'scroll', 'clip'];
    const ovf = CV.includes(cs.overflowX) || CV.includes(cs.overflowY);
    if (ovf && el !== root) node.cl = 1;
    const isLink = el !== root && (tag === 'a' || tag === 'button' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'tab' || (el !== root && cs.cursor === 'pointer' && el.parentElement && getComputedStyle(el.parentElement).cursor !== 'pointer' && !el.parentElement.closest('a,button')));
    if (isLink) {
      node.lk = { tag, href: el.getAttribute('href') || '', txt: (el.innerText || el.getAttribute('aria-label') || el.title || '').trim().replace(/\s+/g, ' ').slice(0, 60) };
    }
    const visual = node.bg || node.bd || node.sh || node.gr || node.cl || node.op || isLink || el === root || tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'table' || tag === 'tr' || /card|panel|modal|section|row|step/i.test(node.n);
    let kids, nox, noy;
    const flatStart = out.length;
    if (visual) { kids = node.c = []; nox = b.left; noy = b.top; } else { kids = out; nox = ox; noy = oy; }
    const nclip = node.cl ? { l: b.left, r: b.right, t: b.top, b: b.bottom } : clip;
    // pseudo elements with absolute boxes
    for (const ps of ['::before', '::after']) {
      const p = getComputedStyle(el, ps);
      if (p.content === 'none' || p.display === 'none') continue;
      const pbg = col(p.backgroundColor);
      if (pbg && (p.position === 'absolute')) {
        const l = b.left + px(cs.borderLeftWidth) + (p.left !== 'auto' ? px(p.left) : 0);
        const t = b.top + px(cs.borderTopWidth) + (p.top !== 'auto' ? px(p.top) : 0);
        const w = px(p.width), h = px(p.height);
        if (w && h) kids.push({ t: 'f', n: ps, x: r1(l - nox), y: r1(t - noy), w: r1(w), h: r1(h), bg: pbg, r: px(p.borderTopLeftRadius) || undefined });
      }
    }
    if (el.classList && el.classList.contains('dropdown-toggle')) {
      const pa = getComputedStyle(el, '::after');
      if (pa.content !== 'none' && pa.display !== 'none') {
        const bw = px(pa.borderTopWidth) || 4, c = (col(pa.borderTopColor) || col(cs.color) || '#000000').split('/')[0];
        const r = document.createRange(); r.selectNodeContents(el); const rr = r.getBoundingClientRect();
        const cx0 = rr.right + px(pa.marginLeft), cy0 = rr.top + rr.height / 2 - bw / 2 + px(pa.verticalAlign);
        kids.push({ t: 's', x: r1(cx0 - nox), y: r1(cy0 - noy), w: r1(bw * 2), h: r1(bw), z: 1, v: `<svg xmlns="http://www.w3.org/2000/svg" width="${bw * 2}" height="${bw}" viewBox="0 0 ${bw * 2} ${bw}"><path d="M0 0H${bw * 2}L${bw} ${bw}Z" fill="${c}"/></svg>` });
      }
    }
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        const chk = el.checked;
        if (!node.bd && !node.bg) { node.bd = [chk ? '#0075ff' : '#767676', 1]; node.bg = chk ? '#0075ff' : '#ffffff'; node.r = type === 'radio' ? b.width / 2 : 2.5; }
        if (chk) kids.push({ t: 's', x: 1, y: 1, w: r1(b.width - 2), h: r1(b.height - 2), v: type === 'radio' ? `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width - 2}" height="${b.height - 2}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2.5" fill="#fff"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width - 2}" height="${b.height - 2}" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` });
        out.push(node); return;
      }
      node.cl = 1;
      let val = tag === 'select' ? (el.selectedOptions[0] ? el.selectedOptions[0].text : '') : el.value;
      let fi = fontInfo(cs);
      if (type === 'password' && val) val = '•'.repeat(val.length);
      if (!val && el.placeholder) { val = el.placeholder; const pc = col(getComputedStyle(el, '::placeholder').color); if (pc) fi.c = pc; }
      if (type === 'date' && !val) val = 'dd/mm/yyyy';
      if (val) {
        const lh = fi.lh || Math.round(fi.f * 1.21);
        const pl = px(cs.paddingLeft) + px(cs.borderLeftWidth);
        const innerW = b.width - pl - px(cs.paddingRight) - px(cs.borderRightWidth);
        const tn = Object.assign({ t: 't', s: val, x: r1(pl), w: r1(innerW), lh, nw: r1(measure(val, cs)) }, fi);
        if (tag === 'textarea') { tn.y = r1(px(cs.paddingTop) + px(cs.borderTopWidth)); tn.wr = 1; }
        else { tn.y = r1((b.height - lh) / 2); tn.trunc = 1; }
        if (cs.textAlign === 'right' || cs.textAlign === 'end') tn.al = 'R'; else if (cs.textAlign === 'center') tn.al = 'C';
        if (!tn.al && tag !== 'textarea' && tn.nw > innerW + 0.5) { const x0 = tn.x; tn.x = 0; kids.push({ t: 'f', n: 'value', x: x0, y: 0, w: r1(innerW), h: r1(b.height), cl: 1, c: [tn] }); }
        else kids.push(tn);
      }
      if (tag === 'select' || type === 'date') {
        const sz = 16;
        kids.push({ t: 's', x: r1(b.width - px(cs.paddingRight) + (px(cs.paddingRight) - sz) / 2 - 2), y: r1((b.height - sz) / 2), w: sz, h: sz,
          v: type === 'date' ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#343a40" fill="none" stroke-width="1.2"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="#343a40" stroke-width="1.2"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="none" stroke="#343a40" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m2 5 6 6 6-6"/></svg>` });
      }
      out.push(node); return;
    }
    const blockish = /^(block|list-item|table-cell|inline-block|flow-root)$/.test(cs.display);
    if (blockish && el.childNodes.length > 1 && inlineOnly(el, 0)) {
      richText(el, cs, nox, noy, kids);
      if (visual) out.push(node);
      return;
    }
    let grp = [];
    const flush = () => { if (grp.length) textNodes(grp, cs, nox, noy, kids); grp = []; };
    const start = kids.length;
    for (const ch of el.childNodes) {
      if (ch.nodeType === 3) grp.push(ch);
      else if (ch.nodeType === 1) { flush(); walk(ch, nox, noy, kids, nclip); }
    }
    flush();
    // positioned children paint above in-flow siblings
    const mine = kids.splice(start);
    kids.push(...mine.filter((k) => !k.z), ...mine.filter((k) => k.z));
    if (visual) out.push(node);
    else if (zpos) for (let i = flatStart; i < out.length; i++) out[i].z = 1;
  }
  const out = [];
  const rb = root.getBoundingClientRect();
  walk(root, rb.left - (opts.dx || 0), rb.top - (opts.dy || 0), out, null);
  return { tree: out[0], images };
};
