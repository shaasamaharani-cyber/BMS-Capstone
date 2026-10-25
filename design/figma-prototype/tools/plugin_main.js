const GAP_X = 160, GAP_Y = 360, PAD = 120;
const tpl = (r) => (r || '').split('?')[0].replace(/\/\d+/g, '/:id');
const role = (s) => s.row.startsWith('Requester') ? 'Requester' : s.row;

async function main() {
  await fonts();
  IMG.logo = figma.createImage(figma.base64Decode(LOGO)).hash;
  const page = figma.currentPage;
  const names = new Set(SCREENS.map((s) => s.name));
  for (const n of [...page.children]) {
    if ((n.type === 'FRAME' && (names.has(n.name) || n.name === 'Assets')) || (n.type === 'SECTION' && n.getSharedPluginData('bms', 'section'))) n.remove();
  }

  // One section per role, screens laid out left to right
  const rows = [];
  for (const s of SCREENS) { let r = rows.find((x) => x.name === s.row); if (!r) rows.push(r = { name: s.row, items: [] }); r.items.push(s); }
  let y = 0;
  for (const r of rows) {
    const sec = figma.createSection();
    sec.name = r.name; sec.setSharedPluginData('bms', 'section', '1');
    let x = PAD; let maxH = 0;
    for (const s of r.items) {
      figma.notify('Building ' + s.name + '...', { timeout: 800 });
      const dec = decoder(s);
      const F = figma.createFrame();
      F.name = s.name; F.resize(1440, s.h); F.fills = [paint('#f8fafd')]; F.clipsContent = true;
      sec.appendChild(F); F.x = x; F.y = PAD;
      for (const it of s.IT) build(dec(it), F);
      if (s.SB) { build(dec(s.SB), F); F.numberOfFixedChildren = 1; }
      F.setSharedPluginData('bms', 'route', s.route);
      s.frame = F; x += 1440 + GAP_X; maxH = Math.max(maxH, s.h);
    }
    sec.resizeWithoutConstraints(x - GAP_X + PAD, maxH + PAD * 2);
    sec.x = 0; sec.y = y; y += maxH + PAD * 2 + GAP_Y;
  }

  // Prototype links
  const find = (pred) => SCREENS.find(pred);
  const byName = (n) => find((s) => s.name === n);
  const wizard = SCREENS.filter((s) => s.id.startsWith('r1'));
  let links = 0;
  for (const s of SCREENS) {
    const R = role(s);
    const nodes = s.frame.findAll((n) => n.type === 'FRAME' && n.getSharedPluginData('bms', 'lk'));
    const wi = wizard.indexOf(s);
    for (const n of nodes) {
      const lk = JSON.parse(n.getSharedPluginData('bms', 'lk'));
      const txt = (lk.txt || '').trim();
      let to = null;
      if (lk.href && lk.href !== '#') {
        to = find((t) => role(t) === R && t.route === lk.href && !t.id.startsWith('r1')) || find((t) => role(t) === R && tpl(t.route) === tpl(lk.href));
        if (!to && /^\/budget-requests\/\d+$/.test(lk.href) && R === 'Requester') to = byName('Requester / Request Detail');
      }
      if (!to) {
        if (s.id === '01-login' && txt === 'LOGIN') to = byName('Requester / Dashboard');
        else if (txt === '+ New Request' || (s.id === 'r01-dashboard' && txt === 'Open')) to = wizard[0];
        else if (txt === 'Open report' || txt === 'Fill in the report') to = find((t) => role(t) === R && t.route === '/spending-monitoring');
        else if (wi >= 0 && txt === 'Next') to = wizard[wi + 1];
        else if (wi >= 0 && txt === 'Back') to = wi > 0 ? wizard[wi - 1] : byName('Requester / Budget Requests');
        else if (wi >= 0) {
          const steps = ['Request details', 'Questions', 'Required forms', 'Pre-filled forms', 'Review'];
          const k = steps.findIndex((st) => txt.replace(/^\d\s*/, '').startsWith(st) || txt === 'Go to ' + st);
          if (k >= 0) to = wizard[k];
        } else if (txt === 'Back' || txt === 'Close') {
          const parent = '/' + s.route.split('/')[1];
          to = find((t) => role(t) === R && t.route === parent);
        } else if (/^(Review|View|Actions)$/.test(txt)) {
          const list = s.route;
          const detail = find((t) => role(t) === R && t.route.startsWith(list + '/') && /\d$/.test(t.route));
          if (detail) to = detail;
        } else if (txt === '🔗 Consolidate Budget') to = byName('Budget & Finance / Consolidation Detail');
        else if (/^[A-Z]{2} .+/.test(txt) && n.parent && n.parent.name === 'header.topbar') to = byName('Login');
      }
      if (to && to.frame && to.frame !== s.frame) {
        await n.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: to.frame.id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', duration: 0.2, easing: { type: 'EASE_OUT' } }, resetScrollPosition: true }] }]);
        links++;
      }
    }
    // Table rows on list pages open the matching detail page
    const detail = find((t) => role(t) === R && t.route !== s.route && t.route.startsWith(s.route + '/') && /\d$/.test(t.route));
    if (detail) {
      const rowsF = s.frame.findAll((n) => n.type === 'FRAME' && n.name === 'tr' && n.parent && n.parent.name.startsWith('table'));
      for (const r of rowsF) {
        if (r.children.some((c) => c.name.startsWith('th'))) continue;
        if (r.reactions && r.reactions.length) continue;
        await r.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: detail.frame.id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', duration: 0.2, easing: { type: 'EASE_OUT' } }, resetScrollPosition: true }] }]);
        links++;
      }
    }
  }

  // Start points: sign in, plus one per role dashboard
  const starts = [byName('Login'), byName('Requester / Dashboard'), byName('Budget & Finance / Dashboard'), byName('Finance Director / Dashboard'), byName('Admin / Dashboard')].filter(Boolean);
  page.flowStartingPoints = starts.map((s) => ({ nodeId: s.frame.id, name: s.name === 'Login' ? 'Sign in' : s.name.split(' / ')[0] }));
  figma.viewport.scrollAndZoomIntoView(page.children.filter((n) => n.type === 'SECTION'));
  figma.closePlugin('Built ' + SCREENS.length + ' screens and ' + links + ' prototype links.');
}

main().catch((e) => figma.closePlugin('Build failed: ' + (e && e.message ? e.message : e)));
