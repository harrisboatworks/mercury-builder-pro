export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  content: string;
  image: string;
  author: string;
  datePublished: string;
  dateModified: string;
  publishDate?: string; // ISO date for scheduled publishing (defaults to datePublished if not set)
  category: string;
  readTime: string;
  faqs?: { question: string; answer: string }[];
  keywords: string[];
}

// Helper to check if an article is published
export function isArticlePublished(article: BlogArticle): boolean {
  const publishDate = article.publishDate || article.datePublished;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const articleDate = new Date(publishDate);
  articleDate.setHours(0, 0, 0, 0);
  return articleDate <= today;
}

// Get all published articles (filters out future-dated articles)
export function getPublishedArticles(): BlogArticle[] {
  return blogArticles.filter(isArticlePublished);
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'how-to-choose-right-horsepower-boat',
    title: 'How to Choose the Right Horsepower for Your Boat',
    description: 'A complete guide to selecting the perfect HP outboard motor for your boat size, type, and intended use. Learn from 60 years of Mercury dealer expertise.',
    image: '/lovable-uploads/mercury-family-lineup.jpg',
    author: 'Harris Boat Works',
    datePublished: '2024-06-15',
    dateModified: '2024-12-01',
    category: 'Buying Guide',
    readTime: '8 min read',
    keywords: ['boat motor horsepower', 'how to choose outboard motor', 'mercury motor sizing', 'boat hp guide', 'outboard motor selection'],
    content: `
## Understanding Horsepower Requirements

Choosing the right horsepower for your boat is one of the most important decisions you'll make. Too little power means struggling against wind and waves. Too much power can be dangerous and wasteful. Here's how to get it right.

### Check Your Boat's HP Rating

Every boat has a maximum horsepower rating on its capacity plate. This is set by Transport Canada and should never be exceeded. However, the maximum isn't always the best choice—it depends on how you'll use your boat.

### Match HP to Boat Type

**Fishing Boats (14-16ft)**: 25-60HP
Perfect for lake fishing, these boats need enough power to reach your spots quickly but don't need speed for watersports.

**Pontoons (16-24ft)**: 40-115HP
Pontoons need more power due to their hull design. A 20ft pontoon typically runs best with 60-90HP.

**V-Hull Fishing (16-20ft)**: 75-150HP
Larger fishing boats benefit from higher horsepower for rough water handling and getting to fishing grounds quickly.

**Center Console (18-24ft)**: 115-300HP
These versatile boats often run twin motors for safety and performance on larger bodies of water.

### Consider Your Use Case

- **Casual cruising**: Mid-range HP is typically sufficient
- **Watersports**: You'll want higher HP for pulling tubes and skiers
- **Fishing**: Consider trolling needs—sometimes a smaller kicker motor makes sense
- **Commercial use**: Reliability matters more than raw power

### The Sweet Spot

For most recreational boaters, we recommend 70-80% of maximum rated horsepower. This provides:
- Excellent fuel efficiency
- Good performance in various conditions  
- Reduced engine strain
- Lower operating costs

### Get Expert Advice

At Harris Boat Works, we've helped Ontario boaters choose the right motor for 60+ years. Bring in your boat specs, or tell us about your ideal day on the water—we'll recommend the perfect match.
    `,
    faqs: [
      {
        question: 'What happens if I choose too little horsepower?',
        answer: 'Underpowering your boat leads to poor performance, difficulty handling rough conditions, excessive engine strain, and higher fuel consumption as the motor works harder to move the boat.'
      },
      {
        question: 'Can I exceed my boat\'s maximum HP rating?',
        answer: 'No. The maximum HP rating is set by Transport Canada for safety reasons. Exceeding it can void insurance, create handling problems, and put you and passengers at risk.'
      },
      {
        question: 'Does higher horsepower always mean faster speed?',
        answer: 'Not necessarily. Hull design, weight, and propeller selection all affect speed. A properly matched motor with the right prop often outperforms an oversized motor with poor setup.'
      },
      {
        question: 'How do I find my boat\'s maximum HP rating?',
        answer: 'Check the capacity plate, usually located near the helm or transom. It shows maximum HP, passenger capacity, and weight limits.'
      }
    ]
  },
  {
    slug: 'mercury-motor-maintenance-seasonal-tips',
    title: 'Mercury Motor Maintenance: Seasonal Care Tips',
    description: 'Essential maintenance tips to keep your Mercury outboard running smoothly. Learn spring startup, mid-season checks, and winterization from certified technicians.',
    image: '/lovable-uploads/mercury-service.jpg',
    author: 'Harris Boat Works',
    datePublished: '2024-05-20',
    dateModified: '2024-11-15',
    category: 'Maintenance',
    readTime: '10 min read',
    keywords: ['mercury motor maintenance', 'outboard winterization', 'boat motor service', 'mercury service schedule', 'outboard maintenance tips'],
    content: `
## Year-Round Mercury Motor Care

Proper maintenance is the key to long engine life and reliable performance. Here's a seasonal guide to keeping your Mercury running like new.

### Spring Startup Checklist

Before your first trip:

1. **Check the lower unit oil** - Look for milky color indicating water intrusion
2. **Inspect the propeller** - Look for dings, bends, or fishing line wrapped around the shaft
3. **Replace fuel filters** - Especially if the boat sat all winter
4. **Check battery connections** - Clean corrosion with baking soda solution
5. **Inspect fuel lines** - Look for cracks, especially at connections
6. **Test the kill switch** - Critical safety equipment

### Mid-Season Maintenance

Every 50-100 hours or monthly during heavy use:

- **Check oil level** (4-stroke motors)
- **Inspect spark plugs** - Look for fouling or wear
- **Clean the fuel/water separator**
- **Lubricate all grease fittings**
- **Check steering cable play**
- **Inspect sacrificial anodes**

### Fall Winterization

Proper winterization prevents 90% of spring problems:

1. **Stabilize the fuel** - Use Mercury Quickstor or similar
2. **Fog the engine** - Protects internal components
3. **Change lower unit oil** - Don't let old oil sit all winter
4. **Disconnect battery** - Store in cool, dry place
5. **Store motor upright** - Prevents water from pooling in lower unit

### Professional Service Schedule

**Annual Service** (100 hours or yearly):
- Full inspection
- Gear oil change
- Spark plug replacement
- Thermostat check
- Water pump inspection

**Major Service** (300 hours or every 3 years):
- Water pump impeller replacement
- Comprehensive inspection
- All fluids changed

### Trust the Experts

At Harris Boat Works, our Mercury-certified technicians handle everything from basic maintenance to major repairs. We've been servicing Mercury motors since 1965 and know these engines inside and out.
    `,
    faqs: [
      {
        question: 'How often should I change the oil in my Mercury 4-stroke?',
        answer: 'Change oil every 100 hours of operation or annually, whichever comes first. For new motors, the first oil change should be at 20 hours to remove break-in contaminants.'
      },
      {
        question: 'What happens if I don\'t winterize my outboard?',
        answer: 'Water left in the cooling system can freeze and crack the engine block or powerhead. Unstabilized fuel causes carburetor gumming and fuel system problems. Improper storage leads to corrosion and seal damage.'
      },
      {
        question: 'Can I do my own maintenance?',
        answer: 'Basic tasks like oil checks, propeller inspection, and battery maintenance are DIY-friendly. However, we recommend professional service for water pump replacement, lower unit service, and annual inspections.'
      },
      {
        question: 'How do I know if my water pump needs replacing?',
        answer: 'Watch for weak or inconsistent water stream from the telltale, overheating warnings, or if it\'s been more than 300 hours since last replacement. When in doubt, have it inspected.'
      }
    ]
  },
  {
    slug: 'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado',
    title: 'Understanding Mercury Motor Families: FourStroke vs Pro XS vs Verado',
    description: 'Compare Mercury\'s motor families to find the perfect match. Learn the key differences between FourStroke, Pro XS, SeaPro, and Verado outboards.',
    image: '/lovable-uploads/mercury-comparison.jpg',
    author: 'Harris Boat Works',
    datePublished: '2024-04-10',
    dateModified: '2024-12-10',
    category: 'Comparison',
    readTime: '12 min read',
    keywords: ['mercury fourstroke vs verado', 'pro xs vs fourstroke', 'mercury motor comparison', 'best mercury outboard', 'verado vs pro xs'],
    content: `
## Mercury's Motor Families Explained

Mercury Marine offers several distinct motor families, each designed for specific applications. Understanding these differences helps you choose the right motor for your needs.

### Mercury FourStroke

**Best For**: General recreational use, pontoons, family boats

**Key Features**:
- Excellent fuel efficiency
- Quiet operation
- Low maintenance costs
- Broad HP range (2.5HP - 150HP)

**Why Choose FourStroke**: The FourStroke line offers the best balance of performance, reliability, and value. These are workhorse motors built for everyday boaters who want reliable power without the premium price.

### Mercury Pro XS

**Best For**: Tournament fishing, bass boats, performance enthusiasts

**Key Features**:
- Lightweight construction
- Faster acceleration
- Higher RPM range
- Competition-ready performance
- HP range: 115HP - 400HP

**Why Choose Pro XS**: When every second counts—whether racing to your fishing spot or competing in tournaments—Pro XS delivers. These motors sacrifice some fuel efficiency for raw performance.

### Mercury Verado

**Best For**: Premium boats, offshore use, those wanting the best

**Key Features**:
- Supercharged performance
- Exceptionally quiet
- Advanced Noise-Free steering
- Digital throttle & shift
- Premium fit and finish
- HP range: 175HP - 600HP

**Why Choose Verado**: Verado represents Mercury's flagship technology. The supercharged powerhead delivers smooth, linear power while operating quieter than any comparable outboard. These are the motors you choose when only the best will do.

### Mercury SeaPro

**Best For**: Commercial use, guides, heavy-duty applications

**Key Features**:
- Built for high-hour operation
- Extended service intervals
- Heavy-duty components
- Commercial warranty available
- HP range: 15HP - 300HP

**Why Choose SeaPro**: If you're putting hundreds of hours on your motor annually, SeaPro is designed for you. These commercial-grade motors handle the demands of professional use.

### Head-to-Head Comparison

| Feature | FourStroke | Pro XS | Verado | SeaPro |
|---------|------------|--------|--------|--------|
| Price | $$ | $$$ | $$$$ | $$ |
| Weight | Medium | Light | Heavy | Heavy |
| Fuel Efficiency | Excellent | Good | Very Good | Good |
| Noise Level | Quiet | Moderate | Very Quiet | Moderate |
| Acceleration | Good | Excellent | Excellent | Good |
| Best Use | Recreation | Performance | Premium | Commercial |

### Our Recommendation

For most Ontario boaters, the **Mercury FourStroke** offers the best overall value. If you fish competitively or prioritize performance, consider the **Pro XS**. For premium boats or offshore use, **Verado** is worth the investment.
    `,
    faqs: [
      {
        question: 'Is the Verado worth the extra cost?',
        answer: 'For premium boats and demanding applications, yes. Verado offers superior refinement, quieter operation, and advanced features. However, for most recreational use, FourStroke provides excellent value without the premium price.'
      },
      {
        question: 'What\'s the main advantage of Pro XS over FourStroke?',
        answer: 'Pro XS motors are lighter and tuned for higher RPM and faster acceleration. They\'re designed for performance-focused boaters, especially tournament anglers who need to reach fishing spots quickly.'
      },
      {
        question: 'Can I use a SeaPro for recreational boating?',
        answer: 'Absolutely. SeaPro motors are built tough for commercial use, but many recreational boaters choose them for their durability. They\'re an excellent choice if you boat frequently and want maximum reliability.'
      },
      {
        question: 'Which Mercury motor is quietest?',
        answer: 'Verado is the quietest Mercury outboard, featuring advanced sound dampening and smooth supercharged operation. FourStroke motors are also notably quiet, while Pro XS prioritizes performance over noise reduction.'
      }
    ]
  },
  {
    slug: 'boat-repowering-guide-when-to-replace-motor',
    title: 'Boat Repowering 101: When to Replace Your Outboard Motor',
    description: 'Is it time to repower your boat? Learn the signs your motor needs replacing, cost considerations, and why repowering often beats buying new.',
    image: '/lovable-uploads/repower-hero.jpg',
    author: 'Harris Boat Works',
    datePublished: '2024-03-05',
    dateModified: '2024-12-15',
    category: 'Repowering',
    readTime: '9 min read',
    keywords: ['boat repowering', 'when to replace outboard', 'repower cost', 'new boat vs repower', 'outboard motor replacement'],
    content: `
## Should You Repower Your Boat?

Repowering—replacing your outboard motor—is one of the best investments you can make in your boat. Here's how to know when it's time and what to expect.

### Signs You Need to Repower

**Reliability Issues**:
- Frequent breakdowns or repairs
- Hard starting or rough running
- Overheating problems
- Excessive oil consumption

**Performance Decline**:
- Noticeable power loss
- Poor fuel economy
- Can't reach rated RPM
- Excessive vibration

**Economic Factors**:
- Repair costs exceeding motor value
- Parts becoming scarce
- Failed components (powerhead, lower unit)

### The Repower Advantage

**Repower vs. Buy New Boat**: For a fraction of the cost of a new boat, repowering gives you:
- Modern fuel efficiency (often 30-40% better)
- Improved reliability
- Better performance
- Current technology and features
- Extended boat life

**Cost Comparison**:
- New 20ft fishing boat: $35,000+
- Repower same boat with new 115HP: $12,000-$15,000

That's 70% of the benefit at 30-40% of the cost.

### What's Involved in Repowering

1. **Motor Selection**: Choosing the right HP and model
2. **Rigging Assessment**: Evaluating controls, cables, gauges
3. **Transom Inspection**: Ensuring structural integrity
4. **Installation**: Professional mounting and rigging
5. **Lake Testing**: Verifying performance and setup
6. **Setup & Tuning**: Propeller selection and trimming

### Timeline & Cost

Typical repower projects take 3-7 days depending on scope:

**Basic Repower** (motor only, compatible controls): $8,000 - $12,000
**Full Repower** (motor, controls, rigging): $12,000 - $18,000
**Premium Repower** (motor, electronics, full upgrade): $15,000 - $25,000

### Winter Repower Advantage

Schedule your repower during winter for:
- Faster turnaround (less demand)
- No missed boating season
- Often better pricing
- Spring-ready boat

### Trust the Certified Experts

As a Mercury Certified Repower Center, Harris Boat Works has the expertise to handle any repower project. Our 60 years as a Mercury dealer means we know these motors inside and out.
    `,
    faqs: [
      {
        question: 'How do I know if my boat is worth repowering?',
        answer: 'If your hull, transom, and interior are in good condition, repowering almost always makes sense. We assess transom integrity and overall boat condition before recommending a repower.'
      },
      {
        question: 'Can I increase HP when repowering?',
        answer: 'Often yes, up to your boat\'s maximum rated HP. Modern motors are lighter and more efficient, so a higher HP motor may work well where it wouldn\'t have before. We\'ll help you choose the right size.'
      },
      {
        question: 'Do I need new controls when repowering?',
        answer: 'Not always. If your controls are 2004 or newer Mercury controls, they\'re likely compatible. Older controls may need replacement. We assess this during our repower consultation.'
      },
      {
        question: 'What warranty comes with a repower?',
        answer: 'New Mercury motors come with full factory warranty—typically 3 years for recreational use, with options to extend up to 8 years. The warranty covers the new motor regardless of boat age.'
      }
    ]
  },
  {
    slug: 'breaking-in-new-mercury-motor-guide',
    title: 'Breaking In Your New Mercury Motor: Complete Guide',
    description: 'Proper break-in ensures long engine life. Learn the correct procedure for breaking in your new Mercury outboard motor from certified technicians.',
    image: '/lovable-uploads/new-motor-breakin.jpg',
    author: 'Harris Boat Works',
    datePublished: '2024-02-20',
    dateModified: '2024-11-20',
    category: 'New Owner',
    readTime: '7 min read',
    keywords: ['mercury motor break in', 'new outboard break in procedure', 'mercury break in period', 'outboard motor break in', 'new boat motor care'],
    content: `
## Breaking In Your New Mercury Outboard

Congratulations on your new Mercury motor! Proper break-in during the first 10 hours ensures your engine delivers peak performance and long life.

### Why Break-In Matters

During manufacturing, engine components are machined to precise tolerances. The break-in period allows:
- Piston rings to seat properly
- Bearings to wear in evenly
- Components to mate correctly
- Optimal oil film to develop

Skipping or rushing break-in can lead to reduced performance, higher oil consumption, and shortened engine life.

### The 10-Hour Break-In Procedure

**First Hour (0-1 hours)**:
- Start engine and warm up at idle for 5 minutes
- Run at varying speeds below 3000 RPM
- Never hold steady throttle for more than a few minutes
- Avoid hard acceleration

**Hours 2-3**:
- Gradually increase to 3/4 throttle
- Continue varying speed every few minutes
- Brief full-throttle bursts okay (under 30 seconds)
- Allow engine to cool between runs

**Hours 4-10**:
- Normal operation at varying speeds
- Occasional full-throttle runs (1-2 minutes max)
- Avoid extended trolling at same speed
- Vary your throttle position regularly

### Break-In Oil

Mercury 4-stroke motors come pre-filled with break-in oil. After the first oil change (at 20 hours), switch to standard Mercury 4-Stroke Marine Oil or equivalent.

### What NOT to Do

❌ Run at constant speed for extended periods
❌ Immediately run at full throttle
❌ Let the engine overheat
❌ Skip the first oil change
❌ Use non-marine oil

### First Oil Change

Schedule your first oil change at **20 hours**—this is critical. The oil captures metal particles from the break-in process that need to be removed before they cause wear.

### After Break-In

Once you've completed the 10-hour break-in and 20-hour oil change, your motor is ready for normal operation. Continue following the maintenance schedule in your owner's manual.

### Let Us Help

When you purchase from Harris Boat Works, we walk you through the break-in procedure and offer complimentary first oil change at 20 hours. We want your motor to last as long as possible.
    `,
    faqs: [
      {
        question: 'What happens if I don\'t break in my motor properly?',
        answer: 'Improper break-in can cause glazed cylinder walls, poor ring seating, and increased oil consumption. In severe cases, it can lead to premature engine wear and reduced power output.'
      },
      {
        question: 'Can I go fishing during break-in?',
        answer: 'Absolutely! Just vary your speed regularly—don\'t troll at the same RPM for extended periods. Plan routes that let you change speed every few minutes.'
      },
      {
        question: 'Is the break-in procedure different for 2-stroke vs 4-stroke?',
        answer: 'Yes. 2-stroke motors have specific fuel/oil mixture requirements during break-in. Follow your owner\'s manual closely, and note that modern Mercury 2-strokes use oil injection that adjusts automatically.'
      },
      {
        question: 'Do I need to use Mercury oil during break-in?',
        answer: 'The motor comes with Mercury break-in oil. For subsequent oil changes, we recommend Mercury 4-Stroke Marine Oil, but any quality marine-rated oil meeting Mercury specifications is acceptable.'
      }
    ]
  }
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  const article = blogArticles.find(article => article.slug === slug);
  // Return undefined if article exists but is not yet published
  if (article && !isArticlePublished(article)) {
    return undefined;
  }
  return article;
}

export function getRelatedArticles(currentSlug: string, limit: number = 3): BlogArticle[] {
  return blogArticles
    .filter(article => article.slug !== currentSlug && isArticlePublished(article))
    .slice(0, limit);
}
