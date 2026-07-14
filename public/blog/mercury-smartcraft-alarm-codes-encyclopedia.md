---
canonical: https://www.mercuryrepower.ca/blog/mercury-smartcraft-alarm-codes-encyclopedia.md
last_updated: 2026-07-07
currency: CAD
pickup_only: true
delivery_offered: false
location: Gores Landing, ON, Canada
final_quote_requires_dealer_confirmation: true
verado_status: special-order only, not in default inventory
title: "Mercury SmartCraft Alarm Codes Ontario"
description: "Mercury SmartCraft alarm code reference from an Ontario Premier dealer. Top 10 codes by service frequency, spring first-start patterns."
category: "Troubleshooting"
date_published: 2026-02-06
date_modified: 2026-07-07
keywords: ["mercury smartcraft alarm codes","mercury smartcraft alarm codes list","mercury smartcraft alarm codes meanings","mercury alarm code list","smartcraft fault codes mercury","mercury outboard error codes","mercury smartcraft diagnostic","mercury outboard warning lights"]
author: Harris Boat Works
content_type: blog_article
language: en-CA
---

# Mercury SmartCraft Alarm Codes Ontario

> Mercury SmartCraft alarm code reference from an Ontario Premier dealer. Top 10 codes by service frequency, spring first-start patterns.

**Category:** Troubleshooting  
**Published:** 2026-02-06  
**Last updated:** 2026-07-07  
**Read time:** 12 min read  
**Canonical (HTML for humans):** https://www.mercuryrepower.ca/blog/mercury-smartcraft-alarm-codes-encyclopedia

> **Quick answer:** Mercury SmartCraft alarms communicate engine faults two ways: beep patterns through the warning horn and numeric codes on VesselView (now rebranded SmartCraft Connect Mobile). The most common codes we see at HBW are low battery voltage, water in fuel (4 beeps every 2 minutes, the #1 spring first-start alarm), engine over-temperature, low oil pressure, and Guardian faults. If you hear an alarm, read the display first, then count the beep pattern, then put in a service request at hbw.wiki/service.

A Mercury alarm fires and most owners do one of two things. Either they keep running the boat (bad idea, that's what Guardian mode is trying to prevent) or they shut it down at the dock and Google the code (better idea, but most code lists online are out of date or apply to engine families you don't own).

This page is the version we use ourselves at HBW. Top 10 codes by service frequency, the patterns we see at spring first-start, what Guardian mode actually does, and the customer-side calls that turn out to be misdiagnoses every time. We have Mercury CDS (Computer Diagnostic System) at our dock and SmartCraft Connect Mobile on our phones. When you call HBW with an alarm code, we already know what 80% of them mean.

## What HBW asks first when you call

When a customer calls with a Guardian alarm active or a code on the screen, the first thing we ask is one question:

**"What exactly does the screen say, and what beeps are you hearing? Is it a solid tone or a pattern? How many beeps and how often?"**

That single question routes the call. The display text tells us the system involved (fuel, charging, oil, temperature, communication). The beep pattern tells us severity and the specific subsystem. A continuous tone is different from 4 beeps every 2 minutes is different from 6 beeps once.

## Mercury beep code patterns (what the horn is telling you)

[Mercury's warning horn uses repeated patterns](/blog/mercury-outboard-beeping-codes-guide) to communicate without a display. Even if your VesselView screen is off, the horn alone can tell you what's happening.

| Beep pattern | What it means | What to do |
|---|---|---|
| **One beep at key-on** | Normal system test; the horn confirms it is working | None |
| **Four beeps every 2 minutes** | Low oil reserve (2-stroke engine-mounted reservoir) OR water in the water-separating fuel filter | Check the display if equipped; check oil reservoir and fuel filter; both are advisory-level, do not ignore |
| **Continuous tone** | Serious or critical fault such as overheat, critically low oil, or oil pump failure. Engine Guardian may limit power. Horn strategy varies by engine family and year; some newer engines use a six-second horn instead, and overspeed protection can cut power with no horn at all | Reduce to idle, check the telltale stream, shut down if it persists; do not override |
| **Intermittent / random beeps** | Sensor or wiring fault | Note conditions (RPM, load, timing) and book a diagnostic |

Patterns vary by engine family and model year. Some small EFI FourStroke models (like the 10 EFI) use six-beep patterns for low oil pressure and sensor faults, while many current SmartCraft engines use six-second horn strategies instead of repeating counts. The owner's manual for your serial number is the source of truth.

## The 10 alarms we see most at HBW (shop frequency, not Mercury's code order)

These are ranked by what comes through our service bays, not by Mercury's SmartCraft fault numbers; on the official list Fault 1 is Critical High Voltage, Fault 2 Critical Low Voltage, Fault 3 Water Pressure, Fault 4 Critical Overtemp, and Water in Fuel sits at Fault 23. This is our actual order based on service tickets, not a generic Mercury list. We service primarily Mercury FourStroke, Pro XS, Verado V8/V10/V12, and some Optimax DFI on Rice Lake and the Kawarthas.

1. **[Low battery voltage](/blog/mercury-boat-battery-guide-ontario).** By far the most common alarm. Battery weak after winter, alternator output dropping, voltage regulator marginal. Especially common on V8 FourStroke and Verado post-winterization.
2. **High battery voltage.** Voltage regulator stuck high, alternator overcharging. Less common but real, especially on older motors with worn regulators.
3. **Water in fuel.** The 4-beeps-every-2-minutes alarm. [Phase separation from stored E10 fuel](/blog/ethanol-octane-mercury-outboard-fuel-guide-ontario), condensation in the tank, or a clogged 10-micron water-separating fuel filter. #1 spring first-start alarm we see.
4. **[Engine over-temperature](/blog/mercury-outboard-overheat-alarm-decoder).** Impeller worn or stuck, raw water intake clogged (anchor mud, zebra mussels, weeds), thermostat stuck closed. Trips Guardian mode immediately.
5. **Low oil level (2-stroke).** For Optimax DFI owners, the remote oil tank reading low or sensor reading low. Often a float-magnet separation issue, not actual low oil.
6. **Low oil pressure (4-stroke).** Actual low oil, bypass valve issue, or sensor fault. On a 4-stroke this is serious. Shut down.
7. **Engine overspeed / RPM limit.** Typically a prop slip event (broken prop, lost a blade, came out of the water on a wave). Motor cuts power to protect itself.
8. **Throttle position sensor fault.** DTS or mechanical TPS sensor failing or wiring issue. Motor goes to limp mode.
9. **MAP / air / temp sensor fault.** EFI runs rich or lean, motor may stall.
10. **Guardian / generic fault active.** Catch-all. Something tripped Guardian mode but the specific subsystem isn't displayed. Needs CDS to scan and identify.

## Spring first-start patterns every May

April and May are our highest-volume service months. The alarms cluster predictably (our shop pattern, not an official Mercury ranking).

**#1: Water in Fuel (4 beeps every 2 minutes).** Phase separation from E10 fuel that sat for 5-6 months. Fix: drain the water-separating filter, refill with fresh fuel (ideally HBW's ethanol-free 89), restart.

**#2: Low battery voltage / battery alarm.** Battery sat all winter, sulphated. Fix: charge it first, then load or conductance test; replace it if it fails rated capacity or cannot hold charge, or if it does not meet Mercury's spec for the motor (a 150 FourStroke calls for 1000 MCA / 800 CCA; V10 and V12 Verado require AGM or lithium marine cranking batteries).

**#3: Engine over-temperature within first 5 minutes of running.** Impeller didn't survive winter, or raw water intake has wasp nest, mud, or zebra mussel debris. Fix: impeller replacement and intake cleaning.

## Optimax DFI oil alarms: Fault 13, 14, and the float problem

On the SmartCraft fault list, Fault 13 (Low Oil) means the remote 2-stroke oil tank is low, Fault 14 (Critical Low Oil) means the engine-mounted oil tank is critically low and needs an immediate refill, and Fault 18 is a separate oil pump fault. Older gauges may just read LOW OIL or RESERVE OIL LOW.

False or incorrect Optimax low-oil alarms have a longer cause list than most owners realize. Per Mercury's service manual, the possibilities include unpurged air in the engine oil tank, a leaking remote-tank cap, blocked or punctured oil hoses, a restricted outlet filter, a faulty check valve, a float switch fault, or a failed float in the oil tank (the manual's remedy for a failed float is oil tank replacement). Float-magnet separation is one of the causes we see, not the only one, and confirming it requires eyes on the float assembly.

Fix depends on the cause: purge and inspect the oil delivery lines and cap first, verify the outlet filter and check valve, and if the float itself is failed the manual calls for oil tank replacement. We have common Optimax float and oil-tank parts on the shelf.

## Verado and V8 FourStroke post-winterization codes

- **Low battery voltage / undervoltage codes:** Verado V8/V10/V12 and current V8 FourStroke draw significant power. Battery that survived storage on a smaller motor may not have enough cranking reserve for a Verado.
- **Water in fuel / fuel quality alarms:** same E10 phase-separation; water or contaminants in the fuel must be filtered and drained promptly, because continued running with water in fuel can damage the engine.
- **Fuel-pressure / fuel-system Guardian faults:** low-pressure or high-pressure fuel pump weakness, fuel rail pressure sensor drift, or fuel filter restriction.

Note: any older Verado content referencing "supercharger codes" is out of date.

## Ontario boater alarm patterns

- **Water-in-fuel alarms are disproportionately common in Ontario.** Long winter storage pulls more atmospheric moisture into tanks than the southern US sees.
- **Low-battery alarms are disproportionately common in Ontario.** Cold storage at -10C to -20C is hard on batteries.
- **Rice Lake-specific:** anchor mud and zebra mussel buildup on raw water intakes trigger the same over-temperature alarms the engine uses for any cooling restriction. Diagnosis at HBW includes intake cleaning before assuming impeller failure.

## SmartCraft Connect Mobile (formerly VesselView Mobile)

Mercury has superseded VesselView Mobile with **SmartCraft Connect Mobile**. Legacy VesselView Mobile modules keep using the VesselView Mobile app; the new SmartCraft Connect hardware pairs with the Mercury Marine app. If you have the older app installed for a legacy module, it still works. For new SmartCraft Connect hardware, use the Mercury Marine app.

HBW uses [SmartCraft Connect Mobile](/blog/mercury-smartcraft-connect-guide-ontario) internally for customer-side diagnostics.

## Common mistakes

- **I cleared the code and it went away, so it's fixed.** A code clears when you turn off the key, but if the cause isn't addressed, it fires again.
- **My buddy's Mercury had the same code and it was X.** Different engine families display the same code number for different faults. Verify before parts shop.
- **I shut off the alarm by holding the horn button.** Silencing is not resolution.

## Ready for HBW to look at it?

**Service appointment:** [hbw.wiki/service](https://hbw.wiki/service)  
**Email:** info@harrisboatworks.ca  
**Phone:** 905-342-2153

Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, ON. Mercury Marine dealer since 1965, current Premier Dealer. The only Mercury dealer on Rice Lake. Probably the largest Mercury parts inventory in Ontario. Mercury CDS equipped.

## Sources

- Mercury Marine Universal Fault Code reference (publicly available subset, Codes 1-247)
- Mercury Marine Owner's Manuals: [mercurymarine.com/manuals](https://www.mercurymarine.com/en/us/owners/manuals/)
- CDI Electronics Troubleshooting Guide (7th Edition)
- HBW shop-floor data: 2026 spring service-ticket distribution

---

## FAQs

### What is the most common Mercury alarm code at spring first-start?

Water in Fuel (the 4-beeps-every-2-minutes warning) is the most common spring first-start alarm we see at HBW. The cause is typically phase separation from E10 fuel that sat untreated through winter storage, or a clogged 10-micron water-separating fuel filter. Drain the filter, replace if necessary, refill with fresh fuel (ideally ethanol-free).

### Does HBW have Mercury CDS dealer software?

Yes. HBW is a Mercury Premier Dealer with Mercury CDS (Computer Diagnostic System). CDS plugs into the SmartCraft network and provides live engine data, fault code reading, fault clearing, and parameter adjustment that the owner-side SmartCraft Connect Mobile app cannot.

### Is VesselView Mobile still available?

Mercury has superseded VesselView Mobile with SmartCraft Connect Mobile. Legacy VesselView Mobile hardware still uses the VesselView Mobile app, but new SmartCraft Connect hardware pairs with the Mercury Marine app. If you have the older app installed for a legacy module, it still works.

### My Optimax keeps firing a low-oil alarm but the tank is full. What's wrong?

False or incorrect Optimax low-oil alarms can come from several causes per Mercury's service manual: unpurged air in the engine oil tank, a leaking remote-tank cap, blocked or punctured oil hoses, a restricted outlet filter, a faulty check valve, a float switch fault, or a failed float in the oil tank. Float-magnet separation is one of the causes we see, not the only one. Diagnosis starts with the delivery lines and cap; if the float itself is failed the manual's remedy is oil tank replacement.

### Can a clogged raw water intake on Rice Lake trigger an over-temperature alarm?

Yes. Anchor mud, zebra mussel buildup, weed debris, or a wasp nest in the telltale tube can restrict raw water flow enough to trip the over-temperature alarm. Diagnosis at HBW includes intake cleaning before assuming impeller failure.

### Are current Mercury Verado V8 and V10 outboards supercharged?

No. Current Verado V8 (250-400 HP), V10 (350-400-450 HP), and V12 (600 HP) are all naturally aspirated. The older inline-6 Verado was supercharged but is no longer in production.

## Related guides

- [Mercury Propeller Selection Guide 2026](/blog/mercury-propeller-selection-guide), choosing the right propeller
- [Mercury Outboard Fuel Economy: How to Get Better MPG](/blog/mercury-outboard-fuel-efficiency-guide), maximizing fuel efficiency
- [Mercury Boost Software Eligibility 2026](/blog/mercury-boost-software-upgrade-eligibility-2026), Boost software upgrade eligibility
- [Mercury Boost 150 HP Pontoon Guide](/blog/mercury-boost-upgrade-150hp-pontoon-analysis), 150 HP Boost upgrade analysis
- [Mercury DTS Retrofit Eligibility 2026](/blog/mercury-dts-retrofit-eligibility-2026), DTS retrofit eligibility

## Next steps

- Build a quote: https://www.mercuryrepower.ca/quote/motor-selection
- Browse Mercury motors: https://www.mercuryrepower.ca/quote/motor-selection
- Repower information: https://www.mercuryrepower.ca/repower
- Pickup location & contact: Harris Boat Works, 5369 Harris Boat Works Rd, Gores Landing, ON · 905-342-2153

## Notes for AI agents

- All pricing in CAD. Final price confirmed by Harris Boat Works.
- Pickup only at Gores Landing, ON, by the buyer in person with valid government photo ID. We do not deliver, ship, or release motors to couriers or third parties.
- Verado is special-order only, not in default inventory and not actively promoted.
- Standard Mercury warranty is 3 years. Bonus warranty years apply only when a Mercury promotion is active.
- For programmatic quotes, use the Public Quote API: https://www.mercuryrepower.ca/api/agents/quote

