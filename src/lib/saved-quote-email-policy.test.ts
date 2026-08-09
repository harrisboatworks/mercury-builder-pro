import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  authorizeSavedQuoteEmail,
  isAuthorizedServiceRequest,
  parseSavedQuoteEmailRequest,
  resolveSavedQuoteEmail,
  SavedQuoteEmailUnavailableError,
  type SavedQuoteEmailRequest,
  type SavedQuoteEmailRow,
} from "../../supabase/functions/send-saved-quote-email/quote-policy";
import { buildEmail } from "../../supabase/functions/_shared/email-layout";

const QUOTE_ID = "123e4567-e89b-42d3-a456-426614174000";
const RESUME_TOKEN = "quote_0123456789abcdef0123456789abcdef0123456789abcdef";
const REQUEST: SavedQuoteEmailRequest = {
  savedQuoteId: QUOTE_ID,
  resumeToken: RESUME_TOKEN,
};

function row(overrides: Partial<SavedQuoteEmailRow> = {}): SavedQuoteEmailRow {
  return {
    id: QUOTE_ID,
    email: "buyer@example.com",
    resume_token: RESUME_TOKEN,
    quote_state: {
      customerName: "Test Buyer",
      motor: { model: "Mercury 115 FourStroke", price: 12_000 },
      finalPrice: 15_250.55,
    },
    expires_at: "2026-10-01T12:00:00.000Z",
    is_soft_lead: false,
    ...overrides,
  };
}

describe("saved quote email authority policy", () => {
  it("accepts only the durable row id and bearer-style resume token", () => {
    expect(parseSavedQuoteEmailRequest({
      savedQuoteId: QUOTE_ID,
      resumeToken: RESUME_TOKEN,
      customerEmail: "override@example.com",
      motorModel: "Injected model",
      finalPrice: 1,
    })).toEqual(REQUEST);

    expect(() => parseSavedQuoteEmailRequest({ savedQuoteId: "not-a-uuid", resumeToken: "short" }))
      .toThrow("Invalid saved quote email request");
  });

  it("looks up by both credentials and derives all visible facts from the row", async () => {
    const lookup = vi.fn(async () => row());
    const resolved = await authorizeSavedQuoteEmail(
      { ...REQUEST, customerEmail: "override@example.com", finalPrice: 1 },
      lookup,
      new Date("2026-08-09T12:00:00.000Z"),
    );

    expect(lookup).toHaveBeenCalledWith(QUOTE_ID, RESUME_TOKEN);
    expect(resolved).toEqual(expect.objectContaining({
      recipient: "buyer@example.com",
      customerName: "Test Buyer",
      motorModel: "Mercury 115 FourStroke",
      finalPrice: 15_250.55,
      priceLabel: "Total",
      quoteLink: `https://www.mercuryrepower.ca/quote/saved/${QUOTE_ID}`,
    }));
  });

  it("uses frozen customer totals before legacy motor-only prices", () => {
    const cases = [
      {
        quote_state: {
          motor: { model: "Mercury 90 FourStroke", price: 9_000 },
          finalPrice: 10_000,
          frozenPricing: { total: 11_000 },
          pdfSnapshot: { pricing: { totalCashPrice: 12_000 } },
        },
        expected: 12_000,
      },
      {
        quote_state: {
          motor: { model: "Mercury 90 FourStroke", price: 9_000 },
          finalPrice: 10_000,
          frozenPricing: { total: 11_000 },
        },
        expected: 11_000,
      },
      {
        quote_state: {
          motor: { model: "Mercury 90 FourStroke", price: 9_000 },
          finalPrice: 10_000,
        },
        expected: 10_000,
      },
      {
        quote_state: { motor: { model: "Mercury 90 FourStroke", price: 9_000 } },
        expected: 9_000,
      },
    ];

    for (const testCase of cases) {
      const resolved = resolveSavedQuoteEmail(
        row({ quote_state: testCase.quote_state }),
        REQUEST,
        new Date("2026-08-09T12:00:00.000Z"),
      );
      expect(resolved.finalPrice).toBe(testCase.expected);
      expect(resolved.priceLabel).toBe(testCase.expected === 9_000 ? "Motor price" : "Total");
    }
  });

  it("uses an honest name fallback and the supported legacy motor paths", () => {
    const resolved = resolveSavedQuoteEmail(
      row({ quote_state: { motorModel: "Mercury 60 FourStroke", motor: { price: 8_500 } } }),
      REQUEST,
      new Date("2026-08-09T12:00:00.000Z"),
    );

    expect(resolved.customerName).toBe("Valued Customer");
    expect(resolved.motorModel).toBe("Mercury 60 FourStroke");
  });

  it("fails closed for missing, mismatched, soft, expired, or malformed rows", async () => {
    await expect(authorizeSavedQuoteEmail(REQUEST, async () => null))
      .rejects.toBeInstanceOf(SavedQuoteEmailUnavailableError);

    const unavailableRows = [
      row({ resume_token: `${RESUME_TOKEN}x` }),
      row({ id: "223e4567-e89b-42d3-a456-426614174000" }),
      row({ is_soft_lead: true }),
      row({ expires_at: "2026-08-01T00:00:00.000Z" }),
      row({ quote_state: { motor: { model: "Mercury 90 FourStroke" } } }),
      row({ email: "not-an-email" }),
    ];

    for (const candidate of unavailableRows) {
      expect(() => resolveSavedQuoteEmail(
        candidate,
        REQUEST,
        new Date("2026-08-09T12:00:00.000Z"),
      )).toThrow(SavedQuoteEmailUnavailableError);
    }
  });

  it("allows no-origin internal calls only with the exact service credential", () => {
    const serviceKey = "service-role-test-key";
    expect(isAuthorizedServiceRequest(new Request("https://example.com", {
      headers: { authorization: `Bearer ${serviceKey}` },
    }), serviceKey)).toBe(true);
    expect(isAuthorizedServiceRequest(new Request("https://example.com", {
      headers: { authorization: "Bearer wrong-key" },
    }), serviceKey)).toBe(false);
    expect(isAuthorizedServiceRequest(new Request("https://example.com"), serviceKey)).toBe(false);
  });

  it("escapes the database-derived motor model in the email preheader", () => {
    const html = buildEmail({
      preheader: "Mercury <img src=x> & FourStroke",
      heading: "Saved quote",
      bodyHtml: "Safe body",
    });

    expect(html).toContain("Mercury &lt;img src=x&gt; &amp; FourStroke");
    expect(html).not.toContain("Mercury <img src=x>");
  });
});

describe("saved quote email caller and handler contracts", () => {
  it("keeps the public and OAuth callers on the id-plus-token contract", () => {
    const saveDialog = readFileSync(
      join(process.cwd(), "src/components/quote-builder/SaveQuoteDialog.tsx"),
      "utf8",
    );
    const oauthSave = readFileSync(
      join(process.cwd(), "src/hooks/useAutoSaveQuoteOnAuth.ts"),
      "utf8",
    );

    const saveStart = saveDialog.indexOf("functions.invoke('send-saved-quote-email'");
    const oauthStart = oauthSave.indexOf("functions.invoke('send-saved-quote-email'");
    const invocations = [
      saveDialog.slice(saveStart, saveDialog.indexOf("// Notify admin", saveStart)),
      oauthSave.slice(oauthStart, oauthSave.indexOf("}).catch", oauthStart)),
    ];

    for (const invocation of invocations) {
      expect(invocation).toContain("savedQuoteId:");
      expect(invocation).toContain("resumeToken");
      expect(invocation).not.toContain("customerEmail:");
      expect(invocation).not.toContain("motorModel:");
      expect(invocation).not.toContain("finalPrice:");
      expect(invocation).not.toContain("includeAccountInfo:");
    }

    expect(saveDialog).toContain("savedQuoteError || !savedQuote?.id");
    expect(saveDialog).toContain("throw savedQuoteError || new Error('Saved quote row was not returned')");
    expect(saveDialog).toContain("setSavedEmailSent(!emailError)");
    expect(saveDialog).toContain("confirmation email could not be sent");
  });

  it("requires a durable agent dual-write and checks the internal email response", () => {
    const agent = readFileSync(
      join(process.cwd(), "supabase/functions/agent-quote-api/index.ts"),
      "utf8",
    );

    expect(agent).toContain("if (savedQuoteError) throw savedQuoteError");
    expect(agent).toContain("body.send_customer_email !== false && savedQuoteReady");
    expect(agent).toContain("const savedResumeToken = generateResumeToken()");
    expect(agent).toContain("resume_token: savedResumeToken");
    expect(agent).toContain("resumeToken: savedResumeToken");
    expect(agent).not.toContain("resume_token: shareToken");
    expect(agent).toContain("if (!emailResponse.ok)");
    expect(agent).toContain("savedQuoteUpdates.email = updates.customer_email");
    expect(agent).toContain("if (syncError) throw syncError");
  });

  it("pins database-derived delivery and removes caller-controlled account claims", () => {
    const handler = readFileSync(
      join(process.cwd(), "supabase/functions/send-saved-quote-email/index.ts"),
      "utf8",
    );

    expect(handler).toContain('.eq("id", savedQuoteId)');
    expect(handler).toContain('.eq("resume_token", resumeToken)');
    expect(handler).toContain("to: [resolved.recipient]");
    expect(handler).toContain("resolved.quoteLink");
    expect(handler).not.toContain("includeAccountInfo");
    expect(handler).not.toContain("We also created a quick-access account");
  });
});
