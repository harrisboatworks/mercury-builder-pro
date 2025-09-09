import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'

export interface Notification {
  id: string
  user_id: string
  title?: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  metadata: Record<string, any>
  channel: string
  created_at: string
}

export const useNotifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return
    }

    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.read).length || 0)
    setLoading(false)
  }

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user?.id)

    if (error) {
      console.error('Failed to mark notification as read:', error)
      return
    }

    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Failed to mark all notifications as read:', error)
      return
    }

    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
    setUnreadCount(0)
  }

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user?.id)

    if (error) {
      console.error('Failed to delete notification:', error)
      return
    }

    const notification = notifications.find(n => n.id === notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const sendNotification = async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    metadata: Record<string, any> = {}
  ) => {
    if (!user) return

    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        user_id: user.id,
        title,
        message,
        type,
        metadata
      }
    })

    if (error) {
      console.error('Failed to send notification:', error)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev])
            if (!(payload.new as Notification).read) {
              setUnreadCount(prev => prev + 1)
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n =>
                n.id === payload.new.id ? payload.new as Notification : n
              )
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedNotification = notifications.find(n => n.id === payload.old.id)
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
            if (deletedNotification && !deletedNotification.read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    refetch: fetchNotifications
  }
}