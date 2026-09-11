import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

function expectBefore(source: string, earlier: string, later: string) {
  const a = source.indexOf(earlier);
  const b = source.indexOf(later);
  expect(a, earlier).toBeGreaterThan(-1);
  expect(b, later).toBeGreaterThan(-1);
  expect(a).toBeLessThan(b);
}

const VOICE_FUNCTIONS = [
  {
    path: "supabase/functions/voice-send-follow-up/index.ts",
    action: "voice_send_follow_up",
    expensive: "api.twilio.com",
  },
  {
    path: "supabase/functions/voice-schedule-callback/index.ts",
    action: "voice_schedule_callback",
    expensive: ".from('voice_callbacks')",
  },
  {
    path: "supabase/functions/voice-create-reminder/index.ts",
    action: "voice_create_reminder",
    expensive: ".from('voice_reminders')",
  },
] as const;

describe("anonymous edge origin and rate-limit ordering", () => {
  it.each(VOICE_FUNCTIONS)(
    "gates $action with origin-or-service-role and fail-closed limit before side effects",
    ({ path, action, expensive }) => {
      const source = read(path);
      expectBefore(source, "isAllowedOrigin(req)", expensive);
      expectBefore(source, "isServiceRoleBearer(req)", expensive);
      expectBefore(source, `action: "${action}"`, expensive);
      expectBefore(source, "failClosed: true", expensive);
      expect(source).toContain('identifier: "service_role"');
      expect(source).not.toContain("requireAdmin");
    },
  );

  it("keeps the MCP voice writes on a service-role bearer and no Origin", () => {
    const mcp = read("supabase/functions/elevenlabs-mcp-server/index.ts");
    expect(mcp).toContain("/functions/v1/voice-schedule-callback");
    expect(mcp).toContain("/functions/v1/voice-create-reminder");
    expect(mcp).toContain("/functions/v1/voice-send-follow-up");
    expect(mcp).toContain('"Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`');
    expect(mcp).not.toContain('"Origin":');
  });

  it("rate-limits financing confirmation before the service-role select", () => {
    const source = read("supabase/functions/send-financing-confirmation-email/index.ts");
    expectBefore(source, "isAllowedOrigin(req)", ".from('financing_applications')");
    expectBefore(source, "action: 'confirmation_email_send'", ".from('financing_applications')");
    expectBefore(source, "failClosed: true", ".from('financing_applications')");
    expectBefore(source, "identifier: validationResult.data.applicantEmail", ".from('financing_applications')");
    expect(source).not.toContain("requireAdmin");
    expect(source).not.toContain("/rest/v1/rpc/check_rate_limit");
  });

  it("rate-limits the repower guide before insert and Resend", () => {
    const source = read("supabase/functions/send-repower-guide-email/index.ts");
    expectBefore(source, "isAllowedOrigin(req)", '.from("customer_quotes")');
    expectBefore(source, "failClosed: true", '.from("customer_quotes")');
    expectBefore(source, "failClosed: true", "resend.emails.send");
    expect(source).toContain('action: "send_repower_guide_email"');
    expect(source).not.toContain("requireAdmin");
  });

  it("rate-limits walkaround subscribe before Mailchimp and keeps the apikey caller", () => {
    const source = read("supabase/functions/subscribe-walkaround/index.ts");
    const caller = read("src/components/blog/WalkaroundLeadCapture.tsx");
    expectBefore(source, "isAllowedOrigin(req)", "api.mailchimp.com");
    expectBefore(source, "failClosed: true", "api.mailchimp.com");
    expect(source).toContain('action: "subscribe_walkaround"');
    expect(source).not.toContain("requireAdmin");
    expect(caller).toContain("apikey: SUPABASE_PUBLISHABLE_KEY");
    expect(caller).toContain("Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`");
  });

  it("applies voice_token before warmup and knowledge-probe branches", () => {
    const source = read("supabase/functions/elevenlabs-conversation-token/index.ts");
    expectBefore(source, "action: 'voice_token'", "body?.warmup === true");
    expectBefore(source, "action: 'voice_token'", "body?.knowledgeProbe === true");
    expectBefore(source, "action: 'voice_token'", "api.elevenlabs.io");
    const tokenBlock = source.slice(
      source.indexOf("action: 'voice_token'"),
      source.indexOf("body?.warmup === true"),
    );
    expect(tokenBlock).not.toContain("failClosed");
  });

  it("rate-limits google-places before cache select and keeps upstream after a miss", () => {
    const source = read("supabase/functions/google-places/index.ts");
    expectBefore(source, "action: 'google_places',", ".from('google_places_cache')");
    expectBefore(source, "action: 'google_places',", "action: 'google_places_upstream'");
    expectBefore(source, ".from('google_places_cache')", "action: 'google_places_upstream'");
    expectBefore(source, "action: 'google_places_upstream'", "places.googleapis.com");
    const cacheBlock = source.slice(
      source.indexOf("action: 'google_places',"),
      source.indexOf("action: 'google_places_upstream'"),
    );
    expect(cacheBlock).not.toContain("failClosed");
  });

  it("does not flip verify_jwt on the gated customer functions", () => {
    const config = read("supabase/config.toml");
    for (const name of [
      "voice-send-follow-up",
      "voice-schedule-callback",
      "voice-create-reminder",
      "send-financing-confirmation-email",
      "send-repower-guide-email",
      "subscribe-walkaround",
      "elevenlabs-conversation-token",
      "google-places",
    ]) {
      expect(config).toContain(`[functions.${name}]\nverify_jwt = false`);
    }
  });
});
