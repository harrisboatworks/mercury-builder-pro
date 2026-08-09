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
} from "../../supabase/functions/_shared/email-layout";

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
  });
});
