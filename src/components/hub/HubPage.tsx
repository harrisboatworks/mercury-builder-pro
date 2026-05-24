import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Award, Users, MapPin, Wrench, ChevronRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { AuthorByline } from '@/components/blog/AuthorByline';
import { RepowerLayout } from '@/components/repower/RepowerLayout';
import { SiteFooter } from '@/components/ui/site-footer';
import { HubPageSEO, type HubFAQ } from './HubPageSEO';

export interface HubCTA {
  label: string;
  to: string; // internal route
}

export interface HubArticleCard {
  title: string;
  description?: string;
  to: string; // internal route
}

export interface HubArticleGroup {
  heading: string;
  cards: HubArticleCard[];
}

export interface HubTrustItem {
  icon?: ReactNode;
  title: string;
  description: string;
}

export interface HubTableColumn {
  key: string;
  label: string;
}

export interface HubPageProps {
  // Routing & SEO
  path: string;
  metaTitle: string;
  metaDescription: string;
  breadcrumbName: string;
  lastReviewedISO: string; // e.g. "2026-05-05"
  lastReviewedLabel: string; // e.g. "May 2026"

  // Hero
  h1: string;
  subhead: string;
  primaryCTA: HubCTA;
  phoneNumber: string; // "(905) 342-2153"
  trustBadge?: string;

  // Direct answer (AI-quotable callout)
  directAnswer: ReactNode;

  // Primary visual table
  table: {
    caption?: string;
    columns: HubTableColumn[];
    rows: Array<Record<string, ReactNode>>;
    footnote?: ReactNode;
  };

  // What's covered
  coveredIntro: string;
  articleGroups: HubArticleGroup[];

  // Why HBW
  whyHbwIntro?: string;
  whyHbw: HubTrustItem[];

  // FAQ (visible accordion + schema)
  faqs: HubFAQ[];

  // Secondary CTA
  secondaryCTA: {
    heading: string;
    body: ReactNode;
    button?: HubCTA;
  };
}

const phoneToTel = (s: string) => 'tel:+1' + s.replace(/\D/g, '');

export function HubPage(props: HubPageProps) {
  const {
    path,
    metaTitle,
    metaDescription,
    breadcrumbName,
    lastReviewedISO,
    lastReviewedLabel,
    h1,
    subhead,
    primaryCTA,
    phoneNumber,
    trustBadge = 'Mercury Mercury Dealer · Since 1965',
    directAnswer,
    table,
    coveredIntro,
    articleGroups,
    whyHbwIntro,
    whyHbw,
    faqs,
    secondaryCTA,
  } = props;

  return (
    <RepowerLayout>
      <HubPageSEO
        path={path}
        title={metaTitle}
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        h1={h1}
        breadcrumbName={breadcrumbName}
        faqs={faqs}
        lastReviewedISO={lastReviewedISO}
      />

      {/* Breadcrumb (visible) */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-white/5 bg-[#050E1C]"
      >
        <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-repower-cream/60">
          <Link to="/" className="hover:text-repower-gold">
            Home
          </Link>
          <ChevronRight className="mx-1 inline h-3 w-3" aria-hidden="true" />
          <span className="text-repower-cream/80">{breadcrumbName}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A1A33] to-[#050E1C] py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-repower-gold/30 bg-repower-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-repower-gold">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            {trustBadge}
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-repower-cream md:text-5xl lg:text-6xl">
            {h1}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-repower-cream/75 md:text-xl">
            {subhead}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-repower-gold text-repower-navy-900 hover:bg-repower-gold/90"
            >
              <Link to={primaryCTA.to}>{primaryCTA.label}</Link>
            </Button>
            <a
              href={phoneToTel(phoneNumber)}
              className="inline-flex items-center gap-2 rounded-md border border-repower-cream/20 px-5 py-3 text-sm font-semibold text-repower-cream hover:border-repower-gold hover:text-repower-gold"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {phoneNumber}
            </a>
          </div>
        </div>
      </section>

      {/* Direct answer callout */}
      <section className="bg-[#050E1C] py-10 md:py-14">
        <div className="mx-auto max-w-4xl px-4">
          <div
            className="rounded-2xl border-l-4 border-repower-gold bg-repower-gold/5 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.25)] md:p-8"
            aria-label="Quick answer"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-repower-gold">
              Quick answer
            </p>
            <div className="text-base leading-relaxed text-repower-cream md:text-lg">
              {directAnswer}
            </div>
          </div>
        </div>
      </section>

      {/* Primary visual table */}
      <section className="bg-[#050E1C] py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-4">
          {table.caption && (
            <h2 className="mb-6 font-display text-2xl font-bold text-repower-cream md:text-3xl">
              {table.caption}
            </h2>
          )}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[600px] border-collapse text-sm md:text-base">
              <thead className="bg-white/[0.04]">
                <tr>
                  {table.columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className="px-4 py-3 text-left font-semibold text-repower-gold"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t border-white/5 align-top">
                    {table.columns.map((c) => (
                      <td
                        key={c.key}
                        className="px-4 py-3 text-repower-cream/90"
                      >
                        {row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.footnote && (
            <p className="mt-3 text-sm text-repower-cream/60">{table.footnote}</p>
          )}
        </div>
      </section>

      {/* What's covered */}
      <section className="bg-[#070F20] py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-3 font-display text-3xl font-bold text-repower-cream md:text-4xl">
            What's covered
          </h2>
          <p className="mb-10 max-w-3xl text-repower-cream/75">{coveredIntro}</p>

          <div className="space-y-10">
            {articleGroups.map((group) => (
              <div key={group.heading}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-repower-gold">
                  {group.heading}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.cards.map((card) => (
                    <Link
                      key={card.to}
                      to={card.to}
                      className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-repower-gold/60 hover:bg-white/[0.04]"
                    >
                      <h4 className="mb-2 font-semibold text-repower-cream group-hover:text-repower-gold">
                        {card.title}
                      </h4>
                      {card.description && (
                        <p className="text-sm text-repower-cream/65">
                          {card.description}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-repower-gold">
                        Read guide{' '}
                        <ChevronRight
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why HBW */}
      <section className="bg-[#050E1C] py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-3 font-display text-3xl font-bold text-repower-cream md:text-4xl">
            Why Harris Boat Works
          </h2>
          {whyHbwIntro && (
            <p className="mb-8 max-w-3xl text-repower-cream/75">{whyHbwIntro}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyHbw.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-repower-gold/15 text-repower-gold">
                  {item.icon ?? <Award className="h-5 w-5" aria-hidden="true" />}
                </div>
                <h3 className="mb-1 font-semibold text-repower-cream">
                  {item.title}
                </h3>
                <p className="text-sm text-repower-cream/65">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <AuthorByline
              className="!text-repower-cream/70 [&_*]:!text-repower-cream"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#070F20] py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-6 font-display text-3xl font-bold text-repower-cream md:text-4xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-white/10"
              >
                <AccordionTrigger className="text-left text-repower-cream hover:text-repower-gold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="faq-answer text-repower-cream/80">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="bg-[#050E1C] py-14 md:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-3 font-display text-2xl font-bold text-repower-cream md:text-3xl">
            {secondaryCTA.heading}
          </h2>
          <div className="mb-6 text-repower-cream/75">{secondaryCTA.body}</div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {secondaryCTA.button && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-repower-gold/60 text-repower-gold hover:bg-repower-gold hover:text-repower-navy-900"
              >
                <Link to={secondaryCTA.button.to}>
                  {secondaryCTA.button.label}
                </Link>
              </Button>
            )}
            <a
              href={phoneToTel(phoneNumber)}
              className="inline-flex items-center gap-2 rounded-md border border-repower-cream/20 px-5 py-3 text-sm font-semibold text-repower-cream hover:border-repower-gold hover:text-repower-gold"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {phoneNumber}
            </a>
          </div>
        </div>
      </section>

      {/* Footer block */}
      <section className="bg-[#050E1C] py-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <AuthorByline
            className="!text-repower-cream/70 [&_*]:!text-repower-cream justify-center"
          />
          <p className="mt-3 text-xs text-repower-cream/50">
            Last reviewed: {lastReviewedLabel}. Pricing in CAD, before HST.
            Final pricing confirmed by Harris Boat Works.
          </p>
        </div>
      </section>

      <SiteFooter />
    </RepowerLayout>
  );
}

export const HubIcons = { Award, Users, MapPin, Wrench };
