import { Link } from 'react-router-dom';
import { ChevronRight, Phone } from 'lucide-react';
import { repowerImages } from './repowerImages';

export function FinalCTARepower() {
  return (
    <section className="relative overflow-hidden bg-[#050E1C] text-[#F5F1EA]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${repowerImages.finalCta})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050E1C] via-[#050E1C]/85 to-[#050E1C]/70" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-14 py-24 md:py-[160px] text-center">
        <p className="font-sans font-semibold text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-6">
          Your Adventure, Repowered
        </p>
        <h2
          className="font-display font-bold text-[clamp(48px,7vw,104px)] tracking-tight leading-[1.02] mb-8 max-w-4xl mx-auto"
          style={{ letterSpacing: '-0.035em' }}
        >
          Get your <em className="not-italic italic text-[#C8102E]">weekends</em> back.
        </h2>
        <p className="font-sans font-light text-lg md:text-2xl text-[#F5F1EA]/75 max-w-2xl mx-auto mb-12 leading-relaxed">
          No pressure. No games. Real CAD pricing from a dealer who's been on this lake for over 75 years.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/quote/motor-selection"
            className="group inline-flex items-center justify-center gap-2 bg-[#C8102E] hover:bg-[#9A0C24] text-white px-8 py-4 rounded uppercase tracking-wider text-sm font-semibold shadow-lg shadow-[#C8102E]/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            Build Your Quote
            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="tel:9053422153"
            className="inline-flex items-center justify-center gap-2 border border-[#F5F1EA]/30 text-[#F5F1EA] px-8 py-4 rounded uppercase tracking-wider text-sm font-semibold hover:bg-[#F5F1EA]/5 transition-all duration-300"
          >
            <Phone className="w-4 h-4" />
            (905) 342-2153
          </a>
        </div>

        <p className="font-sans text-xs uppercase tracking-[0.18em] text-[#F5F1EA]/40 mt-12">
          5369 Harris Boat Works Rd · Gores Landing, ON · info@harrisboatworks.ca
        </p>
      </div>
    </section>
  );
}
