// src/config/xpRewards.ts
export type XPReward = {
  xp: number;
  reward: string;
  value: number;
  icon: string;
};

export const xpRewards: XPReward[] = [
  { xp: 100, reward: "Mercury Keychain", value: 15, icon: "🔑" },
  { xp: 250, reward: "Mercury Travel Mug", value: 25, icon: "☕" },
  { xp: 500, reward: "Mercury Baseball Cap", value: 50, icon: "🧢" },
  { xp: 750, reward: "Mercury Polo Shirt", value: 75, icon: "👕" },
  { xp: 1000, reward: "Mercury Tackle Box", value: 100, icon: "🎣" },
  { xp: 1500, reward: "Mercury Yeti Cooler", value: 200, icon: "🧊" },
];

export function getCurrentReward(totalXP: number): XPReward | undefined {
  return xpRewards
    .filter((r) => totalXP >= r.xp)
    .sort((a, b) => b.xp - a.xp)[0];
}

export function getNextReward(totalXP: number): XPReward | undefined {
  return xpRewards.find((r) => r.xp > totalXP);
}
