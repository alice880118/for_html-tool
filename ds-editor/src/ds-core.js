/* DEXLESS Design System — core spec + CSS generator.
 * Shared by the editor (browser) and build script (Node).
 * The token values below are the *effective* values of the original prototype,
 * collected from ~30 cascading patch blocks (v4 … v39) and consolidated here. */
(function (root) {
  'use strict';

  /* ---------- 1. Foundations ---------- */
  // Each token: { name, label, type, value } (theme independent) or { name, label, type, dark, light }.
  // scope 'root' tokens are emitted on :root (fonts must reach <body>, which is outside .frame).
  const FOUNDATIONS = [
    { id: 'surface', label: '顏色 · 表面', tokens: [
      { name: '--bg', label: '頁面背景', type: 'color', dark: '#0b0c0e', light: '#f4f4f5' },
      { name: '--side', label: '側欄 / 導覽背景', type: 'color', dark: '#0f1013', light: '#fafafa' },
      { name: '--card', label: '卡片', type: 'color', dark: '#15171b', light: '#ffffff' },
      { name: '--card2', label: '卡片（次層）', type: 'color', dark: '#1c1e23', light: '#f4f4f6' },
      { name: '--line', label: '分隔線', type: 'color', dark: '#24272d', light: '#e8e8eb' },
      { name: '--line2', label: '分隔線（強）', type: 'color', dark: '#30333a', light: '#dcdce0' },
      { name: '--grid', label: '圖表格線', type: 'color', dark: 'rgba(255,255,255,.05)', light: 'rgba(0,0,0,.05)' },
    ]},
    { id: 'text', label: '顏色 · 文字', tokens: [
      { name: '--text', label: '主要文字', type: 'color', dark: '#f2f3f5', light: '#111214' },
      { name: '--mute', label: '次要文字', type: 'color', dark: '#a0a4ae', light: '#6f737a' },
      { name: '--dim', label: '輔助文字', type: 'color', dark: '#818792', light: '#a3a6ac' },
      { name: '--inv', label: '反白底色', type: 'color', dark: '#f2f3f5', light: '#111214' },
      { name: '--invtext', label: '反白文字', type: 'color', dark: '#0a0b0c', light: '#ffffff' },
      { name: '--gact', label: '導覽選中文字', type: 'color', dark: '#dbfd5c', light: '#111214' },
    ]},
    { id: 'brand', label: '顏色 · 品牌 / 強調', tokens: [
      { name: '--brand', label: '品牌色', type: 'color', dark: '#ffffff', light: '#ffffff' },
      { name: '--accent', label: '強調色', type: 'color', dark: '#ffffff', light: '#111214' },
      { name: '--violet', label: '強調色（舊名 violet）', type: 'color', dark: '#ffffff', light: '#111214' },
      { name: '--vbg', label: '強調底色', type: 'color', dark: 'rgba(255,255,255,.08)', light: 'rgba(17,18,20,.06)' },
      { name: '--lime', label: 'Lime', type: 'color', dark: '#dbfd5c', light: '#dbfd5c' },
      { name: '--amber', label: '提醒色（舊名 amber）', type: 'color', dark: '#DBFD5C', light: '#536b0e' },
      { name: '--abg', label: '提醒底色', type: 'color', dark: 'rgba(219,253,92,.12)', light: 'rgba(111,140,21,.10)' },
      { name: '--focus', label: 'Focus 外框', type: 'color', dark: '#DBFD5C', light: '#6d861a' },
      { name: '--brand-gradient', label: '品牌漸層', type: 'text', dark: 'linear-gradient(#fff,#fff)', light: 'linear-gradient(#fff,#fff)' },
      { name: '--chart-secondary', label: '圖表第二色', type: 'color', dark: '#7dcfc3', light: '#137c74' },
    ]},
    { id: 'semantic', label: '顏色 · 漲跌語意', tokens: [
      { name: '--up', label: '獲利 / 正向', type: 'color', dark: '#46ccb9', light: '#10a08a' },
      { name: '--upbg', label: '獲利底色', type: 'color', dark: 'rgba(70,204,185,.13)', light: 'rgba(16,160,138,.10)' },
      { name: '--down', label: '虧損 / 警示', type: 'color', dark: '#ff41a3', light: '#e02f8a' },
      { name: '--downbg', label: '虧損底色', type: 'color', dark: 'rgba(255,65,163,.13)', light: 'rgba(224,47,138,.09)' },
    ]},
    { id: 'font', label: '字體', tokens: [
      { name: '--font-sans', label: '內文字體', type: 'font', scope: 'root', value: 'Poppins,"Noto Sans TC",sans-serif' },
      { name: '--font-num', label: '數字字體', type: 'font', scope: 'root', value: 'Manrope,sans-serif' },
      { name: '--font-mono', label: '等寬字體', type: 'font', scope: 'root', value: '"JetBrains Mono",monospace' },
    ]},
    { id: 'radius', label: '圓角', tokens: [
      { name: '--r-card', label: '卡片', type: 'len', value: '16px' },
      { name: '--r-in', label: '內層區塊', type: 'len', value: '12px' },
      { name: '--r-ctl', label: '控制項', type: 'len', value: '10px' },
      { name: '--r-sm', label: '小型控制項', type: 'len', value: '8px' },
      { name: '--r-pill', label: '膠囊', type: 'len', value: '999px' },
    ]},
    { id: 'space', label: '間距 / 尺寸', tokens: [
      { name: '--space-grid', label: '卡片 / 區塊間距', type: 'len', value: '8px' },
      { name: '--control-h', label: '控制項高度', type: 'len', value: '40px' },
    ]},
    { id: 'shadow', label: '陰影', tokens: [
      { name: '--shadow', label: '卡片陰影', type: 'shadow', dark: 'none', light: '0 1px 2px rgba(17,18,20,.04),0 10px 30px rgba(17,18,20,.05)' },
      { name: '--shadow-menu', label: '下拉選單', type: 'shadow', value: '0 20px 40px rgba(0,0,0,.35)' },
      { name: '--shadow-window', label: '浮動視窗', type: 'shadow', value: '0 30px 70px rgba(0,0,0,.45)' },
    ]},
  ];

  /* ---------- 2. Components ----------
   * props: key → internal CSS var `--{p}-{key}` read by the component CSS.
   *   scope 'variant' → token `--{p}-{variant}-{key}` (per variant)
   *   scope 'size'    → token `--{p}-{size}-{key}` (per size)
   *   scope 'base'    → token `--{p}-base-{key}` (whole component)
   *   themed: true    → value may differ per theme (dark / light)
   *   css             → the real CSS property (inline originals are cleared on instance edits)
   * Variant values may be '' = "not set" (hover falls back to the default state). */
  const P = (key, label, type, scope, extra) => Object.assign({ key, label, type, scope }, extra || {});
  const C = (key, label, extra) => P(key, label, 'color', 'variant', Object.assign({ themed: true }, extra));

  const COMPONENTS = [
    {
      id: 'button', soft: ["bg","fg","bc"], name: 'Button', zh: '按鈕', p: 'btn', root: '.btn', icons: true, cat: 'Button', rcls: 'btn',
      variants: [
        { id: 'primary', label: 'Primary', cls: 'btn inv', sel: '.btn.inv,.btn.lime,.btn.grad', note: '原檔 inv / lime / grad 三個 class 最終樣式相同，合併為 Primary' },
        { id: 'ghost', label: 'Ghost', cls: 'btn ghost', sel: '.btn.ghost' },
        { id: 'text', label: 'Text', cls: 'btn txt', sel: '.btn.txt' },
        { id: 'buy', label: 'Buy（下單）', cls: 'btn buy', sel: '.btn.buy', note: '下單面板專用，尺寸由變體自己決定' },
      ],
      sizes: [
        { id: 'md', label: 'Default', sel: '.btn' },
        { id: 'sm', label: 'Small (.sm)', sel: '.btn.sm' },
      ],
      props: [
        C('bg', '背景', { css: 'background' }), C('fg', '文字顏色', { css: 'color' }),
        C('bc', '邊框顏色', { css: 'border-color' }), P('bw', '邊框粗細', 'len', 'variant', { css: 'border-width' }),
        P('shadow', '陰影', 'shadow', 'variant', { themed: true, css: 'box-shadow' }),
        P('font', '字體', 'font', 'variant', { css: 'font-family' }), P('fw', '字重', 'weight', 'variant', { css: 'font-weight' }),
        C('hover-bg', 'Hover 背景', { state: 'hover' }), C('hover-fg', 'Hover 文字', { state: 'hover' }), C('hover-bc', 'Hover 邊框', { state: 'hover' }),
        P('h', '最小高度', 'len', 'size', { css: 'min-height' }), P('py', '上下內距', 'len', 'size', { css: 'padding' }),
        P('px', '左右內距', 'len', 'size', { css: 'padding' }), P('fs', '字級', 'len', 'size', { css: 'font-size' }),
        P('radius', '圓角', 'len', 'size', { css: 'border-radius' }),
        P('gap', 'Icon 與文字間距', 'len', 'base', { css: 'gap' }), P('icon', 'Icon 尺寸', 'len', 'base'),
        P('w', '寬度', 'len', 'variant', { css: 'width', opt: true }),
      ],
      values: {
        base: { gap: '8px', icon: '16px' },
        size: {
          md: { h: 'var(--control-h)', py: '10px', px: '18px', fs: '13px', radius: 'var(--r-ctl)' },
          sm: { h: '32px', py: '7px', px: '12px', fs: '12px', radius: 'var(--r-sm)' },
        },
        variant: {
          primary: { bg: '#ffffff', fg: '#0a0b0c', bc: 'currentColor', bw: '0px', shadow: { dark: 'none', light: 'inset 0 0 0 1px #c9ccd2' }, font: 'var(--font-sans)', fw: '600', 'hover-bg': '', 'hover-fg': '', 'hover-bc': '' },
          ghost: { bg: 'var(--card)', fg: 'var(--text)', bc: 'var(--line2)', bw: '1px', shadow: 'none', font: 'var(--font-sans)', fw: '600', 'hover-bg': 'var(--card2)', 'hover-fg': '', 'hover-bc': 'var(--mute)' },
          text: { bg: 'transparent', fg: 'var(--mute)', bc: 'currentColor', bw: '0px', shadow: 'none', font: 'var(--font-sans)', fw: '600', 'hover-bg': 'var(--card2)', 'hover-fg': 'var(--text)', 'hover-bc': '' },
          buy: { bg: 'var(--up)', fg: '#06110f', bc: 'currentColor', bw: '0px', shadow: 'none', font: 'var(--font-sans)', fw: '600', 'hover-bg': '', 'hover-fg': '', 'hover-bc': '' },
        },
        // variant-owned size overrides (Buy has its own padding / radius; Text is narrower at md)
        variantSize: {
          text: { sel: '.btn.txt:not(.sm)', props: { px: '8px' }, label: 'Text（md）左右內距' },
          buy: { sel: '.btn.buy', props: { py: '13px', px: '13px', radius: '12px' }, label: 'Buy 專屬尺寸' },
        },
      },
      css: `
:where(.btn){display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;gap:var(--btn-gap);min-height:var(--btn-h);padding:var(--btn-py) var(--btn-px);border-radius:var(--btn-radius);font-size:var(--btn-fs);font-weight:var(--btn-fw);font-family:var(--btn-font);background:var(--btn-bg);color:var(--btn-fg);border:var(--btn-bw) solid var(--btn-bc);box-shadow:var(--btn-shadow);transition:background .15s,border-color .15s,box-shadow .15s}
:where(.btn):hover:not(:disabled){background:var(--btn-hover-bg,var(--btn-bg));color:var(--btn-hover-fg,var(--btn-fg));border-color:var(--btn-hover-bc,var(--btn-bc));filter:var(--btn-hover-filter,none)}
:where(.btn.inv,.btn.lime,.btn.grad){--btn-hover-filter:brightness(1.08)}
.btn .ico{width:var(--btn-icon);height:var(--btn-icon)}
/* contextual size adjustments (kept from the original layout) */
.sgc2 .btn{--btn-py:10px;--btn-px:12px;--btn-fs:12px;--btn-h:38px}
.sgc2 .btn.ghost{--btn-bg:transparent}
.behavior-actions .btn{--btn-fs:12px;--btn-py:9px;--btn-px:12px}`,
    },
    {
      id: 'iconbutton', soft: ["bg","fg","bc"], name: 'Icon Button', zh: '圖示按鈕', p: 'ib', root: '.agb', cat: 'Button', rcls: 'agb', icons: 'single',
      variants: [{ id: 'default', label: 'Default', cls: 'agb', sel: '.agb' }],
      sizes: [],
      props: [
        C('bg', '背景', { css: 'background' }), C('fg', 'Icon 顏色', { css: 'color' }), C('bc', '邊框顏色', { css: 'border-color' }),
        P('bw', '邊框粗細', 'len', 'variant', { css: 'border-width' }), P('shadow', '陰影', 'shadow', 'variant', { themed: true, css: 'box-shadow' }),
        C('hover-bg', 'Hover / 選中背景', { state: 'hover' }), C('hover-fg', 'Hover / 選中 Icon', { state: 'hover' }),
        P('size', '尺寸（寬高）', 'len', 'base', { css: 'width' }), P('radius', '圓角', 'len', 'base', { css: 'border-radius' }), P('icon', 'Icon 尺寸', 'len', 'base'),
      ],
      values: {
        base: { size: '30px', radius: 'var(--r-sm)', icon: '16px' },
        variant: { default: { bg: 'var(--card)', fg: 'var(--mute)', bc: 'var(--line)', bw: '1px', shadow: 'none', 'hover-bg': 'var(--card2)', 'hover-fg': 'var(--text)' } },
      },
      css: `
.agb{width:var(--ib-size);height:var(--ib-size);border-radius:var(--ib-radius);background:var(--ib-bg);color:var(--ib-fg);border:var(--ib-bw) solid var(--ib-bc);box-shadow:var(--ib-shadow)}
.agb:hover,.agb.on{background:var(--ib-hover-bg,var(--ib-bg));color:var(--ib-hover-fg,var(--ib-fg))}
.agb .ico{width:var(--ib-icon);height:var(--ib-icon)}
.dock-head .agb{--ib-size:26px}`,
    },
    {
      id: 'pill', name: 'Pill', zh: '狀態標籤', p: 'pill', root: '.pill', cat: 'Badge / Tag', rcls: 'pill',
      variants: [
        { id: 'up', label: 'Up（正向）', cls: 'pill up', sel: '.pill.up' },
        { id: 'down', label: 'Down（警示）', cls: 'pill down', sel: '.pill.down' },
        { id: 'accent', label: 'Accent（v）', cls: 'pill v', sel: '.pill.v' },
        { id: 'amber', label: 'Amber（a）', cls: 'pill a', sel: '.pill.a' },
        { id: 'neutral', label: 'Neutral（n）', cls: 'pill n', sel: '.pill.n' },
      ],
      sizes: [],
      props: [
        C('bg', '背景', { css: 'background' }), C('fg', '文字顏色', { css: 'color' }), C('bc', '邊框顏色', { css: 'border-color' }),
        P('bw', '邊框粗細', 'len', 'variant', { css: 'border-width' }),
        P('py', '上下內距', 'len', 'base', { css: 'padding' }), P('px', '左右內距', 'len', 'base', { css: 'padding' }),
        P('fs', '字級', 'len', 'base', { css: 'font-size' }), P('fw', '字重', 'weight', 'base', { css: 'font-weight' }),
        P('radius', '圓角', 'len', 'base', { css: 'border-radius' }), P('gap', '間距', 'len', 'base', { css: 'gap' }),
        P('w', '寬度', 'len', 'variant', { css: 'width', opt: true }), P('h', '高度', 'len', 'variant', { css: 'height', opt: true }),
      ],
      values: {
        base: { py: '3px', px: '9px', fs: '11px', fw: '600', radius: 'var(--r-pill)', gap: '5px' },
        variant: {
          up: { bg: 'var(--upbg)', fg: 'var(--up)', bc: 'currentColor', bw: '0px' },
          down: { bg: 'var(--downbg)', fg: 'var(--down)', bc: 'currentColor', bw: '0px' },
          accent: { bg: 'var(--vbg)', fg: 'var(--violet)', bc: 'currentColor', bw: '0px' },
          amber: { bg: 'var(--abg)', fg: 'var(--amber)', bc: 'currentColor', bw: '0px' },
          neutral: { bg: 'var(--card2)', fg: 'var(--mute)', bc: 'var(--line)', bw: '1px' },
        },
      },
      css: `
.pill{display:inline-flex;align-items:center;white-space:nowrap;gap:var(--pill-gap);border-radius:var(--pill-radius);padding:var(--pill-py) var(--pill-px);font-size:var(--pill-fs);font-weight:var(--pill-fw);background:var(--pill-bg,transparent);color:var(--pill-fg,currentColor);border:var(--pill-bw,0px) solid var(--pill-bc,currentColor)}`,
    },
    {
      id: 'chip', soft: ["bg","fg","bc"], name: 'Chip', zh: '標記', p: 'chip', root: '.chip2', cat: 'Badge / Tag', rcls: 'chip2',
      variants: [
        { id: 'default', label: 'Default', cls: 'chip2', sel: '.chip2' },
        { id: 'up', label: 'Up', cls: 'chip2 up', sel: '.chip2.up' },
        { id: 'amber', label: 'Amber', cls: 'chip2 a', sel: '.chip2.a' },
      ],
      sizes: [],
      props: [
        C('bg', '背景', { css: 'background' }), C('fg', '文字顏色', { css: 'color' }), C('bc', '邊框顏色', { css: 'border-color' }),
        P('bw', '邊框粗細', 'len', 'variant', { css: 'border-width' }),
        P('py', '上下內距', 'len', 'base', { css: 'padding' }), P('px', '左右內距', 'len', 'base', { css: 'padding' }),
        P('fs', '字級', 'len', 'base', { css: 'font-size' }), P('radius', '圓角', 'len', 'base', { css: 'border-radius' }),
        P('w', '寬度', 'len', 'variant', { css: 'width', opt: true }), P('h', '高度', 'len', 'variant', { css: 'height', opt: true }),
      ],
      values: {
        base: { py: '4px', px: '11px', fs: '12px', radius: 'var(--r-pill)' },
        variant: {
          default: { bg: 'transparent', fg: 'var(--text)', bc: 'var(--line2)', bw: '1px' },
          up: { bg: 'var(--upbg)', fg: 'var(--up)', bc: 'transparent', bw: '1px' },
          amber: { bg: 'var(--abg)', fg: 'var(--amber)', bc: 'transparent', bw: '1px' },
        },
      },
      css: `
.chip2{display:inline-flex;align-items:center;padding:var(--chip-py) var(--chip-px);border-radius:var(--chip-radius);font-size:var(--chip-fs);background:var(--chip-bg);color:var(--chip-fg);border:var(--chip-bw) solid var(--chip-bc)}`,
    },
    {
      id: 'tabs', name: 'Tabs', zh: '分段切換', p: 'tabs', root: '.tabs', cat: 'Tabs', rcls: 'tabs',
      variants: [{ id: 'default', label: 'Default', cls: 'tabs', sel: '.tabs' }],
      sizes: [
        { id: 'md', label: 'Default', sel: '.tabs' },
        { id: 'sm', label: 'Small (.sm)', sel: '.tabs.sm' },
      ],
      props: [
        C('bg', '容器背景'), C('bc', '容器邊框'), P('bw', '容器邊框粗細', 'len', 'variant'),
        P('radius', '容器圓角', 'len', 'variant'), P('pad', '容器內距', 'len', 'variant'), P('gap', '選項間距', 'len', 'variant'),
        C('item-fg', '選項文字'), P('item-radius', '選項圓角', 'len', 'variant'),
        C('on-bg', '選中背景', { state: 'active' }), C('on-fg', '選中文字', { state: 'active' }),
        P('on-fw', '選中字重', 'weight', 'variant', { state: 'active' }), P('on-shadow', '選中陰影', 'shadow', 'variant', { themed: true, state: 'active' }),
        P('item-py', '選項上下內距', 'len', 'size'), P('item-px', '選項左右內距', 'len', 'size'), P('item-fs', '選項字級', 'len', 'size'),
        P('w', '寬度', 'len', 'variant', { css: 'width', opt: true }),
      ],
      values: {
        size: { md: { 'item-py': '7px', 'item-px': '18px', 'item-fs': '1em' }, sm: { 'item-py': '5px', 'item-px': '12px', 'item-fs': '12px' } },
        variant: { default: { bg: 'var(--card2)', bc: 'var(--line)', bw: '1px', radius: 'var(--r-ctl)', pad: '4px', gap: '2px', 'item-fg': 'var(--mute)', 'item-radius': 'var(--r-sm)', 'on-bg': { dark: '#2a2d33', light: 'var(--card)' }, 'on-fg': 'var(--text)', 'on-fw': '500', 'on-shadow': 'var(--shadow)' } },
      },
      css: `
.tabs{display:inline-flex;background:var(--tabs-bg);border:var(--tabs-bw) solid var(--tabs-bc);border-radius:var(--tabs-radius);padding:var(--tabs-pad);gap:var(--tabs-gap)}
.tabs span{padding:var(--tabs-item-py) var(--tabs-item-px);border-radius:var(--tabs-item-radius);color:var(--tabs-item-fg);font-size:var(--tabs-item-fs)}
.tabs span.on{background:var(--tabs-on-bg);color:var(--tabs-on-fg);box-shadow:var(--tabs-on-shadow);font-weight:var(--tabs-on-fw)}`,
    },
    {
      id: 'card', name: 'Card', zh: '卡片', p: 'card', root: '.card,.sub-card', cat: 'Card',
      variants: [
        { id: 'default', label: 'Card', cls: 'card', sel: '.card' },
        { id: 'sub', label: 'Sub card', cls: 'sub-card', sel: '.sub-card' },
      ],
      sizes: [],
      props: [
        C('bg', '背景', { css: 'background' }), C('bc', '邊框顏色', { css: 'border-color' }), P('bw', '邊框粗細', 'len', 'variant', { css: 'border-width' }),
        P('radius', '圓角', 'len', 'variant', { css: 'border-radius' }), P('pad', '內距', 'len', 'variant', { css: 'padding' }),
        P('shadow', '陰影', 'shadow', 'variant', { themed: true, css: 'box-shadow' }),
        P('w', '寬度', 'len', 'variant', { css: 'width', opt: true }), P('h', '最小高度', 'len', 'variant', { css: 'min-height', opt: true }),
      ],
      values: {
        variant: {
          default: { bg: 'var(--card)', bc: 'var(--line)', bw: '1px', radius: 'var(--r-card)', pad: '20px', shadow: 'var(--shadow)' },
          sub: { bg: 'var(--card2)', bc: 'var(--line)', bw: '1px', radius: 'var(--r-in)', pad: '16px', shadow: 'none' },
        },
      },
      // :where() keeps specificity 0 so the many layout-specific paddings (.hero, .kp, .tr .card …) still win, like in the original.
      css: `
:where(.card,.sub-card){background:var(--card-bg);border:var(--card-bw) solid var(--card-bc);border-radius:var(--card-radius);padding:var(--card-pad);box-shadow:var(--card-shadow)}`,
    },
    {
      id: 'input', soft: ["bc"], name: 'Input', zh: '輸入欄位', p: 'field', root: '.fld,.inp,.sel', cat: 'Input / Select',
      variants: [
        { id: 'field', label: 'Field', cls: 'fld', sel: '.fld' },
        { id: 'field-sm', label: 'Field · sm', cls: 'fld sm', sel: '.fld.sm' },
        { id: 'input', label: 'Text input', cls: 'inp', sel: '.inp' },
        { id: 'select', label: 'Select', cls: 'sel', sel: '.sel' },
      ],
      sizes: [],
      props: [
        C('bg', '背景', { css: 'background' }), C('fg', '文字顏色', { css: 'color' }), C('bc', '邊框顏色', { css: 'border-color' }),
        P('bw', '邊框粗細', 'len', 'variant', { css: 'border-width' }), P('radius', '圓角', 'len', 'variant', { css: 'border-radius' }),
        P('py', '上下內距', 'len', 'variant', { css: 'padding' }), P('px', '左右內距', 'len', 'variant', { css: 'padding' }),
        P('fs', '字級', 'len', 'variant', { css: 'font-size' }), P('gap', '內容間距', 'len', 'variant', { css: 'gap' }),
        P('w', '寬度', 'len', 'variant', { css: 'width', opt: true }), P('h', '高度', 'len', 'variant', { css: 'height', opt: true }),
      ],
      values: {
        variant: {
          field: { bg: 'var(--card2)', fg: 'currentColor', bc: 'var(--line)', bw: '1px', radius: 'var(--r-ctl)', py: '10px', px: '12px', fs: '1em', gap: '10px' },
          'field-sm': { bg: 'var(--card2)', fg: 'currentColor', bc: 'var(--line)', bw: '1px', radius: 'var(--r-ctl)', py: '5px', px: '10px', fs: '12px', gap: '10px' },
          input: { bg: 'var(--card2)', fg: 'var(--text)', bc: 'var(--line2)', bw: '1px', radius: 'var(--r-ctl)', py: '10px', px: '12px', fs: '13px', gap: 'normal' },
          select: { bg: 'var(--card2)', fg: 'var(--text)', bc: 'var(--line2)', bw: '1px', radius: 'var(--r-ctl)', py: '8px', px: '12px', fs: '13px', gap: 'normal' },
        },
      },
      css: `
.fld,.inp,.sel{background:var(--field-bg);color:var(--field-fg);border:var(--field-bw) solid var(--field-bc);border-radius:var(--field-radius);padding:var(--field-py) var(--field-px);font-size:var(--field-fs);gap:var(--field-gap)}
.flt .fld.sm{--field-gap:6px;--field-fg:var(--text)}
#orderForm .fld{--field-gap:8px}
#orderForm .sel{--field-py:6px;--field-px:8px}`,
    },
    {
      id: 'toggle', name: 'Toggle', zh: '開關', p: 'tg', root: '.tg2', cat: 'Toggle', rcls: 'tg2',
      variants: [{ id: 'default', label: 'Default', cls: 'tg2', sel: '.tg2' }],
      sizes: [],
      props: [
        C('track', '軌道顏色（關）'), C('track-on', '軌道顏色（開）', { state: 'active' }), C('knob', '圓鈕顏色'), C('fg', '標籤文字'),
        P('w', '寬度', 'len', 'base'), P('h', '高度', 'len', 'base'), P('knob-size', '圓鈕尺寸', 'len', 'base'),
        P('radius', '軌道圓角', 'len', 'base'), P('fs', '標籤字級', 'len', 'base'), P('gap', '標籤間距', 'len', 'base'),
      ],
      values: {
        base: { w: '30px', h: '17px', 'knob-size': '13px', radius: '9px', fs: '12px', gap: '8px' },
        variant: { default: { track: 'var(--line2)', 'track-on': 'var(--up)', knob: '#ffffff', fg: 'var(--mute)' } },
      },
      css: `
.tg2{gap:var(--tg-gap);font-size:var(--tg-fs);color:var(--tg-fg)}
.tg2 i{width:var(--tg-w);height:var(--tg-h);border-radius:var(--tg-radius);background:var(--tg-track);position:relative}
.tg2 i:after{content:"";position:absolute;left:calc((var(--tg-h) - var(--tg-knob-size)) / 2);top:calc((var(--tg-h) - var(--tg-knob-size)) / 2);width:var(--tg-knob-size);height:var(--tg-knob-size);border-radius:50%;background:var(--tg-knob);transition:.2s}
.tg2.on i{background:var(--tg-track-on)}
.tg2.on i:after{left:calc(var(--tg-w) - var(--tg-knob-size) - (var(--tg-h) - var(--tg-knob-size)) / 2)}`,
    },
  ];

  /* Icons available in the prototype's SVG sprite (<symbol id="i-…">). */
  const ICONS = ['spark','trade','markets','users','vault','star','gift','more','search','bell','gear','help','left','down','send','plus','mic','menu','clock','shield','target','chat','trend','eye','check','x','sun','moon','mon','wallet','alert','headset','globe','expand'];

  /* ---------- helpers ---------- */
  const clone = o => JSON.parse(JSON.stringify(o));
  const isThemed = v => v && typeof v === 'object' && ('dark' in v || 'light' in v);
  const valFor = (v, theme) => isThemed(v) ? v[theme] : v;

  function defaultState() {
    return {
      version: 1,
      foundations: clone(FOUNDATIONS.map(g => ({ id: g.id, tokens: g.tokens.map(t => ({ name: t.name, value: t.value, dark: t.dark, light: t.light })) }))),
      components: Object.fromEntries(COMPONENTS.map(c => [c.id, clone(c.values)])),
      variantIcons: {},  // { 'button/primary/md': { left: 'spark'|null, right: … } }
      instances: {},     // { fingerprint: { vars:{}, left:…, right:…, label } }
      lib: defaultLib(), // component library: custom components / variants, names, deletions, generic rules
      placed: [],        // components dropped onto the page: [{ id, comp, variant, size, text, … anchor, pos }]
    };
  }
  function defaultLib() { return { names: {}, comps: [], vars: [], deleted: [], rules: {} }; }

  /* ---------- 2b. Component library (custom components & variants) ----------
   * Custom variant  { id:'u…', base:'button', owner:'button'|custom comp id, label, from, rcls }
   *   – values live in state.components[base].variant[id] (+ own size/base props in variantSize[id]),
   *     so tokens, bindings and the property panel work exactly like the built-in variants.
   *   – elements carry the base root class + `ds-v-{id}` (never the source variant's class).
   * Custom component { id:'c…', base:'button', name, zh } – a named group of custom variants;
   *   its elements also carry `ds-c-{id}` so they are identified as that component. */
  const lib = state => state.lib || defaultLib();
  const clsSel = cls => '.' + cls.trim().split(/\s+/).join('.');
  function customSel(v) { return clsSel(v.rcls) + '.ds-v-' + v.id; }
  function variantsOf(c, state) {
    const own = lib(state).vars.filter(v => v.base === c.id).map(v => ({ id: v.id, label: v.label, sel: customSel(v), cls: v.rcls + ' ds-v-' + v.id, custom: true, owner: v.owner }));
    return c.variants.concat(own);
  }
  /* Selector list the page runtime uses to recognise components (custom components first). */
  function matchFor(state) {
    const L = lib(state);
    const custom = L.comps.map(cc => {
      const base = COMPONENTS.find(c => c.id === cc.base);
      return { id: cc.id, base: cc.base, root: '.ds-c-' + cc.id, variants: L.vars.filter(v => v.owner === cc.id).map(v => ({ id: v.id, sel: customSel(v) })), sizes: (base.sizes || []).map(s => ({ id: s.id, sel: s.sel })) };
    });
    const builtin = COMPONENTS.map(c => ({ id: c.id, base: c.id, root: c.root, variants: variantsOf(c, state).filter(v => !v.custom || v.owner === c.id).map(v => ({ id: v.id, sel: v.sel })), sizes: (c.sizes || []).map(s => ({ id: s.id, sel: s.sel })) }));
    return custom.concat(builtin);
  }

  /* Other UI components found in the prototype that are not tokenised yet. They are listed in the
   * library with a live specimen, usage and editable style rules (emitted in section 5). */
  const GENERIC = [
    { id: 'optabs', name: 'Option Tabs', zh: '下單分段切換', cat: 'Tabs', sel: '.optabs', targets: [['.optabs', '容器'], ['.optabs span', '選項'], ['.optabs span.on', '選中選項']], note: '外觀與 Tabs 相同用途，但選中態用 outline、圓角 8px 寫死，沒有使用 Tabs token。' },
    { id: 'seg', name: 'Segmented', zh: '膠囊切換', cat: 'Tabs', sel: '.seg', targets: [['.seg', '容器'], ['.seg button', '選項'], ['.seg button.on', '選中選項']], note: '背景 #15171b、選中 #f2f3f5 為寫死色碼，不跟隨 Dark / Light 主題。' },
    { id: 'stabs', name: 'Underline Tabs', zh: '底線分頁', cat: 'Tabs', sel: '.stabs', targets: [['.stabs span', '選項'], ['.stabs span.on', '選中選項']], note: '與 .ttabs2、.mtabs 共三套底線分頁並存，內距、字重與選中樣式各不相同。' },
    { id: 'ttabs2', name: 'Trade Tabs', zh: '交易頁分頁', cat: 'Tabs', sel: '.ttabs2', targets: [['.ttabs2 span', '選項'], ['.ttabs2 span.on', '選中選項']] },
    { id: 'mtabs', name: 'Market Tabs', zh: '市場分頁', cat: 'Tabs', sel: '.mtabs', targets: [['.mtabs span', '選項'], ['.mtabs .on', '選中選項']] },
    { id: 'table', name: 'Table', zh: '資料表', cat: 'Table', sel: '.tbl', targets: [['.tbl th', '表頭'], ['.tbl td', '儲存格']] },
    { id: 'bar', name: 'Progress bar', zh: '進度條', cat: 'Progress', sel: '.bar', targets: [['.bar', '軌道']], note: '.bar、.cbt、.pc2-bar 三種進度條各自寫死高度與圓角。' },
    { id: 'pg', name: 'Pagination', zh: '分頁器', cat: 'Navigation', sel: '.pg', targets: [['.pg span', '頁碼'], ['.pg span.on', '目前頁']], note: '目前頁 .pg span.on 為白底白字（--violet 已被改為白色），原檔問題維持原樣。' },
    { id: 'dropdown', name: 'Dropdown', zh: '下拉選單', cat: 'Navigation', sel: '.sdd', targets: [['.sdd-btn', '按鈕'], ['.sdd-menu', '選單']], note: '與下單面板的 .otdd 為兩套不同的下拉選單實作。' },
    { id: 'modal', name: 'Popup', zh: '彈出視窗', cat: 'Overlay', sel: '.pop', targets: [['.pop', '視窗']], note: '另有 .mdl（下單確認、API Key）一套對話框結構，邊框與陰影不同。' },
    { id: 'toast', name: 'Toast', zh: '即時通知', cat: 'Overlay', sel: '.toast', targets: [['.toast', '通知']], note: '邊框寫死 #DBFD5C，未使用 --focus / --lime token。' },
    { id: 'search', name: 'Search', zh: '搜尋框', cat: 'Input / Select', sel: '.search', targets: [['.search', '搜尋框']], note: '與 Text input（.inp）用途相同，但邊框用 --line、.inp 用 --line2。' },
    { id: 'checkbox', name: 'Checkbox', zh: '勾選項', cat: 'Input / Select', sel: '.ck', targets: [['.ck', '勾選項'], ['.ck small', '說明文字']], note: 'accent-color 寫死 #DBFD5C。' },
    { id: 'badge2', name: 'Badge', zh: '小徽章', cat: 'Badge / Tag', sel: '.badge2', targets: [['.badge2', '徽章']] },
    { id: 'sev', name: 'Severity tag', zh: '嚴重度標籤', cat: 'Badge / Tag', sel: '.sev', targets: [['.sev', '標籤']], note: '.sev.high 註解寫橘色，實際顯示萊姆色（原檔問題維持原樣）。' },
    { id: 'pchip', name: 'Pattern chip', zh: '型態標籤', cat: 'Badge / Tag', sel: '.pchip', targets: [['.pchip', '標籤']] },
    { id: 'gchip', name: 'Grade chip', zh: '評級標籤', cat: 'Badge / Tag', sel: '.gchip', targets: [['.gchip', '標籤']], note: '字體寫死 Poppins，沒有使用 --font-sans。' },
    { id: 'avatar', name: 'Avatar', zh: '頭像', cat: 'Avatar', sel: '.avatar', targets: [['.avatar', '頭像']], note: '漸層背景定義了兩次，後者覆蓋前者。' },
    { id: 'coin', name: 'Coin icon', zh: '幣種圖示', cat: 'Avatar', sel: '.coin', targets: [['.coin', '圖示']] },
    { id: 'kv', name: 'Key-value row', zh: '數據列', cat: 'Data display', sel: '.kv', targets: [['.kv', '列']], note: '.kv 在不同區塊被定義 4 次（上下內距 9 / 5 / 3 / 2px）。' },
    { id: 'tip', name: 'Tip', zh: '提示框', cat: 'Data display', sel: '.tip', targets: [['.tip', '提示框']] },
    { id: 'steps', name: 'Steps', zh: '步驟清單', cat: 'Data display', sel: '.steps', targets: [['.steps', '清單']] },
    { id: 'chart', name: 'Chart', zh: '圖表', cat: 'Chart', sel: '.tvwrap,.rgchart,.gauges', targets: [['.tvwrap,.rgchart,.gauges', '圖表容器']], note: '圖表由 SVG / JS 繪製，這裡只能調整容器樣式。' },
  ];
  const G_PROPS = [
    ['width', '寬度', 'len'], ['min-height', '最小高度', 'len'], ['padding', '內距', 'text'], ['gap', '間距', 'len'],
    ['font-family', '字體', 'font'], ['font-size', '字級', 'len'], ['font-weight', '字重', 'weight'],
    ['color', '文字顏色', 'color'], ['background', '背景', 'color'], ['border-color', '邊框顏色', 'color'], ['border-width', '邊框粗細', 'len'],
    ['border-radius', '圓角', 'len'], ['box-shadow', '陰影', 'shadow'],
  ];

  /* Section 5: library rules — generic component styles, optional size props and deleted variants. */
  function libCSS(state) {
    const L = lib(state), out = [];
    const scoped = (sel, pre) => sel.split(',').map(s => pre + ' ' + s.trim()).join(',');
    Object.entries(L.rules || {}).forEach(([sel, props]) => {
      const both = [], dark = [], light = [];
      Object.entries(props).forEach(([p, v]) => {
        const add = (arr, val) => { if (val !== '' && val != null) { arr.push(`${p}:${val}`); if (p === 'border-width') arr.push('border-style:solid'); } };
        if (isThemed(v)) { if (v.dark === v.light) add(both, v.dark); else { add(dark, v.dark); add(light, v.light); } } else add(both, v);
      });
      if (both.length) out.push(`${scoped(sel, '.frame')}{${both.join(';')}}`);
      if (dark.length) out.push(`${scoped(sel, '.frame:not([data-theme=light])')}{${dark.join(';')}}`);
      if (light.length) out.push(`${scoped(sel, '.frame[data-theme=light]')}{${light.join(';')}}`);
    });
    (L.deleted || []).forEach(k => {
      const [cid, vid] = k.split('/'), c = COMPONENTS.find(x => x.id === cid); if (!c) return;
      const v = c.variants.find(x => x.id === vid); if (!v) return;
      out.push(`${v.sel.split(',').map(s => s.trim() + ':not([class*="ds-v-"])').join(',')}{display:none!important}`);
    });
    return out.length ? `\n/* ---------- 5. Component library ---------- */\n${out.join('\n')}\n` : '';
  }

  function tokenName(comp, scope, owner, key) { return `--${comp.p}-${scope === 'base' ? 'base' : owner}-${key}`; }

  /* Collect token declarations split by theme. */
  function collectTokens(state) {
    const root = [], both = [], dark = [], light = [];
    const push = (name, v, forceThemed) => {
      if (v === '' || v == null) return;
      if (isThemed(v)) {
        if (v.dark === v.light) both.push([name, v.dark]);
        else { if (v.dark !== '' && v.dark != null) dark.push([name, v.dark]); if (v.light !== '' && v.light != null) light.push([name, v.light]); }
      } else both.push([name, v]);
    };
    state.foundations.forEach(g => g.tokens.forEach(t => {
      const def = FOUNDATIONS.find(f => f.id === g.id).tokens.find(x => x.name === t.name);
      if (def && def.scope === 'root') root.push([t.name, t.value]);
      else if (t.value !== undefined) both.push([t.name, t.value]);
      else push(t.name, { dark: t.dark, light: t.light });
    }));
    const compDark = [], compLight = [], compBoth = [];
    COMPONENTS.forEach(c => {
      const v = state.components[c.id];
      const add = (name, val) => {
        if (val === '' || val == null) return;
        if (isThemed(val)) {
          if (val.dark === val.light) compBoth.push([name, val.dark]);
          else { if (val.dark) compDark.push([name, val.dark]); if (val.light) compLight.push([name, val.light]); }
        } else compBoth.push([name, val]);
      };
      Object.entries(v.base || {}).forEach(([k, val]) => add(tokenName(c, 'base', null, k), val));
      Object.entries(v.size || {}).forEach(([s, o]) => Object.entries(o).forEach(([k, val]) => add(tokenName(c, 'size', s, k), val)));
      Object.entries(v.variant || {}).forEach(([vid, o]) => Object.entries(o).forEach(([k, val]) => add(tokenName(c, 'variant', vid, k), val)));
      Object.entries(v.variantSize || {}).forEach(([vid, o]) => Object.entries(o.props).forEach(([k, val]) => add(`--${c.p}-${vid}-${k}`, val)));
    });
    return { root, both, dark, light, compBoth, compDark, compLight };
  }

  const decl = arr => arr.map(([n, v]) => `  ${n}:${v};`).join('\n');

  /* Bindings: map tokens → internal vars on each component element. */
  function bindingCSS(state) {
    const out = [];
    COMPONENTS.forEach(c => {
      const V = state.components[c.id];
      const vars = variantsOf(c, state);
      out.push(`/* ${c.name} */`);
      const baseKeys = Object.keys(V.base || {});
      if (baseKeys.length) out.push(`${c.root}{${baseKeys.map(k => `--${c.p}-${k}:var(${tokenName(c, 'base', null, k)})`).join(';')}}`);
      (c.sizes || []).forEach(s => {
        const keys = Object.keys((V.size || {})[s.id] || {});
        if (keys.length) out.push(`${s.sel}{${keys.map(k => `--${c.p}-${k}:var(${tokenName(c, 'size', s.id, k)})`).join(';')}}`);
      });
      vars.forEach(v => {
        const keys = Object.keys((V.variant || {})[v.id] || {});
        if (keys.length) out.push(`${v.sel}{${keys.map(k => `--${c.p}-${k}:var(${tokenName(c, 'variant', v.id, k)})`).join(';')}}`);
      });
      Object.entries(V.variantSize || {}).forEach(([vid, o]) => {
        const keys = Object.keys(o.props);
        if (keys.length) out.push(`${o.sel}{${keys.map(k => `--${c.p}-${k}:var(--${c.p}-${vid}-${k})`).join(';')}}`);
      });
      // optional props (width / height) only get a real declaration once a variant sets them
      c.props.filter(p => p.opt).forEach(p => vars.forEach(v => {
        const val = ((V.variant || {})[v.id] || {})[p.key];
        if (val !== '' && val != null && !(isThemed(val) && !val.dark && !val.light)) out.push(`${v.sel}{${p.css}:var(--${c.p}-${p.key})}`);
      }));
    });
    return out.join('\n');
  }

  /* Full design-system.css text for a given state. */
  function buildCSS(state) {
    const t = collectTokens(state);
    const scopeDark = '.frame,.frame #agw';
    const scopeLight = '.frame[data-theme=light],.frame[data-theme=light] #agw';
    return `/* ==========================================================
   DEXLESS Design System
   Generated by the Design System Editor — edit tokens there, or here by hand.
   1. Foundation tokens   2. Component tokens   3. Bindings   4. Components
   Component tokens are re-declared on #agw so they resolve against the
   Agent window's own palette, exactly like the original rules did.
   ========================================================== */

/* ---------- 1. Foundation tokens ---------- */
:root{
${decl(t.root)}
}
.frame{
${decl(t.both)}
${decl(t.dark)}
}
.frame[data-theme=light]{
${decl(t.light)}
}

/* ---------- 2. Component tokens ---------- */
${scopeDark}{
${decl(t.compBoth)}
${decl(t.compDark)}
}
${scopeLight}{
${decl(t.compLight)}
}

/* ---------- 3. Bindings (token → component variable) ---------- */
${bindingCSS(state)}

/* ---------- 4. Components ---------- */${COMPONENTS.map(c => `\n/* ${c.name} · ${c.zh} */${c.css}`).join('\n')}
${libCSS(state)}`;
  }

  /* Real CSS declarations an *instance* edit also writes inline (!important), so that
   * layout-specific rules cannot hide it. Colours that have hover / focus / state variants
   * stay variable-only (listed in comp.soft) so those states keep working. */
  function hardFor(comp, key) {
    const prop = comp.props.find(p => p.key === key);
    if (!prop || !prop.css || (comp.soft || []).includes(key)) return null;
    const v = k => 'var(--' + comp.p + '-' + k + ')';
    if (key === 'py' || key === 'px') return { padding: v('py') + ' ' + v('px') };
    if (key === 'size') return { width: v(key), height: v(key) };
    return { [prop.css]: v(key) };
  }

  root.DSCore = { hardFor, FOUNDATIONS, COMPONENTS, ICONS, GENERIC, G_PROPS, defaultState, defaultLib, buildCSS, tokenName, isThemed, valFor, clone, variantsOf, matchFor, customSel };
  if (typeof module !== 'undefined') module.exports = root.DSCore;
})(typeof window !== 'undefined' ? window : globalThis);
