// Security middleware for API requests and session management
import { supabase } from '@/integrations/supabase/client';

export interface SecurityContext {
  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SecurityManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

  // Track session activity
  static async trackSessionActivity(context: SecurityContext) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: context.userId,
          last_activity: new Date().toISOString(),
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
          is_active: true
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to track session activity:', error);
      }
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  }

  // Log security-related events
  static async logSecurityEvent(
    userId: string,
    action: string,
    tableName: string,
    recordId?: string,
    metadata?: Record<string, any>
  ) {
    try {
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          action,
          table_name: tableName,
          record_id: recordId,
          ip_address: metadata?.ipAddress,
          user_agent: metadata?.userAgent,
          metadata: {
            ...metadata,
            identifier: userId // Store identifier for rate limiting lookups
          }
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security logging error:', error);
    }
  }

  // Validate session is still active
  static async validateSession(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('last_activity, is_active')
        .eq('user_id', userId)
        .single();

      if (error || !data?.is_active) {
        return false;
      }

      const lastActivity = new Date(data.last_activity);
      const now = new Date();
      const timeDiff = now.getTime() - lastActivity.getTime();

      return timeDiff < this.SESSION_TIMEOUT;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Rate limiting check - for login attempts, use identifier (email or user_id)
  static async checkRateLimit(identifier: string, action: string): Promise<boolean> {
    try {
      const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW);

      // Sanitize identifier to prevent injection attacks
      const sanitizedIdentifier = this.sanitizeInput(identifier);
      
      // For login attempts, check by identifier (could be email or user_id)
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('id')
        .or(`user_id.eq.${sanitizedIdentifier},metadata->>identifier.eq.${sanitizedIdentifier}`)
        .eq('action', action)
        .gte('created_at', windowStart.toISOString());

      if (error) {
        console.error('Rate limit check error:', error);
        // Fail closed for security - deny on error for rate limiting
        return false;
      }

      const attemptCount = data?.length || 0;
      return attemptCount < this.MAX_FAILED_ATTEMPTS;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail closed for security - deny on error for rate limiting
      return false;
    }
  }

  // Enhanced input sanitization
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>'"`;(){}]/g, '') // Enhanced character filtering for SQL injection prevention
        .replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, '') // Basic SQL keyword filtering
        .trim()
        .substring(0, 1000); // Limit input length
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        // Sanitize both keys and values
        const sanitizedKey = this.sanitizeInput(key);
        sanitized[sanitizedKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  // Validate user data access permissions
  static async validateDataAccess(
    userId: string,
    tableName: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('validate_user_data_access', {
          _table_name: tableName,
          _record_id: recordId
        });

      if (error) {
        console.error('Data access validation error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Data access validation error:', error);
      return false;
    }
  }
}

// Enhanced security headers for API responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};