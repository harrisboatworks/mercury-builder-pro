import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { ArrowLeft, Phone, MapPin, Navigation } from 'lucide-react';

export default function MandarinBlogArticle() {
  const url = `${SITE_URL}/blog/zh/mercury-repower-guide-gta`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        "headline": "安大略省Mercury水星舷外机换新指南：GTA华人船主必读",
        "description": "在安大略省进行Mercury舷外机换新（Repower）的完整指南。Harris Boat Works白金级经销商，在线透明报价，服务GTA华人船主。",
        "author": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "publisher": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "datePublished": "2026-04-12",
        "dateModified": "2026-04-12",
        "mainEntityOfPage": url,
        "inLanguage": "zh-Hans",
        "isAccessibleForFree": true
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "inLanguage": "zh-Hans",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "中文", "item": `${SITE_URL}/zh` },
            { "@type": "ListItem", "position": 3, "name": "舷外机换新指南", "item": url }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "什么样的船适合换新发动机？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "只要船体结构良好，基本都适合。最常见的情况是铝合金钓鱼船、家庭游船。如果不确定，联系我们描述船的情况。"
            }
          },
          {
            "@type": "Question",
            "name": "旧发动机可以换钱吗（trade-in）？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "可以。我们接受旧发动机置换。折价金额取决于旧机的品牌、型号、年份和状况。"
            }
          },
          {
            "@type": "Question",
            "name": "换新发动机需要多长时间？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "安装通常需要1-3天，视工单排期和配件供应而定。春季（四月至五月）最繁忙，建议提前预约。"
            }
          },
          {
            "@type": "Question",
            "name": "你们只服务Mercury发动机吗？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "维修方面只服务Mercury和Mercruiser品牌。发动机销售方面提供Mercury全系列。"
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background" lang="zh-Hans">
      <Helmet>
        <title>Mercury水星舷外机换新指南 GTA华人船主 | Harris Boat Works</title>
        <meta name="description" content="安大略省Mercury水星舷外机换新（Repower）完整指南。Harris Boat Works白金级经销商，在线透明报价，无需电话谈价。GTA华人船主必读。" />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="zh-Hans" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="安大略省Mercury水星舷外机换新指南" />
        <meta property="og:description" content="GTA华人船主Mercury舷外机换新完整指南。在线透明报价。" />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content="2026-04-12" />
        <meta property="article:author" content="Harris Boat Works" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        {/* Back nav */}
        <nav className="mb-8">
          <Link to="/zh" className="text-primary hover:underline text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            ← 返回中文首页
          </Link>
        </nav>

        <article className="prose prose-lg max-w-none text-foreground">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-2">
            安大略省Mercury水星舷外机换新指南：GTA华人船主必读
          </h1>
          <p className="text-muted-foreground text-sm mb-8">Harris Boat Works | harrisboatworks.ca</p>

          {/* Quick answer */}
          <div className="bg-primary/5 rounded-xl p-6 mb-8 not-prose">
            <h2 className="text-lg font-medium text-foreground mb-2">快速答案</h2>
            <p className="text-foreground text-sm">
              如果您在安大略省拥有一艘船，但发动机已经老旧、故障频繁，换新发动机（Repower）通常比换一艘新船划算得多。Harris Boat Works 是 Mercury Marine 白金级授权经销商，提供全透明在线报价——在 <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a> 即可查看真实加元价格。
            </p>
          </div>

          <h2>什么是换新发动机（Repower）？</h2>
          <p>
            换新发动机是指在保留原有船体的前提下，将旧的舷外机更换为全新的发动机。
          </p>
          <p>对于很多船主来说，船体本身还很好，只是发动机已经服役十几二十年，开始出现问题：</p>
          <ul>
            <li>启动困难，尤其是冷天</li>
            <li>燃油消耗明显增加</li>
            <li>功率下降，加速变弱</li>
            <li>维修频率越来越高，零件难找</li>
          </ul>
          <p>一艘装备齐全的新船，价格可能是单独换发动机的三到五倍。如果您的船体状况良好，Repower 能让您以更低的成本获得全新的动力体验。</p>

          <h2>为什么选择 Mercury Marine？</h2>
          <ul>
            <li><strong>全系列产品线</strong> — 从2.5马力到600马力V12发动机</li>
            <li><strong>燃油效率</strong> — 最新一代Mercury发动机在同级别中领先</li>
            <li><strong>可靠性</strong> — Mercury发动机以耐用著称，许多船主使用十五年以上</li>
            <li><strong>完善的零件网络</strong> — 正品零件，快速获取</li>
            <li><strong>厂家保修</strong> — 完整厂家保修，白金级经销商确保保修全额有效</li>
          </ul>

          <h2>透明定价：不需要"谈价格"</h2>
          <p>
            许多经销商的网站上只写着"致电询价"。我们不这么做。
          </p>
          <p>
            <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a> 是一个完全公开、实时更新的在线报价工具：
          </p>
          <ol>
            <li>选择发动机类型和马力</li>
            <li>选择配置（操控系统、螺旋桨等）</li>
            <li>系统即时显示以<strong>加元（CAD）</strong>计算的真实价格</li>
            <li>保存或截图报价，与家人商量</li>
          </ol>
          <p>全程不需要打电话，不需要讨价还价。所有顾客看到的是同一份价格。</p>

          <h2>换新发动机的完整流程</h2>
          <p><strong>第一步：在线获取报价</strong> — 访问 mercuryrepower.ca，选择适合您船只的发动机型号。</p>
          <p><strong>第二步：联系我们确认</strong> — 通过电话或电子邮件告知您的船只型号和现有发动机情况。</p>
          <p><strong>第三步：预约送船</strong> — 将船送到我们位于Gores Landing的船坞。</p>
          <p><strong>第四步：安装与调试</strong> — 技师完成安装并进行Rice Lake海试。</p>
          <p><strong>第五步：交付与说明</strong> — 说明操作要点、保养周期和保修条款。</p>

          <h2>大致费用参考</h2>
          <ul>
            <li><strong>小型发动机（9.9–20马力）</strong> — 适合钓鱼船和小型铝合金船</li>
            <li><strong>中型发动机（40–60马力）</strong> — 适合家庭日常游船</li>
            <li><strong>大型发动机（90–115马力）</strong> — 适合较大的家庭游船</li>
            <li><strong>高性能发动机（150马力以上）</strong> — 适合大型快艇和双发配置</li>
          </ul>
          <p>精确报价请访问 <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a></p>
        </article>

        {/* Driving directions */}
        <section className="mt-12 mb-8 bg-muted/30 rounded-2xl p-6">
          <h2 className="text-xl font-medium text-foreground mb-3 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            GTA华人船主实用指南：如何从多伦多驾车前往
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-foreground text-sm">
            <li>从多伦多市区出发，上 <strong>Highway 401 东行</strong></li>
            <li>在Bowmanville/Port Hope附近转 <strong>Highway 115 北行</strong>（向Peterborough方向）</li>
            <li>沿115北行，转 <strong>County Road 2</strong></li>
            <li>按导航指引前往 Gores Landing</li>
          </ol>
          <p className="text-muted-foreground text-sm mt-3">
            如果您从士嘉堡（Scarborough）或北约克（North York）出发，可直接上DVP/401，全程高速。
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">常见问题</h2>
          <div className="space-y-6">
            {[
              { q: "什么样的船适合换新发动机？", a: "只要船体结构良好，基本都适合。最常见的情况是铝合金钓鱼船、家庭游船。" },
              { q: "旧发动机可以换钱吗（trade-in）？", a: "可以。折价金额取决于旧机的品牌、型号、年份和状况。" },
              { q: "换新发动机需要多长时间？", a: "安装通常需要1-3天。春季（四月至五月）最繁忙，建议提前几周预约。" },
              { q: "我需要在现场等待吗？", a: "不需要。您把船送来，我们完成安装后通知您来取。" },
              { q: "你们只服务Mercury发动机吗？", a: "维修方面只服务Mercury和Mercruiser品牌。发动机销售提供Mercury全系列。" },
              { q: "季节性开放，冬天怎么办？", a: "通常四月开放，约十二月至三月休业。冬季可通过电子邮件联系。" },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground mb-2">{q}</h3>
                <p className="text-muted-foreground text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-primary/5 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-light text-foreground mb-3">现在就行动</h2>
          <p className="text-muted-foreground text-sm mb-6">花五分钟在线配置您的报价</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quote/motor-selection"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              在线获取报价
            </Link>
            <a
              href="tel:905-342-2153"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              905-342-2153
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
          </p>
        </section>

        <footer className="text-center text-xs text-muted-foreground">
          <p>Harris Boat Works — 1947年至今，三代家族经营，安大略省Rice Lake。Mercury Marine 白金级授权经销商。</p>
        </footer>
      </main>

      <SiteFooter />
    </div>
  );
}
