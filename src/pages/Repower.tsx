import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { RepowerFAQ } from '@/components/repower/RepowerFAQ';
import { RepowerPageSEO } from '@/components/seo/RepowerPageSEO';
import { RepowerROICalculator } from '@/components/repower/RepowerROICalculator';
import { RepowerGuideDownloadDialog } from '@/components/repower/RepowerGuideDownloadDialog';
import { ExpandableImage } from '@/components/ui/expandable-image';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, Zap, Fuel, Volume2, Wrench, Calendar, Award, 
  MapPin, Phone, Download, Play, ChevronRight, Snowflake, BadgeCheck, Star
} from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { generateDailyTestimonials, generateReviewCount } from '@/lib/activityGenerator';
import { allTestimonials } from '@/lib/testimonialData';

const warningSignsData = [
  { icon: AlertTriangle, title: "Hard Starting or Stalling", description: "Unreliable starts, especially when warm" },
  { icon: AlertTriangle, title: "Excessive Smoke", description: "Blue or white smoke from the exhaust" },
  { icon: AlertTriangle, title: "Loss of Power", description: "Can't reach speeds you used to" },
  { icon: AlertTriangle, title: "Frequent Repairs", description: "Costs keep adding up season after season" },
];

const modernBenefitsData = [
  { icon: Fuel, title: "30-40% Better Fuel Economy", description: "Modern four-strokes sip fuel compared to older motors" },
  { icon: Volume2, title: "Whisper Quiet", description: "Hold a conversation at cruise speed" },
  { icon: Zap, title: "Instant EFI Starting", description: "Turn the key, it starts. Every time." },
];

const repowerStepsData = [
  { step: 1, title: "Consultation & Quote", description: "We assess your boat and recommend the right Mercury motor" },
  { step: 2, title: "Scheduling", description: "Book your installation with the shortest wait times" },
  { step: 3, title: "Professional Installation", description: "Mercury-certified techs install in 1-2 days" },
  { step: 4, title: "Lake Test", description: "We test on Rice Lake and walk you through every feature" },
];

const whyHarrisData = [
  { icon: Award, title: "CSI Award Winner", description: "Mercury's highest honor for customer satisfaction" },
  { icon: Calendar, title: "Since 1947", description: "78 years of family-owned marine expertise" },
  { icon: BadgeCheck, title: "Mercury Dealer Since 1965", description: "60 years as an authorized Mercury dealer" },
  { icon: Wrench, title: "Certified Repower Center", description: "Mercury's top-tier repower certification" },
];

export default function Repower() {
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const dailyTestimonials = useMemo(() => generateDailyTestimonials(allTestimonials, 3), []);
  const reviewCount = useMemo(() => generateReviewCount(), []);

  return (
    <div className="min-h-screen bg-background">
      <RepowerPageSEO />
      <LuxuryHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-100 to-white py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-8" />
            <span className="text-sm font-medium text-muted-foreground">Certified Repower Center</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
            Mercury Outboard Repower
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-6">
            Keep Your Boat. Upgrade Your Engine.
          </p>
          
          {/* Hero Stat */}
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-3 rounded-full mb-8">
            <span className="text-2xl md:text-3xl font-bold">70%</span>
            <span className="text-left text-sm md:text-base">
              of the Benefit<br />
              for <strong>30%</strong> of the Cost
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Build Your Quote
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="tel:9053422153">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 bg-transparent">
                <Phone className="w-4 h-4" />
                (905) 342-2153
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Warning Signs Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Is Your Old Motor Threatening Your Time on the Water?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Being out there, not worrying about getting back—that's what boating should be.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {warningSignsData.map((sign, index) => (
              <div key={index} className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
                <sign.icon className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">{sign.title}</h3>
                <p className="text-sm text-muted-foreground">{sign.description}</p>
              </div>
            ))}
          </div>
          
          {/* One More Season Trap */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 md:p-8">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Avoid the "One More Season" Trap
            </h3>
            <p className="text-muted-foreground">
              A new motor isn't just about reliability. It's about <strong>using your boat instead of worrying about it</strong>. 
              Stop nursing an old motor, paying for repairs, and worrying on every trip.
            </p>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              See Why Boaters Choose Harris for Their Repower
            </h2>
          </div>
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/6uhYCYq9cLk"
              title="Mercury Repower at Harris Boat Works"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Repower vs New Boat */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              The Big Question: Repower or Buy New?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                Repowering Makes Sense If...
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <span className="text-green-600 mr-2">✓</span>
                  Your hull is solid (aluminum & fiberglass last decades)
                </li>
                <li>
                  <span className="text-green-600 mr-2">✓</span>
                  You like your boat—it fits your needs and is the right size
                </li>
                <li>
                  <span className="text-green-600 mr-2">✓</span>
                  The numbers work: 70% of the benefit for 30% of the cost
                </li>
              </ul>
            </div>
            
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
              <h3 className="font-semibold text-lg text-foreground mb-4">
                A New Boat Makes Sense If...
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <span className="text-stone-400 mr-2">•</span>
                  Your hull has structural damage or significant issues
                </li>
                <li>
                  <span className="text-stone-400 mr-2">•</span>
                  You've outgrown your current boat
                </li>
                <li>
                  <span className="text-stone-400 mr-2">•</span>
                  You want completely different features or layout
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Technology Benefits */}
      <section className="py-16 px-4 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              This Is More Than a Replacement. It's a Revolution.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              If your motor is 10-15+ years old, technology has transformed. Modern four-strokes deliver performance that wasn't possible a decade ago.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {modernBenefitsData.map((benefit, index) => (
              <div key={index} className="bg-white border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4">
            <img src={mercuryLogo} alt="Mercury" className="h-10 hidden sm:block" />
            <div>
              <h3 className="font-medium text-foreground">Mercury SmartCraft® Technology</h3>
              <p className="text-sm text-muted-foreground">Real-time engine monitoring, fuel economy tracking, and maintenance alerts—all from your phone with the Mercury Marine app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Infographic Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8">
            The Complete Repower Guide
          </h2>
          <ExpandableImage 
            src="/repower-assets/hbw-repower-infographic.png" 
            alt="Harris Boat Works Mercury Repower Infographic - 70% of the benefit for 30% of the cost. Warning signs, process, and pricing guide for boat motor replacement"
            className="w-full rounded-xl shadow-lg mb-6"
          />
          <Button variant="outline" className="gap-2" onClick={() => setGuideDialogOpen(true)}>
            <Download className="w-4 h-4" />
            Download Full Repower Guide (PDF)
          </Button>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 px-4 bg-white">
        <RepowerROICalculator />
      </section>

      <RepowerGuideDownloadDialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen} />

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A clear and honest look at your investment. No surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">1. The Motor</h3>
              <p className="text-2xl font-bold text-primary mb-2">$1,500 - $35,000+</p>
              <p className="text-sm text-muted-foreground">Priced by HP. Quote builder shows exact pricing for any motor.</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">2. Rigging & Controls</h3>
              <p className="text-2xl font-bold text-primary mb-2">$1,500 - $4,000</p>
              <p className="text-sm text-muted-foreground">Depends on your boat's existing setup. Sometimes minimal work needed.</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-2">3. Installation</h3>
              <p className="text-2xl font-bold text-primary mb-2">$800 - $1,500</p>
              <p className="text-sm text-muted-foreground">Includes professional mounting and lake testing on Rice Lake.</p>
            </div>
          </div>
          
          <div className="bg-primary text-primary-foreground rounded-xl p-6 md:p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Typical Rice Lake Repower</h3>
            <p className="text-3xl md:text-4xl font-bold mb-2">$8,000 - $18,000</p>
            <p className="text-primary-foreground/80">For a 16-18ft boat with 60-115 HP, all-in</p>
          </div>
        </div>
      </section>

      {/* Winter Pro Tip */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Snowflake className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center gap-2">
                Pro Tip: Repower in Winter
              </h2>
              <ul className="space-y-2 text-blue-100">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <strong>Best Availability</strong> — First pick before the spring rush
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <strong>No Wait</strong> — Quietest shop time means fastest turnaround
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <strong>Ready for Launch Day</strong> — When the ice comes off Rice Lake, you're good to go
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Repower Process */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              The Harris Repower Process
            </h2>
            <p className="text-muted-foreground">Simple, transparent, and professional</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {repowerStepsData.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <RepowerFAQ />

      {/* Why Harris Section */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Why Choose Harris Boat Works
            </h2>
            <p className="text-muted-foreground">Your neighbours on the water since 1947</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {whyHarrisData.map((item, index) => (
              <div key={index} className="bg-white border border-border rounded-xl p-6 text-center">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6">
            <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner" className="h-16 opacity-80" />
            <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center" className="h-16 opacity-80" />
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Serving Ontario Boaters
          </h2>
          <p className="text-muted-foreground mb-6">
            Located in Gores Landing with our own private boat launch on Rice Lake. We serve boaters throughout:
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {['Rice Lake', 'Kawarthas', 'Peterborough', 'Cobourg', 'Port Hope', 'Northumberland', 'Durham', 'GTA', 'Toronto'].map((area) => (
              <span key={area} className="bg-stone-100 text-foreground px-4 py-2 rounded-full text-sm">
                {area}
              </span>
            ))}
          </div>
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd+Gores+Landing+ON+K0K+2E0"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <MapPin className="w-4 h-4" />
              Get Directions
            </Button>
          </a>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
              What Customers Say
            </h2>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{reviewCount}+</span> five-star reviews from Ontario boaters
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {dailyTestimonials.map((testimonial, index) => (
              <div key={index} className="bg-white border border-border rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-3 italic">"{testimonial.quote}"</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{testimonial.name}</span> — {testimonial.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Adventure, Repowered
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            No pressure. No games. Real pricing from a dealer who's been on this lake over 75 years.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
                Build Your Quote
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="tel:9053422153">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Phone className="w-4 h-4" />
                (905) 342-2153
              </Button>
            </a>
          </div>
          
          <p className="text-sm text-primary-foreground/70 mt-8">
            5369 Harris Boat Works Rd, Gores Landing, ON • info@harrisboatworks.ca
          </p>
        </div>
      </section>
    </div>
  );
}
