import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { LuxuryHeader } from '@/components/ui/luxury-header';
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
    <div className="min-h-screen bg-background">
      <FAQPageSEO />
      <LuxuryHeader />

      <main>
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>FAQ</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero Section */}
        <section aria-labelledby="faq-hero-title" className="py-12 md:py-16 text-center">
          <div className="container mx-auto px-4 max-w-3xl">
            <h1
              id="faq-hero-title"
              className="text-3xl md:text-5xl font-light text-foreground mb-4"
            >
              Mercury Outboard <span className="font-medium">FAQ</span>
            </h1>
            <p
              id="faq-hero-description"
              className="text-lg text-muted-foreground font-light"
            >
              Expert answers to the most common questions about buying, maintaining, and repowering
              Mercury outboard motors — from Ontario's trusted Mercury dealer since 1965.
            </p>
          </div>
        </section>

        {/* Category Navigation */}
        <nav
          ref={navRef}
          aria-label="FAQ categories"
          className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border"
        >
          <div className="container mx-auto px-4">
            <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
              {faqCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.id;
                return (
                  <button
                    key={cat.id}
                    data-category={cat.id}
                    onClick={() => scrollToSection(cat.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.title}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* FAQ Sections */}
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-3xl mx-auto space-y-14">
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
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2
                      id={`heading-${cat.id}`}
                      className="text-xl md:text-2xl font-medium text-foreground"
                    >
                      {cat.title}
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-sm mb-5 ml-12">
                    {cat.description}
                  </p>

                  <Accordion type="single" collapsible className="space-y-3">
                    {cat.items.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${cat.id}-${idx}`}
                        className="bg-background rounded-lg border shadow-sm px-6 data-[state=open]:bg-muted/30"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="font-medium text-foreground pr-4">
                            {item.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: item.answer }} />
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
          className="py-16 md:py-20 bg-muted/30"
        >
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2
              id="faq-cta"
              className="text-2xl md:text-3xl font-light mb-4"
            >
              Ready to Find Your <span className="font-medium">Motor</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build your custom Mercury outboard quote online, or visit us at Rice Lake to see our inventory in person.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/quote/motor-selection">
                  Browse Motors
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
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
