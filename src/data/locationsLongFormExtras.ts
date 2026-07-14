// Standards-upgrade fields for the 11 long-form location pages (Bucket 2 Batch 1).
// Adds Quick answer callout, Last reviewed date, "What we see at HBW"
// shop card, and the hero image path used by /locations/{slug}.

export interface LocationLongFormExtras {
  quickAnswer: string;
  lastReviewed: string; // YYYY-MM-DD
  whatWeSeeAtHBW: string;
  heroImage: string;
  heroAlt: string;
}

export const LOCATION_LONGFORM_EXTRAS: Record<string, LocationLongFormExtras> = {
  'port-hope': {
    quickAnswer:
      "Harris Boat Works is about 30 minutes north of Port Hope, in Gores Landing on the south shore of Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947. We rig and water-test every motor on Rice Lake, then you pick up at the shop. No shipping, no delivery. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'Most Port Hope customers we see are cottage owners. House in town, boat at a Rice Lake cottage, a hull they have owned for years and want to keep. The repower question is almost always whether the boat is worth another fifteen seasons, and for a sound hull the answer is usually yes.',
    heroImage: '/lovable-uploads/locations-port-hope-hero.png',
    heroAlt: 'Mercury repower near Port Hope, Ontario, at Harris Boat Works on Rice Lake.',
  },
  bewdley: {
    quickAnswer:
      "Harris Boat Works is about 15 minutes east of Bewdley, on the same Rice Lake your boat already runs. We're a Mercury Premier Dealer, family-owned since 1947. Every motor is rigged and water-tested on Rice Lake, then picked up in Gores Landing. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'We have rigged a lot of Bewdley boats over the years, and they share a pattern: mid-range power, shallow-water props, west-end Rice Lake use. Because we run the same lake, the water test is not a formality. It is the same chop and weed your boat sees every weekend.',
    heroImage: '/lovable-uploads/locations-bewdley-hero.png',
    heroAlt: 'Mercury repower for Bewdley boaters, west-end Rice Lake, Ontario.',
  },
  'gores-landing': {
    quickAnswer:
      "Harris Boat Works is the village marina in Gores Landing, at 5369 Harris Boat Works Rd on the south shore of Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947. For locals the trip is a short drive or a walk. Every motor is water-tested on Rice Lake before pickup. A full repower typically runs $11,000-$40,000 CAD.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'We have repowered boats for our Gores Landing neighbours for three generations. The conversation is short because we usually know the boat, and often the last motor we put on it. Local or not, every motor still gets the same Rice Lake water test before it goes home.',
    heroImage: '/lovable-uploads/locations-gores-landing-hero.png',
    heroAlt: 'Harris Boat Works, the village marina in Gores Landing, Ontario, on Rice Lake.',
  },
  roseneath: {
    quickAnswer:
      "Harris Boat Works is about 15 minutes west of Roseneath, on the same Rice Lake your boat already runs. We're a Mercury Premier Dealer, family-owned since 1947. Every motor is rigged and water-tested on Rice Lake, then picked up in Gores Landing. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'East-end Rice Lake boats come to us with a recognizable profile: runabouts and aluminum hulls, a lot of Trent-direction running. The detail that matters most on these is the prop. A boat that lives at the east end wants a different pitch than one based west, and that call happens in the quote.',
    heroImage: '/lovable-uploads/locations-roseneath-hero.png',
    heroAlt: 'Mercury repower for Roseneath boaters, east-end Rice Lake, Ontario.',
  },
  hastings: {
    quickAnswer:
      "Harris Boat Works is 25 to 30 minutes from Hastings, around Rice Lake to Gores Landing. We're a Mercury Premier Dealer, family-owned since 1947, and we work with a lot of Trent-Severn boaters. Every motor is water-tested on Rice Lake before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'Hastings boats that come through our shop are usually Trent-system workers. Real annual hours, lift-lock runs, load. For that kind of use we steer the conversation toward torque and fuel range over top-end numbers, because that is what holds up over a long season.',
    heroImage: '/lovable-uploads/locations-hastings-hero.png',
    heroAlt: 'Mercury repower for Hastings, Ontario boaters on the Trent-Severn Waterway.',
  },
  lakefield: {
    quickAnswer:
      "Harris Boat Works is about 45 minutes south of Lakefield, in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947, and we handle bigger Stony Lake hulls regularly. Every motor is water-tested on Rice Lake before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'Lakefield and Stony Lake boats run heavier than the Rice Lake average. Bigger fiberglass, larger pontoons, more big-block and Pro XS V8 repowers. We are straight about the drive and straight about lead times, especially on special-order Verado.',
    heroImage: '/lovable-uploads/locations-lakefield-hero.png',
    heroAlt: 'Mercury repower for Lakefield, Ontario boaters near Stony Lake.',
  },
  bridgenorth: {
    quickAnswer:
      "Harris Boat Works is about 40 minutes south of Bridgenorth, in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947, and Chemong Lake pontoons are a core part of our repower work. Every motor is water-tested on Rice Lake before pickup. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'Bridgenorth customers are Chemong Lake regulars, and Chemong is pontoon country. We have written a lot of those quotes. The boats reward easy manners over raw speed: clean starting, smooth cruising, enough torque with a full crew, and we prop for exactly that.',
    heroImage: '/lovable-uploads/locations-bridgenorth-hero.png',
    heroAlt: 'Bridgenorth Mercury repower, Chemong Lake pontoons.',
  },
  lindsay: {
    quickAnswer:
      "Harris Boat Works is about 60 minutes east of Lindsay, in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947, serving boaters across Sturgeon, Scugog, and Cameron. Every motor is water-tested on Rice Lake before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'Lindsay customers usually boat more than one lake. Sturgeon, Scugog, Cameron, and Balsam all see Lindsay traffic. That is why the prop call matters. We set it for the water the boat actually lives on, not a stock recommendation, even though the test run happens on Rice Lake.',
    heroImage: '/lovable-uploads/locations-lindsay-hero.png',
    heroAlt: 'Lindsay Mercury repower for Kawartha Lakes boaters.',
  },
  bobcaygeon: {
    quickAnswer:
      "Harris Boat Works is about 75 minutes south of Bobcaygeon, in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947, serving the Pigeon, Sturgeon, and Buckhorn corridor. Every motor is water-tested on Rice Lake before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'Bobcaygeon is destination boating country, and the boats reflect it. Mid-to-large repowers, performance pontoons, bigger fiberglass on Pigeon and Sturgeon. For a boat that is central to the cottage week, customers tell us the drive to a real water test is worth it.',
    heroImage: '/lovable-uploads/locations-bobcaygeon-hero.png',
    heroAlt: 'Bobcaygeon Mercury repower on the Pigeon-Sturgeon-Buckhorn corridor.',
  },
  buckhorn: {
    quickAnswer:
      "Harris Boat Works is about 70 minutes south of Buckhorn, in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947, and we repower a lot of northern Kawartha cottage boats. Every motor is water-tested on Rice Lake before pickup. No shipping. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'A lot of our Buckhorn customers are second- and third-generation cottagers repowering boats that live on-site, not on trailers. For boats that are part of the place, reliability and season-long confidence carry more weight than the sticker, and that shapes which Mercury we recommend.',
    heroImage: '/lovable-uploads/locations-buckhorn-hero.png',
    heroAlt: 'Buckhorn Mercury repower for northern Kawartha cottage boats.',
  },
  'northumberland-county': {
    quickAnswer:
      "Harris Boat Works is the Mercury Premier repower shop we run in Northumberland County, in Gores Landing on Rice Lake. We're a Mercury Premier Dealer, family-owned since 1947, and most of the county is within 30 minutes of our dock. Every motor is water-tested on Rice Lake before pickup. A full repower typically runs $11,000-$40,000 CAD. Build a quote at mercuryrepower.ca.",
    lastReviewed: '2026-05-24',
    whatWeSeeAtHBW:
      'Most of what we see is Rice Lake boats, because that is the county home water and ours. The mix runs from tiller tinnies to loaded pontoons. Wherever in the county a customer is, the repower lands in one place: rigged, tested on Rice Lake, picked up in Gores Landing.',
    heroImage: '/lovable-uploads/locations-northumberland-county-hero.png',
    heroAlt: 'Northumberland County Mercury repower at Harris Boat Works, Gores Landing.',
  },
};
