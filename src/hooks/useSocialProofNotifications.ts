import { useState, useEffect, useCallback } from 'react';

export interface SocialProofNotification {
  id: string;
  message: string;
  variant: 'notice' | 'trending' | 'popular' | 'viewed' | 'hot' | 'featured';
  color: string;
  icon: string;
}

const MOTOR_SPECIFIC_MESSAGES = [
  // High Performance / EFI motors
  { 
    message: "Hot Seller!", 
    variant: 'hot' as const, 
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: 'flame',
    condition: (motor: any) => motor.model?.includes('EFI') || motor.hp >= 150
  },
  // Popular HP ranges
  { 
    message: "Popular Choice!", 
    variant: 'popular' as const, 
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: 'trending-up',
    condition: (motor: any) => motor.hp >= 60 && motor.hp <= 150
  },
  // In Stock items
  { 
    message: "In Stock Now!", 
    variant: 'notice' as const, 
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: 'check-circle',
    condition: (motor: any) => motor.stockStatus === 'In Stock'
  },
  // Sale items
  { 
    message: "On Sale!", 
    variant: 'featured' as const, 
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    icon: 'tag',
    condition: (motor: any) => motor.salePrice
  },
  // Lower HP trolling motors
  { 
    message: "Perfect for Trolling!", 
    variant: 'viewed' as const, 
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    icon: 'anchor',
    condition: (motor: any) => motor.hp <= 15
  },
  // Mid-range family motors
  { 
    message: "Family Favorite!", 
    variant: 'trending' as const, 
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    icon: 'heart',
    condition: (motor: any) => motor.hp >= 40 && motor.hp <= 90
  },
  // Recently viewed fallback
  { 
    message: "Recently Viewed", 
    variant: 'viewed' as const, 
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    icon: 'eye',
    condition: () => true // fallback
  }
];

const getContextualMessage = (motor: any) => {
  // Find the first matching message based on motor characteristics
  return MOTOR_SPECIFIC_MESSAGES.find(msg => msg.condition(motor)) || MOTOR_SPECIFIC_MESSAGES[MOTOR_SPECIFIC_MESSAGES.length - 1];
};

export function useSocialProofNotifications(motors: any[]) {
  const [notifications, setNotifications] = useState<Map<string, SocialProofNotification>>(new Map());
  const [userInteractions, setUserInteractions] = useState<Map<string, number>>(new Map());

  const trackInteraction = useCallback((motorId: string) => {
    setUserInteractions(prev => {
      const newMap = new Map(prev);
      newMap.set(motorId, (newMap.get(motorId) || 0) + 1);
      return newMap;
    });
  }, []);

  useEffect(() => {
    if (!motors.length) return;

    const generateNotifications = () => {
      const newNotifications = new Map<string, SocialProofNotification>();
      
      motors.forEach((motor, index) => {
        const interactionCount = userInteractions.get(motor.id) || 0;
        
        // Smart logic for showing notifications
        const shouldShow = 
          index % 4 === 0 || // Every 4th motor for less crowding
          motor.salePrice || // Always show for sale items
          (motor.stockStatus === 'In Stock' && motor.hp >= 40) || // In-stock popular sizes
          (motor.model?.includes('EFI') && Math.random() > 0.5) || // EFI motors
          interactionCount > 0; // Previously viewed items

        if (shouldShow) {
          let contextualMessage = getContextualMessage(motor);
          
          // Override with interaction-based message if user has clicked
          if (interactionCount > 0) {
            contextualMessage = {
              message: `Viewed ${interactionCount} time${interactionCount > 1 ? 's' : ''}`,
              variant: 'viewed' as const,
              color: 'text-blue-600 bg-blue-50 border-blue-200',
              icon: 'eye',
              condition: () => true
            };
          }
          
          newNotifications.set(motor.id, {
            id: motor.id,
            message: contextualMessage.message,
            variant: contextualMessage.variant,
            color: contextualMessage.color,
            icon: contextualMessage.icon
          });
        }
      });

      setNotifications(newNotifications);
    };

    // Initial generation
    generateNotifications();

    // Rotate notifications every 20-40 seconds (longer intervals)
    const interval = setInterval(() => {
      generateNotifications();
    }, Math.random() * 20000 + 20000);

    return () => clearInterval(interval);
  }, [motors, userInteractions]); // Fixed dependency array

  return { notifications, trackInteraction };
}
