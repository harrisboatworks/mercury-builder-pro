import { Anchor, Wrench, Settings, DollarSign, Shield } from 'lucide-react';
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
    id: 'repower-basics',
    title: 'Repower Basics',
    icon: Anchor,
    description: 'What repowering means, what\'s included, and whether it\'s the right move for your boat.',
    items: [
      {
        question: 'What does it mean to repower a boat?',
        answer: 'Repowering means replacing your boat\'s existing outboard motor with a new one while keeping the boat itself. The hull, deck, and structure stay the same — only the engine changes. A full repower at Harris Boat Works includes the motor, rigging, controls, and gauges, so your boat comes out running like new. Most customers repower because their motor is worn out, underpowered, or simply too old to be worth repairing.'
      },
      {
        question: 'Is it worth repowering my boat or should I buy a new boat?',
        answer: 'Repowering is almost always the better value if your hull is in good condition. A new outboard costs a fraction of a new boat, and you already know the hull — its quirks, its history, and how it handles on your lake. Buying a new boat means new financing, new registration, new insurance, and a learning curve. If you love your boat but hate the motor, a repower is the right move. If the hull has structural issues or the boat no longer fits your needs, that\'s when a new boat makes sense.'
      },
      {
        question: 'How long does a Mercury repower take?',
        answer: 'Most repowers are completed in one to three days once your boat is with us. The timeline depends on the motor size, the complexity of the rigging, and how many other jobs are in the shop at the same time. Spring is our busiest period — if you\'re planning a repower for the season, booking in the fall or winter gets you priority scheduling. Submit a service request at <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">hbw.wiki/service</a> to get a timeline estimate.'
      },
      {
        question: 'What\'s included in a repower package?',
        answer: 'A Mercury repower package at Harris Boat Works includes the new Mercury outboard motor, installation, and full rigging — that means new throttle and shift controls, steering connections, fuel lines, and gauges as required. We handle everything so you\'re not left with a new motor and old, incompatible hardware. Use the configurator at <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a> to see what\'s included and get live pricing on the motor that fits your boat.'
      },
      {
        question: 'Can I repower a pontoon boat?',
        answer: 'Yes — pontoons are one of the most common repower candidates. Because pontoons are heavy and sit high in the water, we typically recommend Mercury motors with Command Thrust, which uses a larger gearcase to generate more thrust at lower RPM. This makes a big difference in getting a loaded pontoon on plane and handling in wind or current. Most pontoon repowers fall in the 90–150hp range, depending on the tube configuration (double vs. triple) and how you use the boat. Build a quote at <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a> and we\'ll confirm the right motor and shaft length for your pontoon.'
      }
    ]
  },
  {
    id: 'choosing-motor',
    title: 'Choosing the Right Motor',
    icon: Settings,
    description: 'HP sizing, shaft length, motor families, and matching a Mercury outboard to your boat.',
    items: [
      {
        question: 'How do I choose the right horsepower for my boat?',
        answer: 'Start with your boat\'s maximum horsepower rating, which is stamped on the capacity plate near the transom — you cannot exceed this rating safely or legally. From there, match the motor to how you use the boat: fishing and cruising at moderate speeds works fine with mid-range power, while watersports and larger loads benefit from topping out closer to the maximum. If your boat is rated for 115hp, running 90hp is fine; running 150hp is not. When in doubt, bring your boat specs to <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a> and we can help you choose the right fit.'
      },
      {
        question: 'How do I know what shaft length I need?',
        answer: 'Shaft length is determined by the height of your transom. <strong>Short shaft (15 inches)</strong> — small boats and older hulls with low transoms. <strong>Long shaft (20 inches)</strong> — the standard for most runabouts, fishing boats, and aluminum hulls. <strong>Extra-long shaft (25 inches)</strong> — required for pontoons, higher-profile transoms, and boats where the motor mounts on a raised bracket. Measure your transom height from the mounting surface to the waterline. That measurement tells you the shaft length you need. Harris Boat Works will confirm the correct shaft length when you bring your boat in.'
      },
      {
        question: 'What\'s the difference between Mercury FourStroke and Pro XS?',
        answer: 'Mercury FourStroke is the standard lineup — quiet, fuel-efficient, and built for everyday use on family boats, fishing boats, and pontoons. Pro XS is Mercury\'s performance-oriented line, engineered for higher RPM, faster hole shots, and applications where top speed and acceleration matter, such as tournament fishing and performance runabouts. FourStroke is the right choice for most repower customers. Pro XS makes sense if you\'re chasing performance and your boat\'s hull and transom rating can support it. Both carry Mercury\'s warranty and are available through <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a>.'
      },
      {
        question: 'What is Command Thrust and do I need it?',
        answer: 'Command Thrust is Mercury\'s designation for a larger gearcase and lower unit, designed to generate more thrust at lower RPM. It\'s built for pontoons, heavier aluminum boats, and any application where the boat is difficult to get on plane or needs strong low-speed control — think docking a loaded pontoon in a crosswind. If you have a standard runabout or fishing boat, a regular gearcase is fine. If you\'re on a pontoon or a heavy hull, Command Thrust gives you noticeably better handling and pushing power. We\'ll confirm whether Command Thrust is right for your boat when you get your quote at <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a>.'
      },
      {
        question: 'What is a ProKicker and when do I need one?',
        answer: 'A ProKicker is a Mercury FourStroke kicker motor (9.9hp or 15hp) configured specifically for use as a secondary trolling engine mounted alongside a larger primary motor. It includes features like a tiller extension, slow-speed control, and bracket compatibility designed for dual-engine setups on fishing boats. You need a ProKicker when you want precise low-speed trolling control without running your main motor at inefficient RPM. It\'s a popular addition for serious walleye and bass anglers who want quiet, fuel-efficient trolling speed with a larger motor standing by.'
      }
    ]
  },
  {
    id: 'cost-financing',
    title: 'Cost & Financing',
    icon: DollarSign,
    description: 'Repower pricing, financing options, trade-ins, and current Mercury promotions.',
    items: [
      {
        question: 'How much does a Mercury repower cost?',
        answer: 'Mercury repower costs at Harris Boat Works range from approximately $1,895 for a 4hp kicker to $30,000 or more for a 250–300hp performance engine. The price depends on the specific motor model, shaft length, and any rigging or controls required. The most accurate way to get pricing is to use the live quote configurator at <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a> — prices are current and updated in real time, including any active sale pricing.'
      },
      {
        question: 'Can I finance a Mercury repower?',
        answer: 'Yes — financing is available on Mercury repower packages. The <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a> configurator shows monthly payment estimates alongside the purchase price for each motor, so you can compare options before you commit. Financing is available to qualified Ontario customers. To proceed, build your quote on mercuryrepower.ca and follow the financing steps in the configurator, or contact Harris Boat Works directly at <a href="tel:9053422153" class="text-primary hover:underline">905-342-2153</a>.'
      },
      {
        question: 'Can I trade in my old motor?',
        answer: 'Yes — Harris Boat Works accepts trade-in motors as part of the repower process. The value of your old motor depends on its brand, horsepower, age, and condition. We evaluate trade-ins when you bring your boat in for the repower. To get the process started, submit a service request at <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">hbw.wiki/service</a> and include details about your existing motor.'
      },
      {
        question: 'Are there any current Mercury promotions?',
        answer: 'Mercury regularly runs seasonal promotions including extended warranty programs, rebate offers, and financing specials. These change throughout the year. The configurator at <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a> automatically applies any active promotions to your quote so you always see the best available pricing. You can also call Harris Boat Works at <a href="tel:9053422153" class="text-primary hover:underline">905-342-2153</a> to ask about current offers.'
      }
    ]
  },
  {
    id: 'process-service',
    title: 'Process & Service',
    icon: Wrench,
    description: 'What to expect during the repower process, location, and service details.',
    items: [
      {
        question: 'Do I need to bring my boat to you for a repower?',
        answer: 'Yes — your boat needs to come to us for the repower. We\'re located at Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, ON, on the shore of Rice Lake. We have full marina access, so you can trailer your boat in or, in season, arrive by water. To schedule a drop-off, submit a service request at <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">hbw.wiki/service</a> or call us at <a href="tel:9053422153" class="text-primary hover:underline">905-342-2153</a>.'
      },
      {
        question: 'How far are you from Peterborough, Toronto, and Cobourg?',
        answer: 'Harris Boat Works is approximately 35 minutes from Peterborough, 20 minutes from Cobourg, and about 90 minutes from Toronto. We\'re on Rice Lake in Gores Landing — easy to reach from anywhere in the Kawarthas, Northumberland, or the GTA. The address is 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0.'
      },
      {
        question: 'Can you repower a boat that currently has a Yamaha, Honda, or Suzuki motor?',
        answer: 'Yes — we convert boats from any brand to Mercury. If your current motor is a Yamaha, Honda, Suzuki, or any other brand, we handle the full switchover including new Mercury-compatible controls, rigging, and gauges. The repower process is the same regardless of what\'s coming off. Your old motor can be taken in on trade or disposed of through us. Get a quote for the Mercury motor that fits your boat at <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a>.'
      },
      {
        question: 'What happens to my old motor after a repower?',
        answer: 'You have two options: trade it in for credit toward the cost of your new Mercury, or have Harris Boat Works dispose of it. If your motor has usable life remaining, trade-in credit offsets some of the repower cost. If it\'s worn out, we handle disposal so you don\'t have to. Let us know your preference when you book your repower through <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">hbw.wiki/service</a>.'
      },
      {
        question: 'Do you handle the rigging and controls as part of a repower?',
        answer: 'Yes — full rigging is included in every Mercury repower at Harris Boat Works. That covers throttle and shift controls, steering connections, fuel lines, and gauges. We don\'t just bolt on a new motor and send you home — the whole system is updated so your new Mercury operates correctly and safely. This is part of what makes a full repower package different from simply buying a motor and installing it yourself.'
      }
    ]
  },
  {
    id: 'mercury-specific',
    title: 'Mercury Specific',
    icon: Shield,
    description: 'Mercury warranty coverage, dealer status, and where Mercury motors are made.',
    items: [
      {
        question: 'What is Mercury\'s warranty on new outboards?',
        answer: 'New Mercury outboard motors come with a standard 3-year limited warranty covering defects in materials and workmanship. When Mercury\'s Get 7 promotion is active, coverage on eligible FourStroke models is extended to 7 years — more than double the standard term. Harris Boat Works is a Mercury Marine Platinum Dealer, which means warranty work is handled directly at our facility. Check <a href="https://mercuryrepower.ca" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">mercuryrepower.ca</a> or contact us to confirm current warranty programs at the time of purchase.'
      },
      {
        question: 'Where are Mercury outboards made?',
        answer: 'Mercury Marine is headquartered in Fond du Lac, Wisconsin, and Mercury outboard engines are manufactured in the United States. Mercury has been building outboard motors since 1939 and is one of the largest marine engine manufacturers in the world. Harris Boat Works has been a Mercury dealer for over 60 years and holds Platinum Dealer status — the highest tier in Mercury\'s dealer program.'
      }
    ]
  }
];

/** Flat list of all FAQ items for SEO schema generation */
export function getAllFAQItems(): FAQItem[] {
  return faqCategories.flatMap(cat => cat.items);
}
