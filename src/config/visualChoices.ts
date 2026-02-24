// src/config/visualChoices.ts
export const controlChoices = [
  {
    id: "sm",
    label: "Side-Mount Control",
    value: "side_mount",
    image: "/images/options/mercury-side-mount-control.png",
    helper: "Lever on the side of your console",
    xpReward: 15
  },
  {
    id: "bin",
    label: "Binnacle Control",
    value: "binnacle",
    image: "/images/options/mercury-binnacle-control.jpeg",
    helper: "Lever mounted on top of your console",
    xpReward: 15
  },
  // DTS option hidden for now
  // {
  //   id: "dts",
  //   label: "DTS Digital Control",
  //   value: "dts",
  //   image: "/images/options/mercury-panel-mount-control.jpeg",
  //   helper: "Smooth digital precision",
  //   xpReward: 25,
  //   badge: "Tech Savvy",
  //   price: 1200,
  //   priceLabel: "+$1,200"
  // }
];

export const steeringChoices = [
  {
    id: "cable",
    label: "Cable Steering",
    value: "cable",
    image: "/images/options/cable-steering.jpg",
    helper: "Standard mechanical steering — most common on smaller boats",
    xpReward: 10
  },
  {
    id: "hydraulic",
    label: "Hydraulic Steering",
    value: "hydraulic",
    image: "/images/options/hydraulic-steering.jpg",
    helper: "Power-assisted steering — common on larger boats",
    xpReward: 20,
    badge: "Smooth Operator"
  }
];

export const gaugeChoices = [
  {
    id: "tach",
    label: "Basic Tach",
    value: "tach_basic",
    image: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=300&fit=crop",
    helper: "Essential RPM gauge",
    xpReward: 10
  },
  {
    id: "sc",
    label: "Smartcraft Connect",
    value: "smartcraft",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop",
    helper: "Digital monitoring suite",
    xpReward: 20
  },
  {
    id: "vv",
    label: "VesselView",
    value: "vesselview",
    image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=400&h=300&fit=crop",
    helper: "Full glass cockpit display",
    xpReward: 30,
    badge: "Captain's Choice"
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
