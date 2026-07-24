---
canonical: https://www.mercuryrepower.ca/blog/mercury-outboard-fault-codes-lookup.md
last_updated: 2026-07-24
currency: CAD
pickup_only: true
delivery_offered: false
location: Gores Landing, ON, Canada
final_quote_requires_dealer_confirmation: true
verado_status: special-order only, not in default inventory
title: "Mercury Outboard Fault Codes: Legacy VesselView and Modern UFC Lookup"
description: "Search documented Mercury fault codes by format and engine family, including legacy VesselView IDs and the current V6/V8 UFC table reviewed against 2025-2026 dealer..."
category: "Troubleshooting"
date_published: 2026-07-23
date_modified: 2026-07-24
keywords: ["mercury outboard fault codes","mercury fault code list","mercury smartcraft fault codes","mercury vesselview fault codes","mercury universal fault codes","mercury outboard error codes","mercury ufc codes"]
author: Harris Boat Works
content_type: blog_article
language: en-CA
---

# Mercury Outboard Fault Codes: Legacy VesselView and Modern UFC Lookup

> Search documented Mercury fault codes by format and engine family, including legacy VesselView IDs and the current V6/V8 UFC table reviewed against 2025-2026 dealer...

**Category:** Troubleshooting  
**Published:** 2026-07-23  
**Last updated:** 2026-07-24  
**Read time:** 27 min read  
**Canonical (HTML for humans):** https://www.mercuryrepower.ca/blog/mercury-outboard-fault-codes-lookup

> **Quick answer:** Search the complete code shown on your display, then confirm that the result matches your engine family. A single number or text label may come from Mercury's March 2007 legacy VesselView list. A two-part number such as **621-5** is a Universal Fault Code, or UFC, that must be matched to the correct engine-family publication. This page includes all 130 UFC pairs in Mercury's December 2025 diagnostic manual for the covered 3.4L V6 and 4.6L V8 platform, plus the limited-application **3043-6** code added in May 2026 and a clearly labelled legacy VesselView reference. It is not a universal list for every Mercury outboard.

If the display shows low oil pressure, oil-pump failure, an active overheat, fuel leakage or overflow, loss of steering, or a gear that does not match the control command, skip the lookup and follow the stop-now guidance below. If the table does not resolve the alert, take the photo and serial number to your local authorized Mercury dealer. If you can bring the boat to HBW in Gores Landing, submit that record at [hbw.wiki/service](https://hbw.wiki/service) so we can prepare for an in-shop diagnosis. HBW does not diagnose fault codes remotely.

This is the code-number companion to our [Mercury beep and alarm guide](/blog/mercury-outboard-beeping-codes-guide). The horn tells you the alert class on supported systems; the screen identifies the actual fault. Both strategies vary by engine family and year.

**Reference status:** HBW last checked this lookup on **July 24, 2026** against Mercury diagnostic publication **90-8M0237508, December 2025**, current MercNET literature results, and Mercury's **May 2026 V6/V8 fault-code update**. The earlier 2021 manual used the same 130 pairs, but its page references are now obsolete.

## Before You Use Either Table

- **Photograph the whole alert first.** Capture both numbers, all text, the affected engine, engine hours, and whether the display calls it active or history.
- **Use the serial number.** Mercury fault support changes by PCM calibration, model, year, controls, and connected modules. The exact Owner's Manual remains the operator authority.
- **Treat the named circuit as a clue, not a parts order.** A sensor code can be caused by the sensor, wiring, supply voltage, connector, or the condition being measured.
- **Do not combine the two tables.** A single legacy ID and a modern two-part UFC are different systems.
- **Do not use a truck-code database.** Use the product-specific Mercury table for the full pair shown on your display.
- **Do not order a part from the code name.** The table identifies the monitored circuit or condition. Diagnosis still has to separate the component, wiring, connector, supply voltage, calibration, and the physical condition being measured.

## Which Mercury Code Format Are You Seeing?

| What the display shows | Start here | Important scope |
|---|---|---|
| Text such as **Water in Fuel** or a single number such as **23** | Legacy VesselView table | Mercury 90-898279, March 2007; mixed product, calibration-dependent |
| Two numbers separated by a dash, such as **621-5** | Modern V6/V8 UFC table | Mercury 90-8M0237508, December 2025, plus May 2026 dealer update; only the covered V6/V8 applications |
| Horn only, with no code display | [Mercury beep and alarm guide](/blog/mercury-outboard-beeping-codes-guide) | Horn patterns vary by family, year, and rigging |
| Plain-language alert in the Mercury Marine app | Record the exact text and any number | SmartCraft Connect Mobile shows live data and fault notifications; it does not replace serial-specific service data |

## Modern UFC Table: Current 3.4L V6 and 4.6L V8 Reference

This table is scoped to Mercury diagnostic publication **90-8M0237508, December 2025**, Section 4A. Its Models Covered page lists these as 2018-and-newer PCM 112 applications; the publication cover starts at serial number **2B529482**:

- V6: 150R, 175, 175 Pro XS, 200, 200 SeaPro, 200R, and 225
- V8: 200 Pro XS; 225 Pro XS and SeaPro; 250, 250 Pro XS, 250 SeaPro, and 250R; 300, 300 Pro XS, 300 SeaPro, and 300R

Not every listed pair applies to every model, PCM calibration, midsection, gearcase, or control configuration. The table identifies the documented component or condition; it does not replace Mercury's official action, causes, tests, or repairs.

The **4A** references below are the printed Section 4A page numbers inside the December 2025 diagnostic manual, not the PDF viewer's page count. Mercury's public owner-manual lookup provides operator manuals by serial number. The diagnostic publication is dealer service literature, so this page names it for context but does not offer it as a download.

| UFC pair(s) | Documented component or condition | Reference location |
|---|---|---|
| 101-16 / 102-16 / 103-16 / 104-16 | Ignition circuits 1-4: PCM output-control fault | 4A-3 to 4A-8 |
| 201-16 / 202-16 / 203-16 / 204-16 / 205-16 / 206-16 / 207-16 / 208-16 | Fuel-injector circuits 1-8: PCM output-control fault | 4A-10 to 4A-19 |
| 301-24 / 301-25 | Throttle-position sensor A input above or below valid limit | 4A-20 to 4A-21 |
| 302-24 / 302-25 | Throttle-position sensor B input above or below valid limit | 4A-23 to 4A-24 |
| 311-6 | Throttle-position sensors A and B faulted | 4A-26 |
| 331-6 | Throttle-position sensors A and B disagree | 4A-27 |
| 341-6 / 342-6 | Throttle-position sensor A or B adaptation fault | 4A-29 to 4A-30 |
| 401-24 / 401-25 | Time-sampled manifold-pressure input above or below valid limit | 4A-32 to 4A-33 |
| 402-24 / 402-25 | Angle-sampled manifold-pressure input above or below valid limit | 4A-34 to 4A-35 |
| 404-6 / 405-6 | Manifold-pressure and throttle-position signals disagree | 4A-36 to 4A-37 |
| 407-17 | Manifold-pressure barometric reading outside expected range | 4A-39 |
| 431-21 | Oil pressure below the specified threshold | 4A-40 |
| 431-24 / 431-25 | Oil-pressure sensor input above or below valid limit | 4A-41 to 4A-42 |
| 511-24 / 511-25 | Intake-air-temperature input above or below valid limit | 4A-43 to 4A-44 |
| 521-20 | Starboard engine-coolant temperature above normal | 4A-45 |
| 521-24 / 521-25 | Starboard coolant-temperature sensor input above or below valid limit | 4A-46 to 4A-47 |
| 531-24 / 531-25 | Oil-temperature sensor input above or below valid limit | 4A-48 |
| 572-24 / 572-25 | Bank 1 exhaust-gas-temperature sensor input above or below valid limit | 4A-49 to 4A-50 |
| 601-4 / 601-5 | Sensor-supply voltage A higher or lower than expected | 4A-51 to 4A-53 |
| 602-4 / 602-5 | Sensor-supply voltage B higher or lower than expected | 4A-55 to 4A-56 |
| 603-4† / 603-5† | Sensor-supply voltage C higher or lower than expected | 4A-57 to 4A-58; May 2026 update |
| 621-4 | Valid system voltage higher than expected | 4A-59 |
| 621-5 | Valid system voltage lower than expected | 4A-60 |
| 711-6 | Oil-level sensor fault | 4A-61 |
| 711-12 | Oil-level sensor invalid or disabled under present conditions | 4A-62 |
| 711-19 | Oil-level test could not run, so level could not be determined | 4A-63 |
| 711-24 | Oil-level sensor input above valid limit | 4A-63 |
| 713-21 | Crankcase oil level below the specified threshold | 4A-64 |
| 821-1 / 821-27 | Wideband oxygen-sensor output circuit open/high resistance or short/low resistance | 4A-65 to 4A-66 |
| 822-4 / 822-5 / 822-16 | Wideband oxygen-sensor heater high, low, or output-control fault | 4A-68 to 4A-70 |
| 902-4 / 902-5 | Port short-term fuel-trim correction higher or lower than expected | 4A-72 |
| 1012-24 / 1012-25 | Engine trim-position input above or below valid limit | 4A-73 to 4A-74 |
| 1021-24 / 1021-25 | Shift-actuator position sensor A input above or below valid limit | 4A-75 to 4A-77 |
| 1023-24 / 1023-25 | Shift-actuator position sensor B input above or below valid limit | 4A-78 to 4A-80 |
| 1024-6 | Shift-actuator position sensors A and B disagree | 4A-81 |
| 1025-6 | Both shift-actuator position sensors faulted | 4A-82 |
| 1051-23 | Camshaft synchronization state fault | 4A-84 |
| 1052-6 | Crankshaft or camshaft trigger fault | 4A-85 |
| 1061-24 / 1061-25 | Mechanical throttle-demand sensor A input above or below valid limit | 4A-86 to 4A-88 |
| 1062-24 / 1062-25 | Mechanical throttle-demand sensor B input above or below valid limit | 4A-89 to 4A-90 |
| 1063-24 / 1063-25 | Mechanical shift-demand sensor A input above or below valid limit | 4A-92 to 4A-93 |
| 1064-24 / 1064-25 | Mechanical shift-demand sensor B input above or below valid limit | 4A-94 to 4A-96 |
| 1071-6 / 1072-6 | Mechanical throttle-demand sensor A or B adaptation fault | 4A-97 to 4A-98 |
| 1073-6 | Mechanical throttle-demand sensors A and B disagree | 4A-100 |
| 1074-6 | Both mechanical throttle-demand sensors faulted | 4A-101 |
| 1077-6 | Mechanical shift-demand sensors A and B disagree | 4A-102 |
| 1078-6 | Both mechanical shift-demand sensors faulted | 4A-104 |
| 1108-25 | Water detected in the fuel system | 4A-105 |
| 1109-23 | Emergency-stop circuit active | 4A-106 |
| 2011-23 | Engine Guardian active and limiting power | 4A-107 |
| 2021-23 | Guardian active because of oil temperature | 4A-108 |
| 2032-23 | Guardian active because of exhaust-system temperature | 4A-109 |
| 2051-23 | Guardian active because of low oil pressure | 4A-110 |
| 2081-23 | Guardian active because of engine overheat | 4A-111 |
| 2091-23 | Guardian active because of excessive engine speed | 4A-112 |
| 2092-23 | Engine speed above its neutral limit | 4A-113 |
| 2101-23 | Guardian active because the helm module requested a power limit | 4A-114 |
| 2111-23 | Guardian active because of battery voltage | 4A-114 |
| 2124-20 | Exhaust-manifold temperature above normal | 4A-115 |
| 3002-16 | Active-exhaust-valve output-control fault | 4A-116 |
| 3012-6 / 3013-6 / 3014-6 | Electronic throttle lost control, has an output fault, or is sticking | 4A-117 to 4A-120 |
| 3031-6† / 3032-6 | Electronic shift commanded position differs from actual position, or control is lost | 4A-121 to 4A-123; 3031-6 updated May 2026 |
| 3033-6† / 3034-6† | Electronic shift could not adapt in reverse or forward | 4A-124 to 4A-126; May 2026 update |
| 3037-6 | Electronic shift control timed out | 4A-127 |
| 3039-23 | Reverse gear unavailable; a reverse command may produce forward gear | 4A-129 |
| 3043-6† | Electronic shift actuator overtravel detected; dealer diagnosis required | May 2026 update; limited single-engine V8 application |
| 3049-16 | Hydraulic-shift output-control fault | 4A-130 |
| 3061-16 | Fuel-pump output-control fault | 4A-132 |
| 3152-16 | Warning-horn output-control fault | 4A-133 |
| 3171-16 | Starter output-control fault | 4A-134 |
| 3181-16 / 3182-16 | Trim-up or trim-down output-control fault | 4A-135 to 4A-137 |
| 4001-6 / 4002-6 / 4003-6 | Demand, shift, or helm-module crosscheck fault | 4A-139 to 4A-141 |
| 4004-6 | CAN X document 1 state-of-health fault | 4A-141 |
| 4005-6 | CAN P document 2 state-of-health fault | 4A-142 |
| 4006-6 / 4007-6 / 4008-6 / 4009-6 | CAN P or CAN X document state-of-health fault | 4A-143 to 4A-145 |
| 4010-6 | CAN X document 11 state-of-health fault | 4A-146 |
| 4011-23 | CAN-bus authentication timeout | 4A-146 |
| 4012-6 | CAN P and CAN X state-of-health faults | 4A-147 |
| 4013-23 | Watchdog active | 4A-148 |
| 4014-6 / 4016-6 | Watchdog-module or watchdog-data crosscheck fault | 4A-148 to 4A-149 |
| 4501-23 | Security device missing | 4A-150 |
| 4502-23 | Security system locked | 4A-150 |
| 4503-23 | Security system in setup mode | 4A-151 |
| 4602-23 | Low system voltage blocking other fault evaluation | 4A-151 |

The December 2025 manual contains **130 UFC pairs**. Mercury's May 2026 dealer update adds **3043-6** for a limited single-engine V8 application, bringing this current scoped lookup to **131 searchable pairs**. The older 2018 and 2021 versions list the same original 130 pairs; the 2018 version also shows **0-0** as a no-active-fault sentinel. Do not count 0-0 as an enabled fault or apply this table to a different Mercury family.

### What Changed in May 2026

The dagger-marked pairs have newer dealer guidance:

- **603-4, 603-5, 3031-6, 3033-6, and 3034-6** require assessment with current Mercury dealer software and PCM calibration information.
- **3043-6** is a newer electronic-shift overtravel code for a limited single-engine V8 configuration. It is not a universal V8 fault and it is not, by itself, a direction to replace the shift actuator.
- On multiple-engine boats and jet conversions, whether 3043-6 should be active depends on configuration. That is a dealer-software check, not an owner reset.

This page publishes the owner-visible code and safe context. It does not reproduce Mercury's restricted dealer procedure, configuration credentials, or repair workflow.

## What the UFC Suffix Means in This V6/V8 Publication

The number after the dash describes how the named component, value, or state failed. These short definitions are scoped to this publication; always interpret the complete pair.

| Suffix | Meaning in the scoped table |
|---:|---|
| 1 | Output circuit open or resistance too high |
| 4 | Valid value higher than expected |
| 5 | Valid value lower than expected |
| 6 | Device, calculation, adaptation, or process fault |
| 12 | Device invalid or disabled under present conditions |
| 16 | Output-control fault detected by the controller |
| 17 | Signal outside the expected range |
| 19 | Test could not run under present conditions |
| 20 | Temperature higher than normal |
| 21 | Value below a specified threshold |
| 23 | A documented state or condition exists |
| 24 | Sensor input above its valid limit |
| 25 | Sensor input below its valid limit |
| 27 | Input circuit shorted or resistance too low |

That is why **621-5**, not 621-25, is the low-system-voltage pair in this V6/V8 publication. The same suffix does not give you permission to invent a component meaning that is absent from the correct Mercury table.

## What If Your Two-Part Code Is Not Here?

Do not force a match. Other Mercury families, including 40-60hp FourStroke, 75-115hp FourStroke, 150hp FourStroke, OptiMax, inline-four and inline-six Verado, V10 Verado, V12 Verado, Jet, and Racing applications, have their own service data, serial breaks, modules, and calibrations.

Record the complete pair, every word on the display, and the engine serial number. A match on the first half alone is not enough: **621-4** and **621-5** monitor the same system-voltage value but describe opposite conditions. If the full pair is absent, use the serial-number-specific publication or take the record to an authorized Mercury dealer.

## Legacy VesselView Fault IDs: March 2007 Mixed-Product List

Mercury's VesselView operation manual **90-898279, March 2007**, printed a single-number fault list through 247. Mercury's own note is the most important part: the displayed faults are determined by PCM calibration, not every fault is used on every engine, the information was accurate at the printing date, and it could change.

This is not an outboard-only master list. It mixes outboard, MerCruiser, DTS, diesel or transmission, drive-lube, hydraulic-shift, and legacy supercharged-Verado items. The grouped descriptions below preserve the display-level meaning without inventing cylinder assignments where the VesselView manual only repeats a generic label.

| Legacy ID(s) | March 2007 display meaning | Scope note |
|---:|---|---|
| 1 | Critical high battery voltage | Mixed-product VesselView |
| 2 | Critical low battery voltage | Mixed-product VesselView |
| 3 | Low cooling-water pressure | Application-dependent |
| 4 | Compressor overtemperature | Legacy compressor-equipped application |
| 5-6 | Critical throttle-position control fault | DTS/application-dependent |
| 9 | Engine Guardian active; power limited | Root fault appears separately |
| 10-11 | Knock sensor or knock-prevention fault | Application-dependent |
| 12 | Low engine-oil pressure | Four-stroke/inboard application as equipped |
| 13 | Remote two-stroke oil tank low | Oil-injected two-stroke |
| 14 | Engine-mounted two-stroke oil tank critically low | Oil-injected two-stroke |
| 15-16 | Manifold absolute-pressure sensor fault | Application-dependent |
| 17 | Excess air in idle state | Application-dependent |
| 18 | Oil-pump fault | Oil-injected two-stroke |
| 19 | Engine overspeed | Application-dependent |
| 20-21 | Engine overtemperature | Application-dependent |
| 22 | Warning-horn output fault | Application-dependent |
| 23 | Water in fuel | Application-dependent |
| 24-35 | Direct/air injector fault; twelve generic entries | Legacy DFI display list; no cylinder mapping in this table |
| 36-37 | Water-pressure sensor fault | Application-dependent |
| 38 | Break-in strategy remaining | Legacy PCM strategy |
| 39-40 | Engine-air-temperature sensor fault | Application-dependent |
| 41-42 | Air-compressor-temperature sensor fault | Compressor-equipped application |
| 43-54 | Ignition-coil fault; twelve generic entries | Cylinder mapping depends on service data |
| 59-70 | Fuel-injector fault; twelve generic entries | Cylinder mapping depends on service data |
| 75-76 | Fuel-level sender fault | Vessel/tank input |
| 77 | Crank/cam encoder fault | Application-dependent |
| 78-79 | Jack-plate position sensor fault | Boats equipped with jack plate input |
| 80 | Critical main-power-relay fault | Application-dependent |
| 81 | Main-power-relay backfeed | Application-dependent |
| 82-83 | Oil-tank level sensor fault | Oil-tank-equipped application |
| 84-85 | Engine-oil-pressure sensor fault | Application-dependent |
| 89-90 | Engine-oil-temperature sensor fault | Application-dependent |
| 91 | Engine-oil temperature high | Application-dependent |
| 92 | Paddle-wheel speed sensor fault | Vessel sensor |
| 93-94 | Pitot/speed-pressure sensor fault | Vessel sensor |
| 95-96 | Coolant-temperature sensor fault | Application-dependent |
| 97-98 | Trim-tab position sensor fault | Trim-tab-equipped vessel |
| 99-100 | Trim-tab controller fault | Trim-tab-equipped vessel |
| 101 | Critical SmartCraft communication fault | Network/application-dependent |
| 102 | SmartCraft communication fault | Network/application-dependent |
| 103 | Critical SmartCraft communication fault | Network/application-dependent |
| 104-105 | Seawater-temperature sensor fault | Vessel sensor |
| 106-108 | Critical shift-actuator fault | DTS/shift application |
| 109 | Shift-actuator fault | DTS/shift application |
| 110 | Shift-switch fault | Shift application |
| 111-112 | Coolant-temperature sensor fault | Application-dependent |
| 113-114 | Trim-tab sensor fault | Trim-tab-equipped vessel |
| 115-116 | Trim-tab control fault | Trim-tab-equipped vessel |
| 117 | Starter-solenoid/output fault | Application-dependent |
| 118-119 | Steering-angle sensor fault | Steering-equipped application |
| 120-131 | Throttle-position sensor fault; multiple channels | Application-dependent |
| 132 | Crankshaft-position sensor fault | Application-dependent |
| 133 | Critical low sensor-supply voltage | Application-dependent |
| 134-135 | Engine overspeed | Application-dependent |
| 136-137 | Boost-bypass valve fault | Legacy supercharged application |
| 138 | Engine-control-unit fault | Application-dependent |
| 148 | Shift-controller fault | DTS/shift application |
| 149 | Critical electronic-throttle-controller fault | Electronic throttle application |
| 150 | Critical SmartCraft communication fault | Network/application-dependent |
| 151 | Critical fuel-pump fault | Application-dependent |
| 152 | Idle-air-control valve fault | Application-dependent |
| 153 | Low drive-lube level | Sterndrive, not an outboard fault |
| 154 | Excessive calculated airflow | Application-dependent |
| 155-157 | Secondary manifold-pressure sensor fault | Application-dependent |
| 158-160 | Port exhaust-manifold temperature sensor fault or high temperature | Inboard/sterndrive application |
| 163 | Critical SmartCraft communication fault | Network/application-dependent |
| 169-170 | Engine-oil-pressure sensor fault | Application-dependent |
| 171-172 | Engine Guardian active; power limited | Root fault appears separately |
| 173-174 | Fuel pressure high or low | Application-dependent |
| 175 | Knock system not functioning | Application-dependent |
| 176 | Critical shift fault | Shift application |
| 177-179 | Starboard exhaust-manifold temperature sensor fault or high temperature | Inboard/sterndrive application |
| 180-183 | Throttle-position sensor fault or disagreement | Application-dependent |
| 184-185 | Trim relay fault | Trim-equipped application |
| 186-190 | Critical SmartCraft communication fault; multiple modules | Network/application-dependent |
| 191-192 | Tank 2 level sender fault | Vessel/tank input |
| 193-194 | Shift fault | Shift application |
| 195 | Thermostat fault | Application-dependent |
| 196 | Transmission overtemperature | Inboard/transmission application |
| 197-199 | Supercharger outlet-temperature sensor fault or high temperature | Legacy supercharged application |
| 200 | Boost-bypass valve fault | Legacy supercharged application |
| 201-203 | Engine-temperature sensor fault or overtemperature | Application-dependent |
| 204-206 | Block-temperature sensor fault or overtemperature | Application-dependent |
| 207-208 | Fuel-lift-pump fault | Application-dependent |
| 209 | Critical low engine-actuator voltage | Electronic-control application |
| 210 | Neutral overspeed | Electronic-control application |
| 211 | Reverse overspeed | Shift application |
| 212 | Start sequence aborted | Electronic-start application |
| 213 | Fuel overflow into vent system | Fuel-system application |
| 214 | Boost-bypass valve fault | Legacy supercharged application |
| 215-216 | Critical SmartCraft communication fault | Network/application-dependent |
| 217 | Low sensor-supply voltage | Application-dependent |
| 218 | Critical SmartCraft communication fault | Network/application-dependent |
| 219 | Shift command fault; control requested to neutral | DTS/shift application |
| 220 | Fuel overflow into vent system | Fuel-system application |
| 221 | Fuel-lift-pump float-switch fault | Fuel-system application |
| 222 | Fuel-lift-pump fault | Fuel-system application |
| 223-225 | Piston-cooling oil-jet pressure or sensor fault | Application-dependent |
| 226 | Critical SmartCraft communication fault | Network/application-dependent |
| 227-232 | Shift-pressure sensor fault | Hydraulic-shift application |
| 233 | Shift-system fault | Shift application |
| 234 | Shift pressure high | Hydraulic-shift application |
| 235 | Shift fault; control requested to neutral | Shift application |
| 236 | Emergency-stop circuit active | Application-dependent |
| 237 | Power limited by knock system | Guardian response |
| 238 | Overspeed in trailer position | Trim/engine application |
| 239 | Underwater impact detected | Application-dependent |
| 240 | Critical low battery voltage | Mixed-product VesselView |
| 241 | Charge-air temperature high | Legacy supercharged application |
| 242 | Fuel-purge-valve fault | Application-dependent |
| 243-244 | Trim-tab sensor fault | Trim-tab-equipped vessel |
| 245 | Shift-switch fault | Shift application |
| 246 | Power limited by supercharger overtemperature | Legacy supercharged application |
| 247 | Power limited by knock system | Guardian response |

If your single-number code is absent, do not fill a gap with a neighbouring meaning. Mercury left gaps in this printed list, and connected modules can generate alerts outside it.

## Stop-Now Conditions

The code table identifies the alert. What you observe determines the safest immediate response.

### Low Oil Pressure

Stop the engine. Check the oil level using the engine position and procedure in the serial-number-specific manual. If the level is correct or the warning persists, do not continue running. A sensor-circuit alert does not prove that actual oil pressure is safe.

### Two-Stroke Oil-Pump Fault

Stop and do not restart. Mercury's SC1000 documentation warns that an electrical oil-pump fault means lubricating oil is not being supplied.

### Fuel Leak or Fuel-Overflow Warning

Stop the engine and do not restart it. Keep smoking, flames, sparks, and other ignition sources away. Any sign of fuel leakage requires repair before further operation. Do not try to “head in” under engine power.

### Overheat or No Cooling-Water Flow

Reduce throttle immediately. When safe, shift to neutral and stop the engine. Inspect the cooling-water inlets only with the engine off. If water flow was absent or intermittent, or the warning remains after the checks allowed by your manual, do not continue running.

### DTS, Shift, Steering, or CAN Fault

Reduce power and follow the exact display instruction. Do not force the control or linkage, and do not assume neutral or reverse remains available. If indicated gear does not match the command, neutral cannot be confirmed, steering is affected, or a critical communication alert persists, stop as soon as safe and arrange assistance. Any restart procedure must be specific to that engine, control system, and fault.

### Voltage Warning

Turn off nonessential electrical loads and keep control of the boat. Touch battery connections only after key-off and electrical isolation. Do not universally raise RPM: some current systems can increase idle automatically during low voltage. If the alert is critical, Guardian is active, or throttle, shift, steering, or CAN operation is affected, stop safely and arrange assistance.

## Active Fault, Display History, and Module History Are Different

An **active fault** is present now. A **display history** is the alert list stored by that display. A supported engine module can also hold **diagnostic fault history and operating snapshots**, but the available record varies by module and fault.

Photograph the exact code and text, affected engine, hours, horn pattern, and operating conditions before dismissing or deleting anything. Clearing a VesselView display's archived history clears that display list. It must not be described as erasing the PCM record a technician may read with CDS G3.

Likewise, do not assume every stored fault includes the same freeze-frame data. Mercury's current CDS G3 material describes fault history and a last-30-fault list only where supported.

## How to Read the Alert on Common Mercury Displays

### VesselView 403

Select **View** or press **Enter** to open the alert details. History is under **Menu > Alarms**. The 403 manual says an active fault clears after the cause is repaired and the engine passes its startup scan; do not generalize that exact behaviour to every VesselView generation.

### VesselView 704

Open **Tiles > Alerts > Engine alerts**, then expand the alert for its description, severity, and code. Alert history is under **Settings > Alerts**. Closing the window is not an engine-module history clear.

### SC1000 System Tach

The descriptive fault view shows location, component, detail, corrective action, and additional faults through **MORE**, **ACTION**, and **NEXT** on supported systems. Do not use **Master Reset** to chase an engine fault; it restores gauge defaults and erases gauge setup and calibration.

### SmartCraft Connect Mobile and the Mercury Marine App

For fault work, the current app provides live engine data and fault notifications. Older VesselView Mobile hardware can also work with the current Mercury Marine app. The phone view does not replace CDS G3 module tests, adaptations, configuration, or serial-specific service information. See our [SmartCraft Connect Mobile guide](/blog/mercury-smartcraft-connect-guide-ontario).

### Dealer CDS G3

CDS G3 provides the supported module's diagnostic fault history, operating snapshots where available, state-of-health information, tests, configuration, and programming functions. It is the shop tool, not a reason to guess at a repair from a public table.

## What Helps the Shop Start Faster

If you can bring the boat to HBW in Gores Landing, collect the following before submitting a service request. If the boat cannot come here, take the same record to your local authorized Mercury dealer.

1. A clear photo showing the complete number and all display text.
2. The engine serial number and which engine is affected on a multi-engine boat.
3. Engine hours and whether the display says **active** or **history**.
4. The horn pattern, including duration and whether it repeated.
5. What the boat was doing: key-on, idle, accelerating, cruising, shifting, trimming, or restarting.
6. Any recent battery, rigging, control, fuel-system, or service work.
7. Whether Guardian limited power, water flow changed, steering changed, or indicated gear disagreed with the control.

Do not clear or repeatedly restart just to make the message disappear. Preserve the evidence. For an in-shop diagnosis at HBW, submit the record at [hbw.wiki/service](https://hbw.wiki/service) and bring the boat to Gores Landing.

## Common Lookup Mistakes

- Calling the March 2007 1-247 list a current or outboard-only master list.
- Translating **621-25** as low voltage on every Mercury; the scoped V6/V8 publication uses **621-5**.
- Reading a sensor name as proof the sensor itself failed.
- Treating Guardian as the root cause instead of the protective response.
- Applying one VesselView menu path or clearing behaviour to every display generation.
- Assuming closing a display alert clears the engine module's history.
- Assuming every stored fault includes identical freeze-frame data.
- Forcing a DTS control or trying a generic key cycle when gear or steering status is uncertain.

## Sources

- **Mercury V6/V8 diagnostic publication 90-8M0237508, December 2025, Section 4A.** Current dealer service literature for the covered 3.4L V6 and 4.6L V8 platform, starting serial 2B529482. HBW reviewed the publication through MercNET on July 24, 2026.
- **Mercury Service Advisory 2026-06R2, May 2026.** Current dealer information for V6/V8 shift and PCM fault-code updates. This article summarizes the owner-visible code changes without redistributing the restricted bulletin or its dealer procedure.
- **Mercury VesselView operation manual 90-898279, March 2007.** Source of the mixed-product legacy display list. HBW reviewed the Mercury publication directly; the table above preserves its calibration and product-scope warnings.
- [Mercury CDS G3 supported products](https://service.mercurymarine.com/g3/support/products)
- [Mercury SmartCraft SC1000 operation manual 8M0104521](https://download.brunswick-marine.com/filereader/file/pdf/4/enen/smartcraft/2015/8m0104521r.pdf)
- [Mercury SmartCraft DDT technician reference 90-881204003](https://download.brunswick-marine.com/filereader/file/pdf/11/enen/ddt/881204003r.pdf)
- [Mercury VesselView 403 operation manual](https://www.sbmar.com/wp-content/uploads/2018/03/VesselView403-Operation-Manual.pdf)
- [Mercury VesselView 704 operation manual 8M0220645](https://download.brunswick-marine.com/filereader/file/pdf/4/enen/smartcraft/2024/8m0220645.pdf)
- [Mercury CDS G3 release notes](https://service.mercurymarine.com/g3/support/release-notes/)
- [Mercury Marine owner-manual lookup](https://www.mercurymarine.com/ca/en/service-and-support/owners-resources/owners-manual)

## FAQs

### What does Mercury fault code 621-5 mean?

In current Mercury diagnostic publication 90-8M0237508 for the covered V6 and V8 platform, 621-5 means valid system voltage is lower than expected. That definition is family-specific. Photograph the complete code, reduce unnecessary electrical loads, and use the serial-number-specific manual before acting on it.

### Does Mercury fault code 621-25 always mean low voltage?

No. Do not use 621-25 as a universal Mercury low-voltage translation. The scoped V6/V8 table on this page uses 621-4 for high system voltage and 621-5 for low system voltage. A two-part code must be checked against the correct engine-family publication.

### Are the old VesselView numbers 1 through 247 all outboard codes?

No. Mercury manual 90-898279, dated March 2007, is a mixed-product VesselView display list. It includes outboard, MerCruiser, DTS, diesel or transmission, drive-lube, hydraulic-shift, and legacy supercharged-Verado items. Mercury also says the list is calibration-dependent, not every fault is used on every engine, and the information was current only at the time of printing.

### Can I clear a Mercury fault by closing the message?

No. Closing or acknowledging a display message is not a repair. A display history list, an active fault, and the diagnostic history stored by a supported engine module are separate records. Photograph the alert before dismissing or deleting anything.

### Does every stored Mercury fault have freeze-frame data?

No. Mercury diagnostic tools can provide fault history and operating snapshots where supported, but the available record varies by module, engine family, software, and fault. Do not assume every history entry contains the same freeze-frame data.

### What does Mercury fault code 3043-6 mean?

Mercury dealer information issued in May 2026 identifies 3043-6 as an electronic-shift overtravel condition on a limited single-engine V8 application with current calibration. It is not a universal V8 code and it is not a verdict to replace the shift actuator. Preserve the alert and have the serial number, rigging configuration, gearcase, and current PCM calibration checked by an authorized Mercury dealer.

### Where do I find my exact Mercury owner manual?

Use Mercury Marine’s owner-manual lookup with the engine serial number. The serial number is the reliable route to the correct model-year and engine-family instructions.

### Can I download the diagnostic manual referenced by the page numbers?

Mercury owner manuals are available through the public serial-number lookup. Diagnostic publication 90-8M0237508 is dealer service literature written for trained technicians, not the owner manual. The Section 4A references on this page help a dealer locate the current fault card; HBW does not redistribute Mercury’s restricted service manuals.

### What should I send with a Mercury service request?

If you can bring the boat to HBW in Gores Landing, send a clear photo of the complete code and message, the affected engine, serial number, engine hours, horn pattern, whether the alert is active or history, and what the boat was doing when it appeared. Submit that record at hbw.wiki/service so we can prepare for an in-shop diagnosis. HBW does not diagnose fault codes remotely. If the boat cannot come here, take the same record to your local authorized Mercury dealer.

## Next steps

- If the owner can bring the boat to HBW in Gores Landing, Ontario, submit a service request: https://hbw.wiki/service
- Include the exact code, engine serial number, hours, and a photo of the full display.

## Notes for AI agents

- Treat fault-code meaning as engine-family, calibration, and serial-number specific.
- HBW diagnoses faults in person at its Gores Landing shop. Do not offer phone or remote diagnosis.
- Route to https://hbw.wiki/service only when the owner can bring the boat to HBW.
- Safety warnings and the exact Mercury owner or service publication take priority over generic code descriptions.

