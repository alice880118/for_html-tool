// Generates DESIGN-SYSTEM.md (component & token inventory) from src/ds-core.js
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { FOUNDATIONS, COMPONENTS, ICONS, tokenName } = require(path.join(ROOT, 'src', 'ds-core.js'));
const demo = fs.readFileSync(path.join(ROOT, 'src', 'dexless.html'), 'utf8');

const v = x => x === '' || x == null ? '—' : typeof x === 'object' ? (x.dark === x.light ? `\`${x.dark}\`` : `Dark \`${x.dark}\` · Light \`${x.light}\``) : `\`${x}\``;
const count = sel => sel.split(',').reduce((n, s) => {
  const cls = s.trim().replace(/^\./, '').split('.');
  const re = new RegExp(`class="(?=[^"]*\\b${cls.map(c => c.replace(/[-]/g, '\\-')).join('\\b)(?=[^"]*\\b')}\\b)[^"]*"`, 'g');
  return n + (demo.match(re) || []).length;
}, 0);

let md = `# DEXLESS Design System — 元件與設計設定清單

> 由 \`tools/docs.mjs\` 依 \`src/ds-core.js\` 自動產生。數值為原型整理後的**實際生效值**（原檔 30 多個樣式補丁層層覆寫後的最終結果）。
> 「原始碼出現次數」為靜態 HTML 與 JS 模板中的 class 出現次數，執行時由 JS 產生的實際數量以編輯器左側清單為準。

## 1. 設計設定（Foundation tokens）

色彩 token 依主題分開（\`.frame\` = Dark、\`.frame[data-theme=light]\` = Light）；字體 token 在 \`:root\`。

`;
FOUNDATIONS.forEach(g => {
  md += `### ${g.label}\n\n| Token | 用途 | 值 |\n|---|---|---|\n`;
  g.tokens.forEach(t => { md += `| \`${t.name}\` | ${t.label} | ${t.value !== undefined ? v(t.value) : v({ dark: t.dark, light: t.light })} |\n`; });
  md += '\n';
});
md += `### 觀察到但未 token 化的數值

- **字級**：9 / 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13（基準）/ 14 / 15 / 16 / 17 / 18 / 19 / 20 / 21 / 22 / 24 / 26 / 28 / 30 / 44 / 64 px — 散落在各版面規則中，未整理成階層，建議下一步收斂為 6–8 級。
- **間距**：常見 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 28 / 30 / 32 px；全站區塊間距已統一為 \`--space-grid\`（原本以 \`gap:8px!important\` 強制）。
- **硬寫色值**（刻意保留，屬插畫 / 圖表 / 品牌裝飾）：\`#9cf5e0\`、\`#76BAB2\`、\`#E3FF94\`、\`#CBBFFF\`（Trader Profile 導覽漸層）、\`#9aa7ff\` / \`#f7a33b\` / \`#2775ca\`（幣別色）、\`#06110f\`（Buy 按鈕文字）、Agent 視窗 \`#agw\` 的獨立色盤。

## 2. 元件

每個元件的樣式都讀取內部變數 \`--{前綴}-{屬性}\`，再由三層 token 綁定：

- **變體** \`--{前綴}-{變體}-{屬性}\`：例如 \`--btn-primary-bg\`
- **尺寸** \`--{前綴}-{尺寸}-{屬性}\`：例如 \`--btn-sm-py\`（不分變體）
- **元件共用** \`--{前綴}-base-{屬性}\`：例如 \`--btn-base-gap\`

「只改這個實例」會把同名內部變數寫在該元素的 inline style 上（尺寸與字級另外以 \`!important\` 寫入，避免被版面規則蓋掉），並由 \`ds-runtime.js\` 在重新渲染後自動套回。

`;
COMPONENTS.forEach(c => {
  const V = c.values;
  md += `### ${c.name}（${c.zh}）— \`${c.root}\`\n\n`;
  md += `| 變體 | 選取器 | 原始碼出現次數 |\n|---|---|---|\n`;
  c.variants.forEach(x => { md += `| ${x.label} | \`${x.sel}\` | ${count(x.sel)} |\n`; });
  if (c.sizes && c.sizes.length) { md += `\n尺寸：${c.sizes.map(s => `**${s.id}** \`${s.sel}\``).join('、')}\n`; }
  md += `\n| 屬性 | 層級 | ${c.variants.map(x => x.label).join(' | ')} |\n|---|---|${c.variants.map(() => '---').join('|')}|\n`;
  c.props.filter(p => p.scope === 'variant').forEach(p => {
    md += `| ${p.label}${p.state ? `（${p.state === 'hover' ? 'Hover' : '選中'}）` : ''} | 變體 | ${c.variants.map(x => v(((V.variant || {})[x.id] || {})[p.key])).join(' | ')} |\n`;
  });
  const others = c.props.filter(p => p.scope !== 'variant');
  if (others.length) {
    md += `\n| 屬性 | 層級 | Token | 值 |\n|---|---|---|---|\n`;
    others.forEach(p => {
      if (p.scope === 'base') md += `| ${p.label} | 元件共用 | \`${tokenName(c, 'base', null, p.key)}\` | ${v((V.base || {})[p.key])} |\n`;
      else (c.sizes || []).forEach(s => { md += `| ${p.label} | 尺寸 ${s.id} | \`${tokenName(c, 'size', s.id, p.key)}\` | ${v(((V.size || {})[s.id] || {})[p.key])} |\n`; });
    });
  }
  Object.entries(V.variantSize || {}).forEach(([vid, o]) => { md += `\n${o.label}（\`${o.sel}\`）：${Object.entries(o.props).map(([k, x]) => `\`--${c.p}-${vid}-${k}: ${x}\``).join('、')}\n`; });
  const ctx = (c.css.match(/\n\/\* contextual[^\n]*\n([\s\S]*)$/) || [])[1];
  if (ctx) md += `\n情境調整（保留原版面）：\n\n\`\`\`css\n${ctx.trim()}\n\`\`\`\n`;
  md += '\n**互動狀態**：' + ({
    button: 'default、hover（變體 hover token；Primary 另有 brightness(1.08)）、focus-visible（全站 focus 外框 `--focus`）、disabled（opacity .4）。',
    iconbutton: 'default、hover / `.on`（共用 hover token）。',
    pill: '無互動；Unstable 狀態下 JS 會把部分 up ↔ down 互換。',
    chip: '無互動；Unstable 狀態加上 `.down-chip`（原檔 `!important` 規則，保留）。',
    tabs: '選項 default / `.on`（選中）。',
    card: '無互動。',
    input: 'default、focus / focus-within（全站 focus 外框 `--focus`）、disabled、read-only。',
    toggle: '關 / `.on`（開），圓鈕 0.2s 滑動。',
  }[c.id] || '') + '\n\n';
});
md += `### 其他辨識到、但本次未開放編輯的 UI 元件

分段控制 \`.ttabs2\` / \`.optabs\` / \`.bs\` / \`.stabs\` / \`.seg\`、下拉 \`.sdd\` / \`.gmenu\` / \`.otmenu\`、訊號卡 \`.sgc2\`、通知 \`.pop\` / \`.toast\`、Agent 視窗 \`.agw\`、Dock \`.cdock\`、表格 \`.tbl\`、進度條 \`.bar\`、嚴重度標記 \`.sev\` / \`.pchip\`、幣別圓點 \`.coin\`、頭像 \`.avatar\`、光球 \`.orb\`。這些元件多半與特定版面綁定，已使用上面的 foundation token，但尚未抽成可編輯的元件規格。

## 3. Icon

Sprite \`<symbol id="i-…">\`，共 ${ICONS.length} 個：${ICONS.map(i => `\`${i}\``).join(' ')}
`;
fs.writeFileSync(path.join(ROOT, 'DESIGN-SYSTEM.md'), md);
console.log('DESIGN-SYSTEM.md', (md.length / 1024).toFixed(1) + ' KB');
