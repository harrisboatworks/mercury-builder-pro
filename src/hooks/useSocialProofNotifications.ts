import { useState, useEffect } from 'react';

export interface SocialProofNotification {
  id: string;
  message: string;
  variant: 'notice' | 'trending' | 'popular' | 'viewed';
  color: string;
  icon?: string;
}

const NOTIFICATION_MESSAGES = [
  { message: "This is Getting Noticed!", variant: 'notice' as const, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { message: "Popular Choice!", variant: 'popular' as const, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { message: "Trending Now!", variant: 'trending' as const, color: 'text-green-600 bg-green-50 border-green-200' },
  { message: "Frequently Viewed", variant: 'viewed' as const, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export function useSocialProofNotifications(motors: any[]) {
  const [notifications, setNotifications] = useState<Map<string, SocialProofNotification>>(new Map());

  useEffect(() => {
    if (!motors.length) return;

    // Generate notifications for a subset of motors
    const newNotifications = new Map<string, SocialProofNotification>();
    
    motors.forEach((motor, index) => {
      // Show notifications on ~30% of motors, but with some logic
      const shouldShow = 
        index % 3 === 0 || // Every 3rd motor
        (motor.stockStatus === 'In Stock' && Math.random() > 0.7) || // Random chance for in-stock
        motor.salePrice || // Motors on sale
        (motor.hp >= 60 && motor.hp <= 150); // Popular HP range

      if (shouldShow) {
        const randomMessage = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
        newNotifications.set(motor.id, {
          id: motor.id,
          ...randomMessage
        });
      }
    });

    setNotifications(newNotifications);

    // Rotate notifications every 15-30 seconds
    const interval = setInterval(() => {
      const newRotatedNotifications = new Map<string, SocialProofNotification>();
      
      motors.forEach((motor) => {
        const currentNotification = notifications.get(motor.id);
        
        // 70% chance to keep existing notification, 30% chance to change/remove
        if (currentNotification && Math.random() > 0.3) {
          newRotatedNotifications.set(motor.id, currentNotification);
        } else if (Math.random() > 0.6) { // 40% chance to add new notification
          const randomMessage = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
          newRotatedNotifications.set(motor.id, {
            id: motor.id,
            ...randomMessage
          });
        }
      });

      setNotifications(newRotatedNotifications);
    }, Math.random() * 15000 + 15000); // 15-30 seconds

    return () => clearInterval(interval);
  }, [motors]);

  return notifications;
}
