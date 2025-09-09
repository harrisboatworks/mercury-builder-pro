import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'

export interface NotificationPreferences {
  notification_sms_enabled: boolean
  notification_in_app_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  preferred_channel: 'in_app' | 'sms' | 'both'
  phone?: string
}

export const useNotificationPreferences = () => {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notification_sms_enabled: false,
    notification_in_app_enabled: true,
    quiet_hours_start: '21:00',
    quiet_hours_end: '08:00',
    preferred_channel: 'in_app'
  })
  const [loading, setLoading] = useState(true)

  const fetchPreferences = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        notification_sms_enabled,
        notification_in_app_enabled,
        quiet_hours_start,
        quiet_hours_end,
        preferred_channel,
        phone
      `)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Failed to fetch notification preferences:', error)
      setLoading(false)
      return
    }

    if (data) {
      setPreferences({
        notification_sms_enabled: data.notification_sms_enabled || false,
        notification_in_app_enabled: data.notification_in_app_enabled || true,
        quiet_hours_start: data.quiet_hours_start || '21:00',
        quiet_hours_end: data.quiet_hours_end || '08:00',
        preferred_channel: data.preferred_channel || 'in_app',
        phone: data.phone || undefined
      })
    }
    
    setLoading(false)
  }

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to update notification preferences:', error)
      throw error
    }

    setPreferences(prev => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    fetchPreferences()
  }, [user])

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences
  }
}