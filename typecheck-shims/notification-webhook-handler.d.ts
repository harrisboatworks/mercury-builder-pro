/** Typecheck-only. Vitest loads the real Deno module via package.json#imports. */
export const notificationWebhookCorsHeaders: {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Headers": string;
};

export function handleNotificationWebhook(
  request: Request,
  dependencies: {
    authToken: string | null | undefined;
    supabaseUrl: string | null | undefined;
    onVerified: (rawBody: string) => Promise<Response>;
  },
): Promise<Response>;
