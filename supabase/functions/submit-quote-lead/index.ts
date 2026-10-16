// Submit-quote-lead entry point. The handler lives in handler.ts; this file
// only wires the Deno runtime dependencies.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.22.4";
import { checkRateLimit, rateLimitedResponse, getClientIdentifier } from "../_shared/rate-limit.ts";
import { forbiddenOriginResponse, isAllowedOrigin } from "../_shared/origin-check.ts";
import { createSubmitQuoteLeadHandler } from "./handler.ts";

serve(createSubmitQuoteLeadHandler({
  z,
  isAllowedOrigin,
  forbiddenOriginResponse,
  createClient,
  Resend,
  checkRateLimit,
  rateLimitedResponse,
  getClientIdentifier,
  getEnv: (name) => Deno.env.get(name),
}));
