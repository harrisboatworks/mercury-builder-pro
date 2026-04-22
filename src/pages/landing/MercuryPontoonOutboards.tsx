import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { MercuryPontoonOutboardsSEO, PONTOON_FAQ } from '@/components/seo/MercuryPontoonOutboardsSEO';
import { ChevronRight, Anchor, Gauge, Ruler, Wrench } from 'lucide-react';

const facts = [
  { icon: Anchor, label: 'Command Thrust 40–150 HP' },
  { icon: Gauge, label: 'High-thrust gearcase' },
  { icon: Ruler, label: 'Long & XL shaft options' },
  { icon: Wrench, label: 'Legend / Princecraft / Sylvan' }
];

const sizingGuide = [
  { size: '14–16 ft single-tube', hp: '25–40 HP', note: 'Tiller or remote, light load' },
  { size: '16–18 ft single-tube', hp: '40–60 HP CT', note: 'Family cruising, calm water' },
  { size: '18–20 ft two-tube', hp: '60–90 HP CT', note: 'Cottage runabout, moderate load' },
  { size: '20–22 ft two-tube', hp: '90–115 HP CT', note: 'Most popular range — versatile' },
  { size: '22–25 ft tri-toon', hp: '150 HP CT or larger', note: 'Watersports, heavy load, big water' }
];

export default function MercuryPontoonOutboards() {
  return (
    <div className="min-h-screen bg-background">
      <MercuryPontoonOutboardsSEO />
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">Mercury Outboards for Pontoon Boats</li>
          </ol>
        </nav>

        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            Mercury Outboards for Pontoon Boats — Command Thrust, Big Tiller & High-Thrust Options (Rice Lake & Kawarthas)
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pontoons are heavier than they look. The right Mercury for a pontoon isn't just a number on a sticker — it's a Command Thrust gearcase, the right shaft length, and a high-thrust prop. We've been rigging pontoons on Rice Lake since 1965.
          </p>

          <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card">
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection?boat_type=pontoon">Build Your Pontoon Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Ask a Pontoon Question</Link>
            </Button>
          </div>
        </header>

        <section className="mb-12 prose prose-neutral max-w-none dark:prose-invert">
          <h2 className="text-2xl font-semibold text-foreground mb-4">What "Command Thrust" actually means</h2>
          <p className="text-muted-foreground leading-relaxed">
            Command Thrust (CT) is Mercury's name for an engine paired with a larger gearcase, a lower gear ratio (more reduction), and a bigger high-thrust propeller. The same powerhead pushes more water at lower RPM. For a pontoon, that translates to:
          </p>
          <ul className="text-muted-foreground leading-relaxed mt-2 list-disc pl-6 space-y-1">
            <li><strong>Better hole shot</strong> with a full load — the boat climbs onto plane instead of plowing.</li>
            <li><strong>More pushing power at slow speeds</strong> — useful in wind, current, or trolling.</li>
            <li><strong>Cleaner reverse</strong> — the bigger prop bites in reverse, helpful at the dock.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            For a pontoon repower, Command Thrust is almost always the right call over the standard gearcase. The price difference is small. The handling difference is not.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Pontoon HP sizing guide</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-foreground">Pontoon size</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">Mercury HP</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">Typical use</th>
                </tr>
              </thead>
              <tbody>
                {sizingGuide.map((row) => (
                  <tr key={row.size} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground font-medium">{row.size}</td>
                    <td className="px-4 py-3 text-foreground">{row.hp}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            These are starting points. Tube count, water type, load, and whether you ski or tube all push the recommendation. Build a quote at <Link to="/quote/motor-selection?boat_type=pontoon" className="text-primary underline">motor selection</Link> and we'll confirm.
          </p>
        </section>

        <section className="mb-12 prose prose-neutral max-w-none dark:prose-invert">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Shaft length — long (20 in) vs extra-long (25 in)</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pontoon transoms sit higher than a typical aluminum tin boat because the engine bolts to the back log, not a low transom. Most pontoons take a <strong>long shaft (20 in / "L")</strong>. Larger tri-toons with a raised transom platform sometimes take an <strong>extra-long shaft (25 in / "XL")</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Measure from the top of the transom (where the engine bracket clamps) straight down to the bottom of the hull at the centerline. If you're not sure, send a side-on photo through the <Link to="/contact" className="text-primary underline">contact page</Link> and we'll confirm before you buy.
          </p>
        </section>

        <section className="mb-12 prose prose-neutral max-w-none dark:prose-invert">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Legend, Princecraft & Sylvan pairings</h2>
          <p className="text-muted-foreground leading-relaxed">
            Harris Boat Works is an authorized Legend Boats dealer, so we know the Legend pontoon rigging packages cold. We also rig Princecraft, Sylvan, Manitou, Sunchaser, and Bennington pontoons regularly. Common pairings we see:
          </p>
          <ul className="text-muted-foreground leading-relaxed mt-2 list-disc pl-6 space-y-1">
            <li><strong>Legend Splash</strong> — Mercury 40–60 HP Command Thrust</li>
            <li><strong>Legend Enjoy / Princecraft Sportfisher</strong> — Mercury 90–115 HP Command Thrust</li>
            <li><strong>Legend Q-Series tri-toon / Sylvan Mirage</strong> — Mercury 150 HP Command Thrust or larger</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            For other brands, we confirm bolt pattern, controls, and harness compatibility before quoting so there are no surprises at install.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Pontoon outboard questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {PONTOON_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40">
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

        <section className="text-center bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Ready to repower your pontoon?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Build a Mercury Command Thrust quote with real CAD pricing in 3 minutes — or call us at (905) 342-2153.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection?boat_type=pontoon">Build Pontoon Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/mercury-outboards-ontario">See Full Mercury Lineup</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/repower">Repower Process</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
