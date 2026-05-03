import { MapPin, Phone, Mail, Clock, Award, Wrench, Shield, Users, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { AboutPageSEO } from '@/components/seo/AboutPageSEO';
import { GoogleReviewsCarousel } from '@/components/reviews/GoogleReviewsCarousel';
import { GoogleMapEmbed } from '@/components/maps/GoogleMapEmbed';
import { OpeningHoursDisplay } from '@/components/business/OpeningHoursDisplay';
import { GooglePhotoGallery } from '@/components/business/GooglePhotoGallery';
import { GoogleRatingBadge } from '@/components/business/GoogleRatingBadge';
import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import jimHarrisHeritage from '@/assets/heritage/jim-harris-mercury-1960s.jpg';

const timelineEvents = [
  {
    year: "1947",
    title: "Harris Boat Works Founded",
    description: "The Harris family establishes a boat works on the shores of Rice Lake, beginning a legacy of marine service in Ontario."
  },
  {
    year: "1965",
    title: "Mercury Marine Partnership",
    description: "Becomes an authorized Mercury Marine dealer, starting nearly 60 years of Mercury expertise and partnership."
  },
  {
    year: "1980s",
    title: "Service Excellence Recognition",
    description: "Earns recognition for outstanding customer service and technical expertise in Mercury outboard repair."
  },
  {
    year: "2000s",
    title: "Certified Repower Center",
    description: "Achieves Mercury Certified Repower Center status, specializing in professional engine replacements."
  },
  {
    year: "2020s",
    title: "Digital Innovation",
    description: "Launches online quote builder with AI-powered assistance, bringing modern convenience to marine sales."
  }
];

const services = [
  {
    icon: Shield,
    title: "New Motor Sales",
    description: "Full line of Mercury outboards from 2.5HP portables to 600HP Verado. In-stock inventory with competitive pricing."
  },
  {
    icon: Wrench,
    title: "Repower Services",
    description: "Professional engine replacement for any boat. Mercury Certified Repower Center with factory-trained technicians."
  },
  {
    icon: Award,
    title: "Service & Repair",
    description: "Factory-authorized service for all Mercury outboards. Diagnostic equipment and genuine Mercury parts."
  },
  {
    icon: Users,
    title: "Parts & Accessories",
    description: "Genuine Mercury parts, propellers, rigging, and marine accessories. Available for pickup at our location."
  }
];

const faqs = [
  {
    question: "How long has Harris Boat Works been in business?",
    answer: "Harris Boat Works was founded in 1947, making us a family-owned business serving Ontario boaters for over 79 years. We've been an authorized Mercury Marine dealer since 1965, over 60 years of Mercury expertise."
  },
  {
    question: "Where exactly are you located?",
    answer: "We're located at 5369 Harris Boat Works Rd in Gores Landing, Ontario (K0K 2E0), right on the shores of Rice Lake. We're easily accessible from Toronto (about 1.5 hours), Peterborough (30 minutes), and the Kawartha Lakes region."
  },
  {
    question: "What are your hours of operation?",
    answer: "We're open Monday through Friday from 8:00 AM to 5:00 PM, and Saturday from 9:00 AM to 2:00 PM. We're closed on Sundays and statutory holidays."
  },
  {
    question: "What brands do you carry?",
    answer: "We are an authorized Mercury Marine dealer, carrying the full line of Mercury outboard motors including FourStroke, Pro XS, Verado, SeaPro, and ProKicker models. We also stock genuine Mercury parts and accessories."
  },
  {
    question: "Do you offer financing?",
    answer: "Yes! We offer competitive marine financing with rates starting from 6.99% APR*. You can apply online through our website and get pre-approved in as little as 24 hours. *Promotional rates subject to change."
  },
  {
    question: "Can you service motors from other brands?",
    answer: "Our technicians specialize in Mercury Marine products. For other brands, we recommend contacting a dealer authorized for that specific manufacturer."
  },
  {
    question: "Do you offer delivery or shipping?",
    answer: "All motor purchases must be completed in-person with valid photo ID at our Gores Landing location. This is an industry-wide policy to prevent fraud. We're easy to get to, just ask us for directions!"
  }
];

export default function About() {
  const { data: placeData, isLoading: hoursLoading, error: hoursError } = useGooglePlaceData();

  return (
    <>
      <AboutPageSEO />
      <RepowerHeader />
      
      <main className="min-h-screen bg-repower-paper pt-[64px] lg:pt-[72px]">
        {/* Hero Section */}
        <section aria-labelledby="about-hero" className="relative py-14 md:py-20">
          <div className="max-w-[880px] mx-auto px-6 md:px-14">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={harrisLogo} alt="Harris Boat Works" className="h-12 md:h-16" />
                <div className="w-px h-10 bg-repower-navy-900/15" />
                <img src={mercuryLogo} alt="Mercury Marine" className="h-12 md:h-16" />
              </div>
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="h-px w-8 bg-repower-mercury-red" />
                <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
                  About Harris Boat Works
                </p>
              </div>
              <h1 id="about-hero" className="font-display font-bold text-repower-navy-900 mb-5" style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                Family-Owned Since <span className="italic text-repower-mercury-red">1947</span>
              </h1>
              <p className="font-sans text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto leading-relaxed">
                Three generations of marine expertise on the beautiful shores of Rice Lake, Ontario.
                Your trusted Mercury dealer for nearly 60 years.
              </p>
              <div className="mt-10 h-px w-16 bg-repower-navy-900/15 mx-auto" />
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              <div className="flex items-center gap-3">
                <img
                  src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png"
                  alt="Mercury CSI Award Winner"
                  className="h-12 md:h-16"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-repower-navy-900">CSI Award</p>
                  <p className="text-xs text-repower-navy-900/60">Winner</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
                  alt="Mercury Certified Repower Center"
                  className="h-12 md:h-16"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-repower-navy-900">Certified</p>
                  <p className="text-xs text-repower-navy-900/60">Repower Center</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-7 w-7 text-repower-mercury-red" strokeWidth={1.5} />
                <div className="text-left">
                  <p className="text-sm font-medium text-repower-navy-900">79 Years</p>
                  <p className="text-xs text-repower-navy-900/60">In Business</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Timeline */}
        <section aria-labelledby="our-story" className="py-16 md:py-24 bg-repower-cream">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <p className="font-sans font-semibold text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[#C9A24A] mb-4">
                Our Heritage
              </p>
              <h2
                id="our-story"
                className="font-display font-bold text-[clamp(28px,6vw,52px)] tracking-tight leading-[1.05] text-repower-navy-900"
                style={{ letterSpacing: '-0.03em' }}
              >
                Our <em className="not-italic italic text-[#C8102E]">story</em>, in milestones.
              </h2>
            </div>

            <div className="relative">
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-repower-navy-900/20 md:-translate-x-px" />

              <ol className="list-none p-0 m-0">
                {timelineEvents.map((event, index) => (
                  <li
                    key={event.year}
                    className={`relative flex items-start gap-6 mb-12 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className="absolute left-4 md:left-1/2 w-3.5 h-3.5 rounded-full bg-[#C9A24A] border-4 border-repower-cream -translate-x-1.5 md:-translate-x-1.5 z-10" />

                    <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                      <time className="font-sans font-semibold text-xs uppercase tracking-[0.22em] text-[#C9A24A]">{event.year}</time>
                      <h3 className="font-display font-bold text-xl md:text-2xl text-repower-navy-900 mt-2 leading-tight">{event.title}</h3>
                      {event.year === "1965" && (
                        <figure className={`my-4 ${index % 2 === 0 ? 'md:ml-auto' : ''}`} style={{ maxWidth: '320px' }}>
                          <div className="rounded-md overflow-hidden border border-repower-navy-900/15 shadow-md bg-white">
                            <img
                              src={jimHarrisHeritage}
                              alt="Jim Harris rigging a Mercury outboard, mid-1960s"
                              loading="lazy"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                          <figcaption className={`mt-2 text-xs italic text-repower-navy-900/60 ${index % 2 === 0 ? 'md:text-right' : 'text-left'}`}>
                            Jim Harris, Mercury rigging, mid-1960s
                          </figcaption>
                        </figure>
                      )}
                      <p className="font-sans font-light text-repower-navy-900/75 mt-2 leading-relaxed">{event.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Photo Gallery Section */}
        <section aria-labelledby="gallery" className="py-20 md:py-24 bg-white border-t border-repower-navy-900/10">
          <div className="max-w-[1100px] mx-auto px-6 md:px-14">
            <h2 id="gallery" className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 text-center mb-3" style={{ letterSpacing: '-0.025em' }}>
              Our <span className="italic text-repower-mercury-red">Location</span>
            </h2>
            <p className="font-sans text-repower-navy-900/65 text-center max-w-2xl mx-auto mb-10">
              Photos from our shop on the shores of Rice Lake.
            </p>

            <GooglePhotoGallery />
          </div>
        </section>

        {/* Services Section */}
        <section aria-labelledby="services" className="py-20 md:py-24 bg-repower-paper border-t border-repower-navy-900/10">
          <div className="max-w-[1100px] mx-auto px-6 md:px-14">
            <h2 id="services" className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 text-center mb-3" style={{ letterSpacing: '-0.025em' }}>
              What We <span className="italic text-repower-mercury-red">Offer</span>
            </h2>
            <p className="font-sans text-repower-navy-900/65 text-center max-w-2xl mx-auto mb-12">
              From sales to service, we're your complete Mercury Marine destination.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="bg-white border border-repower-navy-900/10 rounded-lg p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <service.icon className="h-7 w-7 text-repower-mercury-red shrink-0" strokeWidth={1.5} />
                    <div>
                      <h3 className="font-display font-semibold text-repower-navy-900 text-lg mb-2">{service.title}</h3>
                      <p className="font-sans text-sm text-repower-navy-900/70 leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Google Reviews Section */}
        <section aria-labelledby="reviews" className="py-20 md:py-24 bg-white border-t border-repower-navy-900/10">
          <div className="max-w-[1100px] mx-auto px-6 md:px-14">
            <h2 id="reviews" className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 text-center mb-3" style={{ letterSpacing: '-0.025em' }}>
              What Our <span className="italic text-repower-mercury-red">Customers Say</span>
            </h2>
            <p className="font-sans text-repower-navy-900/65 text-center max-w-2xl mx-auto mb-10">
              Real reviews from real boaters in the Kawartha Lakes region.
            </p>

            <GoogleReviewsCarousel />
          </div>
        </section>

        {/* Location Section */}
        <section aria-labelledby="visit-us" className="py-20 md:py-24 bg-repower-paper border-t border-repower-navy-900/10">
          <div className="max-w-[1100px] mx-auto px-6 md:px-14">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 id="visit-us" className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-6" style={{ letterSpacing: '-0.025em' }}>
                  Visit <span className="italic text-repower-mercury-red">Us</span>
                </h2>

                <address className="not-italic space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-repower-mercury-red mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-repower-navy-900">Address</p>
                      <p className="text-repower-navy-900/70">5369 Harris Boat Works Rd</p>
                      <p className="text-repower-navy-900/70">Gores Landing, ON K0K 2E0</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-repower-mercury-red mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-repower-navy-900">Phone</p>
                      <a href="tel:+19053422153" className="text-repower-navy-900/70 hover:text-repower-mercury-red transition-colors">
                        (905) 342-2153
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-repower-mercury-red mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-repower-navy-900">Email</p>
                      <a href="mailto:info@harrisboatworks.ca" className="text-repower-navy-900/70 hover:text-repower-mercury-red transition-colors">
                        info@harrisboatworks.ca
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-repower-mercury-red mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-repower-navy-900">Hours</p>
                      <OpeningHoursDisplay
                        openingHours={placeData?.openingHours}
                        loading={hoursLoading}
                        error={!!hoursError}
                      />
                    </div>
                  </div>
                </address>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep">
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd+Gores+Landing+ON+K0K+2E0"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5">
                    <Link to="/contact">Contact Us</Link>
                  </Button>
                </div>
              </div>

              {/* Google Map */}
              <GoogleMapEmbed className="aspect-video md:aspect-square" />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="about-faq" className="py-20 md:py-24 bg-white border-t border-repower-navy-900/10">
          <div className="max-w-[880px] mx-auto px-6 md:px-14">
            <h2 id="about-faq" className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 text-center mb-3" style={{ letterSpacing: '-0.025em' }}>
              Frequently Asked <span className="italic text-repower-mercury-red">Questions</span>
            </h2>
            <p className="font-sans text-repower-navy-900/65 text-center mb-10">
              Common questions about Harris Boat Works and our services.
            </p>

            <Accordion type="single" collapsible className="border-t border-repower-navy-900/10">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border-b border-repower-navy-900/10 group"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 px-2 hover:bg-repower-navy-900/[0.04] rounded-sm transition-colors [&>svg]:text-repower-navy-900">
                    <span className="font-sans font-semibold text-[16px] md:text-[17px] text-repower-navy-900 pr-4 relative inline-block group-data-[state=open]:after:content-[''] group-data-[state=open]:after:absolute group-data-[state=open]:after:left-0 group-data-[state=open]:after:-bottom-1 group-data-[state=open]:after:h-[2px] group-data-[state=open]:after:w-10 group-data-[state=open]:after:bg-repower-gold">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-[15px] text-repower-navy-900/75 pb-5 px-2 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section aria-labelledby="about-cta" className="py-20 md:py-24 bg-repower-cream border-t border-repower-navy-900/10">
          <div className="max-w-[880px] mx-auto px-6 md:px-14 text-center">
            <div className="h-px w-12 bg-repower-gold mx-auto mb-8" />
            <h2 id="about-cta" className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-4" style={{ letterSpacing: '-0.025em' }}>
              Ready to Get <span className="italic text-repower-mercury-red">Started</span>?
            </h2>
            <p className="font-sans text-repower-navy-900/70 mb-8 max-w-2xl mx-auto">
              Build your custom Mercury outboard quote online, or visit us at Rice Lake to see our inventory in person.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep">
                <Link to="/quote/motor-selection">
                  Browse Motors
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5">
                <Link to="/repower">Learn About Repowering</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
