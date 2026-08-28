import { useState, useEffect, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { FAQPageSEO } from '@/components/seo/FAQPageSEO';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { faqCategories } from '@/data/faqData';
import { cn } from '@/lib/utils';

export default function FAQ() {
  const [activeSection, setActiveSection] = useState(faqCategories[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLElement>(null);

  // Scroll-spy via Intersection Observer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    faqCategories.forEach(cat => {
      const el = sectionRefs.current[cat.id];
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(cat.id);
          }
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 120; // account for sticky nav
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  // Scroll active chip into view in the nav bar
  useEffect(() => {
    if (!navRef.current) return;
    const activeChip = navRef.current.querySelector(`[data-category="${activeSection}"]`);
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-repower-paper">
      <FAQPageSEO />
      <RepowerHeader />

      <main className="pt-[64px] lg:pt-[72px]">
        {/* Breadcrumb */}
        <div className="container mx-auto px-6 md:px-14 pt-6 max-w-[880px]">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-repower-navy-900/60 hover:text-repower-mercury-red">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-repower-navy-900/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-repower-navy-900">FAQ</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero Section */}
        <section aria-labelledby="faq-hero-title" className="py-8 md:py-16 text-center">
          <div className="container mx-auto px-6 md:px-14 max-w-[880px]">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red">
                Frequently Asked Questions
              </p>
            </div>
            <h1
              id="faq-hero-title"
              className="font-display font-bold text-repower-navy-900 mb-5"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              Mercury Outboard Repower <span className="italic text-repower-mercury-red">FAQ</span>
            </h1>
            <p
              id="faq-hero-description"
              className="font-sans text-[16px] md:text-[18px] text-repower-navy-900/70 max-w-[60ch] mx-auto leading-relaxed"
            >
              Repowering means replacing your boat's existing outboard motor with a new one.
              At Harris Boat Works, we specialize in Mercury outboard repowers, from 2.5hp kickers
              to 300hp performance engines. We handle the full process: motor selection, rigging,
              controls, gauges, and installation.
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button asChild className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep">
                <Link to="/quote/motor-selection">Build Your Quote <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" asChild className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5">
                <Link to="/contact">Ask a Different Question</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Category Navigation */}
        <nav
          ref={navRef}
          aria-label="FAQ categories"
          className="sticky top-16 z-30 bg-repower-paper/95 backdrop-blur-sm border-y border-repower-navy-900/10"
        >
          <div className="container mx-auto px-6 md:px-14">
            <div
              className="flex min-w-0 flex-nowrap gap-1.5 overflow-x-auto py-2 pr-8 scrollbar-hide md:gap-2 md:py-3 md:pr-0"
              style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 12px, black calc(100% - 28px), transparent 100%)' }}
            >
              {faqCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.id;
                return (
                  <button
                    key={cat.id}
                    data-category={cat.id}
                    onClick={() => scrollToSection(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                      isActive
                        ? 'bg-repower-navy-900 text-white'
                        : 'bg-white text-repower-navy-900/70 border border-repower-navy-900/10 hover:text-repower-navy-900 hover:border-repower-navy-900/30'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {cat.title}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* FAQ Sections */}
        <div className="container mx-auto px-6 md:px-14 py-9 md:py-16">
          <div className="max-w-[880px] mx-auto space-y-16">
            {faqCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <section
                  key={cat.id}
                  id={cat.id}
                  ref={el => { sectionRefs.current[cat.id] = el; }}
                  aria-labelledby={`heading-${cat.id}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-repower-mercury-red shrink-0" strokeWidth={1.5} />
                    <h2
                      id={`heading-${cat.id}`}
                      className="font-display font-bold text-2xl md:text-[28px] text-repower-navy-900"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {cat.title}
                    </h2>
                  </div>
                  <p className="font-sans text-repower-navy-900/65 text-sm mb-5 ml-9">
                    {cat.description}
                  </p>

                  <Accordion type="single" collapsible className="border-t border-repower-navy-900/10">
                    {cat.items.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${cat.id}-${idx}`}
                        className="border-b border-repower-navy-900/10 group"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-5 px-2 hover:bg-repower-navy-900/[0.04] rounded-sm transition-colors [&>svg]:text-repower-navy-900">
                          <span className="font-sans font-semibold text-[16px] md:text-[17px] text-repower-navy-900 pr-4 relative inline-block group-data-[state=open]:after:content-[''] group-data-[state=open]:after:absolute group-data-[state=open]:after:left-0 group-data-[state=open]:after:-bottom-1 group-data-[state=open]:after:h-[2px] group-data-[state=open]:after:w-10 group-data-[state=open]:after:bg-repower-gold">
                            {item.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="font-sans text-[15px] text-repower-navy-900/75 pb-5 px-2 leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.answer, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'span'], ALLOWED_ATTR: ['href', 'target', 'rel'] }) }} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <section
          aria-labelledby="faq-cta"
          className="py-20 md:py-24 bg-repower-cream border-t border-repower-navy-900/10"
        >
          <div className="max-w-[880px] mx-auto px-6 md:px-14 text-center">
            <div className="h-px w-12 bg-repower-gold mx-auto mb-8" />
            <h2
              id="faq-cta"
              className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-4"
              style={{ letterSpacing: '-0.025em' }}
            >
              Ready to Get a <span className="italic text-repower-mercury-red">Quote</span>?
            </h2>
            <p className="font-sans text-repower-navy-900/70 mb-8 max-w-2xl mx-auto">
              Build your Mercury repower quote online, live pricing, sale prices, and monthly payment
              estimates on every motor from 2.5hp to 300hp. No phone call required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep">
                <Link to="/quote/motor-selection">
                  Build Your Quote
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5">
                <a href="https://hbw.wiki/service" target="_blank" rel="noopener noreferrer">
                  Book Service
                </a>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-repower-navy-900 hover:bg-repower-navy-900/5">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
