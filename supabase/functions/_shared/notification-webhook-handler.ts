import {
  decideNotificationWebhook,
  resolveInboundTwilioWebhookUrl,
  TwilioWebhookConfigurationError,
  TwilioWebhookRequestError,
} from './twilio-signature.ts';
import {
  isTwilioMessageStatus,
  type TwilioStatusApplyResult,
  type TwilioStatusEvent,
} from './twilio-status.ts';

const MAX_WEBHOOK_BODY_BYTES = 16 * 1024;

export const notificationWebhookCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

type NotificationWebhookDependencies = {
  authToken: string | null | undefined;
  configuredWebhookUrl: string | null | undefined;
  applyStatus: (event: TwilioStatusEvent) => Promise<TwilioStatusApplyResult>;
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...notificationWebhookCorsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export async function handleNotificationWebhook(
  request: Request,
  dependencies: NotificationWebhookDependencies,
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: notificationWebhookCorsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let resolvedUrl;
  try {
    resolvedUrl = resolveInboundTwilioWebhookUrl(
      dependencies.configuredWebhookUrl,
      request.url,
    );
  } catch (error) {
    if (error instanceof TwilioWebhookConfigurationError) {
      return jsonResponse({ error: error.message }, 503);
    }
    if (error instanceof TwilioWebhookRequestError) {
      return jsonResponse({ error: error.message }, 400);
    }
    return jsonResponse({ error: 'Invalid webhook URL' }, 400);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: 'Webhook body too large' }, 413);
  }

  const decision = await decideNotificationWebhook({
    signature: request.headers.get('X-Twilio-Signature'),
    rawBody,
    authToken: dependencies.authToken,
    webhookUrl: resolvedUrl.signedUrl,
  });
  if (!decision.ok) {
    return jsonResponse({ error: decision.error }, decision.status);
  }
  if (!isTwilioMessageStatus(decision.messageStatus)) {
    return jsonResponse({ error: 'Invalid MessageStatus' }, 400);
  }

  const result = await dependencies.applyStatus({
    smsLogId: resolvedUrl.smsLogId,
    messageSid: decision.messageSid,
    messageStatus: decision.messageStatus,
    errorCode: decision.errorCode,
    errorMessage: decision.errorMessage,
  });

  if (result.kind === 'not_found') {
    // Do not acknowledge a callback that did not reach durable storage: Twilio
    // can retry a 5xx response after the correlated outbox row is available.
    return jsonResponse({ error: 'SMS log not found' }, 503);
  }
  if (result.kind === 'sid_conflict') {
    return jsonResponse({ error: 'MessageSid conflict' }, 409);
  }
  return jsonResponse(
    {
      success: true,
      applied: result.kind === 'applied',
      messageSid: decision.messageSid,
    },
    200,
  );
}
