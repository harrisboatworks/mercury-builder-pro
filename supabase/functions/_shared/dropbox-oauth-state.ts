export interface DropboxOAuthStatePayload {
  v: 1;
  sub: string;
  origin: string;
  redirectUri: string;
  exp: number;
  nonce: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0)).buffer;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function issueDropboxOAuthState(
  input: Omit<DropboxOAuthStatePayload, "v" | "exp" | "nonce">,
  secret: string,
  nowMs = Date.now(),
): Promise<string> {
  const payload: DropboxOAuthStatePayload = {
    v: 1,
    ...input,
    exp: Math.floor(nowMs / 1000) + 10 * 60,
    nonce: crypto.randomUUID(),
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(encodedPayload)),
  );
  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export async function verifyDropboxOAuthState(
  state: string,
  expected: Pick<DropboxOAuthStatePayload, "sub" | "origin" | "redirectUri">,
  secret: string,
  nowMs = Date.now(),
): Promise<DropboxOAuthStatePayload | null> {
  try {
    const [encodedPayload, encodedSignature, extra] = state.split(".");
    if (!encodedPayload || !encodedSignature || extra) return null;

    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!validSignature) return null;

    const payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload))) as DropboxOAuthStatePayload;
    if (
      payload.v !== 1
      || !payload.nonce
      || payload.exp < Math.floor(nowMs / 1000)
      || payload.sub !== expected.sub
      || payload.origin !== expected.origin
      || payload.redirectUri !== expected.redirectUri
    ) return null;

    return payload;
  } catch {
    return null;
  }
}
