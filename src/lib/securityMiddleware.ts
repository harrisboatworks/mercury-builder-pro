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

  // Track session activity with enhanced security logging
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
        // Log the security event for monitoring
        await this.logSecurityEvent(
          context.userId,
          'session_tracking_error',
          'user_sessions',
          undefined,
          { error: error.message, ...context }
        );
      }
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  }

  // Enhanced session validation with automatic cleanup
  static async invalidateExpiredSessions(): Promise<void> {
    try {
      const expiryTime = new Date(Date.now() - this.SESSION_TIMEOUT);
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .lt('last_activity', expiryTime.toISOString())
        .eq('is_active', true);

      if (error) {
        console.error('Failed to invalidate expired sessions:', error);
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
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

      // Enhanced sanitization for identifier to prevent injection attacks
      const sanitizedIdentifier = this.sanitizeInput(identifier);
      
      // Validate identifier format before querying
      if (!sanitizedIdentifier || sanitizedIdentifier.length === 0) {
        console.warn('Invalid identifier provided for rate limiting');
        return false;
      }
      
      // For login attempts, check by identifier (could be email or user_id)
      // Use safer query structure to avoid SQL injection
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('id')
        .eq('action', action)
        .gte('created_at', windowStart.toISOString())
        .or(`user_id.eq.${sanitizedIdentifier}`);

      if (error) {
        console.error('Rate limit check error:', error);
        // Fail closed for security - deny on error for rate limiting
        return false;
      }

      const attemptCount = data?.length || 0;
      const isAllowed = attemptCount < this.MAX_FAILED_ATTEMPTS;
      
      // Log rate limiting attempts for security monitoring
      if (!isAllowed) {
        console.warn(`Rate limit exceeded for identifier: ${sanitizedIdentifier}, action: ${action}`);
      }
      
      return isAllowed;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail closed for security - deny on error for rate limiting
      return false;
    }
  }

  // Enhanced input sanitization with additional security measures
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
        .replace(/javascript:|data:|vbscript:/gi, '') // Remove dangerous protocols
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/[<>'"`;(){}]/g, '') // Enhanced character filtering for SQL injection prevention
        .replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|iframe)\b)/gi, '') // Expanded SQL keyword filtering
        .replace(/(\-\-|\#|\/\*|\*\/)/g, '') // Remove SQL comment patterns
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
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

// Enhanced password strength validation with security best practices
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Minimum length requirement
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  // Maximum length to prevent DoS attacks
  if (password.length > 128) {
    errors.push('Password must be no more than 128 characters long');
  }
  
  // Character complexity requirements
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;'/~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const commonPatterns = [
    /(.)\1{3,}/, // Repeated characters (4+ times)
    /123456|654321|abcdef|qwerty|password|admin/i, // Common sequences
    /^[a-zA-Z]+\d+$/, // Letters followed by numbers only
    /^\d+[a-zA-Z]+$/, // Numbers followed by letters only
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns that make it vulnerable');
      break;
    }
  }
  
  // Check for potential SQL injection attempts in password
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i;
  if (sqlPatterns.test(password)) {
    errors.push('Password contains invalid characters or patterns');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};