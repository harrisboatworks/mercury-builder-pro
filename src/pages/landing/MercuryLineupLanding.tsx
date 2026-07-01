import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { MercuryLineupLandingSEO, formatFromPriceCAD, unifyPriceCopy } from '@/components/seo/MercuryLineupLandingSEO';
import { ALL_SEGMENTS, type LandingConfig } from '@/data/landing/mercuryLineupLandings';
import { ChevronRight, Phone, ShieldCheck, Wrench, Award } from 'lucide-react';

function formatCAD(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n);
}

// Reusable landing page that mirrors the Pro XS 250 structure for every
// /mercury/* HP-band page. All copy comes from the LandingConfig.
export default function MercuryLineupLanding({ config }: { config: LandingConfig }) {
  // Unify any hardcoded "$X,XXX CAD" in visible hero copy to the same live
  // min-price the JSON-LD schema uses (Math.min of variants[].hbwPrice).
  const fromPriceStr = formatFromPriceCAD(config.variants);
  const h1 = unifyPriceCopy(config.h1, fromPriceStr);
  const heroLead = unifyPriceCopy(config.heroLead, fromPriceStr);

  return (
    <div className="min-h-screen bg-repower-paper">
      <MercuryLineupLandingSEO config={config} />
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li><Link to="/mercury-outboards-ontario" className="hover:text-foreground">Mercury Outboards</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">{h1}</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="grid md:grid-cols-2 gap-8 items-center mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Award className="h-3.5 w-3.5" />
              {config.heroEyebrow}
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
              {h1}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {heroLead}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to={config.primaryCta?.to ?? '/quote/motor-selection'}>
                  {config.primaryCta?.label ?? 'Build Your Quote'}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="tel:+19053422153">
                  <Phone className="h-4 w-4 mr-2" />
                  Call 905-342-2153
                </a>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <img
              src={config.ogImage}
              alt={`${config.productName} hero image`}
              className="w-full h-auto object-contain bg-white"
              loading="eager"
              width={800}
              height={800}
            />
          </div>
        </header>

        {/* Pricing table */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {config.tableTitle}
          </h2>
          <p className="text-muted-foreground mb-6">
            Real CAD pricing on every configuration in this HP band. Pick what fits your transom.
          </p>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-foreground">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">{config.modelColLabel}</th>
                    <th className="text-left font-semibold px-4 py-3">HP</th>
                    <th className="text-left font-semibold px-4 py-3">{config.configColLabel}</th>
                    <th className="text-right font-semibold px-4 py-3">MSRP</th>
                    <th className="text-right font-semibold px-4 py-3">HBW Price</th>
                    <th className="text-right font-semibold px-4 py-3">You Save</th>
                    <th className="text-left font-semibold px-4 py-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {config.variants.map((v) => {
                    const save = v.msrp - v.hbwPrice;
                    return (
                      <tr key={v.name} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{v.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.hp}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.config}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground line-through">
                          {formatCAD(v.msrp)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {formatCAD(v.hbwPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-primary font-medium">
                          {formatCAD(save)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{v.availabilityLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-muted-foreground mt-3">{config.tableNote}</p>
        </section>

        {/* What's included */}
        <section className="grid md:grid-cols-2 gap-6 mb-16">
          <Card className="p-6">
            <ShieldCheck className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-xl font-semibold text-foreground mb-3">{config.includedTitle}</h2>
            <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc pl-5">
              {config.includedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <Wrench className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-xl font-semibold text-foreground mb-3">Not included</h2>
            <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc pl-5">
              {config.notIncludedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Which one */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            {config.whichOneTitle}
          </h2>
          <div className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed space-y-4">
            {config.whichOneParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {config.crossLinks && config.crossLinks.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              {config.crossLinks.map((cl) => (
                <Link
                  key={cl.to}
                  to={cl.to}
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                >
                  {cl.label}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Why HBW */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Why buy your Mercury from Harris Boat Works
          </h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              We have been a Mercury dealer since 1965 and hold Mercury&rsquo;s Premier tier today. Third-generation family business, on the same Rice Lake dock since 1947. We sell the motor, we rig it, we water-test it, and we service it every season after.
            </p>
            <p>
              And the price you see here is the price the sales desk sees. No phone tag, no &ldquo;call for quote,&rdquo; no number inflated so it can be discounted back. Most dealers will not put a price online. We do.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {config.faq.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Mercury motors by segment */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Mercury motors by segment
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse Mercury outboard prices by horsepower band.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_SEGMENTS.filter((s) => s.path !== config.slug).map((segment) => (
              <Card key={segment.path} className="p-5 hover:bg-muted/30 transition-colors">
                <Link to={segment.path} className="block group">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {segment.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">from {segment.price} CAD</p>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            {config.finalCtaHeading}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{config.finalCtaBody}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to={config.primaryCta?.to ?? '/quote/motor-selection'}>
                {config.primaryCta?.label ?? 'Build Your Quote'}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="tel:+19053422153">
                <Phone className="h-4 w-4 mr-2" />
                Call 905-342-2153
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Or call 905-342-2153, Tuesday through Saturday.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
