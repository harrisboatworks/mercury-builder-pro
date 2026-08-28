// Single source of truth for /repower landing photography & brand asset paths.
import hbwShopInstall from '@/assets/repower-hbw-shop-install.jpg';

export const repowerImages = {
  hero: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=85',
  // Authentic HBW shop floor: technician installing a new Mercury FourStroke at the Gores Landing shop.
  finalCta: hbwShopInstall,
};

export const repowerBrand = {
  mercuryRepowerCenter: '/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png',
  mercuryWordmark: '/src/assets/mercury-logo.png',
  hbwLockup: '/src/assets/harris-logo-white.png',
  warranty7yr: '/src/assets/harris-7-year-warranty.png',
  platinumDealer: null as string | null,
  csiAward: null as string | null,
};
