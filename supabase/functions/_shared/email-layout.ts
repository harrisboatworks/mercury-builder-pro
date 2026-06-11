// Shared email layout for all customer-facing Harris Boat Works emails.
// Premium, editorial, plainspoken. No em-dashes anywhere.
// Table-based, inline styles only. No flexbox, no grid, no external CSS.
// Renders correctly in Gmail, Outlook, and Apple Mail.

export interface BuildEmailOptions {
  preheader?: string;
  eyebrow?: string;
  heading: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
  unsubscribeUrl?: string;
}

const NAVY = "#0f2a43";
const NAVY_DEEP = "#0a1f33";
const RED = "#c8102e";
const GOLD = "#c5a572";
const TEXT = "#1f2430";
const MUTED = "#6b7280";
const BG = "#f1ece4"; // warm neutral page background (parchment)
const CARD = "#ffffff";
const CARD_SOFT = "#faf8f4";
const BORDER = "#e5e0d6";
const HAIRLINE = "#d9d3c7";
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const LOGO_URL = "https://www.mercuryrepower.ca/email-assets/harris-logo-white.png";
const MERCURY_LOGO_URL = "https://www.mercuryrepower.ca/email-assets/mercury-logo-white.png";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ctaButton(url: string, text: string): string {
  const safeUrl = esc(url);
  const safeText = esc(text);
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:32px auto 16px auto;">
    <tr>
      <td align="center" bgcolor="${NAVY}" style="border-radius:3px;">
        <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:16px 38px;font-family:${SANS};font-size:14px;font-weight:600;letter-spacing:1.5px;line-height:1;color:#ffffff;text-decoration:none;border-radius:3px;text-transform:uppercase;">${safeText}</a>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 6px 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">Or paste this link into your browser</p>
  <p style="margin:0 0 8px 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${NAVY};text-align:center;word-break:break-all;"><a href="${safeUrl}" style="color:${NAVY};text-decoration:underline;">${safeUrl}</a></p>`;
}

export function detailsCard(rows: Array<{ label: string; value: string }>): string {
  const trs = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:14px 0 14px 0;${i === 0 ? "" : `border-top:1px solid ${HAIRLINE};`}font-family:${SANS};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};vertical-align:top;width:150px;font-weight:600;">${esc(r.label)}</td>
        <td style="padding:14px 0 14px 0;${i === 0 ? "" : `border-top:1px solid ${HAIRLINE};`}font-family:${SERIF};font-size:16px;color:${TEXT};vertical-align:top;line-height:1.5;">${r.value}</td>
      </tr>`,
    )
    .join("");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CARD_SOFT};border:1px solid ${BORDER};border-radius:4px;margin:24px 0;">
    <tr><td style="padding:4px 22px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${trs}</table>
    </td></tr>
  </table>`;
}

export function buildEmail(opts: BuildEmailOptions): string {
  const preheader = esc(opts.preheader || "");
  const eyebrow = esc(opts.eyebrow || "");
  const heading = esc(opts.heading);
  const footerNote = opts.footerNote
    ? `<p style="margin:0 0 18px 0;font-family:${SANS};font-size:13px;line-height:1.65;color:#cbd5e1;text-align:center;">${esc(opts.footerNote)}</p>`
    : "";
  const cta = opts.ctaText && opts.ctaUrl ? ctaButton(opts.ctaUrl, opts.ctaText) : "";
  const unsubscribe = opts.unsubscribeUrl
    ? `<p style="margin:16px 0 0 0;font-family:${SANS};font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;"><a href="${esc(opts.unsubscribeUrl)}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>`
    : "";
  const eyebrowHtml = eyebrow
    ? `<div style="font-family:${SANS};font-size:10px;letter-spacing:2.5px;color:${GOLD};text-transform:uppercase;font-weight:700;margin:0 0 14px 0;">${eyebrow}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Harris Boat Works</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:${SANS};color:${TEXT};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BG};opacity:0;">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG}" style="background-color:${BG};">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${CARD};border-radius:4px;overflow:hidden;border:1px solid ${BORDER};">
      <!-- HEADER -->
      <tr><td bgcolor="${NAVY}" style="background-color:${NAVY};padding:32px 32px 22px 32px;text-align:center;">
        <a href="https://www.mercuryrepower.ca" style="text-decoration:none;color:#ffffff;display:inline-block;">
          <img src="${LOGO_URL}" alt="Harris Boat Works" width="120" height="84" style="display:block;margin:0 auto 14px auto;border:0;outline:none;width:120px;height:84px;max-width:120px;" />
          <div style="font-family:${SERIF};font-size:18px;font-weight:400;letter-spacing:6px;color:#ffffff;text-transform:uppercase;">Harris Boat Works</div>
        </a>
        <div style="font-family:${SANS};font-size:9px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;margin-top:10px;font-weight:600;">Authorized Mercury Marine Dealer</div>
      </td></tr>
      <tr><td bgcolor="${NAVY}" style="background-color:${NAVY};padding:0;">
        <div style="height:2px;background-color:${RED};line-height:2px;font-size:2px;">&nbsp;</div>
      </td></tr>
      <!-- CONTENT -->
      <tr><td style="padding:44px 40px 32px 40px;font-family:${SANS};color:${TEXT};">
        ${eyebrowHtml}
        <h1 style="margin:0 0 22px 0;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:400;color:${NAVY};letter-spacing:-0.3px;">${heading}</h1>
        <div style="height:1px;background:${HAIRLINE};line-height:1px;font-size:1px;margin:0 0 26px 0;">&nbsp;</div>
        <div style="font-family:${SANS};font-size:15px;line-height:1.7;color:${TEXT};">
          ${opts.bodyHtml}
        </div>
        ${cta}
      </td></tr>
      <!-- FOOTER -->
      <tr><td bgcolor="${NAVY_DEEP}" style="background-color:${NAVY_DEEP};padding:32px 36px 28px 36px;">
        ${footerNote}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr><td align="center" style="padding-bottom:14px;">
            <img src="${MERCURY_LOGO_URL}" alt="Mercury Marine" width="140" height="27" style="display:block;border:0;outline:none;width:140px;height:27px;max-width:140px;opacity:0.85;" />
          </td></tr>
        </table>
        <p style="margin:0 0 6px 0;font-family:${SANS};font-size:9px;letter-spacing:2.5px;color:${GOLD};text-align:center;font-weight:700;text-transform:uppercase;">Mercury Platinum Dealer</p>
        <div style="height:1px;background:rgba(255,255,255,0.12);line-height:1px;font-size:1px;margin:18px 0;">&nbsp;</div>
        <p style="margin:0 0 6px 0;font-family:${SERIF};font-size:15px;line-height:1.6;color:#ffffff;text-align:center;letter-spacing:2px;text-transform:uppercase;">Harris Boat Works</p>
        <p style="margin:0 0 10px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#cbd5e1;text-align:center;">5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</p>
        <p style="margin:0 0 12px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#cbd5e1;text-align:center;">
          <a href="tel:9053422153" style="color:#cbd5e1;text-decoration:none;">(905) 342-2153</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:info@harrisboatworks.ca" style="color:#cbd5e1;text-decoration:none;">info@harrisboatworks.ca</a>
        </p>
        <p style="margin:0 0 14px 0;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;line-height:1.6;color:#94a3b8;text-align:center;">
          <a href="https://www.mercuryrepower.ca/quote-builder" style="color:#cbd5e1;text-decoration:none;">Build a Quote</a>
          &nbsp;&middot;&nbsp;
          <a href="https://www.mercuryrepower.ca/pricing-reference" style="color:#cbd5e1;text-decoration:none;">Pricing</a>
          &nbsp;&middot;&nbsp;
          <a href="https://www.mercuryrepower.ca/contact" style="color:#cbd5e1;text-decoration:none;">Contact</a>
        </p>
        <p style="margin:14px 0 0 0;font-family:${SERIF};font-style:italic;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">Family-owned on Rice Lake since 1947. Mercury dealer since 1965.</p>
        ${unsubscribe}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// Compact admin layout: smaller, scannable, all data front-and-center.
export interface AdminEmailOptions {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  tag?: string; // e.g. "DEPOSIT", "QUOTE", "URGENT"
}

export function buildAdminEmail(opts: AdminEmailOptions): string {
  const preheader = esc(opts.preheader || "");
  const heading = esc(opts.heading);
  const tag = opts.tag
    ? `<span style="display:inline-block;padding:3px 8px;background:${RED};color:#ffffff;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.5px;border-radius:3px;text-transform:uppercase;margin-right:8px;">${esc(opts.tag)}</span>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:${SANS};color:${TEXT};">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f5f7;opacity:0;">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f4f5f7">
  <tr><td align="center" style="padding:20px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:4px;">
      <tr><td bgcolor="${NAVY}" style="background:${NAVY};padding:14px 20px;color:#ffffff;">
        <div style="font-family:${SANS};font-size:10px;letter-spacing:2px;color:${GOLD};text-transform:uppercase;font-weight:700;">Harris Boat Works | Internal</div>
        <div style="font-family:${SANS};font-size:16px;font-weight:600;color:#ffffff;margin-top:4px;">${tag}${heading}</div>
      </td></tr>
      <tr><td style="padding:24px 20px;font-family:${SANS};font-size:14px;line-height:1.6;color:${TEXT};">
        ${opts.bodyHtml}
      </td></tr>
      <tr><td bgcolor="#f8fafb" style="background:#f8fafb;padding:12px 20px;font-family:${SANS};font-size:11px;color:${MUTED};text-align:center;border-top:1px solid ${BORDER};">
        Automated notification from Harris Boat Works.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export { esc, NAVY, RED, GOLD, TEXT, MUTED, FONT_SANS, FONT_SERIF };
// Backwards-compatible exports
const FONT_SANS = SANS;
const FONT_SERIF = SERIF;
export const FONT = SANS;
