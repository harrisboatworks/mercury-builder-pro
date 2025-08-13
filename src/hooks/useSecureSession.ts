// Hook for secure session management with automatic timeout
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SecurityManager } from '@/lib/securityMiddleware';
import { useToast } from '@/hooks/use-toast';

export const useSecureSession = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Track user activity
  const trackActivity = useCallback(async () => {
    if (!user) return;

    try {
      await SecurityManager.trackSessionActivity({
        userId: user.id,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }, [user]);

  // Check session validity
  const validateSession = useCallback(async () => {
    if (!user) return;

    try {
      const isValid = await SecurityManager.validateSession(user.id);
      if (!isValid) {
        toast({
          title: "Session Expired",
          description: "Your session has expired for security reasons. Please sign in again.",
          variant: "destructive"
        });
        await signOut();
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }, [user, signOut, toast]);

  // Set up activity tracking and session validation
  useEffect(() => {
    if (!user) return;

    // Track initial activity
    trackActivity();

    // Set up activity tracking on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let activityTimeout: NodeJS.Timeout;

    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(trackActivity, 5000); // Debounce activity tracking
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Validate session every 5 minutes
    const sessionInterval = setInterval(validateSession, 5 * 60 * 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(sessionInterval);
      clearTimeout(activityTimeout);
    };
  }, [user, trackActivity, validateSession]);

  return {
    trackActivity,
    validateSession
  };
};

// Helper function to get client IP (approximation)
async function getClientIP(): Promise<string | undefined> {
  try {
    // In a real implementation, you'd get this from your server
    // This is a client-side approximation
    return undefined;
  } catch {
    return undefined;
  }
}