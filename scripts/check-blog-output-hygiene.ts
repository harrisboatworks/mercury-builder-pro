import { blogArticles } from '../src/data/blogArticles';
import { mandarinBlogArticles } from '../src/data/mandarinBlogArticles';
import { cleanBlogContent } from '../src/lib/cleanBlogContent.js';

const contentArticles = [
  ...blogArticles,
  ...mandarinBlogArticles,
];

const diagnosticSlugs = [
  'mercury-outboard-wont-start-troubleshooting',
  'outboard-overheating-emergency-guide',
  'mercury-outboard-overheating-at-idle-fix-ontario',
  'mercury-outboard-beeping-codes-guide',
  'boat-electrical-safety-checklist-ontario-freshwater',
  'mercury-impeller-replacement-when-they-fail',
  'milky-gearcase-oil-meaning-cost-ontario',
];

const failures: string[] = [];

const unsupportedOperationalClaims = [
  {
    label: 'visible raw editorial metadata',
    pattern: /^\s*\*\*(?:URL slug|Meta description):\*\*/im,
  },
  {
    label: 'double-escaped Unicode artifact',
    pattern: /\\u[0-9a-f]{4}/i,
  },
  {
    label: 'named competing Mercury dealer',
    pattern: /DeWildt Marine/i,
  },
  {
    label: 'incorrect bilge-pump conversion',
    pattern: /0\.91 litres per second[^\n.]{0,80}\b196 GPH\b/i,
  },
  {
    label: 'incorrect stacked warranty arithmetic',
    pattern: /\b5\s*\+\s*5\s*=\s*10 years\b/i,
  },
  {
    label: 'blanket same-day response or fit promise',
    pattern:
      /\b(?:same-day (?:fit check|yes\/no|reply|response|quote|installation|repair)|reply same-day)\b/i,
  },
  {
    label: 'fixed HBW repower turnaround promise',
    pattern:
      /\b(?:(?:boat is with us|repower is normally|repower is usually completed)[^\n.]{0,80}\b2\s*(?:to|-)\s*5 days|(?:clean install|clean repower)[^\n.]{0,80}\b(?:1|one)\s*(?:to|-)\s*(?:2|two) days)\b/i,
  },
  {
    label: 'one-business-day HBW trade appraisal promise',
    pattern:
      /\b(?:trade|CAD figure|trade value)[^\n.]{0,120}\bwithin one business day\b/i,
  },
  {
    label: 'unconditional water-test promise',
    pattern:
      /\b(?:(?:every|each) (?:single )?(?:HBW |Mercury |full )?repower[^\n.]{0,240}(?:water[- ]test|on-water|tested on Rice Lake)|(?:sea[- ]trial|on-water test)[^\n.]{0,80}(?:always included|before delivery)|boat does not leave[^\n.]{0,80}sea[- ]trial|we (?:test props|sea[- ]trial|run)[^\n.]{0,120}\bevery\b[^\n.]{0,60}(?:repower|install|sea[- ]trial)|every (?:install|repower)[^\n.]{0,80}(?:water[- ]test|sea[- ]trial))\b/i,
  },
  {
    label: 'unsupported on-water towing promise',
    pattern: /\b(?:provide on-water towing assistance|call [^\n.]{0,40} for tow dispatch)\b/i,
  },
  {
    label: 'unsupported Ontario parts-inventory superlative',
    pattern: /largest Mercury and MerCruiser parts inventory in Ontario/i,
  },
  {
    label: 'unsupported only-brand service superlative',
    pattern: /only brand-name outboard service/i,
  },
  {
    label: 'stale 120-month financing term',
    pattern: /\bterms? up to 120 months\b/i,
  },
  {
    label: 'stale under-24-hour financing approval promise',
    pattern: /\b(?:approval|answer)[^\n.]{0,80}\bunder 24 hours?\b/i,
  },
  {
    label: 'unsupported immediate motor-shipping promise',
    pattern: /\bin-stock (?:motors?|Pro XS)[^\n.]{0,40}\bship immediately\b/i,
  },
  {
    label: 'incorrect Mercury Canada financing-provider attribution',
    pattern: /Mercury Canada(?:'s)? financing partner/i,
  },
  {
    label: 'unconditional quote-price promise',
    pattern: /\bthe price you see is the price(?: you pay)?\b/i,
  },
  {
    label: 'unsupported capacity-plate legal or automatic-coverage claim',
    pattern:
      /\b(?:capacity plate|compliance notice)[^\n]{0,240}\b(?:legal ceiling|illegal(?: in Canada| under Canadian regulations)?|void of warranty|Mercury won['’]?t cover|(?:voids|invalidates) (?:your |the )?(?:insurance|warranty))\b/i,
  },
  {
    label: 'incorrect universal capacity-plate claim',
    pattern:
      /\b(?:every|all) (?:powered |recreational |pleasure )?(?:boats?|powerboats?|hulls?)[^\n.]{0,50}\b(?:has|have|carries|carry|must have|is required to have|are required to have)\b[^\n.]{0,30}\b(?:capacity plate|compliance notice)\b/i,
  },
  {
    label: 'unsafe tap-test structural clearance',
    pattern:
      /\b(?:sound transom[^\n.]{0,100}(?:passes?|clears?)|(?:tap|thunk) test[^\n.]{0,100}(?:passes?|clears?) (?:check|inspection))\b/i,
  },
  {
    label: 'unsupported universal repower percentage threshold',
    pattern:
      /\brepower (?:cost|price|quote)[^\n.]{0,100}\b(?:60\s*(?:-|to)\s*70|70\s*(?:-|to)\s*80)\s*%[^\n.]{0,100}\b(?:new boat|replacement boat|new-boat package)\b/i,
  },
  {
    label: 'unsupported authorized-dealer warranty-validity claim',
    pattern:
      /\b(?:(?:Mercury |the )?(?:requires?|mandates?)[^\n.]{0,80}(?:authorized )?dealer install(?:ation)?[^\n.]{0,80}(?:warranty|coverage)|(?:DIY|self)[- ]install(?:ation|ing)?[^\n.]{0,80}(?:voids|invalidates)[^\n.]{0,30}(?:Mercury )?warranty|(?:dealer|authorized dealer)[^\n.]{0,50}(?:must|required to) install[^\n.]{0,50}(?:warranty|coverage)[^\n.]{0,20}(?:valid|void))\b/i,
  },
  {
    label: 'rejected 4,160-work-order service claim',
    pattern: /\b4,160\s+winterize-and-service work orders\b/i,
  },
  {
    label: 'incorrect HBW winterization or storage reservation pressure',
    pattern:
      /\b(?:book your winterize-and-service in late summer|book (?:now|early) (?:to )?(?:reserve|secure) (?:a )?(?:winterization|storage) (?:slot|space|spot)|(?:winterization|storage) (?:slots|spaces|spots) (?:fill|are limited)|reserve (?:your )?(?:fall )?(?:winterization|storage) (?:slot|space|spot))\b/i,
  },
  {
    label: 'incorrect Mandarin winterization or storage reservation pressure',
    pattern:
      /(?:(?:9 月中旬|9 月底之前)[^\n。]{0,30}(?:预订|预约)|(?:场地|位置)[^\n。]{0,30}(?:几乎满|订满)|锁定冬储位置|早鸟折扣)/i,
  },
  {
    label: 'false Mandarin-language staff claim',
    pattern: /(?:师傅|技师|团队)[^\n。]{0,30}(?:会用中文|提供中文服务|用中文解释)/i,
  },
  {
    label: 'incorrect HBW indoor-storage offer in Mandarin',
    pattern:
      /HBW[^\n。]{0,140}(?:室内或室外存储|(?<!不)提供室内冬储(?!吗)|室内存储到)/i,
  },
  {
    label: 'incorrect PCL label for the operator card',
    pattern: /PCL\s*(?:操作员卡|船驾照|操作人卡)/i,
  },
  {
    label: 'unsupported Mandarin winter-storage package price',
    pattern:
      /(?:典型 GTA 华人客户全包价|(?:冬储|冬化)[^\n。]{0,80}\$1,500\s*(?:to|[-–])\s*\$2,800)/i,
  },
  {
    label: 'rolling Mandarin HBW heritage count',
    pattern: /(?:家族经营\s*(?:78|79|80)\s*年|卖船和修引擎已经\s*\d+\s*年)/i,
  },
  {
    label: 'incorrect Mandarin rental booking through the service form',
    pattern:
      /(?:(?:订船|租船|预订)[^\n。]{0,160}hbw\.wiki\/service|hbw\.wiki\/service[^\n。]{0,160}(?:订船|租船|预订))/i,
  },
  {
    label: 'unsupported fixed Mandarin rental-orientation duration',
    pattern: /HBW[^\n。]{0,100}(?:4\s*(?:-|–)\s*6)\s*分钟[^\n。]{0,50}(?:讲解|说明)/i,
  },
  {
    label: 'closed Serpent Mounds public-launch or parking recommendation',
    pattern:
      /Serpent Mounds[^\n.]{0,160}\b(?:maintained (?:boat )?ramp|day-use fees?|overnight (?:trailer )?parking)\b/i,
  },
  {
    label: 'stale Honda-to-Mercury static price or lineup claim',
    pattern:
      /(?:\$24,500\s*(?:-|–)\s*\$26,000|Honda lineup ends at BF250|three times Honda['’]s dealer footprint|need 300\+ HP)/i,
  },
  {
    label: 'contradictory Command Thrust recommendation for an aluminum V-hull',
    pattern:
      /60\s*HP EFI Command Thrust[^\n.]{0,100}16\s*(?:-|–)\s*18\s*ft aluminum/i,
  },
] as const;

const editorialIntentChecks = [
  { slug: 'best-mercury-outboard-rice-lake-fishing', title: /Outboard Setup/i, description: /main motor and kicker/i },
  { slug: '2026-rice-lake-fishing-season-outlook', title: /Fishing Outlook 2026/i, description: /species outlook/i },
  { slug: 'mercury-smartcraft-connect-eligibility-2026', title: /Work With My Mercury.*Eligibility Check/i, description: /compatibility by Mercury engine family/i },
  { slug: 'mercury-smartcraft-connect-guide-ontario', title: /Features, App & Installation/i, description: /what SmartCraft Connect shows/i },
  { slug: 'best-mercury-outboard-lake-ontario-salmon-trout', title: /Best Mercury Outboard/i, description: /main outboard/i },
  { slug: 'lake-ontario-salmon-mercury-setup-guide-2026', title: /Boat Rigging/i, description: /kicker fit/i },
  { slug: 'boat-hull-replacement-vs-repower-decision', title: /Hull Worth Repowering/i, description: /transom, floor, stringers/i },
  { slug: 'repower-vs-new-boat', title: /Total Cost/i, description: /current quotes/i },
  { slug: 'mercury-repower-eligibility-guide', title: /Is Your Boat Worth Repowering/i, description: /structure, manufacturer limits, rigging fit/i },
  { slug: 'how-to-read-boat-capacity-plate-ontario', title: /Read a Boat Capacity Plate in Ontario/i, description: /maximum recommended safe horsepower/i },
  { slug: 'repower-horsepower-capacity-plate-guide', title: /Choose Repower Horsepower/i, description: /motor weight/i },
  { slug: 'outdoor-boat-storage-shrinkwrap-rice-lake', title: /HBW Outdoor Winter Boat Storage/i, description: /Harris Boat Works/i },
  { slug: 'boat-storage-kawartha-lakes', title: /What to Compare Before Booking/i, description: /Compare outdoor, indoor/i },
  { slug: 'mercury-100-hour-service-cost-ontario', title: /What's Included/i, description: /when to submit an HBW service request/i },
  { slug: 'gta-chinese-pcl-fishing-licence-guide', title: /PCOC.*PCL.*钓鱼证/i, description: /PCOC.*PCL.*安省钓鱼证/i },
] as const;

const unsupportedServiceEvidencePatterns = [
  {
    label: 'retired unsupported service statistic',
    pattern:
      /(?:as little as three weeks|phase separation takes 60(?:\s*(?:-|\u2013)\s*|\s+to\s+)90 days)/i,
  },
  {
    label: 'retired unsupported service-data graphic',
    pattern: /(?:impeller-failures-by-month-hbw|wont-start-causes-hbw)\.png/i,
  },
] as const;

const serviceEvidenceExpectations: Record<string, RegExp[]> = {
  'spring-commissioning-cost-ontario': [
    /9,540 individual job records/i,
    /9,841 matching job records across 5,195 distinct repair orders/i,
  ],
  'mercury-impeller-replacement-when-they-fail': [
    /766 impeller and water-pump part lines/i,
    /817 matching parts records across 792 distinct repair orders/i,
    /(?:not|did not count) 766 unique boats or 766 confirmed failures/i,
  ],
  'milky-gearcase-oil-meaning-cost-ontario': [
    /7,417 gearcase-related service records/i,
    /8,130 matching job rows across 7,474 distinct repair orders/i,
    /497 job rows across 447 repair orders/i,
  ],
  'mercury-water-pump-replacement-cost-ontario': [
    /112 dedicated water-pump jobs/i,
    /\$210 in labour plus \$76 in pump parts/i,
    /historical shop medians, not a package price or quote/i,
  ],
  'mercury-outboard-wont-start-troubleshooting': [
    /537 Lightspeed job records/i,
    /cause buckets also overlapped/i,
    /symptom label is not the same thing as a confirmed root cause/i,
  ],
};

const factualCorrectionExpectations: Record<string, RegExp[]> = {
  'bad-used-boats-to-avoid-ontario': [
    /Mercury Product Protection available for up to eight total years/i,
  ],
  'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026': [
    /maximum recommended horsepower/i,
    /potential warranty problems/i,
  ],
  'mercury-avator-range-rice-lake-cottage': [
    /published 13-foot test reached about 5 miles at full throttle and 34 miles at quarter-throttle/i,
    /practical Rice Lake trip planning[^\n.]{0,160}3 to 4 miles[^\n.]{0,100}20 to 25 miles/i,
  ],
  'bilge-pump-troubleshooting-guide': [
    /0\.91 litres per second \(roughly 866 US GPH, or 14\.4 US gal\/min\)/i,
  ],
  'trailer-boat-toronto-to-rice-lake-guide': [
    /Serpent Mounds is not a public launch/i,
    /remained closed to the public since 2009/i,
  ],
  'honda-to-mercury-repower-ontario-guide': [
    /Honda currently builds through the BF350 V8/i,
    /live Mercury pricing reference/i,
    /Above Honda's current 350 HP range/i,
  ],
  'tiller-vs-remote-steering-outboard-guide': [
    /16-18 ft planing aluminum V-hull[\s\S]{0,180}standard gearcase/i,
  ],
  'how-to-choose-right-horsepower-boat': [
    /recommended maximum exceeds the manufacturer's safe engine-power limit/i,
    /not accurate to describe every pleasure-craft case as an automatic blanket warranty void/i,
  ],
  'gta-chinese-rice-lake-winter-storage-complete-guide': [
    /有空间，不需要提前数月预留位置/i,
    /计划送船前 1–2 周/i,
    /11 月中旬是实际的秋季最后接收时间/i,
    /Lightspeed 记录[\s\S]{0,80}584 次冬化/i,
    /只提供室外收缩膜冬储/i,
  ],
  'gta-chinese-mercury-service-guide': [
    /没有中文母语的销售或翻译/i,
    /按先到先办处理/i,
    /计划送船前 1–2 周/i,
    /只提供(?:\*\*)?室外收缩膜冬储(?:\*\*)?/i,
  ],
  'gta-chinese-pcl-fishing-licence-guide': [
    /PCOC（Pleasure Craft Operator Card）/i,
    /新办、续期、转让或补发 PCL[\s\S]{0,40}需要支付当前服务费/i,
    /HBW 采用更严格的内部政策/i,
    /18 岁以下或 65 岁及以上/i,
  ],
  'gta-chinese-buy-boat-rice-lake-guide': [
    /HBW 只提供室外收缩膜冬储/i,
    /Harris Boat Works 自 1947 年起一直由 Harris 家族/i,
  ],
  'why-chinese-boaters-choose-harris-boat-works': [
    /不公布未经核实的族群占比/i,
    /1965 年[\s\S]{0,80}George Harris/i,
    /由美国合同制造商生产/i,
  ],
  'gta-chinese-rice-lake-day-trip-plan': [
    /harrisboatworks\.ca\/rentals/i,
    /HBW 的内部政策更严格/i,
    /每位可能驾驶的人都必须出示有效 boat operator licence／PCOC 和带照片身份证件/i,
    /GTA 多数地区到 Gores Landing 通常约 60–120 分钟/i,
    /用实时导航/i,
    /不要把明火、BBQ、酒精、游泳或宠物当成默认允许项目/i,
  ],
  'rice-lake-fishing-guide-toronto-chinese': [
    /walleye（梭鲈／玻璃眼）/i,
    /不要把 walleye 和 yellow perch 都翻成“黄鲈”/i,
    /下水点要先确认/i,
    /每位驾驶员都必须出示有效 boat operator licence／PCOC 和带照片身份证件/i,
  ],
  'ontario-boating-regulations-zh': [
    /船上安全装备则按船型、船长和使用条件决定/i,
    /把现有 PCL 转到自己名下/i,
    /一日 Sport Fishing Licence 不需要 Outdoors Card/i,
    /不要把 walleye 误认成 yellow perch（黄鲈）/i,
  ],
  'ontario-boating-season-tips': [
    /battery stays in the boat, disconnected and maintained over winter/i,
    /leave it in the boat, disconnect it, and maintain it according to the battery maker's instructions/i,
    /parasitic draw, not cold, is the usual problem/i,
  ],
};

const factualCorrectionForbiddenPatterns: Record<string, RegExp[]> = {
  'gta-chinese-rice-lake-day-trip-plan': [
    /County Road 18 \/ Bewdley Exit/i,
    /部分 HBW pontoon 可以预订带便携 BBQ 炉/i,
    /孩子游泳，大人在船上 BBQ \/ 吃便当 \/ 喝啤酒/i,
    /HBW 多数租赁价格已含基础油费/i,
    /大约 20–30 分钟/i,
    /已经支付的订金和款项会退还/i,
  ],
  'rice-lake-fishing-guide-toronto-chinese': [
    /Walleye（黄鲈）/i,
    /2 线水泥码头/i,
    /30-46 cm/i,
    /这是 Rice Lake 唯一一个你必须知道的危险/i,
  ],
  'ontario-boating-regulations-zh': [
    /PCL 不可转让/i,
    /Walleye 黄鲈/i,
    /从中国带的救生衣不被加拿大法规承认/i,
    /30-46 cm/i,
  ],
  'ontario-boating-season-tips': [
    /battery prep \(off the boat, on a tender\)/i,
    /storing the battery on the boat over winter/i,
    /off the boat, on a tender/i,
    /battery test and reinstall/i,
  ],
};

for (const article of contentArticles) {
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];
  const cleaned = cleanBlogContent(article.content, {
    hasStructuredFaqs: faqs.length > 0,
  });

  const forbiddenOutputPatterns = [
    /\*\*Language:\*\*\s*English/i,
    /^##\s+Internal Links\s*$/im,
    /^##\s+CTA\s*$/im,
    /^##\s+(?:Related Guides?|Related Posts?|Related Articles?|Related at HBW)\s*$/im,
  ];

  for (const pattern of forbiddenOutputPatterns) {
    if (pattern.test(cleaned)) {
      failures.push(`${article.slug}: output still matches ${pattern}`);
    }
  }

  if (
    faqs.length > 0 &&
    /^##\s+(?:Frequently Asked Questions|FAQs?|Common Questions)\b/im.test(
      cleaned,
    )
  ) {
    failures.push(`${article.slug}: inline FAQ remains beside structured faqs[]`);
  }

  const claimSource = `${article.content}\n${JSON.stringify(faqs)}`;
  for (const claim of unsupportedOperationalClaims) {
    if (claim.pattern.test(claimSource)) {
      failures.push(`${article.slug}: ${claim.label}`);
    }
  }

}

for (const slug of diagnosticSlugs) {
  const article = blogArticles.find((candidate) => candidate.slug === slug);
  if (!article) {
    failures.push(`${slug}: diagnostic article is missing`);
    continue;
  }

  const diagnosticSource = `${article.content}\n${JSON.stringify(article.faqs || [])}`;
  if (/(?:\+?1[-.\s]?)?\(?905\)?[-.\s]?342[-.\s]?2153/.test(diagnosticSource)) {
    failures.push(`${slug}: diagnostic content contains the public phone number`);
  }
}

for (const intent of editorialIntentChecks) {
  const article = contentArticles.find((candidate) => candidate.slug === intent.slug);
  if (!article) {
    failures.push(`${intent.slug}: editorial-intent article is missing`);
    continue;
  }
  if (!intent.title.test(article.title)) {
    failures.push(`${intent.slug}: title no longer preserves the distinct search intent`);
  }
  if (!intent.description.test(article.description)) {
    failures.push(`${intent.slug}: description no longer preserves the distinct search intent`);
  }
}

for (const [slug, expectations] of Object.entries(serviceEvidenceExpectations)) {
  const article = contentArticles.find((candidate) => candidate.slug === slug);
  if (!article) {
    failures.push(`${slug}: service-evidence article is missing`);
    continue;
  }

  const evidenceSource = [
    article.title,
    article.description,
    article.content,
    JSON.stringify(article.faqs || []),
  ].join('\n');

  for (const check of unsupportedServiceEvidencePatterns) {
    if (check.pattern.test(evidenceSource)) {
      failures.push(`${slug}: ${check.label}`);
    }
  }

  for (const expectation of expectations) {
    if (!expectation.test(evidenceSource)) {
      failures.push(`${slug}: documented service-evidence context is missing (${expectation})`);
    }
  }
}

for (const [slug, expectations] of Object.entries(factualCorrectionExpectations)) {
  const article = contentArticles.find((candidate) => candidate.slug === slug);
  if (!article) {
    failures.push(`${slug}: factual-correction article is missing`);
    continue;
  }

  const correctionSource = [
    article.content,
    JSON.stringify(article.faqs || []),
  ].join('\n');
  for (const expectation of expectations) {
    if (!expectation.test(correctionSource)) {
      failures.push(`${slug}: factual correction regressed (${expectation})`);
    }
  }
}

for (const [slug, forbiddenPatterns] of Object.entries(factualCorrectionForbiddenPatterns)) {
  const article = contentArticles.find((candidate) => candidate.slug === slug);
  if (!article) continue;

  const correctionSource = [
    article.content,
    JSON.stringify(article.faqs || []),
  ].join('\n');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(correctionSource)) {
      failures.push(`${slug}: retired factual claim returned (${pattern})`);
    }
  }
}

const simcoeArticle = blogArticles.find(
  (candidate) => candidate.slug === 'best-mercury-outboard-lake-simcoe-walleye-fishing',
);
if (!simcoeArticle) {
  failures.push('best-mercury-outboard-lake-simcoe-walleye-fishing: article is missing');
} else if (/^\s*-\s*Mercury Premier Dealer\b/i.test(simcoeArticle.content)) {
  failures.push(
    'best-mercury-outboard-lake-simcoe-walleye-fishing: raw credibility-anchor list precedes the article',
  );
}

if (failures.length > 0) {
  console.error('Blog output hygiene check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Blog output hygiene check passed for ${contentArticles.length} English and Chinese articles, ${diagnosticSlugs.length} diagnostic CTA surfaces, ${unsupportedOperationalClaims.length} unsupported-claim guards, ${editorialIntentChecks.length} editorial-intent checks, ${Object.keys(serviceEvidenceExpectations).length} documented service-evidence articles, and ${Object.keys(factualCorrectionExpectations).length} factual-correction articles.`,
);
