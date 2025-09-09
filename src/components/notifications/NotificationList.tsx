import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, X, Info, AlertTriangle, AlertCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle
}

const typeColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500'
}

export const NotificationList = () => {
  const { notifications, loading, markAsRead, deleteNotification } = useNotifications()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <Bell className="h-8 w-8 mb-2" />
        <p className="text-sm">No notifications yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full px-6">
      <div className="space-y-3 pb-6">
        {notifications.map((notification) => {
          const IconComponent = typeIcons[notification.type] || Info
          const iconColor = typeColors[notification.type] || 'text-blue-500'
          
          return (
            <div
              key={notification.id}
              className={cn(
                "relative p-4 rounded-lg border transition-colors",
                notification.read 
                  ? "bg-muted/50 border-border" 
                  : "bg-background border-primary/20 shadow-sm"
              )}
            >
              <div className="flex items-start gap-3">
                <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
                
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <h4 className="font-medium text-sm mb-1 leading-tight">
                      {notification.title}
                    </h4>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="h-8 w-8 p-0"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!notification.read && (
                <div className="absolute left-2 top-4 w-2 h-2 bg-primary rounded-full"></div>
              )}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}