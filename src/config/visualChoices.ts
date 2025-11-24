// src/config/visualChoices.ts
export const controlChoices = [
  {
    id: "sm",
    label: "Side-Mount Control",
    value: "side_mount",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400&h=300&fit=crop",
    helper: "Mounts on side of console",
    xpReward: 15,
    price: 1200,
    priceLabel: "+$1,200"
  },
  {
    id: "bin",
    label: "Binnacle Control",
    value: "binnacle",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc61?w=400&h=300&fit=crop",
    helper: "Top-mount throttle/shift",
    xpReward: 15,
    price: 1200,
    priceLabel: "+$1,200"
  },
  {
    id: "dts",
    label: "DTS Digital Control",
    value: "dts",
    image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=300&fit=crop",
    helper: "Smooth digital precision",
    xpReward: 25,
    badge: "Tech Savvy",
    price: 1200,
    priceLabel: "+$1,200"
  }
];

export const steeringChoices = [
  {
    id: "cable",
    label: "Cable Steering",
    value: "cable",
    image: "https://images.unsplash.com/photo-1510154328089-bdd27fc4ff66?w=400&h=300&fit=crop",
    helper: "Mechanical cable system",
    xpReward: 10,
    price: 0,
    priceLabel: "Included"
  },
  {
    id: "hydraulic",
    label: "Hydraulic Steering",
    value: "hydraulic",
    image: "https://images.unsplash.com/photo-1566933293069-b55c7f326dd4?w=400&h=300&fit=crop",
    helper: "Smooth hydraulic control",
    xpReward: 20,
    badge: "Smooth Operator",
    price: 0,
    priceLabel: "Included"
  }
];

export const gaugeChoices = [
  {
    id: "tach",
    label: "Basic Tach",
    value: "tach_basic",
    image: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=300&fit=crop",
    helper: "Essential RPM gauge",
    xpReward: 10,
    price: 0,
    priceLabel: "Included"
  },
  {
    id: "sc",
    label: "Smartcraft Connect",
    value: "smartcraft",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop",
    helper: "Digital monitoring suite",
    xpReward: 20,
    price: 0,
    priceLabel: "Included"
  },
  {
    id: "vv",
    label: "VesselView",
    value: "vesselview",
    image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=400&h=300&fit=crop",
    helper: "Full glass cockpit display",
    xpReward: 30,
    badge: "Captain's Choice",
    price: 0,
    priceLabel: "Included"
  }
];

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
