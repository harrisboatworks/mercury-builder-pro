export interface SMSTemplate {
  type: 'hot_lead' | 'quote_confirmation' | 'follow_up' | 'reminder' | 'manual' | 'unmatched_motors' | 'promo_active' | 'promo_subscription' | 'chat_lead' | 'get7_campaign' | 'get7_reminder';
  generateMessage: (data: any) => string;
}

export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  hot_lead: {
    type: 'hot_lead',
    generateMessage: (data) => {
      const { customerName, leadScore, finalPrice, motorModel } = data;
      return `🔥 HOT LEAD ALERT!\n\nCustomer: ${customerName}\nLead Score: ${leadScore}/100\nMotor: ${motorModel}\nQuote: $${finalPrice?.toLocaleString()}\n\nAction Required: Contact ASAP!\n\n- Mercury Motors Team`;
    }
  },

  quote_confirmation: {
    type: 'quote_confirmation',
    generateMessage: (data) => {
      const { customerName, quoteNumber, totalPrice, motorModel } = data;
      return `✅ Quote Delivered!\n\nCustomer: ${customerName}\nQuote #${quoteNumber}\nMotor: ${motorModel}\nTotal: $${totalPrice?.toLocaleString()}\n\nFollow up in 2-3 days if no response.\n\n- Mercury Motors`;
    }
  },

  follow_up: {
    type: 'follow_up',
    generateMessage: (data) => {
      const { customerName, quoteNumber, daysSinceQuote } = data;
      return `📞 Follow-up Reminder\n\nCustomer: ${customerName}\nQuote #${quoteNumber}\nDays since quote: ${daysSinceQuote}\n\nRecommended: Call today to check interest level.\n\n- Mercury Motors`;
    }
  },

  reminder: {
    type: 'reminder',
    generateMessage: (data) => {
      const { customerName, quoteNumber, expiresIn } = data;
      return `⏰ Quote Expiring Soon!\n\nCustomer: ${customerName}\nQuote #${quoteNumber}\nExpires in: ${expiresIn} days\n\nContact to close or extend quote.\n\n- Mercury Motors`;
    }
  },

  manual: {
    type: 'manual',
    generateMessage: (data) => {
      return data.customMessage || 'Manual SMS notification from Mercury Motors team.';
    }
  },

  unmatched_motors: {
    type: 'unmatched_motors',
    generateMessage: (data) => {
      const { count, motors } = data;
      const motorList = motors.slice(0, 3)
        .map(m => `- ${m.model_display || m.name}`)
        .join('\n');
      return `🔧 Mercury Inventory Alert\n\n${count} motors need matching review:\n${motorList}${count > 3 ? '\n...' : ''}\n\nReview: quote.harrisboatworks.ca/admin/stock-sync\n\n- Harris Boat Works`;
    }
  },

  promo_active: {
    type: 'promo_active',
    generateMessage: (data) => {
      const { customerName, motorModel, discountText, expiresIn, quoteUrl } = data;
      const nameGreeting = customerName ? `, ${customerName}` : '';
      const expiryNote = expiresIn ? ` Ends in ${expiresIn} days!` : '';
      return `🎉 Great news${nameGreeting}!\n\nThe ${motorModel} is now ${discountText}.${expiryNote}\n\nView your quote: ${quoteUrl}\n\n- Harris Boat Works\n\nReply STOP to unsubscribe`;
    }
  },

  promo_subscription: {
    type: 'promo_subscription',
    generateMessage: (data) => {
      const { motorModel } = data;
      return `Harris Boat Works: You're subscribed! We'll text you when ${motorModel} goes on sale. Reply STOP to unsubscribe.`;
    }
  },

  chat_lead: {
    type: 'chat_lead',
    generateMessage: (data) => {
      const { customerName, customerPhone, customerEmail, context, motorModel, leadScore } = data;
      const emailLine = customerEmail ? `\nEmail: ${customerEmail}` : '';
      const motorLine = motorModel ? `\nMotor: ${motorModel}` : '';
      return `💬 CHAT LEAD!\n\nName: ${customerName}\nPhone: ${customerPhone}${emailLine}${motorLine}\nContext: ${context || 'Requested callback from chat'}\nLead Score: ${leadScore || 'N/A'}/100\n\nAction: Call within 24hrs!\n\n- Harris Boat Works AI`;
    }
  },

  get7_campaign: {
    type: 'get7_campaign' as const,
    generateMessage: (data) => {
      const { customerName, expiresIn, rebateAmount, promoUrl } = data;
      const nameGreeting = customerName ? `Hi ${customerName}! ` : '';
      const rebateLine = rebateAmount ? `\n💰 Your motor qualifies for $${rebateAmount} cash back!` : '';
      return `🎉 ${nameGreeting}Mercury Get 7 is HERE!

7-Year Warranty PLUS Choose One:
• 6 Months No Payments
• Special Financing from 2.99%
• Up to $1,500 Cash Back${rebateLine}

Ends ${expiresIn || 'Mar 31, 2026'}!
Build your quote: ${promoUrl || 'quote.harrisboatworks.ca'}

- Harris Boat Works
Reply STOP to unsubscribe`;
    }
  },

  get7_reminder: {
    type: 'get7_reminder' as const,
    generateMessage: (data) => {
      const { customerName, daysLeft, motorModel, rebateAmount } = data;
      const nameGreeting = customerName ? `${customerName}, ` : '';
      const motorLine = motorModel ? `\nMotor: ${motorModel}` : '';
      const rebateLine = rebateAmount ? `\n💰 Eligible for $${rebateAmount} rebate!` : '';
      return `⏰ ${nameGreeting}Only ${daysLeft} days left!

Mercury Get 7 + Choose One ends soon:
✓ 7-Year Factory Warranty
✓ No Payments OR Low Rates OR Cash Back${motorLine}${rebateLine}

Don't miss out: quote.harrisboatworks.ca/promotions

- Harris Boat Works
Reply STOP to unsubscribe`;
    }
  }
};

export const generateSMSMessage = (type: keyof typeof SMS_TEMPLATES, data: any): string => {
  const template = SMS_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown SMS template type: ${type}`);
  }
  return template.generateMessage(data);
};

// SMS notification preferences
export interface SMSPreferences {
  hotLeads: boolean;
  quoteDelivered: boolean;
  followUpReminders: boolean;
  quoteExpiring: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string;   // HH:MM format
  phoneNumber: string;
}

export const DEFAULT_SMS_PREFERENCES: SMSPreferences = {
  hotLeads: true,
  quoteDelivered: true,
  followUpReminders: true,
  quoteExpiring: true,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
  phoneNumber: ''
};

// Check if current time is within quiet hours
export const isQuietHours = (preferences: SMSPreferences): boolean => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const { quietHoursStart, quietHoursEnd } = preferences;
  
  // Handle overnight quiet hours (e.g., 21:00 to 08:00)
  if (quietHoursStart > quietHoursEnd) {
    return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
  }
  
  // Handle same-day quiet hours (e.g., 12:00 to 14:00)
  return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
};