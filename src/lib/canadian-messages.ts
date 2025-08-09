// Canadian-specific encouragement and humor messages for the UI
// Keep this file focused on copy so we can localize/tweak tone easily.

export const canadianEncouragement = {
  motorView: [
    "Great choice, eh! 🍁",
    "That'll get you to the fishing hole in no time! 🎣",
    "Perfect for those Kawartha Lakes! 🌊",
    "Built tough for Canadian waters! 💪",
    "That's cottage country approved! 🏞️"
  ],
  
  filterApplied: [
    "Smart filtering! Just like finding the perfect portage 🛶",
    "Narrowing it down faster than a Zamboni! 🏒",
    "You know what you want, bud! 💡"
  ],
  
  compareMode: [
    "Comparing like a true Canadian - smart and thorough! 🧠",
    "Side-by-side, just like a hockey lineup! 🏒"
  ],
  
  motorSelected: [
    "Beauty choice! You'll be the envy of the marina! 🚤",
    "That's going to look great at the cottage! 🏞️",
    "Solid pick! Ready for May long weekend! 🎆",
    "From Rice Lake to Georgian Bay - you're all set! 🗺️"
  ],
  
  seasonalMessages: {
    spring: [
      "Time to de-winterize and get ready! 🌸",
      "Ice is off the lakes - let's go! 🧊",
      "Victoria Day weekend is calling! 🎆"
    ],
    summer: [
      "Perfect for those long Canadian summer days! ☀️",
      "Sunset at 9pm? More boating time! 🌅",
      "Ready for cottage season! 🏖️"
    ],
    fall: [
      "Great time to buy - end of season deals! 🍂",
      "Perfect for those gorgeous fall colours tours! 🍁",
      "Thanksgiving weekend fishing trip? 🦃"
    ],
    winter: [
      "Planning ahead - smart Canadian move! ❄️",
      "Beat the spring rush - brilliant! ⛄",
      "More time to plan your first trip to Muskoka! 🎿"
    ]
  },
  
  tradeInAdded: [
    "Trading up like a pro! That old 2-stroke had a good run, eh? 💎",
    "Smart move! Better than letting it collect snow all winter! ❄️",
    "Out with the old, in with the new! 🔄"
  ],
  
  pricingReactions: {
    goodDeal: [
      "That's cheaper than a Leafs playoff ticket! 🏒",
      "Less than a weekend at the Ex! 🎡",
      "Costs less than winter storage! ⛄"
    ],
    financing: [
      "Lower monthly than your Tim's habit! ☕",
      "That's just two cases of beer a month! 🍺",
      "Cheaper than cottage rental! 🏡"
    ]
  }
} as const;

export const loadingMessages = [
  "Calculating your savings faster than a beaver builds a dam... 🦫",
  "Finding your perfect motor, just a sec eh... 🚤",
  "Loading faster than the Rideau Locks... ⚓",
  "Almost there, grab a Timbit while you wait... ☕"
] as const;

export const regionalReferences = {
  ontario: {
    lakes: ["Simcoe", "Muskoka", "Kawartha", "Rice Lake", "Georgian Bay"],
    messages: [
      "Perfect for cruising Lake {lake}! 🚤",
      "You'll be the fastest on {lake}! 🏁",
      "{lake} fishing trips just got better! 🎣"
    ]
  },
  
  achievements: [
    { name: "Cottage Country Captain", icon: "🏞️", unlock: "Select a 9.9HP" },
    { name: "Great Lakes Ready", icon: "🌊", unlock: "Select 115HP+" },
    { name: "Portage Pro", icon: "🛶", unlock: "Select portable motor" },
    { name: "Ice Out Explorer", icon: "🧊", unlock: "Complete quote in spring" },
    { name: "True North Strong", icon: "🍁", unlock: "Choose Mercury Canadian warranty" }
  ]
} as const;

export const achievements = regionalReferences.achievements;

export const getTimelyMessage = () => {
  const month = new Date().getMonth();
  const messages: Record<number, string> = {
    3: "Ice is almost off! Let's get you ready! 🧊", // April
    4: "May long weekend is coming - perfect timing! 🎆", // May
    5: "Summer's here! Time to hit the water! ☀️", // June
    6: "Canada Day on the water? Absolutely! 🇨🇦", // July
    7: "August at the cottage - nothing better! 🏖️", // August
    8: "Labour Day fishing derby ready! 🎣", // September
    9: "Fall colours tour by boat? Beautiful! 🍁", // October
    10: "Planning for next season - smart! 📅", // November
    0: "New year, new motor! 🎊", // January
    1: "Boat show season - great timing! 🚤", // February
    2: "March break dreams of summer! 🌊" // March
  };
  return messages[month];
};

export const comparisonHumor = {
  twoMotors: "Like choosing between poutine and butter tarts - both great! 🍟",
  threeMotors: "The lineup looks good - like Team Canada! 🏒",
  priceCompare: "Comparing prices like Canadian Tire flyers! 💰",
  powerCompare: "From 'gentle paddle' to 'full send'! 🚀"
} as const;

export const emptyStateMessages = {
  noResults: {
    message: "Nothing matching those filters, eh?",
    submessage: "Try adjusting - we've got more motors than a Toronto traffic jam!",
    emoji: "🤷‍♂️"
  },
  
  outOfStock: {
    message: "Temporarily out like McDavid with an injury",
    submessage: "But coming back stronger! Call us for ETA",
    emoji: "📦"
  }
} as const;

export const successMessages = {
  quoteComplete: [
    "Done! Easier than assembling IKEA furniture! 🔧",
    "Finished! Smoother than fresh Zamboni ice! 🏒",
    "Complete! You're officially ready for cottage season! 🏞️",
    "All set! Time to break out the boat shoes! 👟"
  ],
  
  emailSent: [
    "Sent faster than a slap shot! 🏒",
    "In your inbox quicker than Skip delivers! 📬",
    "Email sent - check your inbox, eh! 📧"
  ]
} as const;

export const friendlyErrors = {
  networkError: "Looks like our connection went for a rip. Try again? 🛶",
  validationError: "Hold up there, bud - let's fix that, eh? 🤔",
  stockError: "Someone beat you to it - faster than Black Friday at Canadian Tire! 🏃"
} as const;
