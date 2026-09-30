/* DEXLESS Design System runtime — applies per-instance overrides, icon changes and
 * components placed from the component library.
 * Many components in the prototype are re-rendered with innerHTML (positions, signals,
 * alerts, chat…), so an instance cannot be tied to a DOM node. Each component element gets a
 * fingerprint: component | variant | size | page context | label | occurrence, and overrides
 * are re-applied whenever the DOM changes. Placed components are rebuilt from their spec and
 * re-inserted at their anchor whenever they go missing; their fingerprint is `comp|placed|id`.
 * Data: <script id="ds-overrides" type="application/json">{ variantIcons:{}, instances:{}, placed:[], match:[] }</script> */
(function () {
  'use strict';
  let data = { variantIcons: {}, instances: {}, placed: [] };
  try { const el = document.getElementById('ds-overrides'); if (el) data = Object.assign(data, JSON.parse(el.textContent || '{}')); } catch (e) { /* keep defaults */ }
  let MATCH = data.match || window.DS_MATCH || [];
  let ROOTS = MATCH.map(c => c.root).join(',');

  const CTX_OVERLAYS = '#agw,#spw,#pops,#popc,#toast,#orderModal,#brainMdl,#cdock,#devbar';
  function context(el) {
    const ov = el.closest(CTX_OVERLAYS);
    if (ov) return ov.id;
    const gp = el.closest('.gp'); const pg = el.closest('[data-page]');
    if (el.closest('.gnav')) return 'nav';
    if (el.closest('.side')) return 'side';
    return (gp ? gp.dataset.g : 'frame') + (pg ? ':' + pg.dataset.page : '');
  }
  function describe(el) {
    for (const c of MATCH) {
      if (!el.matches(c.root)) continue;
      let variant = null, size = null;
      c.variants.forEach(v => { if (el.matches(v.sel)) variant = v.id; });
      (c.sizes || []).forEach(s => { if (el.matches(s.sel)) size = s.id; });
      return { comp: c.id, base: c.base || c.id, variant, size };
    }
    return null;
  }
  function label(el) {
    if (el.id) return '#' + el.id;
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32);
    // numbers are swapped in the "Unstable" demo state, so they are not part of the identity
    return t.replace(/[+−\-]?[\d][\d.,:%×]*/g, '#');
  }
  function scan() {
    const counts = {}, list = [];
    if (!ROOTS) return list;
    document.querySelectorAll(ROOTS).forEach(el => {
      if (el.closest('#ds-overlay')) return;
      const d = describe(el); if (!d) return;
      let fp;
      if (el.dataset.dsId) fp = d.comp + '|placed|' + el.dataset.dsId;
      else {
        const base = [d.comp, d.variant || '-', d.size || '-', context(el), label(el)].join('|');
        const n = counts[base] = (counts[base] || 0) + 1;
        fp = base + '|' + n;
      }
      el.dataset.dsFp = fp;
      list.push({ el, fp, ...d, ctx: context(el), placed: el.dataset.dsId || null });
    });
    return list;
  }

  /* ---------- placed components ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ico = n => n ? `<svg class="ico"><use href="#i-${esc(n)}"/></svg>` : '';
  const items = t => String(t == null ? '' : t).split('|').map(x => x.trim()).filter(Boolean);
  function markup(p) {
    const cls = esc(p.cls), t = esc(p.text), has = c => (' ' + p.cls + ' ').includes(' ' + c + ' ');
    switch (p.base) {
      case 'button': return `<button type="button" class="${cls}">${ico(p.left)}${t}${ico(p.right)}</button>`;
      case 'iconbutton': return `<button type="button" class="${cls}" aria-label="${t}" title="${t}">${ico(p.left || 'spark')}</button>`;
      case 'pill': case 'chip': return `<span class="${cls}">${ico(p.left)}${t}</span>`;
      case 'tabs': return `<div class="${cls}">${items(p.text).map((x, i) => `<span class="${i === (p.active || 0) ? 'on' : ''}">${esc(x)}</span>`).join('')}</div>`;
      case 'card': return `<div class="${cls}"><div class="h2">${esc(p.title)}</div>${p.text ? `<p class="lbl" style="margin-top:8px;line-height:1.6">${t}</p>` : ''}</div>`;
      case 'toggle': return `<span class="${cls}${p.on ? ' on' : ''}"><i></i>${t}</span>`;
      case 'input':
        if (has('inp')) return `<input class="${cls}" placeholder="${t}" aria-label="${esc(p.title || p.text)}">`;
        if (has('sel')) return `<select class="${cls}" aria-label="${esc(p.title || 'Select')}">${items(p.text).map(x => `<option>${esc(x)}</option>`).join('')}</select>`;
        if (has('sm')) return `<span class="${cls}">${t}</span>`;
        return `<label class="${cls}"><span class="lbl">${esc(p.title)}</span><input placeholder="${t}" style="flex:1;min-width:0;background:none;border:0;outline:0;color:inherit;font:inherit"></label>`;
      default: return p.html || '<div></div>';
    }
  }
  function build(p) {
    const t = document.createElement('template');
    t.innerHTML = markup(p).trim();
    let el = t.content.children.length === 1 ? t.content.firstElementChild : null;
    if (!el) { el = document.createElement('div'); el.appendChild(t.content); }
    el.dataset.dsId = p.id;
    return el;
  }
  const skip = n => n.nodeType !== 1 || n.hasAttribute('data-ds-id') || n.id === 'ds-overlay' || n.id === 'ds-probe';
  function resolveAnchor(a) {
    if (!a) return null;
    if (a.placed) return document.querySelector(`[data-ds-id="${CSS.escape(a.placed)}"]`);
    let el = a.root === 'body' ? document.body : document.querySelector(a.root);
    for (const i of a.idx || []) {
      if (!el) return null;
      el = [...el.children].filter(k => !skip(k))[i] || null;
    }
    return el;
  }
  const anchorKey = p => JSON.stringify(p.anchor) + p.pos;
  function insert(p, el, anchor) {
    if (p.pos === 'inside') { anchor.appendChild(el); return; }
    if (p.pos === 'before') { anchor.before(el); return; }
    let node = anchor; // keep the drop order of several components placed after the same anchor
    while (node.nextElementSibling && node.nextElementSibling.dataset.dsAfter === anchorKey(p)) node = node.nextElementSibling;
    el.dataset.dsAfter = anchorKey(p);
    node.after(el);
  }
  function ensurePlaced() {
    let pending = (data.placed || []).filter(p => !document.querySelector(`[data-ds-id="${CSS.escape(p.id)}"]`));
    // placed components can be anchored to other placed components: insert in dependency order
    for (let pass = 0; pending.length && pass <= pending.length; pass++) {
      pending = pending.filter(p => {
        const a = resolveAnchor(p.anchor);
        if (!a) return true;
        insert(p, build(p), a);
        return false;
      });
    }
  }
  function rebuild() { document.querySelectorAll('[data-ds-id]').forEach(el => { if (el.isConnected && !el.parentElement.closest('[data-ds-id]')) el.remove(); }); ensurePlaced(); }
  // placed tabs / toggles get the same interaction the demo gives its own
  document.addEventListener('click', e => {
    const host = e.target.closest && e.target.closest('[data-ds-id]'); if (!host) return;
    const tab = e.target.closest('.tabs span');
    if (tab && host.contains(tab)) [...tab.parentElement.children].forEach(s => s.classList.toggle('on', s === tab));
    const tg = e.target.closest('.tg2');
    if (tg && host.contains(tg)) tg.classList.toggle('on');
  });

  /* ---------- icons ---------- */
  function isBlank(n) { return n.nodeType === 3 && !n.textContent.trim(); }
  // The icon at the left / right edge of the element (an icon-only button counts as "left").
  function edgeIcon(el, side) {
    const nodes = [...el.childNodes].filter(n => !isBlank(n));
    if (!nodes.length) return null;
    const n = side === 'left' ? nodes[0] : nodes[nodes.length - 1];
    const isIco = n.nodeType === 1 && n.tagName.toLowerCase() === 'svg' && n.classList.contains('ico');
    if (!isIco) return null;
    if (side === 'right' && nodes.length === 1 && !n.dataset.dsIcon) return null;
    return n;
  }
  function iconName(svg) { const u = svg && svg.querySelector('use'); return u ? (u.getAttribute('href') || '').replace('#i-', '') : null; }
  function makeIcon(name, like) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'ico');
    if (like && like.getAttribute('style')) svg.setAttribute('style', like.getAttribute('style'));
    svg.dataset.dsIcon = name;
    const use = document.createElementNS(ns, 'use'); use.setAttribute('href', '#i-' + name); svg.appendChild(use);
    return svg;
  }
  function setIcon(el, side, name) {
    if (name === undefined) return;
    const cur = edgeIcon(el, side);
    const key = 'dsOrig' + (side === 'left' ? 'L' : 'R');
    if (!(key in el.dataset)) el.dataset[key] = cur ? cur.outerHTML : '';
    if (name === null) { if (cur) cur.remove(); return; }
    if (cur && iconName(cur) === name) return;
    const svg = makeIcon(name, cur);
    if (cur) cur.replaceWith(svg); else if (side === 'left') el.insertBefore(svg, el.firstChild); else el.appendChild(svg);
  }
  function restoreIcon(el, side) {
    const key = 'dsOrig' + (side === 'left' ? 'L' : 'R');
    if (!(key in el.dataset)) return;
    const orig = el.dataset[key]; delete el.dataset[key];
    const cur = edgeIcon(el, side);
    if (cur && cur.dataset.dsIcon) cur.remove(); else if (cur && !orig) cur.remove();
    if (orig && !edgeIcon(el, side)) { const t = document.createElement('template'); t.innerHTML = orig; const n = t.content.firstChild; side === 'left' ? el.insertBefore(n, el.firstChild) : el.appendChild(n); }
  }

  /* ---------- apply ---------- */
  // vars: custom properties (--btn-bg …); hard: real properties set with !important so that
  // layout-specific rules (e.g. `.behavior-actions .btn{font-size}`) cannot hide an instance edit;
  // clears: inline declarations from the original markup that the instance edit replaces.
  function applyVars(el, vars, hard, clears) {
    let applied = []; try { applied = JSON.parse(el.dataset.dsApplied || '[]'); } catch (e) { }
    let orig = {}; try { orig = JSON.parse(el.dataset.dsOrig || '{}'); } catch (e) { }
    applied.forEach(k => { if (!(k in vars) && !(k in hard)) el.style.removeProperty(k); });
    // restore inline declarations we cleared earlier but no longer need to
    Object.keys(orig).forEach(p => { if (!clears.includes(p) && !(p in hard)) { el.style.setProperty(p, orig[p]); delete orig[p]; } });
    [...clears, ...Object.keys(hard)].forEach(p => {
      const v = el.style.getPropertyValue(p);
      if (v && !(p in orig) && !applied.includes(p)) orig[p] = v;
      if (!(p in hard)) el.style.removeProperty(p);
    });
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    Object.entries(hard).forEach(([k, v]) => el.style.setProperty(k, v, 'important'));
    const keys = [...Object.keys(vars), ...Object.keys(hard)];
    if (keys.length) el.dataset.dsApplied = JSON.stringify(keys); else delete el.dataset.dsApplied;
    if (Object.keys(orig).length) el.dataset.dsOrig = JSON.stringify(orig); else delete el.dataset.dsOrig;
  }
  let busy = false;
  function apply() {
    if (busy) return; busy = true;
    try {
      ensurePlaced();
      scan().forEach(it => {
        const inst = data.instances[it.fp] || {};
        const vi = data.variantIcons[[it.comp, it.variant || '-', it.size || '-'].join('/')] || {};
        applyVars(it.el, inst.vars || {}, inst.hard || {}, inst.clear || []);
        ['left', 'right'].forEach(side => {
          const want = side in inst ? inst[side] : (side in vi ? vi[side] : undefined);
          if (want === undefined) restoreIcon(it.el, side); else setIcon(it.el, side, want);
        });
      });
    } finally { busy = false; }
  }
  let tm;
  const mo = new MutationObserver(() => { if (busy) return; clearTimeout(tm); tm = setTimeout(apply, 16); });
  function start() { apply(); mo.observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('load', apply);

  window.DSRuntime = {
    get data() { return data; },
    get ROOTS() { return ROOTS; },
    set(d) {
      const before = JSON.stringify([data.placed, MATCH]);
      data = Object.assign({ variantIcons: {}, instances: {}, placed: [] }, d);
      if (d.match) { MATCH = d.match; ROOTS = MATCH.map(c => c.root).join(','); }
      // rebuild placed components only when their specs (or the component list) changed
      if (JSON.stringify([data.placed, MATCH]) !== before) { busy = true; try { rebuild(); } finally { busy = false; } }
      apply();
    },
    apply, scan, describe, context, edgeIcon, iconName, build, resolveAnchor,
  };
})();
