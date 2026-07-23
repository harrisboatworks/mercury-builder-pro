#!/usr/bin/env python3
"""Generate the printable Mercury alarm quick-reference card."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "downloads" / "mercury-alarm-beep-codes-quick-reference.pdf"
HBW_LOGO = ROOT / "public" / "assets" / "harris-logo-black.png"
MERCURY_LOGO = ROOT / "public" / "assets" / "mercury-logo.png"

BLACK = colors.HexColor("#111111")
RED = colors.HexColor("#C8102E")
LIGHT_GREY = colors.HexColor("#F2F2F2")
MID_GREY = colors.HexColor("#666666")
WHITE = colors.white

PAGE_W, PAGE_H = landscape(letter)
MARGIN = 32
GUTTER = 16
PANEL_W = (PAGE_W - (2 * MARGIN) - GUTTER) / 2


def draw_image_contain(pdf, path, x, y, box_w, box_h):
    image = ImageReader(str(path))
    width, height = image.getSize()
    scale = min(box_w / width, box_h / height)
    draw_w = width * scale
    draw_h = height * scale
    pdf.drawImage(
        image,
        x + (box_w - draw_w) / 2,
        y + (box_h - draw_h) / 2,
        draw_w,
        draw_h,
        preserveAspectRatio=True,
        mask="auto",
    )


body_style = ParagraphStyle(
    "body",
    fontName="Helvetica",
    fontSize=6.65,
    leading=8.0,
    textColor=BLACK,
    alignment=TA_LEFT,
    spaceAfter=0,
)
bold_style = ParagraphStyle(
    "bold",
    parent=body_style,
    fontName="Helvetica-Bold",
)
header_style = ParagraphStyle(
    "header",
    parent=body_style,
    fontName="Helvetica-Bold",
    fontSize=6.8,
    leading=8.1,
    textColor=WHITE,
    alignment=TA_CENTER,
)


def p(text, bold=False):
    return Paragraph(text, bold_style if bold else body_style)


def table(data, widths):
    built = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    built.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLACK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B9B9B9")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return built


def draw_panel_title(pdf, x, y, title, source):
    pdf.setFillColor(BLACK)
    pdf.setFont("Helvetica-Bold", 10.5)
    pdf.drawString(x, y, title)
    pdf.setFillColor(MID_GREY)
    pdf.setFont("Helvetica", 6.5)
    pdf.drawString(x, y - 10, source)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H))
    pdf.setTitle("Mercury Alarm Beep Codes Quick Reference")
    pdf.setAuthor("Harris Boat Works")
    pdf.setSubject("Model-family-specific Mercury warning horn reference")

    draw_image_contain(pdf, HBW_LOGO, MARGIN, PAGE_H - 82, 76, 62)
    draw_image_contain(pdf, MERCURY_LOGO, PAGE_W - MARGIN - 162, PAGE_H - 72, 162, 34)

    pdf.setFillColor(BLACK)
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(PAGE_W / 2, PAGE_H - 43, "MERCURY ALARM BEEP CODES")
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(PAGE_W / 2, PAGE_H - 59, "One-page reference for two specific operator-manual families")
    pdf.setStrokeColor(RED)
    pdf.setLineWidth(2.5)
    pdf.line(MARGIN, PAGE_H - 83, PAGE_W - MARGIN, PAGE_H - 83)

    warning = (
        "<b>Start with the serial number.</b> Mercury alarm patterns vary by model, year, and rigging. "
        "Use the table that matches the engine family, then confirm it in that motor's operator manual."
    )
    warning_paragraph = Paragraph(
        warning,
        ParagraphStyle(
            "warning",
            parent=body_style,
            fontSize=7.4,
            leading=9.1,
            alignment=TA_CENTER,
            textColor=BLACK,
        ),
    )
    warning_paragraph.wrapOn(pdf, PAGE_W - (2 * MARGIN), 30)
    warning_paragraph.drawOn(pdf, MARGIN, PAGE_H - 108)

    left_x = MARGIN
    right_x = MARGIN + PANEL_W + GUTTER
    panel_title_y = PAGE_H - 128
    draw_panel_title(
        pdf,
        left_x,
        panel_title_y,
        "A. CLASSIC OPTIMAX TWO-STROKE",
        "2006 OptiMax operator-manual family",
    )
    draw_panel_title(
        pdf,
        right_x,
        panel_title_y,
        "B. OLDER 40/50/60 EFI FOURSTROKE",
        "2006 EFI FourStroke operator-manual family",
    )

    left_data = [
        [Paragraph("FUNCTION", header_style), Paragraph("HORN", header_style), Paragraph("MEANING / RESPONSE", header_style)],
        [p("Start-up", True), p("One beep", True), p("Normal system test")],
        [p("Low oil reserve", True), p("4 beeps / 2 min", True), p("Refill engine reservoir and remote oil tank")],
        [p("Water in fuel", True), p("4 beeps / 2 min", True), p("Water at full level in filter chamber; follow manual removal procedure")],
        [p("Cooling problem", True), p("Continuous", True), p("Guardian active. Neutral, check telltale and intakes; stop if flow is absent or intermittent")],
        [p("Oil critically low", True), p("Continuous", True), p("Guardian limits power. Refill engine reservoir and remote tank")],
        [p("Oil-pump failure", True), p("Continuous", True), p("No lubricating oil is reaching engine. Stop")],
        [p("Overspeed", True), p("Continuous", True), p("System limits RPM. Check prop pitch, engine height, and trim")],
        [p("Sensor out of range", True), p("Continuous / intermittent", True), p("Guardian may limit power. Service required")],
    ]
    right_data = [
        [Paragraph("HORN", header_style), Paragraph("CONDITION", header_style), Paragraph("BEHAVIOUR / RESPONSE", header_style)],
        [p("One beep", True), p("Normal key-up test"), p("No action if it does not recur")],
        [p("Six beeps", True), p("MAP, MAT, TPS, or ECM checksum"), p("May continue running; service required")],
        [p("3 beeps / 4 min", True), p("Voltage, EST, injector, coolant sensor, or IAC"), p("Hard start, rough run, or stall; service required")],
        [p("Intermittent", True), p("Fuel pump, relay, or ECM reference voltage"), p("May not start or may stall under load")],
        [p("Continuous", True), p("Overheat"), p("Guardian active. Stop and check intakes / cooling flow")],
        [p("Continuous", True), p("Low oil pressure"), p("This family: power may be limited to 10%. Stop and check oil")],
        [p("Continuous", True), p("Voltage below 10 V or above 16 V"), p("This family: power may be limited to 75%")],
        [p("Continuous", True), p("Coolant-sensor failure"), p("This family: power may be limited to 50%")],
        [p("Continuous", True), p("Speed limiter"), p("Cuts cylinders at 6,200 RPM; cuts all at 6,350 RPM")],
    ]

    left_table = table(left_data, [86, 86, PANEL_W - 172])
    right_table = table(right_data, [73, 126, PANEL_W - 199])
    left_w, left_h = left_table.wrap(PANEL_W, 380)
    right_w, right_h = right_table.wrap(PANEL_W, 380)
    table_top = panel_title_y - 18
    left_table.drawOn(pdf, left_x, table_top - left_h)
    right_table.drawOn(pdf, right_x, table_top - right_h)

    table_bottom = min(table_top - left_h, table_top - right_h)
    callout_y = max(48, table_bottom - 72)
    pdf.setFillColor(LIGHT_GREY)
    pdf.roundRect(MARGIN, callout_y, PAGE_W - (2 * MARGIN), 54, 6, stroke=0, fill=1)
    pdf.setFillColor(RED)
    pdf.rect(MARGIN, callout_y, 5, 54, stroke=0, fill=1)
    pdf.setFillColor(BLACK)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(MARGIN + 14, callout_y + 37, "CONTINUOUS ALARM, LOST COOLING FLOW, OR MAJOR POWER REDUCTION")
    pdf.setFont("Helvetica", 7.4)
    pdf.drawString(MARGIN + 14, callout_y + 24, "Reduce throttle and stop safely. Do not keep running to test whether the alarm clears.")
    pdf.drawString(MARGIN + 14, callout_y + 12, "Send the beep pattern, serial number, and display photo through hbw.wiki/service.")

    notes_y = 76
    pdf.setFillColor(BLACK)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(MARGIN, notes_y + 39, "OWNER NOTES FOR THE SERVICE REQUEST")
    pdf.setFont("Helvetica", 7)
    fields = [
        ("Motor serial number", MARGIN, 178),
        ("Exact beep pattern and interval", MARGIN + 192, 232),
        ("Display message / fault code", MARGIN + 438, PAGE_W - MARGIN - (MARGIN + 438)),
    ]
    for label, x, width in fields:
        pdf.setFillColor(MID_GREY)
        pdf.drawString(x, notes_y + 23, label)
        pdf.setStrokeColor(colors.HexColor("#B9B9B9"))
        pdf.setLineWidth(0.6)
        pdf.line(x, notes_y + 10, x + width, notes_y + 10)

    pdf.setFillColor(MID_GREY)
    pdf.setFont("Helvetica", 6.3)
    pdf.drawString(MARGIN, 24, "Reference only. The operator manual for the exact engine serial number remains the authority.")
    pdf.drawRightString(PAGE_W - MARGIN, 24, "mercuryrepower.ca/blog/mercury-outboard-beeping-codes-guide")
    pdf.setFillColor(BLACK)
    pdf.setFont("Helvetica-Bold", 6.3)
    pdf.drawCentredString(PAGE_W / 2, 13, "HARRIS BOAT WORKS  |  MERCURY DEALER SINCE 1965  |  GORES LANDING, ONTARIO")

    pdf.showPage()
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
