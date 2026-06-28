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
import {
  MercuryProXS250SEO,
  PRO_XS_250_VARIANTS,
  PRO_XS_250_FAQ,
  PRO_XS_250_HERO_IMAGE,
} from '@/components/seo/MercuryProXS250SEO';
import { ChevronRight, Phone, ShieldCheck, Wrench, Award } from 'lucide-react';
import { ALL_SEGMENTS } from '@/data/landing/mercuryLineupLandings';

function formatCAD(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MercuryProXS250() {
  return (
    <div className="min-h-screen bg-repower-paper">
      <MercuryProXS250SEO />
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li><Link to="/mercury-pro-xs" className="hover:text-foreground">Mercury Pro XS</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">Pro XS 250</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="grid md:grid-cols-2 gap-8 items-center mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Award className="h-3.5 w-3.5" />
              Mercury Premier Dealer, Rice Lake
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
              Mercury Pro XS 250 Price in Canada: From $34,502 CAD
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Most dealers make you call for a price. Here is ours, in writing. The Mercury Pro XS 250 starts at <strong className="text-foreground">$34,502 CAD</strong> at Harris Boat Works, a Mercury Premier Dealer on Rice Lake. Four configurations, the same number our sales desk sees, and 7-year warranty coverage on every one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/quote/motor-selection">Build Your Quote</Link>
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
              src={PRO_XS_250_HERO_IMAGE}
              alt="Mercury Pro XS 250 V8 four-stroke outboard motor"
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
            Pro XS 250 prices: all four configurations
          </h2>
          <p className="text-muted-foreground mb-6">
            Four versions of the 250 Pro XS. Same V8 powerhead, different shaft length and controls. Pick what fits your transom.
          </p>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-foreground">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Configuration</th>
                    <th className="text-left font-semibold px-4 py-3">Shaft</th>
                    <th className="text-left font-semibold px-4 py-3">Controls</th>
                    <th className="text-right font-semibold px-4 py-3">MSRP</th>
                    <th className="text-right font-semibold px-4 py-3">HBW Price</th>
                    <th className="text-right font-semibold px-4 py-3">You Save</th>
                    <th className="text-left font-semibold px-4 py-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PRO_XS_250_VARIANTS.map((v) => {
                    const save = v.msrp - v.hbwPrice;
                    const label = v.name.split(' (')[0];
                    return (
                      <tr key={v.sku} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.shaft}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.controls}</td>
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
          <p className="text-xs text-muted-foreground mt-3">
            Prices in CAD, current as of May 2026. The two 20-inch (ELPT) variants are in stock now; the 25-inch (EXLPT) variants we bring in to order. Pickup at Gores Landing, Ontario. Taxes, rigging, and installation labour are not included. Confirm live pricing and availability in the quote builder.
          </p>
        </section>

        {/* What's included */}
        <section className="grid md:grid-cols-2 gap-6 mb-16">
          <Card className="p-6">
            <ShieldCheck className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-xl font-semibold text-foreground mb-3">What is included in the price</h2>
            <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc pl-5">
              <li>Four-stroke 4.6L V8, 250 HP at the prop</li>
              <li>Electric start, power trim, factory-set shaft length</li>
              <li>Mechanical remote controls, or Digital Throttle &amp; Shift on the DTS variants</li>
              <li>7-year Mercury warranty coverage under the promotion currently running to June 14, 2026. After it ends, standard warranty terms apply. We confirm exact coverage when we quote you.</li>
              <li>The same price our sales desk sees. No inflate-to-negotiate.</li>
            </ul>
          </Card>
          <Card className="p-6">
            <Wrench className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-xl font-semibold text-foreground mb-3">Not included</h2>
            <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed list-disc pl-5">
              <li>13% HST</li>
              <li>Rigging and installation labour</li>
              <li>Optional starting battery, prop upgrades, and gauges</li>
            </ul>
          </Card>
        </section>

        {/* Which one */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Which Pro XS 250 is right for your boat?
          </h2>
          <div className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed space-y-4">
            <p>
              The 250 Pro XS is built for boats that want hole-shot and top end: bass boats, mid-size bowriders, lighter fish-and-ski rigs. For most Rice Lake and Kawarthas customers the decision comes down to two questions.
            </p>
            <p>
              <strong className="text-foreground">Shaft length, 20 inch or 25 inch?</strong> Look at your transom. A 20-inch transom takes the Long shaft (ELPT). A 25-inch transom takes the Extra-Long shaft (EXLPT). Most modern bass boats are 20 inch. Most newer dual-console and offshore-style rigs are 25 inch. If you are repowering and the old motor fit right, match the same shaft.
            </p>
            <p>
              <strong className="text-foreground">Mechanical remote or DTS?</strong> The mechanical remote uses a throttle cable and is the right call for most rigs. DTS (Digital Throttle &amp; Shift) is smoother, quieter at idle, and integrates with Mercury VesselView gauges. DTS adds roughly $2,000. Worth it if you want gauge integration or plan to run joystick-capable rigging. Not necessary for a straightforward repower.
            </p>
          </div>
        </section>

        {/* Why HBW */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Why buy your Pro XS 250 from Harris Boat Works
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
            {PRO_XS_250_FAQ.map((item, i) => (
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
            {ALL_SEGMENTS.filter((s) => s.path !== '/mercury/pro-xs-250').map((segment) => (
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
            Build your Pro XS 250 quote in two minutes
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Real price, in writing. No phone tag, no waiting on a callback.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
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
