// SIN Encryption Utility using Supabase pgsodium
// ✅ PRODUCTION READY: Uses AES-256 deterministic encryption
import { supabase } from '@/integrations/supabase/client';

/**
 * Encrypts a Social Insurance Number using Supabase pgsodium
 * Uses AES-256 deterministic encryption stored in Supabase Vault
 * @param sin - The plaintext SIN to encrypt (format: XXX-XXX-XXX)
 * @returns Base64 encoded encrypted string
 */
export async function encryptSIN(sin: string): Promise<string> {
  if (!sin || sin.trim() === '') {
    const err = new Error('SIN cannot be empty') as SinEncryptionError;
    err.name = 'SinEncryptionError';
    err.code = 'invalid_format';
    throw err;
  }

  // Remove any formatting (hyphens, spaces)
  const cleanSIN = sin.replace(/[-\s]/g, '');

  // Validate SIN format (9 digits)
  if (!/^\d{9}$/.test(cleanSIN)) {
    const err = new Error('Invalid SIN format. Must be 9 digits.') as SinEncryptionError;
    err.name = 'SinEncryptionError';
    err.code = 'invalid_format';
    throw err;
  }

  // Call the database function to encrypt
  let data: string | null = null;
  let error: any = null;
  try {
    const res = await supabase.rpc('encrypt_sin', { sin_plaintext: cleanSIN });
    data = res.data as string | null;
    error = res.error;
  } catch (networkErr: any) {
    const err = new Error(networkErr?.message || 'Network error contacting encryption service') as SinEncryptionError;
    err.name = 'SinEncryptionError';
    err.code = 'network_error';
    err.details = networkErr?.name;
    throw err;
  }

  if (error) {
    console.error('❌ SIN encryption failed:', error);
    const err = new Error(error.message || 'Failed to encrypt SIN') as SinEncryptionError;
    err.name = 'SinEncryptionError';
    err.code = (error as any).code || 'rpc_error';
    err.pgCode = (error as any).code;
    err.details = (error as any).details;
    err.hint = (error as any).hint;
    // Map common Postgres / network errors to friendly codes
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('permission denied') || (error as any).code === '42501') {
      err.code = 'permission_denied';
    } else if (msg.includes('does not exist') || (error as any).code === '42883') {
      err.code = 'function_missing';
    } else if (msg.includes('rate limit') || (error as any).status === 429) {
      err.code = 'rate_limited';
    } else if (msg.includes('timeout') || msg.includes('timed out')) {
      err.code = 'timeout';
    } else if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
      err.code = 'network_error';
    }
    throw err;
  }

  if (!data) {
    const err = new Error('Encryption returned no data') as SinEncryptionError;
    err.name = 'SinEncryptionError';
    err.code = 'empty_response';
    throw err;
  }

  console.log('✅ SIN encrypted successfully (pgsodium AES-256)');
  return data;
}

export interface SinEncryptionError extends Error {
  code: string;
  pgCode?: string;
  details?: string;
  hint?: string;
}

// Known SinEncryptionError codes. Keep in sync with encryptSIN() error mapping.
export type SinErrorCode =
  | 'permission_denied'
  | 'function_missing'
  | 'empty_response'
  | 'rpc_error'
  | 'invalid_format'
  | 'network_error'
  | 'rate_limited'
  | 'timeout'
  | 'unknown';

const DEALER_PHONE = '(905) 342-2153';

/**
 * Maps a SinEncryptionError code to user-facing copy.
 *
 * Never echoes raw error.message, pgCode, hint, or details — those are
 * sensitive infrastructure detail and belong only in the admin telemetry log.
 *
 * The optional correlationId is appended verbatim so the customer can read
 * it back to support; it carries no PII on its own.
 */
export function getFriendlySinErrorMessage(
  code: string | undefined,
  correlationId?: string,
): { title: string; description: string } {
  const ref = correlationId ? ` Reference: ${correlationId}.` : '';
  const callUs = `Please call us at ${DEALER_PHONE} for help.`;
  const tryAgain = `Please try again in a few minutes, or call us at ${DEALER_PHONE}.`;

  switch (code as SinErrorCode | undefined) {
    case 'permission_denied':
      return {
        title: 'Secure submission temporarily unavailable',
        description: `Your account does not currently have permission to encrypt your SIN. Our team has been notified and is restoring access. ${tryAgain}${ref}`,
      };
    case 'function_missing':
      return {
        title: 'Submission service offline',
        description: `Our secure encryption service is temporarily unavailable. Our team has been notified. ${tryAgain}${ref}`,
      };
    case 'empty_response':
      return {
        title: 'Encryption did not complete',
        description: `Your SIN was sent for encryption but no result came back. ${tryAgain}${ref}`,
      };
    case 'invalid_format':
      return {
        title: 'Invalid SIN format',
        description: `Please re-enter your SIN as 9 digits (format XXX-XXX-XXX) and try again.${ref}`,
      };
    case 'network_error':
      return {
        title: 'Network connection lost',
        description: `We could not reach our secure encryption service. Check your internet connection and try again.${ref}`,
      };
    case 'rate_limited':
      return {
        title: 'Too many attempts',
        description: `For your security we have paused submissions briefly. Please wait a minute and try again.${ref}`,
      };
    case 'timeout':
      return {
        title: 'Submission timed out',
        description: `The secure encryption service took too long to respond. ${tryAgain}${ref}`,
      };
    case 'rpc_error':
    case 'unknown':
    default:
      return {
        title: 'Could not securely save your SIN',
        description: `Something went wrong encrypting your SIN. ${callUs}${ref}`,
      };
  }
}

/**
 * Generates a short, human-readable correlation ID for tracing a single
 * financing submission across logs, toasts, and admin tooling.
 * Format: FIN-YYYYMMDD-XXXXXX (no PII).
 */
export function generateSubmissionCorrelationId(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FIN-${ymd}-${rand}`;
}

/**
 * Decrypts a Social Insurance Number (admin only)
 * Only users with admin role can decrypt SIN data
 * @param encryptedSIN - The base64 encoded encrypted SIN
 * @returns The plaintext SIN (format: XXX-XXX-XXX)
 */
export async function decryptSIN(encryptedSIN: string): Promise<string> {
  if (!encryptedSIN || encryptedSIN.trim() === '') {
    throw new Error('Encrypted SIN cannot be empty');
  }
  
  try {
    // Call the database function to decrypt (admin only)
    const { data, error } = await supabase.rpc('decrypt_sin', {
      sin_encrypted: encryptedSIN
    });
    
    if (error) {
      // Check if unauthorized
      if (error.message?.includes('Unauthorized')) {
        console.error('❌ Unauthorized: Only admins can decrypt SIN data');
        return '[ENCRYPTED - ADMIN ONLY]';
      }
      console.error('❌ SIN decryption failed:', error);
      throw new Error('Failed to decrypt SIN');
    }
    
    if (!data) {
      throw new Error('Decryption returned no data');
    }
    
    // Format as XXX-XXX-XXX
    const formatted = `${data.substring(0, 3)}-${data.substring(3, 6)}-${data.substring(6, 9)}`;
    console.log('✅ SIN decrypted successfully');
    return formatted;
  } catch (error) {
    console.error('❌ SIN decryption error:', error);
    throw error;
  }
}

/**
 * Validates SIN format before encryption
 * @param sin - The SIN to validate
 * @returns true if valid, false otherwise
 */
export function validateSINFormat(sin: string): boolean {
  if (!sin) return false;
  const cleanSIN = sin.replace(/[-\s]/g, '');
  return /^\d{9}$/.test(cleanSIN);
}
