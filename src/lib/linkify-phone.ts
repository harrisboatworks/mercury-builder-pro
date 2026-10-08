// Blog bodies carry the HBW phone number as plain text in many places.
// Turning every rendered occurrence into a tel: link is what makes the number
// tappable on mobile and what lets the existing GlobalCtaTracker delegate fire
// the shared GA4 `phone_click` event (no second event name).

export const HBW_PHONE_DISPLAY = '905-342-2153';
export const HBW_PHONE_HREF = 'tel:+19053422153';

// Skip numbers that are already link text (`[905-342-2153](...)`) or already
// sit inside a URL / tel: href.
const PLAIN_PHONE = /(?<!\[)(?<!tel:\+1)(?<!\d)905-342-2153(?!\d)(?!\]\()/g;

/** Wrap every plain-text HBW phone number in markdown with a tel: link. */
export function linkifyHbwPhone(markdown: string): string {
  return markdown.replace(
    PLAIN_PHONE,
    `[${HBW_PHONE_DISPLAY}](${HBW_PHONE_HREF})`,
  );
}
