import { Helmet } from '@/lib/helmet';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { Phone, Mail, Globe, MapPin, Wrench, Anchor, Ship, Warehouse, Navigation } from 'lucide-react';

export default function MandarinLanding() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/zh#webpage`,
        "url": `${SITE_URL}/zh`,
        "name": "欢迎来到Harris Boat Works — 安大略省Mercury白金级授权经销商",
        "description": "Harris Boat Works — 安大略省Mercury Marine白金级授权经销商。在线透明报价，无需电话谈价。服务GTA华人船主。",
        "inLanguage": "zh-Hans",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "中文", "item": `${SITE_URL}/zh` }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/zh#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "你们会说中文吗？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "我们的团队目前以英语为主，没有中文母语员工。但我们非常欢迎华人顾客。电子邮件配合翻译工具效果很好，mercuryrepower.ca在线报价工具不需要语言交流。"
            }
          },
          {
            "@type": "Question",
            "name": "价格是加元（CAD）吗？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "是的，mercuryrepower.ca上所有价格均以加拿大元（CAD）显示。"
            }
          },
          {
            "@type": "Question",
            "name": "我可以在线获取报价，不用打电话吗？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "完全可以。这正是我们建立mercuryrepower.ca的初衷。选择型号、配置，系统即时生成报价，全程无需打电话。"
            }
          },
          {
            "@type": "Question",
            "name": "从多伦多开车到你们那里要多久？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "大约1.5小时。沿Highway 401东行，转Highway 115北行（向Peterborough方向），按导航指引前往Gores Landing。"
            }
          },
          {
            "@type": "Question",
            "name": "我可以拿旧发动机折价换购新机吗？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "可以，我们接受二手发动机置换（trade-in）。具体折价金额取决于旧机的型号、年份和状况。"
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background" lang="zh-Hans">
      <Helmet>
        <title>Mercury水星舷外机经销商 | Harris Boat Works 安大略省</title>
        <meta name="description" content="Harris Boat Works — 安大略省Mercury Marine白金级授权经销商。在线透明报价，无需电话谈价。服务大多伦多地区（GTA）华人船主。" />
        <link rel="canonical" href={`${SITE_URL}/zh`} />
        <link rel="alternate" hrefLang="zh-Hans" href={`${SITE_URL}/zh`} />
        <link rel="alternate" hrefLang="en-CA" href={SITE_URL} />
        <link rel="alternate" hrefLang="fr-CA" href={`${SITE_URL}/fr`} />
        <meta property="og:title" content="欢迎来到Harris Boat Works — Mercury白金级授权经销商" />
        <meta property="og:description" content="安大略省Mercury Marine白金级授权经销商。在线透明报价。" />
        <meta property="og:url" content={`${SITE_URL}/zh`} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Hero */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">
            欢迎来到Harris Boat Works
          </h1>
          <p className="text-lg text-primary font-medium mb-2">
            安大略省Mercury白金级授权经销商
          </p>
          <p className="text-sm text-muted-foreground">
            Harris Boat Works · 1947年创立 · Rice Lake, Gores Landing, ON · 905-342-2153
          </p>
        </header>

        {/* Welcome message */}
        <section className="mb-12 bg-muted/30 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-medium text-foreground mb-3">欢迎华人朋友</h2>
          <div className="space-y-3 text-foreground text-sm leading-relaxed">
            <p>
              欢迎来到Harris Boat Works。
            </p>
            <p>
              我们的团队以英语为主，目前不提供中文服务——我们想直接告诉您这一点，而不是让您打电话之后才发现。但这绝不意味着我们不欢迎您。事实恰恰相反：我们非常欢迎来自大多伦多地区（GTA）的华人顾客。
            </p>
            <p>
              多年来，我们接待了许多在Kawarthas湖区拥有度假屋或船只的华人家庭。我们知道，如果语言不通，用英语电话询价可能是一件令人不舒服的事。这正是我们希望您先了解以下内容的原因。
            </p>
          </div>
        </section>

        {/* About */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-4">关于我们</h2>
          <div className="space-y-3 text-foreground text-sm leading-relaxed">
            <p>
              Harris Boat Works 于1947年创立，至今已有三代家族经营，是安大略省历史最悠久的独立船坞之一。我们位于Rice Lake湖畔的Gores Landing小镇，距多伦多市中心约1.5小时车程。
            </p>
            <p>
              我们是 <strong>Mercury Marine 白金级授权经销商</strong>——这是Mercury厂家授予经销商的最高级别认证，代表最全面的零件库存、最高标准的技术培训，以及完整的厂家质保支持。
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">我们的业务</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Ship, title: "舷外机销售与换新发动机", desc: "Mercury全系列，从2.5马力到600马力" },
              { icon: Anchor, title: "船只销售", desc: "新船与二手船" },
              { icon: Wrench, title: "维修保养", desc: "Mercury及Mercruiser发动机" },
              { icon: Warehouse, title: "冬季储存", desc: "安全室内/室外存船" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Online Quote Tool */}
        <section className="mb-12 bg-primary/5 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-medium text-foreground mb-3">为什么在线报价系统对您特别有价值</h2>
          <div className="space-y-3 text-foreground text-sm leading-relaxed">
            <p>
              许多顾客在购买船用发动机时，最担心的一件事就是：价格不透明，需要打电话"谈价格"，而且全程要用英语进行。
            </p>
            <p>
              我们建立了 <a href="https://mercuryrepower.ca" className="text-primary hover:underline font-medium">mercuryrepower.ca</a> ——一个完全透明、在线自助的报价配置工具：
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>自行选择发动机型号、功率和配置</li>
              <li>实时看到以<strong>加元（CAD）</strong>计算的真实价格</li>
              <li>无隐藏费用，无需电话谈判</li>
              <li>生成完整报价后，通过电子邮件联系我们</li>
            </ul>
          </div>
        </section>

        {/* Communication */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">如何与我们沟通</h2>
          <div className="space-y-6">
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">📧 电子邮件（推荐）</h3>
                <p className="text-muted-foreground text-sm">
                  用中文写邮件完全没问题。我们会使用翻译工具来理解您的需求，并认真、准确地用英文回复。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">🌐 在线报价工具</h3>
                <p className="text-muted-foreground text-sm">
                  <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a> 的配置工具不需要语言交流——您直接选择规格，系统自动生成报价。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Wrench className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">📱 维修预约</h3>
                <p className="text-muted-foreground text-sm">
                  通过 <a href="https://hbw.wiki/service" className="text-primary hover:underline">hbw.wiki/service</a> 提交维修申请。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">📞 电话</h3>
                <p className="text-muted-foreground text-sm">
                  905-342-2153 — 我们会尽量放慢语速，耐心沟通。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why choose HBW */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-4">为什么选择Harris Boat Works</h2>
          <div className="space-y-3 text-foreground text-sm">
            <p><strong>透明定价，没有套路。</strong> mercuryrepower.ca 上显示的价格，就是真实价格。所有顾客看到的完全一样。</p>
            <p><strong>Mercury白金级经销商。</strong> Mercury厂家的最高级别认证。</p>
            <p><strong>78年家族信任。</strong> 自1947年起，三代家族经营。</p>
            <p><strong>Rice Lake本地专家。</strong> 了解安大略省内陆湖区的水上条件和使用环境。</p>
          </div>
        </section>

        {/* Driving Directions */}
        <section className="mb-12 bg-muted/30 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-medium text-foreground mb-3 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            从多伦多驾车前往（约1.5小时）
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-foreground text-sm">
            <li>沿Highway 401东行</li>
            <li>转Highway 115北行（向Peterborough方向）</li>
            <li>转County Road 2</li>
            <li>按导航指引前往Gores Landing</li>
          </ol>
          <p className="text-muted-foreground text-sm mt-3">
            建议使用Google Maps搜索"Harris Boat Works"，导航直达。
          </p>
          <p className="text-muted-foreground text-sm">
            如果您从士嘉堡（Scarborough）或北约克（North York）出发，可直接上DVP/401，全程高速。
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">常见问题 (FAQ)</h2>
          <div className="space-y-6">
            {[
              { q: "你们会说中文吗？", a: "老实说：不会。但这不是问题的终点——我们非常欢迎华人顾客，也有多种方式可以顺畅沟通。电子邮件配合翻译工具，效果出乎意料地好。" },
              { q: "价格是加元（CAD）吗？", a: "是的，mercuryrepower.ca 上所有价格均以加拿大元（CAD）显示。" },
              { q: "我可以在线获取报价，不用打电话吗？", a: "完全可以。选择型号、配置，系统即时生成报价，全程无需打电话。" },
              { q: "从多伦多开车到你们那里要多久？", a: "大约1.5小时，视出发地点和交通状况而定。走Highway 401东行，转Highway 115北行即可。" },
              { q: "你们提供哪些品牌的发动机？", a: "Mercury Marine全系列舷外机（2.5马力至600马力）。维修方面只服务Mercury和Mercruiser品牌。" },
              { q: "我可以拿旧发动机折价换购新机吗？", a: "可以，我们接受二手发动机置换（trade-in）。具体折价金额取决于旧机的型号、年份和状况。" },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground mb-2">{q}</h3>
                <p className="text-muted-foreground text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-primary/5 rounded-2xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-light text-foreground mb-3">立即行动</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            花五分钟在线配置您的报价——加元真实报价，无需电话。
          </p>
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
        </section>

        {/* Practical info */}
        <section className="text-center text-sm text-muted-foreground mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            <span>5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</span>
          </div>
          <p>距多伦多市中心约1.5小时车程</p>
        </section>

        {/* Blog links */}
        <nav className="mt-4 space-y-2 text-center">
          <p className="text-sm font-medium text-foreground mb-3">📖 中文文章</p>
          <Link to="/blog/zh/mercury-repower-guide-gta" className="block text-primary hover:underline text-sm">
            舷外机换新指南 →
          </Link>
          <Link to="/blog/zh/new-immigrant-ontario-boat-buying-guide" className="block text-primary hover:underline text-sm">
            新移民购船指南 →
          </Link>
          <Link to="/blog/zh/rice-lake-fishing-guide-toronto-chinese" className="block text-primary hover:underline text-sm">
            Rice Lake钓鱼攻略 →
          </Link>
          <Link to="/blog/zh/winterization-mercury-guide-zh" className="block text-primary hover:underline text-sm">
            冬季保养指南 →
          </Link>
          <Link to="/blog/zh/mercury-115-vs-150-comparison-zh" className="block text-primary hover:underline text-sm">
            Mercury 115 vs 150马力对比 →
          </Link>
          <Link to="/blog/zh/repower-vs-new-boat-zh" className="block text-primary hover:underline text-sm">
            换发动机还是买新船？ →
          </Link>
          <Link to="/blog/zh/ontario-boating-regulations-zh" className="block text-primary hover:underline text-sm">
            安大略省船只法规 →
          </Link>
        </nav>
      </main>

      <SiteFooter />
    </div>
  );
}
