// NoSuggest redesign — builds the DESKTOP screens (1440×900), the remaining mobile
// screens (Search, Saved, Channels) and wires every click for Present mode.
// Run once inside the file "NoSuggest – Improved (History, More Videos, Channel Profile)"
// with the free "Scripter" plugin (paste everything, press ▶ Run).

// --- small polyfill: Scripter uses the standard Plugin API ---
if (!figma.createAutoLayout) figma.createAutoLayout = (dir = 'HORIZONTAL') => { const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.clipsContent = false; return f; };

const errs=[];const made={};async function step(n,fn){try{await fn()}catch(e){errs.push(n+': '+e.message)}}
const F={serif:{family:'Fraunces',style:'SemiBold'},serifB:{family:'Fraunces',style:'Bold'},out:{family:'Outfit',style:'Regular'},outM:{family:'Outfit',style:'Medium'},outS:{family:'Outfit',style:'SemiBold'},outB:{family:'Outfit',style:'Bold'},mono:{family:'DM Mono',style:'Regular'},monoM:{family:'DM Mono',style:'Medium'}};
for(const f of Object.values(F)) await figma.loadFontAsync(f);
const hex=h=>{h=h.replace('#','');return{r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255}};
const S=(h,o=1)=>[{type:'SOLID',color:hex(h),opacity:o}];
const C={bg:'#0a0a0a',bg2:'#111111',bg3:'#1a1a1a',accent:'#e8ff5a',text:'#f0f0ee',muted:'#b0b0aa',dim:'#5c5c58'};
const IC={home:'<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',saved:'<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',down:'<path d="m6 9 6 6 6-6"/>',up:'<path d="m18 15-6-6-6 6"/>',refresh:'<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',ext:'<path d="M7 17 17 7M7 7h10v10"/>',check:'<path d="M20 6 9 17l-5-5"/>',chevR:'<path d="m9 18 6-6-6-6"/>',plus:'<path d="M12 5v14M5 12h14"/>',trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',share:'<path d="M4 12v8h16v-8M16 6l-4-4-4 4M12 2v13"/>'};
function icon(p,col,s=22,fill='none'){const n=figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`);n.fills=[];n.rescale(s/24);n.name='Icon';return n;}
function T(str,font,size,color,o={}){const t=figma.createText();t.fontName=font;t.characters=str;t.fontSize=size;t.fills=S(color);if(o.ls)t.letterSpacing={unit:'PERCENT',value:o.ls};if(o.lh)t.lineHeight={unit:'PIXELS',value:o.lh};if(o.w){t.resize(o.w,o.h||t.height);t.textAutoResize=o.h?'NONE':'HEIGHT';}if(o.trunc){t.textTruncation='ENDING';t.maxLines=o.trunc;}if(o.align)t.textAlignHorizontal=o.align;return t;}
function AL(dir,p={}){const f=figma.createAutoLayout(dir);f.fills=[];Object.assign(f,p);return f;}
function addFill(p,n){p.appendChild(n);n.layoutSizingHorizontal='FILL';return n;}
function fillText(p,t){p.appendChild(t);t.textAutoResize='HEIGHT';t.layoutSizingHorizontal='FILL';return t;}
function border(n,o=.08){n.strokes=S('#ffffff',o);n.strokeWeight=1;n.strokeAlign='INSIDE';}
function borderB(n){border(n);n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
function borderT(n){border(n);n.strokeBottomWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeTopWeight=1;}
const CH={O:{name:'Orbit Science',handle:'@orbitscience',color:'#3b5bdb',init:'OS',subs:'1.2M subscribers',total:842},K:{name:'Daily Kitchen',handle:'@dailykitchen',color:'#e8590c',init:'DK',subs:'486K subscribers',total:1310},U:{name:'Tech Unboxed',handle:'@techunboxed',color:'#2b8a3e',init:'TU',subs:'905K subscribers',total:617}};
const V={O:`Why Mars sunsets are blue|12:04|2h;The James Webb image that changed everything|18:41|1d;How rockets land themselves|9:58|3d;What's inside a neutron star?|14:20|5d;A day on the ISS in 10 minutes|10:02|1w;Black holes, explained simply|16:33|1w;Could we live on Titan?|13:15|2w;The coldest place in the universe|8:47|2w;Why the Moon is drifting away|11:09|3w;How big is the universe, really?|21:30|3w;Saturn's rings are disappearing|12:48|1mo;The first photo of a black hole|15:02|1mo;Voyager: 45 years in space|24:10|1mo;What if the Sun disappeared?|9:35|2mo;How GPS uses relativity|11:51|2mo;The Great Red Spot is shrinking|10:27|2mo`,K:`5 dinners in 30 minutes|18:22|4h;Perfect sourdough at home|22:10|1d;Knife skills every cook needs|12:34|3d;Crispy pan-fried dumplings|14:05|4d;One-pot creamy pasta|9:41|6d;Street food at home: tacos|16:00|1w;Meal prep for the week|19:12|1w;The secret to fluffy pancakes|8:30|2w;Homemade ramen from scratch|25:45|2w;3-ingredient desserts|7:58|3w;Fresh pasta without a machine|13:30|1mo;The best fried rice method|8:12|1mo;Baking bread in a dutch oven|15:55|1mo;Easy weeknight curry|11:03|2mo;How to season cast iron|7:21|2mo;Homemade dumpling wrappers|10:48|2mo`,U:`Phone cameras in 2026, tested|15:40|6h;Is this the best budget laptop?|13:22|2d;I used only e-ink for a week|17:05|4d;Building a silent PC|20:18|5d;Smart home without the cloud|14:44|1w;The keyboard I can't stop using|11:27|1w;Repairing a broken tablet|18:09|2w;Earbuds under $50 compared|12:51|2w;Why chargers got so small|9:14|3w;My desk setup, minimal edition|10:39|3w;Mechanical keyboards for beginners|14:02|1mo;Old phone, new life|12:15|1mo;Testing the cheapest drone|16:40|1mo;Is 8K worth it?|10:55|2mo;The quietest fans we tested|9:30|2mo;A week with a foldable|18:20|2mo`};
for(const k in V)V[k]=V[k].split(';').map(s=>s.split('|'));
function avatar(ch,s){const a=AL('HORIZONTAL',{name:'Avatar',primaryAxisAlignItems:'CENTER',counterAxisAlignItems:'CENTER'});a.resize(s,s);a.cornerRadius=s/2;a.fills=S(ch.color);a.appendChild(T(ch.init,F.outB,Math.max(6,Math.round(s*.36)),'#ffffff'));return a;}
function thumb(w,h,ch,v,o={}){const f=figma.createFrame();f.name='Thumbnail';f.resize(w,h);f.cornerRadius=o.r??8;f.clipsContent=true;const c=hex(ch.color);f.fills=[{type:'GRADIENT_LINEAR',gradientTransform:[[1,0,0],[0,1,0]],gradientStops:[{position:0,color:{...c,a:1}},{position:1,color:{r:c.r*.22,g:c.g*.22,b:c.b*.22,a:1}}]}];
 if(!o.nocap){const cap=T(v[0].toUpperCase(),F.outB,Math.min(22,Math.max(7,Math.round(h*.13))),'#ffffff');cap.resize(Math.round(w*.62),cap.height);cap.textAutoResize='HEIGHT';cap.lineHeight={unit:'PERCENT',value:95};cap.textTruncation='ENDING';cap.maxLines=2;f.appendChild(cap);cap.x=Math.round(w*.06);cap.y=h-cap.height-Math.round(h*.09)-(o.p?3:0);
 const b=AL('HORIZONTAL',{name:'Duration',paddingLeft:5,paddingRight:5,paddingTop:2,paddingBottom:2,cornerRadius:4});b.fills=S('#000000',.8);b.appendChild(T(v[1],F.mono,Math.min(12,Math.max(8,Math.round(h*.1))),'#ffffff'));f.appendChild(b);b.x=w-b.width-6;b.y=h-b.height-6-(o.p?3:0);}
 if(o.p){const bg=figma.createRectangle();bg.resize(w,3);bg.fills=S('#ffffff',.25);f.appendChild(bg);bg.y=h-3;const pr=figma.createRectangle();pr.name='Watched progress';pr.resize(Math.round(w*o.p),3);pr.fills=S(C.accent);f.appendChild(pr);pr.y=h-3;}
 return f;}
function card(ch,v,w=180,o={}){const c=AL('VERTICAL',{name:'tap:Player',cornerRadius:12});c.fills=S(C.bg2);border(c);c.clipsContent=true;c.appendChild(thumb(w,Math.round(w*.5625),ch,v,{r:0,p:o.p}));c.resize(w,c.height);c.primaryAxisSizingMode='AUTO';
 const inner=AL('VERTICAL',{itemSpacing:8,paddingLeft:12,paddingRight:12,paddingTop:10,paddingBottom:12});addFill(c,inner);
 inner.appendChild(T(v[0],F.outM,w>200?14:13,C.text,{lh:w>200?19:17,w:w-24,h:w>200?38:34,trunc:2}));
 const ft=AL('HORIZONTAL',{primaryAxisAlignItems:'SPACE_BETWEEN',counterAxisAlignItems:'CENTER'});addFill(inner,ft);ft.appendChild(T(o.meta||v[2]+' ago',F.mono,10.5,C.dim));ft.appendChild(icon(IC.saved,C.dim,14));return c;}
function vrow(p,ch,v,o={}){const tw=o.tw||120,px=o.px??18;const r=AL('HORIZONTAL',{name:'tap:Player',itemSpacing:o.gap||12,paddingLeft:px,paddingRight:px,paddingTop:o.py??12,paddingBottom:o.py??12,counterAxisAlignItems:'CENTER'});addFill(p,r);if(o.border!==false)borderB(r);
 r.appendChild(thumb(tw,Math.round(tw*.5625),ch,v,{p:o.p}));const col=AL('VERTICAL',{itemSpacing:o.big?6:4});r.appendChild(col);col.layoutSizingHorizontal='FILL';
 const t=T(v[0],F.outM,o.big?16:13.5,C.text,{lh:o.big?21:18});t.textTruncation='ENDING';t.maxLines=2;fillText(col,t);
 if(o.channelLink){const cl=AL('HORIZONTAL',{name:'tap:Channel Profile',itemSpacing:6,counterAxisAlignItems:'CENTER'});col.appendChild(cl);cl.appendChild(avatar(ch,o.big?20:16));cl.appendChild(T(ch.name,F.mono,o.big?12:11,C.muted));cl.appendChild(icon(IC.chevR,C.dim,12));}
 else if(o.showCh)col.appendChild(T(ch.name,F.mono,11,C.dim));
 col.appendChild(T(o.meta||(v[2]+' ago · '+v[1]),F.mono,o.big?12:11,C.dim));if(o.right)r.appendChild(o.right);return r;}
function screen(name,x,y,w=390,h=844){const f=figma.createFrame();f.name=name;f.resize(w,h);f.x=x;f.y=y;f.fills=S(C.bg);f.layoutMode='VERTICAL';f.primaryAxisSizingMode='FIXED';f.counterAxisSizingMode='FIXED';f.clipsContent=true;made[name]=f.id;return f;}
function body(scr){const b=AL('VERTICAL',{name:'Scroll body'});scr.appendChild(b);b.layoutSizingHorizontal='FILL';b.layoutSizingVertical='FILL';b.clipsContent=true;b.overflowDirection='VERTICAL';return b;}
function pageHeader(scr,title,right,o={}){const px=o.px??18;const h=AL('HORIZONTAL',{name:'Header',paddingLeft:px,paddingRight:px,paddingTop:o.pt??22,paddingBottom:o.pb??18,counterAxisAlignItems:'CENTER',primaryAxisAlignItems:'SPACE_BETWEEN'});addFill(scr,h);const l=AL('HORIZONTAL',{itemSpacing:12,counterAxisAlignItems:'CENTER'});h.appendChild(l);if(o.back){const b=AL('HORIZONTAL',{name:'tap:BACK',primaryAxisAlignItems:'CENTER',counterAxisAlignItems:'CENTER'});b.resize(36,36);b.cornerRadius=18;b.fills=S(C.bg2);border(b,.15);b.appendChild(icon(IC.back,C.text,18));l.appendChild(b);}if(o.dot){const d=figma.createEllipse();d.resize(9,9);d.fills=S(C.accent);l.appendChild(d);}l.appendChild(T(title,F.serif,o.size||28,C.text));if(o.sub)l.appendChild(T(o.sub,F.out,13,C.dim));if(right)h.appendChild(right);if(o.border!==false)borderB(h);return h;}
const NAV=[['Feed',IC.home,'Feed'],['Search',IC.search,'Search'],['History',IC.history,'History'],['Saved',IC.saved,'Saved'],['Channels',IC.users,'Channels'],['Settings',IC.settings,null]];
function nav(scr,active,dk){const n=AL('HORIZONTAL',{name:'Bottom nav',paddingTop:dk?12:10,paddingBottom:dk?12:16,paddingLeft:dk?60:4,paddingRight:dk?60:4});n.fills=S(C.bg);borderT(n);addFill(scr,n);
 for(const [l,ic,d] of NAV){const it=AL('VERTICAL',{name:d?'tap:'+d:'Settings',itemSpacing:5,counterAxisAlignItems:'CENTER'});n.appendChild(it);it.layoutSizingHorizontal='FILL';const col=l===active?C.accent:C.text;it.appendChild(icon(ic,col,dk?22:21));it.appendChild(T(l.toUpperCase(),F.outM,dk?11:9.5,col,{ls:4}));}return n;}
function chip(label,active){const c=AL('HORIZONTAL',{name:'Chip · '+label,paddingTop:6,paddingBottom:6,paddingLeft:13,paddingRight:13,cornerRadius:99});if(active)c.fills=S(C.accent);else{c.fills=S(C.bg2);border(c,.15);}c.appendChild(T(label,F.outM,12.5,active?'#0a0a0a':C.muted));return c;}
function btn(label,primary,ic,name){const b=AL('HORIZONTAL',{name:name||label,itemSpacing:6,paddingTop:11,paddingBottom:11,paddingLeft:18,paddingRight:18,cornerRadius:10,primaryAxisAlignItems:'CENTER',counterAxisAlignItems:'CENTER'});if(primary)b.fills=S(C.accent);else{b.fills=S(C.bg2);border(b,.15);}const col=primary?'#0a0a0a':C.text;if(ic&&primary)b.appendChild(icon(ic,col,15));b.appendChild(T(label,primary?F.outS:F.outM,14,col));if(ic&&!primary)b.appendChild(icon(ic,C.accent,15));return b;}
function groupLabel(p,t,px=18){const g=AL('HORIZONTAL',{name:'Group · '+t,paddingLeft:px,paddingRight:px,paddingTop:18,paddingBottom:4});addFill(p,g);g.appendChild(T(t.toUpperCase(),F.monoM,11,C.dim,{ls:8}));}
function xbtn(){const x=AL('HORIZONTAL',{name:'Remove',paddingLeft:4});x.appendChild(icon(IC.x,C.accent,18));return x;}
const DY=1900,DW=1440,DH=900,PX=28;
const P='Desktop / ';

// ---- canvas labels ----
await step('labels',async()=>{const a=T('MOBILE  ·  390 × 844',F.monoM,28,C.dim);a.x=0;a.y=-80;const b=T('DESKTOP  ·  1440 × 900',F.monoM,28,C.dim);b.x=0;b.y=DY-80;});

// ---- desktop "older videos" dropdown component sets ----
const dsets={};
await step('dsets',async()=>{const sy=DY+DH+700;let sx=0;
for(const k of ['O','K','U']){const ch=CH[k];const vs=[];
 for(const open of [false,true]){const c=figma.createComponent();c.name='State='+(open?'Open':'Collapsed');c.layoutMode='VERTICAL';c.resize(1384,10);c.primaryAxisSizingMode='AUTO';c.itemSpacing=12;c.fills=[];
  const dd=AL('HORIZONTAL',{name:'Dropdown toggle',paddingTop:12,paddingBottom:12,paddingLeft:16,paddingRight:16,cornerRadius:10,primaryAxisAlignItems:'SPACE_BETWEEN',counterAxisAlignItems:'CENTER'});dd.fills=S(open?C.bg2:C.bg3);border(dd,.15);if(open)dd.strokes=S(C.accent,.5);addFill(c,dd);
  const l=AL('HORIZONTAL',{itemSpacing:12,counterAxisAlignItems:'CENTER'});dd.appendChild(l);l.appendChild(T(open?'Hide older videos':'Show older videos',F.outM,14,open?C.accent:C.text));l.appendChild(T(open?'Showing 11–16 of '+ch.total.toLocaleString('en-US'):'Showing latest 10 of '+ch.total.toLocaleString('en-US'),F.mono,12,C.dim));dd.appendChild(icon(open?IC.up:IC.down,C.accent,18));
  if(open){const g=AL('HORIZONTAL',{name:'Older videos (11–16)',itemSpacing:17});addFill(c,g);V[k].slice(10,16).forEach((v,i)=>g.appendChild(card(ch,v,216,{meta:'#'+(11+i)+' · '+v[2]+' ago'})));
   const ft=AL('HORIZONTAL',{name:'Footer',itemSpacing:10});c.appendChild(ft);ft.appendChild(btn('Load 10 more',false,IC.down));ft.appendChild(btn('All '+ch.total.toLocaleString('en-US')+' videos',true,IC.chevR,'tap:Channel Profile'));}
  vs.push(c);}
 const set=figma.combineAsVariants(vs,figma.currentPage);set.name=P+'Older videos dropdown / '+ch.name;set.layoutMode='VERTICAL';set.itemSpacing=24;set.paddingLeft=set.paddingRight=set.paddingTop=set.paddingBottom=24;set.primaryAxisSizingMode='AUTO';set.counterAxisSizingMode='AUTO';set.fills=S('#222222');set.cornerRadius=16;set.x=sx;set.y=sy;sx+=set.width+60;
 const tr={type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:0.3};
 await vs[0].children[0].setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:vs[1].id,navigation:'CHANGE_TO',transition:tr}]}]);
 await vs[1].children[0].setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:vs[0].id,navigation:'CHANGE_TO',transition:tr}]}]);
 dsets[k]=set;}});

// ---- desktop Feed (+ a copy with the dropdown open) ----
await step('dfeed',async()=>{for(const [nm,open,x] of [['Feed',false,0],['Feed – older videos open',true,1540]]){const scr=screen(P+nm,x,DY,DW,DH);
 const rb=AL('HORIZONTAL',{name:'Refresh',primaryAxisAlignItems:'CENTER',counterAxisAlignItems:'CENTER'});rb.resize(40,40);rb.cornerRadius=20;rb.fills=S(C.bg2);border(rb,.15);rb.appendChild(icon(IC.refresh,C.accent,18));
 pageHeader(scr,'Feed',rb,{dot:true,sub:'Latest 10 videos/channel · open “Show older videos” for more',px:PX,pt:20,pb:18});
 const b=body(scr);
 for(const k of ['O','K','U']){const ch=CH[k];const s=AL('VERTICAL',{name:'Channel · '+ch.name,itemSpacing:16,paddingLeft:PX,paddingRight:PX,paddingTop:24,paddingBottom:26});addFill(b,s);borderB(s);
  const hr=AL('HORIZONTAL',{name:'Channel header',primaryAxisAlignItems:'SPACE_BETWEEN',counterAxisAlignItems:'CENTER'});addFill(s,hr);
  const tap=AL('HORIZONTAL',{name:'tap:Channel Profile',itemSpacing:10,counterAxisAlignItems:'CENTER'});hr.appendChild(tap);tap.appendChild(avatar(ch,30));tap.appendChild(T(ch.name,F.outS,16,C.text));tap.appendChild(T('View channel',F.mono,11.5,C.dim));tap.appendChild(icon(IC.chevR,C.dim,13));
  hr.appendChild(T('YouTube ↗',F.mono,12,C.dim));
  const row=AL('HORIZONTAL',{name:'Latest 10 (scroll →)',itemSpacing:14});addFill(s,row);row.clipsContent=true;row.overflowDirection='HORIZONTAL';V[k].slice(0,10).forEach(v=>row.appendChild(card(ch,v,240)));
  const inst=dsets[k].defaultVariant.createInstance();addFill(s,inst);if(open&&k==='O')inst.setProperties({State:'Open'});}
 nav(scr,'Feed',true);}});

// ---- desktop History ----
await step('dhistory',async()=>{const H=screen(P+'History',3080,DY,DW,DH);
 const clr=AL('HORIZONTAL',{name:'Clear all',itemSpacing:6,counterAxisAlignItems:'CENTER'});clr.appendChild(icon(IC.trash,C.dim,14));clr.appendChild(T('Clear all history',F.mono,12,C.dim));
 pageHeader(H,'History',clr,{px:PX,sub:'Everything you watched, newest first'});
 const wrap=AL('HORIZONTAL',{name:'Layout'});H.appendChild(wrap);wrap.layoutSizingHorizontal='FILL';wrap.layoutSizingVertical='FILL';
 const side=AL('VERTICAL',{name:'Filters',itemSpacing:14,paddingLeft:PX,paddingRight:24,paddingTop:22});wrap.appendChild(side);side.resize(320,10);side.layoutSizingVertical='FILL';border(side);side.strokeTopWeight=0;side.strokeLeftWeight=0;side.strokeBottomWeight=0;side.strokeRightWeight=1;
 const sf=AL('HORIZONTAL',{name:'Search history',itemSpacing:10,paddingTop:12,paddingBottom:12,paddingLeft:14,paddingRight:14,cornerRadius:12,counterAxisAlignItems:'CENTER'});sf.fills=S(C.bg2);border(sf,.15);addFill(side,sf);sf.appendChild(icon(IC.search,C.dim,16));sf.appendChild(T('Search your watch history',F.out,14,C.dim));
 side.appendChild(T('WHEN',F.monoM,11,C.dim,{ls:8}));
 for(const [l,a,n] of [['All time',true,'8'],['Today',false,'3'],['Yesterday',false,'2'],['This week',false,'3']]){const r=AL('HORIZONTAL',{name:'Filter · '+l,paddingTop:9,paddingBottom:9,paddingLeft:12,paddingRight:12,cornerRadius:8,primaryAxisAlignItems:'SPACE_BETWEEN'});r.fills=a?S(C.accent):[];addFill(side,r);r.appendChild(T(l,F.outM,14,a?'#0a0a0a':C.muted));r.appendChild(T(n,F.mono,12,a?'#0a0a0a':C.dim));}
 side.appendChild(T('SHOW',F.monoM,11,C.dim,{ls:8}));const cs=AL('HORIZONTAL',{itemSpacing:8});side.appendChild(cs);cs.appendChild(chip('Unfinished',false));cs.appendChild(chip('Finished',false));
 fillText(side,T('History is stored only on this device. Nothing leaves your browser.',F.mono,11,C.dim,{lh:17}));
 const main=AL('VERTICAL',{name:'Scroll body'});wrap.appendChild(main);main.layoutSizingHorizontal='FILL';main.layoutSizingVertical='FILL';main.clipsContent=true;main.overflowDirection='VERTICAL';main.paddingBottom=24;
 const HD=[['Today',[['O',0,.64,'Watched 2h ago · 4:20 left'],['K',0,1,'Watched 5h ago · Finished'],['U',0,.3,'Watched 6h ago · 10:58 left']]],['Yesterday',[['O',1,1,'Watched yesterday · Finished'],['U',2,.82,'Watched yesterday · 3:04 left']]],['This week',[['K',1,.45,'Watched Tue · 12:12 left'],['O',3,1,'Watched Mon · Finished'],['U',4,.2,'Watched Mon · 11:47 left']]]];
 for(const [g,items] of HD){groupLabel(main,g,PX);for(const [k,i,p,m] of items)vrow(main,CH[k],V[k][i],{p,meta:m,channelLink:true,right:xbtn(),tw:208,px:PX,gap:20,big:true,py:14});}
 nav(H,'History',true);});

// ---- desktop Channel Profile ----
await step('dprofile',async()=>{const Pf=screen(P+'Channel Profile',4620,DY,DW,DH);const ch=CH.O;
 const yt=AL('HORIZONTAL',{itemSpacing:4,counterAxisAlignItems:'CENTER'});yt.appendChild(T('YouTube',F.mono,12,C.dim));yt.appendChild(icon(IC.ext,C.dim,12));
 pageHeader(Pf,'Channel',yt,{back:true,size:20,pt:16,pb:14,px:PX});
 const pb=body(Pf);const top=AL('VERTICAL',{name:'Profile',itemSpacing:18,paddingLeft:PX,paddingRight:PX,paddingTop:20,paddingBottom:18});addFill(pb,top);
 const ban=thumb(1384,150,ch,['',''],{r:16,nocap:true});ban.name='Banner';top.appendChild(ban);
 const id=AL('HORIZONTAL',{name:'Identity',itemSpacing:20,counterAxisAlignItems:'CENTER'});addFill(top,id);id.appendChild(avatar(ch,88));
 const idc=AL('VERTICAL',{itemSpacing:4});id.appendChild(idc);idc.layoutSizingHorizontal='FILL';idc.appendChild(T(ch.name,F.serif,32,C.text));idc.appendChild(T(ch.handle+' · '+ch.subs+' · '+ch.total+' videos',F.mono,12.5,C.muted));idc.appendChild(T('Space and physics explained clearly. One new video every week — no clickbait, no shorts.',F.out,14,C.dim));
 const ab=AL('HORIZONTAL',{itemSpacing:10});id.appendChild(ab);ab.appendChild(btn('Following',true,IC.check));ab.appendChild(btn('Open on YouTube',false,IC.ext));
 const tabs=AL('HORIZONTAL',{name:'Tabs',paddingLeft:PX,paddingRight:PX,itemSpacing:28});addFill(pb,tabs);borderB(tabs);
 for(const [l,a] of [['Videos',true],['About',false]]){const t=AL('VERTICAL',{name:'Tab · '+l,paddingTop:10,paddingBottom:10});tabs.appendChild(t);t.appendChild(T(l,F.outM,15,a?C.text:C.dim));if(a){t.strokes=S(C.accent);t.strokeWeight=0;t.strokeBottomWeight=2;t.strokeAlign='INSIDE';}}
 const sort=AL('HORIZONTAL',{name:'Sort',paddingLeft:PX,paddingRight:PX,paddingTop:16,paddingBottom:16,primaryAxisAlignItems:'SPACE_BETWEEN',counterAxisAlignItems:'CENTER'});addFill(pb,sort);
 const sc=AL('HORIZONTAL',{itemSpacing:8});sort.appendChild(sc);['Newest','Oldest','Popular'].forEach((l,i)=>sc.appendChild(chip(l,i===0)));sort.appendChild(T('Showing 16 of '+ch.total+' videos',F.mono,12,C.dim));
 const gw=AL('VERTICAL',{name:'Grid wrap',paddingLeft:PX,paddingRight:PX});addFill(pb,gw);
 const g=AL('HORIZONTAL',{name:'Video grid',itemSpacing:21});addFill(gw,g);g.layoutWrap='WRAP';g.counterAxisSpacing=22;V.O.forEach(v=>g.appendChild(card(ch,v,259)));
 const lm=AL('VERTICAL',{name:'Load more',paddingTop:24,paddingBottom:30,itemSpacing:8,counterAxisAlignItems:'CENTER'});addFill(pb,lm);lm.appendChild(btn('Load more videos',false,IC.down));
 nav(Pf,'Channels',true);});

// ---- desktop Player ----
await step('dplayer',async()=>{const PL=screen(P+'Player',6160,DY,DW,DH);const ch=CH.O,v=V.O[0];
 pageHeader(PL,'Now playing',null,{back:true,size:20,pt:16,pb:14,px:PX});
 const pb=body(PL);const row=AL('HORIZONTAL',{name:'Layout',itemSpacing:28,paddingLeft:PX,paddingRight:PX,paddingTop:22,paddingBottom:22});addFill(pb,row);
 const L=AL('VERTICAL',{name:'Video column',itemSpacing:14});row.appendChild(L);
 const vid=thumb(940,529,ch,v,{r:14,nocap:true});vid.name='Video';vid.layoutMode='HORIZONTAL';vid.primaryAxisAlignItems='CENTER';vid.counterAxisAlignItems='CENTER';
 const play=AL('HORIZONTAL',{name:'Play',primaryAxisAlignItems:'CENTER',counterAxisAlignItems:'CENTER',paddingLeft:4});play.resize(76,76);play.cornerRadius=38;play.fills=S(C.accent);play.appendChild(icon('<path d="M7 4v16l13-8z"/>','#0a0a0a',30,'#0a0a0a'));vid.appendChild(play);L.appendChild(vid);
 const pbar=figma.createFrame();pbar.name='Progress';pbar.resize(940,4);pbar.cornerRadius=2;pbar.fills=S('#ffffff',.15);const pf=figma.createRectangle();pf.resize(600,4);pf.fills=S(C.accent);pbar.appendChild(pf);L.appendChild(pbar);
 L.appendChild(T(v[0],F.outS,24,C.text));L.appendChild(T(v[2]+' ago · '+v[1]+' · 7:44 / 12:04',F.mono,12,C.dim));
 const act=AL('HORIZONTAL',{itemSpacing:8});L.appendChild(act);for(const [l,ic] of [['Save',IC.saved],['Share',IC.share],['YouTube',IC.ext]]){const a=AL('HORIZONTAL',{name:l,itemSpacing:6,paddingTop:8,paddingBottom:8,paddingLeft:14,paddingRight:14,cornerRadius:99,counterAxisAlignItems:'CENTER'});a.fills=S(C.bg2);border(a,.15);a.appendChild(icon(ic,C.text,15));a.appendChild(T(l,F.outM,13,C.text));act.appendChild(a);}
 const R=AL('VERTICAL',{name:'Side column',itemSpacing:16});row.appendChild(R);R.layoutSizingHorizontal='FILL';
 const cr=AL('HORIZONTAL',{name:'tap:Channel Profile',itemSpacing:14,paddingTop:16,paddingBottom:16,paddingLeft:16,paddingRight:16,cornerRadius:14,counterAxisAlignItems:'CENTER'});cr.fills=S(C.bg2);border(cr);addFill(R,cr);cr.appendChild(avatar(ch,52));
 const crc=AL('VERTICAL',{itemSpacing:3});cr.appendChild(crc);crc.layoutSizingHorizontal='FILL';crc.appendChild(T(ch.name,F.outS,17,C.text));crc.appendChild(T(ch.subs,F.mono,11.5,C.dim));
 const vc=AL('HORIZONTAL',{itemSpacing:2,counterAxisAlignItems:'CENTER'});cr.appendChild(vc);vc.appendChild(T('View channel',F.outM,13.5,C.accent));vc.appendChild(icon(IC.chevR,C.accent,14));
 const note=AL('VERTICAL',{name:'No suggestions',paddingTop:40,paddingBottom:40,cornerRadius:14,counterAxisAlignItems:'CENTER',itemSpacing:6});note.strokes=S('#ffffff',.12);note.strokeWeight=1;note.dashPattern=[4,4];addFill(R,note);
 note.appendChild(T('No suggestions here.',F.serif,22,C.muted));note.appendChild(T('Watch what you came for, then leave.',F.mono,12,C.dim));
 nav(PL,'Feed',true);});

// ---- Search / Saved / Channels, mobile + desktop ----
async function simpleScreens(dk){const px=dk?PX:18,W=dk?DW:390,Hh=dk?DH:844,y=dk?DY:0,pre=dk?P:'';const xs=dk?[7700,9240,10780]:[2250,2700,3150];
 await step('search'+dk,async()=>{const s=screen(pre+'Search',xs[0],y,W,Hh);pageHeader(s,'Search',null,{px,border:false,pb:14});
  const r=AL('HORIZONTAL',{name:'Search bar',itemSpacing:10,paddingLeft:px,paddingRight:px,paddingBottom:18});addFill(s,r);borderB(r);
  const f=AL('HORIZONTAL',{name:'Field',paddingTop:13,paddingBottom:13,paddingLeft:16,paddingRight:16,cornerRadius:12});f.fills=S(C.bg2);border(f,.15);r.appendChild(f);f.layoutSizingHorizontal='FILL';f.appendChild(T('e.g. space exploration documentary',F.out,15,C.dim));
  const sb=AL('HORIZONTAL',{name:'Search button',paddingLeft:20,paddingRight:20,cornerRadius:12,counterAxisAlignItems:'CENTER'});sb.fills=S(C.accent);r.appendChild(sb);sb.layoutSizingVertical='FILL';sb.appendChild(T('Search',F.outS,15,'#0a0a0a'));
  const b=body(s);b.primaryAxisAlignItems='CENTER';b.counterAxisAlignItems='CENTER';b.itemSpacing=16;b.appendChild(icon(IC.search,'#333333',56));b.appendChild(T('Type a keyword or phrase above\nand tap Search to find top videos.',F.out,15,C.dim,{lh:24,align:'CENTER'}));
  const h=AL('HORIZONTAL',{name:'tap:History',itemSpacing:6,paddingTop:8,paddingBottom:8,paddingLeft:14,paddingRight:14,cornerRadius:99,counterAxisAlignItems:'CENTER'});h.fills=S(C.bg2);border(h,.15);b.appendChild(h);h.appendChild(icon(IC.history,C.accent,15));h.appendChild(T(dk?'Looking for something you watched? Open History':'Watched it before? Open History',F.outM,13,C.muted));
  nav(s,'Search',dk);});
 await step('saved'+dk,async()=>{const s=screen(pre+'Saved',xs[1],y,W,Hh);pageHeader(s,'Saved',T('2 videos',F.mono,13,C.dim),{px});const b=body(s);
  vrow(b,CH.O,V.O[1],{showCh:true,meta:'Saved 1d ago',right:xbtn(),tw:dk?208:120,px,big:dk});vrow(b,CH.K,V.K[1],{showCh:true,meta:'Saved 3d ago',right:xbtn(),tw:dk?208:120,px,big:dk});nav(s,'Saved',dk);});
 await step('channels'+dk,async()=>{const s=screen(pre+'Channels',xs[2],y,W,Hh);pageHeader(s,'My Channels',T('3 channels',F.mono,13,C.dim),{px});const b=body(s);
  for(const k of ['O','K','U']){const ch=CH[k];const r=AL('HORIZONTAL',{name:'tap:Channel Profile',itemSpacing:14,paddingLeft:px,paddingRight:px,paddingTop:16,paddingBottom:16,counterAxisAlignItems:'CENTER'});addFill(b,r);borderB(r);r.appendChild(avatar(ch,dk?48:40));
   const c=AL('VERTICAL',{itemSpacing:3});r.appendChild(c);c.layoutSizingHorizontal='FILL';c.appendChild(T(ch.name,F.outM,dk?17:16,C.text));c.appendChild(T(ch.handle+' · '+ch.total+' videos',F.mono,12,C.dim));
   const vc=AL('HORIZONTAL',{itemSpacing:2,counterAxisAlignItems:'CENTER'});r.appendChild(vc);vc.appendChild(T('Open',F.outM,13,C.accent));vc.appendChild(icon(IC.chevR,C.accent,14));r.appendChild(xbtn());}
  nav(s,'Channels',dk);
  const fab=AL('HORIZONTAL',{name:'Add channel',primaryAxisAlignItems:'CENTER',counterAxisAlignItems:'CENTER'});s.appendChild(fab);fab.layoutPositioning='ABSOLUTE';fab.resize(56,56);fab.cornerRadius=28;fab.fills=S(C.accent);fab.effects=[{type:'DROP_SHADOW',color:{...hex(C.accent),a:.35},offset:{x:0,y:0},radius:24,spread:0,visible:true,blendMode:'NORMAL'}];fab.appendChild(icon(IC.plus,'#0a0a0a',24));fab.x=W-px-56;fab.y=Hh-(dk?80:72)-24-56;});}
await simpleScreens(false);await simpleScreens(true);

// ---- wire every "tap:<Screen>" layer (mobile → mobile screens, desktop → desktop screens) ----
let wired=0;const missing=new Set();
await step('wire',async()=>{const byName={};for(const f of figma.currentPage.children)if(f.type==='FRAME')byName[f.name]=f;
 for(const f of figma.currentPage.children){if(!(f.type==='FRAME'||f.type==='COMPONENT_SET'))continue;const dk=f.name.startsWith('Desktop');
  const nodes=f.findAll(n=>n.name.startsWith('tap:')&&!n.id.startsWith('I'));
  for(const n of nodes){const d=n.name.slice(4);let actions;
   if(d==='BACK')actions=[{type:'BACK'}];
   else{const t=byName[(dk?P:'')+d];if(!t){missing.add(f.name+' → '+d);continue;}if(t.id===f.id)continue;
    actions=[{type:'NODE',destinationId:t.id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:0.2},preserveScrollPosition:false}];}
   await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);wired++;}}
 figma.currentPage.flowStartingPoints=[{nodeId:byName['Feed'].id,name:'Mobile prototype'},{nodeId:byName[P+'Feed'].id,name:'Desktop prototype'}];});

const summary={screens:Object.keys(made).length,links:wired,missing:[...missing],errors:errs};
console.log(JSON.stringify(summary,null,2));
figma.notify(errs.length?('Finished with '+errs.length+' error(s) — see console'):('Done: '+summary.screens+' screens, '+wired+' links'));
