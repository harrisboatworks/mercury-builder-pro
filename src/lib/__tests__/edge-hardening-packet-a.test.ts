import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { resolveAdminBrowserCors } from "../../../supabase/functions/_shared/admin-browser-cors.ts";
import {
  issueDropboxOAuthState,
  verifyDropboxOAuthState,
} from "../../../supabase/functions/_shared/dropbox-oauth-state.ts";
import {
  fetchAllowedQuotePdf,
  QuotePdfSecurityError,
  resolveAllowedQuotePdfUrl,
} from "../../../supabase/functions/_shared/quote-pdf-url.ts";
import {
  replaceTemplateVariables,
  sanitizeEmailSubject,
} from "../../../supabase/functions/_shared/quote-email-template.ts";
import {
  fetchAllowedDropboxFile,
  readLimitedDropboxFile,
  resolveAllowedDropboxFileUrl,
} from "../../../supabase/functions/_shared/dropbox-file-url.ts";
import { isDropboxAccessTokenFresh } from "../../../supabase/functions/_shared/dropbox-token.ts";

const read = (path: string) => readFileSync(path, "utf8");

describe("Packet A edge hardening", () => {
  it("reflects only an exact HBW browser origin for admin Dropbox CORS", () => {
    const allowed = resolveAdminBrowserCors(new Request("https://edge.example", {
      headers: { origin: "https://www.mercuryrepower.ca" },
    }));
    expect(allowed.origin).toBe("https://www.mercuryrepower.ca");
    expect(allowed.headers["Access-Control-Allow-Origin"]).toBe("https://www.mercuryrepower.ca");

    const denied = resolveAdminBrowserCors(new Request("https://edge.example", {
      headers: { origin: "https://mercury-builder-evil-hbw.vercel.app" },
    }));
    expect(denied.origin).toBeNull();
    expect(denied.headers).not.toHaveProperty("Access-Control-Allow-Origin");
  });

  it("binds Dropbox OAuth state to the admin, browser origin, redirect, and expiry", async () => {
    const expected = {
      sub: "admin-user",
      origin: "https://www.mercuryrepower.ca",
      redirectUri: "https://www.mercuryrepower.ca/admin/motor-images",
    };
    const state = await issueDropboxOAuthState(expected, "test-only-secret", 1_000_000);

    expect(await verifyDropboxOAuthState(state, expected, "test-only-secret", 1_001_000)).toMatchObject(expected);
    expect(await verifyDropboxOAuthState(state, { ...expected, sub: "other-user" }, "test-only-secret", 1_001_000)).toBeNull();
    expect(await verifyDropboxOAuthState(state, expected, "test-only-secret", 1_600_000)).toBeNull();
    expect(await verifyDropboxOAuthState(state, expected, "test-only-secret", 1_601_000)).toBeNull();
    expect(await verifyDropboxOAuthState(`${state}tampered`, expected, "test-only-secret", 1_001_000)).toBeNull();
    expect(state.length).toBeLessThan(500);
  });

  it.each([
    "https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/spec-sheets/id/quote.pdf",
    "https://www.mercuryrepower.ca/downloads/quote.pdf",
  ])("allows the exact legitimate quote PDF host %s", (url) => {
    expect(resolveAllowedQuotePdfUrl(url)?.toString()).toBe(url);
  });

  it.each([
    "https://example.com/x.pdf",
    "http://eutsoqdpjurknjsshxes.supabase.co/x.pdf",
    "https://eutsoqdpjurknjsshxes.supabase.co.evil.example/x.pdf",
    "https://www.mercuryrepower.ca@evil.example/x.pdf",
    "https://user:pass@www.mercuryrepower.ca/x.pdf",
    "https://www.mercuryrepower.ca:444/x.pdf",
    "https://localhost/x.pdf",
    "https://127.0.0.1/x.pdf",
    "https://[::1]/x.pdf",
    "https://169.254.169.254/latest/meta-data/",
    "https://www.mercuryrepower.ca/quote/saved/id",
    "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/quote.pdf",
  ])("rejects an unsafe quote PDF URL %s", (url) => {
    expect(resolveAllowedQuotePdfUrl(url)).toBeNull();
  });

  it("validates every PDF redirect before fetching the next hop", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: "https://169.254.169.254/latest/meta-data/" },
      }));

    await expect(fetchAllowedQuotePdf(
      "https://www.mercuryrepower.ca/quote.pdf",
      fetchImpl,
    )).rejects.toBeInstanceOf(QuotePdfSecurityError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("preserves an allowed redirect and returns its bytes", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: "https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/spec-sheets/q.pdf" },
      }))
      .mockResolvedValueOnce(new Response("%PDF-1.7\npdf-bytes", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }));

    const bytes = await fetchAllowedQuotePdf(
      "https://www.mercuryrepower.ca/quote.pdf",
      fetchImpl,
    );
    expect(new TextDecoder().decode(bytes)).toBe("%PDF-1.7\npdf-bytes");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("rejects non-PDF and oversized responses from an allowed quote host", async () => {
    const htmlFetch = vi.fn().mockResolvedValueOnce(new Response("<html>not a PDF</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    }));
    await expect(fetchAllowedQuotePdf(
      "https://www.mercuryrepower.ca/quote/saved/id",
      htmlFetch,
    )).rejects.toBeInstanceOf(QuotePdfSecurityError);

    const oversizedFetch = vi.fn().mockResolvedValueOnce(new Response("%PDF-", {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-length": String(5 * 1024 * 1024 + 1),
      },
    }));
    await expect(fetchAllowedQuotePdf(
      "https://www.mercuryrepower.ca/quote.pdf",
      oversizedFetch,
    )).rejects.toThrow("PDF response is too large");
  });

  it("validates every Dropbox file redirect before fetching the next hop", async () => {
    expect(resolveAllowedDropboxFileUrl("https://www.dropbox.com/s/id/file.jpg")).not.toBeNull();
    expect(resolveAllowedDropboxFileUrl("https://dropbox.com.evil.example/file.jpg")).toBeNull();
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, {
      status: 302,
      headers: { location: "https://169.254.169.254/latest/meta-data/" },
    }));
    await expect(fetchAllowedDropboxFile(
      "https://www.dropbox.com/s/id/file.jpg",
      fetchImpl,
    )).rejects.toThrow("Dropbox redirect target is not allowed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("bounds Dropbox file buffering even when content length is absent", async () => {
    await expect(readLimitedDropboxFile(new Response("123456789"), 8)).rejects.toThrow(
      "Dropbox file exceeds the import size limit",
    );
    await expect(readLimitedDropboxFile(new Response("12345678"), 8)).resolves.toHaveLength(8);
    await expect(readLimitedDropboxFile(new Response("", {
      headers: { "content-length": "9" },
    }), 8)).rejects.toThrow("Dropbox file exceeds the import size limit");
  });

  it("treats an expired Dropbox access token as disconnected", () => {
    expect(isDropboxAccessTokenFresh({
      access_token: "opaque-test-token",
      expires_at: "2026-08-14T00:00:00.000Z",
    }, Date.parse("2026-08-14T01:00:00.000Z"))).toBe(false);
    expect(isDropboxAccessTokenFresh({
      access_token: "opaque-test-token",
      expires_at: "2026-08-14T02:00:00.000Z",
    }, Date.parse("2026-08-14T01:00:00.000Z"))).toBe(true);
  });

  it("escapes every DB-template value and strips subject newlines", () => {
    const rendered = replaceTemplateVariables(
      "{{customerName}}|{{quoteNumber}}|{{motorModel}}|{{totalPrice}}",
      {
        customerName: '<img src=x onerror="alert(1)">',
        quoteNumber: "<&'\"",
        motorModel: "<script>x</script>",
        totalPrice: 1234,
      },
    );
    expect(rendered).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(rendered).toContain("&lt;&amp;&#39;&quot;");
    expect(rendered).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(rendered).not.toContain("<img");
    expect(sanitizeEmailSubject("Hello\r\nBcc: attacker@example.com")).toBe(
      "Hello Bcc: attacker@example.com",
    );
  });

  it("keeps Dropbox tokens server-side and gates every privileged Dropbox path", () => {
    const oauth = read("supabase/functions/dropbox-oauth/index.ts");
    const config = read("supabase/functions/get-dropbox-config/index.ts");
    const handler = read("supabase/functions/dropbox-file-handler/index.ts");
    const integration = read("src/components/admin/media/DropboxIntegration.tsx");
    const compact = read("src/components/admin/media/CompactDropboxImport.tsx");
    const app = read("src/App.tsx");
    const callbackPage = read("src/pages/AdminDropbox.tsx");
    const migration = read("supabase/migrations/20260831012948_store_dropbox_oauth_token_in_vault.sql");
    const adminQuoteSender = read("src/components/admin/SendQuoteEmail.tsx");

    for (const source of [oauth, config, handler]) {
      expect(source).toContain("requireAdmin(req, corsHeaders)");
      expect(source).not.toContain("'Access-Control-Allow-Origin': '*'");
    }
    expect(oauth.indexOf("requireAdmin(req, corsHeaders)")).toBeLessThan(oauth.indexOf("api.dropboxapi.com/oauth2/token"));
    expect(handler.indexOf("requireAdmin(req, corsHeaders)")).toBeLessThan(handler.indexOf("await req.json()"));
    expect(oauth).toContain("JSON.stringify({ ok: true, connected: true, expiresAt })");
    expect(integration).not.toContain("setAccessToken");
    expect(integration).not.toMatch(/accessToken\s*:/);
    expect(compact).not.toContain("setAccessToken");
    expect(compact).not.toMatch(/accessToken\s*:/);
    expect(config).toContain('token_access_type: "offline"');
    expect(config).toContain('scope: "sharing.read"');
    expect(config).not.toContain("state,\n        redirectUri");
    expect(handler).toContain("fetchAllowedDropboxFile(fileUrl)");
    expect(handler).toContain("readLimitedDropboxFile");
    expect(handler).toContain("/2/sharing/get_shared_link_file");
    expect(handler).toContain("JSON.stringify({ url: fileUrl })");
    expect(handler).not.toContain("/2/files/download");
    expect(handler).not.toContain("pathMatch");
    expect(integration).toContain("callbackUrl.searchParams.delete('code')");
    expect(integration).toContain("motorId: motorId.trim() || null");
    expect(app).toContain('path="/admin/motor-images"');
    expect(app).toContain("<AdminDropbox />");
    expect(callbackPage).toContain("<DropboxIntegration />");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(adminQuoteSender).not.toContain("pdfUrl:");
    expect(adminQuoteSender).not.toContain("SITE_URL");
  });

  it("requires admin auth for quote-note writes and targets the quote id", () => {
    const source = read("supabase/functions/send-quote-email/index.ts");
    const noteWrite = source.indexOf(".from('customer_quotes')");
    const adminGuard = source.lastIndexOf("requireAdmin(req, corsHeaders)", noteWrite);

    expect(adminGuard).toBeGreaterThan(-1);
    expect(adminGuard).toBeLessThan(noteWrite);
    expect(source).toContain("emailData.leadData?.quoteId");
    expect(source).toContain(".eq('id', emailData.leadData.quoteId)");
    expect(source).not.toContain(".eq('quote_number', emailData.quoteNumber)");
    expect(source.indexOf("quotePdfBuffer = await fetchAllowedQuotePdf(emailData.pdfUrl)")).toBeLessThan(
      source.indexOf("Try to get template from database first"),
    );
    expect(source).toContain("emailData = { ...emailData, pdfUrl: undefined }");
  });
});
