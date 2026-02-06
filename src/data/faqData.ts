import { Anchor, Wrench, Settings, Sparkles, Shield, Fuel, DollarSign, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  items: FAQItem[];
}

export const faqCategories: FAQCategory[] = [
  {
    id: 'choosing-motor',
    title: 'Choosing the Right Motor',
    icon: Anchor,
    description: 'HP sizing, motor families, and matching a Mercury outboard to your boat.',
    items: [
      {
        question: 'What size Mercury outboard do I need for my boat?',
        answer: 'The right horsepower depends on your boat\'s weight, length, intended use, and the manufacturer\'s HP rating plate. As a rough guide: boats up to 16 feet typically need 2.5–50 HP, 16–25-foot boats suit 60–150 HP, and larger boats (25 feet and up) often need 150–400 HP. We recommend bringing your boat\'s specs to us or using our <a href="/quote/motor-selection" class="text-primary hover:underline">online quote builder</a> — we\'ll help you match the perfect motor.'
      },
      {
        question: 'What\'s the difference between Mercury FourStroke, Pro XS, Verado, and SeaPro?',
        answer: 'Each family is built for a different kind of boater. <strong>FourStroke</strong> motors (2.5–300 HP) are the everyday workhorse — fuel-efficient, quiet, and great for pontoons, fishing boats, and family cruisers. <strong>Pro XS</strong> models are tuned for high performance and quick acceleration, popular with tournament anglers. <strong>Verado</strong> is Mercury\'s premium line with supercharged power, advanced digital controls, and the quietest ride on the water. <strong>SeaPro</strong> motors are built for commercial-duty reliability with heavy-gauge components. We carry all four families — <a href="/quote/motor-selection" class="text-primary hover:underline">browse our full inventory here</a>.'
      },
      {
        question: 'What is a ProKicker motor and do I need one?',
        answer: 'A ProKicker is a smaller auxiliary outboard (typically 9.9–15 HP) designed for slow trolling and precise boat control on fishing boats. It mounts alongside your main motor and gives you quiet, low-speed manoeuvrability — perfect for walleye trolling on Rice Lake or muskie fishing in the Kawarthas. If you fish regularly, a ProKicker can be a great addition to your setup.'
      },
      {
        question: 'How do I know which shaft length I need?',
        answer: 'Shaft length depends on your boat\'s transom height. Standard (15″) fits most small boats, long (20″) is the most common for bass boats and runabouts, and extra-long (25″) suits pontoons and larger craft. Your boat manufacturer\'s specs will list the correct transom height. If you\'re unsure, we can measure your boat at our shop in Gores Landing or walk you through it over the phone.'
      },
      {
        question: 'What\'s the difference between two-stroke and four-stroke Mercury outboards?',
        answer: 'Mercury\'s modern lineup is almost entirely four-stroke. Four-stroke engines run on straight gasoline (no oil mixing), deliver better fuel economy, produce lower emissions, run quieter, and require less maintenance. They\'re ideal for recreational boating. Mercury\'s older two-stroke models are lighter with a higher power-to-weight ratio, but are no longer in production for most horsepower ranges.'
      },
      {
        question: 'Can you help me choose between tiller and remote steering?',
        answer: 'Tiller steering gives you direct throttle and steering control from the back of the boat — it\'s popular for smaller fishing boats and portables. Remote steering uses a steering wheel and console-mounted controls, which is more comfortable for longer runs and bigger boats. We can set up either configuration and often recommend remote for anything over 40 HP.'
      }
    ]
  },
  {
    id: 'repowering',
    title: 'Repowering Your Boat',
    icon: Wrench,
    description: 'Signs it\'s time, cost expectations, and our Mercury Certified Repower process.',
    items: [
      {
        question: 'What is repowering and when should I consider it?',
        answer: 'Repowering means replacing your boat\'s existing engine with a new one. Consider it when your current motor is costing more to repair than it\'s worth, burning excessive fuel, losing reliability, or when you simply want more (or less) horsepower. If your hull and interior are in good shape, repowering is far more economical than buying a new boat. Learn more on our <a href="/repower" class="text-primary hover:underline">dedicated repower page</a>.'
      },
      {
        question: 'What does a repower cost?',
        answer: 'The total cost includes the motor, rigging, controls, propeller, and professional installation. A small portable repower might start around $3,000–$5,000, while a mid-range FourStroke (75–150 HP) typically runs $12,000–$25,000 installed. High-performance or Verado setups go higher. Use our <a href="/quote/motor-selection" class="text-primary hover:underline">quote builder</a> to get an accurate, itemized estimate for your specific boat.'
      },
      {
        question: 'What does the repower process look like at Harris Boat Works?',
        answer: 'We start with a free consultation to assess your boat and discuss your goals. Then we help you select the right motor and package. Once you\'ve approved the quote, we remove the old engine, install your new Mercury with all new rigging and controls, and finish with a thorough lake test on Rice Lake. Most repowers are completed within a few days of receiving the motor. As a <strong>Mercury Certified Repower Center</strong>, every installation meets Mercury\'s factory standards.'
      },
      {
        question: 'Can I repower with a different horsepower than my original motor?',
        answer: 'Yes, within your boat manufacturer\'s rated HP range (listed on the capacity plate). Going up in HP can dramatically improve performance. Going down can save fuel and weight. We\'ll make sure whatever you choose is safe and properly matched to your hull.'
      },
      {
        question: 'Do I need to replace all the rigging when I repower?',
        answer: 'In most cases, yes. New rigging (cables, harness, gauges, controls) ensures everything works together reliably and is covered under Mercury\'s warranty. Reusing old rigging can cause compatibility issues and voids certain warranty coverage. Our repower packages include all necessary rigging.'
      },
      {
        question: 'What happens to my old motor?',
        answer: 'We can arrange disposal or you can keep it. If your old motor has trade-in value, we\'ll factor that into your quote. You can estimate your trade-in value using our <a href="/quote/motor-selection" class="text-primary hover:underline">quote builder</a> — it includes a trade-in assessment step.'
      }
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Service',
    icon: Settings,
    description: 'Service schedules, seasonal care, and keeping your Mercury running strong.',
    items: [
      {
        question: 'How often should I service my Mercury outboard?',
        answer: 'Mercury recommends service at these intervals: <strong>Every 100 hours or 1 year</strong> — oil and filter change, gear oil, fuel filter, spark plug inspection. <strong>Every 300 hours or 3 years</strong> — add water pump impeller, anodes, and a more thorough inspection. <strong>Every 500 hours or 5 years</strong> — comprehensive evaluation. Sticking to this schedule keeps your warranty intact and your motor reliable.'
      },
      {
        question: 'What\'s included in a 100-hour service?',
        answer: 'A 100-hour service covers oil and oil filter change, gear lube replacement, fuel filter replacement, spark plug inspection or replacement, lanyard stop switch check, steering system inspection, propeller inspection, corrosion anode check, battery condition check, and lubrication of all grease points.'
      },
      {
        question: 'Should I service my motor myself or use a professional?',
        answer: 'Basic tasks like checking oil, inspecting the propeller, and flushing after use are fine for most owners. However, for warranty-covered service, annual maintenance, and anything involving the fuel system, electrical, or lower unit, we recommend a Mercury-authorized technician. Our factory-trained team uses genuine Mercury parts and diagnostic tools. Submit your service request at <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">hbw.wiki/service</a>.'
      },
      {
        question: 'How do I winterize my Mercury outboard?',
        answer: 'Proper winterization includes adding Mercury Quickstor fuel stabilizer, fogging the engine, changing oil and gear lube, draining water from the cooling system, greasing all fittings, disconnecting the battery, and storing the motor in a vertical or slightly trimmed-down position. We offer full winterization service — most customers book in the fall. Contact us at <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">hbw.wiki/service</a> to schedule.'
      },
      {
        question: 'What maintenance records should I keep?',
        answer: 'Keep detailed records of every service: dates, engine hours, what was done, parts used, and who performed the work. These records are essential for warranty claims, resale value, and tracking your motor\'s health. We keep digital records of all work performed at our shop.'
      },
      {
        question: 'How do I flush my outboard after use?',
        answer: 'After every outing — especially in dirty or silty water — flush your motor by connecting a garden hose to the flush port (or using ear muffs on the lower unit) and running the engine at idle for 5–10 minutes. The engine must be running when flushing. Never start your motor dry — running without water circulation will damage the water pump and cause overheating.'
      }
    ]
  },
  {
    id: 'new-motor',
    title: 'New Motor Ownership',
    icon: Sparkles,
    description: 'Break-in procedures, first service, and getting started with your new Mercury.',
    items: [
      {
        question: 'Is there a break-in period for a new Mercury outboard?',
        answer: 'Yes. Mercury recommends a break-in period for the first 10 hours of operation. During this time, vary your speed — avoid running at full throttle for extended periods, and alternate between different RPM ranges. This allows the piston rings, bearings, and gears to seat properly. Your owner\'s manual has the specific break-in schedule for your model.'
      },
      {
        question: 'When should I do the first oil change on a new Mercury?',
        answer: 'Mercury recommends the first oil and filter change at 20 hours of operation (or after the break-in period). This initial change removes any metal particles from the break-in process. After that, follow the standard 100-hour/annual interval. We include the first service in many of our repower packages.'
      },
      {
        question: 'How do I register my Mercury warranty?',
        answer: 'When you purchase from Harris Boat Works, we handle the warranty registration for you as part of the delivery process. Your warranty begins on the date of purchase. We\'ll provide you with all the documentation you need. If you ever need to verify your warranty status, Mercury\'s customer support can look it up with your serial number.'
      },
      {
        question: 'What fluids and lubricants should I use?',
        answer: 'Always use Mercury-approved products: <strong>Engine Oil</strong> — Mercury or Quicksilver marine-grade oil (weight specified for your model). <strong>Gear Lube</strong> — Mercury High Performance Gear Lube. <strong>Power Trim Fluid</strong> — Mercury/Quicksilver Power Trim and Steering Fluid. <strong>Fuel Treatment</strong> — Mercury Quickstor for storage. Using the correct fluids protects your engine and maintains warranty coverage.'
      },
      {
        question: 'What spare parts should I keep on my boat?',
        answer: 'We recommend carrying: a floating prop wrench, spare propeller and hardware, spare spark plugs, engine oil, power trim/steering fluid, gear lube, a water-separating fuel filter, and appropriate fuses. A basic toolkit and safety kit (flares, throwable PFD) are also essential for Ontario waters.'
      }
    ]
  },
  {
    id: 'warranty',
    title: 'Warranty & Protection',
    icon: Shield,
    description: 'Coverage details, extended options, and what Mercury\'s warranty includes.',
    items: [
      {
        question: 'What warranty comes with a new Mercury outboard?',
        answer: 'New Mercury outboards come with a <strong>3-year factory limited warranty</strong> covering parts and labour from any manufacturing defects. Mercury also offers extended warranty plans for additional peace of mind. When combined with current promotions, you may receive up to 8 years of total coverage. Check our <a href="/promotions" class="text-primary hover:underline">promotions page</a> for current warranty offers.'
      },
      {
        question: 'Does the warranty cover rigging and controls?',
        answer: 'Yes — if genuine Mercury Precision Parts and rigging were used during installation on boats built after May 2007, the rigging warranty matches your engine warranty (up to 3 years). This is one reason we always use genuine Mercury parts in our installations.'
      },
      {
        question: 'Can I get warranty service at any Mercury dealer?',
        answer: 'Yes, Mercury\'s warranty is honoured at all 4,300+ authorized Mercury dealers across the United States and Canada. Whether you\'re boating on Rice Lake or travelling, you\'re covered.'
      },
      {
        question: 'What can void my Mercury warranty?',
        answer: 'Common warranty exclusions include: using fuel with more than 10% ethanol (E10), failing to perform required maintenance, using non-Mercury parts for warranty-covered repairs, improper installation, racing or commercial use (on recreational models), and any modifications that affect engine performance or emissions.'
      },
      {
        question: 'What are Mercury\'s extended warranty options?',
        answer: 'Mercury offers Mercury Product Protection (MPP) extended service contracts that can extend your coverage beyond the standard 3 years. These are transferable if you sell your boat, adding to resale value. Ask us about current extended warranty pricing — it\'s often most affordable when purchased with your new motor.'
      }
    ]
  },
  {
    id: 'fuel-operation',
    title: 'Fuel, Operation & Safety',
    icon: Fuel,
    description: 'Fuel types, ethanol safety, storage, and operating your motor correctly.',
    items: [
      {
        question: 'What fuel should I use in my Mercury outboard?',
        answer: 'Use regular unleaded gasoline with a minimum 87 octane rating. Mercury accepts fuels containing up to 10% ethanol (E10). <strong>Do not use fuel with more than 10% ethanol</strong> (E15, E85, etc.) — it can damage fuel system components and void your warranty. We sell ethanol-free fuel on-site at our Gores Landing location, which is the best option for marine engines.'
      },
      {
        question: 'Why is ethanol bad for boat motors?',
        answer: 'Higher ethanol content causes phase separation — water and ethanol separating from the gasoline — which can reduce octane by up to 3 points, corrode fuel system components, clog injectors, and cause hard starting. Even E10 can cause problems if fuel sits too long. That\'s why we recommend ethanol-free fuel (available at our shop) and treating stored fuel with Mercury Quickstor.'
      },
      {
        question: 'Can I start my Mercury outboard out of the water?',
        answer: '<strong>Never start or run your outboard without water circulating through the cooling system.</strong> Running dry — even for a few seconds — will damage the water pump impeller and cause engine overheating. Always use a flush attachment or ensure the motor is in the water before starting.'
      },
      {
        question: 'How should I store fuel over the off-season?',
        answer: 'Add Mercury Quickstor fuel stabilizer before your last outing of the season. Run the engine long enough for treated fuel to reach the entire system. For long-term storage, some owners prefer to drain the fuel system entirely. Never store a motor with old, untreated fuel — modern gasoline can degrade in as little as two weeks.'
      },
      {
        question: 'What causes hard starting and performance issues?',
        answer: 'Fuel system contamination is the number one cause. Old or ethanol-damaged fuel clogs filters and injectors. Other common culprits include fouled spark plugs, a weak battery, water in the fuel, or a dirty fuel/water separator. Regular maintenance prevents most of these issues.'
      },
      {
        question: 'Should I add an extra fuel filter to my Mercury outboard?',
        answer: 'No. Adding an aftermarket filter creates additional flow restriction that can starve the engine of fuel and cause performance problems. Mercury provides the correct level of filtration from the factory. Simply replace the OEM filter at the recommended intervals.'
      }
    ]
  },
  {
    id: 'financing',
    title: 'Financing & Pricing',
    icon: DollarSign,
    description: 'Payment options, deposits, and how our quote builder works.',
    items: [
      {
        question: 'Do you offer financing on Mercury motors?',
        answer: 'Yes! We offer competitive marine financing through Dealerplan on purchases over $10,000. You can apply online through our website and get pre-approved. Visit our <a href="/finance-calculator" class="text-primary hover:underline">finance calculator</a> to estimate your monthly payments, or start a full <a href="/financing-application" class="text-primary hover:underline">financing application</a>.'
      },
      {
        question: 'How does the online quote builder work?',
        answer: 'Our <a href="/quote/motor-selection" class="text-primary hover:underline">quote builder</a> lets you select any Mercury motor from our inventory, choose your package (motor-only, rigging, or complete install), add accessories and warranty options, apply current promotions, and see your total price instantly. You can save your quote, download a PDF, share it, or proceed to place a deposit — all online with no pressure.'
      },
      {
        question: 'How much is the deposit to reserve a motor?',
        answer: 'Deposit amounts are based on horsepower: <strong>$200</strong> for motors 0–25 HP, <strong>$500</strong> for 30–115 HP, and <strong>$1,000</strong> for 150 HP and above. The deposit locks in your quoted price and holds the motor until you pick it up in person at our Gores Landing location.'
      },
      {
        question: 'Are deposits refundable?',
        answer: 'Yes, all deposits are fully refundable if you change your mind. There are no restocking fees or penalties. We accept Apple Pay, Google Pay, Link (Stripe one-click), and all major credit cards for deposits.'
      },
      {
        question: 'Do I have to buy the motor in person?',
        answer: 'Yes — all motor purchases must be completed in-person with valid photo ID at our Gores Landing location. This is an industry-wide policy to prevent fraud. You can complete the entire quoting and financing process online, but final pickup requires an in-person visit.'
      },
      {
        question: 'Are there current promotions or rebates?',
        answer: 'We frequently run Mercury promotions including factory rebates, extended warranty offers, and financing specials. Visit our <a href="/promotions" class="text-primary hover:underline">promotions page</a> for current offers. Promotions are automatically applied in our quote builder when available.'
      }
    ]
  },
  {
    id: 'about-hbw',
    title: 'About Harris Boat Works',
    icon: MapPin,
    description: 'Location, credentials, service area, and who we are.',
    items: [
      {
        question: 'How long has Harris Boat Works been in business?',
        answer: 'Harris Boat Works was founded in 1947, making us a family-owned business serving Ontario boaters for 79 years. We\'ve been an authorized Mercury Marine dealer since 1965 — over 60 years of Mercury expertise. Learn more on our <a href="/about" class="text-primary hover:underline">About page</a>.'
      },
      {
        question: 'Where are you located?',
        answer: 'We\'re located at 5369 Harris Boat Works Rd in Gores Landing, Ontario (K0K 2E0), right on the shores of Rice Lake. We\'re about 1.5 hours from Toronto, 30 minutes from Peterborough, and centrally located in the Kawartha Lakes region.'
      },
      {
        question: 'What areas do you serve?',
        answer: 'We serve boaters throughout Central Ontario including Peterborough, Cobourg, Port Hope, Lindsay, Kawartha Lakes, and the greater GTA. Customers regularly visit from across the province for our pricing and service quality.'
      },
      {
        question: 'What certifications do you hold?',
        answer: 'We are a <strong>Mercury Certified Repower Center</strong> and a <strong>Mercury CSI Award Winner</strong> (Customer Satisfaction Index). Our technicians are factory-trained and certified by Mercury Marine. These credentials mean every installation and repair meets Mercury\'s highest standards.'
      },
      {
        question: 'How do I contact you?',
        answer: 'Phone: <a href="tel:+19053422153" class="text-primary hover:underline">(905) 342-2153</a> · Email: <a href="mailto:info@harrisboatworks.ca" class="text-primary hover:underline">info@harrisboatworks.ca</a> · For service requests, use our online form at <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">hbw.wiki/service</a>. You can also <a href="/contact" class="text-primary hover:underline">send us a message</a> through our website.'
      },
      {
        question: 'Do you sell ethanol-free fuel?',
        answer: 'Yes! We sell ethanol-free fuel on-site at our Gores Landing location. Ethanol-free fuel is the best choice for marine engines — it eliminates the risk of phase separation and fuel system damage that ethanol-blended fuels can cause.'
      }
    ]
  }
];

/** Flat list of all FAQ items for SEO schema generation */
export function getAllFAQItems(): FAQItem[] {
  return faqCategories.flatMap(cat => cat.items);
}
