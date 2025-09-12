import { useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SecurityManager } from '@/lib/securityMiddleware';

export const useSecureSession = () => {
  const { user } = useAuth();

  // Track user activity and session security
  const trackActivity = useCallback(async () => {
    if (!user) return;
    
    const context = {
      userId: user.id,
      ipAddress: undefined, // Can be obtained from request in production
      userAgent: navigator.userAgent,
    };

    await SecurityManager.trackSessionActivity(context);
  }, [user]);

  // Validate current session
  const validateSession = useCallback(async () => {
    if (!user) return false;
    return await SecurityManager.validateSession(user.id);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // Track initial session activity
    trackActivity();
    
    // Set up periodic session validation (every 5 minutes)
    const interval = setInterval(() => {
      validateSession().then(isValid => {
        if (!isValid) {
          console.warn('Session validation failed - user may need to re-authenticate');
          // In production, could trigger re-authentication flow here
        }
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, trackActivity, validateSession]);

  return {
    trackActivity,
    validateSession
  };
};