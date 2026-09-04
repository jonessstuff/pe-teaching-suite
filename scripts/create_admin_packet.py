#!/usr/bin/env python3
"""Create the branded PlansK12 administrator information packet."""

from pathlib import Path
import shutil

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "PlansK12-Administrator-Information-Packet.pdf"
PUBLIC = ROOT / "public" / "resources" / "PlansK12-Administrator-Information-Packet.pdf"
LOGO = Path("/Users/staceyjones/Downloads/PlansK12_Logo_Reference-Matched_Transparent_2048px.png")

W, H = letter
NAVY = HexColor("#0A2B65")
NAVY_2 = HexColor("#071F48")
TEAL = HexColor("#16A6AD")
BLUE = HexColor("#4F7FFA")
INK = HexColor("#172033")
MUTED = HexColor("#566376")
PALE = HexColor("#F4F7FA")
PALE_BLUE = HexColor("#EDF3FF")
PALE_TEAL = HexColor("#E9F8F8")
BORDER = HexColor("#DCE4EC")
GREEN = HexColor("#158465")
AMBER = HexColor("#C47A12")


def rounded(c, x, y, w, h, fill, radius=12, stroke=None, line=1):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(line)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def wrap_lines(text, font, size, max_width):
    paragraphs = text.split("\n")
    lines = []
    for paragraph in paragraphs:
        if not paragraph:
            lines.append("")
            continue
        words = paragraph.split()
        line = words[0]
        for word in words[1:]:
            candidate = f"{line} {word}"
            if stringWidth(candidate, font, size) <= max_width:
                line = candidate
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def draw_text(c, text, x, y, max_width, font="Helvetica", size=10, color=INK, leading=None):
    leading = leading or size * 1.35
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap_lines(text, font, size, max_width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_centered(c, text, x, y, width, font="Helvetica", size=10, color=INK, leading=None):
    leading = leading or size * 1.35
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap_lines(text, font, size, width):
        c.drawCentredString(x + width / 2, y, line)
        y -= leading
    return y


def eyebrow(c, text, x, y, color=TEAL):
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(color)
    c.drawString(x, y, text.upper())


def page_title(c, title, subtitle=None):
    eyebrow(c, "PlansK12 administrator information", 48, H - 57)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(48, H - 92, title)
    if subtitle:
        draw_text(c, subtitle, 48, H - 117, W - 96, size=10.5, color=MUTED, leading=14)
    c.setStrokeColor(TEAL)
    c.setLineWidth(3)
    c.line(48, H - 132, 116, H - 132)


def footer(c, page_num):
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(48, 39, W - 48, 39)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTED)
    c.drawString(48, 25, "PlansK12 | Administrator Information Packet | August 2026")
    c.drawRightString(W - 48, 25, str(page_num))


def check_item(c, text, x, y, width, size=9.5, color=INK):
    c.setFillColor(TEAL)
    c.circle(x + 5, y + 2, 5, fill=1, stroke=0)
    c.setStrokeColor(white)
    c.setLineWidth(1.3)
    c.line(x + 2.4, y + 2, x + 4.4, y)
    c.line(x + 4.4, y, x + 8, y + 4.5)
    return draw_text(c, text, x + 16, y + 6, width - 16, size=size, color=color, leading=size * 1.35) - 5


def card(c, x, y, w, h, title, body, accent=TEAL, index=None):
    rounded(c, x, y, w, h, white, 12, BORDER, 0.8)
    c.setFillColor(accent)
    c.roundRect(x, y, 5, h, 2.5, fill=1, stroke=0)
    if index is not None:
        rounded(c, x + 16, y + h - 39, 25, 25, accent, 8)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(x + 28.5, y + h - 31, str(index))
        title_x = x + 50
    else:
        c.setFillColor(accent)
        c.circle(x + 24, y + h - 27, 7, fill=1, stroke=0)
        title_x = x + 39
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(title_x, y + h - 31, title)
    draw_text(c, body, x + 17, y + h - 53, w - 34, size=8.8, color=MUTED, leading=12)


def cover(c, logo):
    c.setFillColor(NAVY_2)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.circle(W + 10, H - 20, 170, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.circle(-40, 40, 135, fill=1, stroke=0)
    rounded(c, 45, H - 190, 290, 120, white, 16)
    c.drawImage(logo, 67, H - 174, 246, 90, preserveAspectRatio=True, anchor="c", mask="auto")
    eyebrow(c, "School and district edition", 48, H - 235, HexColor("#7CE5E7"))
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 33)
    c.drawString(48, H - 282, "Administrator")
    c.drawString(48, H - 323, "Information Packet")
    draw_text(c, "A practical planning and program-management platform built for specialty educators.", 48, H - 365, 390, size=14, color=HexColor("#D9E8F5"), leading=19)

    facts = [
        ("30+", "specialty modules"),
        ("K-12", "planning and teacher tools"),
        ("1", "connected workspace"),
    ]
    x = 48
    for number, label in facts:
        rounded(c, x, 214, 150, 92, HexColor("#0E376F"), 13, HexColor("#2A568B"), 0.8)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(x + 16, 265, number)
        draw_text(c, label, x + 16, 244, 118, size=9.5, color=HexColor("#BFD4E8"), leading=12)
        x += 164

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(white)
    c.drawString(48, 164, "Created by a 27-year educator")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(HexColor("#BFD4E8"))
    c.drawString(48, 145, "Designed around the real work teachers do before, during, and after instruction.")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(48, 87, "plansk12.com")
    c.drawRightString(W - 48, 87, "hello@plansk12.com")
    c.linkURL("https://plansk12.com", (48, 78, 130, 100), relative=0)
    c.linkURL("mailto:hello@plansk12.com", (425, 78, W - 48, 100), relative=0)
    c.showPage()


def page_two(c):
    page_title(c, "Why PlansK12", "Specialty educators need more than a generic text generator. PlansK12 brings planning, usable resources, progress tools, and program workflows into one teacher-friendly system.")
    card(c, 48, 520, 246, 112, "Teacher time matters", "Create structured lessons, units, assessments, sub plans, parent communication, and supporting materials without rebuilding every format from scratch.", TEAL)
    card(c, 318, 520, 246, 112, "Specialists deserve purpose-built tools", "Each workspace is shaped around its field, from PE participation and CTE employability skills to library programs, art shows, and intervention family nights.", BLUE)
    card(c, 48, 384, 246, 112, "Plans become usable programs", "Teachers can run challenges, events, SMART goals, tryouts, grant work, trackers, showcases, and other ongoing responsibilities inside the same platform.", GREEN)
    card(c, 318, 384, 246, 112, "Consistency without rigidity", "Clear structures help teachers produce dependable materials while keeping professional judgment, local expectations, and student needs at the center.", AMBER)

    rounded(c, 48, 158, W - 96, 190, PALE_BLUE, 16)
    eyebrow(c, "Administrator value", 68, 320, BLUE)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(68, 293, "One platform supports many hard-to-serve roles")
    y = 263
    items = [
        "Reduce the number of disconnected planning tools educators must learn and manage.",
        "Give specialty teachers consistent structures without forcing every subject into one generic template.",
        "Support new teachers, experienced teachers, interventionists, therapists, and program leaders.",
        "Make lessons, goals, events, and teacher-created resources easier to save, revisit, print, and share.",
    ]
    for item in items:
        y = check_item(c, item, 68, y, W - 136, 9.5)
    footer(c, 2)
    c.showPage()


def page_three(c):
    page_title(c, "What educators can do", "PlansK12 combines instructional planning with the tools needed to carry a specialty program through the school year.")
    cards = [
        ("Plan instruction", "Lessons, units, pacing guides, curriculum maps, warm-ups, assessments, worksheets, and differentiation.", TEAL),
        ("Prepare resources", "Print-ready materials plus Word, PowerPoint, visual, and classroom-resource exports where available.", BLUE),
        ("Track progress", "Class and grade-level SMART goals, participation, run progress, standards, evidence, and reflection.", GREEN),
        ("Run school programs", "Challenges, family nights, Field Day, STEM Night, art shows, concerts, recitals, productions, and showcases.", AMBER),
        ("Support operations", "Sub binders, rosters, schedules, classroom-management tools, coaching, tryouts, grants, and career experiences.", HexColor("#9157C8")),
        ("Keep work together", "Module-focused lesson libraries, saved projects, reusable tools, mobile access, and organized specialty workspaces.", HexColor("#D05D7B")),
    ]
    positions = [(48, 505), (318, 505), (48, 362), (318, 362), (48, 219), (318, 219)]
    for i, ((title, body, accent), (x, y)) in enumerate(zip(cards, positions), start=1):
        card(c, x, y, 246, 116, title, body, accent, i)
    rounded(c, 48, 103, W - 96, 82, NAVY, 14)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(67, 151, "Built around teacher choice")
    draw_text(c, "Educators select their specialty, grade range, goals, and context. PlansK12 provides a reliable structure; the teacher reviews, adjusts, and owns the final instructional decision.", 67, 130, W - 134, size=9.5, color=HexColor("#DCE8F4"), leading=13)
    footer(c, 3)
    c.showPage()


def page_four(c):
    page_title(c, "Who it serves", "More than 30 specialty and support roles can work from one account. Every educator receives access to the complete platform, not a restricted subject-only version.")
    groups = [
        ("Specialty instruction", ["PE & Health", "Art", "Music", "Library & Media", "STEM & Makerspace", "Theater / Drama", "Dance", "World Languages", "Elementary Technology", "After-School Clubs", "JROTC"], TEAL),
        ("Career and advanced learning", ["CTE pathways", "Gifted & Talented", "Reading Specialists", "Math Specialists", "Test Prep", "Instructional Coaching", "Staff PD & Meeting Planning"], BLUE),
        ("Student services and early learning", ["Special Education", "Adaptive PE", "ESL / ELL", "School Counselors", "Speech-Language Pathology", "Occupational Therapy", "Physical Therapy", "Teachers of the Visually Impaired", "Teachers of the Deaf & Hard of Hearing", "Student Support Teams", "Early Childhood / Pre-K", "Early Childhood Special Education", "Intervention Planning"], GREEN),
    ]
    x_positions = [48, 218, 388]
    for (title, entries, accent), x in zip(groups, x_positions):
        rounded(c, x, 178, 154, 430, white, 14, BORDER, 0.8)
        c.setFillColor(accent)
        c.roundRect(x, 558, 154, 50, 14, fill=1, stroke=0)
        draw_centered(c, title, x + 10, 586, 134, font="Helvetica-Bold", size=10, color=white, leading=12)
        y = 536
        for entry in entries:
            c.setFillColor(accent)
            c.circle(x + 16, y + 2, 2.5, fill=1, stroke=0)
            y = draw_text(c, entry, x + 25, y + 5, 117, size=8.2, color=INK, leading=10.8) - 4
    rounded(c, 48, 97, W - 96, 55, PALE_TEAL, 12)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(66, 129, "Growing with educator feedback")
    draw_text(c, "New tools and deeper specialty workflows are added as teachers identify practical needs.", 66, 111, W - 132, size=8.8, color=MUTED, leading=11)
    footer(c, 4)
    c.showPage()


def page_five(c):
    page_title(c, "Implementation, privacy, and review", "PlansK12 can begin with a focused teacher group and expand after administrators understand fit, usage, and purchasing needs.")
    eyebrow(c, "A simple rollout", 48, 625, BLUE)
    steps = [
        ("1", "Discovery", "Confirm educator roles, grade levels, goals, purchasing process, and desired timeline."),
        ("2", "Walkthrough or pilot", "Show the relevant specialty workspaces and let a small group test real school tasks."),
        ("3", "Launch", "Create individual educator accounts, provide a short orientation, and identify a school contact."),
        ("4", "Review", "Use teacher feedback and privacy-safe product usage to evaluate adoption and next steps."),
    ]
    y = 557
    for number, title, body in steps:
        rounded(c, 48, y, W - 96, 58, white, 10, BORDER, 0.8)
        rounded(c, 62, y + 14, 30, 30, NAVY, 9)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(77, y + 24, number)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(108, y + 35, title)
        draw_text(c, body, 108, y + 20, W - 174, size=8.5, color=MUTED, leading=10.5)
        y -= 72

    rounded(c, 48, 116, W - 96, 142, PALE_BLUE, 14)
    eyebrow(c, "Current student-data practices", 66, 232, BLUE)
    privacy_items = [
        "Teacher rosters and saved work are separated by account-level database rules.",
        "Student-facing pages are excluded from automatic product analytics and session replay.",
        "Supported AI tools use an alias in place of a known student display-name field.",
        "Teachers are instructed to use minimal identifiers and keep protected records out of free-text notes.",
    ]
    y = 208
    for item in privacy_items:
        y = check_item(c, item, 66, y, W - 132, 8.5)
    c.setFont("Helvetica-Oblique", 7.3)
    c.setFillColor(MUTED)
    c.drawString(48, 83, "Schools should complete their own technology, privacy, and purchasing review before entering student information.")
    footer(c, 5)
    c.showPage()


def page_six(c):
    page_title(c, "Group access and next steps", "School and district options are designed to make purchasing straightforward while preserving an individual workspace for every educator.")
    rounded(c, 48, 493, W - 96, 134, NAVY, 16)
    eyebrow(c, "Group access", 68, 598, HexColor("#7CE5E7"))
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(68, 568, "Annual options for 5 or more educators")
    draw_text(c, "Volume pricing is based on educator count, rollout scope, and support needs. Every licensed educator receives an individual account with access to all specialty modules and teacher tools.", 68, 542, W - 136, size=10, color=HexColor("#DCE8F4"), leading=14)

    benefits = [
        ("All modules included", "No subject-by-subject add-on fees."),
        ("Individual teacher workspaces", "Each educator keeps their own lessons, resources, classes, and tools."),
        ("Flexible starting scope", "Begin with a department, one school, multiple schools, or a district pilot."),
        ("Personal support", "School inquiries are reviewed directly by Stacey, the educator who created PlansK12."),
    ]
    y = 433
    for i, (title, body) in enumerate(benefits):
        x = 48 if i % 2 == 0 else 318
        if i == 2:
            y = 323
        rounded(c, x, y, 246, 86, white, 12, BORDER, 0.8)
        c.setFillColor(TEAL)
        c.circle(x + 22, y + 57, 6, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(x + 37, y + 53, title)
        draw_text(c, body, x + 17, y + 33, 212, size=8.5, color=MUTED, leading=11)

    rounded(c, 48, 112, W - 96, 173, PALE_TEAL, 16)
    eyebrow(c, "Start the conversation", 69, 256, TEAL)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(69, 228, "Request a written quote or short walkthrough")
    draw_text(c, "Share the roles you want to support, the approximate number of educators, and your preferred timeline. PlansK12 will respond with the most useful next step - information, a demonstration, or a pilot conversation.", 69, 202, W - 138, size=9.5, color=MUTED, leading=13)
    rounded(c, 69, 135, 205, 40, NAVY, 10)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawCentredString(171.5, 150, "Visit plansk12.com/#schools")
    c.linkURL("https://plansk12.com/#schools", (69, 135, 274, 175), relative=0)
    rounded(c, 290, 135, 205, 40, white, 10, TEAL, 1)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawCentredString(392.5, 150, "Email hello@plansk12.com")
    c.linkURL("mailto:hello@plansk12.com", (290, 135, 495, 175), relative=0)
    footer(c, 6)
    c.showPage()


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    if not LOGO.exists():
        raise FileNotFoundError(f"PlansK12 logo not found: {LOGO}")
    logo = ImageReader(str(LOGO))
    c = canvas.Canvas(str(OUTPUT), pagesize=letter, pageCompression=1)
    c.setTitle("PlansK12 Administrator Information Packet")
    c.setAuthor("PlansK12")
    c.setSubject("School and district overview of PlansK12")
    cover(c, logo)
    page_two(c)
    page_three(c)
    page_four(c)
    page_five(c)
    page_six(c)
    c.save()
    shutil.copy2(OUTPUT, PUBLIC)
    print(OUTPUT)
    print(PUBLIC)


if __name__ == "__main__":
    main()

