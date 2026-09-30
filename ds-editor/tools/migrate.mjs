// One-time migration: original prototype → prototype + design-system.css
// Removes the scattered token definitions and component styles that design-system.css now owns.
// Every replacement must match exactly once, otherwise the script aborts.
// Usage: node tools/migrate.mjs <original.html> <out: src/dexless.html>
import fs from 'fs';

const [, , IN, OUT] = process.argv;
let html = fs.readFileSync(IN, 'utf8').replace(/\r\n/g, '\n');

const R = [
  // ---- tokens: now in design-system.css (section 1) ----
  ['theme tokens (dark+light)', /\.frame\{width:1440px;transform-origin:0 0;font-size:13px;\n[\s\S]*?background:var\(--bg\);color:var\(--text\)\}\n\.frame\[data-theme=light\]\{\n[\s\S]*?--grid:rgba\(0,0,0,\.05\)\}\n/,
    '.frame{width:1440px;transform-origin:0 0;font-size:13px;background:var(--bg);color:var(--text)} /* tokens → design-system.css */\n'],
  ['--gact', '.frame{--gact:#dbfd5c}.frame[data-theme=light]{--gact:#111214}\n', ''],
  ['radius tokens', '.frame{--r-card:16px;--r-in:12px;--r-ctl:10px}\n', ''],
  ['brand-gradient v1', '.frame{--brand-gradient:linear-gradient(90deg,#DBFD5C 0%,#76BAB2 65%,#E3FF94 98%)}\n', ''],
  ['r-sm/focus/control-h', '.frame{--r-sm:8px;--focus:var(--violet);--control-h:40px}\n', ''],
  ['dark mute/dim', '.frame:not([data-theme=light]){--mute:#a0a4ae;--dim:#818792}\n', ''],
  ['lime palette', /\.frame\{--brand:#DBFD5C;[^\n]*\n\.frame\[data-theme=light\]\{--accent:#536b0e;[^\n]*\n/, ''],
  ['temp white brand', /\.frame,\.frame\[data-theme=light\]\{--brand:#fff;[^\n]*\n\.frame\[data-theme=light\]\{--accent:#111214;[^\n]*\n/, ''],
  ['v27 amber/focus', /\.frame\{--amber:#DBFD5C;[^\n]*\n\.frame\[data-theme=light\]\{--amber:#536b0e;[^\n]*\n/, ''],

  // ---- fonts → tokens ----
  ['body font', 'font-family:Poppins,"Noto Sans TC",sans-serif;-webkit', 'font-family:var(--font-sans);-webkit'],
  ['Manrope (all)', /font-family:Manrope,sans-serif/g, 'font-family:var(--font-num)', 'many'],
  ['Manrope bare', 'font-family:Manrope;font-size:16px', 'font-family:var(--font-num);font-size:16px'],
  ['JetBrains (all)', /font-family:"JetBrains Mono",monospace/g, 'font-family:var(--font-mono)', 'many'],

  // ---- spacing / shadow tokens ----
  ['grid gap', 'c-cards{gap:8px!important}\n.body,.gwrap{gap:8px!important}', 'c-cards{gap:var(--space-grid)!important}\n.body,.gwrap{gap:var(--space-grid)!important}'],
  ['menu shadow', /box-shadow:0 20px 40px rgba\(0,0,0,\.35\)/g, 'box-shadow:var(--shadow-menu)', 'many'],
  ['window shadow', /box-shadow:0 30px 70px rgba\(0,0,0,\.45\)/g, 'box-shadow:var(--shadow-window)', 'many'],

  // ---- Button ----
  ['btn base v1', /\.btn\{border:0;border-radius:10px;[^\n]*\n\.btn\.inv\{[^\n]*\n\.btn\.lime\{[^\n]*\n\.btn\.grad\{[^\n]*\n\.btn\.ghost\{[^\n]*\n\.btn\.txt\{[^\n]*\n\.btn\.sm\{[^\n]*\n/, ''],
  ['btn buy', '.btn.buy{width:100%;justify-content:center;background:var(--up);color:#06110f;padding:13px;margin-top:10px;border-radius:12px}', '.btn.buy{width:100%;justify-content:center;margin-top:10px}'],
  ['btn radius v7', '.btn{border-radius:var(--r-ctl)}.btn.sm{border-radius:8px}\n', ''],
  ['btn v18 gradient', /\/\* ===== v18 primary CTA = wallet gradient ===== \*\/\n\.btn\.inv,[^\n]*\n\.btn\.inv \.ico[^\n]*\n\.btn\.inv:hover[^\n]*\n/, '/* ===== v18 ===== */\n'],
  ['btn brand-gradient', '.btn.inv,.btn.lime,.btn.grad{background:var(--brand-gradient)!important}\n', ''],
  ['sgc2 btn', /\.sgc2 \.btn\{padding:10px 12px;[^\n]*\n\.sgc2 \.btn\.ghost\{[^\n]*\n\.sgc2 \.btn\.ghost:hover\{[^\n]*\n/, ''],
  ['btn radius group', '.btn,.sel,.inp,.fld,.tb{border-radius:var(--r-ctl)}', '.tb{border-radius:var(--r-ctl)}'],
  ['btn v-review', /\.btn\{min-height:var\(--control-h\);[^\n]*\n\.btn\.sm\{min-height:32px;[^\n]*\n\.btn\.ghost:hover:not\(:disabled\)\{[^\n]*\n\.btn\.txt:hover:not\(:disabled\)\{[^\n]*\n/, ''],
  ['btn lime-led', '.btn.inv,.btn.lime,.btn.grad,.gw{background:var(--brand-gradient)!important;color:#172006!important;text-shadow:none!important}\n.btn.inv .ico,.btn.lime .ico,.btn.grad .ico{color:currentColor}\n',
    '.gw{background:var(--brand-gradient)!important;color:#172006!important;text-shadow:none!important}\n'],
  ['behavior-actions btn', '.behavior-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.behavior-actions .btn{font-size:12px;padding:9px 12px}', '.behavior-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}'],
  ['btn v23 white', /\.btn\.inv,\.btn\.lime,\.btn\.grad,\.gw\{background:#fff!important;[^\n]*\n\.btn\.inv \.ico,[^\n]*\n\.frame\[data-theme=light\] \.btn\.inv,[^\n]*\n/,
    '.gw{background:#fff!important;color:#0a0b0c!important;text-shadow:none!important}\n.gw .ico{color:#0a0b0c!important}\n.frame[data-theme=light] .gw{box-shadow:inset 0 0 0 1px #c9ccd2!important}\n'],

  // ---- Pill / Chip ----
  ['pill', /\.pill\{display:inline-flex;[^\n]*\n\.pill\.up\{[^\n]*\n\.pill\.v\{[^\n]*\n\.pill\.n\{[^\n]*\n/, ''],
  ['chip2', /\.chip2\{display:inline-flex;[^\n]*\n\.chip2\.up\{[^\n]*\n\.chip2\.a\{[^\n]*\n/, ''],

  // ---- Tabs ----
  ['tabs v1', /\.tabs\{display:inline-flex;[^\n]*\n\.tabs span\{[^\n]*\n\.tabs span\.on\{[^\n]*\n\.frame:not\(\[data-theme=light\]\) \.tabs span\.on\{[^\n]*\n/, ''],
  ['tabs sm', '.tabs.sm span{padding:5px 12px;font-size:12px}\n', ''],
  ['ctl radius group', '.fld,.search,.ask,.tabs,.season-sw,.bs{border-radius:var(--r-ctl)}\n.tabs span,.season-sw button,.bs span{border-radius:8px}', '.search,.ask,.season-sw,.bs{border-radius:var(--r-ctl)}\n.season-sw button,.bs span{border-radius:8px}'],

  // ---- Card ----
  ['card', '.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:var(--shadow)}\n', ''],
  ['mini card', '.mini .card{padding:14px 16px;border-radius:14px}', '.mini .card{padding:14px 16px}'],
  ['kp', '.kp{padding:16px 18px;border-radius:16px}', '.kp{padding:16px 18px}'],
  ['sub-card', '.sub-card{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:16px}\n', ''],
  ['tr card', '.tr .card{padding:14px;border-radius:14px}', '.tr .card{padding:14px}'],
  ['mk-stats card', '.mk-stats .card{padding:14px 18px;border-radius:14px}', '.mk-stats .card{padding:14px 18px}'],
  ['card radius group', /\.card,\.kp,\.mini \.card,\.mk-stats \.card,\.tr \.card,\.chat,\.col\{border-radius:var\(--r-card\)\}/g, '.chat,.col{border-radius:var(--r-card)}', 2],
  ['r-in group', '.sub-card,.an-t,.swbox', '.an-t,.swbox'],

  // ---- Input ----
  ['fld', '.fld{display:flex;align-items:center;gap:10px;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:8px}', '.fld{display:flex;align-items:center;margin-top:8px}'],
  ['fld sm', '.fld.sm{padding:5px 10px;margin:0;font-size:12px;display:inline-flex}', '.fld.sm{margin:0;display:inline-flex}'],
  ['flt fld', '.flt .fld.sm{gap:6px;color:var(--text)}\n', ''],
  ['orderForm fld', '#orderForm .fld{gap:8px}', ''],
  ['orderForm sel', '#orderForm .sel{padding:6px 8px}', ''],
  ['sel', '.sel{background:var(--card2);color:var(--text);border:1px solid var(--line2);border-radius:var(--r-ctl);padding:8px 12px;font-family:inherit;font-size:13px}', '.sel{font-family:inherit}'],
  ['inp', '.inp{width:100%;margin-top:6px;background:var(--card2);border:1px solid var(--line2);border-radius:var(--r-ctl);padding:10px 12px;color:var(--text);font-family:inherit;font-size:13px;outline:none}', '.inp{width:100%;margin-top:6px;font-family:inherit;outline:none}'],

  // ---- Toggle ----
  ['tg2', /\.tg2\{display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;color:var\(--mute\)\}\n\.tg2 i\{[^\n]*\n\.tg2 i:after\{[^\n]*\n\.tg2\.on i\{[^\n]*\n/, '.tg2{display:flex;align-items:center;cursor:pointer}\n'],

  // ---- Icon button ----
  ['agb', '.agb{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--mute);display:grid;place-items:center;cursor:pointer}\n.agb:hover,.agb.on{color:var(--text);background:var(--card2)}',
    '.agb{display:grid;place-items:center;cursor:pointer}'],
  ['dock agb', '.dock-head .agb{width:26px;height:26px}', ''],

  // ---- hook up design-system.css (after all legacy blocks so its tokens win ties) ----
  ['link css', '</head>', '<link rel="stylesheet" href="design-system.css" id="ds-css">\n</head>'],
];

const log = [];
for (const [name, find, rep, expect] of R) {
  let count;
  if (find instanceof RegExp) {
    const re = find.global ? find : new RegExp(find.source, find.flags);
    count = (html.match(new RegExp(re.source, 'g')) || []).length;
    html = html.replace(re, rep);
  } else {
    count = html.split(find).length - 1;
    html = html.split(find).join(rep);
  }
  const ok = expect === 'many' ? count >= 1 : count === (expect || 1);
  log.push(`${ok ? 'ok ' : 'ERR'} ${String(count).padStart(2)}× ${name}`);
  if (!ok) { console.log(log.join('\n')); throw new Error('replacement failed: ' + name); }
}
html = html.replace('<title>DEXLESS · Prototype v40</title>', '<title>DEXLESS · Prototype v40 (Design System)</title>');
fs.writeFileSync(OUT, html);
console.log(log.join('\n'));
