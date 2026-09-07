const encoder = new TextEncoder();

const AUTH_SCHEME = 'Bearer ';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTIFICATION_TYPES = new Set(['info', 'success', 'warning', 'error']);
const FORBIDDEN_METADATA_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export const NOTIFICATION_LIMITS = {
  titleCharacters: 160,
  messageCharacters: 2_000,
  metadataBytes: 4_096,
  metadataKeys: 25,
  metadataKeyCharacters: 80,
} as const;

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationPayload {
  user_id: string;
  title?: string;
  message: string;
  type: NotificationType;
  metadata: Record<string, unknown>;
}

export type NotificationPayloadResult =
  | { ok: true; value: NotificationPayload }
  | { ok: false; error: string };

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const digest = async (value: string): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));

/** Compares fixed-length digests so token contents are never short-circuited. */
export const constantTimeTokenEqual = async (
  supplied: string,
  expected: string,
): Promise<boolean> => {
  const [suppliedDigest, expectedDigest] = await Promise.all([
    digest(supplied),
    digest(expected),
  ]);

  let mismatch = supplied.length ^ expected.length;
  for (let index = 0; index < expectedDigest.length; index += 1) {
    mismatch |= suppliedDigest[index] ^ expectedDigest[index];
  }

  return mismatch === 0;
};

export const hasServiceRoleAuthorization = async (
  request: Request,
  serviceRoleKey: string | undefined,
): Promise<boolean> => {
  const authorization = request.headers.get('Authorization') ?? '';
  const supplied = authorization.startsWith(AUTH_SCHEME)
    ? authorization.slice(AUTH_SCHEME.length)
    : '';
  const expected = serviceRoleKey ?? '';

  // Always perform the digest comparison, including when configuration is missing.
  const matches = await constantTimeTokenEqual(supplied, expected);
  return supplied.length > 0 && expected.length > 0 && matches;
};

/**
 * Enforces the trusted-server boundary before the request handler can parse a
 * body, create a service-role database client, or trigger a downstream send.
 */
export const handleServiceRoleRequest = async (
  request: Request,
  serviceRoleKey: string | undefined,
  handleAuthorizedRequest: () => Promise<Response>,
): Promise<Response> => {
  if (!(await hasServiceRoleAuthorization(request, serviceRoleKey))) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  return handleAuthorizedRequest();
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const validateMetadata = (value: unknown): value is Record<string, unknown> => {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value);
  if (keys.length > NOTIFICATION_LIMITS.metadataKeys) return false;
  if (keys.some((key) => (
    key.length === 0 ||
    key.length > NOTIFICATION_LIMITS.metadataKeyCharacters ||
    FORBIDDEN_METADATA_KEYS.has(key)
  ))) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    return encoder.encode(serialized).byteLength <= NOTIFICATION_LIMITS.metadataBytes;
  } catch {
    return false;
  }
};

export const validateNotificationPayload = (
  input: unknown,
): NotificationPayloadResult => {
  if (!isPlainObject(input)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const userId = input.user_id;
  if (typeof userId !== 'string' || !UUID_PATTERN.test(userId)) {
    return { ok: false, error: 'user_id must be a valid UUID' };
  }

  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (message.length === 0 || message.length > NOTIFICATION_LIMITS.messageCharacters) {
    return {
      ok: false,
      error: `message must be between 1 and ${NOTIFICATION_LIMITS.messageCharacters} characters`,
    };
  }

  let title: string | undefined;
  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      return { ok: false, error: 'title must be a string' };
    }

    title = input.title.trim();
    if (title.length === 0 || title.length > NOTIFICATION_LIMITS.titleCharacters) {
      return {
        ok: false,
        error: `title must be between 1 and ${NOTIFICATION_LIMITS.titleCharacters} characters`,
      };
    }
  }

  const type = input.type ?? 'info';
  if (typeof type !== 'string' || !NOTIFICATION_TYPES.has(type)) {
    return { ok: false, error: 'type must be info, success, warning, or error' };
  }

  const metadata = input.metadata ?? {};
  if (!validateMetadata(metadata)) {
    return { ok: false, error: 'metadata must be a bounded JSON object' };
  }

  return {
    ok: true,
    value: {
      user_id: userId,
      title,
      message,
      type: type as NotificationType,
      metadata,
    },
  };
};
