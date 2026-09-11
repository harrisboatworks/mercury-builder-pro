import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  replaceTemplateVariables,
  sanitizeEmailSubject,
} from "../../supabase/functions/send-quote-email/template-policy";
import {
  buildAdminEmail,
  buildEmail,
  detailsCard,
  esc,
  safeHttpsUrl,
} from "../../supabase/functions/_shared/email-layout";
import { replaceConsultationTemplateVariables } from "../../supabase/functions/_shared/consultation-quote-email";

const data = {
  customerName: `A <b>x</b> & ' "`,
  quoteNumber: "Q-<42>&",
  motorModel: "Mercury <img src=x> & FourStroke",
  totalPrice: 12_345.67,
};

describe("quote email template policy", () => {
  it("escapes database HTML text variables exactly once", () => {
    const rendered = replaceTemplateVariables(
      "Hi {{customerName}} | {{quoteNumber}} | {{motorModel}} | {{totalPrice}}",
      data,
      "html",
    );

    expect(rendered).toContain(`A &lt;b&gt;x&lt;/b&gt; &amp; ' &quot;`);
    expect(rendered).toContain("Q-&lt;42&gt;&amp;");
    expect(rendered).toContain("Mercury &lt;img src=x&gt; &amp; FourStroke");
    expect(rendered).toContain(data.totalPrice.toLocaleString());
    expect(rendered).not.toContain("<b>");
    expect(rendered).not.toContain("<img");
    expect(rendered).not.toContain("&amp;lt;");
  });

  it("neutralizes subject controls without HTML-encoding customer punctuation", () => {
    const rendered = replaceTemplateVariables(
      "Quote {{quoteNumber}} for {{motorModel}}",
      {
        ...data,
        quoteNumber: "Q-1\r\nBcc: attacker@example.com\u0000",
        motorModel: "O'Brien & Sons\u2028Injected",
      },
      "subject",
    );

    expect(rendered).toBe("Quote Q-1 Bcc: attacker@example.com for O'Brien & Sons Injected");
    expect(Array.from(rendered).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 0x1f
        || (codePoint >= 0x7f && codePoint <= 0x9f)
        || codePoint === 0x2028
        || codePoint === 0x2029;
    })).toBe(false);
    expect(rendered).not.toContain("&amp;");
  });

  it("sanitizes the complete fallback subject after interpolation", () => {
    expect(sanitizeEmailSubject("  Your quote\r\n\tInjected  ")).toBe("Your quote Injected");
  });

  it("sanitizes consultation-template subjects after raw token replacement", () => {
    const rendered = replaceConsultationTemplateVariables(
      "Quote {{quoteNumber}} for {{motorModel}}",
      {
        ...data,
        quoteNumber: "Q-1\r\nBcc: attacker@example.com\u0000",
        motorModel: "Mercury\u2028Injected",
        documentAccessUrl:
          `https://www.mercuryrepower.ca/quote/document#cd_${"ab".repeat(32)}`,
      },
      { html: false },
    );

    expect(sanitizeEmailSubject(rendered)).toBe(
      "Quote Q-1 Bcc: attacker@example.com for Mercury Injected",
    );
  });

  it("does one placeholder pass without re-substituting request text", () => {
    expect(replaceTemplateVariables(
      "Hi {{customerName}} total {{totalPrice}}",
      { ...data, customerName: "{{totalPrice}}" },
      "html",
    )).toBe(`Hi {{totalPrice}} total ${data.totalPrice.toLocaleString()}`);
  });

  it("escapes fallback customer and admin headings exactly once", () => {
    const customerHtml = buildEmail({
      heading: "Your Mercury <img src=x> & FourStroke quote",
      bodyHtml: "Safe body",
    });
    const adminHtml = buildAdminEmail({
      heading: "A <b>x</b> & Customer - Mercury <img src=x>",
      bodyHtml: "Safe body",
    });

    expect(customerHtml).toContain("Your Mercury &lt;img src=x&gt; &amp; FourStroke quote");
    expect(customerHtml).not.toContain("&amp;lt;img");
    expect(adminHtml).toContain("A &lt;b&gt;x&lt;/b&gt; &amp; Customer - Mercury &lt;img src=x&gt;");
    expect(adminHtml).not.toContain("&amp;lt;b");
  });

  it("pins the database and fallback subject call sites", () => {
    const source = readFileSync(
      join(process.cwd(), "supabase/functions/send-quote-email/index.ts"),
      "utf8",
    );

    expect(source).toContain('replaceTemplateVariables(template.subject, emailData, "subject")');
    expect(source).toContain('replaceTemplateVariables(template.html_content, emailData, "html")');
    expect(source).toContain("subject = sanitizeEmailSubject(subject)");
    expect(source).toContain('heading: `Your Mercury ${data.motorModel} quote`');
    expect(source).not.toContain('heading: `Your Mercury ${esc(data.motorModel)} quote`');
    expect(source).not.toContain('heading: `${esc(data.leadData?.customerName || "Lead")}');
  });
});

const XSS = `"><img src=x onerror=alert(1)>`;
const ESCAPED_XSS = esc(XSS);

describe("outbound email HTML interpolation", () => {
  it("escapes request name in the repower-guide greeting exactly once", () => {
    const greeting = XSS ? `Hi ${esc(XSS)},` : "Hi there,";
    const html = buildEmail({
      heading: "Your Repower Guide is ready",
      bodyHtml: `<p style="margin:0 0 14px 0;">${greeting}</p>`,
    });

    expect(html).toContain(`Hi ${ESCAPED_XSS},`);
    expect(html).not.toContain(`Hi ${XSS}`);
    expect(html).not.toContain("&amp;lt;img");
    expect(html).not.toContain("&amp;quot;");
  });

  it("escapes request name in the blog-subscribe greeting exactly once", () => {
    const body = `<p style="margin:0 0 14px 0;">${XSS ? `Hi ${esc(XSS)},` : "Hi there,"}</p>`;
    const html = buildEmail({
      heading: "Welcome to our journal",
      bodyHtml: body,
    });

    expect(html).toContain(`Hi ${ESCAPED_XSS},`);
    expect(html).not.toContain(`Hi ${XSS}`);
    expect(html).not.toContain("&amp;lt;img");
  });

  it("escapes weekly-report quote and activity strings in table cells", () => {
    const q = { customer_name: XSS, customer_email: XSS };
    const model = XSS;
    const page = XSS;
    const source = XSS;
    const campaign = XSS;
    const cells = [
      `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(q.customer_name)}</td>`,
      `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(q.customer_email)}</td>`,
      `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(model)}</td>`,
      `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(page)}</td>`,
      `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(source)}</td>`,
      `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(campaign)}</td>`,
    ].join("");

    expect(cells).toContain(ESCAPED_XSS);
    expect(cells).not.toContain(XSS);
    expect(cells).not.toContain("<img");
    expect(cells).not.toContain("&amp;lt;");
  });

  it("escapes the weekly-report LLM summary before converting newlines", () => {
    const aiText = `Line one\n${XSS}`;
    const escapedText = esc(aiText).replace(/\n/g, "<br>");

    expect(escapedText).toBe(`Line one<br>${ESCAPED_XSS}`);
    expect(escapedText).not.toContain("<img");
    expect(escapedText).not.toContain("&lt;br&gt;");
    expect(escapedText).not.toContain("&amp;lt;");
  });

  it("rejects non-https articleImage URLs and escapes https src attributes", () => {
    const injected = `https://cdn.example.com/hero.png?q=${XSS}`;
    const safeImage = safeHttpsUrl(injected);
    const imageBlock = safeImage
      ? `<p style="margin:0 0 18px 0;text-align:center;"><img src="${safeImage}" alt="title" /></p>`
      : "";

    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("data:text/html,<img src=x onerror=alert(1)>")).toBeNull();
    expect(safeHttpsUrl("http://cdn.example.com/hero.png")).toBeNull();
    expect(safeHttpsUrl("https://cdn.example.com/hero.png")).toBe(
      "https://cdn.example.com/hero.png",
    );
    expect(safeImage).toBe(esc(injected));
    expect(imageBlock).toContain(`src="${esc(injected)}"`);
    expect(imageBlock).not.toContain(`src="${injected}"`);
    expect(imageBlock).not.toContain(XSS);
    expect(imageBlock).not.toContain("&amp;amp;");
  });

  it("treats detailsCard valueHtml as already escaped", () => {
    const html = detailsCard([{ label: XSS, valueHtml: esc(XSS) }]);

    expect(html).toContain(ESCAPED_XSS);
    expect(html).not.toContain(XSS);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("&amp;lt;");
    expect(html).not.toContain("&amp;quot;");
    expect(detailsCard([{ label: "Motor", valueHtml: esc("O'Brien & Sons") }]))
      .toContain("O'Brien &amp; Sons");
    expect(detailsCard([{
      label: "Payment ID",
      valueHtml: `<span style="font-family:monospace;">${esc("pi_1")}</span>`,
    }])).toContain('<span style="font-family:monospace;">pi_1</span>');
  });

  it("pins the interpolation sites so comments cannot satisfy the contract", () => {
    const read = (relative: string) =>
      readFileSync(join(process.cwd(), relative), "utf8");
    const repower = read("supabase/functions/send-repower-guide-email/index.ts");
    const subscribe = read("supabase/functions/subscribe-blog/index.ts");
    const weekly = read("supabase/functions/weekly-quote-report/index.ts");
    const blog = read("supabase/functions/send-blog-notification/index.ts");
    const layout = read("supabase/functions/_shared/email-layout.ts");

    expect(repower).toContain('const greeting = name ? `Hi ${esc(name)},` : "Hi there,";');
    expect(repower).not.toContain("Hi ${name}");
    expect(subscribe).toContain("${name ? `Hi ${esc(name)},` : \"Hi there,\"}");
    expect(subscribe).not.toContain("Hi ${name}");
    expect(weekly).toContain("const escapedText = esc(aiText).replace(/\\n/g, '<br>');");
    expect(weekly).toContain("${esc(q.customer_name)}");
    expect(weekly).toContain("${esc(q.customer_email)}");
    expect(weekly).toContain("${esc(model)}");
    expect(weekly).toContain("${esc(page)}");
    expect(weekly).toContain("${esc(source)}");
    expect(weekly).toContain("${esc(campaign)}");
    expect(weekly).not.toContain("${q.customer_name}");
    expect(weekly).not.toContain("${q.customer_email}");
    expect(blog).toContain("const safeImage = articleImage ? safeHttpsUrl(articleImage) : null;");
    expect(blog).toContain('src="${safeImage}"');
    expect(blog).not.toContain('src="${articleImage}"');
    expect(layout).toContain("${r.valueHtml}");
    expect(layout).not.toContain("${esc(r.valueHtml)}");
    expect(layout).not.toContain("${r.value}");
  });
});
