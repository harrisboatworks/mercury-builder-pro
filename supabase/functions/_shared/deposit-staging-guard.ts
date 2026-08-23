import { GROK_BOT_AGENTMAIL } from "./grok-email-routing.ts";
import { HBW_OPERATIONS_EMAIL, hbwDepositRecipients } from "./deposit-email-deliveries.ts";

export const DEPOSIT_STAGING_MODE_KEY = "DEPOSIT_STAGING_MODE";
export const DEPOSIT_STAGING_CUSTOMER_EMAIL_KEY = "DEPOSIT_STAGING_CUSTOMER_EMAIL";
export const DEPOSIT_STAGING_HBW_EMAIL_KEY = "DEPOSIT_STAGING_HBW_EMAIL";
export const DEPOSIT_STAGING_GROK_EMAIL_KEY = "DEPOSIT_STAGING_GROK_EMAIL";

export const PRODUCTION_SUPABASE_HOSTS = [
  "eutsoqdpjurknjsshxes.supabase.co",
] as const;

export const PRODUCTION_WEB_HOSTS = [
  "www.mercuryrepower.ca",
  "mercuryrepower.ca",
  "quote.harrisboatworks.ca",
  "www.mercuryquote.ca",
  "mercuryquote.ca",
  "mercury-builder-pro.vercel.app",
  "mercury-builder-pro-hbw.vercel.app",
  "mercury-builder-pro-git-main-hbw.vercel.app",
] as const;

export const PRODUCTION_DEPOSIT_RECIPIENTS = [
  HBW_OPERATIONS_EMAIL,
  "jayharris97@gmail.com",
  "harrisboatworks@hotmail.com",
  GROK_BOT_AGENTMAIL,
  "grokbot@mercuryrepower.ca",
] as const;

export const STAGING_RECIPIENT_DOMAIN = "example.invalid";

export const STAGING_ENV_NAMES = [
  "STAGING_SUPABASE_URL",
  "STAGING_SUPABASE_ANON_KEY",
  "STAGING_SUPABASE_SERVICE_ROLE_KEY",
  "STAGING_STRIPE_SECRET_KEY",
  "STAGING_STRIPE_WEBHOOK_SECRET",
  "STAGING_RESEND_API_KEY",
  "STAGING_ADMIN_ACCESS_TOKEN",
  "STAGING_DATABASE_URL",
  "VERCEL_PREVIEW_URL",
  DEPOSIT_STAGING_MODE_KEY,
  DEPOSIT_STAGING_CUSTOMER_EMAIL_KEY,
  DEPOSIT_STAGING_HBW_EMAIL_KEY,
  DEPOSIT_STAGING_GROK_EMAIL_KEY,
] as const;

export type StagingEnv = Record<string, string | undefined>;

export type StagingCheck = {
  id: string;
  result: "PASS" | "FAIL";
  detail: string;
};

function read(env: StagingEnv, name: string): string {
  return typeof env[name] === "string" ? env[name]!.trim() : "";
}

export function depositStagingModeEnabled(env: StagingEnv): boolean {
  return read(env, DEPOSIT_STAGING_MODE_KEY) === "1";
}

export function isReservedInvalidEmail(value: string): boolean {
  return /^[a-z0-9._%+-]+@example\.invalid$/i.test(value.trim());
}

export function hostFromUrl(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isProductionSupabaseUrl(value: string): boolean {
  const host = hostFromUrl(value);
  return (PRODUCTION_SUPABASE_HOSTS as readonly string[]).includes(host);
}

export function isProductionWebUrl(value: string): boolean {
  const host = hostFromUrl(value);
  return (PRODUCTION_WEB_HOSTS as readonly string[]).includes(host);
}

export function isProductionDatabaseTarget(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return (PRODUCTION_SUPABASE_HOSTS as readonly string[]).some((host) => (
    normalized.includes(host) || normalized.includes(host.split(".")[0])
  ));
}

export function stripeSecretKind(value: string): "test" | "live" | "missing" | "other" {
  if (!value) return "missing";
  if (value.startsWith(["sk", "test"].join("_") + "_")) return "test";
  if (value.startsWith(["sk", "live"].join("_") + "_")) return "live";
  if (value.startsWith(["rk", "live"].join("_") + "_")) return "live";
  return "other";
}

export function isBlockedRecipient(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (PRODUCTION_DEPOSIT_RECIPIENTS as readonly string[]).includes(normalized);
}

export function resolveDepositAudienceRecipients(options: {
  customerEmail: string;
  adminEmails: string[];
  grokEmail: string;
  env?: StagingEnv;
}): {
  customer: string[];
  hbw: string[];
  grok_bot: string[];
  replyTo: string;
  staging: boolean;
} {
  const env = options.env || {};
  if (!depositStagingModeEnabled(env)) {
    return {
      customer: [options.customerEmail],
      hbw: hbwDepositRecipients(options.adminEmails),
      grok_bot: [options.grokEmail],
      replyTo: HBW_OPERATIONS_EMAIL,
      staging: false,
    };
  }

  const customer = read(env, DEPOSIT_STAGING_CUSTOMER_EMAIL_KEY);
  const hbw = read(env, DEPOSIT_STAGING_HBW_EMAIL_KEY);
  const grok = read(env, DEPOSIT_STAGING_GROK_EMAIL_KEY);
  if (!customer || !hbw || !grok) {
    throw new Error("Incomplete deposit staging recipient override");
  }
  if (![customer, hbw, grok].every(isReservedInvalidEmail)) {
    throw new Error("Deposit staging recipients must use the example.invalid domain");
  }
  if ([customer, hbw, grok].some(isBlockedRecipient)) {
    throw new Error("Deposit staging recipients include a production inbox");
  }

  return {
    customer: [customer],
    hbw: [hbw],
    grok_bot: [grok],
    replyTo: hbw,
    staging: true,
  };
}

export function assessInheritedNameCollision(inherited: StagingEnv): StagingCheck {
  const inheritedSupabase = read(inherited, "SUPABASE_URL");
  const inheritedStripe = read(inherited, "STRIPE_SECRET_KEY");
  const collided = Boolean(inheritedSupabase || inheritedStripe);
  return {
    id: "no_inherited_production_names",
    result: collided ? "FAIL" : "PASS",
    detail: collided
      ? "process env defines SUPABASE_URL or STRIPE_SECRET_KEY; refuse rather than guess"
      : "no inherited SUPABASE_URL/STRIPE_SECRET_KEY names",
  };
}

export function assessStagingSafety(
  env: StagingEnv,
  inherited: StagingEnv = {},
): {
  ok: boolean;
  checks: StagingCheck[];
  stripeKeyKind: ReturnType<typeof stripeSecretKind>;
  supabaseHostClass: "production" | "missing" | "other";
} {
  const checks: StagingCheck[] = [];
  const add = (id: string, pass: boolean, detail: string) => {
    checks.push({ id, result: pass ? "PASS" : "FAIL", detail });
  };

  const supabaseUrl = read(env, "STAGING_SUPABASE_URL");
  const stripeKey = read(env, "STAGING_STRIPE_SECRET_KEY");
  const previewUrl = read(env, "VERCEL_PREVIEW_URL");
  const databaseUrl = read(env, "STAGING_DATABASE_URL");
  const customer = read(env, DEPOSIT_STAGING_CUSTOMER_EMAIL_KEY);
  const hbw = read(env, DEPOSIT_STAGING_HBW_EMAIL_KEY);
  const grok = read(env, DEPOSIT_STAGING_GROK_EMAIL_KEY);
  const mode = read(env, DEPOSIT_STAGING_MODE_KEY);
  const stripeKeyKind = stripeSecretKind(stripeKey);
  const supabaseHost = hostFromUrl(supabaseUrl);
  const supabaseHostClass = !supabaseUrl
    ? "missing"
    : isProductionSupabaseUrl(supabaseUrl)
      ? "production"
      : "other";

  add(
    "supabase_url_not_production",
    Boolean(supabaseUrl) && !isProductionSupabaseUrl(supabaseUrl),
    supabaseUrl ? "STAGING_SUPABASE_URL host class recorded without value" : "STAGING_SUPABASE_URL missing",
  );
  add(
    "supabase_url_is_https",
    Boolean(supabaseUrl) && supabaseUrl.startsWith("https://") && Boolean(supabaseHost),
    "isolated project URL must be https",
  );
  add(
    "stripe_key_is_test",
    stripeKeyKind === "test",
    `STAGING_STRIPE_SECRET_KEY kind=${stripeKeyKind}`,
  );
  add(
    "stripe_key_not_live",
    stripeKeyKind !== "live",
    "live Stripe secrets are rejected",
  );
  add(
    "staging_mode_required",
    mode === "1",
    "DEPOSIT_STAGING_MODE must be 1 on the isolated project and in the runner env",
  );
  add(
    "recipients_are_example_invalid",
    [customer, hbw, grok].every(isReservedInvalidEmail),
    "customer/hbw/grok overrides must be @example.invalid",
  );
  add(
    "recipients_not_production",
    ![customer, hbw, grok].some(isBlockedRecipient),
    "production inboxes are rejected",
  );
  add(
    "preview_not_production",
    !previewUrl || !isProductionWebUrl(previewUrl),
    previewUrl ? "VERCEL_PREVIEW_URL host class recorded without value" : "VERCEL_PREVIEW_URL omitted",
  );
  add(
    "database_url_not_production",
    !databaseUrl || !isProductionDatabaseTarget(databaseUrl),
    databaseUrl ? "STAGING_DATABASE_URL host class recorded without value" : "STAGING_DATABASE_URL omitted",
  );
  checks.push(assessInheritedNameCollision(inherited));

  return {
    ok: checks.every((check) => check.result === "PASS"),
    checks,
    stripeKeyKind,
    supabaseHostClass,
  };
}

export function assertStagingSafety(env: StagingEnv, inherited: StagingEnv = {}): void {
  const assessment = assessStagingSafety(env, inherited);
  if (!assessment.ok) {
    const failed = assessment.checks
      .filter((check) => check.result === "FAIL")
      .map((check) => check.id);
    throw new Error(`Unsafe staging configuration: ${failed.join(",")}`);
  }
}
