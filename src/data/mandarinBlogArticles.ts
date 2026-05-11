import { BlogArticle } from './blogArticles';

import newImmigrantHero from '@/assets/blog/new-immigrant-boat-guide-hero.png';
import riceLakeHero from '@/assets/blog/rice-lake-fishing-zh-hero.png';
import winterizationHero from '@/assets/blog/winterization-mercury-zh-hero.png';
import mercury115vs150Hero from '@/assets/blog/mercury-115-vs-150-zh-hero.png';
import repowerVsNewHero from '@/assets/blog/repower-vs-new-boat-zh-hero.png';
import regulationsHero from '@/assets/blog/ontario-boating-regulations-zh-hero.png';
import chineseFamily23Cruise from '@/assets/blog/chinese-family-23cruise-rice-lake.jpg';

export const mandarinBlogArticles: BlogArticle[] = [
  {
    slug: 'new-immigrant-ontario-boat-buying-guide',
    title: '新移民安大略省购船完整指南：从零开始的实用手册',
    description: '专为华人新移民编写的安大略省购船指南。涵盖船只类型、驾照要求、保险、泊位、预算等全方位信息。',
    image: newImmigrantHero,
    author: 'Harris Boat Works',
    datePublished: '2026-04-12',
    dateModified: '2026-04-12',
    publishDate: '2026-04-12',
    category: '购船指南',
    readTime: '10 分钟',
    keywords: ['新移民买船', '安大略省购船指南', '加拿大华人买船', 'Ontario boat buying guide Chinese'],
    content: `
## 为什么要在安大略省买船？

安大略省拥有超过25万个湖泊，是全世界淡水资源最丰富的地区之一。无论您是喜欢钓鱼、水上运动还是家庭休闲，拥有一艘自己的船可以极大地丰富您在加拿大的生活体验。

对于很多华人新移民来说，买船可能感觉是一件陌生的事情。但实际上，入门门槛并没有想象中那么高。

## 您需要驾照吗？

在加拿大，操作任何动力船只都需要持有**快艇驾照（Pleasure Craft Operator Card, PCOC）**。

- 在线考试即可获得，无需路考
- 考试有中文版本可选
- 费用约$50加元左右
- 终身有效，一次通过即可

推荐网站：[BOATsmart!](https://www.boatsmart.ca/) 或 [BOATERexam](https://www.boaterexam.com/)

## 船的类型：选择适合您的

### 铝合金钓鱼船（Aluminum Fishing Boat）

- 最经济实惠的入门选择
- 轻巧耐用，容易拖行
- 适合2-4人钓鱼或湖上休闲
- 新船价格从$15,000起（含发动机和拖车）

### 碗型游船（Bowrider）

- 适合家庭使用，可坐6-8人
- 船头开放式设计，空间宽敞
- 适合游泳、滑水和日间游览
- 新船价格从$35,000起

### 浮筒船（Pontoon Boat）

- 最稳定的平台，适合老人和小孩
- 空间最大，像水上客厅
- 不适合恶劣天气
- 新船价格从$30,000起

## 买新船还是二手船？

### 新船的优点

- 全新保修（Mercury发动机保修3-5年）
- 最新技术，燃油效率更高
- 可以定制配置
- 不用担心隐藏问题

### 二手船的优点

- 价格便宜30-50%
- 折旧率低（新船头两年折旧最快）
- 可以"试水"，确认是否喜欢再投入

> 如果购买二手船，建议找有经验的人陪同验船，或请经销商进行检查。

## 额外费用清单

买船不仅仅是船本身的价格。以下是常见的额外费用：

- **HST（13%）** — 安大略省销售税
- **拖车（Trailer）** — 如果不在码头停放，约$2,000-$5,000
- **保险** — 每年$300-$800不等
- **泊位费** — 每季$1,000-$4,000不等
- **冬季存放** — 每年$500-$1,500
- **燃油** — 取决于使用频率和发动机大小
- **维护保养** — 每年$300-$800（换油、防冻等）

## 购船流程

1. **确定预算和用途** — 钓鱼？家庭休闲？水上运动？
2. **获取快艇驾照** — 在线考试，几个小时即可完成
3. **研究和试乘** — 联系经销商预约试乘
4. **获取报价** — 在 [mercuryrepower.ca](https://mercuryrepower.ca) 查看发动机价格
5. **安排融资** — 如需分期付款，我们提供灵活的融资方案
6. **办理保险和注册** — 经销商可以协助

## 关于 Harris Boat Works

Harris Boat Works 位于安大略省 Gores Landing，坐落在 Rice Lake 湖畔。自1947年起，三代家族经营，是 Mercury Marine 白金级授权经销商。

我们理解新移民购船时的顾虑和疑问。虽然我们的团队主要使用英语服务，但我们的在线报价工具 [mercuryrepower.ca](https://mercuryrepower.ca) 让您可以在不需要打电话的情况下了解价格和配置。
`,
    faqs: [
      { question: '没有加拿大驾照可以开船吗？', answer: '船的驾照（PCOC）和汽车驾照是独立的。您不需要汽车驾照来开船，但需要PCOC。可以在线考取。' },
      { question: '新移民可以贷款买船吗？', answer: '可以。即使信用记录有限，也有融资方案。我们可以帮助您了解可选的融资途径。' },
      { question: '船可以停在家里吗？', answer: '如果有拖车和足够的车道空间，可以将船停在家中。需要注意市政法规（bylaw），部分社区对此有限制。' },
      { question: '冬天船怎么办？', answer: '安大略省冬季不能使用船只。需要进行冬季储存（winterization），包括排水、防冻处理等。Harris Boat Works提供完整的冬季存放服务。' },
    ],
  },
  {
    slug: 'rice-lake-fishing-guide-toronto-chinese',
    title: 'Rice Lake钓鱼完整攻略：多伦多华人钓友必读',
    description: 'Rice Lake（赖斯湖）钓鱼完整指南。鱼种、季节、装备、钓点、许可证信息，从多伦多出发仅1.5小时车程。',
    image: riceLakeHero,
    author: 'Harris Boat Works',
    datePublished: '2026-04-12',
    dateModified: '2026-04-12',
    publishDate: '2026-04-12',
    category: '钓鱼指南',
    readTime: '9 分钟',
    keywords: ['Rice Lake钓鱼', '多伦多华人钓鱼', '安大略省钓鱼攻略', 'Rice Lake fishing guide Chinese'],
    content: `
## 为什么选择 Rice Lake？

Rice Lake（赖斯湖）是安大略省最受欢迎的钓鱼目的地之一，距离多伦多仅约1.5小时车程。

- **面积**：约100平方公里（37平方英里）
- **深度**：平均深度约4米，适合各种钓法
- **鱼种丰富**：大嘴鲈鱼、小嘴鲈鱼、鲈鱼（Walleye）、北方梭鱼、翻车鱼、鲤鱼等
- **设施完善**：多个船下水点、码头、餐厅

## 主要鱼种和最佳季节

### 鲈鱼（Walleye）

- **最佳季节**：五月至六月（开季后），九月至十月
- **最佳时段**：黎明和黄昏
- **常用饵料**：活饵（蚯蚓、小鱼）、软虫（Jig）
- **推荐区域**：Serpent Mounds附近、湖的东端

### 大嘴鲈鱼（Largemouth Bass）

- **最佳季节**：六月底开季后至九月
- **最佳时段**：清晨和傍晚
- **常用饵料**：软塑料饵、小曲柄钓饵（Crankbait）
- **推荐区域**：岸边浅水区、水草丛附近

### 北方梭鱼（Northern Pike）

- **最佳季节**：五月至六月，九月至十月
- **全天可钓**
- **常用饵料**：匙形亮片、旋转亮片
- **推荐区域**：河口、浅水湾

### 翻车鱼（Panfish: Bluegill, Crappie）

- **最佳季节**：五月至九月
- **适合初学者和小孩**
- **常用饵料**：小型软饵、蚯蚓
- **推荐区域**：码头附近、浅水区

## 钓鱼许可证（Fishing Licence）

在安大略省钓鱼必须持有有效钓鱼许可证：

- **安大略户外卡（Outdoors Card）+ 钓鱼许可证**
- 可在线购买：[ontario.ca/fishing](https://www.ontario.ca/page/fishing)
- 非居民（Visitor）也可以购买短期许可证
- **价格**：居民约$25/年，非居民约$65/年

> 注意：在购买许可证前，请查阅当季的钓鱼规定（Fish ON regulations），了解尺寸限制和数量限制。

## 需要什么装备？

### 基本装备

- 钓竿和卷线器（中等强度，适合多种鱼类）
- 鱼线（8-12磅测试线，适合初学者）
- 钩子、铅坠、浮标
- 各种饵料（活饵或人工饵）
- 抄网
- 冰箱（保存鱼获）

### 安全装备（法律要求）

- 每人一件救生衣（PFD）
- 船上信号装置（哨子或喇叭）
- 系绳
- 如在夜间：航行灯

## Harris Boat Works 与 Rice Lake

Harris Boat Works 就坐落在 Rice Lake 湖畔的 Gores Landing。我们在这片水域生活和工作了近80年。

- **船下水**：可以使用我们的下水坡道
- **发动机服务**：出发前的快速检查和维修
- **本地知识**：关于钓点、水深、鱼情的建议

## 从多伦多出发怎么走

1. 上 **Highway 401 东行**
2. 在Port Hope转 **Highway 115 北行**
3. 转 **County Road 2 西行**
4. 到达 Gores Landing，全程约1.5小时
`,
    faqs: [
      { question: 'Rice Lake可以吃到的鱼安全吗？', answer: '大部分鱼是安全食用的。建议查阅安大略省的鱼类食用指南（Guide to Eating Ontario Fish），其中列出了各湖泊各鱼种的建议食用频率。' },
      { question: '没有船可以钓鱼吗？', answer: '可以。Rice Lake周围有多个岸钓点和码头可以使用。但有船可以到达更多钓点，鱼获会更好。' },
      { question: '可以在Rice Lake租船吗？', answer: '周围有一些度假村提供船只租赁。建议提前预约，尤其是周末和长假期间。' },
      { question: '冬季可以冰钓吗？', answer: '可以。Rice Lake是非常受欢迎的冰钓地点。冰面安全厚度时（通常一月至三月），许多人在此冰钓鲈鱼和翻车鱼。' },
    ],
  },
  {
    slug: 'winterization-mercury-guide-zh',
    title: 'Mercury舷外机冬季保养完整指南：安大略省船主必读',
    description: '安大略省Mercury舷外机冬季保养（Winterization）完整步骤指南。保护您的发动机安全过冬，延长使用寿命。',
    image: winterizationHero,
    author: 'Harris Boat Works',
    datePublished: '2026-04-12',
    dateModified: '2026-04-12',
    publishDate: '2026-04-12',
    category: '维护保养',
    readTime: '7 分钟',
    keywords: ['Mercury冬季保养', '舷外机winterization', '安大略省船冬季存放', 'Mercury winterization guide Chinese'],
    content: `
## 为什么冬季保养很重要？

安大略省的冬季漫长而寒冷，气温可降至零下30度。如果舷外机中残留的水分结冰膨胀，可能造成发动机缸体、冷却系统和管路的严重损坏——维修费用可能高达数千加元。

正确的冬季保养（Winterization）可以：

- 防止冻裂损坏
- 保护燃油系统免受积水和腐蚀
- 延长发动机寿命
- 确保来年春天顺利启动

## 什么时候开始冬季保养？

一般建议在**十月中旬至十一月初**进行。如果您计划在感恩节（十月第二个周一）之后不再使用船只，那么感恩节后就是最佳时机。

## 冬季保养步骤概述

### 第一步：冲洗冷却系统

- 使用淡水彻底冲洗发动机冷却系统
- 排除所有残留水分
- 对于四冲程发动机，确保所有排水口打开

### 第二步：稳定燃油

- 在油箱中加入Mercury品牌燃油稳定剂
- 运行发动机几分钟让稳定剂流遍整个燃油系统
- 这可以防止燃油在冬季变质

### 第三步：更换机油和机油滤芯

- 在发动机温热时排出旧机油
- 更换为Mercury推荐的机油
- 安装新的机油滤芯
- 旧机油中含有酸性物质，长时间停放会腐蚀发动机内部

### 第四步：防雾处理（Fogging）

- 使用Mercury防雾喷雾对汽缸内部进行防腐处理
- 这会在汽缸壁上形成保护油膜
- 防止生锈和腐蚀

### 第五步：齿轮箱机油

- 检查并更换下齿轮箱（Lower Unit）机油
- 检查旧机油是否有水分（乳白色表示有水进入）
- 如果有水分进入，需要检查密封件

### 第六步：电池

- 拆下电池
- 充满电后存放在干燥、不会结冰的地方
- 冬季期间每月检查一次电量

### 第七步：外部保护

- 清洁发动机外壳
- 涂抹防腐蚀喷剂
- 使用发动机罩或合适的盖布保护

## 自己做还是找专业人士？

如果您有经验和工具，部分步骤可以自己完成。但以下情况建议找专业技师：

- 第一次进行冬季保养
- 不确定排水口位置
- 需要更换齿轮箱密封件
- 新购买的二手船

Harris Boat Works 提供完整的冬季保养服务包，包含以上所有步骤。预约请致电或在线联系。

## 春季启动检查

冬季保养做得好，春天启动就简单：

1. 重新安装充满电的电池
2. 检查所有连接是否牢固
3. 检查燃油管路
4. 缓慢启动发动机，检查冷却水流
5. 检查有无异常噪音或漏油
`,
    faqs: [
      { question: '冬季保养费用大约多少？', answer: '专业冬季保养服务通常在$300-$600加元之间，取决于发动机大小和需要的具体服务。这比因冻裂造成的维修费用便宜得多。' },
      { question: '如果忘记做冬季保养会怎样？', answer: '最严重的后果是冷却系统中残留的水结冰，导致缸体破裂。即使没有结冰损坏，燃油变质和腐蚀也会导致春天无法顺利启动。' },
      { question: '可以用普通防冻液代替专业步骤吗？', answer: '不建议。汽车防冻液可能损害舷外机的冷却系统密封件和水泵叶轮。应使用Mercury推荐的产品和正确的排水程序。' },
      { question: '船也需要冬季保养吗？', answer: '是的。除了发动机，船体、电子设备、座椅等也需要冬季保护。建议将船存放在室内或使用合适的保护罩。' },
    ],
  },
  {
    slug: 'mercury-115-vs-150-comparison-zh',
    title: 'Mercury 115马力 vs 150马力舷外机：如何选择？',
    description: 'Mercury FourStroke 115马力和150马力舷外机详细对比。价格、性能、油耗、适用船型全面分析，帮助您做出正确选择。',
    image: mercury115vs150Hero,
    author: 'Harris Boat Works',
    datePublished: '2026-04-12',
    dateModified: '2026-04-12',
    publishDate: '2026-04-12',
    category: '产品对比',
    readTime: '8 分钟',
    keywords: ['Mercury 115 vs 150', 'Mercury舷外机对比', '115马力还是150马力', 'Mercury outboard comparison Chinese'],
    content: `
## 为什么是这两个型号？

Mercury FourStroke 115马力和150马力是安大略省最受欢迎的两个舷外机型号。它们适合大多数家庭游船和中型钓鱼船——也是最多船主在选择时犹豫的两个选项。

## 基本规格对比

| 参数 | Mercury 115 FourStroke | Mercury 150 FourStroke |
|------|----------------------|----------------------|
| 排量 | 2.1升 | 3.0升 |
| 汽缸数 | 4缸 | 4缸 |
| 重量 | 约183公斤 | 约204公斤 |
| 建议适配船长 | 16-19英尺 | 18-22英尺 |

## 性能差异

### 加速和极速

150马力发动机在加速性能上有明显优势，尤其是在满载情况下。如果您经常载3-4人以上出行，150马力可以更轻松地让船"起飞"（达到滑行状态）。

115马力对于轻载（1-2人）的中型船完全足够，但满载时可能感觉动力不太充裕。

### 燃油效率

两款发动机在巡航速度下的燃油效率差异不大。150马力由于排量更大，在怠速和低速时略微费油，但在需要更大功率时效率更高。

> 关键点：如果您的船在115马力下需要全油门才能达到舒适速度，那么选择150马力在巡航转速下反而更省油。

### 噪音

Mercury FourStroke 系列以安静著称。两款发动机在巡航速度下的噪音水平接近。150马力在低转速巡航时甚至可能比115马力更安静，因为它不需要那么高的转速来维持速度。

## 价格差异

150马力比115马力的价格通常高出$2,000-$3,500加元。具体价格差异取决于配置（轴长、操控方式等）。

在 [mercuryrepower.ca](https://mercuryrepower.ca) 可以看到两款发动机的实时加元价格。

## 如何选择？

### 选择115马力如果：

- 您的船长度在18英尺以下
- 通常只有1-2人使用
- 主要用于钓鱼（不需要高速）
- 预算有限
- 船的最大马力标牌在115-150之间

### 选择150马力如果：

- 您的船长度在18英尺以上
- 经常载家人出行（3人以上）
- 需要拖曳滑水或橡皮艇
- 在较大的湖面上航行（需要应对浪况）
- 计划长期使用这艘船
- 船的最大马力标牌允许150

## 专业建议

> 在犹豫的时候，选大一号。发动机在70-80%油门巡航比100%油门巡航更省油、更安静、寿命更长。多花的那几千块钱会在使用体验和燃油费上慢慢回来。

## 实际案例

**案例一**：17英尺铝合金钓鱼船，主要1-2人使用。推荐115马力——足够的动力，更轻的重量对小船更友好。

**案例二**：20英尺碗型游船，经常载一家四口。推荐150马力——满载时轻松滑行，长途巡航更舒适。

**案例三**：18英尺多功能船，钓鱼和家庭兼用。如果预算允许，建议150马力——更多的动力储备意味着更多的灵活性。
`,
    faqs: [
      { question: '115马力够用吗？', answer: '对于18英尺以下的船、主要1-2人使用的情况，115马力完全够用。关键是匹配船的大小和您的使用方式。' },
      { question: '可以把115换成150吗？', answer: '通常可以，但需要确认船的最大马力标牌（max HP plate）允许150。安装可能需要调整操控线缆和安装支架。Harris Boat Works可以评估您的具体情况。' },
      { question: '二手115和新的115价格差多少？', answer: '取决于年份和状况。一般来说，5年左右的二手发动机价格约为新机的50-65%。但新机有完整保修，这是重要的考量因素。' },
      { question: '保修期多长？', answer: 'Mercury FourStroke标准保修3年。通过白金级经销商（如Harris Boat Works）购买，可享受额外保修优惠。' },
    ],
  },
  {
    slug: 'repower-vs-new-boat-zh',
    title: '换新发动机还是买新船？安大略省船主成本分析',
    description: '详细对比换新发动机（Repower）和购买新船的成本、优劣势。帮助安大略省华人船主做出明智的经济决策。',
    image: repowerVsNewHero,
    author: 'Harris Boat Works',
    datePublished: '2026-04-12',
    dateModified: '2026-04-12',
    publishDate: '2026-04-12',
    category: '成本分析',
    readTime: '8 分钟',
    keywords: ['换发动机还是买新船', '安大略省repower', '船只换新成本', 'repower vs new boat Chinese'],
    content: `
## 面临的选择

您的旧发动机开始"罢工"了——维修越来越频繁，零件越来越难找，每次出湖都提心吊胆。现在您面临两个选择：

1. **换新发动机（Repower）** — 保留现有船体，安装全新Mercury发动机
2. **买新船** — 连船带发动机一起换新

这是一个重大的财务决定。让我们用数字来帮您分析。

## 成本对比

### 换新发动机的费用

以最常见的家庭游船（18-20英尺）为例：

- **新Mercury发动机** — 根据马力不同，价格区间较大
- **安装费用** — 包括拆旧机、安装新机、线缆、操控系统等
- **可能的额外费用** — 如果需要更换操控系统、仪表盘或螺旋桨

在 [mercuryrepower.ca](https://mercuryrepower.ca) 可以获取包含安装在内的完整报价。

### 买新船的费用

同样尺寸的新船：

- **船体 + 发动机 + 拖车套装** — 通常是单独换发动机价格的3-5倍
- **加上HST（13%）** — 这是一笔可观的额外费用
- **保险增加** — 新船的保险费通常更高
- **注册和牌照费用**

## 什么时候应该换发动机？

- **船体状况良好** — 没有结构性损坏，不漏水
- **您喜欢这艘船** — 布局、大小、功能都满意
- **船体年龄在合理范围** — 维护良好的玻璃钢船可以使用30年以上
- **预算有限** — 换发动机是性价比最高的选择

## 什么时候应该买新船？

- **船体有明显老化** — 渗水、结构疲劳、严重腐蚀
- **需求已经改变** — 需要更大/更小的船，或不同类型的船
- **想要最新科技** — GPS鱼探一体机、更好的座椅布局等
- **旧船维护成本过高** — 除了发动机，其他部分也需要大量投入

## 旧发动机的价值

您的旧发动机可能还有价值：

- **Trade-in（置换）** — Harris Boat Works 接受旧发动机置换
- **私人出售** — 如果发动机还能运行，可以单独出售
- **零件价值** — 即使不能运行，某些零件仍有价值

## 真实案例

### 案例：18英尺碗型游船，旧90马力发动机

**选择A：换Mercury 115 FourStroke**
- 获得全新发动机，保修3年以上
- 更好的燃油效率（新一代发动机省油约20-30%）
- 更可靠，周末出行不用担心

**选择B：买同级别新船**
- 费用是换发动机的3-4倍
- 获得全新的一切
- 但旧船的处置也是问题

> 在这个案例中，如果船体状况良好，换发动机的性价比远高于买新船。省下来的钱足够支付好几年的燃油和维护费用。

## 融资选择

无论选择换发动机还是买新船，Harris Boat Works 都提供灵活的融资方案：

- 分期付款
- 灵活的还款期限
- 快速审批

详情请访问我们的融资页面或联系我们。
`,
    faqs: [
      { question: '换发动机会影响船的转售价值吗？', answer: '相反，装上全新Mercury发动机会大幅提升船的转售价值。全新发动机的保修可以转让给下一任买家，这是很大的卖点。' },
      { question: '旧船体值得投资换新发动机吗？', answer: '如果船体结构完好、不漏水，通常值得。维护良好的玻璃钢（fiberglass）船体可以使用30年以上。铝合金船体更耐用。' },
      { question: '换了发动机还需要做其他升级吗？', answer: '取决于具体情况。新发动机可能需要匹配新的操控线缆、仪表和螺旋桨。Harris Boat Works会在报价中包含所有必要的配件。' },
      { question: '换发动机需要多少首付？', answer: '融资方案的具体条件因情况而异。请联系我们了解当前的融资政策和可选方案。' },
    ],
  },
  {
    slug: 'ontario-boating-regulations-zh',
    title: '安大略省船只法规与安全要求：华人船主必知',
    description: '安大略省船只操作法规、安全装备要求、驾照规定和保险要求的完整中文指南。确保合法合规地享受水上乐趣。',
    image: regulationsHero,
    author: 'Harris Boat Works',
    datePublished: '2026-04-12',
    dateModified: '2026-04-12',
    publishDate: '2026-04-12',
    category: '法规安全',
    readTime: '9 分钟',
    keywords: ['安大略省船只法规', '加拿大快艇驾照', '船只安全装备要求', 'Ontario boating regulations Chinese'],
    content: `
## 基本法律要求

在安大略省操作动力船只，需要满足以下基本法律要求：

### 快艇驾照（PCOC）

**Pleasure Craft Operator Card（PCOC）**是操作任何动力船只的必需证件。

- **适用范围**：所有操作动力船只的人，无论年龄
- **如何获取**：通过认证机构在线考试
- **费用**：约$50加元
- **有效期**：终身有效
- **考试语言**：提供英语和法语，部分机构提供中文学习材料

推荐考试机构：
- [BOATsmart!](https://www.boatsmart.ca/)
- [BOATERexam](https://www.boaterexam.com/)

> 注意：如果没有PCOC被查到，罚款可达$250加元。

### 船只注册

- 所有装有10马力以上发动机的船只必须获得**许可证号码（Licence Number）**
- 通过Service Canada办理
- 免费，但必须办理
- 号码必须显示在船体两侧

## 必备安全装备

加拿大交通部（Transport Canada）要求所有动力船只配备以下安全装备：

### 所有船只必备

- **救生衣（PFD）** — 每人一件，尺码合适
- **系绳** — 至少15米
- **手动取水装置** — 水桶或手动泵（6米以下船只）
- **声音信号装置** — 哨子或气笛
- **航行灯** — 如果在日落后或日出前航行

### 6米以上船只额外要求

- **船用灭火器** — B-I级或以上
- **锚和锚绳** — 长度足够
- **机械取水装置** — 手动或电动泵

### 8米以上船只额外要求

- **一套烟火信号** — 有效期内
- **救生圈** — 至少一个

## 酒后驾船

**在加拿大，酒后驾船与酒后驾车适用相同的法律**：

- 血液酒精浓度上限：0.08%
- 超过限值：刑事犯罪
- 罚款、吊销PCOC、甚至监禁
- 也适用于操作水上摩托（Jet Ski）和独木舟

> 这一点非常重要。很多人以为在船上喝酒很正常，但操作船只的人必须保持清醒。

## 速度限制

- 大多数水域没有统一速度限制，但有**合理速度**的要求
- 距岸30米以内：最高10公里/小时（约5.4节）
- 特定水域可能有额外限制（通常有标志标明）
- 在码头、游泳区和拥挤水域必须降速

## 保险

虽然加拿大法律不强制要求船只保险，但**强烈建议购买**：

- **责任保险** — 保护您免受事故赔偿
- **船体保险** — 保护船只本身
- **年费** — 通常$300-$800，取决于船的价值和类型

大多数码头和存放设施要求有保险才允许使用。

## 年龄限制

- **12岁以下**：不得单独操作任何动力船只
- **12-15岁**：可操作最大40马力的发动机（需持有PCOC）
- **16岁及以上**：无限制（需持有PCOC）
- **水上摩托**：必须16岁以上

## 紧急情况处理

### 如果遇到紧急情况

1. **保持冷静**
2. **穿上救生衣**
3. **拨打紧急电话**：VHF 16频道 或手机拨打 911
4. **使用信号装置**
5. **留在船上**（除非船在下沉）

### 重要电话

- **紧急情况**：911
- **加拿大海岸警卫队**：1-800-267-6687
- **OPP（安大略省警察）海上单位**：1-888-310-1122

## Harris Boat Works 的安全承诺

每一次发动机安装和维修，我们都确保：

- 所有安全装备齐全
- 操控系统正常工作
- 紧急关闭装置（kill switch）功能正常
- 航行灯和信号装置完好
`,
    faqs: [
      { question: 'PCOC考试难吗？', answer: '不难。在线学习材料很全面，考试是多选题形式。大多数人第一次就能通过。建议花几个小时学习后参加考试。' },
      { question: '中国驾照在加拿大可以开船吗？', answer: '不可以。中国没有与PCOC等同的证件。您需要在加拿大重新考取PCOC。好消息是考试很简单，在线即可完成。' },
      { question: '如果安全装备不齐全会怎样？', answer: '加拿大交通部和RCMP/OPP有权在水上检查任何船只。如果安全装备不齐全，可能面临罚款。更重要的是，安全装备关乎生命安全。' },
      { question: '需要给船买保险吗？', answer: '虽然法律不强制要求，但强烈建议购买。大多数码头要求有保险。责任保险可以保护您免受高额事故赔偿。' },
    ],
  },
  {
    slug: 'chinese-mercury-outboard-guide-toronto',
    title: '大多伦多华人买 Mercury 船外机指南',
    description: '给 GTA 华人船主的 Mercury 船外机中文指南：如何选马力、比较 FourStroke/Pro XS/Verado、理解安省使用情境，并用 Harris Boat Works 透明报价工具看真实加币价格。',
    image: newImmigrantHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: 'Mercury 中文指南',
    readTime: '6 分钟',
    keywords: ['多伦多 Mercury 船外机', 'GTA 华人船主', '安省船外机中文', 'Mercury repower 中文', 'Harris Boat Works 中文'],
    content: `
## 快速答案

如果你住在大多伦多地区，正在买 Mercury 船外机，最重要的不是先问「哪一台最便宜」，而是先确认你的船型、船长、载重、使用湖区、最大马力限制与操控方式。船外机不是单独买一台马达而已，它会影响起步、油耗、操控、钓鱼体验、家庭乘坐感，以及未来维修保养。

Harris Boat Works 位于 Rice Lake 的 Gores Landing，是 1947 年成立的第三代家族 marina，也是 Mercury Marine Platinum Dealer。对华人买家来说，最大的好处是可以先在 MercuryRepower.ca 看透明加币报价，不需要一开始就打电话、被推销、或猜最后落地价。

## 为什么华人买家特别适合先做功课

很多华人客户买车、买房、买船都习惯先研究。这是好事。船外机市场最大问题不是信息太少，而是信息太碎：有人在 Facebook 说一套、YouTube 说一套、朋友的船又是另一套。

在安省，船外机选错通常不是「不能用」，而是用得不舒服。马力太小，载满家人、钓具、油箱、cooler 时起步慢。马力太大，可能超过船身 capacity plate，不合法也不安全。齿轮箱、轴长、控制方式、prop 选错，花了钱也不一定跑得好。

### HBW dealer note

很多人试船时只有两个人在船上，真正使用时却是夏天周末：满油、满人、钓具、冰箱、狗、小孩，还可能有逆风。选马力要用「最常见的真实使用情境」来想，不要只看空船数字。

## 先看这 5 个问题

| 问题 | 为什么重要 |
|---|---|
| 船的最大 HP rating 是多少？ | 不能超过船身标牌允许的最大马力。 |
| 船主要用来钓鱼、家庭巡航，还是拖水上玩具？ | 用途决定马力、prop 与 motor family。 |
| 你常在哪个湖用？ | Rice Lake、Kawarthas、Lake Simcoe 的水况和距离不同。 |
| 常载几个人？ | pontoon 与家庭船常常不是空船使用。 |
| 你想要安静、省油、加速，还是高级操控？ | FourStroke、Pro XS、Verado 的重点不同。 |

## Mercury 系列怎么简单理解

| Mercury 系列 | 适合谁 | 中文理解 |
|---|---|---|
| FourStroke | 大多数家庭、钓鱼、休闲船主 | 安静、省心、用途最广。 |
| Pro XS | 重视加速、hole shot、钓鱼性能的人 | 偏性能、反应更快。 |
| Verado | 大型或高级船、追求安静与精致操控 | 更高级、更安静、更顺。 |
| Command Thrust | pontoon、重载船、需要更好推力 | 不是一个独立系列，而是齿轮箱/推力配置。 |

## GTA 买家为什么愿意开到 Rice Lake

从多伦多、Markham、Richmond Hill、Scarborough、North York 或 Mississauga 到 Rice Lake，不是最近的路。但很多人愿意来，是因为买船外机不是一次交易。你之后还需要 rigging、prop、保养、winterization、问题诊断和保固支持。

HBW 的优势不是「最大展示厅」。真正的优势是我们在 Rice Lake 做了很久，懂本地船主怎么使用船，也愿意把价格和选项讲清楚。这对不想被 dealer game 浪费时间的客户很重要。

## 你的下一步

如果你已经知道船型和大概马力，先用 MercuryRepower.ca 创建报价。你可以比较不同马力与系列，再决定要不要联系 HBW 确认 shaft length、controls、prop 和安装细节。

**CTA：** 想先看真实加币价格？到 MercuryRepower.ca 创建你的 Mercury 船外机报价。
`,
    faqs: [
      { question: '我可以只买马达自己装吗？', answer: '有些情况可以，但多数 repower 不只是把旧马达拆掉、新马达挂上去。controls、cables、gauge、prop、shaft length、transom 状况都要确认。' },
      { question: 'Mercury 一定比其他品牌好吗？', answer: '每个品牌都有适合的客户。HBW 是 Mercury Marine Platinum Dealer，所以我们最熟的是 Mercury 的产品、保养、保固和 rigging。对想要 Mercury 的安省船主，这是好事。' },
      { question: '我英文不好，可以先看中文内容再决定吗？', answer: '可以。这个中文内容枢纽就是为了让华人船主先理解重点。真正下单前，HBW 仍会确认英文型号、规格与报价细节。' },
    ],
  },
  {
    slug: 'ontario-chinese-boating-license-fishing-guide',
    title: '安省华人船主入门：PCOC、PCL、钓鱼证一次讲清楚',
    description: '安省华人船主中文入门：PCOC 船只操作证、PCL 船牌、钓鱼证、Outdoors Card、租船例外与 10HP 规则一次讲清楚。',
    image: regulationsHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: '安省法规中文',
    readTime: '8 分钟',
    keywords: ['安省船牌 PCOC PCL', 'Ontario fishing license 中文', '安省钓鱼证', 'Pleasure Craft Licence 中文', '华人船主'],
    content: `
## 快速答案

在安省开有马达的休闲船，你通常需要能证明自己有基本安全知识的文档，例如 Pleasure Craft Operator Card（PCOC）；Transport Canada 说，只要你在加拿大操作 recreational motor boat，就需要 proof of competency，而且电动 trolling motor 也算 motor 类型之一（[Transport Canada PCOC](https://tc.canada.ca/en/marine-transportation/preparing-operate-your-vessel/pleasure-craft-operator-card-pcoc)）。如果你的休闲船有一个或多个引擎，总马力至少 10HP，且主要在加拿大水域使用，通常还需要 Pleasure Craft Licence（PCL）（[Transport Canada PCL](https://tc.canada.ca/en/marine-transportation/vessel-licensing-registration/licensing-pleasure-craft/apply-manage-pleasure-craft-licence-pcl/apply-manage-pleasure-craft-licence-pcl)）。

如果你要钓鱼，还要看 Ontario fishing licence、Outdoors Card、鱼种、湖区和 FMZ 规则。安省政府也提供繁体中文的 Ontario Fishing Regulations Summary，这对华人钓友很有用（[Ontario Fishing Regulations Summary Traditional Chinese](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese)）。

## 先分清楚：PCOC、PCL、钓鱼证不是同一件事

| 名称 | 中文理解 | 管什么 |
|---|---|---|
| PCOC | 开船安全知识卡 | 你这个人是否有操作动力船的基本资格。 |
| PCL | 船牌/船只识别号码 | 这艘船是否需要显示 licence number。 |
| Fishing licence | 钓鱼证 | 你是否可以合法钓鱼，以及可钓鱼种与数量。 |
| Outdoors Card | 户外卡 | 安省钓鱼/打猎执照系统的一部分。 |

### HBW dealer note

很多新船主会把 PCOC 和 PCL 混在一起。简单说：PCOC 比较像「人能不能开」，PCL 比较像「船需不需要号码」。钓鱼证是另一件事。

## PCOC：开船的人要懂安全

Transport Canada 表示，PCOC 通常是通过安全课程与测验后取得；课程与测验由 Transport Canada 认可的 course providers 提供，PCOC 有效期是 lifetime（[Transport Canada PCOC](https://tc.canada.ca/en/marine-transportation/preparing-operate-your-vessel/pleasure-craft-operator-card-pcoc)）。

如果你只是租船，完成 Rental Boat Safety Checklist 可以在租船期间作为 proof of competency，但只限那次租船期间（[Transport Canada PCOC](https://tc.canada.ca/en/marine-transportation/preparing-operate-your-vessel/pleasure-craft-operator-card-pcoc)）。这点对第一次带朋友来 Rice Lake 或 Kawarthas 租船的华人家庭很重要。

## PCL：10HP 是重要门槛

Transport Canada 说，休闲船如果有一个或多个引擎，总马力至少 10HP，并且主要在加拿大水域使用，通常需要 Pleasure Craft Licence；PCL number 必须显示在船头两侧（[Transport Canada PCL](https://tc.canada.ca/en/marine-transportation/vessel-licensing-registration/licensing-pleasure-craft/apply-manage-pleasure-craft-licence-pcl/apply-manage-pleasure-craft-licence-pcl)）。

新的、转让的、更新的 PCL 有效期为 5 年；如果没有有效 PCL，可能面临 $250 fine（[Transport Canada PCL](https://tc.canada.ca/en/marine-transportation/vessel-licensing-registration/licensing-pleasure-craft/apply-manage-pleasure-craft-licence-pcl/apply-manage-pleasure-craft-licence-pcl)）。

## 钓鱼证：看人、看日期、看湖区

安省钓鱼不是「买一支竿就可以」。你要看自己是 Ontario resident、Canadian resident 还是 non-resident，也要看 sport licence 或 conservation licence，还要看 FMZ、鱼种、season、size limit、daily catch and possession limit。

安省政府的繁体中文钓鱼规则摘要页面说明，该年度指南包含 recreational fishing licences、open seasons、catch limits，以及南安省 fishing zones 的规则（[Ontario Fishing Regulations Summary Traditional Chinese](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese)）。

## Rice Lake / Kawarthas 要注意 FMZ 17

Rice Lake 与 Kawarthas 内容通常要查 FMZ 17。FMZ 17 属于 Southern Bait Management Zone，活或死的 baitfish / leeches 通常不能被运入或运出该 BMZ，已死亡且保存处理的 baitfish 和 leeches 则不适用同一限制（[Ontario FMZ 17](http://www.ontario.ca/document/ontario-fishing-regulations-summary/fisheries-management-zone-17)）。

## Lake Simcoe 要查 FMZ 16 和水体例外

很多 GTA 华人钓友熟悉 Lake Simcoe，但每个湖的规则不能靠朋友口耳相传。Lake Simcoe 属于 FMZ 16，且官方规则中有 Lake Simcoe / Lake Couchiching / Green River / Trent Canal System 的 waterbody exception；钓鱼前应查官方 FMZ 与水体例外，尤其是季节、鱼种、尺寸和 bait 规则（[Ontario FMZ 16](http://www.ontario.ca/document/ontario-fishing-regulations-summary/fisheries-management-zone-16)）。

## 你的下一步

如果你正在买第一艘船或第一次 repower，不要只问马力。先确认：你有没有 PCOC？船是否需要 PCL？常去的湖属于哪个 FMZ？你主要是钓鱼、家庭出游，还是两者都有？

**CTA：** 如果你的船已经准备换 Mercury 船外机，到 MercuryRepower.ca 先看透明加币报价，再和 HBW 确认规格。
`,
    faqs: [
      { question: '我有中国驾照，可以在安省开船吗？', answer: '汽车驾照和加拿大 recreational boating proof of competency 不是同一件事。是否符合要求要看 Transport Canada 的 proof of competency 规则。' },
      { question: '租船也要 PCOC 吗？', answer: '租船期间，完成 Rental Boat Safety Checklist 可作为 proof of competency，但只适用于租船期间（[Transport Canada PCOC](https://tc.canada.ca/en/marine-transportation/preparing-operate-your-vessel/pleasure-craft-operator-card-pcoc)）。' },
      { question: '10HP 以下就什么都不用管吗？', answer: '不是。10HP 是 PCL 的重要门槛之一，但 PCOC、钓鱼证、安全设备、湖区规则仍要看你的使用情况。' },
    ],
  },
  {
    slug: 'chinese-anglers-rice-lake-kawarthas-outboard',
    title: '多伦多华人钓友：Rice Lake 与 Kawarthas 钓鱼船马力怎么选',
    description: '给多伦多华人钓友的 Rice Lake 与 Kawarthas 船外机选购指南：铝船、bass boat、kicker、tiller、40-60HP、90-115HP 怎么选。',
    image: riceLakeHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: '钓鱼指南',
    readTime: '7 分钟',
    keywords: ['Rice Lake 华人钓鱼船外机', 'Kawarthas 钓鱼船', 'Toronto Chinese anglers', 'Mercury fishing outboard 中文'],
    content: `
## 快速答案

Rice Lake 和 Kawarthas 钓鱼船选马力，不能只看最高速度。对钓友来说，低速操控、起步、载重、稳定性、trolling 配置和保养便利性，往往比多跑几公里时速更重要。

如果是 14-16 呎铝船，常见会看 20-60HP 区间；如果是更大的铝船、bass boat 或多用途钓鱼船，可能会进入 75-115HP 或更高。最终仍要以船身 capacity plate 和实际使用方式为准。

## 华人钓友常见的真实使用情境

很多 GTA 华人钓友不是天天住在湖边，而是周末从 Toronto、Markham、Richmond Hill、Scarborough 或 North York 开车出发。这代表船的使用时间很珍贵：到湖边后，你不想花半天处理启动问题、马力不足、prop 不合或控制不顺。

### HBW dealer note

钓鱼船最怕「看起来够用，实际上不够用」。两个人、半箱油、没风的测试结果，不能代表三个钓友、满载装备、逆风回航的情况。

## 钓鱼船马力初步参考

| 船型 / 用途 | 常见 Mercury 区间 | 适合情境 |
|---|---|---|
| 小型铝船、近岸钓鱼 | 9.9-20HP | 轻载、短距离、简单维护。 |
| 14-16 呎铝船 | 25-60HP | Rice Lake / Kawarthas 常见钓鱼使用。 |
| 16-18 呎铝船、多用途钓鱼 | 60-115HP | 更好的载重与起步能力。 |
| bass boat / tournament style | Pro XS 系列常见 | 重视 hole shot、加速与操控。 |
| trolling / backup | 9.9 ProKicker 或小马力 | 长时间低速控制与辅助动力。 |

## Rice Lake 使用情境

Rice Lake 有很多钓鱼和家庭 boating 使用混在一起的情况。夏天周末交通、风向、浅水、杂草区、码头进出，都会让「低速控制」和「可靠启动」变得重要。

如果你的船主要用在 Rice Lake，不一定要追求最高马力，但要避免明显 underpower。尤其是铝船或 pontoon 满载后，低马力会让船难以有效 plane，耗油也不一定更省。

## Kawarthas 使用情境

Kawarthas 的湖与 Trent-Severn 水道让船主常常不是只在一个点钓鱼。你可能会跑一段水路、过 lock、停靠不同码头，也可能从钓鱼变成家庭巡航。这时 motor 的稳定性、低速操控和中段加速就很重要。

FMZ 17 的官方规则包含鱼种 season、limits 与 bait management zone 注意事项，钓鱼前应查官方页面，而不是只看旧论坛或朋友转传（[Ontario FMZ 17](http://www.ontario.ca/document/ontario-fishing-regulations-summary/fisheries-management-zone-17)）。

## FourStroke 还是 Pro XS？

| 如果你重视 | 优先看 |
|---|---|
| 安静、省油、日常可靠 | Mercury FourStroke |
| 起步、加速、钓鱼性能 | Mercury Pro XS |
| 载重、pontoon 或需要更大推力 | Command Thrust 配置 |
| 高级操控、安静和大船体验 | Verado |

## 钓友最容易忽略的 3 件事

1. **Prop 比你想像更重要。** 同一台马达，prop 不同，起步和最高速度都会不同。
2. **Shaft length 不能猜。** 错轴长会影响性能、操控和安全。
3. **旧 rigging 不一定适合新马达。** 控制线、gauge、油路、电路都要检查。

## 你的下一步

先确认你的船长、最大 HP rating、常载人数、常去湖区，再用 MercuryRepower.ca 看不同马力区间的加币价格。不要只比较 motor-only price，要看完整 rigging 和安装后的实际效果。

**CTA：** 想知道你的钓鱼船适合 40HP、60HP 还是 90HP？先用 MercuryRepower.ca 创建报价，再请 HBW 帮你确认配置。
`,
    faqs: [
      { question: 'Rice Lake 钓鱼船需要很大马力吗？', answer: '不一定。很多钓鱼船重点不是最大马力，而是合适马力、正确 prop、稳定启动和低速控制。' },
      { question: '华人钓友常买 kicker 吗？', answer: '如果常 trolling、想要辅助动力或长时间低速控制，小马力 kicker 很有意义。' },
      { question: '我可以照朋友的船配一样马力吗？', answer: '只能当参考。船长、船重、hull、载重、用途不同，结果会不同。' },
    ],
  },
  {
    slug: 'chinese-anglers-lake-simcoe-mercury-outboard',
    title: 'Lake Simcoe 华人钓友船外机指南',
    description: '给 Lake Simcoe 华人钓友的 Mercury 船外机中文指南：钓鱼船马力、kicker、trolling、安省规则、GTA 出发买船外机重点。',
    image: riceLakeHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: '钓鱼指南',
    readTime: '7 分钟',
    keywords: ['Lake Simcoe 华人钓鱼 Mercury', 'Lake Simcoe Chinese anglers', 'Mercury kicker 中文', '安省华人钓友'],
    content: `
## 快速答案

Lake Simcoe 对 GTA 华人钓友很有吸引力，因为距离多伦多不算远，又有丰富钓鱼文化。但 Lake Simcoe 的船外机选择不能只看「能不能跑」。你要考虑开放水面、风浪、低速 trolling、季节变化、载重，以及你是否需要 kicker 或更可靠的主机。

钓鱼规则方面，钓友应直接查安省官方 fishing regulations 和相关 FMZ / waterbody exception，不要靠旧文章或群组截屏做最后判断。安省政府提供繁体中文钓鱼规则摘要页，适合华人钓友作为入口（[Ontario Fishing Regulations Summary Traditional Chinese](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese)）。

## Lake Simcoe 买 motor 的思考方式

很多 Lake Simcoe 钓友的船不是纯休闲船。它可能是周末钓鱼工具，也可能是家庭船，也可能春秋钓鱼、夏天载家人。这种混合用途最容易买错马力。

### HBW dealer note

如果你常去 Lake Simcoe，不要只问「这台能跑多快」。更重要的是：风起来时能不能安心回航？低速控制够不够细？载满装备时起步会不会拖？

## 常见 Lake Simcoe 钓友配置

| 使用方式 | 建议思考 |
|---|---|
| 近岸钓鱼、小铝船 | 9.9-25HP 可能够，但要看船长与载重。 |
| 14-16 呎铝船 | 25-60HP 是常见研究区间。 |
| 16-18 呎钓鱼船 | 60-115HP 常见，视 hull 和最大 rating。 |
| 需要 trolling | 考虑 kicker 或电动 trolling motor 搭配。 |
| 重视性能 | 看 Pro XS 或合适的 FourStroke 高马力。 |

## Kicker 对钓友有什么价值

Kicker 不是每个人都需要，但对钓友很有用。它可以让你长时间低速控制，也可以在主机出状况时多一个回航选项。对常常花一整天在湖上的人来说，这是安心感。

小马力 Mercury 或 ProKicker 要看 shaft length、steering、fuel setup 和 mounting 空间。不要只看 horsepower。

## 安省规则不要靠记忆

安省不同 FMZ 有不同 season、limits、waterbody exceptions 和 bait rules。Lake Simcoe 属于 FMZ 16，官方 FMZ 16 规则也提到该区属于 Southern Bait Management Zone，活或死的 baitfish / leeches 通常不能被运入或运出 BMZ，已死亡且保存的 baitfish 和 leeches 例外（[Ontario FMZ 16](http://www.ontario.ca/document/ontario-fishing-regulations-summary/fisheries-management-zone-16)）。

钓鱼前请以官方最新规则为准。中文社群信息很好用，但最后判断要看官方页面。

## Lake Simcoe 与 Rice Lake 的差别

| 重点 | Lake Simcoe | Rice Lake / Kawarthas |
|---|---|---|
| 水面感觉 | 更开阔，风浪要更重视 | 湖区与水道使用更多元 |
| 钓鱼文化 | 华人钓友熟悉度高 | HBW 本地经验更深 |
| 船外机重点 | 可靠回航、低速控制、载重 | 多用途、local service、repower fit |

## 你的下一步

如果你是 GTA 华人钓友，正在为 Lake Simcoe 或其他安省湖区选 Mercury，先列出你的船型、船长、常载人数、主要钓法、是否 trolling，再看 MercuryRepower.ca 的报价。HBW 可以帮你确认 motor family、马力、shaft length 和 rigging 是否合理。

**CTA：** 用 MercuryRepower.ca 先看 Mercury 船外机真实加币报价，再让 HBW 帮你判断是否适合你的钓鱼船。
`,
    faqs: [
      { question: 'Lake Simcoe 钓鱼一定要 kicker 吗？', answer: '不一定。但如果你常 trolling、长时间在湖上，或想要更安心的备用动力，kicker 值得研究。' },
      { question: 'Pro XS 适合 Lake Simcoe 钓友吗？', answer: '如果你重视 hole shot、加速和钓鱼性能，Pro XS 值得看。如果你更重视安静和一般巡航，FourStroke 可能更自然。' },
      { question: '我可以用中文规则摘要吗？', answer: '可以作为入口，但钓鱼前仍建议查最新官方规则和对应 FMZ 页面。' },
    ],
  },
  {
    slug: 'chinese-family-pontoon-mercury-outboard',
    title: '华人家庭买 pontoon：Mercury 船外机怎么配才不后悔',
    description: '给 GTA 华人家庭的 pontoon 船外机中文指南：马力、Command Thrust、载重、家庭安全、Rice Lake/Kawarthas 使用情境与 Mercury 报价。',
    image: newImmigrantHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: '家庭买船指南',
    readTime: '6 分钟',
    keywords: ['pontoon Mercury 中文', '华人家庭 pontoon', '安省 pontoon 船外机', 'Mercury Command Thrust 中文'],
    content: `
## 快速答案

Pontoon 买 Mercury 船外机，最容易犯的错是只看空船、少人、平水面的表现。真正使用时，pontoon 常常载家人、朋友、食物、cooler、狗、浮具和满油。马力太小会让船起步慢、转向重、逆风吃力，也可能让油耗不如想像。

对很多安省家庭 pontoon，正确的问题不是「最低可以配几匹」，而是「我们平常怎么用这艘船，什么马力才不会后悔」。

## 华人家庭 pontoon 的典型情境

很多 GTA 华人家庭买 pontoon，不只是为了自己开船。它是家庭聚会、父母来加拿大探亲、孩子暑假、朋友周末、钓鱼和日落巡航的工具。这类使用最怕船外机不够力，因为每次出船都不是一两个人。

### HBW dealer note

Pontoon 的马力要用「夏天周末满载」来想，不要用「展示时空船」来想。你买的不是 showroom 表现，是全家上船后的真实体验。

## Pontoon 马力初步参考

| Pontoon 使用方式 | 常见思考方向 |
|---|---|
| 慢速巡航、少人使用 | 可看较低马力，但仍要确认船厂 rating。 |
| 家庭巡航、常载 4-8 人 | 90-115HP 常被研究。 |
| 载重大、想更好起步 | 看 Command Thrust 或更高马力。 |
| 水上玩具、拖 tube | 不要 underpower，起步和中段推力很重要。 |
| 高级舒适体验 | Verado 或更高级配置值得比较。 |

## Command Thrust 是什么

Command Thrust 不是另一个品牌，也不是一个完全独立 motor family。你可以把它理解为 Mercury 某些马力/型号上的「更有推力的齿轮箱配置」。它通常适合较重、载重较高、需要更好低速推力的船，例如 pontoon。

对 pontoon 来说，Command Thrust 的价值通常不是最高速度，而是低速控制、起步、满载推力和更适合大直径 prop 的能力。

## FourStroke、Pro XS、Verado 怎么看

| 系列 | Pontoon 上的角色 |
|---|---|
| FourStroke | 最通用，安静、省心，适合多数家庭。 |
| Pro XS | 如果想要更强起步和更运动化反应，可研究。 |
| Verado | 更安静、更精致，适合高级 pontoon。 |
| Command Thrust | 对重载 pontoon 很有价值，尤其是推力需求高时。 |

## 不要只比较 motor-only price

Pontoon repower 可能牵涉 rigging、controls、prop、gauge、steering、battery、mounting 与旧系统兼容性。你应该比较的是「装好、调好、能安心用」的整体价值，不是单独 motor 价格。

## 你的下一步

先确认 pontoon 长度、最大 HP rating、常载人数、是否拖 tube、是否常在 Rice Lake / Kawarthas 使用，再用 MercuryRepower.ca 看不同 Mercury 配置的加币价格。

**CTA：** 不确定 pontoon 应该配 90HP、115HP 还是更高？先创建 Mercury 报价，HBW 可以帮你确认真实使用情境。
`,
    faqs: [
      { question: 'Pontoon 配低马力会比较省油吗？', answer: '不一定。马力太小导致长时间高负荷运转，实际油耗和体验可能都不好。' },
      { question: 'Command Thrust 一定需要吗？', answer: '不是每艘 pontoon 都需要，但重载、家庭使用、想要更好推力时很值得比较。' },
      { question: '家庭 pontoon 要不要买最大马力？', answer: '不一定。最好的选择是符合船身 rating、使用情境和预算的平衡点。' },
    ],
  },
  {
    slug: 'chinese-boat-repower-vs-new-boat-ontario',
    title: 'Repower 还是换船？给安省华人船主的现实判断',
    description: '旧船要换 Mercury 船外机还是直接换船？给安省华人船主的现实判断：船体、预算、使用情境、保值与 HBW repower 建议。',
    image: repowerVsNewHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: '决策指南',
    readTime: '7 分钟',
    keywords: ['repower 还是换船 中文', 'Mercury repower 中文', '安省船主', '旧船换马达', 'Harris Boat Works repower'],
    content: `
## 快速答案

如果你的船体结构健康、尺寸和格局仍适合你的家庭或钓鱼方式，而问题主要是旧船外机不可靠、太吵、太耗油或维修不划算，repower 通常值得认真比较。如果船体已经软、烂、漏水、格局不适合，或你其实已经想换更大的船，那换船可能更合理。

Repower 的内核不是「省钱」而已，而是保留一艘你熟悉、喜欢、适合你湖区的船，同时换上可靠的新 Mercury 动力。

## 华人船主常见的犹豫

很多华人船主很理性，会把每一笔花费算清楚。这很正常。但 repower 的判断不能只看「新马达多少钱」和「二手船多少钱」。你要比较的是完整成本、风险、时间、熟悉度和未来几年的使用品质。

### HBW dealer note

一艘好 hull 加上一台累了的旧 motor，是 repower 候选。一艘累了的 hull 加上一台累了的 motor，通常是换船候选。

## Repower 适合你的情况

| 情况 | 为什么适合 repower |
|---|---|
| 船体结构健康 | 新 motor 能延长整艘船的可用年限。 |
| 船的大小和格局仍适合 | 不需要为了换 motor 连整艘船都换掉。 |
| 旧 motor 维修越来越频繁 | 新 Mercury 可能让季节更安心。 |
| 你熟悉这艘船 | docking、载重、钓鱼位置都已经习惯。 |
| 二手船市场不透明 | 换一艘二手船可能只是换来另一组未知问题。 |

## 换船比较适合的情况

| 情况 | 为什么可能该换船 |
|---|---|
| transom、floor、stringers 有结构问题 | 新 motor 挂在坏船体上不值得。 |
| 家庭已经长大，船太小 | Repower 解决不了空间问题。 |
| 你想从钓鱼船改成 pontoon | 用途变了，船也该变。 |
| 船体价值太低 | 完整 repower 成本可能不合理。 |
| 你其实已经不喜欢这艘船 | 不要花钱试图重新爱上它。 |

## Repower 决策树

1. **船体健康吗？** 如果 transom、floor、hull 都健康，继续看下一步。
2. **这艘船还适合你的用途吗？** 如果家庭、钓鱼、湖区使用仍合适，repower 有意义。
3. **完整 repower 成本合理吗？** 要包含 motor、rigging、controls、prop 和安装，不只 motor-only price。
4. **你想再用 5-10 年吗？** 如果答案是 yes，repower 更值得研究。

## 为什么 MercuryRepower.ca 对华人买家有用

很多 dealer 不把价格说清楚，让客户必须打电话、等回复、再猜最后总价。MercuryRepower.ca 的价值是让你先看到真实加币报价，把研究主导权拿回来。

这不代表网站能取代最后的 dealer 确认。它的作用是让你先知道大概选项和价格，再让 HBW 确认规格是否真的适合你的船。

## 你的下一步

拍下你的船、旧 motor、capacity plate、transom、controls 和任何现有 gauge。先用 MercuryRepower.ca 创建报价，再让 HBW 判断哪些旧系统可以保留，哪些应该一起更新。

**CTA：** 如果你的旧船还值得留，先用 MercuryRepower.ca 看 Mercury repower 报价。
`,
    faqs: [
      { question: 'Repower 一定比换船便宜吗？', answer: '不一定。但如果 hull 好、用途合适，repower 可能比换另一艘未知状况的二手船更理性。' },
      { question: '旧 controls 可以沿用吗？', answer: '要看型号、年份、兼容性和状况。不要假设一定能用。' },
      { question: '我可以先拿报价再决定吗？', answer: '可以。这正是 MercuryRepower.ca 的用途。' },
    ],
  },
  {
    slug: 'mercury-fourstroke-pro-xs-verado-chinese-comparison',
    title: 'Mercury FourStroke、Pro XS、Verado 差在哪？中文完整比较',
    description: 'Mercury FourStroke、Pro XS、Verado 差在哪？给安省华人船主的中文比较：家庭巡航、钓鱼、pontoon、性能与高级船外机怎么选。',
    image: mercury115vs150Hero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: 'Mercury 型号比较',
    readTime: '7 分钟',
    keywords: ['Mercury FourStroke Pro XS Verado 中文', 'Mercury 船外机比较', 'Pro XS 中文', 'Verado 中文'],
    content: `
## 快速答案

Mercury FourStroke 是最通用的选择，适合多数家庭、钓鱼和日常 boating。Pro XS 更偏性能，适合重视 hole shot、加速和钓鱼反应的船主。Verado 则偏高级、安静、精致操控，适合较大或更 premium 的船。

不要把 Pro XS 当成「旧式二行程」来理解。现在 Mercury Pro XS 系列包含现代 FourStroke 技术与性能调校，选它的理由是性能感和用途，不是因为它是旧观念里的 two-stroke。

## 一张表先看懂

| 系列 | 最适合 | 你会喜欢它，如果你想要 |
|---|---|---|
| FourStroke | 家庭、钓鱼、一般用途 | 安静、可靠、省心、用途广。 |
| Pro XS | 钓鱼、性能船、重视反应 | 更强 hole shot、更运动化加速。 |
| Verado | 高级船、大船、舒适巡航 | 更安静、更精致、更 premium 的操作感。 |
| Command Thrust | Pontoon、重载船 | 更好低速推力与大 prop 能力。 |

### HBW dealer note

同样是 Mercury，买错系列不一定会「不能用」，但可能会让你每次出船都觉得差一点。FourStroke、Pro XS、Verado 的差异不是面子问题，是用途问题。

## FourStroke：大多数人的安全选择

FourStroke 适合想要一台安静、可靠、用途广的 Mercury。家庭巡航、钓鱼、cottage boat、pontoon、铝船都可能适合 FourStroke。

如果你不追求最强加速，也不需要最高级的操控感，FourStroke 往往是最自然的起点。

## Pro XS：钓鱼与性能导向

Pro XS 适合重视性能反应的人。钓鱼船、bass boat、想要更快起步和更运动化感觉的船主，常会研究 Pro XS。

如果你常满载起步、需要更好的 hole shot，或喜欢更有反应的操控，Pro XS 值得比较。

## Verado：高级、安静、精致

Verado 是 Mercury 更 premium 的选择，重点是精致感、安静、操控和大船体验。不是每艘船都需要 Verado，但对高级 pontoon、较大 fiberglass boat 或重视舒适的客户，它可能很有吸引力。

## Command Thrust：不要误会它

Command Thrust 不是跟 FourStroke、Pro XS、Verado 平行的完整 motor family。它更像是某些 Mercury 配置中的推力/齿轮箱选项。对 pontoon、重载船或需要大 prop 的船，它可能非常重要。

## 怎么选

| 你的情况 | 优先研究 |
|---|---|
| 第一台 Mercury，不想复杂 | FourStroke |
| 铝船钓鱼、想要好起步 | Pro XS 或合适 FourStroke |
| Pontoon 满载家庭使用 | FourStroke + Command Thrust |
| 高级 pontoon 或大船 | Verado |
| 预算敏感但想可靠 | FourStroke |

## 你的下一步

不要只问朋友「哪台最好」。先问自己：我这艘船主要做什么？常载多少人？在哪个湖？想要安静、省心、性能，还是高级感？

**CTA：** 到 MercuryRepower.ca 比较 FourStroke、Pro XS、Verado 的加币报价，再让 HBW 帮你确认哪个系列最适合你的船。
`,
    faqs: [
      { question: 'Pro XS 比 FourStroke 好吗？', answer: '不是「好或不好」，而是用途不同。Pro XS 偏性能，FourStroke 更通用。' },
      { question: 'Verado 值得多花钱吗？', answer: '如果你重视安静、精致操控和 premium 体验，值得比较。如果只是小铝船日常钓鱼，可能不是第一选择。' },
      { question: 'Command Thrust 是另一个系列吗？', answer: '不是。它是特定配置/齿轮箱方向，常见价值在重载和 pontoon 使用。' },
    ],
  },
  {
    slug: 'mercury-9-9-20hp-chinese-kicker-tiller-guide',
    title: '9.9 到 20 匹 Mercury：钓鱼小船、kicker、tiller 中文指南',
    description: 'Mercury 9.9HP、15HP、20HP 船外机中文指南：小铝船、kicker、tiller、钓鱼、trolling、安省华人钓友怎么选。',
    image: riceLakeHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: '小马力指南',
    readTime: '6 分钟',
    keywords: ['Mercury 9.9 20HP 中文', 'Mercury kicker 中文', 'tiller 船外机中文', '小铝船 Mercury'],
    content: `
## 快速答案

9.9 到 20HP Mercury 适合小铝船、轻载钓鱼、kicker、trolling 或某些 horsepower-limited 湖区。对华人钓友来说，这个马力区间常常不是追求速度，而是追求可靠、好启动、低速控制、容易保养和符合规则。

但不要因为马力小就随便买。shaft length、手柄或遥控、电启或手拉、是否当 kicker、船尾高度和实际载重，都会影响选择。

## 9.9HP 为什么常被问

9.9HP 在安省很常见，因为它常出现在小船、钓鱼、辅助机和某些限制情境。很多华人钓友会问：「9.9 够不够？」答案是：看船。

小铝船、两人钓鱼、短距离使用，9.9 可能很合理。可是如果船重、人多、装备多、风大，9.9 就可能很吃力。

### HBW dealer note

9.9HP 最容易被高估，也最容易被低估。船很小时它很好用；船稍微重一点、载重多一点，就会明显感觉不够。

## 9.9、15、20HP 怎么想

| 马力 | 适合情境 | 注意 |
|---|---|---|
| 9.9HP | 小船、kicker、低速钓鱼 | 载重增加后可能吃力。 |
| 15HP | 想比 9.9 多一点余裕 | 仍要看船身 rating。 |
| 20HP | 小铝船更实用的上限选择之一 | 重量、操控、PCL 门槛要确认。 |

## Kicker 用途

Kicker 通常不是主力跑远的 motor，而是辅助、trolling 或备用。钓友喜欢 kicker，是因为它能长时间低速运转，也能让你在主机出问题时多一个选择。

如果你要把 9.9 当 kicker，要确认 mounting bracket、steering link、fuel setup、shaft length 和控制方式。

## Tiller 还是 remote

| 控制方式 | 适合谁 |
|---|---|
| Tiller | 小船、简单、直接控制、钓鱼常用。 |
| Remote | 有 steering wheel、console 或较大船。 |
| Advanced tiller | 某些较高马力和专业钓鱼用途也可能适合。 |

## PCL 与 10HP 门槛

Transport Canada 说，休闲船如果有一个或多个引擎，总马力至少 10HP，并主要在加拿大水域使用，通常需要 Pleasure Craft Licence（[Transport Canada PCL](https://tc.canada.ca/en/marine-transportation/vessel-licensing-registration/licensing-pleasure-craft/apply-manage-pleasure-craft-licence-pcl/apply-manage-pleasure-craft-licence-pcl)）。所以 9.9HP、10HP、15HP、20HP 之间，不只是性能问题，也可能牵涉文档。

## 你的下一步

如果你在 9.9、15、20HP 之间犹豫，先确认船长、船重、capacity plate、transom 高度和使用方式。再用 MercuryRepower.ca 看价格，或让 HBW 帮你确认小马力 Mercury 是否适合。

**CTA：** 想买 Mercury 9.9 到 20HP？先用 MercuryRepower.ca 看报价，再确认 shaft length 和控制方式。
`,
    faqs: [
      { question: '9.9HP 适合两个人钓鱼吗？', answer: '可能适合，但要看船长、船重、水况和装备。' },
      { question: 'Kicker 要不要电启？', answer: '如果常用、想省力，电启值得考虑。但也要看电池和安装配置。' },
      { question: '20HP 会不会太大？', answer: '看船身 rating 和用途。不能只看想要更快。' },
    ],
  },
  {
    slug: 'mercury-40-60hp-chinese-fishing-boat-guide',
    title: '40 到 60 匹 Mercury：铝船与华人钓友最常问的马力区间',
    description: 'Mercury 40HP、50HP、60HP 船外机中文指南：安省铝船、钓鱼船、tiller/remote、Command Thrust、华人钓友怎么选。',
    image: mercury115vs150Hero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: '中马力指南',
    readTime: '6 分钟',
    keywords: ['Mercury 40 60HP 中文', '铝船 Mercury 60HP', '华人钓友船外机', '安省 fishing boat Mercury'],
    content: `
## 快速答案

40 到 60HP 是安省铝船和钓鱼船非常常见的研究区间。它比小马力更有载重和起步能力，又比大马力更容易控制预算。对华人钓友来说，这个区间常常是「真正开始好用」的范围。

但 40、50、60HP 的差异不是只看价格。你要看船身最大 rating、常载人数、是否 console、是否 tiller、是否需要 Command Thrust，以及你常跑的湖区。

## 这个马力区间适合谁

| 使用情境 | 是否适合 40-60HP |
|---|---|
| 14-16 呎铝船 | 常常适合，视船身 rating。 |
| 两到三人钓鱼 | 很常见。 |
| Rice Lake / Kawarthas 多用途 | 值得研究。 |
| 小 pontoon | 可能适合，但常要看载重。 |
| 想拖 tube 或满载家庭 | 可能需要更高马力。 |

### HBW dealer note

很多 40-60HP 的错误不是买太大，而是买到刚好「能用但不爽」。如果你常载两三个钓友和一堆装备，60HP 的余裕可能比 40HP 更有价值。

## 40、50、60HP 怎么比较

| 马力 | 优点 | 可能限制 |
|---|---|---|
| 40HP | 预算较低，适合较轻船 | 载重后可能不够有力。 |
| 50HP | 折衷选择 | 有时候跟 60HP 价差值得比较。 |
| 60HP | 余裕更好，钓鱼船常见 | 要确认船身 rating 和重量。 |

## Tiller 还是 remote

钓鱼船不一定都要方向盘。很多钓友喜欢 tiller，因为空间更开放、控制直接、船内配置简单。Remote 则适合有 console、较家庭化或想要更像一般 boat driving 体验的人。

Mercury 的 tiller 选项不只限于非常小的马力，某些配置能满足更专业的钓鱼用途。实际可选型号要以 Mercury 和 dealer 当下数据为准。

## Command Thrust 值得吗

如果你的船比较重、常载装备，或需要更好的低速推力，Command Thrust 值得研究。它对 pontoon 以外的某些重载铝船也可能有价值。

## 你的下一步

先拍 capacity plate，再记下船长、船型、目前 motor、prop、常载人数和主要湖区。不要只问 40 还是 60，应该问：「这艘船在我真实使用情境下，哪个配置最平衡？」

**CTA：** 用 MercuryRepower.ca 比较 40HP、50HP、60HP 的加币报价，再请 HBW 帮你确认是否适合你的铝船。
`,
    faqs: [
      { question: '40HP 和 60HP 差很多吗？', answer: '在空船时可能觉得还好，满载后差异会更明显。' },
      { question: '60HP 会不会太耗油？', answer: '不一定。马力不足导致长时间高负荷运转，也可能不省油。' },
      { question: '这个区间适合华人钓友吗？', answer: '很适合很多安省铝船钓友，但要看船身 rating 和实际用途。' },
    ],
  },
  {
    slug: 'why-chinese-boaters-choose-harris-boat-works',
    title: '为什么 GTA 华人船主愿意到 Rice Lake 找 Harris Boat Works',
    description: '大多伦多华人船主为什么愿意到 Rice Lake 找 Harris Boat Works？透明 Mercury 报价、1947 年创立、Mercury Platinum Dealer、本地 repower 经验与不玩价格游戏。',
    image: newImmigrantHero,
    author: 'Harris Boat Works',
    datePublished: '2026-05-10',
    dateModified: '2026-05-10',
    publishDate: '2026-05-10',
    category: 'HBW 中文介绍',
    readTime: '5 分钟',
    keywords: ['Harris Boat Works 中文', 'GTA 华人船主', 'Mercury Dealer Ontario 中文', 'Rice Lake marina 中文', 'MercuryRepower.ca 中文'],
    content: `
## 快速答案

GTA 华人船主愿意到 Rice Lake 找 Harris Boat Works，不是因为这里离 Toronto 最近，而是因为买 Mercury 船外机和 repower 需要信任、透明价格和真正懂船的人。HBW 1947 年成立，是 Rice Lake 的第三代家族 marina，也是 Mercury Marine Platinum Dealer。

对很多华人客户来说，最重要的是不用玩「call for quote」游戏。你可以先在 MercuryRepower.ca 看真实加币报价，再决定要不要深入确认。

## 华人买家最在意什么

很多华人客户不是怕花钱，而是怕花错钱。大家愿意研究、比较、问朋友、看论坛，也愿意为可靠和专业付钱。但没有人喜欢价格不清楚、说法模糊、或每次问都得到不同答案。

### HBW dealer note

我们不需要把每个人都说服成客户。比较好的方式是把信息讲清楚，让合适的人自己判断。买船外机应该是清楚的决定，不应该像猜谜。

## HBW 对华人船主的价值

| HBW 优势 | 对华人客户的实际好处 |
|---|---|
| Since 1947 | 不是临时网店，是长期在本地经营的 marina。 |
| Mercury Platinum Dealer | 对 Mercury 产品、保固和服务更熟。 |
| Rice Lake 本地经验 | 懂安省湖区和真实使用情境。 |
| MercuryRepower.ca | 先看透明加币报价，不用一开始就被推销。 |
| 家族经营 | 比大型店更有人味，更重视长期信任。 |

## 为什么不是只找最近的 dealer

最近不一定最适合。船外机不是买完就结束，你之后还有保养、winterization、prop、diagnostics、rigging 和问题处理。对很多船主来说，一个愿意讲清楚、做长期服务的 dealer，比开车少 30 分钟更重要。

## 为什么中文内容重要

很多华人船主英文没问题，但在买大件设备时，能用中文先理解内核概念会更安心。特别是 PCOC、PCL、FMZ、repower、Command Thrust、shaft length 这些词，如果只看英文，容易漏掉重点。

安省政府也提供繁体中文的钓鱼规则摘要，代表中文钓鱼与 boating 信息在安省是真实需求，不是小众想像（[Ontario Fishing Regulations Summary Traditional Chinese](http://www.ontario.ca/page/ontario-fishing-regulations-summary-traditional-chinese)）。

## HBW 不适合谁

如果你只想找最低标价、完全不在乎安装和后续服务，HBW 可能不是你唯一会看的地方。如果你想要把配置弄对、价格讲清楚、未来有人可以帮你处理保养和问题，那 HBW 更适合。

## 你的下一步

如果你是 GTA 华人船主，先从 MercuryRepower.ca 创建报价。你不需要马上承诺，也不需要一开始就打电话。先看选项、看加币价格、再决定是否让 HBW 帮你确认。

**CTA：** 想用中文先理解，用英文型号下单确认？从 MercuryRepower.ca 创建 Mercury 船外机报价开始。
`,
    faqs: [
      { question: 'HBW 有中文销售吗？', answer: '目前主要营运语言是英文，但这个中文内容枢纽可以帮华人客户先理解重点。报价与规格仍会以正式英文型号和文档确认。' },
      { question: '从 Toronto 开到 Rice Lake 值得吗？', answer: '如果只是看一眼价格，也许不用。但如果你要 repower、安装、服务和长期支持，值得找懂 Mercury 和本地使用情境的 dealer。' },
      { question: 'MercuryRepower.ca 的报价是真实价格吗？', answer: '它的目的就是让客户先看到透明加币价格。最后仍需 dealer 确认规格、安装和兼容性。' },
    ],
  },
];

export function getMandarinArticleBySlug(slug: string): BlogArticle | undefined {
  return mandarinBlogArticles.find(a => a.slug === slug);
}

export function getPublishedMandarinArticles(): BlogArticle[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return mandarinBlogArticles.filter(article => {
    const publishDate = new Date(article.publishDate || article.datePublished);
    publishDate.setHours(0, 0, 0, 0);
    return publishDate <= today;
  });
}
