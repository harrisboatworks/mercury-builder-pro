import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/components/auth/AuthProvider'

export const NotificationToast = () => {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Set up real-time listener for new notifications to show as toasts
    const channel = supabase
      .channel('notification-toasts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new
          
          // Show toast for new notifications
          if (notification && !notification.read) {
            toast(notification.title || 'New notification', {
              description: notification.message,
              duration: 5000,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return null
}

// Import statement needed for supabase
import { supabase } from '@/integrations/supabase/client'