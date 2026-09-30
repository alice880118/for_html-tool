// Builds the deliverables from src/:
//   editor.html                – the Design System editor (self-contained, open directly)
//   dexless.html               – the prototype, linked to design-system.css
//   design-system.css          – tokens + component styles (default values)
//   dexless.standalone.html    – the prototype with the CSS inlined (single file)
// Usage: node tools/build.mjs
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = p => path.join(ROOT, 'src', p);
const require = createRequire(import.meta.url);
const DSCore = require(SRC('ds-core.js'));

const demo = fs.readFileSync(SRC('dexless.html'), 'utf8');
const runtime = fs.readFileSync(SRC('ds-runtime.js'), 'utf8');
const core = fs.readFileSync(SRC('ds-core.js'), 'utf8');
const editor = fs.readFileSync(SRC('editor.js'), 'utf8');
const tpl = fs.readFileSync(SRC('editor.template.html'), 'utf8');

const state = DSCore.defaultState();
const css = DSCore.buildCSS(state);
const match = DSCore.matchFor(state);
const LINK = '<link rel="stylesheet" href="design-system.css" id="ds-css">';
if (!demo.includes(LINK) || demo.split('</body>').length !== 2) throw new Error('src/dexless.html: expected one stylesheet link and one </body>');

const inlineJS = s => s.replace(/<\/script/gi, '<\\/script');
const jsonStr = s => JSON.stringify(s).replace(/</g, '\\u003c');

function compose(inlineCSS) {
  let html = demo;
  if (inlineCSS) html = html.replace(LINK, () => `<style id="ds-css">\n${css}</style>`);
  const tail = `<script id="ds-overrides" type="application/json">{"variantIcons":{},"instances":{},"placed":[]}</script>\n<script>window.DS_MATCH=${JSON.stringify(match)};</script>\n<script>\n${inlineJS(runtime)}\n</script>\n</body>`;
  return html.replace('</body>', () => tail);
}

const editorHTML = tpl
  .replace('<script>/*DS_CORE*/</script>', () => `<script>\n${inlineJS(core)}\n</script>`)
  .replace('<script>/*DS_DATA*/</script>', () => `<script>\nwindow.DS_DEMO_HTML=${jsonStr(demo)};\nwindow.DS_RUNTIME_SRC=${jsonStr(inlineJS(runtime))};\n</script>`)
  .replace('<script>/*DS_EDITOR*/</script>', () => `<script>\n${inlineJS(editor)}\n</script>`);

const out = {
  'editor.html': editorHTML,
  'design-system.css': css,
  'dexless.html': compose(false),
  'dexless.standalone.html': compose(true),
};
for (const [name, text] of Object.entries(out)) {
  fs.writeFileSync(path.join(ROOT, name), text);
  console.log(name.padEnd(26), (text.length / 1024).toFixed(1) + ' KB');
}
