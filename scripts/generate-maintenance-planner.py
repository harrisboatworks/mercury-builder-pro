#!/usr/bin/env python3
"""Generate HBW's printable, model-aware Mercury maintenance planner.

Technical basis checked 2026-07-31:
- Mercury publications 8M0145552 and 8M0140581, maintenance schedule and
  storage sections for representative FourStroke, V6 and V8 families.
- Mercury Maintenance Made Easy, which directs owners to the schedule in the
  operation and maintenance manual for their exact engine.
- Mercury Owner's Resources manual lookup.

The specific manual above is a representative current FourStroke source, not a
universal schedule. That is why every interval is qualified and the planner
directs the owner to the manual matched to the engine serial number.
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
MANUAL_URL = "https://www.mercurymarine.com/ca/en/service-and-support/owners-resources"
CAPACITY_URL = "https://www.mercuryrepower.ca/blog/mercury-outboard-oil-capacity-chart"
SERVICE_URL = "https://hbw.wiki/service"
FONT_CANDIDATES = (
    (
        Path("/System/Library/Fonts/Supplemental"),
        ("Arial.ttf", "Arial Bold.ttf", "Arial Italic.ttf"),
    ),
    (
        Path("/usr/share/fonts/truetype/liberation2"),
        (
            "LiberationSans-Regular.ttf",
            "LiberationSans-Bold.ttf",
            "LiberationSans-Italic.ttf",
        ),
    ),
)


def setup_fonts(fonts_dir: Path | None = None):
    candidates = []
    if fonts_dir is not None:
        candidates.extend(
            (fonts_dir, filenames) for _, filenames in FONT_CANDIDATES
        )
    candidates.extend(FONT_CANDIDATES)
    for directory, filenames in candidates:
        paths = tuple(directory / filename for filename in filenames)
        if all(path.is_file() for path in paths):
            pdfmetrics.registerFont(TTFont("HBW", str(paths[0])))
            pdfmetrics.registerFont(TTFont("HBW-Bold", str(paths[1])))
            pdfmetrics.registerFont(TTFont("HBW-Italic", str(paths[2])))
            return
    raise FileNotFoundError(
        "No supported font family found. Pass --fonts-dir containing Arial "
        "or Liberation Sans regular, bold and italic TTF files."
    )


def image_fit(c, path, x, y, w, h):
    im = Image.open(path)
    # Keep the downloadable planner light without sacrificing print quality.
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


def text_lines(c, lines, x, y, font="HBW", size=8, leading=10, colour=INK):
    c.setFillColor(colour)
    c.setFont(font, size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def bullets(c, items, x, y, width, size=7.75, leading=9.5):
    for item in items:
        lines = wrap(item, width - 12, size=size)
        c.setFillColor(RED)
        c.circle(x + 3.3, y + 2.4, 1.6, fill=1, stroke=0)
        y = text_lines(c, lines, x + 12, y, size=size, leading=leading)
        y -= 3.1
    return y


def card_shell(c, x, y, w, h, title, eyebrow):
    c.setFillColor(WHITE)
    c.setStrokeColor(LINE)
    c.setLineWidth(.75)
    c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.roundRect(x, y + h - 32, w, 32, 7, fill=1, stroke=0)
    c.rect(x, y + h - 32, w, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("HBW-Bold", 6.8)
    c.drawString(x + 11, y + h - 12, eyebrow.upper())
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 10.2)
    c.drawString(x + 11, y + h - 26, title)


def draw_card(c, x, y, w, h, title, eyebrow, items):
    card_shell(c, x, y, w, h, title, eyebrow)
    bullets(c, items, x + 10, y + h - 45, w - 20)


def qr_image():
    q = qrcode.QRCode(box_size=8, border=2)
    q.add_data(CAPACITY_URL)
    q.make(fit=True)
    im = q.make_image(fill_color="#0A2540", back_color="white").convert("RGB")
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    buf.seek(0)
    return ImageReader(buf)


def qr_card(c, x, y, w, h, qr):
    card_shell(c, x, y, w, h, "Capacity and filter lookup", "Free HBW tool")
    size, qx, qy = 82, x + w - 94, y + 15
    c.drawImage(qr, qx, qy, size, size, mask="auto")
    c.linkURL(CAPACITY_URL, (qx, qy, qx + size, qy + size), relative=0)
    bullets(c, [
        "Search by model, year, serial break and gearcase.",
        "Use reference capacities only as a starting point.",
        "Confirm the final level by the exact manual and dipstick procedure.",
    ], x + 10, y + h - 48, w - size - 30, size=7.6, leading=9.2)
    c.setFillColor(BLUE)
    c.setFont("HBW-Bold", 7.2)
    c.drawString(x + 12, y + 13, "SCAN OR CLICK THE QR CODE")


def footer(c, page):
    c.setStrokeColor(LINE)
    c.line(30, 31, W - 30, 31)
    c.setFillColor(MUTED)
    c.setFont("HBW", 6.7)
    c.drawString(30, 20, "General aid only. Your serial-number manual controls. Find it in Mercury Owner's Resources.")
    c.setFont("HBW-Bold", 6.7)
    c.drawRightString(W - 48, 20, f"HBW  |  PAGE {page} OF 2")
    c.linkURL(MANUAL_URL, (220, 15, 425, 30), relative=0)


def page_one(c, root, qr):
    c.setFillColor(NAVY)
    c.rect(0, H - 106, W, 106, fill=1, stroke=0)
    image_fit(c, root / "public/assets/harris-logo-white.png", 30, 746, 82, 34)
    image_fit(c, root / "public/assets/mercury-logo-white.png", 443, 750, 139, 26)
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 19)
    c.drawString(30, 716, "Mercury Outboard Maintenance Planner")
    c.setFont("HBW", 9.2)
    c.drawString(30, 699, "Owner checklist and service record. Your serial-number manual controls.")
    c.setFillColor(PALE)
    c.rect(0, 642, W, 44, fill=1, stroke=0)
    for x, label, fw in [(30, "ENGINE MODEL / HP", 153), (210, "SERIAL NUMBER", 153), (390, "CURRENT HOURS", 192)]:
        c.setFillColor(MUTED)
        c.setFont("HBW-Bold", 6.8)
        c.drawString(x, 672, label)
        c.setStrokeColor(HexColor("#91A2B2"))
        c.line(x, 651, x + fw, 651)
    c.setFillColor(HexColor("#FFF5D8"))
    c.setStrokeColor(GOLD)
    c.roundRect(30, 607, W - 60, 25, 5, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("HBW-Bold", 8.2)
    c.drawString(42, 616, "NO UNIVERSAL 20-HOUR SERVICE:")
    c.setFont("HBW", 8.2)
    c.drawString(228, 616, "Use the schedule for your exact engine and serial number.")

    before = [
        "Check FourStroke engine oil, or the oil supply on an oil-injected two-stroke.",
        "Test the lanyard stop switch and inspect the cord and clip.",
        "Inspect fuel lines, fittings and primer bulb for leaks or deterioration.",
        "Check motor-to-transom security. Inspect steering and hydraulic fittings for binding or leaks.",
        "Check the propeller for damage and confirm battery connections are secure.",
        "Confirm the required safety gear is aboard.",
    ]
    annual = [
        "Change engine oil and filter where fitted, using the exact grade and quantity.",
        "Inspect fuel filter(s); replace as the manual or condition requires.",
        "Drain and refill gearcase lube. Check the old oil for water or metal.",
        "Remove the propeller; inspect the shaft, sleeve and fishing line; lubricate as specified.",
        "Inspect mounting fasteners, anodes, battery, controls, steering, hoses and connections.",
        "Record the date, engine hours, parts and fluids used.",
    ]
    after_use = [
        "Flush exactly as the manual directs. Salt, polluted water, silt or restricted flow may require more attention.",
        "Inspect promptly after known fishing-line contact or propeller impact.",
        "Watch anodes and corrosion. Use the correct anode material for the water and application.",
        "Log engine hours, alarms, overheating and reduced-water-flow events.",
    ]
    expanded = [
        "Many current manuals use a 300-hour or 3-year interval. Your exact manual decides.",
        "Common items include the water-pump impeller and spark plugs.",
        "Depending on model: trim fluid, driveshaft splines, wiring, belts, filters, thermostats and seals.",
        "Inspect earlier after overheating, low water pressure, sand, silt or heavy-duty use.",
    ]
    storage = [
        "Follow the exact long-term-storage section, often defined as two months or longer.",
        "Treat fresh fuel promptly. Ethanol fuel may require draining depending on the engine and fuel system.",
        "Complete due oil, filter, gear-lube and corrosion-protection work before storage.",
        "Use the drainage position in the serial-number manual so water is not trapped, and follow the battery procedure.",
    ]
    x, gap, cw, ch = 30, 10, (W - 70) / 2, 169
    ys = [428, 249, 70]
    draw_card(c, x, ys[0], cw, ch, "Before every outing", "Safety and readiness", before)
    draw_card(c, x + cw + gap, ys[0], cw, ch, "Annual or 100 hours", "Common on many FourStrokes", annual)
    draw_card(c, x, ys[1], cw, ch, "After use and in season", "Condition-based", after_use)
    draw_card(c, x + cw + gap, ys[1], cw, ch, "Expanded interval", "Often 300 hours / 3 years", expanded)
    draw_card(c, x, ys[2], cw, ch, "Storage preparation", "Model-specific", storage)
    qr_card(c, x + cw + gap, ys[2], cw, ch, qr)
    footer(c, 1)
    c.showPage()


def fill_field(c, x, y, width, label):
    c.setFillColor(MUTED)
    c.setFont("HBW-Bold", 6.8)
    c.drawString(x, y + 18, label)
    c.setStrokeColor(HexColor("#91A2B2"))
    c.line(x, y, x + width, y)


def page_two(c, root):
    c.setFillColor(NAVY)
    c.rect(0, H - 79, W, 79, fill=1, stroke=0)
    image_fit(c, root / "public/assets/harris-logo-white.png", 30, 727, 69, 46)
    image_fit(c, root / "public/assets/mercury-logo-white.png", 463, 739, 119, 23)
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 18)
    c.drawString(116, 748, "Maintenance and Service Record")
    c.setFont("HBW", 8.6)
    c.drawString(117, 731, "Keep this page with your engine records and receipts.")
    c.setFillColor(PALE)
    c.rect(0, 649, W, 64, fill=1, stroke=0)
    for x, y, fw, label in [
        (30, 680, 157, "ENGINE MODEL / HP"), (210, 680, 157, "SERIAL NUMBER"), (390, 680, 192, "BOAT / OWNER"),
        (30, 651, 157, "GEARCASE / DRIVE"), (210, 651, 157, "MANUAL PUBLICATION"), (390, 651, 192, "NEXT SERVICE DUE")]:
        fill_field(c, x, y, fw, label)
    c.setFillColor(HexColor("#FFF5D8"))
    c.setStrokeColor(GOLD)
    c.roundRect(30, 592, W - 60, 45, 6, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("HBW-Bold", 8.4)
    c.drawString(42, 620, "IDENTIFY THE ENGINE BEFORE ORDERING PARTS")
    text_lines(c, wrap("Photograph the transom label and serial number before ordering a filter, impeller, kit or lubricant. Horsepower alone is not fitment.", W - 84, size=7.7), 42, 607, size=7.7, leading=9)

    tx, ty, tw, th, hh, rows = 30, 172, W - 60, 407, 27, 10
    rh, cols = (th - hh) / rows, [0, 67, 119, 323, 470, tw]
    headers = ["DATE", "HOURS", "WORK COMPLETED", "PARTS / FLUIDS", "BY"]
    c.setFillColor(NAVY)
    c.roundRect(tx, ty + th - hh, tw, hh, 5, fill=1, stroke=0)
    c.rect(tx, ty + th - hh, tw, 7, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 7.3)
    for i, heading in enumerate(headers):
        c.drawString(tx + cols[i] + 7, ty + th - 18, heading)
    c.setStrokeColor(LINE)
    c.setLineWidth(.65)
    for r in range(rows + 1):
        c.line(tx, ty + r * rh, tx + tw, ty + r * rh)
    for xo in cols:
        c.line(tx + xo, ty, tx + xo, ty + th)

    c.setFillColor(PALE)
    c.roundRect(30, 55, W - 60, 100, 7, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("HBW-Bold", 10.5)
    c.drawString(43, 133, "Need local Mercury service?")
    body = "If the boat can come to Harris Boat Works in Gores Landing, submit the serial number, current hours and symptoms at hbw.wiki/service."
    text_lines(c, wrap(body, 357, size=8.2), 43, 116, size=8.2, leading=10)
    c.setFillColor(MUTED)
    c.setFont("HBW-Italic", 7.3)
    c.drawString(43, 78, "Keep invoices, part numbers and fluid specifications with this record.")
    c.setFillColor(RED)
    c.roundRect(435, 81, 133, 45, 5, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("HBW-Bold", 9.2)
    c.drawCentredString(501.5, 108, "START A SERVICE REQUEST")
    c.setFont("HBW", 8.2)
    c.drawCentredString(501.5, 92, "hbw.wiki/service")
    c.linkURL(SERVICE_URL, (435, 81, 568, 126), relative=0)
    footer(c, 2)
    c.showPage()


def generate(output, root, fonts_dir=None):
    setup_fonts(fonts_dir)
    output.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(output), pagesize=letter, pageCompression=1)
    c.setTitle("Mercury Outboard Maintenance Planner")
    c.setAuthor("Harris Boat Works")
    c.setSubject("Model-aware Mercury outboard maintenance checklist and service record")
    c.setKeywords("Mercury outboard maintenance, service checklist, 100-hour service, 300-hour service, Harris Boat Works")
    c.setCreator("Harris Boat Works maintenance planner generator")
    c._doc.Catalog.Lang = PDFString("en-CA")
    page_one(c, root, qr_image())
    page_two(c, root)
    c.save()


def main():
    root = Path(__file__).resolve().parents[1]
    default = root / "public/downloads/mercury-outboard-maintenance-planner-hbw.pdf"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=default)
    parser.add_argument(
        "--fonts-dir",
        type=Path,
        help="Directory containing Arial or Liberation Sans TTF files",
    )
    args = parser.parse_args()
    generate(
        args.output.resolve(),
        root,
        args.fonts_dir.resolve() if args.fonts_dir else None,
    )
    print(args.output.resolve())


if __name__ == "__main__":
    main()
