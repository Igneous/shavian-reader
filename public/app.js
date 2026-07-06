// letter: ipa, name split [pre, bold, post], class
const L = {
'𐑐':['/p/','','p','eep','tall'],
'𐑑':['/t/','','t','ot','tall'],
'𐑒':['/k/','','k','ick','tall'],
'𐑓':['/f/','','f','ee','tall'],
'𐑔':['/θ/','','th','igh','tall'],
'𐑕':['/s/','','s','o','tall'],
'𐑖':['/ʃ/','','s','ure','tall'],
'𐑗':['/ʧ/','','ch','urch','tall'],
'𐑘':['/j/','','y','ea','tall'],
'𐑙':['/ŋ/','hu','ng','','tall'],
'𐑚':['/b/','','b','ib','deep'],
'𐑛':['/d/','','d','ead','deep'],
'𐑜':['/ɡ/','','g','ag','deep'],
'𐑝':['/v/','','v','ow','deep'],
'𐑞':['/ð/','','th','ey','deep'],
'𐑟':['/z/','','z','oo','deep'],
'𐑠':['/ʒ/','mea','s','ure','deep'],
'𐑡':['/ʤ/','','j','udge','deep'],
'𐑢':['/w/','','w','oe','deep'],
'𐑣':['/h/','','h','a-ha','deep'],
'𐑤':['/l/','','l','oll','short'],
'𐑥':['/m/','','m','ime','short'],
'𐑦':['/ɪ/~/i/','','i','f','short'],
'𐑧':['/ɛ/','','e','gg','short'],
'𐑨':['/æ/','','a','sh','short'],
'𐑩':['/ə/','','a','do','short'],
'𐑪':['/ɒ/','','o','n','short'],
'𐑫':['/ʊ/~/u/','w','oo','l','short'],
'𐑬':['/aʊ/','','ou','t','short'],
'𐑭':['/ɑː/','','a','h','short'],
'𐑮':['/r/','','r','oar','short'],
'𐑯':['/n/','','n','un','short'],
'𐑰':['/iː/','','ea','t','short'],
'𐑱':['/eɪ/','','a','ge','short'],
'𐑲':['/aɪ/','','i','ce','short'],
'𐑳':['/ʌ/','','u','p','short'],
'𐑴':['/əʊ/','','oa','k','short'],
'𐑵':['/uː/','','oo','ze','short'],
'𐑶':['/ɔɪ/','','oi','l','short'],
'𐑷':['/ɔː/','','aw','e','short'],
'𐑸':['/ɑː(r)/','','ar','e','compound'],
'𐑹':['/ɔː(r)/','','or','','compound'],
'𐑺':['/ɛə(r)/','','air','','compound'],
'𐑻':['/ɜː(r)/','','err','','compound'],
'𐑼':['/ə(r)/','','arr','ay','compound'],
'𐑽':['/ɪə(r)/','','ear','','compound'],
'𐑾':['/ɪə/','','Ia','n','compound'],
'𐑿':['/juː/','','yew','','compound']
};
const ORDER = '𐑐𐑑𐑒𐑓𐑔𐑕𐑖𐑗𐑘𐑙 𐑚𐑛𐑜𐑝𐑞𐑟𐑠𐑡𐑢𐑣 𐑤𐑥𐑦𐑧𐑨𐑩𐑪𐑫𐑬𐑭𐑮𐑯𐑰𐑱𐑲𐑳𐑴𐑵𐑶𐑷 𐑸𐑹𐑺𐑻𐑼𐑽𐑾𐑿';
const GROUPS = [['Tall — voiceless',0],['Deep — voiced',1],['Short — vowels, nasals, liquids',2],['Compound — vowel + R',3]];

// ---- dictionaries ----
const DICTS = {
  amer: { label:'Amerilex', cls:'amer', badge:'A',
          url:'data/amerilex.trimmed.tsv.gz', cols:['word','sh','pos','freq'],
          fwd:null, rev:null, state:'idle', count:0 },
  read: { label:'ReadLex', cls:'read', badge:'R',
          url:'data/readlex_sw.tsv.gz', cols:['word','sh','pos','ipa','freq'],
          fwd:null, rev:null, state:'idle', count:0 }
};
const DICT_ORDER = ['amer','read'];
let enabled = new Set(['amer']);

const isShavian = ch => { const c = ch.codePointAt(0); return c >= 0x10450 && c <= 0x1047F; };
const hasShavian = s => [...s].some(isShavian);
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function fetchGunzip(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
  const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

async function loadDict(id){
  const d = DICTS[id];
  if(d.state === 'ready' || d.state === 'loading') return;
  d.state = 'loading';
  updateStatus();
  const text = await fetchGunzip(d.url);
  d.fwd = new Map();
  d.rev = new Map();
  const ci = {}; d.cols.forEach((c,i)=>ci[c]=i);
  let n = 0;
  for(const line of text.split('\n')){
    if(!line) continue;
    const p = line.split('\t');
    const word = p[ci.word], sh = p[ci.sh];
    if(!word || !sh) continue;
    const pos = p[ci.pos] || '';
    const ipa = ci.ipa !== undefined ? (p[ci.ipa] || '') : '';
    const f = parseInt(p[ci.freq],10) || 0;
    const w = word.toLowerCase();
    if(!d.fwd.has(w)) d.fwd.set(w, []);
    d.fwd.get(w).push({sh, pos, ipa, f});
    if(!d.rev.has(sh)) d.rev.set(sh, []);
    d.rev.get(sh).push({word: w, pos, ipa, f});
    n++;
  }
  for(const list of d.rev.values()) list.sort((a,b)=>b.f-a.f);
  d.count = n;
  d.state = 'ready';
  updateStatus();
}

function updateStatus(){
  const parts = DICT_ORDER.map(id => {
    const d = DICTS[id];
    if(d.state === 'ready') return `${d.label}: ${d.count.toLocaleString()} entries`;
    if(d.state === 'loading') return `${d.label}: loading…`;
    return `${d.label}: idle`;
  });
  document.getElementById('status').textContent = parts.join(' · ');
  for(const id of DICT_ORDER){
    const tg = document.getElementById('tg-' + id);
    tg.classList.toggle('loading', DICTS[id].state === 'loading');
    tg.classList.toggle('on', enabled.has(id));
  }
}

const activeDicts = () => DICT_ORDER.filter(id => enabled.has(id) && DICTS[id].state === 'ready');
const missText = () => 'not in ' + [...enabled].map(id => DICTS[id].label).join(' or ');

// ---- letter rendering ----
function letterCard(ch){
  const d = L[ch];
  if(!d){
    if(ch === '·') return `<div class="lt other"><span class="g">·</span><span class="ipa">&nbsp;</span><span class="nm">namer dot</span><span class="cls">proper name</span></div>`;
    return `<div class="lt other"><span class="g">${esc(ch)}</span><span class="ipa">&nbsp;</span><span class="nm">&nbsp;</span><span class="cls">&nbsp;</span></div>`;
  }
  const [ipa, pre, b, post, cls] = d;
  return `<div class="lt ${cls}">
    <span class="g">${ch}</span>
    <span class="ipa">${esc(ipa)}</span>
    <span class="nm">${esc(pre)}<b>${esc(b)}</b>${esc(post)}</span>
    <span class="cls">${cls}</span>
  </div>`;
}
const breakdown = sh => `<div class="letters">${[...sh].map(letterCard).join('')}</div>`;

// ---- word rendering ----
// scanner rule: a space-separated token renders iff it contains Shavian.
// Non-Shavian characters are trimmed from the edges; internal ones (apostrophes,
// hyphens) are kept, since dictionary entries contain them.
const EDGE_STRIP = /^[^\u{10450}-\u{1047F}]+|[^\u{10450}-\u{1047F}]+$/gu;
let latinCards = false; // toggled by the Latin lookup checkbox
function coreOf(tok){
  if(!hasShavian(tok)){
    if(!latinCards) return null;
    const core = tok.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g,'');
    if(!core || !/^[a-z']+$/.test(core) || !/[a-z]/.test(core)) return null;
    return {type:'lat', core, namer:false};
  }
  const core = tok.replace(EDGE_STRIP,'');
  if(!core) return null;
  const namer = /^·/.test(tok.replace(/^[^\u{10450}-\u{1047F}·]+/u,''));
  return {type:'sh', core, namer};
}

function shavianLexLines(key){
  const lines = [];
  for(const id of activeDicts()){
    const d = DICTS[id];
    const m = d.rev.get(key);
    if(!m || !m.length) continue;
    // group by word: collect pos, ipa
    const byWord = new Map();
    for(const e of m){
      if(!byWord.has(e.word)) byWord.set(e.word, {pos:new Set(), ipa:new Set()});
      if(e.pos) byWord.get(e.word).pos.add(e.pos);
      if(e.ipa) byWord.get(e.word).ipa.add(e.ipa);
    }
    const shown = [...byWord.entries()].slice(0,6).map(([w, info]) => {
      let s = esc(w);
      if(info.ipa.size) s += ` <span class="wipa">/${esc([...info.ipa][0])}/</span>`;
      if(info.pos.size) s += ` <span class="pos">(${[...info.pos].map(esc).join(', ')})</span>`;
      return s;
    }).join(', ');
    lines.push(`<span class="lex hit ${d.cls}">${d.label}: ${shown}${byWord.size>6?', …':''}</span>`);
  }
  if(!lines.length) return `<span class="lex miss">${esc(missText())}</span>`;
  return lines.join(' ');
}

function renderShavianWord(core, namer){
  return `<div class="word-card">
    <div class="word-head">
      <span class="word-sh">${namer ? '·' : ''}${esc(core)}</span>
      ${namer ? '<span class="namer">namer dot · proper name</span>' : ''}
      ${shavianLexLines(core)}
    </div>
    ${breakdown(core)}
  </div>`;
}

function renderLatinWord(key){
  // variants keyed by shavian spelling, sources per dict
  const bySh = new Map();
  let found = false;
  for(const id of activeDicts()){
    const entries = DICTS[id].fwd.get(key);
    if(!entries) continue;
    found = true;
    for(const e of entries){
      if(!bySh.has(e.sh)) bySh.set(e.sh, {maxf:0, src:new Map()});
      const v = bySh.get(e.sh);
      v.maxf = Math.max(v.maxf, e.f);
      if(!v.src.has(id)) v.src.set(id, {pos:new Set(), ipa:new Set()});
      if(e.pos) v.src.get(id).pos.add(e.pos);
      if(e.ipa) v.src.get(id).ipa.add(e.ipa);
    }
  }
  if(!found){
    return `<div class="word-card">
      <div class="word-head"><span class="word-lat">${esc(key)}</span><span class="lex miss">${esc(missText())}</span></div>
    </div>`;
  }
  const variants = [...bySh.entries()].sort((a,b)=>b[1].maxf-a[1].maxf).map(([sh, v]) => {
    const badges = DICT_ORDER.filter(id => v.src.has(id)).map(id => {
      const d = DICTS[id], info = v.src.get(id);
      let t = `<span class="src ${d.cls}" title="${d.label}">${d.badge}</span>`;
      const bits = [];
      if(info.ipa.size) bits.push(`<span class="wipa">/${esc([...info.ipa][0])}/</span>`);
      if(info.pos.size) bits.push(`<span class="pos">(${[...info.pos].map(esc).join(', ')})</span>`);
      if(bits.length) t += ` <span class="lex hit ${d.cls}">${bits.join(' ')}</span>`;
      return t;
    }).join(' ');
    return `<div class="variant">
      <div class="word-head"><span class="word-sh">${esc(sh)}</span>${badges}</div>
      ${breakdown(sh)}
    </div>`;
  }).join('');
  return `<div class="word-card">
    <div class="word-head"><span class="word-lat">${esc(key)}</span></div>
    ${variants}
  </div>`;
}

function render(){
  const text = getText();
  const out = document.getElementById('results');
  const lines = text.split(/\n/);
  const cardFor = c => c.type === 'sh' ? renderShavianWord(c.core, c.namer) : renderLatinWord(c.core);
  const html = lines.map(line => line.split(/\s+/).filter(Boolean)
    .map(coreOf).filter(Boolean).map(cardFor).join(''))
    .filter(Boolean).join('<div class="br"></div>');
  if(!html){ out.innerHTML = '<p class="empty">Type or paste text above.</p>'; return; }
  out.innerHTML = html;
}

// ---- legend ----
function buildLegend(){
  const groups = ORDER.split(' ');
  document.getElementById('legendBody').innerHTML = GROUPS.map(([label,i]) => `
    <div class="leg-group">
      <div class="leg-label" style="color:var(--${['tall','deep','short','compound'][i]})">${label}</div>
      <div class="leg-row">${[...groups[i]].map(ch => {
        const d = L[ch];
        return `<div class="leg-cell"><span class="g">${ch}</span><span class="i">${esc(d[0])}</span><span class="n">${esc(d[1])}<b>${esc(d[2])}</b>${esc(d[3])}</span></div>`;
      }).join('')}</div>
    </div>`).join('');
}

document.getElementById('legendBtn').addEventListener('click', e => {
  const leg = document.getElementById('legend');
  const open = leg.classList.toggle('open');
  e.target.textContent = open ? 'Hide alphabet' : 'Show alphabet';
  e.target.setAttribute('aria-expanded', String(open));
});

// ---- editable input with live highlighting ----
const editor = document.getElementById('input');
const pop = document.getElementById('popover');

// observe external text changes (e.g. KeymanWeb writes directly to the DOM
// without firing input events); our own rewrites are excluded below
const OBS_CFG = {childList:true, characterData:true, subtree:true};
const obs = new MutationObserver(() => { hidePop(); clearTimeout(t); t = setTimeout(refresh, 180); });

function getText(){ return editor.innerText.replace(/\u00a0/g,' '); }

function caretOffset(){
  const sel = window.getSelection();
  if(!sel.rangeCount || !editor.contains(sel.anchorNode)) return null;
  const r = sel.getRangeAt(0);
  const pre = document.createRange();
  pre.selectNodeContents(editor);
  pre.setEnd(r.endContainer, r.endOffset);
  return pre.toString().length;
}

function setCaret(off){
  const sel = window.getSelection();
  const r = document.createRange();
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let node, rem = off;
  while((node = walker.nextNode())){
    if(rem <= node.length){ r.setStart(node, rem); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); return; }
    rem -= node.length;
  }
  r.selectNodeContents(editor); r.collapse(false);
  sel.removeAllRanges(); sel.addRange(r);
}

function coreKnown(c){
  for(const id of activeDicts()){
    const map = c.type === 'sh' ? DICTS[id].rev : DICTS[id].fwd;
    if(map.has(c.core)) return true;
  }
  return activeDicts().length ? false : null;
}

function highlight(){
  const text = getText();
  const focused = document.activeElement === editor;
  const off = focused ? caretOffset() : null;
  let html = '';
  const re = /(\s+)|(\S+)/g;
  let m;
  while((m = re.exec(text))){
    if(m[1]){ html += esc(m[1]); continue; }
    const tok = m[2];
    const c = coreOf(tok);
    if(!c){ html += esc(tok); continue; }
    const known = coreKnown(c);
    const cls = known === null ? '' : known ? ' hit' : ' miss';
    html += '<span class="tok' + cls + '" data-type="' + c.type + '" data-namer="' + (c.namer?1:0) + '" data-core="' + esc(c.core) + '">' + esc(tok) + '</span>';
  }
  obs.disconnect();
  editor.innerHTML = html;
  if(off !== null) setCaret(off);
  obs.takeRecords();
  obs.observe(editor, OBS_CFG);
  if(window.keyman && keyman.resetContext){ try{ keyman.resetContext(); }catch(e){} }
}

function hidePop(){ pop.style.display = 'none'; pop.setAttribute('aria-hidden','true'); }
function showPop(el){
  const core = el.dataset.core;
  if(!core) return;
  pop.innerHTML = el.dataset.type === 'sh' ? renderShavianWord(core, el.dataset.namer === '1') : renderLatinWord(core);
  pop.style.display = 'block';
  pop.setAttribute('aria-hidden','false');
  const rect = el.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = Math.min(Math.max(rect.left, 8), window.innerWidth - pw - 8);
  let top = rect.bottom + 8;
  if(top + ph > window.innerHeight - 8) top = Math.max(rect.top - ph - 8, 8);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

editor.addEventListener('mouseover', e => { const el = e.target.closest('.tok'); if(el) showPop(el); });
editor.addEventListener('mouseout', e => { if(e.target.closest('.tok')) hidePop(); });
editor.addEventListener('click', e => {
  const el = e.target.closest('.tok');
  if(el) showPop(el);
  // recovery: after a layout switch KMW can lose its active target while DOM
  // focus stays in the editor, so clicks fire no focus event and osk.show()
  // no-ops. A real blur->focus cycle makes KMW re-acquire the target.
  if(cbKbd.checked && kmwState === 'ready'){
    const f = document.querySelector('.kmw-osk-frame');
    if(!f || getComputedStyle(f).display === 'none'){ editor.blur(); editor.focus(); }
    oskShow(true);
  }
});
window.addEventListener('scroll', hidePop, {passive:true});

// keep content as plain text nodes so caret math stays exact
editor.addEventListener('keydown', e => {
  if(e.key === 'Enter'){ e.preventDefault(); document.execCommand('insertText', false, '\n'); }
});
editor.addEventListener('paste', e => {
  e.preventDefault();
  const t = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, t);
});

let composing = false;
editor.addEventListener('compositionstart', () => { composing = true; });
editor.addEventListener('compositionend', () => { composing = false; refresh(); });

function refresh(){ if(composing) return; highlight(); render(); }
let t;
editor.addEventListener('input', () => { hidePop(); clearTimeout(t); t = setTimeout(refresh, 180); });

// ---- dictionary toggles ----
document.querySelectorAll('.dict-toggle input[data-dict]').forEach(cb => {
  cb.addEventListener('change', async () => {
    const id = cb.dataset.dict;
    if(!cb.checked && enabled.size === 1 && enabled.has(id)){
      cb.checked = true; // keep at least one dictionary on
      return;
    }
    if(cb.checked){
      enabled.add(id);
      updateStatus();
      if(DICTS[id].state !== 'ready'){
        try { await loadDict(id); }
        catch(err){
          document.getElementById('status').textContent = DICTS[id].label + ' failed to load: ' + err.message;
          enabled.delete(id);
          cb.checked = false;
          updateStatus();
          return;
        }
      }
    } else {
      enabled.delete(id);
      updateStatus();
    }
    refresh();
  });
});

obs.observe(editor, OBS_CFG);

// ---- onscreen keyboard (KeymanWeb, self-hosted in vendor/) ----
const KBDS = [
  { id:'english_shavian_jafl',   name:'Shaw JAFL', version:'1.2' },
  { id:'english_shavian_igc',    name:'Imperial',  version:'1.3' },
  { id:'english_shavian_qwerty', name:'QWERTY',    version:'1.2' }
];
let kmwState = 'idle'; // idle | loading | ready | failed
const cbKbd = document.getElementById('cb-kbd');
const cbLat = document.getElementById('cb-lat');
const kbdPick = document.getElementById('kbd-pick');

async function initKeyman(){
  if(kmwState === 'ready' || kmwState === 'loading') return;
  kmwState = 'loading';
  document.getElementById('tg-kbd').classList.add('loading');
  try{
    if(typeof keyman === 'undefined') throw new Error('KeymanWeb engine missing');
    // OSK css/fonts resolve relative to where keymanweb.js was loaded from (vendor/osk/)
    await keyman.init({attachType:'manual'});
    await keyman.addKeyboards(...KBDS.map(k => ({
      id: k.id,
      name: k.name,
      version: k.version,
      language: [{ id:'en-shaw', name:'English (Shavian)',
                   font:{family:'Inter Alia'},
                   oskFont:{family:'Inter Alia'} }],
      filename: new URL('vendor/' + k.id + '.js', location.href).href
    })));
    keyman.attachToControl(editor);
    // force-load every keyboard file now (local, ~60KB each) so layout
    // switches never race an async fetch on focus
    for(const k of KBDS) await keyman.setActiveKeyboard('Keyboard_' + k.id, 'en-shaw');
    keyman.setKeyboardForControl(editor, kbdPick.value, 'en-shaw');
    kmwState = 'ready';
    if(!cbKbd.checked) keyman.disableControl(editor);
  }catch(err){
    kmwState = 'failed';
    cbKbd.checked = false;
    kbdPick.hidden = true;
    document.getElementById('tg-kbd').classList.remove('on');
    document.getElementById('tg-kbd').title = 'KeymanWeb failed to load: ' + err.message;
    document.getElementById('status').textContent += ' · keyboard failed: ' + err.message;
    document.querySelectorAll('.kmw-wait-background,.kmw-wait-box,.kmw-alert-close').forEach(el => el.remove());
  }
  document.getElementById('tg-kbd').classList.remove('loading');
}

kbdPick.addEventListener('change', () => {
  if(kmwState !== 'ready') return;
  keyman.setKeyboardForControl(editor, kbdPick.value, 'en-shaw');
  // don't fight the native dropdown over focus (its popup can hold system
  // focus without DOM events). Force a clean blur; the user's next click
  // into the editor is a real blur->focus transition, which reliably
  // activates the newly bound (preloaded) layout.
  editor.blur();
  kbdPick.blur();
  oskShow(false);
});

function oskShow(on){
  if(kmwState !== 'ready' || !window.keyman || !keyman.osk) return;
  try{ on ? keyman.osk.show(true) : keyman.osk.hide(); }
  catch(e){ try{ keyman.osk.show(!!on); }catch(e2){} }
}

editor.addEventListener('focus', () => { if(cbKbd.checked) oskShow(true); });
editor.addEventListener('blur', () => { oskShow(false); });

cbKbd.addEventListener('change', async () => {
  document.getElementById('tg-kbd').classList.toggle('on', cbKbd.checked);
  kbdPick.hidden = !cbKbd.checked;
  if(cbKbd.checked){
    if(kmwState !== 'ready') await initKeyman();
    if(kmwState === 'ready'){
      keyman.enableControl(editor);
      if(document.activeElement === editor) oskShow(true);
    }
  } else if(kmwState === 'ready'){
    keyman.disableControl(editor);
    oskShow(false);
  }
});

cbLat.addEventListener('change', () => {
  latinCards = cbLat.checked;
  document.getElementById('tg-lat').classList.toggle('on', latinCards);
  refresh();
});

// ---- startup ----
buildLegend();
initKeyman();
(async () => {
  try { await loadDict('amer'); }
  catch(err){ document.getElementById('status').textContent = 'Amerilex failed to load: ' + err.message + ' — letter breakdown still works.'; }
  refresh();
  // preload ReadLex in the background so toggling it is instant
  loadDict('read').then(refresh).catch(() => { /* loaded on demand if this fails */ });
})();
