// src/config/visualChoices.ts
// src/config/visualChoices.ts

// Tiller motor mounting options
export const tillerMountingChoices = [
  {
    id: "transom_bolt",
    label: "Transom Bolt Mount",
    value: "transom_bolt",
    image: "/lovable-uploads/bolt-on-motor-installation.png",
    helper: "Permanent bolt-through mounting",
    xpReward: 15,
    price: 99,
    priceLabel: "+$99",
    recommendedPackage: "better"
  },
  {
    id: "clamp_on",
    label: "Clamp-On Mount",
    value: "clamp_on", 
    image: "/lovable-uploads/clamp-on-motor-installation.png",
    helper: "Removable clamp mounting",
    xpReward: 10,
    price: 0,
    priceLabel: "Included",
    recommendedPackage: "good"
  }
];

// Fun achievement milestones
export const achievements = [
  { xp: 50, title: "Gear Head", icon: "🔧" },
  { xp: 100, title: "Rigging Expert", icon: "⚓" },
  { xp: 150, title: "Master Builder", icon: "🏆" }
];
