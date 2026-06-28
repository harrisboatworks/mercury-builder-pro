/**
 * Traditional Chinese (zh-Hant) pilot — 5 pages, NOINDEX, native-review: pending.
 *
 * These are companion translations of the highest-intent /blog/zh/ pages,
 * localized for Hong Kong / Taiwan reader conventions (繁體字 + 港台用語).
 * They stay OUT of the sitemap until a native speaker approves them.
 *
 * Pilot scope:
 *   1. ontario-boat-winterization-guide-chinese        (NEW)
 *   2. first-boat-rental-rice-lake-chinese-guide       (NEW)
 *   3. pcoc-pcl-fishing-licence-difference-ontario     (NEW)
 *   4. gta-chinese-rice-lake-day-trip-plan             (existing — substitute for
 *      the requested `rice-lake-boat-rental-fishing-day-trip-toronto` slug,
 *      which does not exist on the site — flagged in the part-3 summary)
 *   5. gta-chinese-buy-boat-rice-lake-guide            (existing — substitute for
 *      the requested `toronto-chinese-boat-buying-guide-ontario` slug,
 *      which does not exist on the site — flagged in the part-3 summary)
 *
 * Honest language note (Traditional Chinese — never claim Chinese-speaking staff):
 */
import { BlogArticle } from './blogArticles';

import zhWinterizationHero from '@/assets/blog/zh-winterization-hero.png';
import zhFirstRentalHero from '@/assets/blog/zh-first-rental-hero.png';
import zhPcocHero from '@/assets/blog/zh-pcoc-hero.png';

export const ZH_HANT_LANGUAGE_NOTE =
  '我們專門為華人朋友準備了這些中文指南——因為我們真心希望幫助華人船主和他們的家人朋友在 Rice Lake 享受划船的樂趣，這是很多其他船行沒有做的。說實話：我們的團隊使用英語服務，不過別擔心——歡迎帶會英語的親友同來，或者用手機翻譯軟件，我們一定會耐心溝通、盡力配合。';

// Map zh-Hant slug → simplified counterpart for hreflang cross-linking.
export const ZH_HANT_TO_HANS_SLUG: Record<string, string> = {
  'ontario-boat-winterization-guide-chinese': 'ontario-boat-winterization-guide-chinese',
  'first-boat-rental-rice-lake-chinese-guide': 'first-boat-rental-rice-lake-chinese-guide',
  'pcoc-pcl-fishing-licence-difference-ontario': 'pcoc-pcl-fishing-licence-difference-ontario',
  'gta-chinese-rice-lake-day-trip-plan': 'gta-chinese-rice-lake-day-trip-plan',
  'gta-chinese-buy-boat-rice-lake-guide': 'gta-chinese-buy-boat-rice-lake-guide',
};

export const traditionalChineseBlogArticles: BlogArticle[] = [
  {
    slug: 'ontario-boat-winterization-guide-chinese',
    title: '安省船主冬季保養和冬儲清單：第一次過冬怎麼做',
    seoTitle: '安省 船 冬季保養 繁體 (2026 第一次過冬指南)',
    description: '第一次在安省過冬的船主指南：為什麼必須冬化（結冰會裂缸體）、完整冬化清單、DIY vs 經銷商服務、什麼時候預訂（9-11 月）、HBW 在 Gores Landing 的冬儲服務（12 月 1 日至 4 月 1 日停業）。',
    image: zhWinterizationHero,
    author: 'Jay Harris',
    datePublished: '2026-06-12',
    dateModified: '2026-06-12',
    publishDate: '2026-06-12',
    category: 'mandarin',
    readTime: '9 分鐘',
    keywords: ['冬季保養', '冬儲', '安省', '繁體', 'winterization', 'Mercury'],
    content: `> **簡短答案：** 安省冬天會反覆結冰解凍，引擎水道裡殘留的水結冰後會撐裂鋁製缸體——修不好，只能換引擎。完整冬化包括引擎霧化和防凍液、燃油穩定劑、電池取出、機油更換，再加上收縮膜或室內存放。建議 9 月預訂、10 至 11 月送修。HBW 在 Gores Landing 提供冬化和室外收縮膜冬儲，**12 月 1 日至 4 月 1 日停業**——必須在停業前完成。

## 為何安省冬天必須冬化

安省的問題不是「冷」，是**反覆結冰解凍**。每年 11 月到 3 月，氣溫會在零度上下來回波動幾十次。每一次水結成冰，體積膨脹約 9%。

引擎裡只要還有一點冷卻水，那點水凍起來就能把缸體或下機箱（lower unit）撐裂。這種損壞無法維修——鋁合金一旦裂開，無法焊補到承受燃燒室壓力的程度，**只能整機更換**。

我們每年春天都見到一兩台這樣的引擎，幾乎都是船主自己冬化但漏掉一步（最常見：忘記把冷卻水道排空就直接收起來）。

## 完整冬化清單

| 項目 | 為何要做 | DIY 難度 |
|---|---|---|
| 排空冷卻水（flush + drain） | 防止缸體凍裂 | 中 |
| 引擎霧化（fogging oil） | 防止汽缸壁冬季鏽蝕 | 中 |
| 防凍液灌入水道 | 雙保險，確保殘留水不結冰 | 中 |
| 燃油加穩定劑、加滿油箱 | 防止汽油氧化、油箱內壁凝水 | 易 |
| 齒輪油更換並檢查有無乳化（變白代表進水） | 趁早發現密封件失效 | 中 |
| 更換引擎機油和機油濾芯 | 舊機油酸性會腐蝕軸承 | 中 |
| 拆下電池、室內常溫存放、每月補電一次 | 防止零下放電報廢 | 易 |
| 檢查火咀 / 接頭 / 防水油脂 | 順手做，省春天的錢 | 中 |
| 收縮膜或室內存放 | 防止積雪壓塌船篷、防止雨水入船 | 難（建議交給船廠） |

> **DIY 還是交給經銷商？** 上面 9 項裡只要漏一項關鍵步驟（排水、霧化、防凍液），代價就是一台新引擎。如果是第一次過冬，強烈建議至少**第一年交給 Mercury 認證技師**，跟著學一遍流程，第二年再考慮自己做哪幾項。

## 何時預訂？

| 月份 | 狀態 | 建議 |
|---|---|---|
| 9 月 | 預訂窗口 | 鎖定冬儲位置和冬化時段 |
| 10 月 | 送船最佳 | 天氣還穩定，技師有時間 |
| 11 月初至中 | 仍可送 | 價格上升，時段緊 |
| 11 月底 | 場地幾乎滿 | 不建議拖到此時 |
| **12 月 1 日以後** | **HBW 停業** | **無法送船，無法做冬化** |

HBW **12 月 1 日至 4 月 1 日完全停業**——沒有員工在場、不接收船隻、不做任何維修服務。如果錯過 11 月底，就只能自己在車庫做。

## 收縮膜 vs 室內存放

| 項目 | 收縮膜（室外） | 室內存放 |
|---|---|---|
| 防雪壓 | 配骨架支撐可以 | 當然可以 |
| 防漆面氧化 | 收縮膜下溫差大，但日曬最少 | 最好 |
| 防鼠 | 室外鼠害低於無遮蔽 | 視設施而定 |
| 價格 | 較低 | 高 30-100% |
| HBW 提供嗎 | **是（標準服務）** | **否——HBW 只做室外收縮膜** |

HBW 不提供室內冬儲。需要室內的客戶請聯繫 GTA 地區的恆溫存放設施。

## HBW 的冬化和冬儲服務

- 地點：Gores Landing, Ontario（萊斯湖南岸）
- 自送自取（HBW 不提供取送）
- 服務：[引擎冬化（Mercury 認證技師）](https://www.mercurymarine.com/canada/en/) + 室外收縮膜冬儲 + 春季開機
- 價格：按船長每呎計算，具體報價請致電
- 聯絡方式：(905) 342-2153 / info@harrisboatworks.ca

::pull-quote
quote: ${ZH_HANT_LANGUAGE_NOTE}
::

## 常見問題

**Q：HBW 提供室內冬儲嗎？**
不提供。HBW 只做室外收縮膜冬儲。

**Q：HBW 可以來 GTA 取船嗎？**
不可以。客戶自送自取，多倫多到萊斯湖約 1 至 1.5 小時車程。

**Q：船在 HBW 冬儲期間可以進去取東西嗎？**
12 月 1 日至 4 月 1 日船廠關閉——不能。請在送船前取出所有需要的物品。

**Q：自己做冬化最容易漏的步驟是甚麼？**
冷卻水道排空。很多船主只 flush 了水，但殘留水仍在通道裡。冬化必須在引擎完全垂直的位置 drain 乾淨，再加防凍液做雙保險。

> 完整簡體版：[/blog/zh/ontario-boat-winterization-guide-chinese](/blog/zh/ontario-boat-winterization-guide-chinese)
`,
    faqs: [
      { question: 'HBW 提供室內冬儲嗎？', answer: '不提供。HBW 只做室外收縮膜冬儲。需要室內存放請聯繫 GTA 恆溫存放設施。' },
      { question: '甚麼時候必須送過去？', answer: 'HBW 12 月 1 日至 4 月 1 日完全停業。最佳送船窗口是 10 月至 11 月中。建議 9 月預訂位置。' },
      { question: '自己做冬化最容易漏的是哪一步？', answer: '冷卻水道排空。殘留水凍裂鋁製缸體的損壞無法維修，只能換引擎。' },
      { question: 'HBW 有中文服務嗎？', answer: ZH_HANT_LANGUAGE_NOTE },
    ],
  },

  {
    slug: 'first-boat-rental-rice-lake-chinese-guide',
    title: '多倫多華人第一次租船釣魚：證件、安全和當天流程',
    seoTitle: 'Rice Lake 租船 繁體 多倫多 (第一次完整流程)',
    description: '多倫多華人第一次到 Rice Lake 租船釣魚的完整指南：需要帶甚麼證件、租船安全檢查清單（不一定需要 PCOC）、當天到達流程、安全簡報、安省釣魚證（與船證分開）、從萬錦/士嘉堡的駕車路線（約 90 分鐘）。',
    image: zhFirstRentalHero,
    author: 'Jay Harris',
    datePublished: '2026-06-12',
    dateModified: '2026-06-12',
    publishDate: '2026-06-12',
    category: 'mandarin',
    readTime: '8 分鐘',
    keywords: ['Rice Lake 租船', '繁體 多倫多', '第一次 租船 釣魚', '安省 釣魚證', 'Harris Boat Works'],
    content: `> **簡短答案：** 多倫多出發到 Rice Lake 約 90 分鐘車程。租船當天通常需要：政府簽發的有相片證件、信用卡（按金用）、有效的安省釣魚證（如果要釣魚）。**租賃船隻通常不要求 PCOC**——加拿大運輸部允許租船公司用一份《Rental Boat Safety Checklist》代替 PCOC 完成短租。具體證件要求以 [HBW 租船頁面](https://www.harrisboatworks.ca/rentals) 為準。

## 多倫多出發：路線和時間

- **萬錦（Markham）/ 列治文山 / 北約克：** 經 404 北上轉 115，約 75-90 分鐘。
- **士嘉堡（Scarborough）/ 密西沙加：** 經 401 東行轉 115，約 90-110 分鐘。
- **目的地：** Harris Boat Works，5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0。

建議早上 8 至 9 點出門，9:30 至 10:30 到達。**釣魚最佳時段是日出後 2 小時和日落前 2 小時**。

## 當天要帶的東西

| 類別 | 物品 | 備註 |
|---|---|---|
| 證件 | 政府簽發的有相片身份證件 | 駕駛執照或護照 |
| 證件 | 安省釣魚證 + Outdoors Card（如果要釣魚） | 見下文 |
| 按金 | 信用卡（不是扣賬卡） | 用於按金預授權 |
| 衣物 | 防風外套、太陽眼鏡、帽、備用衣物 | 湖上比岸邊冷 5-10°C |
| 裝備 | 防曬霜、飲用水、午餐、零食 | 湖上無補給點 |
| 釣具 | 魚竿、魚絲、魚餌（如果釣魚） | HBW 也可詢問能否租借 |

**救生衣 HBW 提供**（按租船人數和體型搭配）。

## 當天流程（典型一日租船）

1. **到店登記（約 15-20 分鐘）** ——出示證件，簽租船合約，刷信用卡按金。
2. **安全簡報和租船檢查清單** ——HBW 同事會講解：船隻控制、油門、急救設備位置、救生衣穿戴、緊急聯絡方式、船隻允許航行的水域。這一步就是運輸部允許租船代替 PCOC 的部分，**必須完成並簽字**。
3. **船隻交接和試機** ——同事把船開到碼頭，示範啟動、變速、停泊。
4. **下水使用** ——按約定時長（半天 / 全天）使用。
5. **返航和歸還** ——按約定時間回到 HBW 碼頭，結清燃油費用，退還按金。

## 關於 PCOC（船隻操作員卡）

簡短答案：**短期租船通常不需要 PCOC**。

加拿大運輸部對租賃船隻有專門規定：租船公司可以讓租客填寫並簽字一份《Rental Boat Safety Checklist》，由此代替 PCOC 的要求。具體執行因租船公司而異，HBW 的做法以其 [租船頁面](https://www.harrisboatworks.ca/rentals) 和現場流程為準。

## 關於安省釣魚證

釣魚證和船證是**兩套完全獨立的系統**：

- **機構不同：** 釣魚證由安省自然資源與林業部（MNRF）管，船證由加拿大運輸部管。
- **結構：** 先辦一張 **Outdoors Card**（戶外活動卡，3 年有效），再加一張 **Fishing Licence**。
- **官方頁面（含繁體中文版）：** [安省釣魚規章摘要（繁體中文）](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese)。

::pull-quote
quote: ${ZH_HANT_LANGUAGE_NOTE}
::

## 常見問題

**Q：必須有 PCOC 嗎？** 通常不需要——加拿大運輸部允許租船公司用《Rental Boat Safety Checklist》代替。

**Q：HBW 提供救生衣嗎？** 是。按租船人數和體型搭配。

**Q：釣魚證可以當天在 HBW 買嗎？** 不可以。請在出發前於 [安省官方頁面](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese) 辦好。

> 完整簡體版：[/blog/zh/first-boat-rental-rice-lake-chinese-guide](/blog/zh/first-boat-rental-rice-lake-chinese-guide)
`,
    faqs: [
      { question: '必須有 PCOC 嗎？', answer: '通常不需要。加拿大運輸部允許租船公司用《Rental Boat Safety Checklist》代替 PCOC。' },
      { question: '從萬錦/士嘉堡到 Rice Lake 多久？', answer: '萬錦約 75-90 分鐘，士嘉堡約 90-110 分鐘。建議早上 8-9 點出發。' },
      { question: 'HBW 有中文服務嗎？', answer: ZH_HANT_LANGUAGE_NOTE },
    ],
  },

  {
    slug: 'pcoc-pcl-fishing-licence-difference-ontario',
    title: 'PCOC、PCL、釣魚證區別：安省新手別搞混',
    seoTitle: '安省 船牌 繁體 PCOC vs PCL vs 釣魚證',
    description: '安省新手常把三個證件搞混：PCOC（船隻操作員卡，終身有效，開動力船必須）、PCL（船隻牌照，船身的註冊號，免費，換引擎要更新）、安省釣魚證（獨立系統，由 MNRF 管理）。三者對比表 + 官方申請連結。',
    image: zhPcocHero,
    author: 'Jay Harris',
    datePublished: '2026-06-12',
    dateModified: '2026-06-12',
    publishDate: '2026-06-12',
    category: 'mandarin',
    readTime: '7 分鐘',
    keywords: ['安省 船牌', '繁體 PCOC', 'PCL', '船隻操作員卡', '釣魚證'],
    content: `> **簡短答案：** **PCOC**（Pleasure Craft Operator Card，船隻操作員卡）是終身有效的「駕駛執照」，只要操作配動力的船就必須有。**PCL**（Pleasure Craft Licence，船隻牌照）是船身上那串字母數字註冊號，**免費**。**釣魚證**完全獨立，由安省自然資源與林業部（MNRF）管。短期租船通常不需要 PCOC。

## 一張表看懂三者區別

| 項目 | PCOC | PCL | 安省釣魚證 |
|---|---|---|---|
| 中文名 | 船隻操作員卡 | 船隻牌照 | 釣魚證 |
| 全稱 | Pleasure Craft Operator Card | Pleasure Craft Licence | Outdoors Card + Fishing Licence |
| 管理機構 | 加拿大運輸部 | 加拿大運輸部 | 安省自然資源與林業部 (MNRF) |
| 是關於甚麼 | **人**——會不會安全開船 | **船**——船身的註冊號 | **行為**——允不允許釣魚 |
| 費用 | 考試 + 卡片 \$40-\$60 不等 | **免費** | 視類型而定 |
| 有效期 | **終身** | 10 年（到期續期） | Outdoors Card 3 年 |
| 中文支援 | 視提供商而定（建議查運輸部認可名單） | 英 / 法文 | **有官方繁體中文摘要** |
| 換引擎要更新嗎 | 不用 | **要**（HP 變化時） | 不影響 |

## PCOC：船隻操作員卡

- **誰必須有：** 任何在加拿大水域操作配動力（包括電動推進器）的休閒船的人。
- **官方認可名單：** [Transport Canada PCOC 認可提供商](https://tc.canada.ca/en/marine-transportation/marine-safety/pleasure-craft-operator-competency-program)。
- **中文考試是否提供：** 視提供商而定，**不能保證所有提供商都有中文版**——請直接聯繫認可名單上的提供商確認。
- **有效期：** 終身。

## PCL：船隻牌照（船身註冊號）

- **誰必須有：** 配 10 HP（7.5 kW）以上引擎的休閒船船主。
- **怎麼辦：** [Transport Canada Pleasure Craft Licence 在線申請](https://tc.canada.ca/en/marine-transportation/marine-safety/pleasure-craft-licences) ——**免費**。
- **何時必須更新：** 換引擎（HP 變化時）、賣船給新主、地址變更。

## 安省釣魚證

- **結構：** 先辦 **Outdoors Card**（3 年有效），再加 **Fishing Licence**。
- **官方頁面（含繁體中文摘要）：** [安省釣魚規章摘要（繁體中文）](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese)。
- **完全獨立於 PCOC / PCL。**

## 三種情況的實際例子

| 情況 | PCOC | PCL | 釣魚證 |
|---|---|---|---|
| Rice Lake 短期租船一天，釣魚 | 通常不用 | 不用 | **要** |
| 自家船（15 HP）在 Lake Simcoe 釣一天 | **要** | **要** | **要** |
| 換了一台 90 HP Mercury 引擎 | 已有就夠 | **要更新** | 不影響 |

::pull-quote
quote: ${ZH_HANT_LANGUAGE_NOTE}
::

## 常見問題

**Q：PCOC 中文考試在哪裡？** 視 Transport Canada 認可提供商而定。請直接查 [認可名單](https://tc.canada.ca/en/marine-transportation/marine-safety/pleasure-craft-operator-competency-program) 並聯繫提供商。

**Q：換引擎後 PCL 一定要更新嗎？** 要。HP 變化時必須在 Transport Canada 在線更新，仍然免費。

> 完整簡體版：[/blog/zh/pcoc-pcl-fishing-licence-difference-ontario](/blog/zh/pcoc-pcl-fishing-licence-difference-ontario)
`,
    faqs: [
      { question: 'PCOC 和 PCL 有甚麼區別？', answer: 'PCOC 是您的「駕駛執照」（人證，終身有效）。PCL 是船的「車牌」（船證，免費，10 HP 以上必須）。兩個都要。' },
      { question: '短期租船一定要 PCOC 嗎？', answer: '通常不需要。加拿大運輸部允許租船公司用《Rental Boat Safety Checklist》代替。' },
      { question: 'HBW 有中文服務嗎？', answer: ZH_HANT_LANGUAGE_NOTE },
    ],
  },

  // Pilot stubs of two existing high-intent zh pages — concise Traditional
  // Chinese summaries that point readers to the full Simplified version.
  // Marked native-review: pending; noindex via the page-level Helmet.
  {
    slug: 'gta-chinese-rice-lake-day-trip-plan',
    title: 'GTA → 萊斯湖 一日遊地圖（繁體版）',
    description: '從多倫多到萊斯湖的一日遊規劃：駕車路線、租船時間、釣魚熱點、回程時段。完整簡體版內容詳見對應頁面。',
    image: zhFirstRentalHero,
    author: 'Jay Harris',
    datePublished: '2026-06-12',
    dateModified: '2026-06-12',
    publishDate: '2026-06-12',
    category: 'mandarin',
    readTime: '5 分鐘',
    keywords: ['萊斯湖', '一日遊', '多倫多', '繁體'],
    content: `> 這是繁體中文試行版本（native-review: pending）。完整內容請參閱 [簡體版](/blog/zh/gta-chinese-rice-lake-day-trip-plan)。

## 一日遊核心要點

- **出發時間：** 早上 8-9 點離開多倫多，避開週末交通。
- **車程：** 經 404 + 115，約 90 分鐘到 Gores Landing。
- **租船：** 在 HBW 碼頭辦理，需要相片證件 + 信用卡按金。
- **釣魚證：** 出發前在 [安省官方頁面](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese) 辦好。
- **回程：** 下午 5 點前出發，避開 401 晚高峰。

::pull-quote
quote: ${ZH_HANT_LANGUAGE_NOTE}
::

完整版內容（包括詳細釣魚熱點、午餐推薦、燃油加油站位置）請看 [簡體版](/blog/zh/gta-chinese-rice-lake-day-trip-plan)。
`,
    faqs: [
      { question: 'HBW 有中文服務嗎？', answer: ZH_HANT_LANGUAGE_NOTE },
    ],
  },

  {
    slug: 'gta-chinese-buy-boat-rice-lake-guide',
    title: 'GTA 華人萊斯湖買船完整指南（繁體版）',
    description: 'GTA 華人家庭第一次買船：用途決定船型、新船 vs 二手船、Mercury 引擎選擇、貸款方式、交付前要做的功課。完整簡體版內容詳見對應頁面。',
    image: zhFirstRentalHero,
    author: 'Jay Harris',
    datePublished: '2026-06-12',
    dateModified: '2026-06-12',
    publishDate: '2026-06-12',
    category: 'mandarin',
    readTime: '6 分鐘',
    keywords: ['買船', '萊斯湖', 'GTA 華人', '繁體', 'Mercury'],
    content: `> 這是繁體中文試行版本（native-review: pending）。完整內容請參閱 [簡體版](/blog/zh/gta-chinese-buy-boat-rice-lake-guide)。

## 買船核心要點

- **第一步：** 先決定用途（家庭出遊 vs 認真釣魚），再決定船型。
- **第二步：** 新船 vs 二手船——第一次買強烈建議買新船，配Premier 經銷商。
- **第三步：** Mercury 引擎匹配——船型決定 HP 範圍。
- **貸款：** 透過 Dealerplan Peterborough 由 TD Auto Finance 提供。**促銷年利率（promotional APR）：{{LIVE_RATE_PCT}}**（TD「Always On」方案，截至 2026 年 6 月，至 2026 年 12 月 31 日止）；**標準／一般年利率（standard APR）：7.99% 至 8.99%**（促銷不適用時）。最低融資金額 \$5,000。利率會變動，請致電 905-342-2153 或於 mercuryrepower.ca 建立報價以確認目前適用利率。
- **交付：** HBW 在 Gores Landing 自取，不提供送貨。

::pull-quote
quote: ${ZH_HANT_LANGUAGE_NOTE}
::

完整版內容（包括各船型對比表、HP 計算、買船清單）請看 [簡體版](/blog/zh/gta-chinese-buy-boat-rice-lake-guide)。
`,
    faqs: [
      { question: 'HBW 有中文服務嗎？', answer: ZH_HANT_LANGUAGE_NOTE },
    ],
  },
];

export function getTraditionalChineseArticleBySlug(slug: string): BlogArticle | undefined {
  return traditionalChineseBlogArticles.find((a) => a.slug === slug);
}

export function getPublishedTraditionalChineseArticles(): BlogArticle[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return traditionalChineseBlogArticles.filter(article => {
    const publishDate = new Date(article.publishDate || article.datePublished);
    publishDate.setHours(0, 0, 0, 0);
    return publishDate <= today;
  });
}
