import { gateTwilioStatusCallback } from "./twilio-signature.ts";

export const notificationWebhookCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type NotificationWebhookDependencies = {
  authToken: string | null | undefined;
  supabaseUrl: string | null | undefined;
  onVerified: (rawBody: string) => Promise<Response>;
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: notificationWebhookCorsHeaders,
  });
}

export async function handleNotificationWebhook(
  request: Request,
  dependencies: NotificationWebhookDependencies,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: notificationWebhookCorsHeaders });
  }

  const gated = await gateTwilioStatusCallback(request, {
    authToken: dependencies.authToken,
    supabaseUrl: dependencies.supabaseUrl,
  });
  if (gated.ok === false) {
    return jsonResponse({ error: gated.error }, gated.status);
  }

  return dependencies.onVerified(gated.rawBody);
}
