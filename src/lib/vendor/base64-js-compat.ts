function normalizeBase64(value: string): string {
  const cleaned = value.replace(/[\n\r\t\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const remainder = cleaned.length % 4;
  return remainder === 0 ? cleaned : `${cleaned}${'='.repeat(4 - remainder)}`;
}

export function toByteArray(value: string): Uint8Array {
  const normalized = normalizeBase64(value);

  if (typeof atob === 'function') {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  return Uint8Array.from(Buffer.from(normalized, 'base64'));
}

export function fromByteArray(value: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < value.length; i += chunkSize) {
      const chunk = value.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  return Buffer.from(value).toString('base64');
}

export function byteLength(value: string): number {
  return toByteArray(value).byteLength;
}

export default {
  byteLength,
  toByteArray,
  fromByteArray,
};
