/**
 * Deploy-time fail-closed check for the #332 Twilio callback pair.
 * Name presence only. Never prints secret values.
 */

export const TWILIO_WEBHOOK_DEPLOY_SLUGS = Object.freeze([
  'send-sms',
  'notification-webhook',
]);

export const TWILIO_WEBHOOK_URL_SECRET_NAME = 'TWILIO_WEBHOOK_URL';

const MISSING_LIST =
  'skipped: TWILIO_WEBHOOK_URL secret-name list is unreadable. ' +
  'send-sms and notification-webhook fail closed and were not deployed.';

const MISSING_NAME =
  'skipped: TWILIO_WEBHOOK_URL is missing. ' +
  'send-sms and notification-webhook fail closed and were not deployed. ' +
  'The tracking migration is already applied; this job does not apply SQL.';

export function isTwilioWebhookDeploySlug(slug) {
  return TWILIO_WEBHOOK_DEPLOY_SLUGS.includes(String(slug || ''));
}

export function parseEdgeSecretNames(value) {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  const text = String(value).trim();
  if (!text) return [];
  return text.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
}

export function twilioWebhookUrlPreflightReason(secretNames) {
  if (secretNames == null) return MISSING_LIST;
  if (!Array.isArray(secretNames)) return MISSING_LIST;
  if (!secretNames.includes(TWILIO_WEBHOOK_URL_SECRET_NAME)) return MISSING_NAME;
  return null;
}

export function applyTwilioWebhookUrlPreflight(preconditionSkipBySlug, selectedSlugs, secretNames) {
  const reason = twilioWebhookUrlPreflightReason(secretNames);
  if (!reason) return preconditionSkipBySlug;
  const map = preconditionSkipBySlug instanceof Map
    ? preconditionSkipBySlug
    : new Map(Object.entries(preconditionSkipBySlug || {}));
  for (const slug of selectedSlugs || []) {
    if (isTwilioWebhookDeploySlug(slug) && !map.get(slug)) {
      map.set(slug, reason);
    }
  }
  return map;
}
