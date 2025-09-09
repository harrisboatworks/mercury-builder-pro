import React from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

export const NotificationBadge = () => {
  const { unreadCount } = useNotifications()

  if (unreadCount === 0) {
    return null
  }

  return (
    <span 
      className={cn(
        "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center",
        unreadCount > 99 && "px-1.5 w-auto min-w-[20px]"
      )}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}