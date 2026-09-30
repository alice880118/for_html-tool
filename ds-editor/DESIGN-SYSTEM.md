# DEXLESS Design System — 元件與設計設定清單

> 由 `tools/docs.mjs` 依 `src/ds-core.js` 自動產生。數值為原型整理後的**實際生效值**（原檔 30 多個樣式補丁層層覆寫後的最終結果）。
> 「原始碼出現次數」為靜態 HTML 與 JS 模板中的 class 出現次數，執行時由 JS 產生的實際數量以編輯器左側清單為準。

## 1. 設計設定（Foundation tokens）

色彩 token 依主題分開（`.frame` = Dark、`.frame[data-theme=light]` = Light）；字體 token 在 `:root`。

### 顏色 · 表面

| Token | 用途 | 值 |
|---|---|---|
| `--bg` | 頁面背景 | Dark `#0b0c0e` · Light `#f4f4f5` |
| `--side` | 側欄 / 導覽背景 | Dark `#0f1013` · Light `#fafafa` |
| `--card` | 卡片 | Dark `#15171b` · Light `#ffffff` |
| `--card2` | 卡片（次層） | Dark `#1c1e23` · Light `#f4f4f6` |
| `--line` | 分隔線 | Dark `#24272d` · Light `#e8e8eb` |
| `--line2` | 分隔線（強） | Dark `#30333a` · Light `#dcdce0` |
| `--grid` | 圖表格線 | Dark `rgba(255,255,255,.05)` · Light `rgba(0,0,0,.05)` |

### 顏色 · 文字

| Token | 用途 | 值 |
|---|---|---|
| `--text` | 主要文字 | Dark `#f2f3f5` · Light `#111214` |
| `--mute` | 次要文字 | Dark `#a0a4ae` · Light `#6f737a` |
| `--dim` | 輔助文字 | Dark `#818792` · Light `#a3a6ac` |
| `--inv` | 反白底色 | Dark `#f2f3f5` · Light `#111214` |
| `--invtext` | 反白文字 | Dark `#0a0b0c` · Light `#ffffff` |
| `--gact` | 導覽選中文字 | Dark `#dbfd5c` · Light `#111214` |

### 顏色 · 品牌 / 強調

| Token | 用途 | 值 |
|---|---|---|
| `--brand` | 品牌色 | `#ffffff` |
| `--accent` | 強調色 | Dark `#ffffff` · Light `#111214` |
| `--violet` | 強調色（舊名 violet） | Dark `#ffffff` · Light `#111214` |
| `--vbg` | 強調底色 | Dark `rgba(255,255,255,.08)` · Light `rgba(17,18,20,.06)` |
| `--lime` | Lime | `#dbfd5c` |
| `--amber` | 提醒色（舊名 amber） | Dark `#DBFD5C` · Light `#536b0e` |
| `--abg` | 提醒底色 | Dark `rgba(219,253,92,.12)` · Light `rgba(111,140,21,.10)` |
| `--focus` | Focus 外框 | Dark `#DBFD5C` · Light `#6d861a` |
| `--brand-gradient` | 品牌漸層 | `linear-gradient(#fff,#fff)` |
| `--chart-secondary` | 圖表第二色 | Dark `#7dcfc3` · Light `#137c74` |

### 顏色 · 漲跌語意

| Token | 用途 | 值 |
|---|---|---|
| `--up` | 獲利 / 正向 | Dark `#46ccb9` · Light `#10a08a` |
| `--upbg` | 獲利底色 | Dark `rgba(70,204,185,.13)` · Light `rgba(16,160,138,.10)` |
| `--down` | 虧損 / 警示 | Dark `#ff41a3` · Light `#e02f8a` |
| `--downbg` | 虧損底色 | Dark `rgba(255,65,163,.13)` · Light `rgba(224,47,138,.09)` |

### 字體

| Token | 用途 | 值 |
|---|---|---|
| `--font-sans` | 內文字體 | `Poppins,"Noto Sans TC",sans-serif` |
| `--font-num` | 數字字體 | `Manrope,sans-serif` |
| `--font-mono` | 等寬字體 | `"JetBrains Mono",monospace` |

### 圓角

| Token | 用途 | 值 |
|---|---|---|
| `--r-card` | 卡片 | `16px` |
| `--r-in` | 內層區塊 | `12px` |
| `--r-ctl` | 控制項 | `10px` |
| `--r-sm` | 小型控制項 | `8px` |
| `--r-pill` | 膠囊 | `999px` |

### 間距 / 尺寸

| Token | 用途 | 值 |
|---|---|---|
| `--space-grid` | 卡片 / 區塊間距 | `8px` |
| `--control-h` | 控制項高度 | `40px` |

### 陰影

| Token | 用途 | 值 |
|---|---|---|
| `--shadow` | 卡片陰影 | Dark `none` · Light `0 1px 2px rgba(17,18,20,.04),0 10px 30px rgba(17,18,20,.05)` |
| `--shadow-menu` | 下拉選單 | `0 20px 40px rgba(0,0,0,.35)` |
| `--shadow-window` | 浮動視窗 | `0 30px 70px rgba(0,0,0,.45)` |

### 觀察到但未 token 化的數值

- **字級**：9 / 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13（基準）/ 14 / 15 / 16 / 17 / 18 / 19 / 20 / 21 / 22 / 24 / 26 / 28 / 30 / 44 / 64 px — 散落在各版面規則中，未整理成階層，建議下一步收斂為 6–8 級。
- **間距**：常見 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 28 / 30 / 32 px；全站區塊間距已統一為 `--space-grid`（原本以 `gap:8px!important` 強制）。
- **硬寫色值**（刻意保留，屬插畫 / 圖表 / 品牌裝飾）：`#9cf5e0`、`#76BAB2`、`#E3FF94`、`#CBBFFF`（Trader Profile 導覽漸層）、`#9aa7ff` / `#f7a33b` / `#2775ca`（幣別色）、`#06110f`（Buy 按鈕文字）、Agent 視窗 `#agw` 的獨立色盤。

## 2. 元件

每個元件的樣式都讀取內部變數 `--{前綴}-{屬性}`，再由三層 token 綁定：

- **變體** `--{前綴}-{變體}-{屬性}`：例如 `--btn-primary-bg`
- **尺寸** `--{前綴}-{尺寸}-{屬性}`：例如 `--btn-sm-py`（不分變體）
- **元件共用** `--{前綴}-base-{屬性}`：例如 `--btn-base-gap`

「只改這個實例」會把同名內部變數寫在該元素的 inline style 上（尺寸與字級另外以 `!important` 寫入，避免被版面規則蓋掉），並由 `ds-runtime.js` 在重新渲染後自動套回。

### Button（按鈕）— `.btn`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Primary | `.btn.inv,.btn.lime,.btn.grad` | 29 |
| Ghost | `.btn.ghost` | 49 |
| Text | `.btn.txt` | 3 |
| Buy（下單） | `.btn.buy` | 1 |

尺寸：**md** `.btn`、**sm** `.btn.sm`

| 屬性 | 層級 | Primary | Ghost | Text | Buy（下單） |
|---|---|---|---|---|---|
| 背景 | 變體 | `#ffffff` | `var(--card)` | `transparent` | `var(--up)` |
| 文字顏色 | 變體 | `#0a0b0c` | `var(--text)` | `var(--mute)` | `#06110f` |
| 邊框顏色 | 變體 | `currentColor` | `var(--line2)` | `currentColor` | `currentColor` |
| 邊框粗細 | 變體 | `0px` | `1px` | `0px` | `0px` |
| 陰影 | 變體 | Dark `none` · Light `inset 0 0 0 1px #c9ccd2` | `none` | `none` | `none` |
| 字體 | 變體 | `var(--font-sans)` | `var(--font-sans)` | `var(--font-sans)` | `var(--font-sans)` |
| 字重 | 變體 | `600` | `600` | `600` | `600` |
| Hover 背景（Hover） | 變體 | — | `var(--card2)` | `var(--card2)` | — |
| Hover 文字（Hover） | 變體 | — | — | `var(--text)` | — |
| Hover 邊框（Hover） | 變體 | — | `var(--mute)` | — | — |
| 寬度 | 變體 | — | — | — | — |

| 屬性 | 層級 | Token | 值 |
|---|---|---|---|
| 最小高度 | 尺寸 md | `--btn-md-h` | `var(--control-h)` |
| 最小高度 | 尺寸 sm | `--btn-sm-h` | `32px` |
| 上下內距 | 尺寸 md | `--btn-md-py` | `10px` |
| 上下內距 | 尺寸 sm | `--btn-sm-py` | `7px` |
| 左右內距 | 尺寸 md | `--btn-md-px` | `18px` |
| 左右內距 | 尺寸 sm | `--btn-sm-px` | `12px` |
| 字級 | 尺寸 md | `--btn-md-fs` | `13px` |
| 字級 | 尺寸 sm | `--btn-sm-fs` | `12px` |
| 圓角 | 尺寸 md | `--btn-md-radius` | `var(--r-ctl)` |
| 圓角 | 尺寸 sm | `--btn-sm-radius` | `var(--r-sm)` |
| Icon 與文字間距 | 元件共用 | `--btn-base-gap` | `8px` |
| Icon 尺寸 | 元件共用 | `--btn-base-icon` | `16px` |

Text（md）左右內距（`.btn.txt:not(.sm)`）：`--btn-text-px: 8px`

Buy 專屬尺寸（`.btn.buy`）：`--btn-buy-py: 13px`、`--btn-buy-px: 13px`、`--btn-buy-radius: 12px`

情境調整（保留原版面）：

```css
.sgc2 .btn{--btn-py:10px;--btn-px:12px;--btn-fs:12px;--btn-h:38px}
.sgc2 .btn.ghost{--btn-bg:transparent}
.behavior-actions .btn{--btn-fs:12px;--btn-py:9px;--btn-px:12px}
```

**互動狀態**：default、hover（變體 hover token；Primary 另有 brightness(1.08)）、focus-visible（全站 focus 外框 `--focus`）、disabled（opacity .4）。

### Icon Button（圖示按鈕）— `.agb`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Default | `.agb` | 13 |

| 屬性 | 層級 | Default |
|---|---|---|
| 背景 | 變體 | `var(--card)` |
| Icon 顏色 | 變體 | `var(--mute)` |
| 邊框顏色 | 變體 | `var(--line)` |
| 邊框粗細 | 變體 | `1px` |
| 陰影 | 變體 | `none` |
| Hover / 選中背景（Hover） | 變體 | `var(--card2)` |
| Hover / 選中 Icon（Hover） | 變體 | `var(--text)` |

| 屬性 | 層級 | Token | 值 |
|---|---|---|---|
| 尺寸（寬高） | 元件共用 | `--ib-base-size` | `30px` |
| 圓角 | 元件共用 | `--ib-base-radius` | `var(--r-sm)` |
| Icon 尺寸 | 元件共用 | `--ib-base-icon` | `16px` |

**互動狀態**：default、hover / `.on`（共用 hover token）。

### Pill（狀態標籤）— `.pill`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Up（正向） | `.pill.up` | 18 |
| Down（警示） | `.pill.down` | 10 |
| Accent（v） | `.pill.v` | 3 |
| Amber（a） | `.pill.a` | 5 |
| Neutral（n） | `.pill.n` | 12 |

| 屬性 | 層級 | Up（正向） | Down（警示） | Accent（v） | Amber（a） | Neutral（n） |
|---|---|---|---|---|---|---|
| 背景 | 變體 | `var(--upbg)` | `var(--downbg)` | `var(--vbg)` | `var(--abg)` | `var(--card2)` |
| 文字顏色 | 變體 | `var(--up)` | `var(--down)` | `var(--violet)` | `var(--amber)` | `var(--mute)` |
| 邊框顏色 | 變體 | `currentColor` | `currentColor` | `currentColor` | `currentColor` | `var(--line)` |
| 邊框粗細 | 變體 | `0px` | `0px` | `0px` | `0px` | `1px` |
| 寬度 | 變體 | — | — | — | — | — |
| 高度 | 變體 | — | — | — | — | — |

| 屬性 | 層級 | Token | 值 |
|---|---|---|---|
| 上下內距 | 元件共用 | `--pill-base-py` | `3px` |
| 左右內距 | 元件共用 | `--pill-base-px` | `9px` |
| 字級 | 元件共用 | `--pill-base-fs` | `11px` |
| 字重 | 元件共用 | `--pill-base-fw` | `600` |
| 圓角 | 元件共用 | `--pill-base-radius` | `var(--r-pill)` |
| 間距 | 元件共用 | `--pill-base-gap` | `5px` |

**互動狀態**：無互動；Unstable 狀態下 JS 會把部分 up ↔ down 互換。

### Chip（標記）— `.chip2`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Default | `.chip2` | 7 |
| Up | `.chip2.up` | 3 |
| Amber | `.chip2.a` | 1 |

| 屬性 | 層級 | Default | Up | Amber |
|---|---|---|---|---|
| 背景 | 變體 | `transparent` | `var(--upbg)` | `var(--abg)` |
| 文字顏色 | 變體 | `var(--text)` | `var(--up)` | `var(--amber)` |
| 邊框顏色 | 變體 | `var(--line2)` | `transparent` | `transparent` |
| 邊框粗細 | 變體 | `1px` | `1px` | `1px` |
| 寬度 | 變體 | — | — | — |
| 高度 | 變體 | — | — | — |

| 屬性 | 層級 | Token | 值 |
|---|---|---|---|
| 上下內距 | 元件共用 | `--chip-base-py` | `4px` |
| 左右內距 | 元件共用 | `--chip-base-px` | `11px` |
| 字級 | 元件共用 | `--chip-base-fs` | `12px` |
| 圓角 | 元件共用 | `--chip-base-radius` | `var(--r-pill)` |

**互動狀態**：無互動；Unstable 狀態加上 `.down-chip`（原檔 `!important` 規則，保留）。

### Tabs（分段切換）— `.tabs`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Default | `.tabs` | 10 |

尺寸：**md** `.tabs`、**sm** `.tabs.sm`

| 屬性 | 層級 | Default |
|---|---|---|
| 容器背景 | 變體 | `var(--card2)` |
| 容器邊框 | 變體 | `var(--line)` |
| 容器邊框粗細 | 變體 | `1px` |
| 容器圓角 | 變體 | `var(--r-ctl)` |
| 容器內距 | 變體 | `4px` |
| 選項間距 | 變體 | `2px` |
| 選項文字 | 變體 | `var(--mute)` |
| 選項圓角 | 變體 | `var(--r-sm)` |
| 選中背景（選中） | 變體 | Dark `#2a2d33` · Light `var(--card)` |
| 選中文字（選中） | 變體 | `var(--text)` |
| 選中字重（選中） | 變體 | `500` |
| 選中陰影（選中） | 變體 | `var(--shadow)` |
| 寬度 | 變體 | — |

| 屬性 | 層級 | Token | 值 |
|---|---|---|---|
| 選項上下內距 | 尺寸 md | `--tabs-md-item-py` | `7px` |
| 選項上下內距 | 尺寸 sm | `--tabs-sm-item-py` | `5px` |
| 選項左右內距 | 尺寸 md | `--tabs-md-item-px` | `18px` |
| 選項左右內距 | 尺寸 sm | `--tabs-sm-item-px` | `12px` |
| 選項字級 | 尺寸 md | `--tabs-md-item-fs` | `1em` |
| 選項字級 | 尺寸 sm | `--tabs-sm-item-fs` | `12px` |

**互動狀態**：選項 default / `.on`（選中）。

### Card（卡片）— `.card,.sub-card`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Card | `.card` | 88 |
| Sub card | `.sub-card` | 6 |

| 屬性 | 層級 | Card | Sub card |
|---|---|---|---|
| 背景 | 變體 | `var(--card)` | `var(--card2)` |
| 邊框顏色 | 變體 | `var(--line)` | `var(--line)` |
| 邊框粗細 | 變體 | `1px` | `1px` |
| 圓角 | 變體 | `var(--r-card)` | `var(--r-in)` |
| 內距 | 變體 | `20px` | `16px` |
| 陰影 | 變體 | `var(--shadow)` | `none` |
| 寬度 | 變體 | — | — |
| 最小高度 | 變體 | — | — |

**互動狀態**：無互動。

### Input（輸入欄位）— `.fld,.inp,.sel`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Field | `.fld` | 16 |
| Field · sm | `.fld.sm` | 8 |
| Text input | `.inp` | 1 |
| Select | `.sel` | 2 |

| 屬性 | 層級 | Field | Field · sm | Text input | Select |
|---|---|---|---|---|---|
| 背景 | 變體 | `var(--card2)` | `var(--card2)` | `var(--card2)` | `var(--card2)` |
| 文字顏色 | 變體 | `currentColor` | `currentColor` | `var(--text)` | `var(--text)` |
| 邊框顏色 | 變體 | `var(--line)` | `var(--line)` | `var(--line2)` | `var(--line2)` |
| 邊框粗細 | 變體 | `1px` | `1px` | `1px` | `1px` |
| 圓角 | 變體 | `var(--r-ctl)` | `var(--r-ctl)` | `var(--r-ctl)` | `var(--r-ctl)` |
| 上下內距 | 變體 | `10px` | `5px` | `10px` | `8px` |
| 左右內距 | 變體 | `12px` | `10px` | `12px` | `12px` |
| 字級 | 變體 | `1em` | `12px` | `13px` | `13px` |
| 內容間距 | 變體 | `10px` | `10px` | `normal` | `normal` |
| 寬度 | 變體 | — | — | — | — |
| 高度 | 變體 | — | — | — | — |

**互動狀態**：default、focus / focus-within（全站 focus 外框 `--focus`）、disabled、read-only。

### Toggle（開關）— `.tg2`

| 變體 | 選取器 | 原始碼出現次數 |
|---|---|---|
| Default | `.tg2` | 3 |

| 屬性 | 層級 | Default |
|---|---|---|
| 軌道顏色（關） | 變體 | `var(--line2)` |
| 軌道顏色（開）（選中） | 變體 | `var(--up)` |
| 圓鈕顏色 | 變體 | `#ffffff` |
| 標籤文字 | 變體 | `var(--mute)` |

| 屬性 | 層級 | Token | 值 |
|---|---|---|---|
| 寬度 | 元件共用 | `--tg-base-w` | `30px` |
| 高度 | 元件共用 | `--tg-base-h` | `17px` |
| 圓鈕尺寸 | 元件共用 | `--tg-base-knob-size` | `13px` |
| 軌道圓角 | 元件共用 | `--tg-base-radius` | `9px` |
| 標籤字級 | 元件共用 | `--tg-base-fs` | `12px` |
| 標籤間距 | 元件共用 | `--tg-base-gap` | `8px` |

**互動狀態**：關 / `.on`（開），圓鈕 0.2s 滑動。

### 其他辨識到、但本次未開放編輯的 UI 元件

分段控制 `.ttabs2` / `.optabs` / `.bs` / `.stabs` / `.seg`、下拉 `.sdd` / `.gmenu` / `.otmenu`、訊號卡 `.sgc2`、通知 `.pop` / `.toast`、Agent 視窗 `.agw`、Dock `.cdock`、表格 `.tbl`、進度條 `.bar`、嚴重度標記 `.sev` / `.pchip`、幣別圓點 `.coin`、頭像 `.avatar`、光球 `.orb`。這些元件多半與特定版面綁定，已使用上面的 foundation token，但尚未抽成可編輯的元件規格。

## 3. Icon

Sprite `<symbol id="i-…">`，共 34 個：`spark` `trade` `markets` `users` `vault` `star` `gift` `more` `search` `bell` `gear` `help` `left` `down` `send` `plus` `mic` `menu` `clock` `shield` `target` `chat` `trend` `eye` `check` `x` `sun` `moon` `mon` `wallet` `alert` `headset` `globe` `expand`
