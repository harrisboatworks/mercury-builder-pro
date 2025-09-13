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

  // Enhanced session activity tracking with rate limiting
  static async trackSessionActivity(context: SecurityContext): Promise<void> {
    try {
      // Check rate limit before tracking
      const canTrack = await this.checkRateLimit(context.userId, 'session_activity');
      if (!canTrack) {
        console.warn('Session activity rate limit exceeded');
        return;
      }

      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: context.userId,
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
          last_activity: new Date().toISOString(),
          is_active: true
        }, { 
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Failed to track session activity:', error);
        // Log security event for failed session tracking
        await this.logSecurityEvent(
          context.userId,
          'session_track_failed',
          'user_sessions',
          undefined,
          { error: error.message, ip: context.ipAddress, userAgent: context.userAgent }
        );
      }
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  }

  // Enhanced session cleanup using database function
  static async invalidateExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions');
      
      if (error) {
        console.error('Failed to cleanup expired sessions:', error);
        return 0;
      }
      
      console.log(`Cleaned up ${data} expired sessions`);
      return data || 0;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  }

  // Enhanced security event logging with input validation
  static async logSecurityEvent(
    userId: string,
    action: string,
    tableName: string,
    recordId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Validate inputs
      if (!action || !tableName || action.length > 100 || tableName.length > 100) {
        console.warn('Invalid security log parameters');
        return;
      }

      // Use the enhanced logging function from database
      const { error } = await supabase.rpc('log_security_event', {
        _user_id: userId,
        _action: action,
        _table_name: tableName,
        _record_id: recordId || null,
        _ip_address: metadata?.ip || null,
        _user_agent: metadata?.userAgent || null
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

  // Enhanced rate limiting using database function
  static async checkRateLimit(
    identifier: string, 
    action: string, 
    maxAttempts: number = 10,
    windowMinutes: number = 15
  ): Promise<boolean> {
    try {
      // Validate and sanitize inputs
      if (!identifier || !action) {
        console.warn('Invalid rate limit parameters');
        return false;
      }

      const sanitizedIdentifier = this.sanitizeInput(identifier);
      const sanitizedAction = this.sanitizeInput(action);

      // Use the enhanced database function for rate limiting
      const { data, error } = await supabase.rpc('check_rate_limit', {
        _identifier: sanitizedIdentifier,
        _action: sanitizedAction,
        _max_attempts: maxAttempts,
        _window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return false; // Fail closed for security
      }

      const isAllowed = data === true;
      
      // Log rate limit violations for security monitoring
      if (!isAllowed) {
        console.warn(`Rate limit exceeded for identifier: ${sanitizedIdentifier}, action: ${sanitizedAction}`);
        await this.logSecurityEvent(
          identifier,
          'rate_limit_exceeded',
          'security_audit_log',
          undefined,
          { action: sanitizedAction, maxAttempts, windowMinutes }
        );
      }
      
      return isAllowed;
    } catch (error) {
      console.error('Rate limiting error:', error);
      return false; // Fail closed for security
    }
  }

  // Enhanced input sanitization with comprehensive security checks
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        // Remove script tags and javascript protocols
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:|data:text\/html|vbscript:/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=/gi, '')
        // Remove potentially dangerous attributes
        .replace(/srcdoc\s*=/gi, '')
        .replace(/formaction\s*=/gi, '')
        // Enhanced SQL injection prevention
        .replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|iframe)\b)/gi, '')
        .replace(/(\-\-|\#|\/\*|\*\/|;)/g, '')
        // Remove dangerous characters for XSS prevention
        .replace(/[<>'"`;(){}]/g, '')
        // Escape HTML entities
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Remove null bytes and control characters
        .replace(/\0/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim()
        .slice(0, 1000); // Limit length
    }
    
    if (Array.isArray(input)) {
      return input.slice(0, 100).map(item => this.sanitizeInput(item)); // Limit array size
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      let count = 0;
      for (const [key, value] of Object.entries(input)) {
        if (count >= 50) break; // Limit object size
        const sanitizedKey = this.sanitizeInput(key);
        if (typeof sanitizedKey === 'string' && sanitizedKey.length > 0) {
          sanitized[sanitizedKey] = this.sanitizeInput(value);
          count++;
        }
      }
      return sanitized;
    }
    
    return input;
  }

  // Enhanced data access validation with comprehensive security checks
  static async validateDataAccess(
    userId: string,
    tableName: string,
    recordId: string
  ): Promise<boolean> {
    try {
      // Validate inputs first
      if (!userId || !tableName || !recordId) {
        console.warn('Invalid data access validation parameters');
        return false;
      }

      // Check if user ID and record ID are valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId) || !uuidRegex.test(recordId)) {
        console.warn('Invalid UUID format in data access validation');
        await this.logSecurityEvent(
          userId,
          'invalid_uuid_access_attempt',
          tableName,
          recordId,
          { error: 'Invalid UUID format' }
        );
        return false;
      }

      // Use enhanced database function
      const { data, error } = await supabase
        .rpc('validate_user_data_access', {
          _table_name: this.sanitizeInput(tableName),
          _record_id: recordId
        });

      if (error) {
        console.error('Data access validation error:', error);
        // Log security event for failed validation
        await this.logSecurityEvent(
          userId,
          'data_access_validation_failed',
          tableName,
          recordId,
          { error: error.message }
        );
        return false;
      }

      // Log successful validation for audit trail
      if (data === true) {
        await this.logSecurityEvent(
          userId,
          'data_access_validated',
          tableName,
          recordId
        );
      }

      return data === true;
    } catch (error) {
      console.error('Data access validation failed:', error);
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