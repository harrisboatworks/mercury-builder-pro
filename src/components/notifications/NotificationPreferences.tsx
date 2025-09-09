import React, { useState } from 'react'
import { Phone, Clock, Bell, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { useToast } from '@/hooks/use-toast'

export const NotificationPreferences = () => {
  const { preferences, loading, updatePreferences } = useNotificationPreferences()
  const [phone, setPhone] = useState(preferences.phone || '')
  const { toast } = useToast()

  const handleToggle = async (key: keyof typeof preferences, value: boolean | string) => {
    try {
      await updatePreferences({ [key]: value })
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handlePhoneUpdate = async () => {
    try {
      await updatePreferences({ phone })
      toast({
        title: "Phone number updated",
        description: "Your phone number has been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone number. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full px-6">
      <div className="space-y-6 pb-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Channels
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">In-App Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications within the app
                </p>
              </div>
              <Switch
                checked={preferences.notification_in_app_enabled}
                onCheckedChange={(checked) => 
                  handleToggle('notification_in_app_enabled', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via text message
                </p>
              </div>
              <Switch
                checked={preferences.notification_sms_enabled}
                onCheckedChange={(checked) => 
                  handleToggle('notification_sms_enabled', checked)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Phone Number */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">
                Phone Number
              </Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handlePhoneUpdate}
                  disabled={phone === preferences.phone}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required for SMS notifications. Include country code.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Quiet Hours
          </h3>
          
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              SMS notifications will be paused during these hours
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Start Time</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => 
                    handleToggle('quiet_hours_start', e.target.value)
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">End Time</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => 
                    handleToggle('quiet_hours_end', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preferred Channel */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Preferred Channel
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Default notification method</Label>
              <Select 
                value={preferences.preferred_channel} 
                onValueChange={(value) => 
                  handleToggle('preferred_channel', value as 'in_app' | 'sms' | 'both')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App Only</SelectItem>
                  <SelectItem value="sms">SMS Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how you'd like to receive notifications by default
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}