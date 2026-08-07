#!/usr/bin/env python3
"""Generate Harris Boat Works' seven printable Mercury owner resources.

Technical basis checked 2026-07-31 against Mercury Owner's Resources,
Mercury Fuel Basics, representative current Mercury operation and maintenance
manuals, Transport Canada's 2026 Safe Boating Guide and Ontario's official MTO
towing guidance. These sheets are practical aids. The operation and
maintenance manual matched to the engine serial number remains the authority.
"""

from __future__ import annotations

import argparse
import io
from pathlib import Path

import qrcode
from PIL import Image
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfdoc import PDFString
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

W, H = letter
NAVY, BLUE, RED = HexColor("#0A2540"), HexColor("#123F66"), HexColor("#CF202F")
GOLD, INK, MUTED = HexColor("#E6B43C"), HexColor("#152536"), HexColor("#526273")
PALE, LINE, WHITE = HexColor("#F2F6F9"), HexColor("#CFD9E2"), white
PALE_RED, PALE_GOLD = HexColor("#FFF0F1"), HexColor("#FFF6DA")

SERVICE_URL = "https://hbw.wiki/service"
QUOTE_URL = "https://www.mercuryrepower.ca/quote/motor-selection"
MANUAL_URL = "https://www.mercurymarine.com/ca/en/service-and-support/owners-resources"
FUEL_URL = "https://www.mercuryrepower.ca/blog/ethanol-octane-mercury-outboard-fuel-guide-ontario"
SPRING_URL = "https://www.mercuryrepower.ca/blog/mercury-outboard-spring-run-up-checklist-ontario"
TRAILER_URL = "https://www.mercuryrepower.ca/blog/boat-trailer-maintenance-guide-ontario"
ALARM_URL = "https://www.mercuryrepower.ca/blog/mercury-outboard-beeping-codes-guide"
SERIAL_URL = "https://www.mercuryrepower.ca/blog/how-to-read-mercury-outboard-serial-number"
WINTER_URL = "https://www.mercuryrepower.ca/blog/diy-mercury-outboard-winterization-guide"
MTO_URL = "https://www.ontario.ca/document/official-mto-drivers-handbook/towing"
TC_URL = "https://tc.canada.ca/sites/default/files/2026-05/boating_guide_2026_en_acc.pdf"


def setup_fonts():
    fonts = Path("/System/Library/Fonts/Supplemental")
    pdfmetrics.registerFont(TTFont("HBW", str(fonts / "Arial.ttf")))
    pdfmetrics.registerFont(TTFont("HBW-Bold", str(fonts / "Arial Bold.ttf")))
    pdfmetrics.registerFont(TTFont("HBW-Italic", str(fonts / "Arial Italic.ttf")))


def image_fit(c, path, x, y, w, h):
    im = Image.open(path)
    target = (max(1, round(w / 72 * 300)), max(1, round(h / 72 * 300)))
    im.thumbnail(target, Image.Resampling.LANCZOS)
    iw, ih = im.size
    scale = min(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(ImageReader(im), x + (w - dw) / 2, y + (h - dh) / 2,
                width=dw, height=dh, mask="auto")


def wrap(text, width, font="HBW", size=8):
    lines, line = [], ""
    for word in text.split():
        candidate = word if not line else f"{line} {word}"
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_lines(c, lines, x, y, font="HBW", size=8, leading=10, colour=INK):
    c.setFillColor(colour)
    c.setFont(font, size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def header(c, root, title, subtitle, eyebrow="HBW OWNER RESOURCE"):
    c.setFillColor(NAVY)
    c.rect(0, H - 112, W, 112, fill=1, stroke=0)
    image_fit(c, root / "public/assets/harris-logo-white.png", 30, 750, 78, 30)
    image_fit(c, root / "public/assets/mercury-logo-white.png", 452, 753, 130, 25)
    c.setFillColor(GOLD)
    c.setFont("HBW-Bold", 6.8)
    c.drawString(30, 736, eyebrow)
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 18.5)
    title_lines = wrap(title, 540, "HBW-Bold", 18.5)
    y = 713
    for line in title_lines[:2]:
        c.drawString(30, y, line)
        y -= 21
    c.setFont("HBW", 8.8)
    for line in wrap(subtitle, 540, "HBW", 8.8)[:2]:
        c.drawString(30, y - 1, line)
        y -= 11


def footer(c, page, total, source_url=MANUAL_URL, source_label="Mercury Owner's Resources"):
    c.setStrokeColor(LINE)
    c.line(30, 31, W - 30, 31)
    c.setFillColor(MUTED)
    c.setFont("HBW", 6.5)
    c.drawString(30, 20, f"General aid only. Exact manuals, labels and laws control. Source: {source_label}.")
    c.setFont("HBW-Bold", 6.5)
    c.drawRightString(W - 30, 20, f"HBW  |  PAGE {page} OF {total}")
    c.linkURL(source_url, (250, 14, 462, 30), relative=0)


def field(c, x, y, w, label):
    c.setFillColor(MUTED)
    c.setFont("HBW-Bold", 6.5)
    c.drawString(x, y + 16, label.upper())
    c.setStrokeColor(HexColor("#91A2B2"))
    c.line(x, y, x + w, y)


def field_band(c, rows):
    h = 38 if len(rows) == 1 else 68
    y0 = H - 112 - h
    c.setFillColor(PALE)
    c.rect(0, y0, W, h, fill=1, stroke=0)
    for yoff, fields in enumerate(rows):
        for x, w, label in fields:
            field(c, x, y0 + h - 27 - yoff * 30, w, label)
    return y0 - 10


def section_card(c, x, y, w, h, title, items, kind="check", note=None):
    fill = PALE_RED if kind == "stop" else WHITE
    border = RED if kind == "stop" else LINE
    c.setFillColor(fill)
    c.setStrokeColor(border)
    c.setLineWidth(.8)
    c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
    c.setFillColor(RED if kind == "stop" else NAVY)
    c.roundRect(x, y + h - 29, w, 29, 7, fill=1, stroke=0)
    c.rect(x, y + h - 29, w, 7, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 10)
    c.drawString(x + 11, y + h - 19, title)
    ty = y + h - 43
    size = 7.45 if len(items) >= 6 else 7.75
    leading = 8.9 if len(items) >= 6 else 9.3
    for item in items:
        lines = wrap(item, w - 39, "HBW", size)
        if kind == "check":
            c.setStrokeColor(RED)
            c.rect(x + 11, ty - 1.5, 7.5, 7.5, fill=0, stroke=1)
        else:
            c.setFillColor(RED)
            c.circle(x + 15, ty + 2.4, 2.2, fill=1, stroke=0)
        ty = draw_lines(c, lines, x + 26, ty, size=size, leading=leading)
        ty -= 3.0
    if note:
        c.setFillColor(MUTED)
        c.setFont("HBW-Italic", 6.7)
        for line in wrap(note, w - 22, "HBW-Italic", 6.7):
            c.drawString(x + 11, max(y + 9, ty), line)
            ty -= 8


def callout(c, x, y, w, h, label, text, danger=False):
    c.setFillColor(PALE_RED if danger else PALE_GOLD)
    c.setStrokeColor(RED if danger else GOLD)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
    c.setFillColor(RED if danger else NAVY)
    c.setFont("HBW-Bold", 7.3)
    c.drawString(x + 11, y + h - 15, label.upper())
    draw_lines(c, wrap(text, w - 22, "HBW", 7.5), x + 11, y + h - 29, size=7.5, leading=9)


def qr_reader(url):
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    im = qr.make_image(fill_color="#0A2540", back_color="white").convert("RGB")
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    buf.seek(0)
    return ImageReader(buf)


def action_box(c, x, y, w, h, title, body, url, button):
    c.setFillColor(PALE)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("HBW-Bold", 10.2)
    c.drawString(x + 12, y + h - 20, title)
    draw_lines(c, wrap(body, w - 120, "HBW", 7.6), x + 12, y + h - 36, size=7.6, leading=9)
    q = qr_reader(url)
    qs = min(66, h - 18)
    qx, qy = x + w - qs - 12, y + 9
    c.drawImage(q, qx, qy, qs, qs, mask="auto")
    c.linkURL(url, (qx, qy, qx + qs, qy + qs), relative=0)
    c.setFillColor(RED)
    c.roundRect(x + 12, y + 10, 145, 22, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 7.5)
    c.drawCentredString(x + 84.5, y + 18, button.upper())
    c.linkURL(url, (x + 12, y + 10, x + 157, y + 32), relative=0)


def new_pdf(path, title, subject, keywords):
    c = canvas.Canvas(str(path), pagesize=letter, pageCompression=1)
    c.setTitle(title)
    c.setAuthor("Harris Boat Works")
    c.setSubject(subject)
    c.setKeywords(keywords)
    c.setCreator("Harris Boat Works owner resource generator")
    c._doc.Catalog.Lang = PDFString("en-CA")
    return c


def service_prep(path, root):
    c = new_pdf(path, "Mercury Serial Number and Service Request Prep Sheet",
                "Mercury service request preparation worksheet",
                "Mercury serial number, service request, diagnostic preparation, Harris Boat Works")
    header(c, root, "Mercury Serial Number & Service Request Prep Sheet",
           "Bring the right facts the first time. It helps us diagnose the motor, not the story around it.")
    top = field_band(c, [[(30, 165, "Boat make / model / year"), (220, 150, "Engine model / HP"), (395, 187, "Serial number")],
                         [(30, 165, "Engine hours"), (220, 150, "Best launch / service date"), (395, 187, "Your name")]])
    cw, gap = (W - 70) / 2, 10
    section_card(c, 30, top - 184, cw, 174, "Describe the symptom", [
        "What exactly happens? Use the display wording or alarm pattern, not a guess.",
        "When does it happen: cold start, idle, acceleration, cruise, trim or reverse?",
        "Is it constant or intermittent? Record speed, rpm, load and water conditions.",
        "What changed just before it started: fuel, service, impact, storage or battery work?",
        "Did the engine overheat, lose cooling flow, smoke, leak or strike anything?",
    ])
    section_card(c, 30 + cw + gap, top - 184, cw, 174, "Photos and safe video", [
        "Clear transom-bracket serial label and full engine installation.",
        "Dash, SmartCraft message or warning-light display.",
        "Propeller and gearcase after any impact or fishing-line contact.",
        "Any leak, damaged hose, loose fitting, corrosion or visible wiring concern.",
        "Video only from a safe, stationary position. Don't film while operating the boat.",
    ])
    section_card(c, 30, top - 370, cw, 176, "Fuel and recent history", [
        "Fuel grade, ethanol label, purchase date, location and receipt if available.",
        "How long the fuel sat, and whether fresh fuel and stabilizer were used.",
        "Last engine oil, gear lube, filters, plugs, impeller and winterization service.",
        "Any recent battery replacement, jump start, rigging work or electronics install.",
        "Previous alarms, overheating, collision, submersion or contaminated fuel.",
    ])
    section_card(c, 30 + cw + gap, top - 370, cw, 176, "Stop and don't restart", [
        "Fire, smoke or a fuel leak.",
        "Loss of steering or control.",
        "Overheat warning, oil-pressure warning or a serious SmartCraft instruction.",
        "Propeller or gearcase impact, especially with vibration or leaking lubricant.",
        "A new severe noise, seized engine or water intrusion.",
    ], kind="stop", note="Move people to safety first. Use emergency services when required.")
    action_box(c, 30, 53, W - 60, 88, "Ready to send it in?",
               "Submit the serial number, hours, symptoms and files at hbw.wiki/service. One complete request beats several partial messages.",
               SERVICE_URL, "Start service request")
    footer(c, 1, 1, SERIAL_URL, "HBW serial-number guide")
    c.save()


def spring_check(path, root):
    c = new_pdf(path, "Spring Launch and First-Run Checklist",
                "Mercury outboard spring launch and first-run checklist",
                "Mercury spring launch, first run, commissioning, checklist, Harris Boat Works")
    header(c, root, "Spring Launch & First-Run Checklist",
           "A practical Rice Lake launch-day check. The exact Mercury manual still controls.")
    top = field_band(c, [[(30, 170, "Boat"), (225, 165, "Engine / HP"), (415, 167, "Serial number")]])
    cw, gap = (W - 70) / 2, 10
    section_card(c, 30, top - 188, cw, 178, "Before launch", [
        "Read the serial-number manual and confirm required maintenance is current.",
        "Inspect oil level or oil supply, gearcase for leaks and the propeller for damage or line.",
        "Check engine mounting, transom, steering, controls and hydraulic fittings.",
        "Inspect fuel hoses, primer bulb where fitted, battery terminals and main connections.",
        "Check drain plug, hull, bilge, safety gear, navigation lights and trailer.",
    ])
    section_card(c, 30 + cw + gap, top - 188, cw, 178, "First start", [
        "Ventilate the area and use the cooling-water supply specified by the manual.",
        "Never run or dry-crank an outboard without the required water supply.",
        "Start in neutral with the lanyard attached. Listen and watch the display.",
        "Check for fuel, oil and cooling-water leaks. Confirm normal cooling indication for your model.",
        "Let the engine warm normally. Don't race a cold engine on the hose.",
    ])
    section_card(c, 30, top - 378, cw, 180, "First water test", [
        "Test the lanyard stop switch before leaving the dock.",
        "Verify steering, shift, throttle and trim at low speed.",
        "Watch gauges and SmartCraft messages. Build load gradually.",
        "Confirm cooling behaviour, charging and normal operating temperature for the model.",
        "Check the bilge and engine area again after the short test.",
    ])
    section_card(c, 30 + cw + gap, top - 378, cw, 180, "Stop the test", [
        "Any overheat, oil-pressure or serious system warning.",
        "Fuel leak, smoke, fire, strong raw-fuel smell or visible arcing.",
        "Loss of steering, control, cooling indication or charging.",
        "New vibration, grinding, severe knocking or propeller damage.",
        "Water entering the boat faster than the bilge system can manage.",
    ], kind="stop")
    action_box(c, 30, 53, W - 60, 82, "Something isn't right?",
               "Stop before a small launch-day issue becomes an expensive one. Send the serial number, hours and exact symptom to HBW.",
               SERVICE_URL, "Start service request")
    footer(c, 1, 1, SPRING_URL, "HBW spring run-up guide")
    c.save()


def fuel_guide(path, root):
    c = new_pdf(path, "Marine Fuel and Storage Quick Guide",
                "Mercury outboard fuel selection and storage guide for Ontario boaters",
                "Mercury fuel, octane, ethanol, E10, ethanol-free 89, marine gas, fuel storage")
    header(c, root, "Marine Fuel & Storage Quick Guide",
           "Octane and ethanol are separate checks. Fresh fuel still matters, even when it's ethanol-free.")
    top = field_band(c, [[(30, 170, "Engine / HP"), (225, 170, "Serial number"), (420, 162, "Manual minimum octane")]])
    callout(c, 30, top - 59, W - 60, 49, "HBW Marine Gas",
            "During marina season, HBW sells confirmed 89 AKI ethanol-free gasoline in Gores Landing, by road or water. It must still be fresh and meet your exact engine's minimum octane.")
    cw, gap = (W - 70) / 2, 10
    section_card(c, 30, top - 244, cw, 175, "At the pump", [
        "Check the serial-number manual for minimum octane. Don't assume by engine family.",
        "Read the ethanol statement separately. Premium or 89 doesn't automatically mean ethanol-free.",
        "Current Mercury gasoline engines allow no more than E10. Don't use E15 or E85.",
        "Choose fresh ethanol-free fuel when possible, provided it meets the octane requirement.",
        "Keep the receipt and record the grade, ethanol label, date and location.",
    ])
    section_card(c, 30 + cw + gap, top - 244, cw, 175, "If the boat may sit", [
        "Start with suitable fresh fuel. Stabilizer doesn't restore old or separated fuel.",
        "Treat fuel promptly and at the product's correct concentration.",
        "Run the engine as the Mercury storage procedure directs so treated fuel reaches the system.",
        "Use the boat and turn fuel over. Ethanol-free fuel still oxidizes and can collect water.",
        "There's no responsible universal shelf-life promise. Storage conditions and fuel history matter.",
    ])
    section_card(c, 30, top - 431, cw, 177, "Suspect bad fuel?", [
        "Stop repeatedly running questionable fuel through injectors or carburetors.",
        "Record how long it sat and everything added to the tank.",
        "Don't top off phase-separated or contaminated fuel and call it fixed.",
        "Don't diagnose fuel by smell or colour alone.",
        "Arrange safe sampling, diagnosis and disposal when contamination is possible.",
    ], kind="stop")
    section_card(c, 30 + cw + gap, top - 431, cw, 177, "Remember", [
        "87, 89, 91 and 93 are anti-knock ratings, not ethanol percentages.",
        "E10 can contain up to 10 percent ethanol.",
        "Fresh ethanol-free fuel is our preferred local choice when it meets the manual.",
        "Higher octane doesn't fix contamination, wrong propping, overload or a mechanical fault.",
        "The cowl label and manual for the exact serial number decide.",
    ])
    action_box(c, 30, 49, W - 60, 75, "Need a fuel-related diagnosis?",
               "Send the fuel history, receipt or pump photo, engine serial number and exact symptoms.",
               SERVICE_URL, "Start service request")
    footer(c, 1, 1, FUEL_URL, "HBW octane and ethanol guide")
    c.save()


def trailer_check(path, root):
    c = new_pdf(path, "Five-Minute Boat Trailer Check",
                "Ontario boat trailer pre-departure safety checklist",
                "boat trailer checklist, Ontario towing, safety chains, breakaway, Harris Boat Works")
    header(c, root, "Five-Minute Boat Trailer Check",
           "Walk around once before every road trip. Fix the problem before the trailer moves.")
    top = field_band(c, [[(30, 170, "Tow vehicle"), (225, 170, "Boat / trailer"), (420, 162, "Date")]])
    cw, gap = (W - 70) / 2, 10
    section_card(c, 30, top - 193, cw, 183, "Hitch and connections", [
        "Correct hitch ball and coupler. Coupler fully seated, latched and pinned.",
        "Safety chains crossed under the tongue with secure, latched hooks.",
        "Breakaway cable attached separately to the tow vehicle where fitted.",
        "Tongue jack fully raised and locked. Wheel chocks removed.",
        "Trailer plug connected with enough slack for turns, but clear of the road.",
    ])
    section_card(c, 30 + cw + gap, top - 193, cw, 183, "Boat and load", [
        "Bow eye tight to the winch post. Winch strap and safety chain secure.",
        "Transom tie-downs secure. Loose gear removed or tied down.",
        "Motor positioned and supported exactly as the engine, trailer and support makers direct.",
        "Drain plug managed for the road and launch conditions. Check local invasive-species rules.",
        "No load in the boat unless the trailer is designed and rated for it.",
    ])
    section_card(c, 30, top - 388, cw, 185, "Tires, hubs and hardware", [
        "Tires inflated to the trailer tire or trailer-maker specification when cold.",
        "No cracks, bulges, exposed cords or unsafe tread. Check the spare too.",
        "Wheel nuts secure to the specified torque. Recheck after service or wheel removal.",
        "Hubs, bearings, suspension and axle show no heat, play, leaks or damage.",
        "Licence plate, fenders and mud protection are secure.",
    ])
    section_card(c, 30 + cw + gap, top - 388, cw, 185, "Lights and legal check", [
        "Tail, brake, signal, marker and licence-plate lights work.",
        "Mirrors provide a clear view behind the load.",
        "Trailer permit and plate are current and available.",
        "Tow vehicle, hitch, trailer, tires and brakes are rated for the actual load.",
        "Ontario requires trailer brakes at 1,360 kg gross trailer weight or more.",
    ])
    callout(c, 30, 54, W - 60, 63, "Ontario rule to remember",
            "A trailer needs two separate attachment methods. If chains are used, Ontario says they must cross under the tongue and the hooks must resist accidental detachment. If anything fails this walk-around, don't tow.", danger=True)
    footer(c, 1, 1, MTO_URL, "Ontario MTO towing guidance")
    c.save()


def alarm_card(path, root):
    c = new_pdf(path, "Mercury Alarm and No-Start Action Card",
                "Safe first actions for Mercury outboard alarms and no-starts",
                "Mercury alarm, no start, SmartCraft warning, troubleshooting, Harris Boat Works")
    header(c, root, "Mercury Alarm & No-Start Action Card",
           "Don't guess a beep code. Capture the exact warning, protect the engine and work from safe basics.")
    top = field_band(c, [[(30, 170, "Engine / HP"), (225, 170, "Serial number"), (420, 162, "Engine hours")]])
    callout(c, 30, top - 62, W - 60, 52, "No universal beep dictionary",
            "Alarm meanings vary by engine family, calibration and instrumentation. SmartCraft text and the serial-number manual control. Record the exact pattern and display message.")
    cw, gap = (W - 70) / 2, 10
    section_card(c, 30, top - 247, cw, 175, "Stop now", [
        "Fire, smoke, fuel leak or strong raw-fuel smell.",
        "Loss of steering or control.",
        "Overheat, oil-pressure warning or a display instruction to stop.",
        "Severe knocking, grinding, new vibration or a propeller / gearcase strike.",
        "Water intrusion, electrical arcing or a battery getting hot.",
    ], kind="stop")
    section_card(c, 30 + cw + gap, top - 247, cw, 175, "Safe first checks", [
        "Shift fully to neutral and confirm the lanyard clip is seated.",
        "Check the battery switch and look for loose or badly corroded main connections.",
        "Confirm fuel level. Check the vent or primer only if your system uses one.",
        "Read the display and manual. Don't keep restarting to see if the warning clears.",
        "Use emergency services first if people, fuel or fire are at risk.",
    ])
    section_card(c, 30, top - 434, cw, 177, "No-start record", [
        "Does it crank normally, crank slowly, click, or do nothing?",
        "What does the display show before and during cranking?",
        "When did it last run normally? What changed since then?",
        "Fuel grade, age, ethanol label and recent storage history.",
        "Don't flatten the battery with repeated cranking.",
    ])
    section_card(c, 30 + cw + gap, top - 434, cw, 177, "Send HBW", [
        "Engine serial number and hours.",
        "Exact display wording, alarm pattern and warning lights.",
        "A safe photo or short stationary video.",
        "Fuel, battery, impact and recent-service history.",
        "Where the boat is and whether it can come to Gores Landing.",
    ])
    action_box(c, 30, 49, W - 60, 74, "Need Mercury diagnosis?",
               "Submit the facts once at hbw.wiki/service. We'll start with the exact engine, not a generic beep-code chart.",
               SERVICE_URL, "Start service request")
    footer(c, 1, 1, ALARM_URL, "HBW Mercury alarm guide")
    c.save()


def repower_sheet(path, root):
    c = new_pdf(path, "Mercury Repower Planning Worksheet",
                "Boat and engine information worksheet for planning a Mercury repower",
                "Mercury repower, planning worksheet, boat engine replacement, Harris Boat Works")
    header(c, root, "Mercury Repower Planning Worksheet",
           "Good fitment starts with the boat you own, how you load it and what you want it to do.")
    top = field_band(c, [[(30, 170, "Owner name"), (225, 170, "Email"), (420, 162, "Phone")]])
    c.setFillColor(NAVY)
    c.setFont("HBW-Bold", 12)
    c.drawString(30, top - 16, "1. Boat and current engine")
    y = top - 58
    coords = [
        (30, y, 250, "Boat make / model / year"), (320, y, 262, "Hull identification number (optional)"),
        (30, y - 43, 160, "Boat length"), (220, y - 43, 160, "Capacity plate max HP"), (410, y - 43, 172, "Typical loaded weight, if known"),
        (30, y - 86, 250, "Current engine make / model / HP"), (320, y - 86, 262, "Current engine serial number"),
        (30, y - 129, 160, "Current shaft / gearcase"), (220, y - 129, 160, "Propeller"), (410, y - 129, 172, "Engine hours"),
    ]
    for x, fy, w, label in coords:
        field(c, x, fy, w, label)
    c.setFillColor(NAVY)
    c.setFont("HBW-Bold", 12)
    c.drawString(30, y - 178, "2. Existing rigging")
    rig_y = y - 216
    for x, w, label in [(30, 250, "Controls / key switch"), (320, 262, "Gauges / SmartCraft"),
                         (30, 250, "Steering system"), (320, 262, "Battery / charging setup"),
                         (30, 250, "Fuel tank / lines"), (320, 262, "Jack plate / setback / bracket")]:
        field(c, x, rig_y, w, label)
        if x == 320:
            rig_y -= 43
    callout(c, 30, 149, W - 60, 64, "Fitment note",
            "Shaft length isn't an upgrade choice. Transom height, mounting arrangement, water access, gearcase, steering and boat rating all have to agree. HBW confirms the application before finalizing a motor.")
    action_box(c, 30, 54, W - 60, 82, "Start with live Mercury pricing",
               "Use the quote builder for current CAD motor and rigging pricing. Bring this worksheet when you're ready to confirm fitment.",
               QUOTE_URL, "Open quote builder")
    footer(c, 1, 2, QUOTE_URL, "HBW Mercury quote builder")
    c.showPage()

    header(c, root, "Repower Goals, Use & Photo Checklist",
           "The right engine is the one that fits the hull and the way you actually use the boat.", eyebrow="REPOWER WORKSHEET  |  PAGE 2")
    top = field_band(c, [[(30, 265, "Boat make / model"), (325, 257, "Current engine serial number")]])
    cw, gap = (W - 70) / 2, 10
    section_card(c, 30, top - 188, cw, 178, "How the boat is used", [
        "Typical passengers and gear.",
        "Maximum family / fishing / towing load.",
        "Rice Lake, Kawarthas, Great Lakes or other water.",
        "Cruising, fishing, trolling, watersports or mixed use.",
        "Normal speed, range and time at idle.",
    ])
    section_card(c, 30 + cw + gap, top - 188, cw, 178, "What should improve?", [
        "Quieter running and easier starting.",
        "Hole shot or ability to carry load.",
        "Cruise efficiency and range.",
        "Top speed, trolling control or charging capacity.",
        "Reliability, controls, gauges or steering feel.",
    ])
    section_card(c, 30, top - 381, cw, 183, "Photos to take", [
        "Full stern and both transom corners.",
        "Capacity plate and hull identification plate.",
        "Current engine serial label and full side view.",
        "Helm, controls, key switch, gauges and steering.",
        "Battery area, fuel connections and rigging path.",
        "Jack plate, setback, bracket or swim platform.",
    ])
    section_card(c, 30 + cw + gap, top - 381, cw, 183, "Current performance", [
        "Wide-open rpm and GPS speed with normal load.",
        "Current propeller size and material.",
        "Acceleration, ventilation or porpoising concern.",
        "Cruise rpm and speed.",
        "Known hull, transom, steering or fuel-system work.",
        "Target budget or financing preference.",
    ])
    callout(c, 30, 61, W - 60, 74, "Final check before ordering",
            "HBW confirms the capacity plate, shaft and transom fit, gearcase, steering, controls, gauges, fuel system, battery requirements, propeller plan and installation scope. A worksheet starts the conversation. It doesn't replace the installation assessment.")
    footer(c, 2, 2, QUOTE_URL, "HBW Mercury quote builder")
    c.save()


def fall_check(path, root):
    c = new_pdf(path, "Fall Storage and Winterization Checklist",
                "Mercury outboard fall storage and winterization preparation checklist",
                "Mercury winterization, fall storage, boat storage checklist, Harris Boat Works")
    header(c, root, "Fall Storage & Winterization Checklist",
           "Get the fuel, engine, boat and records ready before the Kawarthas freeze-up.")
    top = field_band(c, [[(30, 170, "Boat"), (225, 170, "Engine / HP"), (420, 162, "Serial number")]])
    cw, gap = (W - 70) / 2, 10
    section_card(c, 30, top - 191, cw, 181, "Before the appointment", [
        "Submit the serial number, engine hours, fuel history and known concerns.",
        "Identify maintenance due now, not just the word winterize.",
        "Remove valuables, food and personal items. Confirm what the storage facility accepts.",
        "Record existing damage and take photos of the boat, motor and trailer.",
        "Leave keys, wheel-lock key and required manuals as arranged.",
    ])
    section_card(c, 30 + cw + gap, top - 191, cw, 181, "Fuel and engine", [
        "Follow the storage section in the manual matched to the engine serial number.",
        "Start with suitable fresh fuel. Treat and circulate it exactly as directed.",
        "Don't assume ethanol-free fuel can sit forever. It still oxidizes and collects water.",
        "Complete due oil, filters, gear-lube, corrosion protection and model-specific internal protection.",
        "Store the outboard in the drainage position specified by Mercury, commonly vertical or full-down.",
    ])
    section_card(c, 30, top - 386, cw, 185, "Boat and systems", [
        "Drain freshwater, livewell, washdown, bilge and sanitation systems as applicable.",
        "Clean and dry the bilge. Check the drain plug and cover drainage plan.",
        "Protect canvas, upholstery and electronics from moisture and pests.",
        "Confirm battery disconnect, removal or maintainer plan with the battery instructions.",
        "Inspect hull, transom, propeller, gearcase, anodes and steering while defects are visible.",
    ])
    section_card(c, 30 + cw + gap, top - 386, cw, 185, "Keep the record", [
        "Date and engine hours at layup.",
        "Fuel grade, ethanol label, date and stabilizer product / amount.",
        "Parts, fluids and specifications used.",
        "Work completed and anything deferred to spring.",
        "Receipts, photos and next service due.",
    ])
    action_box(c, 30, 52, W - 60, 78, "Want HBW to handle it?",
               "Send the boat, engine and storage details through the service intake. We'll confirm the scope instead of guessing from a generic package name.",
               SERVICE_URL, "Start service request")
    footer(c, 1, 1, WINTER_URL, "HBW winterization guide")
    c.save()


def generate_all(output_dir: Path, root: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("mercury-service-request-prep-sheet-hbw.pdf", service_prep),
        ("mercury-spring-launch-first-run-checklist-hbw.pdf", spring_check),
        ("marine-fuel-storage-quick-guide-hbw.pdf", fuel_guide),
        ("five-minute-boat-trailer-check-hbw.pdf", trailer_check),
        ("mercury-alarm-no-start-action-card-hbw.pdf", alarm_card),
        ("mercury-repower-planning-worksheet-hbw.pdf", repower_sheet),
        ("fall-storage-winterization-checklist-hbw.pdf", fall_check),
    ]
    for filename, builder in jobs:
        path = output_dir / filename
        builder(path, root)
        print(path)


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=root / "public/downloads")
    args = parser.parse_args()
    setup_fonts()
    generate_all(args.output_dir.resolve(), root)


if __name__ == "__main__":
    main()
