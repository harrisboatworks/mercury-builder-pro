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
  
  try {
    // Call the database function to encrypt
    const { data, error } = await supabase.rpc('encrypt_sin', {
      sin_plaintext: cleanSIN
    });
    
    if (error) {
      console.error('❌ SIN encryption failed:', error);
      throw new Error('Failed to encrypt SIN. Please try again.');
    }
    
    if (!data) {
      throw new Error('Encryption returned no data');
    }
    
    console.log('✅ SIN encrypted successfully (pgsodium AES-256)');
    return data;
  } catch (error) {
    console.error('❌ SIN encryption error:', error);
    throw new Error('Failed to encrypt SIN. Please contact support if this persists.');
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
