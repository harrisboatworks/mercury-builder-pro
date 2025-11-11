// Shared email template for professional, branded emails

export function createBrandedEmailTemplate(content: string, previewText?: string): string {
  const appUrl = Deno.env.get('APP_URL') || 'https://quote.harrisboatworks.ca';
  
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #007DC5 0%, #1e40af 100%);
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
    }
    .content {
      padding: 40px 32px;
      color: #374151;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #007DC5 0%, #1e40af 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 125, 197, 0.3);
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
      color: #374151;
      font-weight: 600;
    }
    .badge-icon {
      margin-right: 6px;
    }
    .contact-info {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.8;
    }
    .contact-info a {
      color: #007DC5;
      text-decoration: none;
      font-weight: 500;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    h1 {
      color: #111827;
      font-size: 28px;
      margin: 0 0 16px 0;
      font-weight: 700;
    }
    h2 {
      color: #374151;
      font-size: 20px;
      margin: 24px 0 12px 0;
      font-weight: 600;
    }
    .info-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
      border-left: 4px solid #007DC5;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .reference-number {
      font-size: 32px;
      font-weight: 700;
      color: #007DC5;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 12px;
      margin: 24px 0;
      border: 2px solid #007DC5;
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
        <img src="${appUrl}/email-assets/harris-logo.png" alt="Harris Boat Works" class="logo" />
        <img src="${appUrl}/email-assets/mercury-logo.png" alt="Mercury Marine" class="logo" />
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
      <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
        You received this email because you started a financing application with Harris Boat Works.
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
    }
    .content {
      padding: 40px 32px;
      color: #374151;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 32px 0;
    }
    h1 {
      color: #111827;
      font-size: 28px;
      margin: 0 0 16px 0;
      font-weight: 700;
    }
    h2 {
      color: #374151;
      font-size: 20px;
      margin: 24px 0 12px 0;
      font-weight: 600;
    }
    .info-box {
      background-color: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .reference-number {
      font-size: 32px;
      font-weight: 700;
      color: #1e40af;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding: 16px;
      background-color: #eff6ff;
      border-radius: 8px;
      margin: 24px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 16px;
      }
      .header {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <a href="https://harrisboatworks.com" class="logo">Harris Boat Works</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>
        <strong>Harris Boat Works</strong><br>
        Quality Marine Engines & Service<br>
        Phone: <a href="tel:905-342-2153">(905) 342-2153</a><br>
        Email: <a href="mailto:info@harrisboatworks.ca">info@harrisboatworks.ca</a>
      </p>
      <div class="divider"></div>
      <p style="font-size: 12px; color: #9ca3af;">
        You received this email because you started a financing application with Harris Boat Works.
        If you have any questions, please contact us.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function createButtonHtml(url: string, text: string): string {
  return `<a href="${url}" class="button">${text}</a>`;
}
