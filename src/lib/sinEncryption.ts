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
    throw new Error('SIN cannot be empty');
  }
  
  // Remove any formatting (hyphens, spaces)
  const cleanSIN = sin.replace(/[-\s]/g, '');
  
  // Validate SIN format (9 digits)
  if (!/^\d{9}$/.test(cleanSIN)) {
    throw new Error('Invalid SIN format. Must be 9 digits.');
  }
  
  // Call the database function to encrypt
  const { data, error } = await supabase.rpc('encrypt_sin', {
    sin_plaintext: cleanSIN
  });

  if (error) {
    console.error('❌ SIN encryption failed:', error);
    const err = new Error(error.message || 'Failed to encrypt SIN') as SinEncryptionError;
    err.name = 'SinEncryptionError';
    err.code = (error as any).code || 'rpc_error';
    err.pgCode = (error as any).code;
    err.details = (error as any).details;
    err.hint = (error as any).hint;
    // Map common Postgres errors to friendly codes
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('permission denied') || (error as any).code === '42501') {
      err.code = 'permission_denied';
    } else if (msg.includes('does not exist') || (error as any).code === '42883') {
      err.code = 'function_missing';
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

export function getFriendlySinErrorMessage(code: string | undefined): { title: string; description: string } {
  switch (code) {
    case 'permission_denied':
      return {
        title: 'Secure submission temporarily unavailable',
        description: 'We could not securely encrypt your SIN due to a permissions issue on our end. Our team has been notified. Please try again in a few minutes or call us at (905) 342-2153.',
      };
    case 'function_missing':
      return {
        title: 'Submission service unavailable',
        description: 'The secure encryption service is temporarily offline. Our team has been notified. Please try again shortly or call us at (905) 342-2153.',
      };
    case 'empty_response':
      return {
        title: 'Encryption returned no data',
        description: 'Your SIN could not be encrypted. Please try again, or contact us at (905) 342-2153 if this continues.',
      };
    default:
      return {
        title: 'Could not securely save your SIN',
        description: 'There was a problem encrypting your SIN. Please try again, or contact us at (905) 342-2153.',
      };
  }
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
