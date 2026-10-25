"""Bundle every captured screen into a one-click Figma development plugin."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from gen_screen import Enc, clean  # noqa: E402

OUT = sys.argv[1] if len(sys.argv) > 1 else 'plugin'
os.makedirs(OUT, exist_ok=True)

ROWS = [
    ('Sign in', ['01-login']),
    ('Requester', ['r01-dashboard', 'r02-requests', 'r03-request-detail', 'r04-spending']),
    ('Requester - New budget request wizard', ['r11-wizard', 'r12-wizard', 'r13-wizard', 'r14-wizard', 'r15-wizard']),
    ('Budget & Finance Division', ['t01-dashboard', 't02-review', 't03-review-detail', 't04-consolidation',
                                  't05-consolidation-detail', 't06-spending', 't07-reports', 't08-forms']),
    ('Finance Director', ['f01-dashboard', 'f02-consolidation', 'f03-consolidation-detail', 'f04-spending', 'f05-reports', 'f06-forms']),
    ('Administrator', ['a01-dashboard', 'a02-users', 'a03-cycles', 'a04-forms', 'a05-settings']),
]

screens = []
for row, ids in ROWS:
    for sid in ids:
        D = json.load(open('out/%s.json' % sid))
        e = Enc()
        items = [e.enc(D['content'])]
        if D.get('topbar'):
            items.append(e.enc(D['topbar']))
        for x in D.get('extra') or []:
            items.append(e.enc(x))
        side = e.enc(D['sidebar']) if D.get('sidebar') else None
        FS, TS, SV = e.tables()
        screens.append({'id': sid, 'row': row, 'name': D['name'], 'route': D['route'], 'h': int(round(D['h'])),
                        'FS': FS, 'TS': TS, 'SV': SV, 'IT': items, 'SB': side})

logo = open('logo.b64').read().strip()
runtime = open('runtime.js').read().replace("const IMG = JSON.parse(figma.root.getSharedPluginData('bms', 'img') || '{}');", 'const IMG = {};')
runtime = runtime.replace('return { fonts, build, paint, IMG };', '')

code = """// DOST BMS - high fidelity prototype builder (generated from the running React app)
const LOGO = %s;
const SCREENS = %s;
%s
function decoder(S) {
  const dec = (a) => {
    const k = a[0];
    if (k === 't') { const o = Object.assign({ t: 't', s: a[1], x: a[2], y: a[3], w: a[4], nw: a[6] || a[4] }, S.TS[a[5]]); if (a[7]) o.runs = a[7].map((r) => [r[0], r[1], S.TS[r[2]]]); return o; }
    if (k === 's') return { t: 's', x: a[1], y: a[2], w: a[3], h: a[4], v: S.SV[a[5]] };
    if (k === 'i') return { t: 'i', x: a[1], y: a[2], w: a[3], h: a[4], k: a[5], r: a[6] || undefined, fit: a[7] };
    const o = Object.assign({ t: 'f', n: a[1], x: a[2], y: a[3], w: a[4], h: a[5] }, S.FS[a[6]]); o.c = (a[7] || []).map(dec); if (a[8]) o.lk = a[8]; return o;
  };
  return dec;
}
%s
""" % (json.dumps(logo), json.dumps(screens, separators=(',', ':'), ensure_ascii=False), runtime,
       open(os.path.join(os.path.dirname(__file__), 'plugin_main.js')).read())

open(os.path.join(OUT, 'code.js'), 'w').write(code)
json.dump({'name': 'DOST BMS Prototype Builder', 'id': 'dost-bms-prototype-builder', 'api': '1.0.0', 'main': 'code.js',
           'editorType': ['figma'], 'documentAccess': 'dynamic-page'}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=2)
print(len(code), len(screens))
