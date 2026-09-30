/* DEXLESS Design System Editor
 * Left: components & foundations · Center: live demo (iframe) · Right: properties.
 * Variant edits change design tokens (design-system.css). Instance edits are stored per
 * fingerprint and applied by ds-runtime.js inside the page. */
(function () {
  'use strict';
  const { COMPONENTS, FOUNDATIONS, ICONS, GENERIC, G_PROPS, defaultState, defaultLib, buildCSS, tokenName, isThemed, hardFor, clone, variantsOf, matchFor, customSel } = window.DSCore;
  const DEMO_HTML = window.DS_DEMO_HTML, RUNTIME = window.DS_RUNTIME_SRC;
  const STORE = 'dexless-ds-editor-v1';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* Components as the editor sees them: built-ins (renamed, with their custom variants, deleted
   * variants flagged) plus custom components, which borrow their base type's spec. */
  function allComps() {
    const L = state.lib, nm = (k, d) => L.names[k] || d;
    const custom = L.comps.map(cc => {
      const b = COMPONENTS.find(c => c.id === cc.base);
      return Object.assign({}, b, { id: cc.id, baseId: b.id, name: cc.name, zh: cc.zh || '自訂 · ' + b.name, custom: true, root: '.ds-c-' + cc.id, variants: variantsOf(b, state).filter(v => v.custom && v.owner === cc.id) });
    });
    const built = COMPONENTS.map(c => Object.assign({}, c, {
      baseId: c.id, name: nm(c.id, c.name),
      variants: variantsOf(c, state).filter(v => !v.custom || v.owner === c.id).map(v => Object.assign({}, v, v.custom ? {} : { label: nm(c.id + '/' + v.id, v.label), deleted: L.deleted.includes(c.id + '/' + v.id) })),
    }));
    return custom.concat(built);
  }
  const compById = id => allComps().find(c => c.id === id);
  const baseOf = c => COMPONENTS.find(x => x.id === (c.baseId || c.id));
  const genById = id => GENERIC.find(g => g.id === id);
  const genName = g => state.lib.names['g:' + g.id] || g.name;

  const PAGES = [
    ['profile:overview', 'Trader Profile · Overview'], ['profile:performance', 'Trader Profile · Performance'], ['profile:assets', 'Trader Profile · Assets'],
    ['profile:orders', 'Trader Profile · Trade history'], ['profile:account', 'Trader Profile · Account history'], ['profile:ask', 'Trader Profile · Ask Agent'],
    ['profile:behavior', 'Trader Profile · Behavior'], ['profile:alerts', 'Trader Profile · Alerts'], ['profile:settings', 'Trader Profile · Settings'],
    ['trade', 'Trade'], ['markets', 'Markets'], ['rewards', 'Rewards'], ['points', 'Points'], ['vaults', 'Vaults'], ['referral', 'Referral'], ['swap', 'Swap'],
  ];
  const CTX_NAMES = { agw: 'Agent 視窗', spw: 'Support 視窗', pops: '即時通知', popc: '通知彈窗', toast: 'Toast', orderModal: '下單確認', brainMdl: 'API Key 對話框', cdock: '浮動 Dock', devbar: 'Demo 控制列', nav: '頂部導覽', side: '側欄', frame: '全域' };
  const ctxName = ctx => CTX_NAMES[ctx] || (PAGES.find(p => p[0] === ctx) || [0, ctx.replace(':', ' · ')])[1];

  /* ---------- state ---------- */
  let state = load() || defaultState();
  const ui = { sel: null, hover: null, mode: 'variant', view: { type: 'none' }, selectMode: true, width: 1440, zoom: 'fit', theme: 'dark', tilt: false, page: 'profile:overview', open: {}, instOpen: {},
    tab: 'preview', palOpen: true, placedOpen: true, libFilter: '', libStates: {}, reportOpen: false };
  let undo = [], redo = [], lastSnap = JSON.stringify(state), commitT;

  function load() {
    try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.version === 1) return mergeDefaults(s); } catch (e) { }
    return null;
  }
  // keep saved edits, but pick up tokens/props added to the spec later
  function mergeDefaults(s) {
    const d = defaultState();
    d.foundations.forEach(g => { const sg = (s.foundations || []).find(x => x.id === g.id); if (sg) g.tokens.forEach(t => { const st = sg.tokens.find(x => x.name === t.name); if (st) Object.assign(t, st); }); });
    // values saved for keys the spec does not have by default (custom variants, optional width /
    // height props) are kept as they are
    const deep = (a, b) => {
      if (!b || typeof b !== 'object') return;
      Object.keys(a).forEach(k => { if (k in b) { if (a[k] && typeof a[k] === 'object' && !isThemed(a[k]) && !('sel' in a[k])) deep(a[k], b[k]); else a[k] = b[k]; } });
      Object.keys(b).forEach(k => { if (!(k in a)) a[k] = b[k]; });
    };
    Object.keys(d.components).forEach(id => deep(d.components[id], (s.components || {})[id]));
    d.variantIcons = s.variantIcons || {}; d.instances = s.instances || {};
    d.lib = Object.assign(defaultLib(), s.lib || {}); d.placed = s.placed || [];
    return d;
  }
  let savedAt = null;
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); savedAt = new Date(); updateSaved(); } catch (e) { } }
  function updateSaved() {
    const el = $('#savedLbl'); if (!el) return;
    el.textContent = savedAt ? '已儲存 ' + savedAt.toTimeString().slice(0, 5) : '';
  }
  function commit() {
    clearTimeout(commitT);
    commitT = setTimeout(flushCommit, 350);
  }
  function flushCommit() {
    clearTimeout(commitT);
    const snap = JSON.stringify(state);
    if (snap === lastSnap) return;
    undo.push(lastSnap); if (undo.length > 150) undo.shift(); redo = []; lastSnap = snap; save(); updateUndoButtons();
  }
  function refreshAll() { applyAll(); renderLeft(); renderRight(); if (ui.tab === 'library') renderLib(); }
  function restore(snap) {
    state = JSON.parse(snap); lastSnap = snap; save();
    if (ui.sel && ui.sel.lib && !libSelValid(ui.sel)) ui.sel = null;
    refreshAll(); updateUndoButtons();
  }
  function doUndo() { if (!undo.length) return; redo.push(JSON.stringify(state)); restore(undo.pop()); toast('已復原'); }
  function doRedo() { if (!redo.length) return; undo.push(JSON.stringify(state)); restore(redo.pop()); toast('已重做'); }
  function updateUndoButtons() { $('#bUndo').disabled = !undo.length; $('#bRedo').disabled = !redo.length; }

  /* ---------- compose page HTML (used by preview & export) ---------- */
  function runtimeData() { return { variantIcons: state.variantIcons, instances: state.instances, placed: state.placed, match: matchFor(state) }; }
  function overridesJSON() { return JSON.stringify(runtimeData()).replace(/</g, '\\u003c'); }
  function composeHTML({ inlineCSS, css }) {
    let html = DEMO_HTML;
    const link = '<link rel="stylesheet" href="design-system.css" id="ds-css">';
    if (inlineCSS) html = html.replace(link, () => `<style id="ds-css">\n${css}</style>`);
    const tail = `<script id="ds-overrides" type="application/json">${overridesJSON()}</script>\n<script>window.DS_MATCH=${JSON.stringify(matchFor(state))};</script>\n<script>\n${RUNTIME}\n</script>\n</body>`;
    return html.replace('</body>', () => tail);
  }

  /* ---------- preview ---------- */
  const frame = $('#preview');
  let W, D;      // demo preview
  let LW, LD;    // component library
  function bootPreview() {
    frame.srcdoc = composeHTML({ inlineCSS: true, css: buildCSS(state) });
    frame.onload = () => {
      W = frame.contentWindow; D = frame.contentDocument;
      installFrame();
      setTimeout(() => { syncFromFrame(); renderLeft(); renderRight(); }, 300);
    };
  }
  function applyCSS() {
    const css = buildCSS(state);
    if (D) D.getElementById('ds-css').textContent = css;
    if (LD) { LD.getElementById('ds-css').textContent = css; libSpecsSoon(); }
  }
  function applyRuntime() {
    if (W && W.DSRuntime) W.DSRuntime.set(clone(runtimeData()));
    if (LW && LW.DSRuntime) LW.DSRuntime.set({ variantIcons: clone(state.variantIcons), instances: {}, placed: [], match: matchFor(state) });
  }
  function applyAll() { applyCSS(); applyRuntime(); }

  // overlay: fixed pool of boxes (style-only updates, so the page's MutationObservers stay quiet)
  let OV = {};
  let drag = null, suppressClick = false;   // drag from the component panel / move a placed component
  function installFrame() {
    const st = D.createElement('style');
    st.textContent = `#ds-overlay{position:fixed;inset:0;pointer-events:none;z-index:2147483647}
#ds-overlay div{position:fixed;display:none;box-sizing:border-box;border-radius:3px}
#ds-overlay .h{outline:1.5px dashed #7c9cff;outline-offset:1px}
#ds-overlay .s{outline:2px solid #4f7cff;outline-offset:2px;box-shadow:0 0 0 9999px rgba(8,10,20,.0)}
#ds-overlay .p{outline:1.5px solid rgba(79,124,255,.55);outline-offset:1px;background:rgba(79,124,255,.06)}
#ds-overlay .l{background:#4f7cff;color:#fff;font:600 11px/1 system-ui,sans-serif;padding:4px 6px;border-radius:4px;white-space:nowrap}
body.ds-picking,body.ds-picking *{cursor:crosshair!important}
body.ds-dragging,body.ds-dragging *{cursor:grabbing!important;user-select:none!important}
#ds-overlay .z{outline:2px dashed #3ddc97;outline-offset:-2px;background:rgba(61,220,151,.08)}
#ds-overlay .i{background:#3ddc97;border-radius:2px;box-shadow:0 0 0 3px rgba(61,220,151,.25)}
#ds-overlay .il{background:#1f9d68;color:#fff;font:600 11px/1 system-ui,sans-serif;padding:4px 6px;border-radius:4px;white-space:nowrap}
#ds-probe{position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none}`;
    D.head.appendChild(st);
    const ov = D.createElement('div'); ov.id = 'ds-overlay';
    const mk = cls => { const e = D.createElement('div'); e.className = cls; ov.appendChild(e); return e; };
    OV = { h: mk('h'), s: mk('s'), l: mk('l'), p: Array.from({ length: 120 }, () => mk('p')), z: mk('z'), i: mk('i'), il: mk('il') };
    OV.l.appendChild(D.createTextNode(''));
    D.body.appendChild(ov);
    const probe = D.createElement('div'); probe.id = 'ds-probe'; probe.innerHTML = '<i></i>';
    D.querySelector('.frame').appendChild(probe);
    OV.probe = probe.firstChild;
    // copy the icon sprite so the editor can show icons
    const sprite = D.querySelector('svg symbol') && D.querySelector('svg symbol').parentNode;
    if (sprite && !$('#spriteHost').children.length) $('#spriteHost').innerHTML = sprite.outerHTML;

    const pick = e => {
      if (e.target.closest && e.target.closest('#ds-overlay')) return null;
      const el = e.target.closest ? e.target.closest(W.DSRuntime.ROOTS + ',[data-ds-id]') : null;
      return el;
    };
    D.addEventListener('mousemove', e => { ui.hover = (ui.selectMode || e.altKey) && !drag ? pick(e) : null; }, true);
    D.addEventListener('mouseleave', () => { ui.hover = null; }, true);
    // drag a placed component to move it (select mode, or Alt). Registered before the
    // select-mode blockers below, which stop the pointer events from reaching later listeners.
    D.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !(ui.selectMode || e.altKey)) return;
      const host = e.target.closest && e.target.closest('[data-ds-id]'); if (!host) return;
      const top = host;
      drag = { kind: 'move', id: top.dataset.dsId, el: top, x: e.clientX, y: e.clientY, active: false, label: placedLabel(placedById(top.dataset.dsId)) };
    }, true);
    D.addEventListener('pointermove', e => {
      if (!drag || drag.kind !== 'move') return;
      if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.active = true; D.body.classList.add('ds-dragging');
      drag.target = dropAt(e.clientX, e.clientY, drag.el); showDrop(drag.target, drag.label);
    }, true);
    D.addEventListener('pointerup', () => {
      if (!drag || drag.kind !== 'move') return;
      const d = drag; drag = null; D.body.classList.remove('ds-dragging'); showDrop(null);
      if (!d.active) return;
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 300);
      if (d.target) movePlaced(d.id, d.target);
    }, true);
    // In select mode only clicks that land on a component are captured; everything else
    // (backdrops, close buttons, nav links…) keeps the demo's own behaviour.
    const capture = e => (ui.selectMode || e.altKey) && pick(e);
    ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick'].forEach(t => D.addEventListener(t, e => { if (capture(e)) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } }, true));
    D.addEventListener('click', e => {
      const el = capture(e);
      if (suppressClick) { suppressClick = false; if (el) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } return; }
      if (!el) { setTimeout(() => { syncFromFrame(); renderLeft(); }, 80); return; }
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      selectElement(el);
    }, true);
    D.addEventListener('keydown', onKey, true);
    D.body.classList.toggle('ds-picking', ui.selectMode);
    requestAnimationFrame(drawOverlay);
  }
  function findFp(fp) {
    if (!D || !fp) return null;
    const m = fp.match(/\|placed\|(.+)$/);
    if (m) return D.querySelector(`[data-ds-id="${CSS.escape(m[1])}"]`);
    return D.querySelector(`[data-ds-fp="${CSS.escape(fp)}"]`);
  }
  function place(box, el) {
    if (!el) { box.style.display = 'none'; return false; }
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) { box.style.display = 'none'; return false; }
    box.style.display = 'block'; box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
    return r;
  }
  function drawOverlay() {
    if (D && OV.h) {
      place(OV.h, ui.hover && (!ui.sel || ui.hover !== findFp(ui.sel.fp)) ? ui.hover : null);
      const sel = ui.sel ? findFp(ui.sel.fp) : null;
      const r = place(OV.s, sel);
      if (r) {
        OV.l.style.display = 'block'; OV.l.style.left = r.left + 'px'; OV.l.style.top = Math.max(0, r.top - 22) + 'px';
        const c = ui.sel.comp && compById(ui.sel.comp);
        const txt = c ? `${c.name} · ${variantLabel(ui.sel)}${ui.sel.placed ? ' · 放置的元件' : ui.mode === 'instance' ? ' · 實例' : ''}` : '放置的片段';
        if (OV.l.firstChild.nodeValue !== txt) OV.l.firstChild.nodeValue = txt;
      } else OV.l.style.display = 'none';
      let i = 0;
      if (ui.sel && ui.sel.comp && ui.mode === 'variant' && compById(ui.sel.comp)) {
        for (const it of peers(ui.sel)) { if (i >= OV.p.length) break; if (it.el === sel) continue; if (place(OV.p[i], it.el)) i++; }
      }
      for (; i < OV.p.length; i++) OV.p[i].style.display = 'none';
    }
    requestAnimationFrame(drawOverlay);
  }
  let peerCache = { t: 0, key: '', list: [] };
  function peers(sel) {
    const key = [sel.comp, sel.variant, sel.size].join('/');
    if (peerCache.key === key && performance.now() - peerCache.t < 500) return peerCache.list;
    peerCache = { t: performance.now(), key, list: W.DSRuntime.scan().filter(it => it.comp === sel.comp && it.variant === sel.variant && it.size === sel.size) };
    return peerCache.list;
  }

  function resolve(kind, value, ctxEl) {
    if (!OV.probe) return '';
    const p = OV.probe;
    p.removeAttribute('style');
    if (ctxEl && ctxEl.closest('#agw')) { /* tokens inside the agent window resolve against its palette */ }
    if (kind === 'color') { p.style.color = ''; p.style.color = value; return W.getComputedStyle(p).color; }
    p.style.display = 'block'; p.style.width = '0px'; p.style.width = value;
    return W.getComputedStyle(p).width;
  }

  /* ---------- selection ---------- */
  function describeEl(el) {
    const d = W.DSRuntime.describe(el);
    W.DSRuntime.scan();
    const placed = el.dataset.dsId || null;
    const label = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
    // a placed HTML snippet is not a token component: it can be edited as content only
    if (!d) return placed ? { fp: 'snippet|placed|' + placed, comp: null, variant: null, size: null, ctx: W.DSRuntime.context(el), label, placed } : null;
    return { fp: el.dataset.dsFp, comp: d.comp, variant: d.variant, size: d.size, ctx: W.DSRuntime.context(el), label, placed };
  }
  function selectElement(el, opts) {
    const d = describeEl(el); if (!d) return;
    ui.sel = d; ui.view = { type: 'component' };
    if (!opts || !opts.keepMode) ui.mode = state.instances[d.fp] ? 'instance' : ui.mode;
    if (d.comp) ui.open[d.comp] = true;
    renderLeft(); renderRight();
  }
  function variantLabel(sel) {
    const c = compById(sel.comp); if (!c) return '';
    const v = c.variants.find(x => x.id === sel.variant);
    const s = (c.sizes || []).find(x => x.id === sel.size);
    return (v ? v.label : '（未指定變體）') + (s && c.sizes.length ? ' · ' + (s.id === 'md' ? 'md' : s.id) : '');
  }
  function goTo(ctx, cb) {
    if (!ctx || !W) return cb && cb();
    const m = PAGES.find(p => p[0] === ctx);
    if (m) navigate(ctx);
    else if (ctx.startsWith('profile:') || !ctx.includes(':')) { /* overlay or global — leave page as is */ }
    setTimeout(() => cb && cb(), 60);
  }
  function locate(fp, ctx) {
    goTo(ctx, () => {
      const el = findFp(fp);
      if (!el) return toast('這個實例目前不在畫面上（可能在未開啟的視窗或另一個狀態）');
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      selectElement(el, { keepMode: true });
    });
  }

  /* ---------- toolbar ---------- */
  function navigate(key) {
    const [g, p] = key.split(':');
    W.G(g, p); ui.page = key; $('#pageSel').value = key;
    setTimeout(() => { renderLeft(); }, 50);
  }
  function syncFromFrame() {
    if (!D) return;
    ui.theme = D.querySelector('.frame').dataset.theme; ui.tilt = D.body.classList.contains('tilt');
    const g = (D.querySelector('.gp.on') || {}).dataset; const p = (D.querySelector('.page.on') || {}).dataset;
    if (g) ui.page = g.g === 'profile' ? 'profile:' + (p ? p.page : 'overview') : g.g;
    $('#pageSel').value = PAGES.some(x => x[0] === ui.page) ? ui.page : '';
    $$('#themeSeg button,#libThemeSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === ui.theme));
    $$('#stateSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === (ui.tilt ? 'tilt' : 'stable')));
    $$('.theme-now').forEach(e => e.textContent = ui.theme === 'dark' ? 'Dark' : 'Light');
  }
  function setTheme(t) {
    const b = D.querySelector(`#themeSeg [data-t=${t}]`); if (b) b.click(); else W.setTheme(t);
    setTimeout(() => { syncFromFrame(); renderRight(); if (LD) { LD.getElementById('dslib').dataset.theme = ui.theme; fillSpecs(); } }, 30);
  }
  function setTilt(on) { D.querySelector(`#stateSeg [data-s=${on ? 'tilt' : 'stable'}]`).click(); setTimeout(() => { syncFromFrame(); renderLeft(); }, 60); }
  function layoutStage() {
    const stage = $('#stage'), wrap = $('#frameWrap');
    const aw = stage.clientWidth - 32, ah = stage.clientHeight - 32;
    const scale = ui.zoom === 'fit' ? Math.min(1, aw / ui.width) : 1;
    frame.style.width = ui.width + 'px';
    frame.style.height = Math.max(400, (ui.zoom === 'fit' ? ah / scale : ah)) + 'px';
    frame.style.transform = `scale(${scale})`;
    wrap.style.width = ui.width * scale + 'px'; wrap.style.height = parseFloat(frame.style.height) * scale + 'px';
    $('#zoomLbl').textContent = Math.round(scale * 100) + '%';
  }

  /* ---------- token get / set ---------- */
  function tokenRef(c, prop, sel) {
    const V = state.components[c.baseId || c.id];
    // variant-owned size / shared props (Buy, Text md, and every custom variant)
    const vs = V.variantSize && V.variantSize[sel.variant];
    if (prop.scope !== 'variant' && vs && prop.key in vs.props && (sel.variant !== 'text' || sel.size !== 'sm')) return { obj: vs.props, key: prop.key, name: `--${c.p}-${sel.variant}-${prop.key}`, scopeLabel: vs.label };
    if (prop.scope === 'base') return { obj: V.base, key: prop.key, name: tokenName(c, 'base', null, prop.key), scopeLabel: '元件共用' };
    if (prop.scope === 'size') {
      if (!V.size || !V.size[sel.size]) return null;
      return { obj: V.size[sel.size], key: prop.key, name: tokenName(c, 'size', sel.size, prop.key), scopeLabel: '尺寸 ' + sel.size };
    }
    if (!sel.variant || !V.variant[sel.variant]) return null;
    return { obj: V.variant[sel.variant], key: prop.key, name: tokenName(c, 'variant', sel.variant, prop.key), scopeLabel: '變體' };
  }
  function readTok(ref) { const v = ref.obj[ref.key]; return isThemed(v) ? v[ui.theme] : v; }
  function writeTok(ref, prop, value) {
    const cur = ref.obj[ref.key];
    if (prop.themed || isThemed(cur)) {
      const o = isThemed(cur) ? cur : { dark: cur, light: cur };
      o[ui.theme] = value; ref.obj[ref.key] = o.dark === o.light ? o.dark : o;
    } else ref.obj[ref.key] = value;
  }
  function instVar(c, key) { return `--${c.p}-${key}`; }
  function getInst(fp) { return state.instances[fp]; }
  function setInstProp(sel, c, prop, value) {
    const inst = state.instances[sel.fp] || (state.instances[sel.fp] = { comp: sel.comp, label: sel.label, ctx: sel.ctx, vars: {}, hard: {}, clear: [] });
    inst.vars = inst.vars || {}; inst.hard = inst.hard || {}; inst.clear = inst.clear || [];
    const k = instVar(c, prop.key);
    if (value === null) delete inst.vars[k]; else inst.vars[k] = value;
    // recompute hard props / cleared inline declarations from the remaining vars
    inst.hard = {}; inst.clear = [];
    Object.keys(inst.vars).forEach(vk => {
      const key = vk.slice(c.p.length + 3);
      const h = hardFor(c, key); if (h) Object.assign(inst.hard, h);
      const p = c.props.find(x => x.key === key);
      if (p && p.css && !h) inst.clear.push(p.css === 'border-color' ? 'border-color' : p.css);
    });
    cleanupInst(sel.fp);
  }
  function cleanupInst(fp) {
    const i = state.instances[fp]; if (!i) return;
    if (!Object.keys(i.vars || {}).length && !('left' in i) && !('right' in i)) delete state.instances[fp];
  }
  function effectiveValue(c, prop, sel) {
    if (ui.mode === 'instance') {
      const inst = getInst(sel.fp);
      const v = inst && inst.vars && inst.vars[instVar(c, prop.key)];
      if (v != null) return { value: v, overridden: true };
    }
    const ref = tokenRef(c, prop, sel);
    return { value: ref ? readTok(ref) : '', overridden: false, ref };
  }

  /* ---------- left panel ---------- */
  function renderLeft() {
    if (!W || !W.DSRuntime) return;
    if (ui.tab === 'library') return renderLibLeft();
    const all = W.DSRuntime.scan();
    const visible = it => { const r = it.el.getClientRects(); return r.length > 0; };
    let h = paletteHTML() + placedListHTML();
    h += `<div class="sec-h" style="margin-top:14px">元件 <span class="muted">${all.length} 個實例</span></div>`;
    allComps().forEach(c => {
      const items = all.filter(it => it.comp === c.id);
      if (c.custom && !items.length) return;
      const vis = items.filter(visible).length;
      const open = ui.open[c.id];
      const active = ui.sel && ui.sel.comp === c.id;
      h += `<div class="comp ${active ? 'active' : ''}"><button class="comp-h" data-comp="${c.id}"><span class="chev ${open ? 'o' : ''}">›</span><b>${c.name}</b><span class="zh">${c.zh}</span><span class="cnt" title="本頁可見 / 全部">${vis}/${items.length}</span></button>`;
      if (open) {
        c.variants.forEach(v => {
          (c.sizes && c.sizes.length ? c.sizes : [{ id: null, label: '' }]).forEach(s => {
            const list = items.filter(it => it.variant === v.id && it.size === s.id);
            if (!list.length) return;
            const k = [c.id, v.id, s.id].join('/');
            const on = ui.sel && ui.sel.comp === c.id && ui.sel.variant === v.id && ui.sel.size === s.id;
            const vv = list.filter(visible).length;
            h += `<div class="var ${on ? 'on' : ''}"><button class="var-h" data-var="${k}"><span>${esc(v.label)}${s.id && c.sizes.length ? ` <em>${s.id}</em>` : ''}</span><span class="cnt">${vv}/${list.length}</span></button><button class="var-x ${ui.instOpen[k] ? 'o' : ''}" data-inst="${k}" title="列出實例">≡</button></div>`;
            if (ui.instOpen[k]) {
              h += '<div class="insts">' + list.slice(0, 80).map(it => {
                const t = it.el.textContent.replace(/\s+/g, ' ').trim().slice(0, 28) || '(無文字)';
                const edited = state.instances[it.fp] ? '<i class="dot" title="已有實例覆寫"></i>' : '';
                return `<button class="inst ${ui.sel && ui.sel.fp === it.fp ? 'on' : ''} ${visible(it) ? '' : 'hid'}" data-fp="${esc(it.fp)}" data-ctx="${esc(it.ctx)}">${edited}<span>${esc(t)}</span><small>${esc(ctxName(it.ctx))}</small></button>`;
              }).join('') + (list.length > 80 ? `<div class="muted small">…還有 ${list.length - 80} 個</div>` : '') + '</div>';
            }
          });
        });
      }
      h += '</div>';
    });
    h += `<div class="sec-h" style="margin-top:14px">設計設定 <span class="muted">Foundations</span></div>`;
    FOUNDATIONS.forEach(g => {
      const on = ui.view.type === 'tokens' && ui.view.group === g.id;
      h += `<button class="tok-g ${on ? 'on' : ''}" data-group="${g.id}"><span>${esc(g.label)}</span><span class="cnt">${g.tokens.length}</span></button>`;
    });
    const n = Object.keys(state.instances).length;
    h += `<div class="sec-h" style="margin-top:14px">實例覆寫 <span class="muted">${n}</span></div>`;
    h += n ? Object.entries(state.instances).map(([fp, it]) => { const c = compById(it.comp || fp.split('|')[0]); return `<button class="inst ov" data-fp="${esc(fp)}" data-ctx="${esc(it.ctx || '')}"><i class="dot"></i><span>${esc(c ? c.name : fp.split('|')[0])} · ${esc((it.label || '').slice(0, 22))}</span><small>${esc(ctxName(it.ctx || ''))}</small></button>`; }).join('') : '<div class="muted small pad">尚無。選取元件後切到「只改這個實例」即可建立。</div>';
    $('#left').innerHTML = h;
  }
  $('#left').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (onLeftLibClick(b)) return;
    if (b.dataset.comp) { ui.open[b.dataset.comp] = !ui.open[b.dataset.comp]; renderLeft(); return; }
    if (b.dataset.inst) { ui.instOpen[b.dataset.inst] = !ui.instOpen[b.dataset.inst]; renderLeft(); return; }
    if (b.dataset.var) {
      const [cid, vid, sid] = b.dataset.var.split('/');
      const list = W.DSRuntime.scan().filter(it => it.comp === cid && it.variant === vid && String(it.size) === String(sid === 'null' ? null : sid));
      const target = list.find(it => it.el.getClientRects().length) || list[0];
      if (!target) return;
      ui.mode = 'variant';
      if (target.el.getClientRects().length) { target.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); selectElement(target.el, { keepMode: true }); }
      else locate(target.fp, target.ctx);
      return;
    }
    if (b.dataset.fp) { ui.mode = b.classList.contains('ov') ? 'instance' : ui.mode; locate(b.dataset.fp, b.dataset.ctx); return; }
    if (b.dataset.group) { ui.view = { type: 'tokens', group: b.dataset.group }; ui.sel = null; renderLeft(); renderRight(); }
  });

  /* ---------- controls ---------- */
  const RANGES = { radius: [0, 40], 'item-radius': [0, 24], py: [0, 32], px: [0, 48], 'item-py': [0, 24], 'item-px': [0, 40], fs: [8, 32], 'item-fs': [8, 24], h: [0, 64], bw: [0, 6], gap: [0, 24], icon: [8, 32], size: [16, 64], w: [16, 64], 'knob-size': [6, 40], pad: [0, 48], optw: [0, 480], opth: [0, 240] };
  const SHADOWS = [['none', '無'], ['var(--shadow)', '卡片陰影 token'], ['0 1px 2px rgba(0,0,0,.25)', '細微'], ['0 6px 16px rgba(0,0,0,.28)', '中'], ['0 14px 34px rgba(0,0,0,.38)', '強'], ['inset 0 0 0 1px #c9ccd2', '內框線'], ['0 0 0 3px var(--vbg)', '外光暈']];
  const FONTS = [['var(--font-sans)', 'Poppins / Noto Sans TC（內文）'], ['var(--font-num)', 'Manrope（數字）'], ['var(--font-mono)', 'JetBrains Mono（等寬）'], ['system-ui,sans-serif', '系統字體']];
  const COLOR_TOKENS = FOUNDATIONS.filter(g => ['surface', 'text', 'brand', 'semantic'].includes(g.id)).flatMap(g => g.tokens.filter(t => t.type === 'color').map(t => [`var(${t.name})`, `${t.label}`]));
  function toHex(rgb) {
    const m = String(rgb).match(/rgba?\(([^)]+)\)/); if (!m) return { hex: '#000000', a: 1 };
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    const hx = n => Math.round(n).toString(16).padStart(2, '0');
    return { hex: '#' + hx(p[0]) + hx(p[1]) + hx(p[2]), a: p.length > 3 ? p[3] : 1 };
  }
  function control(id, type, value, opts) {
    opts = opts || {};
    const v = value == null ? '' : String(value);
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    if (type === 'color') {
      const res = v ? resolve('color', v, opts.ctxEl) : '';
      const { hex, a } = toHex(res || 'rgba(0,0,0,0)');
      const tokOpts = COLOR_TOKENS.map(([val, l]) => `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
      return `<div class="ctl color"><label class="sw" style="--c:${esc(res || 'transparent')}"><input type="color" data-id="${id}" data-k="hex" value="${hex}"></label>
        <input class="txt" data-id="${id}" data-k="text" value="${esc(v)}"${ph}>
        <select class="tok" data-id="${id}" data-k="token" title="套用色彩 token"><option value="">Token…</option>${tokOpts}<option value="transparent">transparent</option><option value="currentColor">currentColor（跟隨文字色）</option></select>
        <input class="alpha" type="range" min="0" max="100" value="${Math.round(a * 100)}" data-id="${id}" data-k="alpha" title="透明度 ${Math.round(a * 100)}%"></div>`;
    }
    if (type === 'len') {
      const r = RANGES[opts.key] || [0, 64];
      const px = v ? parseFloat(resolve('len', v, opts.ctxEl)) : NaN;
      return `<div class="ctl len"><input type="range" min="${r[0]}" max="${r[1]}" step="${opts.key === 'bw' ? 0.5 : 1}" value="${isNaN(px) ? r[0] : px}" data-id="${id}" data-k="range">
        <input class="txt" data-id="${id}" data-k="text" value="${esc(v)}"${ph}><span class="res">${isNaN(px) || /^[\d.]+px$/.test(v) ? '' : Math.round(px * 10) / 10 + 'px'}</span></div>`;
    }
    if (type === 'weight') {
      return `<div class="ctl"><select data-id="${id}" data-k="text">${['', '300', '400', '500', '600', '700', '800'].map(w => `<option value="${w}" ${w === v ? 'selected' : ''}>${w || '（預設）'}</option>`).join('')}</select></div>`;
    }
    if (type === 'font') {
      const known = FONTS.some(f => f[0] === v);
      return `<div class="ctl"><select data-id="${id}" data-k="text">${FONTS.map(([f, l]) => `<option value="${esc(f)}" ${f === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}${known ? '' : `<option value="${esc(v)}" selected>${esc(v || '（預設）')}</option>`}</select></div>`;
    }
    if (type === 'shadow') {
      const known = SHADOWS.some(s => s[0] === v);
      return `<div class="ctl shadow"><select data-id="${id}" data-k="text">${SHADOWS.map(([s, l]) => `<option value="${esc(s)}" ${s === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}${known ? '' : `<option value="${esc(v)}" selected>自訂</option>`}</select><input class="txt" data-id="${id}" data-k="text" value="${esc(v)}"${ph}></div>`;
    }
    return `<div class="ctl"><input class="txt wide" data-id="${id}" data-k="text" value="${esc(v)}"${ph}></div>`;
  }
  // collects a new value from a control event
  function readControl(e, current) {
    const t = e.target, k = t.dataset.k;
    if (k === 'text' || k === 'token') return t.value;
    if (k === 'range') return t.value + 'px';
    const wrap = t.closest('.ctl');
    const hex = $('[data-k=hex]', wrap).value, a = +$('[data-k=alpha]', wrap).value / 100;
    if (a >= 1) return hex;
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }

  /* ---------- right panel ---------- */
  let binds = {};
  function renderRight() {
    binds = {};
    const R = $('#right');
    if (ui.view.type === 'tokens') return renderTokens(R);
    if (ui.tab === 'library') return renderLibRight(R);
    if (!ui.sel || !W) {
      R.innerHTML = `<div class="empty"><div class="big">選取一個元件</div><p>在中間預覽頁點選任何按鈕、標籤、卡片、分頁、輸入框或開關；或從左側清單挑選變體。</p>
      <ul><li><b>拖曳新增</b>：從左側「元件面板」把元件拖到頁面上，綠色線條 / 框標示插入位置（前方、後方或容器內部）。</li><li><b>選取模式</b>（工具列或按 <kbd>V</kbd>）開啟時，點到元件只會選取、不觸發它原本的互動；點到其他區域照常運作（例如關閉開場彈窗）。</li><li>選取模式關閉時可正常操作 demo；按住 <kbd>Alt</kbd> 點擊也能選取。</li><li>左下「設計設定」可調整全站顏色、字體、圓角、間距、陰影；上方「元件庫」可集中管理所有元件。</li></ul></div>`;
      return;
    }
    const sel = ui.sel, el = findFp(sel.fp);
    if (!sel.comp) {
      R.innerHTML = `<div class="sel-h"><div class="crumbs">放置的片段</div><div class="sel-t">${esc(sel.label || '(無文字)')}</div><div class="muted small">${esc(ctxName(sel.ctx))}</div></div>` + placedPanelHTML(sel, el);
      return;
    }
    const c = compById(sel.comp);
    if (!c) { ui.sel = null; return renderRight(); }
    const peersAll = W.DSRuntime.scan().filter(it => it.comp === sel.comp && it.variant === sel.variant && it.size === sel.size);
    const peersVis = peersAll.filter(it => it.el.getClientRects().length).length;
    const inst = getInst(sel.fp);
    const vdef = c.variants.find(v => v.id === sel.variant);
    let h = `<div class="sel-h"><div class="crumbs">${esc(c.name)} <span>›</span> ${esc(variantLabel(sel))}</div>
      <div class="sel-t">${esc(sel.label || '(無文字)')}</div>
      <div class="muted small">${esc(ctxName(sel.ctx))}${inst ? ' · <span class="ovr">此實例已覆寫</span>' : ''}</div>
      <div class="row gap6 mt8"><button class="mini" id="bParent" title="選取外層元件">↖ 外層</button><button class="mini" id="bLocate">◎ 捲動到此</button>${sel.variant ? '<button class="mini" id="bOpenLib" title="在元件庫中開啟這個變體">▦ 在元件庫開啟</button>' : ''}</div></div>`;
    if (sel.placed) h += placedPanelHTML(sel, el);
    h += `<div class="scope"><button data-mode="variant" class="${ui.mode === 'variant' ? 'on' : ''}"><b>修改整個變體</b><small>${peersAll.length} 個實例 · 本頁 ${peersVis}</small></button><button data-mode="instance" class="${ui.mode === 'instance' ? 'on' : ''}"><b>只改這個實例</b><small>不影響其他元件</small></button></div>`;
    if (ui.mode === 'variant') {
      h += `<div class="note">${vdef && vdef.note ? esc(vdef.note) + '。' : ''}變更會寫入 <code>design-system.css</code> 的 token；預覽中藍框標示所有受影響的實例。顏色類設定目前編輯 <b class="theme-now">${ui.theme === 'dark' ? 'Dark' : 'Light'}</b> 主題。</div>`;
      if (!sel.variant) h += `<div class="note warn">此元素沒有對應的變體 class，只能用「只改這個實例」調整。</div>`;
    } else {
      h += `<div class="note">只寫入這個實例（以指紋辨識，重新渲染後會自動套回）。未覆寫的欄位顯示變體預設值。${inst ? '<button class="link" id="bResetInst">重設此實例</button>' : ''}</div>`;
    }
    h += propGroupsHTML(c, sel, el);
    R.innerHTML = h;
  }

  // style groups for a component selection (variant tokens, or instance overrides)
  function propGroupsHTML(c, sel, el) {
    let h = '';
    const vdef = c.variants.find(v => v.id === sel.variant);
    const own = vdef && vdef.custom;
    const groups = ui.mode === 'variant'
      ? [['variant', `變體樣式 · ${vdef ? vdef.label : '—'}`, '影響此變體的所有尺寸'],
        ['size', own ? '尺寸（此變體專屬）' : `尺寸 · ${sel.size || '—'}`, own ? '只影響這個自訂變體' : c.sizes && c.sizes.length ? `影響所有 ${sel.size} 尺寸的 ${c.name}（不分變體）` : ''],
        ['base', own ? '其他（此變體專屬）' : '元件共用', own ? '只影響這個自訂變體' : `影響所有 ${baseOf(c).name}`]]
      : [['all', '樣式', '']];
    groups.forEach(([scope, title, sub]) => {
      const props = c.props.filter(p => scope === 'all' || p.scope === scope);
      if (!props.length) return;
      if (scope === 'size' && !(c.sizes && c.sizes.length) && !(state.components[c.baseId || c.id].variantSize || {})[sel.variant]) return;
      const rows = props.map(p => {
        const ref = tokenRef(c, p, sel);
        if (ui.mode === 'variant' && !ref) return '';
        const ev = effectiveValue(c, p, sel);
        const id = 'p_' + p.key;
        binds[id] = { kind: 'prop', prop: p };
        const state_ = p.state ? `<span class="st">${p.state === 'hover' ? 'Hover' : '選中'}</span>` : '';
        const name = ui.mode === 'variant' && ref ? ref.name : instVar(c, p.key);
        const scopeTag = ui.mode === 'variant' && p.scope === 'size' && ref && ref.scopeLabel !== '尺寸 ' + sel.size ? `<span class="st">${esc(ref.scopeLabel)}</span>` : '';
        const reset = ui.mode === 'instance' && ev.overridden ? `<button class="rst" data-reset="${p.key}" title="還原為變體預設">↺</button>` : '';
        const placeholder = ev.value == null || ev.value === '' ? (p.opt ? '未設定 · 自動' : '未設定 · 沿用預設狀態') : '';
        return `<div class="prop ${ev.overridden ? 'ovr' : ''}"><div class="pl"><span>${esc(p.label)}</span>${state_}${scopeTag}${reset}<code title="${esc(name)}">${esc(name)}</code></div>${control(id, p.type, ev.value, { key: p.opt ? 'opt' + p.key : p.key, ctxEl: el, placeholder })}</div>`;
      }).join('');
      h += `<div class="grp"><div class="grp-h"><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>${rows}</div>`;
    });
    if (c.icons) h += iconSection(c, sel, el);
    if (ui.mode === 'variant') h += `<div class="grp"><button class="danger" id="bResetVar">重設此變體${own ? '' : ' / 尺寸'}為原始值</button></div>`;
    return h;
  }

  function iconSection(c, sel, el) {
    const single = c.icons === 'single';
    const vkey = [sel.comp, sel.variant || '-', sel.size || '-'].join('/');
    const cur = side => {
      if (ui.mode === 'instance') { const ic = el ? W.DSRuntime.edgeIcon(el, side) : null; return ic ? W.DSRuntime.iconName(ic) : null; }
      const vi = state.variantIcons[vkey] || {}; return side in vi ? vi[side] : undefined;
    };
    const slot = (side, lbl) => {
      const v = cur(side);
      const face = v === undefined ? '<span class="muted">保持原樣</span>' : v === null ? '<span class="muted">無</span>' : `<svg class="ico"><use href="#i-${v}"/></svg><span>${v}</span>`;
      return `<div class="icon-slot"><span class="lbl">${lbl}</span><button class="icon-btn" data-icon-side="${side}">${face}<span class="caret">▾</span></button>${v ? `<button class="mini" data-icon-set="${side}" data-icon-val="null" title="移除">✕</button>` : ''}</div>`;
    };
    const note = ui.mode === 'variant'
      ? `套用到此變體的所有實例（${single ? '替換圖示' : '新增 / 移除 / 替換'}）。「保持原樣」＝ 沿用各按鈕原本的 icon。`
      : '只改這顆按鈕的 icon。';
    return `<div class="grp"><div class="grp-h"><b>Icon</b><span>${esc(note)}</span></div>
      ${single ? slot('left', 'Icon') : slot('left', '左 icon') + slot('right', '右 icon')}
      ${single ? '' : `<div class="row gap6 mt8"><button class="mini" id="bSwapIcon">⇄ 左右互換</button>${ui.mode === 'variant' ? '<button class="mini" id="bIconKeep">全部保持原樣</button>' : ''}</div>`}
      <div class="icon-pop" id="iconPop" hidden></div></div>`;
  }
  function setIcon(side, val) {
    const sel = ui.sel;
    if (ui.mode === 'instance' && sel.placed) {
      // a placed component keeps its icons in its own spec
      const p = placedById(sel.placed); if (!p) return;
      if (val === undefined) delete p[side]; else p[side] = val;
      if (p.base === 'iconbutton' && !p.left) p.left = 'spark';
    } else if (ui.mode === 'instance') {
      const inst = state.instances[sel.fp] || (state.instances[sel.fp] = { comp: sel.comp, label: sel.label, ctx: sel.ctx, vars: {}, hard: {}, clear: [] });
      inst[side] = val; cleanupInst(sel.fp);
    } else {
      const k = [sel.comp, sel.variant || '-', sel.size || '-'].join('/');
      const vi = state.variantIcons[k] || (state.variantIcons[k] = {});
      if (val === undefined) delete vi[side]; else vi[side] = val;
      if (!Object.keys(vi).length) delete state.variantIcons[k];
    }
    applyRuntime(); commit(); setTimeout(() => { renderRight(); renderLeft(); }, 40);
  }

  function renderTokens(R) {
    const g = FOUNDATIONS.find(x => x.id === ui.view.group), sg = state.foundations.find(x => x.id === g.id);
    const themed = g.tokens.some(t => t.dark !== undefined);
    let h = `<div class="sel-h"><div class="crumbs">設計設定 <span>›</span> ${esc(g.label)}</div>
      <div class="muted small mt4">修改後全站所有引用此 token 的元件都會即時更新。</div></div>`;
    if (themed) h += `<div class="note">色彩依主題分開設定，目前編輯 <b class="theme-now">${ui.theme === 'dark' ? 'Dark' : 'Light'}</b>。<button class="link" id="bFlipTheme">切換到 ${ui.theme === 'dark' ? 'Light' : 'Dark'}</button></div>`;
    h += '<div class="grp">';
    g.tokens.forEach(t => {
      const st = sg.tokens.find(x => x.name === t.name);
      const v = t.dark !== undefined ? st[ui.theme] : st.value;
      const def = t.dark !== undefined ? t[ui.theme] : t.value;
      const id = 't_' + t.name.slice(2);
      binds[id] = { kind: 'token', tok: t };
      const type = t.type === 'font' ? 'text' : t.type;
      const other = t.dark !== undefined ? `<span class="both" title="另一主題的值">${ui.theme === 'dark' ? 'L' : 'D'}: ${esc(st[ui.theme === 'dark' ? 'light' : 'dark'])}</span>` : '';
      h += `<div class="prop ${v !== def ? 'ovr' : ''}"><div class="pl"><span>${esc(t.label)}</span>${v !== def ? `<button class="rst" data-treset="${t.name}" title="還原 ${esc(def)}">↺</button>` : ''}<code>${t.name}</code></div>${control(id, type, v, { key: t.name.includes('r-') ? 'radius' : 'gap' })}${other}</div>`;
    });
    h += '</div>';
    R.innerHTML = h;
  }

  // one handler for every control in the right panel
  let rafPending = null;
  function onControl(e) {
    const t = e.target; const id = t.dataset.id; if (!id || !binds[id]) return;
    const b = binds[id];
    const value = readControl(e);
    if (t.dataset.k === 'token' && !value) return;
    if (b.kind === 'token') {
      const st = state.foundations.flatMap(g => g.tokens).find(x => x.name === b.tok.name);
      if (b.tok.dark !== undefined) st[ui.theme] = value; else st.value = value;
    } else if (b.kind === 'rule') {
      setRule(b.sel, b.prop, b.type, value);
    } else {
      const c = compById(ui.sel.comp);
      if (ui.mode === 'variant') { const ref = tokenRef(c, b.prop, ui.sel); if (!ref) return; writeTok(ref, b.prop, value); }
      else setInstProp(ui.sel, c, b.prop, value === '' ? null : value);
    }
    // live update without re-rendering the panel while dragging
    if (!rafPending) rafPending = requestAnimationFrame(() => { rafPending = null; applyAll(); peerCache.t = 0; });
    commit();
    syncSiblings(t, value);
    if (e.type === 'change') setTimeout(() => { renderRight(); renderLeft(); }, 0);
  }
  function syncSiblings(src, value) {
    const wrap = src.closest('.ctl'); if (!wrap) return;
    $$('[data-k=text]', wrap).forEach(i => { if (i !== src && i.tagName === 'INPUT') i.value = value; });
    const res = src.closest('.prop'); if (res) res.classList.add('ovr');
    const sw = $('.sw', wrap); if (sw) sw.style.setProperty('--c', resolve('color', value) || 'transparent');
  }
  $('#right').addEventListener('input', onControl);
  $('#right').addEventListener('change', onControl);
  $('#right').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mode) { ui.mode = b.dataset.mode; renderRight(); return; }
    if (b.id === 'bParent') { const el = findFp(ui.sel.fp); const p = el && el.parentElement && el.parentElement.closest(W.DSRuntime.ROOTS); if (p) selectElement(p, { keepMode: true }); else toast('外層沒有其他可編輯元件'); return; }
    if (b.id === 'bLocate') { const el = findFp(ui.sel.fp); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); else locate(ui.sel.fp, ui.sel.ctx); return; }
    if (b.id === 'bResetInst') { delete state.instances[ui.sel.fp]; applyRuntime(); commit(); renderRight(); renderLeft(); toast('已重設此實例'); return; }
    if (b.id === 'bResetVar') { resetVariant(); return; }
    if (b.id === 'bFlipTheme') { setTheme(ui.theme === 'dark' ? 'light' : 'dark'); return; }
    if (b.dataset.reset) { setInstProp(ui.sel, compById(ui.sel.comp), compById(ui.sel.comp).props.find(p => p.key === b.dataset.reset), null); applyRuntime(); commit(); renderRight(); return; }
    if (b.dataset.treset) {
      const t = FOUNDATIONS.flatMap(g => g.tokens).find(x => x.name === b.dataset.treset), st = state.foundations.flatMap(g => g.tokens).find(x => x.name === t.name);
      if (t.dark !== undefined) st[ui.theme] = t[ui.theme]; else st.value = t.value;
      applyCSS(); commit(); renderRight(); return;
    }
    if (b.dataset.iconSide) { openIconPop(b); return; }
    if (b.dataset.iconSet) { const v = b.dataset.iconVal; setIcon(b.dataset.iconSet, v === 'null' ? null : v === 'undefined' ? undefined : v); return; }
    if (b.id === 'bSwapIcon') {
      const el = findFp(ui.sel.fp);
      if (ui.mode === 'instance') {
        const l = W.DSRuntime.edgeIcon(el, 'left'), r = W.DSRuntime.edgeIcon(el, 'right');
        const ln = l ? W.DSRuntime.iconName(l) : null, rn = r ? W.DSRuntime.iconName(r) : null;
        const inst = state.instances[ui.sel.fp] || (state.instances[ui.sel.fp] = { label: ui.sel.label, ctx: ui.sel.ctx, vars: {}, hard: {}, clear: [] });
        inst.left = rn; inst.right = ln; cleanupInst(ui.sel.fp);
      } else {
        const k = [ui.sel.comp, ui.sel.variant || '-', ui.sel.size || '-'].join('/');
        const vi = state.variantIcons[k] || {};
        const nv = {}; if ('left' in vi) nv.right = vi.left; if ('right' in vi) nv.left = vi.right;
        if (!('left' in vi) && !('right' in vi)) return toast('變體模式互換需先為左或右指定 icon');
        state.variantIcons[k] = nv;
      }
      applyRuntime(); commit(); setTimeout(renderRight, 40); return;
    }
    if (b.id === 'bIconKeep') { delete state.variantIcons[[ui.sel.comp, ui.sel.variant || '-', ui.sel.size || '-'].join('/')]; applyRuntime(); commit(); renderRight(); return; }
  });
  function openIconPop(anchor) {
    const pop = $('#iconPop'); const side = anchor.dataset.iconSide;
    const opts = [ui.mode === 'variant' ? `<button data-icon-set="${side}" data-icon-val="undefined" class="ip-w"><span class="muted">保持原樣</span></button>` : '', `<button data-icon-set="${side}" data-icon-val="null" class="ip-w"><span class="muted">無 icon</span></button>`]
      .concat(ICONS.map(n => `<button data-icon-set="${side}" data-icon-val="${n}" title="${n}"><svg class="ico"><use href="#i-${n}"/></svg></button>`)).join('');
    pop.innerHTML = `<div class="ip-h">${side === 'left' ? '左' : '右'} icon</div><div class="ip-g">${opts}</div>`;
    pop.hidden = !pop.hidden;
  }
  function resetVariant() {
    const sel = ui.sel, c = compById(sel.comp), B = baseOf(c), D0 = B.values, V = state.components[B.id];
    const lv = state.lib.vars.find(v => v.id === sel.variant);
    if (lv) {
      // custom variant: back to the values it was created with
      V.variant[lv.id] = clone(lv.init.variant);
      if (V.variantSize && V.variantSize[lv.id]) V.variantSize[lv.id].props = clone(lv.init.own);
    } else {
      if (sel.variant && V.variant[sel.variant]) V.variant[sel.variant] = clone(D0.variant[sel.variant]);
      if (sel.size && V.size && V.size[sel.size]) V.size[sel.size] = clone(D0.size[sel.size]);
      if (V.variantSize && V.variantSize[sel.variant] && D0.variantSize && D0.variantSize[sel.variant]) V.variantSize[sel.variant] = clone(D0.variantSize[sel.variant]);
    }
    delete state.variantIcons[[sel.comp, sel.variant || '-', sel.size || '-'].join('/')];
    applyAll(); commit(); renderRight(); if (ui.tab === 'library') renderLib(); toast(lv ? '已還原此變體' : '已還原此變體與尺寸');
  }

  /* ==========================================================================
   * Placed components — dragged from the component panel onto the page.
   * A placed component is stored as a spec (component, variant, content, anchor, position);
   * ds-runtime.js builds and inserts it, in the editor and in the exported page alike.
   * ========================================================================== */
  const uid = p => p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);
  const placedById = id => state.placed.find(p => p.id === id);
  const placedEl = id => D ? D.querySelector(`[data-ds-id="${CSS.escape(id)}"]`) : null;
  const isCustomVar = vid => state.lib.vars.some(v => v.id === vid);
  const vkey = (cid, vid, size) => [cid, vid || '-', size || '-'].join('/');
  const shortLabel = s => String(s || '').replace(/（.*?）/g, '').trim();
  function placedLabel(p) {
    if (!p) return '';
    if (p.base === 'snippet') { const g = genById(p.gid); return g ? genName(g) : 'HTML 片段'; }
    const c = compById(p.comp); if (!c) return p.comp;
    const v = c.variants.find(x => x.id === p.variant);
    return c.name + ' · ' + (v ? v.label : p.variant);
  }
  function clsFor(cid, vid, size) {
    const c = compById(cid), v = c.variants.find(x => x.id === vid);
    let cls = v.cls;
    if (size === 'sm' && c.sizes && c.sizes.length && !v.custom) cls += ' sm';
    if (c.custom) cls += ' ds-c-' + c.id;
    return cls;
  }
  function defaultsFor(c, v) {
    const has = k => (' ' + v.cls + ' ').includes(' ' + k + ' ');
    switch (c.baseId || c.id) {
      case 'button': return { text: shortLabel(v.label) || 'Button' };
      case 'iconbutton': return { text: 'Action', left: 'spark' };
      case 'pill': case 'chip': return { text: shortLabel(v.label) || 'Label' };
      case 'tabs': return { text: 'Tab 1|Tab 2|Tab 3' };
      case 'card': return { title: 'Card title', text: 'Supporting text for this card.' };
      case 'toggle': return { text: 'Toggle label', on: true };
      case 'input': return has('inp') ? { title: 'Input', text: 'Placeholder' } : has('sel') ? { title: 'Select', text: 'Option 1|Option 2|Option 3' } : has('sm') ? { text: 'Filter ▾' } : { title: 'Label', text: 'Enter value' };
    }
    return { text: '' };
  }
  // generic components are placed as a clean copy of their first instance in the demo
  function genSample(g) {
    if (!D) return null;
    const list = [...D.querySelectorAll(g.sel)].filter(e => !e.closest('[data-ds-id]') && !e.closest('#ds-overlay'));
    return list.find(e => e.getClientRects().length) || list[0] || null;
  }
  function cleanClone(el) {
    const c = el.cloneNode(true);
    [c, ...c.querySelectorAll('*')].forEach(n => {
      n.removeAttribute('id');
      [...n.attributes].forEach(a => { if (a.name.startsWith('data-ds-') || a.name === 'data-cta-fixed') n.removeAttribute(a.name); });
    });
    return c;
  }
  function specFrom(key) {
    if (key.startsWith('g:')) {
      const g = genById(key.slice(2)), s = g && genSample(g);
      return s ? { id: uid('p'), base: 'snippet', gid: g.id, html: cleanClone(s).outerHTML } : null;
    }
    const [cid, vid] = key.slice(2).split('/');
    const c = compById(cid), v = c && c.variants.find(x => x.id === vid);
    if (!v) return null;
    const size = c.sizes && c.sizes.length && !v.custom ? 'md' : null;
    return Object.assign({ id: uid('p'), comp: c.id, base: c.baseId || c.id, variant: v.id, size, cls: clsFor(c.id, v.id, size) }, defaultsFor(c, v));
  }

  /* anchors: a placed component is stored relative to an element of the page — the path of child
   * indexes from the nearest element with an id / page / global page (placed elements are skipped
   * when counting), or another placed component. */
  const skipNode = n => n.hasAttribute('data-ds-id') || n.id === 'ds-overlay' || n.id === 'ds-probe';
  function anchorOf(el) {
    if (el.dataset.dsId) return { placed: el.dataset.dsId };
    const idx = []; let cur = el;
    while (cur && cur !== D.body) {
      if (cur.id && !/^ds-/.test(cur.id) && D.querySelectorAll('#' + CSS.escape(cur.id)).length === 1) return { root: '#' + CSS.escape(cur.id), idx: idx.reverse() };
      if (cur.matches('.page[data-page]')) return { root: `.page[data-page="${cur.dataset.page}"]`, idx: idx.reverse() };
      if (cur.matches('.gp[data-g]')) return { root: `.gp[data-g="${cur.dataset.g}"]`, idx: idx.reverse() };
      const par = cur.parentElement;
      idx.push([...par.children].filter(k => !skipNode(k)).indexOf(cur));
      cur = par;
    }
    return { root: 'body', idx: idx.reverse() };
  }
  function anchorText(p) {
    const a = p.anchor || {};
    const pos = { before: '前方', after: '後方', inside: '內部' }[p.pos] || '';
    if (a.placed) return `${placedLabel(placedById(a.placed))} ${pos}`;
    const el = W && W.DSRuntime.resolveAnchor(a);
    return el ? `${zoneName(el)} ${pos}` : '（找不到）';
  }
  function zoneName(el) { return el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '') + (el.id && !/^ds-/.test(el.id) ? '#' + el.id : ''); }

  /* drop target under a point (iframe coordinates): before / after an element that sits in a
   * container, or inside a container. */
  const ZONE = '.page,.gwrap,.card,.sub-card,.row,.acts,.g2,.g3,.g4,.a-r1,.a-r2,.flt,.kpis,.behavior-actions';
  const NO_DROP = '.gnav,#devbar,.devbar,.cdock,#ds-overlay,.tbl,.table-scroll,.side';
  function isHoriz(par, el) {
    const cs = W.getComputedStyle(par);
    if (cs.display.includes('flex')) return !cs.flexDirection.startsWith('column');
    if (cs.display.includes('grid')) return cs.gridTemplateColumns.trim().split(/\s+/).length > 1;
    return W.getComputedStyle(el).display.startsWith('inline');
  }
  function dropAt(x, y, exclude) {
    let t = D.elementFromPoint(x, y);
    if (!t) return null;
    if (exclude && exclude.contains(t)) t = exclude.parentElement;
    for (let el = t; el && el !== D.body && el !== D.documentElement; el = el.parentElement) {
      if (el.closest(NO_DROP)) return null;
      const par = el.parentElement;
      const isZone = el.matches(ZONE) && !['BUTTON', 'SELECT', 'INPUT', 'TEXTAREA', 'svg'].includes(el.tagName);
      const inZone = !!par && par !== D.body && par.matches(ZONE);
      if (!isZone && !inZone) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const horiz = inZone && isHoriz(par, el);
      let res;
      if (isZone) {
        const edge = horiz ? Math.min(x - r.left, r.right - x) : Math.min(y - r.top, r.bottom - y);
        const lim = Math.min(14, (horiz ? r.width : r.height) / 4);
        if (!inZone || edge > lim) res = { el, pos: 'inside' };
      }
      if (!res) res = { el, pos: (horiz ? x < r.left + r.width / 2 : y < r.top + r.height / 2) ? 'before' : 'after', horiz };
      // inside a placed component (e.g. the title of a placed card): use the placed component itself
      const host = !res.el.dataset.dsId && res.el.parentElement && res.el.parentElement.closest('[data-ds-id]');
      if (host) res = host.matches(ZONE) ? { el: host, pos: 'inside' } : { el: host, pos: 'after', horiz: isHoriz(host.parentElement, host) };
      if (exclude && (res.el === exclude || exclude.contains(res.el))) return null;
      return res;
    }
    return null;
  }
  function showDrop(t, label) {
    if (!OV.z) return;
    OV.z.style.display = OV.i.style.display = OV.il.style.display = 'none';
    if (!t) return;
    const r = t.el.getBoundingClientRect();
    let lx, ly;
    if (t.pos === 'inside') { place(OV.z, t.el); lx = r.left + 4; ly = r.top + 4; }
    else {
      const s = OV.i.style; s.display = 'block';
      if (t.horiz) { const x = t.pos === 'before' ? r.left - 4 : r.right + 1; Object.assign(s, { left: x + 'px', top: r.top + 'px', width: '3px', height: r.height + 'px' }); lx = x + 6; ly = r.top - 24; }
      else { const y = t.pos === 'before' ? r.top - 4 : r.bottom + 1; Object.assign(s, { left: r.left + 'px', top: y + 'px', width: r.width + 'px', height: '3px' }); lx = r.left; ly = t.pos === 'before' ? y - 24 : y + 7; }
    }
    if (!OV.il.firstChild) OV.il.appendChild(D.createTextNode(''));
    OV.il.firstChild.nodeValue = `${label || ''} → ${t.pos === 'inside' ? '放入' : t.pos === 'before' ? '插入前方' : '插入後方'}：${zoneName(t.el)}`;
    Object.assign(OV.il.style, { display: 'block', left: Math.max(2, lx) + 'px', top: Math.max(2, ly) + 'px' });
  }
  const chainHas = (a, id) => { const seen = new Set(); while (a && a.placed && !seen.has(a.placed)) { if (a.placed === id) return true; seen.add(a.placed); const p = placedById(a.placed); a = p && p.anchor; } return false; };
  // components placed right before / after `p` take over its old position when `p` leaves
  function detachDependents(p) { state.placed.forEach(q => { if (q !== p && q.anchor && q.anchor.placed === p.id && q.pos !== 'inside') { q.anchor = clone(p.anchor); q.pos = p.pos; } }); }
  function verifiedAnchor(el) {
    const a = anchorOf(el);
    if (!a.placed && W.DSRuntime.resolveAnchor(a) !== el) { toast('這個位置無法記錄，請換一個位置'); return null; }
    return a;
  }
  function addPlaced(key, t) {
    const spec = specFrom(key); if (!spec) return toast('找不到這個元件的範本');
    const a = verifiedAnchor(t.el); if (!a) return;
    spec.anchor = a; spec.pos = t.pos;
    state.placed.push(spec);
    applyRuntime(); flushCommit(); reselectPlaced(spec.id);
    toast('已新增 ' + placedLabel(spec));
  }
  function movePlaced(id, t) {
    const p = placedById(id), el = placedEl(id); if (!p || !t) return;
    if (el && (el === t.el || el.contains(t.el))) return;
    const a = verifiedAnchor(t.el); if (!a) return;
    detachDependents(p);
    if (chainHas(a, id)) return toast('無法移到這裡');
    p.anchor = a; p.pos = t.pos;
    applyRuntime(); flushCommit(); reselectPlaced(id);
  }
  function nudgePlaced(id, dir) {
    const el = placedEl(id); if (!el) return toast('這個元件目前不在頁面上');
    let sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    while (sib && (sib.id === 'ds-overlay' || sib.id === 'ds-probe')) sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling;
    if (!sib) return toast(dir < 0 ? '已經在容器的最前面' : '已經在容器的最後面');
    movePlaced(id, { el: sib, pos: dir < 0 ? 'before' : 'after' });
  }
  function moveOut(id) {
    const el = placedEl(id); if (!el) return;
    const par = el.parentElement;
    if (!par || par.matches('.page,.gwrap,.gp,body,.frame')) return toast('已經在頁面的最外層容器');
    movePlaced(id, { el: par, pos: 'after' });
  }
  function removePlaced(ids) {
    const gone = new Set(ids);
    ids.forEach(id => { const p = placedById(id); if (p) detachDependents(p); });
    let grew = true; // components placed inside a removed one go with it
    while (grew) { grew = false; state.placed.forEach(q => { if (!gone.has(q.id) && q.anchor && gone.has(q.anchor.placed)) { gone.add(q.id); grew = true; } }); }
    state.placed = state.placed.filter(q => !gone.has(q.id));
    Object.keys(state.instances).forEach(fp => { const m = fp.match(/\|placed\|(.+)$/); if (m && gone.has(m[1])) delete state.instances[fp]; });
    if (ui.sel && ui.sel.placed && gone.has(ui.sel.placed)) ui.sel = null;
    return gone.size;
  }
  function deletePlaced(id) { const n = removePlaced([id]); applyRuntime(); flushCommit(); renderLeft(); renderRight(); toast(n > 1 ? `已刪除（含其中 ${n - 1} 個元件）` : '已刪除'); }
  function duplicatePlaced(id) {
    const p = placedById(id); if (!p) return;
    const q = Object.assign(clone(p), { id: uid('p'), anchor: { placed: p.id }, pos: 'after' });
    state.placed.push(q);
    const inst = state.instances[`${p.comp || 'snippet'}|placed|${p.id}`];
    if (inst) state.instances[`${p.comp || 'snippet'}|placed|${q.id}`] = clone(inst);
    applyRuntime(); flushCommit(); reselectPlaced(q.id); toast('已複製');
  }
  function reselectPlaced(id) {
    const el = placedEl(id);
    if (!el) { renderLeft(); renderRight(); return; }
    W.DSRuntime.scan();
    selectElement(el, { keepMode: true });
  }

  function placedPanelHTML(sel, el) {
    const p = placedById(sel.placed); if (!p) return '';
    const f = (key, label, val, area) => `<div class="prop"><div class="pl"><span>${label}</span></div><div class="ctl">${area ? `<textarea class="txt wide" data-pf="${key}" rows="${area}">${esc(val)}</textarea>` : `<input class="txt wide" data-pf="${key}" value="${esc(val)}">`}</div></div>`;
    let rows = '';
    if (p.base === 'snippet') rows += f('html', 'HTML 內容', p.html, 7);
    else {
      const c = compById(p.comp);
      const sizes = c.sizes && c.sizes.length && !isCustomVar(p.variant) ? `<select data-pf="size" style="flex:0 0 70px">${c.sizes.map(s => `<option value="${s.id}" ${(p.size || 'md') === s.id ? 'selected' : ''}>${s.id}</option>`).join('')}</select>` : '';
      rows += `<div class="prop"><div class="pl"><span>變體${sizes ? ' / 尺寸' : ''}</span></div><div class="ctl"><select data-pf="variant">${c.variants.filter(v => !v.deleted).map(v => `<option value="${v.id}" ${v.id === p.variant ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>${sizes}</div></div>`;
      const b = p.base, has = k => (' ' + p.cls + ' ').includes(' ' + k + ' ');
      if (b === 'card') rows += f('title', '標題', p.title) + f('text', '內文', p.text, 3);
      else if (b === 'tabs') rows += f('text', '選項（以 | 分隔）', p.text);
      else if (b === 'input' && has('sel')) rows += f('title', '名稱（無障礙標籤）', p.title) + f('text', '選項（以 | 分隔）', p.text);
      else if (b === 'input' && has('inp')) rows += f('text', '提示文字（placeholder）', p.text);
      else if (b === 'input' && !has('sm')) rows += f('title', '標籤', p.title) + f('text', '提示文字', p.text);
      else if (b === 'iconbutton') rows += f('text', '名稱（滑鼠提示 / 無障礙）', p.text);
      else if (b === 'toggle') rows += f('text', '標籤文字', p.text) + `<label class="row gap6 small mt4"><input type="checkbox" data-pf="on" ${p.on ? 'checked' : ''}> 預設為開啟</label>`;
      else rows += f('text', '文字', p.text);
    }
    const iconNote = p.base === 'button' || p.base === 'iconbutton' ? '<div class="muted small mt4">Icon：切到「只改這個實例」後在下方 Icon 區塊設定。</div>' : '';
    return `<div class="grp placed"><div class="grp-h"><b>放置的元件 · 內容與位置</b><span>只影響這一個元件；樣式可在下方選「修改整個變體」或「只改這個實例」。</span></div>${rows}${iconNote}
      <div class="prop"><div class="pl"><span>位置</span><code title="${esc(anchorText(p))}">${esc(anchorText(p))}</code></div>
        ${el ? '' : '<div class="note warn" style="margin:0 0 6px">目前在頁面上找不到插入位置（該區塊可能不在畫面上，或已被 demo 重新渲染成不同結構）。</div>'}
        <div class="row gap6" style="flex-wrap:wrap"><button class="mini" data-pact="up">↑ 往前移</button><button class="mini" data-pact="down">↓ 往後移</button><button class="mini" data-pact="out">⇱ 移出容器</button><button class="mini" data-pact="dup">⧉ 複製</button></div>
        <div class="muted small mt4">選取模式下直接拖曳頁面上的這個元件，也可以移到其他位置。</div></div>
      <button class="danger mt8" data-pact="del">刪除此元件（Delete）</button></div>`;
  }
  function onPlacedField(e) {
    const t = e.target; if (!t.dataset || !t.dataset.pf) return;
    const p = placedById(ui.sel && ui.sel.placed); if (!p) return;
    const k = t.dataset.pf;
    if (k === 'on') p.on = t.checked;
    else if (k === 'variant') { p.variant = t.value; if (isCustomVar(p.variant)) p.size = null; else if (!p.size && compById(p.comp).sizes.length) p.size = 'md'; p.cls = clsFor(p.comp, p.variant, p.size); }
    else if (k === 'size') { p.size = t.value; p.cls = clsFor(p.comp, p.variant, p.size); }
    else p[k] = t.value;
    applyRuntime(); commit();
    if (k === 'variant' || k === 'size') { flushCommit(); reselectPlaced(p.id); }
    else if (e.type === 'change') renderLeft();
  }
  $('#right').addEventListener('input', onPlacedField);
  $('#right').addEventListener('change', e => { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') onPlacedField(e); else if (e.target.dataset && e.target.dataset.pf) renderLeft(); });

  /* ---------- component panel (left, preview mode) ---------- */
  function paletteItems() {
    const out = [];
    allComps().forEach(c => c.variants.filter(v => !v.deleted).forEach(v => out.push({ key: `c:${c.id}/${v.id}`, cat: c.cat, name: c.name, sub: v.label, custom: c.custom || v.custom })));
    GENERIC.filter(g => !state.lib.deleted.includes('g:' + g.id) && genSample(g)).forEach(g => out.push({ key: 'g:' + g.id, cat: g.cat, name: genName(g), sub: g.zh, gen: true }));
    return out;
  }
  const CATS = ['Button', 'Badge / Tag', 'Tabs', 'Card', 'Input / Select', 'Toggle', 'Table', 'Progress', 'Navigation', 'Overlay', 'Avatar', 'Data display', 'Chart'];
  const catOrder = c => { const i = CATS.indexOf(c); return i < 0 ? 99 : i; };
  function paletteHTML() {
    let h = `<div class="sec-h"><button class="sec-t" data-pal-toggle><span class="chev ${ui.palOpen ? 'o' : ''}">›</span>元件面板</button><span class="muted">拖曳到頁面</span></div>`;
    if (!ui.palOpen) return h;
    const items = paletteItems();
    const cats = [...new Set(items.map(i => i.cat))].sort((a, b) => catOrder(a) - catOrder(b));
    h += `<div class="pal"><input class="pal-q" id="palQ" placeholder="搜尋元件…" value="${esc(ui.palQ || '')}">`;
    cats.forEach(cat => {
      h += `<div class="pal-cat" data-cat="${esc(cat)}">${esc(cat)}</div>` + items.filter(i => i.cat === cat).map(i =>
        `<div class="pal-it ${i.gen ? 'gen' : ''}" data-pal="${esc(i.key)}" data-cat="${esc(cat)}" data-q="${esc((i.name + ' ' + i.sub + ' ' + cat).toLowerCase())}" title="按住並拖曳到頁面上放置"><span class="grip">⠿</span><b>${esc(i.name)}</b><span class="sub">${esc(i.sub)}</span>${i.custom ? '<em>自訂</em>' : i.gen ? '<em class="g">片段</em>' : ''}</div>`).join('');
    });
    return h + '</div>';
  }
  function filterPalette() {
    const q = (ui.palQ || '').trim().toLowerCase();
    $$('#left .pal-it').forEach(it => { it.hidden = !!q && !it.dataset.q.includes(q); });
    $$('#left .pal-cat').forEach(c => { c.hidden = !$$(`#left .pal-it[data-cat="${CSS.escape(c.dataset.cat)}"]`).some(it => !it.hidden); });
  }
  function placedListHTML() {
    const n = state.placed.length;
    let h = `<div class="sec-h" style="margin-top:12px"><button class="sec-t" data-placed-toggle><span class="chev ${ui.placedOpen ? 'o' : ''}">›</span>已放置的元件</button><span class="muted">${n}</span></div>`;
    if (!ui.placedOpen) return h;
    if (!n) return h + '<div class="muted small pad">尚無。從上方元件面板把元件拖到頁面上。</div>';
    return h + state.placed.map(p => {
      const el = placedEl(p.id), ctx = el ? W.DSRuntime.context(el) : '';
      const txt = (p.base === 'snippet' ? '' : (p.title || p.text || '')).replace(/\|/g, ' · ').slice(0, 20);
      return `<button class="inst ${ui.sel && ui.sel.placed === p.id ? 'on' : ''} ${el && el.getClientRects().length ? '' : 'hid'}" data-placed="${p.id}" data-ctx="${esc(ctx)}"><i class="dot g"></i><span>${esc(placedLabel(p))}${txt ? ' · ' + esc(txt) : ''}</span><small>${el ? esc(ctxName(ctx)) : '找不到位置'}</small></button>`;
    }).join('');
  }
  // palette drag (pointer capture keeps the events in this document while over the iframe)
  function toFrame(cx, cy) {
    const r = frame.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    if (cx < Math.max(r.left, s.left) || cx > Math.min(r.right, s.right) || cy < Math.max(r.top, s.top) || cy > Math.min(r.bottom, s.bottom)) return null;
    const k = r.width / ui.width;
    return { x: (cx - r.left) / k, y: (cy - r.top) / k };
  }
  const ghost = $('#ghost');
  $('#left').addEventListener('pointerdown', e => {
    const it = e.target.closest('.pal-it'); if (!it || e.button !== 0 || !D) return;
    e.preventDefault();
    it.setPointerCapture(e.pointerId);
    drag = { kind: 'new', key: it.dataset.pal, x: e.clientX, y: e.clientY, active: false, label: it.querySelector('b').textContent + ' · ' + it.querySelector('.sub').textContent };
  });
  function dragTo(cx, cy) {
    drag.cx = cx; drag.cy = cy;
    const pt = toFrame(cx, cy);
    drag.target = pt ? dropAt(pt.x, pt.y) : null;
    // an open demo popup / modal backdrop covers the page
    const top = pt && !drag.target ? D.elementFromPoint(pt.x, pt.y) : null;
    drag.blocked = !!(top && top.closest('.popc.open,.mdl,#agw,#spw') && W.getComputedStyle(top.closest('.popc,.mdl,#agw,#spw')).position === 'fixed');
    drag.edge = pt ? (pt.y < 50 ? -1 : pt.y > W.innerHeight - 50 ? 1 : 0) : 0;
    showDrop(drag.target, drag.label);
    ghost.classList.toggle('ok', !!drag.target);
  }
  $('#left').addEventListener('pointermove', e => {
    if (!drag || drag.kind !== 'new') return;
    if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4) return;
    if (!drag.active) { drag.active = true; ghost.textContent = drag.label; ghost.hidden = false; D.body.classList.add('ds-dragging'); document.body.classList.add('dragging'); }
    ghost.style.transform = `translate(${e.clientX + 12}px,${e.clientY + 12}px)`;
    dragTo(e.clientX, e.clientY);
  });
  function endPaletteDrag(e, cancel) {
    if (!drag || drag.kind !== 'new') return;
    const d = drag; drag = null;
    ghost.hidden = true; document.body.classList.remove('dragging'); if (D) D.body.classList.remove('ds-dragging'); showDrop(null);
    if (cancel) return;
    if (!d.active) { toast('按住元件並拖曳到頁面上即可放置'); return; }
    if (d.target) addPlaced(d.key, d.target);
    else if (d.blocked) toast('頁面上有開啟中的彈窗擋住了，請先關閉它再放置');
    else toast('請放在綠色標示的可放置區域');
  }
  $('#left').addEventListener('pointerup', e => endPaletteDrag(e));
  $('#left').addEventListener('pointercancel', e => endPaletteDrag(e, true));
  $('#left').addEventListener('input', e => { if (e.target.id === 'palQ') { ui.palQ = e.target.value; filterPalette(); } if (e.target.id === 'libLeftQ') { ui.libFilter = e.target.value; filterLib(); } });
  // keep scrolling the page while dragging near its top / bottom edge
  (function edgeScroll() {
    if (drag && drag.active && drag.edge && W) { W.scrollBy(0, drag.edge * 16); if (drag.kind === 'new') dragTo(drag.cx, drag.cy); }
    requestAnimationFrame(edgeScroll);
  })();

  /* ==========================================================================
   * Component library view
   * ========================================================================== */
  const libFrame = $('#libFrame');
  const LIB_CSS = `html,body{margin:0;background:#0a0b0d}
#dslib.frame{padding:0!important;min-height:100vh;width:auto!important;transform:none!important;background:#0a0b0d}
#L{padding:18px 22px 90px;font:13px/1.45 system-ui,-apple-system,"Segoe UI","Noto Sans TC","Microsoft JhengHei",sans-serif;color:#eceef2}
#L *{box-sizing:border-box}
.L-top{display:flex;align-items:flex-end;gap:14px;margin-bottom:6px}
.L-h1{font-size:20px;font-weight:700;letter-spacing:.2px}
.L-sub{color:#9a9ea8;font-size:12.5px}
.L-cat{margin:24px 0 8px}
.L-cat-h{font-size:11.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#9a9ea8;display:flex;gap:8px;align-items:center;margin-bottom:10px}
.L-cat-h span{font-weight:500;letter-spacing:0;text-transform:none;color:#6d717b}
.L-comp{background:#131418;border:1px solid #2a2c32;border-radius:12px;padding:12px 14px 14px;margin-bottom:12px}
.L-comp-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.L-comp-h b{font-size:15px;color:#eceef2}
.L-zh{color:#9a9ea8;font-size:12px}
.L-tag{font:11px ui-monospace,Consolas,monospace;color:#9a9ea8;border:1px solid #373a42;border-radius:4px;padding:1px 5px}
.L-badge{font-size:10.5px;border-radius:999px;padding:2px 8px;background:rgba(79,124,255,.16);color:#cfdaff;white-space:nowrap}
.L-badge.c{background:rgba(61,220,151,.14);color:#9ff0c9}.L-badge.g{background:rgba(255,181,71,.12);color:#ffcf8a}
.L-cnt{font:11.5px ui-monospace,Consolas,monospace;color:#9a9ea8}
.L-sp{flex:1}
.L-b{font:12px system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;color:#cfd2da;background:#1d1f24;border:1px solid #373a42;border-radius:6px;padding:3px 9px;cursor:pointer;line-height:1.5;min-height:0;height:auto;width:auto;margin:0;text-transform:none;letter-spacing:0}
.L-b:hover{border-color:#9a9ea8;color:#fff}
.L-b.danger{color:#ff9c9c;border-color:#5a2a2a}.L-b.danger:hover{background:rgba(255,80,80,.1)}
.L-note{font-size:11.5px;color:#ffcf8a;background:rgba(255,181,71,.08);border-radius:7px;padding:6px 9px;margin:-2px 0 10px}
.L-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
.L-card{border:1px solid #2a2c32;border-radius:10px;background:#0f1013;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;min-width:0}
.L-card:hover{border-color:#4a4e58}
.L-card.on{border-color:#4f7cff;box-shadow:0 0 0 1px #4f7cff}
.L-card-h{display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid #2a2c32;font-size:12.5px;min-width:0}
.L-card-h b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.L-card-h .L-use{margin-left:auto;font:11px ui-monospace,Consolas,monospace;color:#9a9ea8;white-space:nowrap}
.L-stage{background:var(--bg);color:var(--text);font-family:var(--L-font);font-size:13px;line-height:var(--L-lh);padding:18px 14px;min-height:78px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;position:relative;transform:translateZ(0);overflow:auto;max-height:340px;cursor:default}
.L-stage.wide{display:block}
.L-stage .ds-hover.btn{background:var(--btn-hover-bg,var(--btn-bg));color:var(--btn-hover-fg,var(--btn-fg));border-color:var(--btn-hover-bc,var(--btn-bc));filter:var(--btn-hover-filter,none)}
.L-sz{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.L-sz small{font:10px ui-monospace,Consolas,monospace;color:var(--dim)}
.L-states{display:flex;gap:4px;padding:6px 10px;border-top:1px solid #2a2c32;align-items:center}
.L-states span{font-size:11px;color:#6d717b;margin-right:2px}
.L-st{font:11px system-ui,sans-serif;padding:2px 8px;border-radius:5px;border:1px solid #373a42;color:#9a9ea8;background:none;cursor:pointer;margin:0;min-height:0;height:auto}
.L-st.on{background:#373a42;color:#eceef2}
.L-specs{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;padding:8px 10px;font-size:11px;color:#9a9ea8;border-top:1px solid #2a2c32}
.L-specs b{font-weight:500;color:#cfd2da;font:10.5px ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.L-sw{display:inline-block;width:10px;height:10px;border-radius:3px;border:1px solid #555;vertical-align:-1px;margin-right:5px}
.L-usage{padding:7px 10px;border-top:1px solid #2a2c32;font-size:11px;color:#9a9ea8;line-height:1.5}
.L-usage.none{color:#6d717b}
.L-report{background:#131418;border:1px solid #2a2c32;border-radius:12px;padding:12px 14px;margin:12px 0 4px}
.L-report-h{display:flex;align-items:center;gap:8px}
.L-report-h b{font-size:14px}
.L-r3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:12px}
.L-r3>div{background:#0f1013;border:1px solid #2a2c32;border-radius:10px;padding:10px 12px}
.L-r3 h4{margin:0 0 6px;font-size:12.5px;color:#eceef2}
.L-r3 ul{margin:0;padding-left:16px;color:#cfd2da;font-size:12px;line-height:1.6}
.L-r3 li{margin-bottom:3px}.L-r3 code{font:11px ui-monospace,Consolas,monospace;color:#9db4ff}
.L-hide{display:none!important}
@media(max-width:900px){.L-r3{grid-template-columns:1fr}}`;

  function libDocHTML() {
    const h0 = DEMO_HTML.indexOf('<head>'), h1 = DEMO_HTML.indexOf('</head>');
    const head = DEMO_HTML.slice(h0 + 6, h1).replace(/<script\b[\s\S]*?<\/script>/gi, '').replace('<link rel="stylesheet" href="design-system.css" id="ds-css">', '<style id="ds-css"></style>');
    const sprite = DEMO_HTML.match(/<svg[^>]*>\s*<symbol[\s\S]*?<\/svg>/);
    return `<!doctype html><html lang="zh-Hant"><head>${head}<style>${LIB_CSS}</style></head><body><div class="frame" data-theme="${ui.theme}" id="dslib">${sprite ? sprite[0] : ''}<div id="L"></div></div><script>window.DS_MATCH=[];<\/script><script>\n${RUNTIME}\n<\/script></body></html>`;
  }
  function bootLib() {
    libFrame.srcdoc = libDocHTML();
    libFrame.onload = () => {
      LW = libFrame.contentWindow; LD = libFrame.contentDocument;
      if (D) { const cs = W.getComputedStyle(D.body); LD.documentElement.style.setProperty('--L-font', cs.fontFamily); LD.documentElement.style.setProperty('--L-lh', cs.lineHeight); }
      LD.addEventListener('click', onLibClick);
      LD.addEventListener('keydown', onKey, true);
      applyAll(); renderLib();
    };
  }

  // usage of every component / variant in the demo (+ placed components)
  function usageMap() {
    const m = {};
    const add = (k, ctx, placed) => { const u = m[k] || (m[k] = { n: 0, placed: 0, ctx: {} }); u.n++; if (placed) u.placed++; u.ctx[ctx] = (u.ctx[ctx] || 0) + 1; };
    if (W && W.DSRuntime) W.DSRuntime.scan().forEach(it => { add(it.comp + '/' + it.variant, it.ctx, !!it.placed); add(it.comp, it.ctx, !!it.placed); });
    if (D) GENERIC.forEach(g => D.querySelectorAll(g.sel).forEach(el => { if (el.closest('#ds-overlay')) return; add('g:' + g.id, W.DSRuntime.context(el), !!el.closest('[data-ds-id]')); }));
    return m;
  }
  function usageText(u) {
    if (!u || !u.n) return '<div class="L-usage none">目前沒有使用在 demo 頁面中</div>';
    const pages = Object.entries(u.ctx).sort((a, b) => b[1] - a[1]);
    const list = pages.slice(0, 4).map(([c, n]) => `${esc(ctxName(c))} ${n}`).join(' · ') + (pages.length > 4 ? ` · 等 ${pages.length} 處` : '');
    return `<div class="L-usage">使用於：${list}${u.placed ? `（其中 ${u.placed} 個為拖入）` : ''}</div>`;
  }
  const STATES = { button: [['default', 'Default'], ['hover', 'Hover'], ['disabled', 'Disabled']], iconbutton: [['default', 'Default'], ['on', 'Hover / 選中']], toggle: [['on', 'On'], ['off', 'Off']], input: [['default', 'Default'], ['disabled', 'Disabled']] };
  function applyState(el, base, st) {
    if (base === 'button') { el.classList.toggle('ds-hover', st === 'hover'); el.disabled = st === 'disabled'; }
    if (base === 'iconbutton') el.classList.toggle('on', st === 'on');
    if (base === 'toggle') el.classList.toggle('on', st !== 'off');
    if (base === 'input') [el, ...el.querySelectorAll('input,select')].forEach(x => { if ('disabled' in x && /INPUT|SELECT/.test(x.tagName)) x.disabled = st === 'disabled'; });
  }
  const WIDE = { card: 1, tabs: 0 };
  function libEntries() {
    const q = '';
    const comps = allComps().map(c => ({ cat: c.cat, comp: c })).filter(e => e.comp.variants.some(v => !v.deleted));
    const um = usageMap();
    const gens = GENERIC.filter(g => !state.lib.deleted.includes('g:' + g.id) && (um['g:' + g.id] || {}).n).map(g => ({ cat: g.cat, gen: g }));
    return { list: comps.concat(gens), um };
  }
  function reportHTML(um, list) {
    const token = list.filter(e => e.comp), gen = list.filter(e => e.gen);
    const nVar = token.reduce((s, e) => s + e.comp.variants.filter(v => !v.deleted).length, 0);
    const nInst = token.reduce((s, e) => s + ((um[e.comp.id] || {}).n || 0), 0);
    const incons = [
      'Button：<code>.btn.inv</code>、<code>.btn.lime</code>、<code>.btn.grad</code> 三個 class 最終樣式相同，已合併為 Primary 變體。',
      'Tabs：分段切換有 <code>.tabs</code>、<code>.optabs</code>、<code>.seg</code> 三套；底線分頁有 <code>.stabs</code>、<code>.ttabs2</code>、<code>.mtabs</code> 三套，內距與選中樣式各不相同。',
      'Badge：除了 Pill、Chip，還有 <code>.badge2</code>、<code>.sev</code>、<code>.pchip</code>、<code>.gchip</code>、<code>.tg3 span</code> 五種標籤，圓角 4–8px、字級 10–11px 不一。',
      'Input：<code>.fld</code> / <code>.search</code> 邊框用 <code>--line</code>，<code>.inp</code> / <code>.sel</code> 用 <code>--line2</code>。',
      '色彩：5 個不同名稱的品牌 / 強調色變數（--brand、--accent、--violet、--amber、--lime）互相覆蓋。',
    ].concat(GENERIC.filter(g => g.note && (um['g:' + g.id] || {}).n && !/Tabs|Badge/.test(g.cat)).map(g => `${esc(g.name)}：${esc(g.note)}`));
    const zones = [['.page', '個人頁內容區'], ['.gwrap', '全域頁內容區'], ['.card', '卡片'], ['.sub-card', '次層卡片'], ['.acts', '按鈕列'], ['.row', '橫向排列列'], ['.g2,.g3,.g4', '格線版面'], ['.flt', '篩選列']]
      .map(([s, l]) => [s, l, D ? [...D.querySelectorAll(s)].filter(e => !e.closest(NO_DROP)).length : 0]).filter(z => z[2]);
    const open = ui.reportOpen;
    return `<div class="L-report" id="L-report"><div class="L-report-h"><b>盤點報告</b><span class="L-sub">Token 化元件 ${token.length} 種 · ${nVar} 個變體 · demo 中 ${nInst} 個實例；其他已辨識元件 ${gen.length} 種</span><span class="L-sp"></span><button class="L-b" data-lact="report">${open ? '收合' : '展開'}</button></div>
      ${open ? `<div class="L-r3">
        <div><h4>辨識到的元件</h4><ul>${token.map(e => `<li>${esc(e.comp.name)}（${e.comp.variants.filter(v => !v.deleted).length} 變體 · ${(um[e.comp.id] || {}).n || 0} 個）${e.comp.custom ? ' · 自訂' : ''}</li>`).join('')}${gen.map(e => `<li>${esc(genName(e.gen))} <code>${esc(e.gen.sel)}</code>（${um['g:' + e.gen.id].n} 個 · 尚未 token 化）</li>`).join('')}</ul></div>
        <div><h4>重複但樣式不一致</h4><ul>${incons.map(t => `<li>${t}</li>`).join('')}</ul></div>
        <div><h4>適合拖放的區塊</h4><ul>${zones.map(([s, l, n]) => `<li><code>${esc(s)}</code> ${esc(l)}（${n} 個）</li>`).join('')}
          <li>放在 JS 重新渲染的區塊（持倉卡、訊號、提醒、聊天）中的元件，重新渲染後會自動補回。</li>
          <li>不可放置：頂部導覽、側欄、Demo 控制列、浮動 Dock、表格內部（避免破壞 demo 互動）。</li></ul></div>
      </div>` : ''}</div>`;
  }
  function renderLib() {
    if (!LD) return;
    LD.getElementById('dslib').dataset.theme = ui.theme;
    const { list, um } = libEntries();
    const cats = [...new Set(list.map(e => e.cat))].sort((a, b) => catOrder(a) - catOrder(b));
    let h = `<div class="L-top"><div><div class="L-h1">元件庫</div><div class="L-sub">點選卡片編輯樣式；變更會即時同步到「頁面編輯」中所有使用同一元件 / 變體的實例。</div></div></div>`;
    h += reportHTML(um, list);
    cats.forEach(cat => {
      const entries = list.filter(e => e.cat === cat);
      h += `<section class="L-cat" id="cat-${esc(cat.replace(/\W+/g, '-'))}"><div class="L-cat-h">${esc(cat)} <span>${entries.length} 種元件</span></div>`;
      entries.forEach(e => { h += e.comp ? compBlock(e.comp, um) : genBlock(e.gen, um); });
      h += '</section>';
    });
    LD.getElementById('L').innerHTML = h;
    mountSpecimens();
    fillSpecs(); markLibSel(); filterLib();
    if (ui.pendingScroll) {
      const card = LD.querySelector(`.L-card[data-sel="${CSS.escape(ui.pendingScroll)}"]`);
      ui.pendingScroll = null;
      if (card) setTimeout(() => card.scrollIntoView({ block: 'center' }), 50);
    }
  }
  function compBlock(c, um) {
    const u = um[c.id] || {};
    const badge = c.custom ? `<span class="L-badge c">自訂元件 · 基於 ${esc(baseOf(c).name)}</span>` : '<span class="L-badge">Token 化</span>';
    let h = `<div class="L-comp" data-comp="${c.id}" data-q="${esc((c.name + ' ' + c.zh + ' ' + c.variants.map(v => v.label).join(' ')).toLowerCase())}"><div class="L-comp-h"><b>${esc(c.name)}</b><span class="L-zh">${esc(c.zh)}</span>${badge}<code class="L-tag">${esc(c.custom ? '.ds-c-' + c.id : c.root)}</code><span class="L-cnt">${u.n || 0} 個實例</span><span class="L-sp"></span>
      <button class="L-b" data-lact="addvar" data-comp="${c.id}">＋ 變體</button><button class="L-b" data-lact="dupcomp" data-comp="${c.id}">⧉ 複製元件</button><button class="L-b" data-lact="rename" data-comp="${c.id}">✎ 重新命名</button><button class="L-b danger" data-lact="delcomp" data-comp="${c.id}">刪除</button></div><div class="L-grid">`;
    c.variants.filter(v => !v.deleted).forEach(v => {
      const key = `c:${c.id}/${v.id}`, vu = um[c.id + '/' + v.id];
      const st = STATES[c.baseId || c.id];
      const cur = ui.libStates[key] || (st ? st[0][0] : '');
      h += `<div class="L-card" data-sel="${esc(key)}"><div class="L-card-h"><b>${esc(v.label)}</b>${v.custom ? '<span class="L-badge c">自訂</span>' : ''}<code class="L-tag">${esc(v.custom ? '.ds-v-' + v.id : v.sel.split(',')[0])}</code><span class="L-use">${(vu || {}).n || 0} 個</span></div>
        <div class="L-stage ${WIDE[c.baseId || c.id] ? 'wide' : ''}" data-stage="${esc(key)}"></div>
        ${st ? `<div class="L-states"><span>狀態</span>${st.map(([id, l]) => `<button class="L-st ${cur === id ? 'on' : ''}" data-lstate="${id}" data-key="${esc(key)}">${l}</button>`).join('')}</div>` : ''}
        <div class="L-specs" data-specs="${esc(key)}"></div>${usageText(vu)}</div>`;
    });
    return h + '</div></div>';
  }
  function genBlock(g, um) {
    const key = 'g:' + g.id, u = um[key];
    return `<div class="L-comp" data-gen="${g.id}" data-q="${esc((genName(g) + ' ' + g.zh + ' ' + g.sel).toLowerCase())}"><div class="L-comp-h"><b>${esc(genName(g))}</b><span class="L-zh">${esc(g.zh)}</span><span class="L-badge g">尚未 token 化</span><code class="L-tag">${esc(g.sel)}</code><span class="L-cnt">${u.n} 個實例</span><span class="L-sp"></span>
      <button class="L-b" data-lact="rename" data-gen="${g.id}">✎ 重新命名</button><button class="L-b danger" data-lact="delgen" data-gen="${g.id}">刪除</button></div>
      ${g.note ? `<div class="L-note">⚠ ${esc(g.note)}</div>` : ''}
      <div class="L-grid"><div class="L-card" data-sel="${esc(key)}"><div class="L-card-h"><b>${esc(genName(g))}</b><span class="L-use">${u.n} 個</span></div>
        <div class="L-stage wide" data-stage="${esc(key)}"></div><div class="L-specs" data-specs="${esc(key)}"></div>${usageText(u)}</div></div></div>`;
  }
  function specimenSpecs(c, v) {
    const base = c.baseId || c.id, d = defaultsFor(c, v);
    const one = size => Object.assign({ id: 'lib', comp: c.id, base, variant: v.id, size, cls: clsFor(c.id, v.id, size) }, d);
    if (c.sizes && c.sizes.length && !v.custom) return c.sizes.map(s => [s.id, one(s.id)]);
    return [[null, one(null)]];
  }
  function mountSpecimens() {
    $$('[data-stage]', LD).forEach(stage => {
      const key = stage.dataset.stage;
      if (key.startsWith('g:')) {
        const s = genSample(genById(key.slice(2)));
        if (!s) return;
        const el = cleanClone(s); el.dataset.gspec = key.slice(2);
        stage.appendChild(el);
        const cs = LW.getComputedStyle(el);
        if (cs.display === 'none') el.style.display = 'block';
        if (cs.position === 'fixed' || cs.position === 'absolute') Object.assign(el.style, { position: 'relative', inset: 'auto', left: 'auto', top: 'auto', right: 'auto', bottom: 'auto', transform: 'none', animation: 'none' });
        return;
      }
      const [cid, vid] = key.slice(2).split('/');
      const c = compById(cid), v = c && c.variants.find(x => x.id === vid); if (!v) return;
      const specs = specimenSpecs(c, v);
      specs.forEach(([size, sp]) => {
        const el = LW.DSRuntime.build(sp); delete el.dataset.dsId; el.dataset.spec = key;
        if (specs.length > 1) { const w = LD.createElement('div'); w.className = 'L-sz'; w.appendChild(el); const sm = LD.createElement('small'); sm.textContent = size; w.appendChild(sm); stage.appendChild(w); }
        else stage.appendChild(el);
        const st = STATES[c.baseId || c.id];
        if (st) applyState(el, c.baseId || c.id, ui.libStates[key] || st[0][0]);
      });
    });
    LW.DSRuntime.apply();
  }
  const rgbHex = v => { if (!/rgba?\(/.test(v)) return v; const { hex, a } = toHex(v); return a < 1 ? `${hex} ${Math.round(a * 100)}%` : hex; };
  function fillSpecs() {
    if (!LD) return;
    $$('[data-specs]', LD).forEach(box => {
      const key = box.dataset.specs;
      const el = LD.querySelector(`[data-spec="${CSS.escape(key)}"]`) || LD.querySelector(`[data-stage="${CSS.escape(key)}"] > *`);
      if (!el) { box.innerHTML = ''; return; }
      const cs = LW.getComputedStyle(el), r = el.getBoundingClientRect();
      const col = v => `<span class="L-sw" style="background:${v}"></span>${esc(rgbHex(v))}`;
      const bw = parseFloat(cs.borderTopWidth);
      const bg = cs.backgroundImage !== 'none' ? 'gradient' : cs.backgroundColor;
      const rows = [
        ['尺寸', `${Math.round(r.width)} × ${Math.round(r.height)} px`],
        ['背景', bg === 'gradient' ? '漸層' : col(bg)],
        ['文字', col(cs.color)],
        ['字體', esc(`${cs.fontFamily.split(',')[0].replace(/"/g, '')} ${cs.fontSize} / ${cs.fontWeight}`)],
        ['圓角', esc(cs.borderRadius)],
        ['內距', esc(cs.padding)],
        ['邊框', bw ? `${esc(cs.borderTopWidth)} ${col(cs.borderTopColor)}` : '無'],
        ['陰影', cs.boxShadow === 'none' ? '無' : esc(cs.boxShadow.length > 34 ? cs.boxShadow.slice(0, 34) + '…' : cs.boxShadow)],
      ];
      box.innerHTML = rows.map(([k, v]) => `<span>${k}</span><b title="${esc(String(v).replace(/<[^>]+>/g, ''))}">${v}</b>`).join('');
    });
  }
  // components animate background / border changes (transition .15s): read again once settled
  let specT, specT2;
  function libSpecsSoon() { cancelAnimationFrame(specT); clearTimeout(specT2); specT = requestAnimationFrame(fillSpecs); specT2 = setTimeout(fillSpecs, 260); }
  function markLibSel() {
    if (!LD) return;
    const k = libKey(ui.sel);
    $$('.L-card', LD).forEach(c => c.classList.toggle('on', c.dataset.sel === k));
  }
  function filterLib() {
    if (!LD) return;
    const q = (ui.libFilter || '').trim().toLowerCase();
    $$('.L-comp', LD).forEach(b => b.classList.toggle('L-hide', !!q && !b.dataset.q.includes(q)));
    $$('.L-cat', LD).forEach(s => s.classList.toggle('L-hide', !$$('.L-comp', s).some(b => !b.classList.contains('L-hide'))));
  }
  const libKey = sel => !sel || !sel.lib ? null : sel.gen ? 'g:' + sel.gen : `c:${sel.comp}/${sel.variant}`;
  function libSelValid(sel) {
    if (sel.gen) return !!genById(sel.gen) && !state.lib.deleted.includes('g:' + sel.gen);
    const c = compById(sel.comp); const v = c && c.variants.find(x => x.id === sel.variant);
    return !!v && !v.deleted;
  }
  function libSelect(key, opts) {
    if (key.startsWith('g:')) ui.sel = { lib: true, gen: key.slice(2), fp: null, ctx: 'library' };
    else {
      const [cid, vid] = key.slice(2).split('/'), c = compById(cid); if (!c) return;
      const v = c.variants.find(x => x.id === vid);
      const size = c.sizes && c.sizes.length ? (v && v.custom ? 'md' : (ui.sel && ui.sel.lib && ui.sel.comp === cid && ui.sel.size) || 'md') : null;
      ui.sel = { lib: true, comp: cid, variant: vid, size, fp: null, ctx: 'library', label: v ? v.label : vid };
    }
    ui.view = { type: 'component' };
    markLibSel(); renderRight(); renderLeft();
    if (opts && opts.scroll) { const card = LD && LD.querySelector(`.L-card[data-sel="${CSS.escape(key)}"]`); if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    if (opts && opts.focus) setTimeout(() => { const i = $(opts.focus); if (i) { i.focus(); i.select(); } }, 30);
  }
  function onLibClick(e) {
    const b = e.target.closest('button');
    if (b && b.dataset.lstate) {
      ui.libStates[b.dataset.key] = b.dataset.lstate;
      const [cid] = b.dataset.key.slice(2).split('/'), c = compById(cid);
      $$(`[data-spec="${CSS.escape(b.dataset.key)}"]`, LD).forEach(el => applyState(el, c.baseId || c.id, b.dataset.lstate));
      $$(`.L-st[data-key="${CSS.escape(b.dataset.key)}"]`, LD).forEach(x => x.classList.toggle('on', x === b));
      libSpecsSoon(); return;
    }
    if (b && b.dataset.lact) { libAction(b.dataset.lact, b.dataset); return; }
    const card = e.target.closest('.L-card');
    if (card) { e.preventDefault(); libSelect(card.dataset.sel); }
  }

  /* ---------- library: left & right panels ---------- */
  function renderLibLeft() {
    const { list } = libEntries();
    const cats = [...new Set(list.map(e => e.cat))].sort((a, b) => catOrder(a) - catOrder(b));
    let h = `<div class="sec-h">元件庫 <span class="muted">${list.length} 種元件</span></div>
      <div class="pad"><button class="tbtn primary" style="width:100%;justify-content:center" data-lleft="addcomp">＋ 新增元件</button></div>
      <div class="pad" style="padding-top:0"><input class="pal-q" id="libLeftQ" placeholder="搜尋元件…" value="${esc(ui.libFilter || '')}" style="margin:0"></div>
      <div class="sec-h" style="margin-top:6px">分類</div>`;
    cats.forEach(cat => { h += `<button class="tok-g" data-lcat="${esc(cat)}"><span>${esc(cat)}</span><span class="cnt">${list.filter(e => e.cat === cat).length}</span></button>`; });
    h += `<button class="tok-g" data-lleft="report"><span>盤點報告</span><span class="cnt">↗</span></button>`;
    const del = state.lib.deleted;
    h += `<div class="sec-h" style="margin-top:14px">已刪除 <span class="muted">${del.length}</span></div>`;
    h += del.length ? del.map(k => {
      let name = k;
      if (k.startsWith('g:')) { const g = genById(k.slice(2)); name = g ? genName(g) : k; }
      else { const [cid, vid] = k.split('/'); const c = compById(cid); const v = c && c.variants.find(x => x.id === vid); name = c ? `${c.name} · ${v ? v.label : vid}` : k; }
      return `<div class="var"><span class="var-h">${esc(name)}</span><button class="mini" data-restore="${esc(k)}">還原</button></div>`;
    }).join('') : '<div class="muted small pad">沒有已刪除的元件。</div>';
    h += `<div class="sec-h" style="margin-top:14px">說明</div><div class="muted small pad" style="line-height:1.7">・Token 化元件：修改寫入 token，頁面上同變體的實例全部同步。<br>・自訂元件 / 變體：以某個基礎類型建立，擁有自己的 token。<br>・尚未 token 化：修改寫成 CSS 規則（design-system.css 第 5 節）。<br>・刪除原有變體會在頁面上隱藏它的實例，可隨時還原。</div>`;
    $('#left').innerHTML = h;
  }
  function onLeftLibClick(b) {
    if (b.dataset.palToggle !== undefined) { ui.palOpen = !ui.palOpen; renderLeft(); return true; }
    if (b.dataset.placedToggle !== undefined) { ui.placedOpen = !ui.placedOpen; renderLeft(); return true; }
    if (b.dataset.placed) { const p = placedById(b.dataset.placed); if (!p) return true; locate(`${p.comp || 'snippet'}|placed|${p.id}`, b.dataset.ctx); return true; }
    if (b.dataset.lleft === 'addcomp') { openAddComp(); return true; }
    if (b.dataset.lleft === 'report') { ui.reportOpen = true; renderLib(); const r = LD && LD.getElementById('L-report'); if (r) r.scrollIntoView({ behavior: 'smooth' }); return true; }
    if (b.dataset.lcat) { const s = LD && LD.getElementById('cat-' + b.dataset.lcat.replace(/\W+/g, '-')); if (s) s.scrollIntoView({ behavior: 'smooth' }); return true; }
    if (b.dataset.restore) { state.lib.deleted = state.lib.deleted.filter(k => k !== b.dataset.restore); flushCommit(); refreshAll(); toast('已還原'); return true; }
    return false;
  }
  function renderLibRight(R) {
    const sel = ui.sel;
    if (!sel || !sel.lib) {
      R.innerHTML = `<div class="empty"><div class="big">元件庫</div><p>點選中間任一元件卡片即可編輯它的名稱與樣式，修改會立即反映在卡片預覽與頁面上所有同元件 / 同變體的實例。</p>
        <ul><li>每張卡片顯示即時外觀、尺寸、顏色、字體、圓角、內距，以及在 demo 中的使用位置與數量。</li><li>「＋ 變體」「⧉ 複製元件」「刪除」在每個元件的標題列；「＋ 新增元件」在左側。</li><li>切換卡片下方的狀態（Hover、Disabled、On / Off）可以預覽不同狀態。</li><li>回到「頁面編輯」後，可從左側元件面板把元件拖到頁面上。</li></ul></div>`;
      return;
    }
    if (sel.gen) return renderGenRight(R, genById(sel.gen));
    const c = compById(sel.comp); if (!c) { ui.sel = null; return renderLibRight(R); }
    const v = c.variants.find(x => x.id === sel.variant);
    const um = usageMap(), u = um[c.id + '/' + v.id] || {};
    const el = LD && LD.querySelector(`[data-spec="c:${CSS.escape(c.id + '/' + v.id)}"]`);
    const sizes = c.sizes && c.sizes.length && !v.custom ? `<div class="seg" id="libSize">${c.sizes.map(s => `<button data-size="${s.id}" class="${sel.size === s.id ? 'on' : ''}">${s.id === 'md' ? 'Default (md)' : 'Small (sm)'}</button>`).join('')}</div>` : '';
    let h = `<div class="sel-h"><div class="crumbs">元件庫 <span>›</span> ${esc(c.cat)} <span>›</span> ${esc(c.name)}</div>
      <label class="fld-l">元件名稱<input class="txt" id="renComp" data-ren="comp" value="${esc(c.name)}"></label>
      <label class="fld-l">變體名稱<input class="txt" id="renVar" data-ren="var" value="${esc(v.label)}"></label>
      <div class="muted small mt4">${c.custom ? `自訂元件 · 基礎類型 ${esc(baseOf(c).name)}` : v.custom ? `自訂變體 · 以 ${esc((c.variants.find(x => x.id === (state.lib.vars.find(q => q.id === v.id) || {}).from) || {}).label || '—')} 為基礎` : 'Token 化元件'} · 共 ${u.n || 0} 個實例${u.placed ? `（${u.placed} 個為拖入）` : ''}</div>
      <div class="row gap6 mt8" style="flex-wrap:wrap"><button class="mini" data-lact="goto">◎ 在頁面中檢視</button><button class="mini" data-lact="dupvar">⧉ 複製變體</button><button class="mini" data-lact="addvar" data-comp="${c.id}">＋ 新增變體</button><button class="mini" data-lact="delvar" style="color:#ff9c9c">刪除變體</button></div>
      ${sizes ? `<div class="mt8">${sizes}</div>` : ''}</div>`;
    h += `<div class="note">${v.note ? esc(v.note) + '。' : ''}變更會寫入 <code>design-system.css</code> 的 token，並同步到頁面上所有 ${esc(v.label)} 實例。顏色類設定目前編輯 <b class="theme-now">${ui.theme === 'dark' ? 'Dark' : 'Light'}</b> 主題。</div>`;
    h += propGroupsHTML(c, sel, el);
    R.innerHTML = h;
  }
  // generic (not tokenised) components: editable style rules
  const ruleVal = (sel, prop) => { const v = ((state.lib.rules || {})[sel] || {})[prop]; return isThemed(v) ? v[ui.theme] || '' : v == null ? '' : v; };
  function setRule(sel, prop, type, value) {
    const R0 = state.lib.rules || (state.lib.rules = {});
    const r = R0[sel] || (R0[sel] = {});
    if (type === 'color') {
      const cur = r[prop];
      const o = isThemed(cur) ? cur : cur ? { dark: cur, light: cur } : { dark: '', light: '' };
      o[ui.theme] = value;
      r[prop] = o.dark === o.light ? o.dark : o;
      if (r[prop] === '') delete r[prop];
    } else if (value === '') delete r[prop];
    else r[prop] = value;
    if (!Object.keys(r).length) delete R0[sel];
  }
  function renderGenRight(R, g) {
    const um = usageMap(), u = um['g:' + g.id] || {};
    const sample = LD && LD.querySelector(`[data-gspec="${g.id}"]`);
    let h = `<div class="sel-h"><div class="crumbs">元件庫 <span>›</span> ${esc(g.cat)}</div>
      <label class="fld-l">元件名稱<input class="txt" id="renGen" data-ren="gen" value="${esc(genName(g))}"></label>
      <div class="muted small mt4">${esc(g.zh)} · <code>${esc(g.sel)}</code> · 共 ${u.n || 0} 個實例</div>
      <div class="row gap6 mt8"><button class="mini" data-lact="goto">◎ 在頁面中檢視</button><button class="mini" data-lact="delgen" data-gen="${g.id}" style="color:#ff9c9c">刪除元件</button></div></div>
      <div class="note">這類元件還沒有 token：修改會寫成 <code>design-system.css</code> 第 5 節的樣式規則，套用到頁面上所有符合選擇器的元素。${g.note ? '<br><b>⚠</b> ' + esc(g.note) : ''}</div>`;
    g.targets.forEach(([sel, label], ti) => {
      const tEl = sample ? (sample.matches(sel) ? sample : sample.querySelector(sel)) : null;
      const cs = tEl ? LW.getComputedStyle(tEl) : null;
      const rows = G_PROPS.map(([prop, plabel, type]) => {
        const id = `r_${ti}_${prop}`; binds[id] = { kind: 'rule', sel, prop, type };
        const v = ruleVal(sel, prop);
        let ph = cs ? cs.getPropertyValue(prop) : '';
        if (prop === 'border-width' && cs) ph = cs.borderTopWidth; if (prop === 'border-color' && cs) ph = cs.borderTopColor;
        if (prop === 'background' && cs) ph = cs.backgroundColor;
        const reset = v !== '' ? `<button class="rst" data-rreset="${esc(sel)}" data-rprop="${prop}" title="移除這條規則">↺</button>` : '';
        return `<div class="prop ${v !== '' ? 'ovr' : ''}"><div class="pl"><span>${plabel}</span>${reset}<code>${prop}</code></div>${control(id, type === 'text' ? 'text' : type, v, { key: prop === 'width' ? 'optw' : prop === 'min-height' ? 'opth' : prop === 'border-radius' ? 'radius' : prop === 'font-size' ? 'fs' : prop === 'border-width' ? 'bw' : prop === 'gap' ? 'gap' : 'px', placeholder: ph ? '目前 ' + (ph.length > 40 ? ph.slice(0, 40) + '…' : ph) : '' })}</div>`;
      }).join('');
      h += `<div class="grp"><div class="grp-h"><b>${esc(label)}</b><span><code>${esc(sel)}</code>${tEl ? '' : ' · 範例中沒有這個部分'}</span></div>${rows}</div>`;
    });
    h += `<div class="grp"><button class="danger" data-lact="resetgen">重設此元件的樣式規則</button></div>`;
    R.innerHTML = h;
  }
  // rename (library header inputs)
  function onRename(e) {
    const t = e.target; if (!t.dataset || !t.dataset.ren || !ui.sel || !ui.sel.lib) return;
    const val = t.value.trim(), L = state.lib;
    if (t.dataset.ren === 'gen') { const g = genById(ui.sel.gen); if (!val || val === g.name) delete L.names['g:' + g.id]; else L.names['g:' + g.id] = val; }
    else {
      const c = compById(ui.sel.comp);
      if (t.dataset.ren === 'comp') {
        if (c.custom) { if (val) L.comps.find(x => x.id === c.id).name = val; }
        else if (!val || val === COMPONENTS.find(x => x.id === c.id).name) delete L.names[c.id]; else L.names[c.id] = val;
      } else {
        const lv = L.vars.find(x => x.id === ui.sel.variant);
        if (lv) { if (val) lv.label = val; }
        else { const orig = COMPONENTS.find(x => x.id === c.id).variants.find(x => x.id === ui.sel.variant).label; const k = c.id + '/' + ui.sel.variant; if (!val || val === orig) delete L.names[k]; else L.names[k] = val; }
      }
    }
    commit();
    if (e.type === 'change') { flushCommit(); renderLib(); renderLeft(); toast('已重新命名'); }
  }
  $('#right').addEventListener('input', onRename);
  $('#right').addEventListener('change', onRename);
  $('#right').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.ren) e.target.blur(); });

  /* ---------- library actions: add / duplicate / delete ---------- */
  function effectiveOwn(B, fromVid) {
    const V = state.components[B.id], own = {};
    const vs = (V.variantSize || {})[fromVid];
    B.props.filter(p => p.scope !== 'variant').forEach(p => {
      const v = vs && p.key in vs.props ? vs.props[p.key] : p.scope === 'size' ? ((V.size || {}).md || {})[p.key] : (V.base || {})[p.key];
      if (v !== undefined) own[p.key] = clone(v);
    });
    return own;
  }
  // new custom variant of `ownerId`, starting from variant `fromVid` of component `src`
  function createVariant(ownerId, src, fromVid, label) {
    const B = baseOf(src), V = state.components[B.id];
    const from = src.variants.find(v => v.id === fromVid) || src.variants[0];
    const id = uid('u');
    const srcLv = state.lib.vars.find(x => x.id === from.id);
    const rcls = srcLv ? srcLv.rcls : (B.rcls || from.cls);
    const values = clone(V.variant[from.id] || {}), own = effectiveOwn(B, from.id);
    state.lib.vars.push({ id, base: B.id, owner: ownerId, label, from: from.id, rcls, init: { variant: clone(values), own: clone(own) } });
    V.variant[id] = values;
    V.variantSize = V.variantSize || {};
    V.variantSize[id] = { sel: customSel({ id, rcls }), props: own, label: '此變體專屬' };
    // variant icons follow the copy
    const sz = B.sizes && B.sizes.length ? 'md' : null;
    const vi = state.variantIcons[vkey(src.id, from.id, sz)];
    if (vi) state.variantIcons[vkey(ownerId, id, sz)] = clone(vi);
    return id;
  }
  function impactOf(t) {
    const out = { demo: {}, nDemo: 0, placed: [] };
    const match = it => t.gen ? false : it.comp === t.comp && (!t.variants || t.variants.includes(it.variant));
    if (W && W.DSRuntime) W.DSRuntime.scan().forEach(it => { if (!it.placed && match(it)) { out.demo[it.ctx] = (out.demo[it.ctx] || 0) + 1; out.nDemo++; } });
    if (t.gen && D) D.querySelectorAll(genById(t.gen).sel).forEach(el => { if (el.closest('[data-ds-id]')) return; const c = W.DSRuntime.context(el); out.demo[c] = (out.demo[c] || 0) + 1; out.nDemo++; });
    out.placed = state.placed.filter(p => t.gen ? p.gid === t.gen : p.comp === t.comp && (!t.variants || t.variants.includes(p.variant)));
    return out;
  }
  function confirmDelete(title, t, builtin, onOk) {
    const imp = impactOf(t);
    const pages = Object.entries(imp.demo).sort((a, b) => b[1] - a[1]);
    let body = '';
    if (!imp.nDemo && !imp.placed.length) body = '<p class="muted">目前沒有任何頁面實例使用它。</p>';
    else {
      body = '<p>以下頁面實例會受到影響：</p><ul class="imp">';
      body += pages.map(([c, n]) => `<li><b>${esc(ctxName(c))}</b>：${n} 個（原始 demo）</li>`).join('');
      if (imp.placed.length) body += `<li><b>拖入的元件</b>：${imp.placed.length} 個 — ${imp.placed.slice(0, 6).map(p => esc(placedLabel(p))).join('、')}${imp.placed.length > 6 ? '…' : ''}</li>`;
      body += '</ul>';
      if (imp.nDemo) body += `<p class="warn">${builtin ? '原始 demo 中的實例會在頁面上被隱藏（display:none），匯出的檔案也一樣；之後可從元件庫左側「已刪除」還原。' : '這些實例會失去這個元件的樣式。'}</p>`;
      if (imp.placed.length) body += '<p class="warn">拖入頁面的實例會一併刪除。</p>';
    }
    dialog(`<h3>${esc(title)}</h3>${body}<div class="dlg-acts"><button class="tbtn" data-dlg="cancel">取消</button><button class="tbtn danger-btn" data-dlg="ok">確定刪除</button></div>`, act => { if (act === 'ok') { onOk(imp); return true; } return act === 'cancel'; });
  }
  function doDelete(t, imp) {
    const L = state.lib;
    removePlaced(imp.placed.map(p => p.id));
    if (t.gen) { if (!L.deleted.includes('g:' + t.gen)) L.deleted.push('g:' + t.gen); }
    else {
      const c = compById(t.comp);
      (t.variants || c.variants.filter(v => !v.deleted).map(v => v.id)).forEach(vid => {
        const lv = L.vars.find(x => x.id === vid);
        if (lv) {
          L.vars = L.vars.filter(x => x !== lv);
          const V = state.components[lv.base]; delete V.variant[vid]; if (V.variantSize) delete V.variantSize[vid];
          Object.keys(state.variantIcons).forEach(k => { if (k.split('/')[1] === vid) delete state.variantIcons[k]; });
        } else if (!L.deleted.includes(c.id + '/' + vid)) L.deleted.push(c.id + '/' + vid);
      });
      if (c.custom && !L.vars.some(v => v.owner === c.id)) L.comps = L.comps.filter(x => x.id !== c.id);
    }
    if (ui.sel && ui.sel.lib && !libSelValid(ui.sel)) ui.sel = null;
    flushCommit(); refreshAll(); toast('已刪除');
  }
  function libAction(act, ds) {
    const sel = ui.sel || {};
    if (act === 'report') { ui.reportOpen = !ui.reportOpen; renderLib(); return; }
    if (act === 'addvar') return openAddVariant(ds.comp);
    if (act === 'rename') {
      if (ds.gen) libSelect('g:' + ds.gen, { focus: '#renGen' });
      else { const c = compById(ds.comp); const v = c.variants.find(x => !x.deleted); libSelect(`c:${c.id}/${v.id}`, { focus: '#renComp' }); }
      return;
    }
    if (act === 'dupcomp') {
      const c = compById(ds.comp), B = baseOf(c);
      const cc = { id: uid('c'), base: B.id, name: c.name + ' copy', zh: c.custom ? c.zh : '複製自 ' + c.name };
      state.lib.comps.push(cc);
      let first;
      c.variants.filter(v => !v.deleted).forEach(v => { const id = createVariant(cc.id, c, v.id, v.label); first = first || id; });
      flushCommit(); refreshAll(); libSelect(`c:${cc.id}/${first}`, { scroll: true, focus: '#renComp' }); toast('已複製元件');
      return;
    }
    if (act === 'dupvar') {
      const c = compById(sel.comp), v = c.variants.find(x => x.id === sel.variant);
      const id = createVariant(c.id, c, v.id, v.label + ' copy');
      flushCommit(); refreshAll(); libSelect(`c:${c.id}/${id}`, { scroll: true, focus: '#renVar' }); toast('已複製變體');
      return;
    }
    if (act === 'delvar') {
      const c = compById(sel.comp), v = c.variants.find(x => x.id === sel.variant);
      const t = { comp: c.id, variants: [v.id] };
      confirmDelete(`刪除變體「${c.name} · ${v.label}」？`, t, !v.custom, imp => doDelete(t, imp));
      return;
    }
    if (act === 'delcomp') {
      const c = compById(ds.comp), t = { comp: c.id };
      confirmDelete(`刪除元件「${c.name}」（含 ${c.variants.filter(v => !v.deleted).length} 個變體）？`, t, !c.custom, imp => doDelete(t, imp));
      return;
    }
    if (act === 'delgen') {
      const g = genById(ds.gen), t = { gen: g.id };
      confirmDelete(`刪除元件「${genName(g)}」？`, t, true, imp => doDelete(t, imp));
      return;
    }
    if (act === 'resetgen') {
      const g = genById(sel.gen); g.targets.forEach(([s]) => delete state.lib.rules[s]);
      applyCSS(); flushCommit(); renderRight(); toast('已重設樣式規則');
      return;
    }
    if (act === 'goto') {
      const um = usageMap();
      if (sel.gen) {
        const el = genSample(genById(sel.gen));
        setTab('preview');
        if (el) { const ctx = W.DSRuntime.context(el); goTo(ctx, () => { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }); }
        return;
      }
      const list = W.DSRuntime.scan().filter(it => it.comp === sel.comp && it.variant === sel.variant);
      if (!list.length) return toast('頁面上還沒有這個變體的實例，可從元件面板拖曳新增');
      const target = list.find(it => it.el.getClientRects().length) || list[0];
      setTab('preview'); ui.mode = 'variant';
      locate(target.fp, target.ctx);
    }
  }

  /* ---------- dialogs ---------- */
  let dlgCb = null;
  function dialog(html, cb) { $('#dlg .box').innerHTML = html; $('#dlg').hidden = false; dlgCb = cb; setTimeout(() => { const i = $('#dlg input'); if (i) i.focus(); }, 30); }
  function closeDialog() { $('#dlg').hidden = true; dlgCb = null; }
  $('#dlg').addEventListener('click', e => {
    if (e.target.id === 'dlg') return closeDialog();
    const b = e.target.closest('[data-dlg]'); if (!b || !dlgCb) return;
    if (dlgCb(b.dataset.dlg, b)) closeDialog();
  });
  $('#dlg').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); closeDialog(); }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { const ok = $('#dlg [data-dlg=ok]'); if (ok) ok.click(); }
  });
  function openAddComp(step, base) {
    if (!step) {
      dialog(`<h3>新增元件 · 1 / 2　選擇基礎類型</h3><p class="muted">新元件會沿用基礎類型的結構與可調整的樣式屬性，之後可自由修改。</p>
        <div class="base-grid">${COMPONENTS.map(c => `<button class="base-it" data-dlg="base" data-base="${c.id}"><b>${esc(c.name)}</b><span>${esc(c.zh)}</span><small>${c.variants.length} 個變體可作為起點</small></button>`).join('')}</div>
        <div class="dlg-acts"><button class="tbtn" data-dlg="cancel">取消</button></div>`, (act, b) => { if (act === 'base') { openAddComp(2, b.dataset.base); return false; } return act === 'cancel'; });
      return;
    }
    const B = compById(base);
    dialog(`<h3>新增元件 · 2 / 2　命名與起始樣式</h3><p class="muted">基礎類型：<b>${esc(B.name)}</b>（${esc(B.zh)}）</p>
      <label class="fld-l">元件名稱<input class="txt" id="dName" value="${esc('My ' + B.name)}"></label>
      <label class="fld-l">中文說明（選填）<input class="txt" id="dZh" placeholder="例如：主視覺按鈕"></label>
      <label class="fld-l">第一個變體名稱<input class="txt" id="dVar" value="Default"></label>
      <label class="fld-l">起始樣式（複製自）<select id="dFrom">${B.variants.filter(v => !v.deleted).map(v => `<option value="${v.id}">${esc(v.label)}</option>`).join('')}</select></label>
      <div class="dlg-acts"><button class="tbtn" data-dlg="back">← 上一步</button><span class="sp"></span><button class="tbtn" data-dlg="cancel">取消</button><button class="tbtn primary" data-dlg="ok">建立元件</button></div>`, act => {
      if (act === 'back') { openAddComp(); return false; }
      if (act !== 'ok') return act === 'cancel';
      const name = $('#dName').value.trim(); if (!name) { toast('請輸入元件名稱'); return false; }
      const cc = { id: uid('c'), base, name, zh: $('#dZh').value.trim() };
      state.lib.comps.push(cc);
      const vid = createVariant(cc.id, B, $('#dFrom').value, $('#dVar').value.trim() || 'Default');
      flushCommit();
      if (ui.tab !== 'library') setTab('library');
      refreshAll(); libSelect(`c:${cc.id}/${vid}`, { scroll: true }); toast(`已建立「${name}」，可以開始設定樣式`);
      return true;
    });
  }
  function openAddVariant(cid) {
    const c = compById(cid);
    dialog(`<h3>新增變體 · ${esc(c.name)}</h3><p class="muted">例如為 Button 加上 Outline、Danger 等變體。新變體擁有自己的 token，不會影響既有變體。</p>
      <label class="fld-l">變體名稱<input class="txt" id="dVar" value="Outline"></label>
      <label class="fld-l">起始樣式（複製自）<select id="dFrom">${c.variants.filter(v => !v.deleted).map(v => `<option value="${v.id}">${esc(v.label)}</option>`).join('')}</select></label>
      <div class="dlg-acts"><button class="tbtn" data-dlg="cancel">取消</button><button class="tbtn primary" data-dlg="ok">建立變體</button></div>`, act => {
      if (act !== 'ok') return act === 'cancel';
      const label = $('#dVar').value.trim(); if (!label) { toast('請輸入變體名稱'); return false; }
      const id = createVariant(c.id, c, $('#dFrom').value, label);
      flushCommit();
      if (ui.tab !== 'library') setTab('library');
      refreshAll(); libSelect(`c:${c.id}/${id}`, { scroll: true }); toast(`已新增變體「${label}」`);
      return true;
    });
  }

  /* ---------- tabs: page editor ↔ component library ---------- */
  function setTab(t) {
    if (ui.tab === t) return;
    flushCommit();
    ui.tab = t;
    $$('#tabSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
    $('#previewCenter').hidden = t !== 'preview'; $('#libCenter').hidden = t !== 'library';
    if (t === 'library') {
      ui.prevSel = ui.sel; ui.prevMode = ui.mode; ui.prevView = ui.view;
      ui.mode = 'variant'; ui.sel = ui.libSel && libSelValid(ui.libSel) ? ui.libSel : null; ui.view = { type: 'component' };
      if (!LD) bootLib(); else renderLib();
    } else {
      ui.libSel = ui.sel; ui.sel = ui.prevSel || null; ui.mode = ui.prevMode || 'variant'; ui.view = ui.prevView || { type: 'none' };
      if (ui.sel && ui.sel.fp && !findFp(ui.sel.fp)) ui.sel = null;
      layoutStage();
    }
    renderLeft(); renderRight();
  }
  $('#tabSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.v); });
  $('#libThemeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTheme(b.dataset.v); });
  $('#libQ').addEventListener('input', e => { ui.libFilter = e.target.value; filterLib(); const l = $('#libLeftQ'); if (l) l.value = ui.libFilter; });
  $('#bLibReport').addEventListener('click', () => { ui.reportOpen = !ui.reportOpen; renderLib(); if (ui.reportOpen) { const r = LD && LD.getElementById('L-report'); if (r) r.scrollIntoView({ behavior: 'smooth' }); } });
  $('#bAddComp').addEventListener('click', () => openAddComp());
  $('#right').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.lact) { libAction(b.dataset.lact, b.dataset); return; }
    if (b.dataset.size && b.closest('#libSize')) { ui.sel.size = b.dataset.size; renderRight(); return; }
    if (b.dataset.rreset) { const r = state.lib.rules[b.dataset.rreset]; if (r) { delete r[b.dataset.rprop]; if (!Object.keys(r).length) delete state.lib.rules[b.dataset.rreset]; } applyCSS(); commit(); renderRight(); return; }
    if (b.id === 'bOpenLib') { const k = `c:${ui.sel.comp}/${ui.sel.variant}`; ui.libSel = null; setTab('library'); ui.pendingScroll = k; libSelect(k, { scroll: true }); return; }
    if (b.dataset.pact && ui.sel && ui.sel.placed) {
      const id = ui.sel.placed, a = b.dataset.pact;
      if (a === 'up') nudgePlaced(id, -1); if (a === 'down') nudgePlaced(id, 1); if (a === 'out') moveOut(id);
      if (a === 'dup') duplicatePlaced(id); if (a === 'del') deletePlaced(id);
    }
  });

  /* ---------- export / import ---------- */
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function exportTokens() {
    const out = { foundations: {}, components: {} };
    state.foundations.forEach(g => g.tokens.forEach(t => { out.foundations[t.name] = t.value !== undefined ? t.value : { dark: t.dark, light: t.light }; }));
    COMPONENTS.forEach(c => { out.components[c.id] = state.components[c.id]; });
    out.library = {
      customComponents: state.lib.comps.map(c => ({ id: c.id, name: c.name, base: c.base, variants: state.lib.vars.filter(v => v.owner === c.id).map(v => v.id) })),
      customVariants: state.lib.vars.map(v => ({ id: v.id, label: v.label, base: v.base, owner: v.owner, class: v.rcls + ' ds-v-' + v.id })),
      names: state.lib.names, deleted: state.lib.deleted, rules: state.lib.rules,
    };
    return out;
  }
  $('#exportMenu').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const css = buildCSS(state);
    const act = b.dataset.x;
    if (act === 'css') download('design-system.css', css, 'text/css');
    if (act === 'html') { download('dexless.html', composeHTML({ inlineCSS: false }), 'text/html'); setTimeout(() => download('design-system.css', css, 'text/css'), 400); }
    if (act === 'single') download('dexless.standalone.html', composeHTML({ inlineCSS: true, css }), 'text/html');
    if (act === 'json') download('design-system.settings.json', JSON.stringify(state, null, 2), 'application/json');
    if (act === 'tokens') download('tokens.json', JSON.stringify(exportTokens(), null, 2), 'application/json');
    if (act === 'import') $('#importFile').click();
    $('#exportMenu').hidden = true;
  });
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const s = JSON.parse(await f.text()); if (s.version !== 1) throw new Error('version'); flushCommit(); undo.push(JSON.stringify(state)); redo = []; state = mergeDefaults(s); lastSnap = JSON.stringify(state); save(); ui.sel = null; ui.libSel = null; ui.prevSel = null; refreshAll(); updateUndoButtons(); toast('已匯入設定'); }
    catch (err) { toast('匯入失敗：不是這個編輯器匯出的設定檔'); }
    e.target.value = '';
  });

  /* ---------- misc ---------- */
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
  function setSelectMode(on) { ui.selectMode = on; $('#bPick').classList.toggle('on', on); if (D) D.body.classList.toggle('ds-picking', on); if (!on) ui.hover = null; }
  function onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = ['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); doRedo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveNow(); return; }
    if (typing) return;
    if (e.key === 'Escape' && drag) { if (drag.kind === 'new') endPaletteDrag(null, true); else { drag = null; if (D) D.body.classList.remove('ds-dragging'); showDrop(null); } return; }
    if ((e.key === 'v' || e.key === 'V') && ui.tab === 'preview') { setSelectMode(!ui.selectMode); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && ui.tab === 'preview' && ui.sel && ui.sel.placed) { e.preventDefault(); deletePlaced(ui.sel.placed); return; }
    if (e.key === 'Escape') { ui.sel = null; renderRight(); renderLeft(); if (ui.tab === 'library') markLibSel(); }
  }
  function saveNow() { flushCommit(); save(); toast('已儲存到這個瀏覽器（下次開啟會自動載入）'); }
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', e => {
    if (!e.target.closest('#bExport') && !e.target.closest('#exportMenu')) $('#exportMenu').hidden = true;
    const pop = $('#iconPop'); if (pop && !pop.hidden && !e.target.closest('#iconPop') && !e.target.closest('[data-icon-side]')) pop.hidden = true;
  });

  $('#pageSel').innerHTML = PAGES.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('') + '<option value="" disabled>（其他頁面）</option>';
  $('#pageSel').addEventListener('change', e => navigate(e.target.value));
  $('#themeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTheme(b.dataset.v); });
  $('#stateSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTilt(b.dataset.v === 'tilt'); });
  $('#widthSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ui.width = +b.dataset.v; $$('#widthSeg button').forEach(x => x.classList.toggle('on', x === b)); layoutStage(); setTimeout(renderLeft, 200); });
  $('#zoomSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; ui.zoom = b.dataset.v; $$('#zoomSeg button').forEach(x => x.classList.toggle('on', x === b)); layoutStage(); });
  $('#bPick').addEventListener('click', () => setSelectMode(!ui.selectMode));
  $('#bUndo').addEventListener('click', doUndo);
  $('#bRedo').addEventListener('click', doRedo);
  $('#bExport').addEventListener('click', () => { $('#exportMenu').hidden = !$('#exportMenu').hidden; });
  $('#bResetAll').addEventListener('click', () => {
    if (!confirm('確定要重設？所有設計設定、變體、實例覆寫、元件庫的自訂元件與拖入頁面的元件都會還原成原始狀態。（可用 Ctrl+Z 復原）')) return;
    flushCommit(); undo.push(JSON.stringify(state)); redo = []; state = defaultState(); lastSnap = JSON.stringify(state); save();
    ui.sel = null; ui.libSel = null; ui.prevSel = null; refreshAll(); updateUndoButtons(); toast('已全部重設');
  });
  $('#bSave').addEventListener('click', saveNow);
  $('#bHelp').addEventListener('click', () => { $('#help').hidden = !$('#help').hidden; });
  $('#help').addEventListener('click', e => { if (e.target.id === 'help' || e.target.closest('.close')) $('#help').hidden = true; });
  window.addEventListener('resize', layoutStage);
  setSelectMode(true); layoutStage(); updateUndoButtons(); bootPreview();
  window.DSEditor = {
    get state() { return state; }, ui, applyAll, renderLeft, renderRight, selectElement, navigate, setTheme, setTilt, composeHTML, buildCSS: () => buildCSS(state),
    // used by the automated checks in tools/
    get W() { return W; }, get D() { return D; }, get LW() { return LW; }, get LD() { return LD; },
    setTab, libSelect, libAction, addPlaced, movePlaced, deletePlaced, dropAt, specFrom, doUndo, doRedo, flushCommit, allComps, onControlValue: (id, value) => { const b = binds[id]; if (!b) return false; const t = $(`#right [data-id="${id}"][data-k=text]`) || $(`#right [data-id="${id}"]`); t.value = value; t.dispatchEvent(new Event('change', { bubbles: true })); return true; },
  };
})();
