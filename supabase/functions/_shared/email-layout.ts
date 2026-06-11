// Shared email layout for all customer-facing Harris Boat Works emails.
// Premium, professional, plainspoken. No em-dashes anywhere.
// Table-based, inline styles only. No flexbox, no grid, no external CSS.
// Renders correctly in Gmail, Outlook, and Apple Mail.

export interface BuildEmailOptions {
  preheader?: string;
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
const TEXT = "#1f2430";
const MUTED = "#6b7280";
const BG = "#f4f5f7";
const CARD = "#ffffff";
const BORDER = "#e5e7eb";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
    <tr>
      <td align="center" bgcolor="${NAVY}" style="border-radius:4px;">
        <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:4px;">${safeText}</a>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};text-align:center;">Or copy this link into your browser:</p>
  <p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${NAVY};text-align:center;word-break:break-all;"><a href="${safeUrl}" style="color:${NAVY};text-decoration:underline;">${safeUrl}</a></p>`;
}

export function detailsCard(rows: Array<{ label: string; value: string }>): string {
  const trs = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 0;font-family:${FONT};font-size:13px;color:${MUTED};vertical-align:top;width:140px;">${esc(r.label)}</td>
        <td style="padding:10px 0;font-family:${FONT};font-size:15px;color:${TEXT};font-weight:600;vertical-align:top;">${r.value}</td>
      </tr>`,
    )
    .join("");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafb;border:1px solid ${BORDER};border-radius:6px;margin:20px 0;">
    <tr><td style="padding:8px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${trs}</table>
    </td></tr>
  </table>`;
}

export function buildEmail(opts: BuildEmailOptions): string {
  const preheader = esc(opts.preheader || "");
  const heading = esc(opts.heading);
  const footerNote = opts.footerNote ? `<p style="margin:0 0 14px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:#cbd5e1;text-align:center;">${esc(opts.footerNote)}</p>` : "";
  const cta = opts.ctaText && opts.ctaUrl ? ctaButton(opts.ctaUrl, opts.ctaText) : "";
  const unsubscribe = opts.unsubscribeUrl
    ? `<p style="margin:14px 0 0 0;font-family:${FONT};font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;"><a href="${esc(opts.unsubscribeUrl)}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Harris Boat Works</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:${FONT};color:${TEXT};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BG};opacity:0;">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BG}" style="background-color:${BG};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${CARD};border-radius:6px;overflow:hidden;border:1px solid ${BORDER};">
      <!-- HEADER -->
      <tr><td bgcolor="${NAVY}" style="background-color:${NAVY};padding:28px 32px 18px 32px;text-align:center;">
        <div style="font-family:${FONT};font-size:18px;font-weight:700;letter-spacing:3px;color:#ffffff;text-transform:uppercase;">Harris Boat Works</div>
        <div style="font-family:${FONT};font-size:11px;letter-spacing:2px;color:#cbd5e1;text-transform:uppercase;margin-top:6px;">Authorized Mercury Marine Dealer</div>
      </td></tr>
      <tr><td bgcolor="${NAVY}" style="background-color:${NAVY};padding:0 32px;">
        <div style="height:3px;background-color:${RED};line-height:3px;font-size:3px;">&nbsp;</div>
      </td></tr>
      <!-- CONTENT -->
      <tr><td style="padding:36px 32px 28px 32px;font-family:${FONT};color:${TEXT};">
        <h1 style="margin:0 0 18px 0;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:${TEXT};">${heading}</h1>
        <div style="font-family:${FONT};font-size:15px;line-height:1.65;color:${TEXT};">
          ${opts.bodyHtml}
        </div>
        ${cta}
      </td></tr>
      <!-- FOOTER -->
      <tr><td bgcolor="${NAVY_DEEP}" style="background-color:${NAVY_DEEP};padding:28px 32px;">
        ${footerNote}
        <p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:#ffffff;text-align:center;font-weight:600;">Harris Boat Works</p>
        <p style="margin:0 0 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#cbd5e1;text-align:center;">5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</p>
        <p style="margin:0 0 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#cbd5e1;text-align:center;">
          <a href="tel:9053422153" style="color:#cbd5e1;text-decoration:none;">(905) 342-2153</a>
          &nbsp;|&nbsp;
          <a href="mailto:info@harrisboatworks.ca" style="color:#cbd5e1;text-decoration:none;">info@harrisboatworks.ca</a>
          &nbsp;|&nbsp;
          <a href="https://www.mercuryrepower.ca" style="color:#cbd5e1;text-decoration:none;">mercuryrepower.ca</a>
        </p>
        <p style="margin:14px 0 0 0;font-family:${FONT};font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;">Family-owned on Rice Lake since 1947. Mercury dealer since 1965.</p>
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
    ? `<span style="display:inline-block;padding:3px 8px;background:${RED};color:#ffffff;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;border-radius:3px;text-transform:uppercase;margin-right:8px;">${esc(opts.tag)}</span>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:${FONT};color:${TEXT};">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f5f7;opacity:0;">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f4f5f7">
  <tr><td align="center" style="padding:20px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:4px;">
      <tr><td bgcolor="${NAVY}" style="background:${NAVY};padding:14px 20px;color:#ffffff;">
        <div style="font-family:${FONT};font-size:11px;letter-spacing:2px;color:#cbd5e1;text-transform:uppercase;">Harris Boat Works | Internal</div>
        <div style="font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;margin-top:4px;">${tag}${heading}</div>
      </td></tr>
      <tr><td style="padding:24px 20px;font-family:${FONT};font-size:14px;line-height:1.6;color:${TEXT};">
        ${opts.bodyHtml}
      </td></tr>
      <tr><td bgcolor="#f8fafb" style="background:#f8fafb;padding:12px 20px;font-family:${FONT};font-size:11px;color:${MUTED};text-align:center;border-top:1px solid ${BORDER};">
        Automated notification from Harris Boat Works.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export { esc, NAVY, RED, TEXT, MUTED, FONT };
