import { Link } from 'react-router-dom';
import { ChevronRight, Clock, Phone, MessageSquare, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { HarrisBoatWorksBrandPageSEO } from '@/components/seo/HarrisBoatWorksBrandPageSEO';
import { GoogleMapEmbed } from '@/components/maps/GoogleMapEmbed';
import { OpeningHoursDisplay } from '@/components/business/OpeningHoursDisplay';
import { useGooglePlaceData } from '@/hooks/useGooglePlaceData';
import { BUSINESS_GEO, COMPANY_INFO } from '@/lib/companyInfo';
import {
  HARRIS_BOAT_WORKS_BRAND_FAQS,
  HARRIS_BOAT_WORKS_BRAND_H1,
  HARRIS_BOAT_WORKS_BRAND_INTRO,
  HARRIS_BOAT_WORKS_DIRECTIONS_HREF,
  HARRIS_BOAT_WORKS_HISTORY_HREF,
  HARRIS_BOAT_WORKS_HISTORY_LABEL,
  HARRIS_BOAT_WORKS_QUOTE_HREF,
  HARRIS_BOAT_WORKS_RENTALS_HREF,
  HARRIS_BOAT_WORKS_SERVICE_HREF,
  HARRIS_BOAT_WORKS_SERVICES,
  HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT,
  HARRIS_BOAT_WORKS_SHOP_IMAGE_PATH,
} from '@/data/harrisBoatWorksBrandPage.js';

const telHref = `tel:${COMPANY_INFO.contact.phone.replace(/[^0-9+]/g, '')}`;
const smsHref = `sms:${COMPANY_INFO.contact.sms.replace(/[^0-9+]/g, '')}`;
const mailHref = `mailto:${COMPANY_INFO.contact.email}`;

export default function HarrisBoatWorks() {
  const { data: placeData, isLoading: hoursLoading, error: hoursError } = useGooglePlaceData();

  return (
    <div className="min-h-screen bg-repower-paper">
      <HarrisBoatWorksBrandPageSEO />
      <RepowerHeader />

      <main className="pt-[64px] lg:pt-[72px]">
        <section className="bg-repower-navy-900 text-repower-cream">
          <div className="mx-auto grid max-w-6xl items-end gap-10 px-5 py-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:px-8 md:py-16 lg:py-20">
            <div>
              <nav aria-label="Breadcrumb" className="mb-6 text-sm text-repower-cream/60">
                <ol className="flex flex-row items-center gap-2">
                  <li>
                    <Link to="/" className="hover:text-repower-cream">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">
                    <ChevronRight className="h-4 w-4" />
                  </li>
                  <li className="text-repower-cream" aria-current="page">
                    Harris Boat Works
                  </li>
                </ol>
              </nav>

              <p className="mb-4 flex items-center gap-3 font-sans text-[13px] font-semibold uppercase tracking-[0.24em] text-repower-gold">
                <span className="inline-block h-px w-8 bg-repower-gold" aria-hidden="true" />
                Gores Landing, Rice Lake
              </p>

              <h1
                className="font-display font-bold tracking-[-0.025em] text-repower-cream"
                style={{ fontSize: 'clamp(40px, 7vw, 68px)', lineHeight: 1.05 }}
              >
                {HARRIS_BOAT_WORKS_BRAND_H1}
              </h1>

              <p className="mt-5 max-w-[38rem] font-sans text-lg leading-relaxed text-repower-cream/85">
                {HARRIS_BOAT_WORKS_BRAND_INTRO}
              </p>

              <p className="mt-5 max-w-[34rem] font-sans text-base leading-relaxed text-repower-cream/70">
                5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0. Mercury Marine Premier
                Dealer. Pickup and drop-off only at this marina.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep"
                >
                  <a href={HARRIS_BOAT_WORKS_DIRECTIONS_HREF}>Get directions</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="border border-repower-cream/40 bg-transparent text-repower-cream hover:bg-repower-cream/10"
                >
                  <a href={telHref}>
                    <Phone className="h-4 w-4" />
                    Call 905-342-2153
                  </a>
                </Button>
              </div>
            </div>

            <figure className="m-0">
              <img
                src={HARRIS_BOAT_WORKS_SHOP_IMAGE_PATH}
                alt={HARRIS_BOAT_WORKS_SHOP_IMAGE_ALT}
                width={1200}
                height={900}
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <figcaption className="mt-3 border-t border-repower-gold/50 pt-3 font-sans text-xs uppercase tracking-[0.16em] text-repower-gold">
                The shop on Rice Lake
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-b border-repower-navy-900/10 bg-repower-cream">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <p className="font-sans text-sm text-repower-navy-900/75">
              Need a motor quote or shop work? Those paths are here too.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="outline"
                className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
              >
                <Link to={HARRIS_BOAT_WORKS_QUOTE_HREF}>Build a Mercury quote</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
              >
                <a href={HARRIS_BOAT_WORKS_SERVICE_HREF}>Request service</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-repower-navy-900">
              Where we are
            </h2>
            <div className="mt-3 h-px w-12 bg-repower-gold" aria-hidden="true" />
            <address className="mt-6 not-italic">
              <p className="font-sans text-lg leading-relaxed text-repower-navy-900">
                {COMPANY_INFO.address.full}
              </p>
              <p className="mt-2 font-sans text-base text-repower-navy-900/70">On Rice Lake.</p>
            </address>

            <dl className="mt-8 space-y-4 font-sans">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-repower-gold" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-repower-navy-900/50">
                    Phone
                  </dt>
                  <dd>
                    <a href={telHref} className="text-repower-navy-900 underline-offset-2 hover:underline">
                      905-342-2153
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-repower-gold" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-repower-navy-900/50">
                    Text
                  </dt>
                  <dd>
                    <a href={smsHref} className="text-repower-navy-900 underline-offset-2 hover:underline">
                      647-952-2153
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-repower-gold" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-repower-navy-900/50">
                    Email
                  </dt>
                  <dd>
                    <a href={mailHref} className="text-repower-navy-900 underline-offset-2 hover:underline">
                      {COMPANY_INFO.contact.email}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-repower-gold" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-repower-navy-900/50">
                    Hours
                  </dt>
                  <dd className="mt-1">
                    <OpeningHoursDisplay
                      openingHours={placeData?.openingHours}
                      loading={hoursLoading}
                      error={!!hoursError}
                    />
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div>
            <GoogleMapEmbed
              center={BUSINESS_GEO}
              className="min-h-[280px] md:min-h-[360px]"
              height="100%"
            />
            <p className="mt-3 font-sans text-sm text-repower-navy-900/60">
              <a
                href={HARRIS_BOAT_WORKS_DIRECTIONS_HREF}
                className="font-medium text-repower-navy-900 underline underline-offset-2 hover:text-repower-mercury-red"
              >
                Open directions
              </a>
              {' '}in Google Maps.
            </p>
          </div>
        </section>

        <section className="border-t border-repower-navy-900/10 bg-repower-cream/50">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-repower-navy-900">
              What we do
            </h2>
            <div className="mt-3 h-px w-12 bg-repower-gold" aria-hidden="true" />
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-repower-navy-900/75">
              The marina handles Mercury work, parts, rentals, slips, fuel, and outdoor winter
              storage. If you need a price on a motor, use the quote builder. If the boat needs
              shop time, send a service request.
            </p>
            <ul className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {HARRIS_BOAT_WORKS_SERVICES.map((item) => (
                <li key={item} className="flex items-start gap-3 font-sans text-repower-navy-900">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-repower-gold" aria-hidden="true" />
                  <span>
                    {item === 'Boat rentals' ? (
                      <a
                        href={HARRIS_BOAT_WORKS_RENTALS_HREF}
                        className="underline underline-offset-2 hover:text-repower-mercury-red"
                      >
                        {item}
                      </a>
                    ) : (
                      item
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-2xl font-sans text-base leading-relaxed text-repower-navy-900/75">
              Pickup and drop-off only at Gores Landing. No delivery, no shipping, no mobile or
              dockside service.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-repower-navy-900">
            Heritage, short version
          </h2>
          <div className="mt-3 h-px w-12 bg-repower-gold" aria-hidden="true" />
          <p className="mt-6 font-sans text-base leading-relaxed text-repower-navy-900/80">
            The Harris family has run this marina since 1947. Mercury dealer since 1965. Current
            Mercury Marine Premier Dealer. Authorized Legend Boats dealer.
          </p>
          <p className="mt-4 font-sans text-base leading-relaxed text-repower-navy-900/80">
            This page is the brand overview: who we are, where we are, and what to do next. It's
            not the family history. The detailed story lives in one article.
          </p>
          <p className="mt-6 font-sans">
            <Link
              to={HARRIS_BOAT_WORKS_HISTORY_HREF}
              className="font-medium text-repower-navy-900 underline underline-offset-4 hover:text-repower-mercury-red"
            >
              {HARRIS_BOAT_WORKS_HISTORY_LABEL}
            </Link>
          </p>
        </section>

        <section className="border-t border-repower-navy-900/10 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-repower-navy-900">
              Common questions
            </h2>
            <div className="mt-3 h-px w-12 bg-repower-gold" aria-hidden="true" />
            <Accordion type="single" collapsible className="mt-8 w-full">
              {HARRIS_BOAT_WORKS_BRAND_FAQS.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`item-${index}`}
                  className="border-repower-navy-900/15"
                >
                  <AccordionTrigger className="text-left font-display text-lg text-repower-navy-900 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="font-sans leading-relaxed text-repower-navy-900/75">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="bg-repower-navy-900 text-repower-cream">
          <div className="mx-auto max-w-3xl px-5 py-14 text-center md:px-8">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">
              Choose your next step
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed text-repower-cream/75">
              Check the Google-synced hours above before you drive. Call with a question, or use
              the quote builder and service form if you already know what you need.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep"
              >
                <a href={HARRIS_BOAT_WORKS_DIRECTIONS_HREF}>Get directions</a>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-repower-cream/40 bg-transparent text-repower-cream hover:bg-repower-cream/10"
              >
                <a href={telHref}>Call 905-342-2153</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
