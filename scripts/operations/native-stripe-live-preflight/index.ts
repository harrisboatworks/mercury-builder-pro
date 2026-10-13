import { createNativeStripeLivePreflight } from './handler.ts';
Deno.serve(createNativeStripeLivePreflight({
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'), SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'), STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET'),
  NATIVE_DEPOSIT_ENABLED: Deno.env.get('NATIVE_DEPOSIT_ENABLED'), NATIVE_PREFLIGHT_SPT_APPROVED: Deno.env.get('NATIVE_PREFLIGHT_SPT_APPROVED'),
}));
