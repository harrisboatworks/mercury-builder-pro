import { MapPin, Phone, Mail, Clock, Award, Wrench, Shield, Users, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { AboutPageSEO } from '@/components/seo/AboutPageSEO';
import { GoogleReviewsCarousel } from '@/components/reviews/GoogleReviewsCarousel';
import { GoogleMapEmbed } from '@/components/maps/GoogleMapEmbed';
import { OpeningHoursDisplay } from '@/components/business/OpeningHoursDisplay';
import { GooglePhotoGallery } from '@/components/business/GooglePhotoGallery';
import { GoogleRatingBadge } from '@/components/business/GoogleRatingBadge';
import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

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
    description: "Genuine Mercury parts, propellers, rigging, and marine accessories. Same-day shipping on most orders."
  }
];

const faqs = [
  {
    question: "How long has Harris Boat Works been in business?",
    answer: "Harris Boat Works was founded in 1947, making us a family-owned business serving Ontario boaters for over 77 years. We've been an authorized Mercury Marine dealer since 1965 — nearly 60 years of Mercury expertise."
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
    answer: "All motor purchases must be completed in-person with valid photo ID at our Gores Landing location. This is an industry-wide policy to prevent fraud. We're easy to get to — just ask us for directions!"
  }
];

export default function About() {
  const { data: placeData, isLoading: hoursLoading, error: hoursError } = useGooglePlaceData();

  return (
    <>
      <AboutPageSEO />
      <LuxuryHeader />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section aria-labelledby="about-hero" className="relative py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <img src={harrisLogo} alt="Harris Boat Works" className="h-12 md:h-16" />
                <div className="w-px h-10 bg-border" />
                <img src={mercuryLogo} alt="Mercury Marine" className="h-12 md:h-16" />
              </div>
              <h1 id="about-hero" className="text-3xl md:text-5xl font-light text-foreground mb-4">
                Family-Owned Since <span className="font-medium">1947</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Three generations of marine expertise on the beautiful shores of Rice Lake, Ontario.
                Your trusted Mercury dealer for nearly 60 years.
              </p>
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
                  <p className="text-sm font-medium text-foreground">CSI Award</p>
                  <p className="text-xs text-muted-foreground">Winner</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
                  alt="Mercury Certified Repower Center" 
                  className="h-12 md:h-16"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Certified</p>
                  <p className="text-xs text-muted-foreground">Repower Center</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
                <Calendar className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">77 Years</p>
                  <p className="text-xs text-muted-foreground">In Business</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Timeline */}
        <section aria-labelledby="our-story" className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <h2 id="our-story" className="text-2xl md:text-3xl font-light text-center mb-12">
              Our <span className="font-medium">Story</span>
            </h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />
              
              <ol className="list-none p-0 m-0">
                {timelineEvents.map((event, index) => (
                  <li 
                    key={event.year}
                    className={`relative flex items-start gap-6 mb-10 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-primary border-4 border-background -translate-x-1.5 md:-translate-x-1.5 z-10" />
                    
                    {/* Content */}
                    <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                      <time className="text-sm font-medium text-primary">{event.year}</time>
                      <h3 className="text-lg font-medium text-foreground mt-1">{event.title}</h3>
                      <p className="text-muted-foreground mt-2">{event.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Photo Gallery Section */}
        <section aria-labelledby="gallery" className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <h2 id="gallery" className="text-2xl md:text-3xl font-light text-center mb-4">
              Our <span className="font-medium">Location</span>
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">
              Photos from our shop on the shores of Rice Lake.
            </p>
            
            <GooglePhotoGallery />
          </div>
        </section>

        {/* Services Section */}
        <section aria-labelledby="services" className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <h2 id="services" className="text-2xl md:text-3xl font-light text-center mb-4">
              What We <span className="font-medium">Offer</span>
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              From sales to service, we're your complete Mercury Marine destination.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.title} className="border-0 shadow-sm bg-background">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <service.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-2">{service.title}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Google Reviews Section */}
        <section aria-labelledby="reviews" className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <h2 id="reviews" className="text-2xl md:text-3xl font-light text-center mb-4">
              What Our <span className="font-medium">Customers Say</span>
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">
              Real reviews from real boaters in the Kawartha Lakes region.
            </p>
            
            <GoogleReviewsCarousel />
          </div>
        </section>

        {/* Location Section */}
        <section aria-labelledby="visit-us" className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 id="visit-us" className="text-2xl md:text-3xl font-light mb-6">
                  Visit <span className="font-medium">Us</span>
                </h2>
                
                <address className="not-italic space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Address</p>
                      <p className="text-muted-foreground">5369 Harris Boat Works Rd</p>
                      <p className="text-muted-foreground">Gores Landing, ON K0K 2E0</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <a href="tel:+19053422153" className="text-muted-foreground hover:text-primary transition-colors">
                        (905) 342-2153
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <a href="mailto:info@harrisboatworks.ca" className="text-muted-foreground hover:text-primary transition-colors">
                        info@harrisboatworks.ca
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Hours</p>
                      <OpeningHoursDisplay 
                        openingHours={placeData?.openingHours} 
                        loading={hoursLoading}
                        error={!!hoursError}
                      />
                    </div>
                  </div>
                </address>
                
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <a 
                      href="https://www.google.com/maps/dir/?api=1&destination=5369+Harris+Boat+Works+Rd+Gores+Landing+ON+K0K+2E0" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Get Directions
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
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
        <section aria-labelledby="about-faq" className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <h2 id="about-faq" className="text-2xl md:text-3xl font-light text-center mb-4">
              Frequently Asked <span className="font-medium">Questions</span>
            </h2>
            <p className="text-muted-foreground text-center mb-10">
              Common questions about Harris Boat Works and our services.
            </p>
            
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-background rounded-lg border-0 shadow-sm px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section aria-labelledby="about-cta" className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 id="about-cta" className="text-2xl md:text-3xl font-light mb-4">
              Ready to Get <span className="font-medium">Started</span>?
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
                <Link to="/repower">Learn About Repowering</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
