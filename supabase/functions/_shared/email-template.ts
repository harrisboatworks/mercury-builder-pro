// Shared email template for professional, branded emails

const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function createBrandedEmailTemplate(content: string, previewText?: string, footerNote?: string): string {
  const appUrl = Deno.env.get('APP_URL') || 'https://mercuryrepower.ca';
  const note = footerNote || "You're receiving this email from Harris Boat Works.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${previewText ? `<meta name="preview-text" content="${previewText}">` : ''}
  <title>Harris Boat Works</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: ${FONT_STACK};
      background-color: #F5F5F5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
    }
    .header {
      background-color: #26496D;
      background: linear-gradient(135deg, #26496D 0%, #1D3A57 100%);
      padding: 24px 20px;
      text-align: center;
    }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 30px;
      max-width: 600px;
      margin: 0 auto;
    }
    .logo {
      height: 50px;
      width: auto;
    }
    .tagline {
      color: #ffffff;
      font-size: 14px;
      margin-top: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
      font-family: ${FONT_STACK};
    }
    .content {
      padding: 40px 32px;
      color: #1F2430;
      line-height: 1.6;
      font-family: ${FONT_STACK};
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background-color: #C8102E !important;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
      font-family: ${FONT_STACK};
    }
    .trust-footer {
      background-color: #f9fafb;
      padding: 32px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .badges-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-block;
      padding: 8px 16px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 12px;
      color: #1F2430;
      font-weight: 600;
      font-family: ${FONT_STACK};
    }
    .badge-icon {
      margin-right: 6px;
    }
    .contact-info {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.8;
      font-family: ${FONT_STACK};
    }
    .contact-info a {
      color: #26496D;
      text-decoration: none;
      font-weight: 500;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    h1 {
      color: #1F2430;
      font-size: 28px;
      margin: 0 0 16px 0;
      font-weight: 700;
      font-family: ${FONT_STACK};
    }
    h2 {
      color: #1F2430;
      font-size: 20px;
      margin: 24px 0 12px 0;
      font-weight: 600;
      font-family: ${FONT_STACK};
    }
    a {
      color: #26496D;
    }
    .info-box {
      background-color: #f7f9fb;
      border-left: 4px solid #26496D;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .reference-number {
      font-size: 32px;
      font-weight: 700;
      color: #26496D;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding: 20px;
      background-color: #f7f9fb;
      border-radius: 12px;
      margin: 24px 0;
      border: 2px solid #26496D;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 16px;
      }
      .header {
        padding: 20px 16px;
      }
      .logo-container {
        flex-direction: column;
        gap: 15px;
      }
      .logo {
        height: 40px;
      }
      .badges-container {
        flex-direction: column;
        gap: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-container">
        <img src="${appUrl}/email-assets/harris-logo-white.png" alt="Harris Boat Works" class="logo" />
        <img src="${appUrl}/email-assets/mercury-logo-white.png" alt="Mercury Marine" class="logo" />
      </div>
      <div class="tagline">Authorized Mercury Marine Dealer • Go Boldly</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="trust-footer">
      <div class="badges-container">
        <div class="badge">
          <span class="badge-icon">🏆</span>
          Mercury CSI Award Winner
        </div>
        <div class="badge">
          <span class="badge-icon">✓</span>
          Certified Repower Center
        </div>
        <div class="badge">
          <span class="badge-icon">🇨🇦</span>
          Proudly Canadian
        </div>
      </div>
      <div class="contact-info">
        <strong>Harris Boat Works</strong><br>
        5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0<br>
        Phone: <a href="tel:905-342-2153">(905) 342-2153</a><br>
        Email: <a href="mailto:info@harrisboatworks.ca">info@harrisboatworks.ca</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 16px; font-family: ${FONT_STACK};">
        ${note}
        If you have any questions, please contact us.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Legacy email template (kept for backward compatibility)
export function createEmailTemplate(content: string, previewText?: string): string {
  return createBrandedEmailTemplate(content, previewText);
}

export function createButtonHtml(url: string, text: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
    <tr>
      <td align="center" bgcolor="#C8102E" style="border-radius:4px;background-color:#C8102E;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:16px 40px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">${text}</a>
      </td>
    </tr>
  </table>`;
}
