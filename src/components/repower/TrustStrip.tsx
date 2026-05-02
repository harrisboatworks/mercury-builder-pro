import { Award, BadgeCheck, Shield, Calendar } from 'lucide-react';
import mercuryRepowerLogo from '/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png?url';
import mercuryLogo from '@/assets/mercury-logo.png';
import warranty7 from '@/assets/harris-7-year-warranty.png';
import hbwLogo from '@/assets/harris-logo-white.png';

interface TrustItem {
  label: string;
  img?: string;
  imgAlt?: string;
  icon?: typeof Award;
}

const items: TrustItem[] = [
  { label: 'Mercury Repower Centre', img: mercuryRepowerLogo, imgAlt: 'Mercury Repower Center' },
  { label: 'Mercury Platinum Dealer', icon: Award },
  { label: 'CSI Award Winner', icon: BadgeCheck },
  { label: '7-Year Warranty', img: warranty7, imgAlt: '7-Year Warranty' },
  { label: 'Family-Owned Since 1947', img: hbwLogo, imgAlt: 'Harris Boat Works' },
];

export function TrustStrip() {
  return (
    <section className="bg-[#050E1C] border-y border-[#F5F1EA]/10">
      <div className="mx-auto max-w-[1400px] px-6 md:px-14 py-10 md:py-12">
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-8 md:gap-y-0 divide-x divide-[#F5F1EA]/10">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="group flex flex-col items-center justify-center gap-3 px-4 first:pl-0 last:pr-0"
              >
                <div className="h-10 flex items-center justify-center">
                  {item.img ? (
                    <img
                      src={item.img}
                      alt={item.imgAlt ?? item.label}
                      className="h-10 w-auto object-contain opacity-80 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition duration-500"
                    />
                  ) : Icon ? (
                    <Icon className="h-8 w-8 text-[#C9A24A]" strokeWidth={1.5} />
                  ) : null}
                </div>
                <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#C9A24A] text-center leading-tight">
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
