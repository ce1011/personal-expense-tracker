# 個人收支追蹤 Mobile-First UI/UX Redesign Spec

> 版本：v1.0
> 日期：2026-07-04
> 目標：以 mobile-first 原則重新設計整個應用程式的視覺與資訊架構，保留所有現有功能與資料流。

---

## 1. 設計原則

### 1.1 Mobile-first
- 所有畫面優先為 320px–428px 手機螢幕設計，再向外擴展到平板與桌面。
- 互動元素最小觸控目標 44px × 44px（建議 48px × 48px）。
- 表單輸入區使用大號輸入框，避免密集輸入。

### 1.2 觸控優先
- 底部 Tab Bar 為主要導航，取代側邊欄與水平滾動導航。
- 次級操作以 bottom sheet、modal 或頁內折疊區呈現，不佔用常駐空間。
- 列表項目支援 swipe 手勢（可選實作）：右滑編輯、左滑刪除。

### 1.3 視覺層級
- 使用卡片式排版，每張卡片只承載一個主題。
- 金額與狀態使用顏色與字重強調，避免過多裝飾線條。
- 標題區固定為： eyebrow（小字標籤） + H1 + 說明，統一資訊節奏。

### 1.4 密度與留白
- 手機內容區左右內距 `px-4`（16px），區塊間距 `gap-4`（16px）。
- 桌面可放寬到 `px-6`/`px-8` 與 `gap-6`（24px）。
- 避免在同一畫面擠入超過 4 個 KPI 卡片。

---

## 2. 視覺系統

### 2.1 色彩

```
Primary:    #0d7a68  (emerald-700)
Primary-2:  #0a5c4e  (emerald-800)
Accent:     #f4f1ea  (warm paper)
Surface:    #ffffff
Background: #f4f1ea
Text:       #1c1917  (stone-900)
Text-2:     #57534e  (stone-600)
Text-3:     #a8a29e  (stone-400)
Border:     #e7e5e4  (stone-200)
Success:    #0d7a68
Warning:    #d97706  (amber-600)
Danger:     #dc2626  (red-600)
Info:       #2563eb  (blue-600)
```

Tailwind v4 建議在 `main.css` 以 `@theme` 註冊自訂色票，避免依賴預設 `stone-*` 名稱：

```css
@theme {
  --color-primary: #0d7a68;
  --color-primary-2: #0a5c4e;
  --color-accent: #f4f1ea;
  --color-surface: #ffffff;
  --color-bg: #f4f1ea;
  --color-text: #1c1917;
  --color-text-2: #57534e;
  --color-text-3: #a8a29e;
  --color-border: #e7e5e4;
  --color-success: #0d7a68;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-info: #2563eb;
}
```

深色模式暫不強制實作；若未來要支援，色彩變數可透過 `prefers-color-scheme` 切換。

### 2.2 字階

| Token | 大小 | 字重 | 用途 |
|-------|------|------|------|
| eyebrow | 12px | 600 | 畫面標籤，大寫/寬字距 |
| h1 | 28px | 700 | 頁面主標題（手機） |
| h2 | 20px | 600 | 區塊標題 |
| h3 | 16px | 600 | 卡片內標題 |
| body | 16px | 400 | 正文 |
| body-sm | 14px | 400 | 次要文字 |
| caption | 12px | 500 | 輔助說明 |
| amount | 24px | 700 | 金額數字 |
| amount-lg | 32px | 700 | 總額/結餘 |

### 2.3 間距與圓角

- 圓角：`rounded-2xl`（16px）卡片、`rounded-xl`（12px）按鈕與輸入框、`rounded-full` pill。
- 陰影：卡片統一使用 `shadow-sm`，modal/bottom sheet 使用 `shadow-xl`。
- 卡片內距：`p-4`（16px）。
- 區塊間距：`gap-4`（16px）。

### 2.4 圖示

- 持續使用 `lucide-vue-next`，尺寸規範：
  - Tab icon：`size-6`（24px）
  - 列表/卡片 icon：`size-5`（20px）
  - 按鈕 icon：`size-4`（16px）
  - 小工具 icon：`size-3.5`（14px）

---

## 3. 佈局架構

### 3.1 App Shell

```
┌─────────────────────────────┐
│  Status bar / safe-area-top │
├─────────────────────────────┤
│  Header（頁面標題 + 操作）   │
├─────────────────────────────┤
│                             │
│         Main Content        │
│                             │
├─────────────────────────────┤
│  Bottom Tab Bar             │
│  + safe-area-bottom         │
└─────────────────────────────┘
```

- 頂部 header 改為精簡版：只保留 App 名稱、目前週期/旅程，以及一個全域「新增交易」FAB。
- 側邊欄（`xl:block`）與手機水平滾動導航全部移除。
- 底部 Tab Bar 常駐 5 個主要入口，見 3.3。

### 3.2 Breakpoints

| 名稱 | 寬度 | 佈局變化 |
|------|------|----------|
| xs | 0–639px | 單欄、底部 tab、全寬卡片 |
| sm | 640px+ | 表單可兩欄、KPI 2×2 |
| md | 768px+ | 列表可並排、卡片 2 欄 |
| lg | 1024px+ | 可選側邊輔助面板、卡片 3–4 欄 |
| xl | 1280px+ | 內容最大寬度 `max-w-6xl` 置中 |

### 3.3 導航與資訊架構

#### 底部 Tab Bar（5 個）

| 圖示 | 標籤 | 路由 | 說明 |
|------|------|------|------|
| LayoutDashboard | 總覽 | `/` | Dashboard |
| ListChecks | 交易 | `/transactions` | 交易列表與搜尋 |
| PlusCircle（FAB）| 記一筆 | 開啟 modal | 全域快速新增 |
| ChartPie | 預算 | `/category-budget` | 分類預算進度 |
| Settings2 | 更多 | `/settings` | 設定與資料維護入口 |

#### 「更多」頁面中的次級入口

- 預算週期 `/budgets`
- 分類管理 `/categories`
- 固定開支 `/fixed-expenses`
- 旅程 `/trips`
- 每月快照 `/monthly-snapshot`
- JSON 匯入 `/import-transactions`
- 設定 `/settings`

這些頁面改為從「更多」頁的 grid 選單進入，減少常駐 tab 數量。

### 3.4 Safe Area

- 頂部：`env(safe-area-inset-top)`，透過 `pt-[env(safe-area-inset-top)]` 或 `safe-area-top` class。
- 底部：`env(safe-area-inset-bottom)`，底部 tab bar 使用 `pb-[env(safe-area-inset-bottom)]`。
- 建議在 `main.css` 加入：

```css
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
```

---

## 4. 元件庫建議

### 4.1 Button variants

統一建立 `BaseButton.vue`，透過 `variant` prop 控制：

| Variant | Class 範例 | 用途 |
|---------|------------|------|
| primary | `bg-primary text-white` | 主要儲存、新增 |
| secondary | `bg-white border border-border text-text` | 取消、次要動作 |
| ghost | `text-text-2 hover:bg-accent` | 文字連結、工具列 |
| danger | `bg-white border border-red-200 text-danger` | 刪除 |
| fab | `fixed bottom-20 right-4 size-14 rounded-full bg-primary text-white shadow-lg` | 全域新增 |

觸控目標：所有按鈕最小 `min-h-11`（44px）。

### 4.2 Cards

建立 `BaseCard.vue`，預設：

```vue
<article class="rounded-2xl bg-surface p-4 shadow-sm">
  <slot />
</article>
```

變體：
- `variant="default"`：白底灰邊
- `variant="primary"`：淺綠邊框或淺綠背景強調
- `variant="warning"`：淺橘邊框
- `variant="danger"`：淺紅邊框

### 4.3 Form inputs

建立 `BaseInput.vue`、`BaseSelect.vue`、`BaseTextarea.vue`：

```css
.input-base {
  @apply w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20;
}
```

- 表單標籤使用 `block text-sm font-medium text-text-2 mb-1.5`。
- 錯誤狀態：`border-danger focus:border-danger focus:ring-danger/20`。
- 選擇器在 iOS 上建議加上 `appearance-none` 與自訂箭頭背景。

### 4.4 Modal / Bottom Sheet

- 手機（xs–md）：新增交易、固定開支表單、每週回顧統一使用 **bottom sheet**，從底部滑出，高度預設 `h-[90vh]`，可拖拽關閉（可選）。
- 桌面（lg+）：可改為中央 modal。
- `BaseBottomSheet.vue` 與 `BaseModal.vue` 並存，依螢幕寬度選擇渲染。

### 4.5 Lists

建立 `TransactionListItem.vue`：

```
┌─────────────────────────────────────┐
│ [icon]  名稱              +HKD 1,200 │
│         分類 · 7月4日                │
│         原幣：JPY 25,000             │
└─────────────────────────────────────┘
```

- 圖示圓形背景使用分類顏色。
- 收入綠色（`text-primary`），支出/儲蓄使用 `text-text`。
- 手機上 actions 改為點擊項目後進入詳情頁或彈出 bottom sheet，而非並排按鈕。

### 4.6 Empty state

改為圖示 + 標題 + 說明 + 可選 CTA 的置中版面：

```vue
<div class="flex flex-col items-center rounded-2xl bg-surface p-8 text-center">
  <component :is="icon" class="size-12 text-text-3" />
  <p class="mt-4 text-base font-semibold text-text">{{ title }}</p>
  <p class="mt-1 text-sm text-text-2">{{ message }}</p>
  <slot name="action" />
</div>
```

### 4.7 Loading / Skeleton

建立 `SkeletonCard.vue`、`SkeletonList.vue`：

```vue
<div class="animate-pulse rounded-2xl bg-surface p-4 shadow-sm">
  <div class="h-4 w-1/3 rounded bg-text-3/20" />
  <div class="mt-3 h-8 w-1/2 rounded bg-text-3/20" />
  <div class="mt-2 h-4 w-2/3 rounded bg-text-3/20" />
</div>
```

---

## 5. 逐頁設計

### 5.1 Dashboard（總覽）

#### 目標
- 一打開就讓用戶看到「本期結餘」與「今日可用」，降低認知負荷。
- 將目前的四個 KPI 卡片濃縮為兩個大卡片 + 次要指標列。

#### 手機佈局

```
[Header]  個人收支追蹤 · 2025-07 週期

[Hero Card]
  eyebrow: 本期結餘
  amount-lg: HKD 12,450
  caption: 收入 HKD 30,000 − 支出 HKD 17,550
  [進度條：支出佔收入比例]

[Secondary KPIs 2×2]
  今日可用 | 今日已用
  儲蓄目標 | 固定支出

[快速新增卡片]
  輸入框 + 建議 chips + 零頭儲蓄開關

[儲蓄挑戰卡片]
  進度條列表 + 新增按鈕

[固定支出摘要卡片]
  總額 + 即將到期 1–2 筆 + 管理連結

[分類警報卡片]
  只顯示 warning/danger， healthy 隱藏

[最近交易]
  最近 6–8 筆 + 查看全部連結
```

#### 改動重點
- 移除目前頁面頂端「上週回顧」按鈕，改放 Hero card 右上角的小圖示入口。
- 「新增交易」改為全域 FAB，dashboard 不再保留大尺寸新增按鈕。
- 旅程模式切換改到 Header 的 dropdown（見 5.8）。

### 5.2 快速新增交易（Global Bottom Sheet）

#### 目標
- 從任何頁面點 FAB 都能快速記帳。

#### 手機佈局

```
[Drag handle]
[Title] 記一筆

[Segmented control]
  支出 | 收入 | 儲蓄

[表單]
  名稱（大字輸入，自動 focus）
  金額（數字鍵盤）
  分類（水平滾動 chips 或 bottom sheet 選擇器）
  幣別 | 日期（同一列）
  旅程（選擇器）
  [定期支出開關] → 展開週期/到期日
  [儲蓄挑戰]（saving 時顯示）

[匯率提示]
  將入帳 HKD xxx · 匯率日期

[Footer]
  取消 | 儲存
```

#### 改動重點
- 名稱輸入框在手機上置頂並自動 focus。
- 分類改為 horizontal chip list，分類顏色直接顯示為 chip 背景。
- 保留 `TransactionForm.vue` 的邏輯，但 UI 改為新的 `QuickAddSheet.vue`。

### 5.3 交易紀錄（Transactions）

#### 目標
- 把搜尋與篩選從密集表單改為可展開的 filter bar。

#### 手機佈局

```
[Header] 交易紀錄

[Sticky Search Bar]
  [搜尋輸入框]        [Filter 按鈕]

[Filter Chips]
  全部 · 支出 · 收入 · 儲蓄
  今天 · 本期 · 未來
  [旅程] [分類]（出現時顯示為 removable chip）

[交易列表]
  按日期分組（今天 / 昨天 / 7月3日 / 更早）
  每筆交易：icon + 名稱/分類/日期 + 金額
  點擊後 bottom sheet 顯示詳情與編輯/刪除

[Empty State]
```

#### 改動重點
- 移除頁面頂端的新增表單；新增統一走 FAB。
- 編輯交易改為從 bottom sheet 開啟，不跳轉頁面。
- 日期分組使用 `TransactionDateGroup.vue`。

### 5.4 固定開支（Fixed Expenses）

#### 目標
- 集中管理定期支出，強調「即將到期」。

#### 手機佈局

```
[Header] 固定開支

[KPI 卡片]
  本期固定支出總額
  即將到期帳單數

[即將到期列表]
  名稱 + 到期日 + 金額

[全部固定開支]
  分類圓點 + 名稱 + 週期 + 金額
  點擊進入編輯 bottom sheet

[Floating 新增按鈕]
```

#### 改動重點
- `FixedExpenseForm.vue` 改為 bottom sheet，與快速新增共用基礎樣式。
- 列表項移除並排修改/刪除按鈕，改為點擊後詳情。

### 5.5 分類預算（Category Budget）

#### 目標
- 用視覺化進度條讓預算健康度一目瞭然。

#### 手機佈局

```
[Header] 分類預算

[Segmented control]
  今日 | 本期

[KPI 卡片]
  預算上限 | 已使用 | 進度餘額 | 使用率

[風險提示]
  只列出 danger/warning 分類

[分類進度列表]
  分類名稱 + 已用/上限 + 狀態標籤
  進度條（顏色=分類顏色）
  點擊展開詳細數字

[支出集中度]
  圓環圖或水平長條（可選）
```

#### 改動重點
- 風險提示移到進度列表上方，優先顯示。
- 進度條高度改為 `h-3`，圓角全滿。
- 狀態標籤使用 pill 樣式：`bg-danger/10 text-danger`。

### 5.6 預算週期（Budgets）

#### 目標
- 週期選擇與編輯更符合手機操作。

#### 手機佈局

```
[Header] 預算週期

[週期選擇器]
  水平滾動 chips：2025-07 | 2025-06 | + 新增

[週期設定卡片]
  週期代碼 / 入糧日 / 固定收入 / 儲蓄目標
  [儲存按鈕]

[分類預算上限卡片]
  分類清單 + 輸入框 + 儲存
```

#### 改動重點
- 左側週期清單改為水平 chip selector。
- `TargetLimitEditor.vue` 的每個分類改為卡片式，而非緊密網格。

### 5.7 分類管理（Categories）

#### 目標
- 簡化新增流程，強化視覺預覽。

#### 手機佈局

```
[Header] 分類管理

[Segmented control]
  支出 | 收入

[新增分類卡片]
  名稱（繁中）
  名稱（英文）
  顏色選擇器（色票 grid）
  圖示選擇器（lucide icon 名稱輸入 + 預覽）
  [新增按鈕]

[現有分類列表]
  分類色圓 + 名稱 + 停用按鈕
```

#### 改動重點
- 顏色輸入框改為色票選擇器，減少輸入錯誤。
- 圖示輸入時即時預覽對應的 lucide icon。

### 5.8 旅程（Trips）

#### 目標
- 旅程模式切換更顯眼，旅程詳情與編輯分離。

#### 手機佈局

```
[Header]
  旅程管理
  [目前模式：一般模式 ▼] 下拉切換

[旅程卡片列表]
  封面色條 + 名稱 + 目的地 + 日期 + 狀態 badge
  點擊進入詳情/編輯

[詳情頁]
  基本資訊卡片
  預算與已支出 KPI
  [設為目前旅程] / [標記完成] / [編輯]
```

#### 改動重點
- 旅程模式切換從側還原到手機 header dropdown。
- 建立旅程與編輯旅程改為獨立頁面或 full-screen bottom sheet。
- Dashboard 的旅程模式改為 header 提示條。

### 5.9 每月快照（Monthly Snapshot）

#### 目標
- 改為報告式排版，適合手機直向閱讀。

#### 手機佈局

```
[Header] 本期財務總覽

[週期標題卡片]
  2025-07 週期
  4月25日 – 5月24日

[KPI 卡片 2×2]
  收入 | 支出
  儲蓄 | 儲蓄率

[本期結餘大卡片]
  結餘金額 + 日均支出 + 與上週期比較

[主要支出分類]
  長條圖排名
```

### 5.10 JSON 匯入（Import）

#### 目標
- 保留大文字框，但將預覽改為卡片式摘要。

#### 手機佈局

```
[Header] 匯入交易

[JSON 輸入卡片]
  複製 AI Prompt | 載入範例
  textarea
  [驗證與預覽]

[預覽摘要卡片]
  總筆數 / 幣別 / 類型分佈

[逐筆預覽]
  卡片式列表，每筆顯示：類型、分類、名稱、原幣、入帳港幣、日期
  預設折疊，可展開

[錯誤/成功訊息]

[確認匯入按鈕]
```

#### 改動重點
- 預覽表格改為卡片式，避免手機橫向捲動。
- 匯入按鈕置底固定，方便確認。

### 5.11 設定（Settings）

#### 目標
- 作為「更多」頁面的 landing，統合資料維護入口。

#### 手機佈局

```
[Header] 更多

[快速入口 Grid]
  預算週期 | 分類管理
  固定開支 | 旅程
  每月快照 | JSON 匯入

[設定卡片]
  App 更新
  匯出備份
  還原備份

[關於]
  版本、匯率來源
```

### 5.12 上週回顧（Weekly Review）

#### 目標
- 改為 dashboard 的入口彈窗，內容視覺化。

#### 手機佈局

```
[Bottom Sheet]
  [Title] 上週回顧
  [Sub] 6月24日 – 6月30日

  [KPI 2×2]
    支出 | 收入
    儲蓄 | 交易筆數

  [主要支出分類]
  [與前一週相比]
```

---

## 6. 導航與資訊架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                         App Shell                            │
│  Header + Main Content + Bottom Tab Bar + Global FAB         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────┬───────────┼───────────┬─────────┐
        ▼         ▼           ▼           ▼         ▼
    Dashboard  Transactions  Budgets     More    Quick Add
        │           │          │          │        (FAB)
        │           │          │          ▼
        │           │          │      Settings
        │           │          │      ├── Budgets
        │           │          │      ├── Categories
        │           │          │      ├── Fixed Expenses
        │           │          │      ├── Trips
        │           │          │      ├── Monthly Snapshot
        │           │          │      ├── Import Transactions
        │           │          │      └── Settings
        │           │          │
        │           │          └── Category Budget
        │           │
        │           └── Transaction detail/edit (sheet)
        │
        ├── Weekly Review (sheet)
        ├── Saving Challenges
        ├── Fixed Expenses Summary
        └── Category Alerts
```

---

## 7. 無障礙檢查清單

### 7.1 對比度
- 主要文字 `#1c1917` 在 `#f4f1ea` 背景：對比度 > 15:1。
- 次要文字 `#57534e`：對比度 > 5:1。
- 所有互動元素顏色與背景對比 >= 4.5:1。

### 7.2 觸控目標
- 按鈕、icon button、清單項最小 44px × 44px。
- 底部 tab item 建議 48px 高。
- 表單輸入框高度 >= 44px。

### 7.3 Focus 狀態
- 保留 `focus-visible` ring：

```css
@layer base {
  :focus-visible {
    @apply outline-none ring-2 ring-primary ring-offset-2 ring-offset-bg;
  }
}
```

- 底部 tab active 狀態同時使用 icon + label 顏色變化，不只依賴顏色。

### 7.4 標籤與語義
- 所有 icon-only 按鈕提供 `aria-label`。
- 表單標籤使用 `<label>` 明確關聯 `for`。
- 進度條保留 `role="progressbar"` 與 `aria-valuenow`。
- Toast 使用 `role="status"` 與 `aria-live="polite"`。

### 7.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Tailwind v4 + Vue 3 實作注意事項

### 8.1 Tailwind v4 設定

- 在 `src/assets/main.css` 使用 `@import 'tailwindcss'` 與 `@theme` 註冊自訂 token。
- 避免在 class 中混合使用預設 `stone-*` 與自訂 token；建議統一遷移到自訂 token。
- 使用 `bg-surface` 而非 `bg-white`，方便未來支援 dark mode。

### 8.2 Vue 3 實作模式

- 新建元件統一使用 `<script setup lang="ts">`。
- 元件 props 保持 readonly，事件 emit 維持 Vue 慣例。
- 畫面級狀態（如 bottom sheet 開關）放在 view component；跨畫面狀態仍使用 `useAppData()`。
- 建議新增 `useMediaQuery` composable 來決定 modal 或 bottom sheet：

```ts
import { useWindowSize } from '@vueuse/core' // 若未安裝可自寫

export function useIsMobile() {
  const { width } = useWindowSize()
  return computed(() => width.value < 768)
}
```

若不想新增依賴，可用 CSS breakpoint 透過 `display: none` 同時渲染兩種容器。

### 8.3 元件建議拆分

新增或重構以下元件：

| 元件 | 路徑 | 說明 |
|------|------|------|
| BaseButton | `src/components/base/BaseButton.vue` | 統一按鈕 |
| BaseCard | `src/components/base/BaseCard.vue` | 卡片殼 |
| BaseInput | `src/components/base/BaseInput.vue` | 輸入框 |
| BaseSelect | `src/components/base/BaseSelect.vue` | 選擇器 |
| BaseBottomSheet | `src/components/base/BaseBottomSheet.vue` | 底部彈窗 |
| BaseModal | `src/components/base/BaseModal.vue` | 中央彈窗（保留） |
| EmptyState | `src/components/base/EmptyState.vue` | 重構 |
| AppHeader | `src/components/layout/AppHeader.vue` | 頂部標題列 |
| BottomTabBar | `src/components/layout/BottomTabBar.vue` | 底部導航 |
| QuickAddFab | `src/components/layout/QuickAddFab.vue` | 全域 FAB |
| HeroCard | `src/components/dashboard/HeroCard.vue` | 總覽大卡片 |
| KpiGrid | `src/components/dashboard/KpiGrid.vue` | KPI 網格 |
| TransactionListItem | `src/components/transactions/TransactionListItem.vue` | 交易項目 |
| TransactionFilterBar | `src/components/transactions/TransactionFilterBar.vue` | 篩選列 |
| QuickAddSheet | `src/components/transactions/QuickAddSheet.vue` | 快速記帳 sheet |
| CategoryProgressItem | `src/components/categoryBudget/CategoryProgressItem.vue` | 分類進度項 |
| MoreMenuGrid | `src/components/settings/MoreMenuGrid.vue` | 更多頁入口 |

---

## 9. 遷移清單（建議順序）

### Phase A：設計系統基礎（先完成）
1. 在 `main.css` 建立 `@theme` 色彩與自訂 class。
2. 建立 `BaseButton`、`BaseCard`、`BaseInput`、`BaseSelect`、`BaseBottomSheet`。
3. 重構 `BaseModal.vue` 樣式以符合新系統。
4. 重構 `EmptyState.vue`。

### Phase B：佈局層
5. 建立 `AppHeader.vue`、`BottomTabBar.vue`、`QuickAddFab.vue`。
6. 重構 `AppShell.vue`：移除側邊欄與水平滾動導航，改為 header + bottom tab + FAB。
7. 確認所有 view 的 `max-w-7xl` 改為 `max-w-6xl` 或全寬手機佈局。

### Phase C：核心畫面
8. 重構 `DashboardView.vue`：Hero card、KPI grid、快速新增、儲蓄挑戰、固定支出、警報、最近交易。
9. 建立 `QuickAddSheet.vue`，取代 dashboard 與 transactions 頁面的新增表單。
10. 重構 `TransactionsView.vue`：搜尋、filter chips、分組列表、詳情 sheet。
11. 重構 `TransactionList.vue` / `TransactionListItem.vue`。

### Phase D：預算與分類
12. 重構 `CategoryBudgetView.vue`：segmented control、KPI、風險提示、進度列表。
13. 重構 `BudgetsView.vue`：週期 chip selector、表單、分類上限。
14. 重構 `TargetLimitEditor.vue`。
15. 重構 `CategoriesView.vue`：顏色/圖示選擇器。

### Phase E：資料維護與其他畫面
16. 重構 `FixedExpensesView.vue` 與 `FixedExpenseForm.vue`（改為 sheet）。
17. 重構 `TripsView.vue`：旅程卡片、header dropdown、詳情/編輯 sheet。
18. 重構 `MonthlySnapshotView.vue` 為報告式排版。
19. 重構 `ImportTransactionsView.vue`：卡片式預覽。
20. 建立 `SettingsView.vue` 為「更多」頁 landing，納入所有次級入口。

### Phase F：細節與驗證
21. 更新 `WeeklyReviewModal.vue` 為 sheet 風格。
22. 統一 toast 樣式與位置。
23. 加入 skeleton loading 狀態。
24. 跑 `bun lint`、`bun format`、`bun run build`。
25. 手機模擬器測試所有頁面與互動。

---

## 10. 保留功能總覽

以下現有功能必須完整保留，僅改變呈現方式：

- 預算週期建立/編輯/分類上限
- 支出/收入/儲蓄交易的建立、編輯、刪除
- 多幣別輸入與港幣換算
- 旅程建立/編輯/模式切換
- 固定開支（定期支出）管理
- 儲蓄挑戰新增/暫停/刪除
- 分類預算警報
- 每週回顧
- 快速新增文字輸入與建議
- 零頭儲蓄
- JSON 匯入交易
- 備份/還原
- App 重新載入
- 匯率同步與顯示

---

## 11. 結語

本規格以 mobile-first 為核心，透過統一的設計系統、底部導航、bottom sheet 與卡片式排版，讓應用程式在小螢幕上更易於每日記帳與查看預算。所有商業邏輯與資料流維持不變，工程師可依據本文件逐頁重構，並在每一階段透過 lint、format 與 build 確保品質。
