import { gateTwilioStatusCallback } from "./twilio-signature.ts";

export const notificationWebhookCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-twilio-signature",
};

type NotificationWebhookDependencies = {
  authToken: string | null | undefined;
  configuredWebhookUrl: string | null | undefined;
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
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const gated = await gateTwilioStatusCallback(request, {
    authToken: dependencies.authToken,
    configuredWebhookUrl: dependencies.configuredWebhookUrl,
  });
  if (gated.ok === false) {
    return jsonResponse({ error: gated.error }, gated.status);
  }

  return dependencies.onVerified(gated.rawBody);
}
