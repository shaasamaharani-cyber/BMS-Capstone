// Usage: node capture.cjs screens.json outDir
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [, , specFile, outDir] = process.argv;
const screens = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const SER = fs.readFileSync(path.join(__dirname, 'serialize.js'), 'utf8');
const CHART = fs.readFileSync(path.join(__dirname, 'chart_svg.js'), 'utf8');
const BASE = process.env.BMS_URL || 'http://localhost:5173';
fs.mkdirSync(outDir, { recursive: true });

async function login(page, email) {
  await page.goto(BASE + '/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/login');
  await page.fill('input[name=username]', email);
  await page.fill('input[name=password]', 'Test12345');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let cur = null;
  const images = {};
  for (const s of screens) {
    if (s.user && s.user !== cur) { await login(page, s.user); cur = s.user; }
    if (!s.user) { await page.evaluate(() => localStorage.clear()).catch(() => {}); cur = null; }
    await page.setViewportSize({ width: 1440, height: 900 });
    if (s.user) await page.evaluate(() => localStorage.removeItem('dost-bms.unified-request.draft')).catch(() => {});
    if (s.route || !s.user) await page.goto(BASE + (s.route || "/login"));
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    for (const a of s.actions || []) {
      if (a.click) await page.locator(a.click).first().click();
      if (a.fill) await page.locator(a.fill[0]).first().fill(a.fill[1]);
      if (a.eval) await page.evaluate(a.eval);
      await page.waitForTimeout(a.wait || 900);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(SER);
    await page.evaluate(CHART);
    await page.evaluate(async () => {
      const u = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /deps\/chart__js\.js/.test(n));
      if (u) { const m = await import(u); window.__Chart = m.Chart; }
    });
    const out = { name: s.name, route: page.url().replace(BASE, ''), w: 1440 };
    const hasShell = await page.$('aside');
    if (hasShell) {
      const r = await page.evaluate(() => {
        const imgs = {};
        const sb = window.__ser(document.querySelector('aside'), { images: imgs });
        const hdr = document.querySelector('main').previousElementSibling;
        const tb = window.__ser(hdr, { images: imgs, dx: 244 });
        return { sb: sb.tree, tb: tb.tree, imgs };
      });
      out.sidebar = r.sb; out.topbar = r.tb; Object.assign(images, r.imgs);
      const H = await page.evaluate(() => Math.max(900, document.documentElement.scrollHeight));
      await page.setViewportSize({ width: 1440, height: H });
      await page.waitForTimeout(800);
      const H2 = await page.evaluate(() => Math.max(900, document.documentElement.scrollHeight));
      if (H2 !== H) { await page.setViewportSize({ width: 1440, height: H2 }); await page.waitForTimeout(600); }
      const c = await page.evaluate((skipSel) => {
        const imgs = {};
        const m = document.querySelector('main');
        const mb = m.getBoundingClientRect();
        const r = window.__ser(m, { images: imgs, dx: mb.left, dy: mb.top });
        // portals / fixed overlays outside the shell
        const extra = [];
        for (const el of document.body.children) {
          if (el.id === 'root' || el.tagName === 'SCRIPT') continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none') continue;
          const rb = el.getBoundingClientRect(); if (rb.width < 2 || rb.height < 2) continue;
          extra.push(window.__ser(el, { images: imgs, dx: rb.left, dy: rb.top }).tree);
        }
        return { tree: r.tree, extra, imgs, h: document.documentElement.scrollHeight, bg: getComputedStyle(m.parentElement).backgroundColor };
      });
      out.content = c.tree; out.extra = c.extra; out.h = Math.max(900, c.h); Object.assign(images, c.imgs);
    } else {
      const c = await page.evaluate(() => {
        const imgs = {};
        const r = window.__ser(document.querySelector('#root'), { images: imgs });
        return { tree: r.tree, imgs, h: document.documentElement.scrollHeight };
      });
      out.content = c.tree; out.h = Math.max(900, c.h); Object.assign(images, c.imgs);
    }
    await page.setViewportSize({ width: 1440, height: out.h });
    await page.screenshot({ path: path.join(outDir, s.id + '.png') });
    fs.writeFileSync(path.join(outDir, s.id + '.json'), JSON.stringify(out));
    console.log(s.id, out.route, out.h, JSON.stringify(out).length);
  }
  fs.writeFileSync(path.join(outDir, 'images.json'), JSON.stringify(images));
  await b.close();
})();
