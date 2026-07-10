import { Fish, Waves, Ship, Trophy, Wrench, Phone, MessageCircle } from 'lucide-react';

export interface CustomerVoiceItem {
  quote: string;
  response: string;
  isCTA?: boolean;
}

export interface CustomerVoiceProps {
  items: CustomerVoiceItem[];
  /**
   * Optional section heading. If omitted, the eyebrow alone serves as the
   * label. Pass a short string like "Customer language we hear" to keep
   * existing post hierarchy.
   */
  heading?: string;
}

const PHONE_DIGITS_RE = /(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/;

function pickIcon(text: string) {
  const t = text.toLowerCase();
  if (/tournament|bass|fish|salmon|troll/.test(t)) return Fish;
  if (/pontoon|cruis|cottage|cruise/.test(t)) return Ship;
  if (/ski|tube|tubing|wakeboard|surf/.test(t)) return Waves;
  if (/trophy|champion|winning/.test(t)) return Trophy;
  if (/call|talk|book|appoint/.test(t)) return Phone;
  return Wrench;
}

function extractPhone(text: string): string | null {
  const m = PHONE_DIGITS_RE.exec(text);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function CustomerVoice({ items, heading }: CustomerVoiceProps) {
  if (!items?.length) return null;
  return (
    <section className="my-10 rounded-lg border border-repower-navy-900/10 bg-repower-cream p-6 md:p-10">
      <header className="mb-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
          <span aria-hidden="true" className="h-px w-8 bg-repower-mercury-red" />
          <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red">
            Real questions from the shop floor
          </p>
        </div>
        {heading ? (
          <h2
            className="font-display font-bold text-repower-navy-900"
            style={{ fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            {heading}
          </h2>
        ) : null}
      </header>

      <ul className="flex flex-col gap-4 list-none p-0 m-0">
        {items.map((item, i) => (
          <CustomerVoiceCard key={i} item={item} />
        ))}
      </ul>
    </section>
  );
}

function CustomerVoiceCard({ item }: { item: CustomerVoiceItem }) {
  const Icon = pickIcon(item.quote + ' ' + item.response);
  const phone = item.isCTA ? extractPhone(item.response) : null;

  return (
    <li
      className={[
        'group relative rounded-md border bg-repower-paper shadow-sm transition-shadow hover:shadow-md',
        item.isCTA
          ? 'border-repower-mercury-red/40 ring-1 ring-repower-mercury-red/10'
          : 'border-repower-navy-900/10',
      ].join(' ')}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1px_1fr]">
        {/* LEFT: Customer voice */}
        <div className="relative p-6 md:p-8">
          <span
            aria-hidden="true"
            className="absolute -top-1 left-3 md:left-4 font-display text-repower-gold leading-none select-none pointer-events-none"
            style={{ fontSize: '4.5rem' }}
          >
            &ldquo;
          </span>
          <p className="relative font-playfair italic text-repower-navy-900/85 text-[17px] md:text-[18px] leading-snug pt-6 md:pt-4 m-0">
            {item.quote}
          </p>
        </div>

        {/* Divider (desktop gold hairline, mobile cream rule) */}
        <div
          aria-hidden="true"
          className="hidden md:block bg-gradient-to-b from-transparent via-repower-gold/40 to-transparent"
        />
        <div
          aria-hidden="true"
          className="md:hidden mx-6 h-px bg-repower-navy-900/10"
        />

        {/* RIGHT: HBW response */}
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span aria-hidden="true" className="h-px w-6 bg-repower-mercury-red" />
            <p className="font-sans font-semibold text-[10px] uppercase tracking-[0.22em] text-repower-mercury-red">
              Our take
            </p>
          </div>

          {item.isCTA && phone ? (
            <a
              href={`tel:${phone.replace(/-/g, '')}`}
              className="inline-flex items-center gap-2 font-display font-bold text-repower-mercury-red hover:text-repower-mercury-red-deep transition-colors"
              style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', letterSpacing: '-0.01em' }}
            >
              <Phone size={20} aria-hidden="true" />
              <span>{phone}</span>
            </a>
          ) : (
            <p className="font-sans font-semibold text-repower-navy-900 text-[16px] md:text-[17px] leading-snug m-0">
              {item.response}
            </p>
          )}

          {!item.isCTA ? (
            <Icon
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
              className="absolute bottom-4 right-4 text-repower-navy-900/25 group-hover:text-repower-navy-900/40 transition-colors"
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default CustomerVoice;
