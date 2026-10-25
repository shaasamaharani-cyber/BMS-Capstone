"""Turn captured screen JSON into use_figma call scripts (each under the size budget)."""
import json, sys, os, glob, re

def clean(nm):
    return re.sub(r'\._?([A-Za-z][A-Za-z0-9-]*?)_[A-Za-z0-9-]{5}_\d+$', r'.\1', nm)

BUDGET = 42000
FRAME_KEYS = ['bg', 'bd', 'dash', 'r', 'sh', 'gr', 'op', 'cl']
TEXT_KEYS = ['f', 'wt', 'c', 'lh', 'ls', 'm', 'i', 'u', 'st', 'al', 'wr', 'trunc']
RUN_KEYS = ['f', 'wt', 'c', 'ls', 'm', 'i', 'u', 'st']

DECODER = r"""const R = new Function('figma', figma.root.getSharedPluginData('bms','rt'))(figma); await R.fonts();
function dec(a){const k=a[0];
if(k==='t'){const o=Object.assign({t:'t',s:a[1],x:a[2],y:a[3],w:a[4],nw:a[6]||a[4]},TS[a[5]]);if(a[7])o.runs=a[7].map(r=>[r[0],r[1],TS[r[2]]]);return o;}
if(k==='s')return{t:'s',x:a[1],y:a[2],w:a[3],h:a[4],v:SV[a[5]]};
if(k==='i')return{t:'i',x:a[1],y:a[2],w:a[3],h:a[4],k:a[5],r:a[6]||undefined,fit:a[7]};
const o=Object.assign({t:'f',n:a[1],x:a[2],y:a[3],w:a[4],h:a[5]},FS[a[6]]);o.c=(a[7]||[]).map(dec);if(a[8])o.lk=a[8];if(a[9])o.id=a[9];return o;}
"""


def img_key(k):
    if 'dost-logo' in k:
        return 'logo'
    return k


class Enc:
    def __init__(self):
        self.fs, self.ts, self.sv = {}, {}, {}

    def idx(self, table, obj):
        key = json.dumps(obj, sort_keys=True)
        if key not in table:
            table[key] = len(table)
        return table[key]

    def enc(self, n, shell_key=None, with_children=True):
        t = n['t']
        if t == 't':
            st = {k: n[k] for k in TEXT_KEYS if k in n}
            a = ['t', n['s'], n['x'], n['y'], n.get('w', 0), self.idx(self.ts, st), 0 if abs(n.get('nw', 0) - n.get('w', 0)) < 0.15 else n.get('nw', 0)]
            if n.get('runs'):
                a.append([[r[0], r[1], self.idx(self.ts, {k: r[2][k] for k in RUN_KEYS if k in r[2]})] for r in n['runs']])
            return a
        if t == 's':
            return ['s', n['x'], n['y'], n['w'], n['h'], self.idx(self.sv, n['v'])]
        if t == 'i':
            return ['i', n['x'], n['y'], n['w'], n['h'], img_key(n['k']), n.get('r', 0), n.get('fit', 'FIT')]
        st = {k: n[k] for k in FRAME_KEYS if k in n and n[k] is not None}
        a = ['f', clean(n['n']), n['x'], n['y'], n['w'], n['h'], self.idx(self.fs, st),
             [self.enc(c) for c in n.get('c', [])] if with_children else [], n.get('lk', 0)]
        if shell_key:
            a.append(shell_key)
        return a

    def tables(self):
        inv = lambda d: [json.loads(k) for k, _ in sorted(d.items(), key=lambda kv: kv[1])]
        return inv(self.fs), inv(self.ts), [json.loads(k) for k, _ in sorted(self.sv.items(), key=lambda kv: kv[1])]


def size(n):
    return len(json.dumps(n, separators=(',', ':')))


def plan_items(node, parent_key, items, counter):
    """Split a node into (parent_key, node_dict, shell_key) items that each fit the budget."""
    if size(node) <= BUDGET * 0.8:
        items.append((parent_key, node, None))
        return
    counter[0] += 1
    key = 'k%d' % counter[0]
    shell = dict(node)
    shell['c'] = []
    items.append((parent_key, shell, key))
    for c in node.get('c', []):
        plan_items(c, key, items, counter)


def calls_for(screen, pos, ord_idx):
    D = json.load(open(screen))
    name = D['name']
    h = int(round(D['h']))
    items = []
    counter = [0]
    plan_items(D['content'], 'ROOT', items, counter)
    if D.get('topbar'):
        plan_items(D['topbar'], 'ROOT', items, counter)
    for e in D.get('extra') or []:
        plan_items(e, 'ROOT', items, counter)
    if D.get('sidebar'):
        items.append(('ROOT', D['sidebar'], 'SIDEBAR'))
    # pack into batches
    batches, cur, cur_size = [], [], 0
    for it in items:
        s = size(it[1]) if it[2] in (None, 'SIDEBAR') else 400
        if cur and cur_size + s > BUDGET * 0.8:
            batches.append(cur)
            cur, cur_size = [], 0
        cur.append(it)
        cur_size += s
    if cur:
        batches.append(cur)
    out = []
    for bi, batch in enumerate(batches):
        e = Enc()
        enc_items = []
        for pk, node, sk in batch:
            if sk == 'SIDEBAR':
                enc_items.append([pk, e.enc(node, shell_key=sk)])
            elif sk:
                enc_items.append([pk, e.enc(node, shell_key=sk, with_children=False)])
            else:
                enc_items.append([pk, e.enc(node)])
        FS, TS, SV = e.tables()
        last = bi == len(batches) - 1
        code = DECODER
        code += 'const FS=%s;\nconst TS=%s;\nconst SV=%s;\n' % (
            json.dumps(FS, separators=(',', ':')), json.dumps(TS, separators=(',', ':'), ensure_ascii=False),
            json.dumps(SV, separators=(',', ':')))
        code += 'const IT=%s;\n' % json.dumps(enc_items, separators=(',', ':'), ensure_ascii=False)
        code += 'const NAME=%s;\n' % json.dumps(name)
        if bi == 0:
            code += ("let S=figma.currentPage.findChild(n=>n.type==='FRAME'&&n.name===NAME);if(S)S.remove();\n"
                     "S=figma.createFrame();S.name=NAME;S.resize(1440,%d);S.x=%d;S.y=%d;S.fills=[R.paint('#f8fafd')];S.clipsContent=true;\n"
                     "S.setSharedPluginData('bms','route',%s);S.setSharedPluginData('bms','ord','%d');\n") % (
                h, pos[0], pos[1], json.dumps(D['route']), ord_idx)
        else:
            code += "const S=figma.currentPage.findChild(n=>n.type==='FRAME'&&n.name===NAME);\n"
        code += ("const K={ROOT:S};S.findAll(n=>n.type==='FRAME').forEach(n=>{const k=n.getSharedPluginData('bms','k');if(k)K[k]=n;});\n"
                 "let made=0;for(const [pk,a] of IT){const o=dec(a);const n=R.build(o,K[pk]);made++;if(a[0]==='f'&&a[9]){n.setSharedPluginData('bms','k',a[9]);K[a[9]]=n;}}\n")
        if last:
            code += ("const sb=S.children.find(n=>n.getSharedPluginData('bms','k')==='SIDEBAR');"
                     "if(sb){S.appendChild(sb);S.numberOfFixedChildren=1;}\n")
        code += "return {screen:S.id,batch:%d,of:%d,made};" % (bi + 1, len(batches))
        out.append(code)
    return out


if __name__ == '__main__':
    layout = json.load(open('layout.json'))
    os.makedirs('calls', exist_ok=True)
    for f in glob.glob('calls/*.js'):
        os.remove(f)
    for i, (sid, x, y) in enumerate(layout):
        cs = calls_for('out/%s.json' % sid, (x, y), i)
        for j, c in enumerate(cs):
            fn = 'calls/%s_%d.js' % (sid, j + 1)
            open(fn, 'w').write(c)
            print(fn, len(c))
