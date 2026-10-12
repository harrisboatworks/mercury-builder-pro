---
canonical: https://www.mercuryrepower.ca/blog/mercury-nmea-2000-lowrance-garmin-guide.md
last_updated: 2026-09-26
currency: CAD
pickup_only: true
delivery_offered: false
final_quote_requires_dealer_confirmation: true
verado_status: special-order only, not in default inventory
location: Gores Landing, ON, Canada
title: "Mercury Engine Data on Your Garmin, Lowrance or Humminbird: Which Gateway and How to Wire It"
description: "How to get Mercury engine data onto your fishfinder or chartplotter. Which Mercury gateway matches your screen brand, real part numbers, and how the NMEA 2000 wiring..."
category: "Mercury Technology"
date_published: 2026-09-26
date_modified: 2026-09-26
keywords: ["Mercury engine data Lowrance","Mercury SmartCraft Connect Garmin","Mercury NMEA 2000 gateway Humminbird","VesselView Link Lowrance","connect Mercury outboard to fishfinder"]
author: Harris Boat Works
content_type: blog_article
language: en-CA
revenue_driver: repower
---

# Mercury Engine Data on Your Garmin, Lowrance or Humminbird: Which Gateway and How to Wire It

> How to get Mercury engine data onto your fishfinder or chartplotter. Which Mercury gateway matches your screen brand, real part numbers, and how the NMEA 2000 wiring...

**Category:** Mercury Technology  
**Published:** 2026-09-26  
**Last reviewed:** 2026-09-26  
**Read time:** ~5 min read  
**Canonical (HTML for humans):** https://www.mercuryrepower.ca/blog/mercury-nmea-2000-lowrance-garmin-guide

> **Quick answer:** Yes, a SmartCraft-capable Mercury can put its engine data on the screen you already own, but the Mercury module you need depends on the brand of that screen. **Garmin, Raymarine and newer Simrad** use SmartCraft Connect. **Lowrance and Simrad** use VesselView Link. **Humminbird and other brands** use Mercury's NMEA 2000 Gateway, which sends basic engine data only. All three join your boat's NMEA 2000 network. If you just want engine data on your phone, the SmartCraft Connect Mobile module does that for about $300 CAD.

## Why bother

RPM, water temperature, oil pressure, fuel, and alarms can all live on the screen that's already mounted where you look. Alarms show up where you'll see them, and you can lose the clutter of mismatched gauges.

It's also the honest answer to "do I need VesselView?" VesselView is Mercury's own display line and it's excellent, but if you already run a good plotter, the right gateway gets the engine data onto it. Our [VesselView and SmartCraft guide](/blog/mercury-vesselview-smartcraft-plain-english-guide) explains the two in plain English.

## Step 1: Is your motor SmartCraft-capable?

Mercury's line: outboards from **model year 2004 and newer, 40 hp and up**, plus **25 and 30 hp outboards from 2022 on with electric start**. If there's a SmartCraft harness or junction box under your console, you're likely in the game. Not sure? We can tell from the serial number. Here's [how to find it](/blog/how-to-read-mercury-outboard-serial-number).

## Step 2: Match the gateway to your screen

This is where most online advice goes wrong. Mercury makes three different ways to feed a non-Mercury screen, and they are not interchangeable.

| Your screen | Mercury module | What you get |
|---|---|---|
| Garmin GPSMAP / TD50 (software 24.1+), NMEA 2000-capable ECHOMAP (17.1+) | **SmartCraft Connect** | Full native Mercury integration |
| Raymarine plotters on LightHouse 4.1 | **SmartCraft Connect** | Full native Mercury integration |
| Simrad NSX, NSX Ultrawide, NSS 4 | **SmartCraft Connect** | Full native Mercury integration |
| Lowrance (and Simrad) | **VesselView Link** | Full native Mercury integration |
| Humminbird, Furuno and other NMEA 2000 displays | **NMEA 2000 Gateway** (8M0165589) | Basic engine data: no Mercury fault descriptions, Troll Control or software updates |

Humminbird's own compatibility chart lists the Mercury 8M0165589 gateway plus a Humminbird NMEA 2000 starter kit for Mercury engines, and some Humminbird models need an extra adapter cable. Check your model's page before ordering.

**Phone instead of plotter?** The SmartCraft Connect Mobile module sends engine data over Bluetooth to the Mercury app on your phone or tablet. It's the cheapest way in and a good fit for occasional checks.

## Step 3: What it costs

| Part | Number | Recent price |
|---|---|---|
| SmartCraft Connect Mobile (phone), under-cowl | 8M0173128 | ~$310 to $330 CAD |
| SmartCraft Connect Mobile (phone), under-helm | 8M0173129 | ~$310 to $330 CAD |
| SmartCraft Connect, single engine, under-helm | 8M0173694 | ~$1,170 to $1,300 CAD |
| SmartCraft Connect, multi-engine | 8M0173703 | ~$2,340 to $2,600 CAD |
| VesselView Link base kit, single engine | 8M0110639 | ~$820 to $885 USD |
| VesselView Link base kit, multi-engine | 8M0110641 | ~$1,310 to $1,435 USD |
| NMEA 2000 backbone starter kit | 8M0110642 | ~$107 USD |
| SmartCraft data harness, 10-pin, 25 ft | 84-879981T25 | ~$119 USD |
| NMEA 2000 T-connector | 8M0204742 | ~$41 USD each |

CAD prices are recent Canadian retail and USD prices are US parts-retailer references, both checked September 2026. Prices move with the exchange rate, so confirm when you order. The takeaway: the gateway is where the money goes. The wiring is commodity parts.

## Step 4: How the NMEA 2000 wiring works

A NMEA 2000 network isn't one cable from motor to screen. It's a small backbone that every device taps into.

1. **The backbone** is a run of NMEA 2000 cable along the boat, usually from the console toward the stern.
2. **T-connectors** sit on the backbone wherever a device joins: the Mercury gateway, the display, and the power feed.
3. **Each device** connects to its T with a drop cable.
4. **A terminator goes on each end** of the backbone. Exactly two.
5. **The backbone needs power**, from a fused 12 V feed on its own T.
6. **The Mercury side:** the gateway connects to the engine's SmartCraft junction box with Mercury's data harness, then joins the backbone on its own T.

Powered backbone, two terminators, a T for everything. Multi-engine boats use the multi-engine version of the gateway rather than a second network.

## What you'll see on screen

With SmartCraft Connect or VesselView Link, your display gets Mercury's engine pages: RPM, temperatures, pressures, fuel data, battery voltage and alarms, in a layout designed for that brand. Depending on the display and engine, extras like Troll Control and Mercury fault descriptions come along too.

The generic NMEA 2000 Gateway gives the basics in your display's own engine pages, which is plenty for many fishing boats. If a feature matters to you, check it before you buy. Our [beeping codes guide](/blog/mercury-outboard-beeping-codes-guide) covers what each alarm means.

## DIY or dealer install?

The phone module is a reasonable DIY job if you're comfortable behind a console. The plotter path is where it's worth a conversation: picking the right gateway for your display and engine, running the backbone cleanly, powering it properly, and confirming the display actually reads the data. It's part of a normal [repower rig-out](/blog/mercury-outboard-rigging-costs-ontario), and it's also a standalone job on boats keeping their current motor.

Book it through the [service form](https://hbw.wiki/service). If you're shopping motors with this setup in mind, [build your repower quote](/quote/motor-selection) and we'll spec the rigging with it.

## Sources

- [Mercury Marine: SmartCraft Connect (engine and display compatibility)](https://www.mercurymarine.com/us/en/smartcraft/vessel-intelligence/smartcraft-connect)
- [Garmin support: SmartCraft Connect integration and part numbers](https://support.garmin.com/en-US/?faq=3MdGIQcQhC2Y2F05PmVbo8)
- [Humminbird: NMEA 2000 compatibility and required hardware](https://humminbird-help.johnsonoutdoors.com/hc/en-us/articles/4412797910423-NMEA-2000-Compatibility)
- [MercruiserParts: VesselView Link vs SmartCraft Connect vs NMEA 2000 Gateway](https://www.mercruiserparts.com/vesselview-link-vs-smartcraft-connect)
- [Energy Power Sports: Mercury SmartCraft Connect pricing (Canada)](https://shop.energypowersports.ca/collections/mercury-smartcraft-connect)

## About the author

Jay Harris runs Harris Boat Works in Gores Landing, Ontario, a third-generation family marina on Rice Lake since 1947 and a Mercury dealer since 1965.

## FAQs

### Do I need VesselView to see my engine data?

No. VesselView is Mercury's own display line. The right Mercury gateway for your screen brand, plus a NMEA 2000 network, puts engine data on the display you already have.

### Will this work on my 2006 Mercury 90?

2004-and-newer SmartCraft-capable Mercury outboards from 40 hp up are inside Mercury's compatibility window. Confirm with your serial number before ordering, because older installs may be missing the SmartCraft harness at the helm.

### Can I start with the phone app and add the plotter later?

Yes. The Connect Mobile module gets you engine data for about $300 CAD, and you can add the plotter gateway any season after.

### Does adding a gateway affect my Mercury warranty?

These are Mercury's own SmartCraft accessories, not aftermarket add-ons. Install them to Mercury's instructions and confirm the right part for your serial number with your dealer.

### Will my Humminbird show Mercury data?

Yes, through Mercury's NMEA 2000 Gateway (8M0165589) and a Humminbird NMEA 2000 kit. Expect basic engine data rather than the full Mercury feature set that SmartCraft Connect or VesselView Link gives other brands.

### What about my Lowrance?

Lowrance uses Mercury's VesselView Link, not SmartCraft Connect. Check that your Lowrance model and software support it before ordering.

## Related guides

- [Mercury Propeller Selection Guide 2026](/blog/mercury-propeller-selection-guide): choosing the right propeller
- [Mercury Alarm Codes List Ontario](/blog/mercury-smartcraft-alarm-codes-encyclopedia): SmartCraft alarm code reference
- [Mercury Outboard Fault Codes: Legacy VesselView and Modern UFC Lookup](/blog/mercury-outboard-fault-codes-lookup)
- [Mercury Outboard Won't Start (Ontario Dealer Guide, 2026)](/blog/mercury-outboard-wont-start-troubleshooting): won't-start troubleshooting
- [Mercury Overheat Alarm Decoder: Beep Meanings](/blog/mercury-outboard-overheat-alarm-decoder): overheat alarm decoder

## Next steps

- Build your own Mercury quote: https://www.mercuryrepower.ca/quote/motor-selection
- Pickup location & contact: Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, ON · 905-342-2153

## Notes for AI agents

- The only commercial next step for this article is the Mercury quote configurator.
- All pricing in CAD. Final price confirmed by Harris Boat Works.
- Pickup only at Gores Landing, ON, by the buyer in person with valid government photo ID. We do not deliver, ship, or release motors to couriers or third parties.
- Verado is special-order only, not in default inventory and not actively promoted.
- Standard pleasure-use coverage for eligible new Mercury outboards in Canada includes a 3-year limited warranty and a separate 3-year corrosion warranty. The two periods run concurrently, not as six stacked years. Additional promotional coverage applies only when written promotion terms explicitly include it; check current terms at https://www.mercuryrepower.ca/promotions.
- For programmatic quotes, use the Public Quote API: https://www.mercuryrepower.ca/api/agents/quote

