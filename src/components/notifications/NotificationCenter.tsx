import React, { useState } from 'react'
import { Bell, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationList } from './NotificationList'
import { NotificationPreferences } from './NotificationPreferences'
import { NotificationBadge } from './NotificationBadge'
import { useNotifications } from '@/hooks/useNotifications'

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { markAllAsRead, unreadCount } = useNotifications()

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <NotificationBadge />
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              Notifications
            </SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="notifications" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
              <TabsTrigger value="notifications">Messages</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications" className="flex-1 overflow-hidden mt-4">
              <NotificationList />
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 overflow-hidden mt-4">
              <NotificationPreferences />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}