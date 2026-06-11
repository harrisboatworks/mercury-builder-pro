UPDATE public.email_templates
SET 
  subject = 'Your Mercury {{motorModel}} quote, ref {{quoteNumber}} | Harris Boat Works',
  html_content = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Mercury Quote</title></head><body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f5f7;opacity:0;">Your Mercury {{motorModel}} quote, ref {{quoteNumber}}.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f4f5f7"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;border:1px solid #e5e7eb;">
<tr><td bgcolor="#0f2a43" style="background-color:#0f2a43;padding:28px 32px 18px 32px;text-align:center;">
<div style="font-size:18px;font-weight:700;letter-spacing:3px;color:#ffffff;text-transform:uppercase;">Harris Boat Works</div>
<div style="font-size:11px;letter-spacing:2px;color:#cbd5e1;text-transform:uppercase;margin-top:6px;">Authorized Mercury Marine Dealer</div>
</td></tr>
<tr><td bgcolor="#0f2a43" style="background-color:#0f2a43;padding:0 32px;"><div style="height:3px;background-color:#c8102e;line-height:3px;font-size:3px;">&nbsp;</div></td></tr>
<tr><td style="padding:36px 32px 28px 32px;">
<h1 style="margin:0 0 18px 0;font-size:22px;line-height:1.3;font-weight:700;color:#1f2430;">Your Mercury {{motorModel}} quote</h1>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">Hi {{customerName}},</p>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">Thanks for your interest. Here is the quote we prepared for you.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafb;border:1px solid #e5e7eb;border-radius:6px;margin:20px 0;"><tr><td style="padding:8px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;width:140px;">Quote #</td><td style="padding:10px 0;font-size:15px;color:#1f2430;font-weight:600;">{{quoteNumber}}</td></tr>
<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;">Motor</td><td style="padding:10px 0;font-size:15px;color:#1f2430;font-weight:600;">{{motorModel}}</td></tr>
<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;">Total</td><td style="padding:10px 0;font-size:15px;color:#1f2430;font-weight:600;">${{totalPrice}} CAD</td></tr>
</table></td></tr></table>
<h2 style="margin:28px 0 12px 0;font-size:16px;font-weight:700;color:#1f2430;">What is next</h2>
<ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.65;color:#1f2430;">
<li style="margin:0 0 8px 0;">Review the details at your own pace.</li>
<li style="margin:0 0 8px 0;">Reply with any questions about rigging, install, or financing.</li>
<li style="margin:0 0 8px 0;">When you are ready, we can lock in the price and schedule pickup at our Gores Landing shop.</li>
</ul>
<p style="margin:22px 0 0 0;font-size:15px;line-height:1.65;">This quote is valid for 30 days.</p>
<p style="margin:16px 0 0 0;font-size:15px;line-height:1.65;">Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
</td></tr>
<tr><td bgcolor="#0a1f33" style="background-color:#0a1f33;padding:28px 32px;text-align:center;color:#cbd5e1;">
<p style="margin:0 0 8px 0;font-size:13px;color:#ffffff;font-weight:600;">Harris Boat Works</p>
<p style="margin:0 0 8px 0;font-size:12px;color:#cbd5e1;">5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</p>
<p style="margin:0 0 8px 0;font-size:12px;color:#cbd5e1;"><a href="tel:9053422153" style="color:#cbd5e1;text-decoration:none;">(905) 342-2153</a> &nbsp;|&nbsp; <a href="mailto:info@harrisboatworks.ca" style="color:#cbd5e1;text-decoration:none;">info@harrisboatworks.ca</a> &nbsp;|&nbsp; <a href="https://www.mercuryrepower.ca" style="color:#cbd5e1;text-decoration:none;">mercuryrepower.ca</a></p>
<p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;">Family-owned on Rice Lake since 1947. Mercury dealer since 1965.</p>
<p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">Pickup is in person at our Gores Landing shop. Please bring valid photo ID.</p>
</td></tr></table></td></tr></table></body></html>',
  updated_at = NOW()
WHERE type = 'quote_delivery';

UPDATE public.email_templates
SET 
  subject = 'Following up on your Mercury {{motorModel}} quote, ref {{quoteNumber}}',
  html_content = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Following Up</title></head><body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f5f7;opacity:0;">Following up on your Mercury {{motorModel}} quote.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f4f5f7"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;border:1px solid #e5e7eb;">
<tr><td bgcolor="#0f2a43" style="background-color:#0f2a43;padding:28px 32px 18px 32px;text-align:center;">
<div style="font-size:18px;font-weight:700;letter-spacing:3px;color:#ffffff;text-transform:uppercase;">Harris Boat Works</div>
<div style="font-size:11px;letter-spacing:2px;color:#cbd5e1;text-transform:uppercase;margin-top:6px;">Authorized Mercury Marine Dealer</div>
</td></tr>
<tr><td bgcolor="#0f2a43" style="background-color:#0f2a43;padding:0 32px;"><div style="height:3px;background-color:#c8102e;line-height:3px;font-size:3px;">&nbsp;</div></td></tr>
<tr><td style="padding:36px 32px 28px 32px;">
<h1 style="margin:0 0 18px 0;font-size:22px;line-height:1.3;font-weight:700;color:#1f2430;">Following up on your quote</h1>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">Hi {{customerName}},</p>
<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;">Just checking in on the quote we sent you. Wanted to make sure it landed and answer any questions.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafb;border:1px solid #e5e7eb;border-radius:6px;margin:20px 0;"><tr><td style="padding:8px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;width:140px;">Quote #</td><td style="padding:10px 0;font-size:15px;color:#1f2430;font-weight:600;">{{quoteNumber}}</td></tr>
<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;">Motor</td><td style="padding:10px 0;font-size:15px;color:#1f2430;font-weight:600;">{{motorModel}}</td></tr>
<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;">Total</td><td style="padding:10px 0;font-size:15px;color:#1f2430;font-weight:600;">${{totalPrice}} CAD</td></tr>
</table></td></tr></table>
<p style="margin:18px 0 14px 0;font-size:15px;line-height:1.65;">Happy to walk through:</p>
<ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.65;color:#1f2430;">
<li style="margin:0 0 6px 0;">Financing and monthly payment options</li>
<li style="margin:0 0 6px 0;">Install timing and rigging fit</li>
<li style="margin:0 0 6px 0;">Current promotions and warranty</li>
</ul>
<p style="margin:22px 0 0 0;font-size:15px;line-height:1.65;">No rush. Reply when it suits you, or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
</td></tr>
<tr><td bgcolor="#0a1f33" style="background-color:#0a1f33;padding:28px 32px;text-align:center;color:#cbd5e1;">
<p style="margin:0 0 8px 0;font-size:13px;color:#ffffff;font-weight:600;">Harris Boat Works</p>
<p style="margin:0 0 8px 0;font-size:12px;color:#cbd5e1;">5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</p>
<p style="margin:0 0 8px 0;font-size:12px;color:#cbd5e1;"><a href="tel:9053422153" style="color:#cbd5e1;text-decoration:none;">(905) 342-2153</a> &nbsp;|&nbsp; <a href="mailto:info@harrisboatworks.ca" style="color:#cbd5e1;text-decoration:none;">info@harrisboatworks.ca</a> &nbsp;|&nbsp; <a href="https://www.mercuryrepower.ca" style="color:#cbd5e1;text-decoration:none;">mercuryrepower.ca</a></p>
<p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;">Family-owned on Rice Lake since 1947. Mercury dealer since 1965.</p>
</td></tr></table></td></tr></table></body></html>',
  updated_at = NOW()
WHERE type = 'follow_up';