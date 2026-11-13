"""Build the editable P2 deck (P2 - Hexora.pptx) with python-pptx.

The HTML deck is the visual reference; this file mirrors its layout on a
13.333 x 7.5 inch canvas using the same 1280 x 720 coordinate system.
"""

from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "P2 - Hexora.pptx"

BG = RGBColor(0x14, 0x12, 0x1F)
SURFACE = RGBColor(0x1E, 0x1B, 0x2E)
SURFACE2 = RGBColor(0x2A, 0x28, 0x34)
INK = RGBColor(0xF4, 0xF2, 0xEC)
MUTED = RGBColor(0xB8, 0xB4, 0xCC)
LINE = RGBColor(0x3A, 0x36, 0x50)
ACCENT = RGBColor(0x5F, 0xE0, 0xA4)
SECONDARY = RGBColor(0x5B, 0x45, 0xE0)
LAVENDER = RGBColor(0xA9, 0x9B, 0xFF)
AMBER = RGBColor(0xFF, 0xC4, 0x57)
FONT = "Arial"

PX_TO_PT = 0.75
EMU_PER_PT = 12700


def px(value):
    return Emu(int(value * PX_TO_PT * EMU_PER_PT))


def pt(px_value):
    return Pt(px_value * PX_TO_PT)


prs = Presentation()
prs.slide_width = px(1280)
prs.slide_height = px(720)
BLANK = prs.slide_layouts[6]


def new_slide():
    slide = prs.slides.add_slide(BLANK)
    rect(slide, 0, 0, 1280, 720, BG, shape=MSO_SHAPE.RECTANGLE)
    return slide


def rect(slide, x, y, w, h, fill, line=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.035):
    shape_obj = slide.shapes.add_shape(shape, px(x), px(y), px(w), px(h))
    if shape is MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            shape_obj.adjustments[0] = radius
        except IndexError:
            pass
    shape_obj.fill.solid()
    shape_obj.fill.fore_color.rgb = fill
    if line is None:
        shape_obj.line.fill.background()
    else:
        shape_obj.line.color.rgb = line
        shape_obj.line.width = Pt(1)
    shape_obj.shadow.inherit = False
    return shape_obj


def textbox(slide, x, y, w, h, anchor=MSO_ANCHOR.TOP, wrap=True):
    box = slide.shapes.add_textbox(px(x), px(y), px(w), px(h))
    frame = box.text_frame
    frame.word_wrap = wrap
    frame.vertical_anchor = anchor
    frame.margin_left = 0
    frame.margin_right = 0
    frame.margin_top = 0
    frame.margin_bottom = 0
    return frame


def write(frame, runs, size, color, bold=False, align=PP_ALIGN.LEFT, line_spacing=1.18, space_after=0):
    """runs: string, or list of paragraphs; a paragraph is a string or list of run tuples."""
    if isinstance(runs, str):
        runs = [runs]
    first = True
    for paragraph in runs:
        p = frame.paragraphs[0] if first else frame.add_paragraph()
        first = False
        p.alignment = align
        p.line_spacing = line_spacing
        p.space_after = pt(space_after)
        pieces = [(paragraph, color, bold)] if isinstance(paragraph, str) else paragraph
        for piece, piece_color, piece_bold, *rest in pieces:
            run = p.add_run()
            run.text = piece
            run.font.name = FONT
            run.font.size = pt(rest[0]) if rest else pt(size)
            run.font.bold = piece_bold
            run.font.color.rgb = piece_color


def kicker(slide, text, y=52):
    write(textbox(slide, 64, y, 900, 18), text.upper(), 11, ACCENT, bold=True)


def heading(slide, text, y=78, size=38):
    write(textbox(slide, 64, y, 1100, 54), text, size, INK, bold=True, line_spacing=1.05)


def lead(slide, text, y=140, w=900, size=15):
    write(textbox(slide, 64, y, w, 46), text, size, MUTED, line_spacing=1.4)


def footer(slide, left, index):
    write(textbox(slide, 64, 676, 600, 16), left.upper(), 10, RGBColor(0x6F, 0x6A, 0x85))
    write(
        textbox(slide, 1000, 676, 216, 16),
        f"{index} / 15",
        10,
        RGBColor(0x6F, 0x6A, 0x85),
        align=PP_ALIGN.RIGHT,
    )


def code_badge(slide, x, y, label, width=54):
    rect(slide, x, y, width, 22, SURFACE, line=ACCENT, radius=0.5)
    write(textbox(slide, x, y + 3, width, 16), label, 9, ACCENT, bold=True, align=PP_ALIGN.CENTER)


def card(slide, x, y, w, h, title, body, badge=None, status=None, status_color=ACCENT, title_size=16, body_size=11.5):
    rect(slide, x, y, w, h, SURFACE, line=LINE)
    inner_x = x + 20
    cursor = y + 16
    if badge:
        code_badge(slide, inner_x, cursor, badge, width=max(46, 12 + 7 * len(badge)))
        cursor += 32
    write(textbox(slide, inner_x, cursor, w - 40, 22), title, title_size, INK, bold=True)
    cursor += title_size + 10
    write(textbox(slide, inner_x, cursor, w - 40, h - (cursor - y) - 34), body, body_size, MUTED, line_spacing=1.35)
    if status:
        write(textbox(slide, inner_x, y + h - 26, w - 40, 16), "● " + status.upper(), 9, status_color, bold=True)


def trace(slide, items, y=598):
    rect(slide, 64, y, 1152, 1, LINE, shape=MSO_SHAPE.RECTANGLE)
    x = 64
    for label, value in items:
        width = 12 + 5.5 * (len(label) + len(value))
        frame = textbox(slide, x, y + 12, width, 18)
        write(frame, [[(label + " ", ACCENT, True), (value, MUTED, False)]], 10, MUTED)
        x += width + 18


def picture(slide, path, x, y, w=None, h=None):
    image_path = ROOT / path if not Path(path).is_absolute() else Path(path)
    with Image.open(image_path) as img:
        ratio = img.height / img.width
    if w and not h:
        h = w * ratio
    elif h and not w:
        w = h / ratio
    slide.shapes.add_picture(str(image_path), px(x), px(y), px(w), px(h))
    return h


def table(slide, x, y, widths, rows, header_size=9, body_size=10.5, row_h=30, header_h=30):
    cols = len(widths)
    total_w = sum(widths)
    shape = slide.shapes.add_table(len(rows), cols, px(x), px(y), px(total_w), px(header_h + row_h * (len(rows) - 1)))
    tbl = shape.table
    tbl.first_row = True
    tbl.horz_banding = False
    style_id = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}"
    tbl_pr = tbl._tbl.tblPr
    for child in tbl_pr.findall(qn("a:tableStyleId")):
        tbl_pr.remove(child)
    style = tbl_pr.makeelement(qn("a:tableStyleId"), {})
    style.text = style_id
    tbl_pr.append(style)

    for index, width in enumerate(widths):
        tbl.columns[index].width = px(width)
    for r, row in enumerate(rows):
        tbl.rows[r].height = px(header_h if r == 0 else row_h)
        for c, value in enumerate(row):
            cell = tbl.cell(r, c)
            cell.margin_left = px(10)
            cell.margin_right = px(8)
            cell.margin_top = px(4)
            cell.margin_bottom = px(4)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.fill.solid()
            cell.fill.fore_color.rgb = SURFACE2 if r == 0 else (BG if r % 2 else RGBColor(0x19, 0x16, 0x23))
            frame = cell.text_frame
            frame.word_wrap = True
            is_code = isinstance(value, tuple)
            label = value[0] if is_code else value
            color = ACCENT if is_code else (MUTED if r == 0 else INK)
            write(frame, label, header_size if r == 0 else body_size, color, bold=(r == 0))
    return tbl


# ------------------------------------------------------------------ 1 cover
slide = new_slide()
rect(slide, 880, 0, 400, 300, RGBColor(0x20, 0x18, 0x3A), shape=MSO_SHAPE.RECTANGLE)
write(textbox(slide, 64, 168, 400, 24), "H E X O R A", 16, INK, bold=True)
write(textbox(slide, 64, 200, 1150, 250), ["SPECIFICATION", "& PROTOTYPE"], 92, INK, bold=True, line_spacing=1.0)
write(textbox(slide, 64, 458, 1100, 30), "Video games, digital and physical — P2 · Week 7", 22, ACCENT)
meta = [
    ("Motroc Cosmin Alexandru", "Catalog & admin lead"),
    ("Nica Rares-Octavian", "Payments & security lead"),
    ("Iordachescu Iulian Daniel", "Accounts & shopping lead"),
    ("E-Commerce · 2026–2027", "P2 · Hexora"),
]
for index, (name, role) in enumerate(meta):
    x = 64 + index * 292
    write(textbox(slide, x, 520, 280, 22), name, 13, INK, bold=True)
    write(textbox(slide, x, 544, 280, 20), role, 11, MUTED)
footer(slide, "Hexora · P2", 1)

# ------------------------------------------------------------------ 2 status
slide = new_slide()
kicker(slide, "Status since P1")
heading(slide, "From a plan to a running store")
lead(slide, "The data model, component architecture and API surface are frozen. The three riskiest areas — catalog, accounts and payments — run against a seeded MySQL database.")
stats = [("13", "tables in the frozen Prisma schema"), ("32", "purchasable editions from 16 games and 4 categories"), ("9", "test files, one command: npm test"), ("3", "branches, each with its own author and review")]
for index, (value, label) in enumerate(stats):
    x = 64 + index * 290
    rect(slide, x, 200, 272, 96, SURFACE, line=LINE)
    write(textbox(slide, x + 18, 216, 60, 40), value, 34, ACCENT, bold=True)
    write(textbox(slide, x + 18, 258, 236, 36), label, 10.5, MUTED)
columns = [
    ("Frozen at P2", "ERD, endpoint list, wireframes, auth contract, payment service contract. Later changes need a written request."),
    ("Working today", "A1 catalog, A2 search, A4 accounts, A10 groundwork, A6 webhook, admin/local MySQL setup, seed data."),
    ("Next: weeks 8–12", "A3 cart, A5 checkout, A7 stock UI, A8 history, A9 admin, A11 responsive, A12 full test suite, B4 + B5."),
]
for index, (title, body) in enumerate(columns):
    x = 64 + index * 388
    rect(slide, x, 320, 364, 150, SURFACE, line=LINE)
    write(textbox(slide, x + 20, 338, 324, 22), title, 15, INK, bold=True)
    write(textbox(slide, x + 20, 366, 324, 92), body, 11.5, MUTED, line_spacing=1.35)
rect(slide, 64, 492, 1152, 78, SURFACE, line=LINE)
write(textbox(slide, 84, 506, 1112, 20), "Why an edition is a product", 13, INK, bold=True)
write(
    textbox(slide, 84, 530, 1112, 34),
    "The edition is the row that is sold: it carries its own price, stock, platform and format, while gameSlug links the digital and physical rows so a product page can offer the sibling edition.",
    11,
    MUTED,
    line_spacing=1.3,
)
trace(slide, [("Repo", "github.com/Iordachescu-Iulian/Project-E-commerce"), ("Schema", "prisma/schema.prisma"), ("Seed", "prisma/seed-products.ts")], y=592)
footer(slide, "Status · P2", 2)

# ------------------------------------------------------------------ 3 A1–A4
slide = new_slide()
kicker(slide, "Requirements A1–A4")
heading(slide, "Catalog, search, accounts")
cards = [
    ("A1", "Product catalog", "Server-rendered paginated catalog (24/page), category pages and a product page with gallery, price, stock, platform and sibling edition.", "Implemented", ACCENT),
    ("A2", "Basic search", "Case-insensitive search on product names with filters in the URL and an explicit “No games found” state.", "Implemented", ACCENT),
    ("A3", "Shopping cart", "One cart per authenticated user; add, update, remove; server-recalculated totals; stock caps; persists after logout.", "Weeks 8–9", AMBER),
    ("A4", "User accounts", "Register, login, logout, bcrypt hashes, signed httpOnly JWT and address CRUD with one default address.", "Implemented", ACCENT),
]
for index, (badge, title, body, status, color) in enumerate(cards):
    card(slide, 64 + index * 290, 166, 272, 210, title, body, badge=badge, status=status, status_color=color, title_size=15)
lower = [
    ("What the demo proves", "4 categories · 16 games · 32 editions · 64 generated images, all read from MySQL at 127.0.0.1:3307. A missing cover falls back and a zero-stock edition is visibly out of stock."),
    ("Server-side by design", "Prisma is imported only in src/server/* and route handlers. Passwords never leave the server as hashes; the cookie is httpOnly, SameSite=Lax and signed with HS256."),
]
for index, (title, body) in enumerate(lower):
    x = 64 + index * 582
    rect(slide, x, 396, 570, 128, SURFACE, line=LINE)
    write(textbox(slide, x + 20, 414, 530, 22), title, 15, INK, bold=True)
    write(textbox(slide, x + 20, 442, 530, 70), body, 11.5, MUTED, line_spacing=1.35)
trace(slide, [("Catalog", "src/app/(shop)/catalog · categories/[slug] · products/[slug]"), ("Queries", "src/server/queries/catalog.ts"), ("Seed", "prisma/seed-products.ts"), ("Accounts", "src/lib/auth.ts · src/app/account")])
footer(slide, "Requirements · A1–A4", 3)

# ------------------------------------------------------------------ 4 A5–A8
slide = new_slide()
kicker(slide, "Requirements A5–A8")
heading(slide, "Checkout, payment, stock and history")
cards = [
    ("A5", "Checkout", "Address → delivery method (digital 0 lei, courier 19,99 lei) → server-validated summary → card payment, then a confirmation page.", "Weeks 8–9", AMBER),
    ("A6", "Sandbox payment", "Only a signed payment_intent.succeeded webhook marks an order Paid. A redirect never changes status; a failure stays Unpaid.", "Webhook now", ACCENT),
    ("A7", "Stock management", "Conditional stock >= quantity decrement inside the paid transaction; rollback on conflict; cancellation restores stock once.", "Service now", ACCENT),
    ("A8", "Order history", "Customer order list and detail with date, items, total, payment state and status history.", "Week 9", AMBER),
]
for index, (badge, title, body, status, color) in enumerate(cards):
    card(slide, 64 + index * 290, 166, 272, 200, title, body, badge=badge, status=status, status_color=color, title_size=15)
flow = [
    ("1 · Checkout", "Server reloads the cart, validates stock, creates Order NEW / UNPAID."),
    ("2 · PaymentIntent", "Amount computed server-side; Stripe.js confirms the test card."),
    ("3 · Webhook", "Signature verified, event stored once, order PAID, stock −qty, history appended."),
    ("4 · Confirmation", "Page reads the database; the redirect is never trusted."),
]
for index, (title, body) in enumerate(flow):
    x = 64 + index * 290
    rect(slide, x, 386, 272, 118, SURFACE, line=LINE)
    write(textbox(slide, x + 16, 400, 240, 20), title, 11, INK, bold=True)
    write(textbox(slide, x + 16, 424, 240, 68), body, 10.5, MUTED, line_spacing=1.3)
trace(slide, [("Webhook", "src/app/api/webhooks/stripe/route.ts"), ("Service", "src/server/services/payments.ts"), ("Docs", "docs/payments.md · scripts/test-webhook.mjs")])
footer(slide, "Requirements · A5–A8", 4)

# ------------------------------------------------------------------ 5 A9–A12
slide = new_slide()
kicker(slide, "Requirements A9–A12")
heading(slide, "Admin, security, responsive, tests")
cards = [
    ("A9", "Administration panel", "Separate ADMIN role, product/category CRUD with image upload, order list by status and audited transitions New → Paid → Shipped → Delivered.", "Weeks 10–11", AMBER),
    ("A10", "Basic security", "Zod validation, same-origin check on mutating routes, security headers, server-side role guards, Prisma parameterisation.", "Groundwork now", ACCENT),
    ("A11", "Responsive design", "All customer pages usable at 360 px: 2-column grid on mobile, 4-column desktop, no horizontal scroll.", "Implemented", ACCENT),
    ("A12", "Automated tests", "Vitest, one command. Payment confirmation, stock, auth, sessions, catalog and money covered; cart and totals join with A3.", "Growing", ACCENT),
]
for index, (badge, title, body, status, color) in enumerate(cards):
    card(slide, 64 + index * 290, 166, 272, 200, title, body, badge=badge, status=status, status_color=color, title_size=15)
lower = [
    ("Why the split matters", "A10 is not a UI concern: every route calls requireUser / requireRole and every mutating request passes assertSameOrigin before touching data."),
    ("What P3 will grade", "Only working behaviour. The prototype already exercises the parts that are easy to fake: database reads, password hashing, cookie sessions, webhook signatures and stock transactions."),
]
for index, (title, body) in enumerate(lower):
    x = 64 + index * 582
    rect(slide, x, 386, 570, 120, SURFACE, line=LINE)
    write(textbox(slide, x + 20, 404, 530, 22), title, 15, INK, bold=True)
    write(textbox(slide, x + 20, 432, 530, 62), body, 11.5, MUTED, line_spacing=1.35)
trace(slide, [("Security", "src/lib/security.ts · next.config.mjs"), ("Tests", "9 files · vitest · npm test"), ("Responsive", "docs/screenshots/*-360.png")])
footer(slide, "Requirements · A9–A12", 5)

# ------------------------------------------------------------------ 6 bonuses
slide = new_slide()
kicker(slide, "Bonuses")
heading(slide, "B4 sales dashboard · B5 discount codes")
bonuses = [
    ("B4 · 3 points", "Daily sales, top products, average order", ["Data: Order.paidAt, Order.total, OrderItem.quantity.", "Aggregates: grouped SQL over the selected interval, not hard-coded numbers.", "Filter: from/to dates, default last 30 days.", "Owner: Cosmin · week 11."]),
    ("B5 · 3 points", "Percentage or fixed discounts", ["Model: DiscountCode + Order.discountCodeId.", "Rules: type, value, optional expiry, maximum uses; validated on the server.", "Counter: increments once per paid order.", "Admin: list, create, edit, deactivate. Owner: Iulian · week 11."]),
]
for index, (badge, title, body) in enumerate(bonuses):
    x = 64 + index * 582
    rect(slide, x, 166, 570, 300, SURFACE, line=LINE)
    code_badge(slide, x + 20, 186, badge, width=110)
    write(textbox(slide, x + 20, 226, 520, 34), title, 24, INK, bold=True, line_spacing=1.15)
    write(textbox(slide, x + 20, 282, 520, 160), body, 12, MUTED, line_spacing=1.4, space_after=8)
lead(slide, "Only B4 and B5 are claimed. Bonuses score only after A1–A12 work, so both land in week 11, after checkout and admin.", y=500)
footer(slide, "Bonuses · B4 + B5", 6)

# ------------------------------------------------------------------ 7 ERD
slide = new_slide()
kicker(slide, "Data model")
heading(slide, "13 tables, one edition per product")
picture(slide, "docs/deliverables/erd-slide.png", 96, 146, w=1088)
footer(slide, "ERD · Prisma schema", 7)

# ------------------------------------------------------------------ 8 architecture
slide = new_slide()
kicker(slide, "Architecture")
heading(slide, "Next.js full stack, Prisma, MySQL, Stripe")
picture(slide, "docs/deliverables/architecture-slide.png", 96, 146, w=1088)
footer(slide, "Architecture", 8)

# ------------------------------------------------------------------ 9 API implemented
slide = new_slide()
kicker(slide, "API surface")
heading(slide, "Implemented at P2")
rows = [("Method", "Route", "Access", "Purpose")]
rows += [
    ("GET", ("/api/products",), "public", "Paginated catalog, max 24/page; q, category, page, filters"),
    ("GET", ("/api/products/[slug]",), "public", "Product detail with images and sibling editions"),
    ("GET", ("/api/categories",), "public", "Categories with active edition counts"),
    ("POST", ("/api/auth/register",), "public", "Create account, hash password, start session"),
    ("POST", ("/api/auth/login",), "public", "Verify password, set signed session cookie"),
    ("POST", ("/api/auth/logout",), "authenticated", "Clear the session cookie"),
    ("GET", ("/api/auth/me",), "authenticated", "Current user"),
    ("GET", ("/api/addresses",), "customer", "List own addresses, default first"),
    ("POST", ("/api/addresses",), "customer", "Create address, first one becomes default"),
    ("PATCH", ("/api/addresses/[id]",), "owner", "Update address or promote to default"),
    ("DELETE", ("/api/addresses/[id]",), "owner", "Delete address, promote the next one"),
    ("POST", ("/api/webhooks/stripe",), "Stripe signature", "Verify, store once, mark order paid, decrement stock"),
]
table(slide, 64, 150, [92, 330, 150, 580], rows, header_size=9, body_size=10, row_h=28)
write(textbox(slide, 64, 610, 1152, 20), "Access levels are enforced on the server; hiding a link in the UI is never the control.", 11, MUTED)
footer(slide, "API · implemented", 9)

# ------------------------------------------------------------------ 10 API frozen
slide = new_slide()
kicker(slide, "API surface")
heading(slide, "Frozen for P3", y=74, size=34)
left = [("Method", "Route", "Access")] + [
    ("GET", ("/api/cart",), "customer"),
    ("POST", ("/api/cart/items",), "customer"),
    ("PATCH", ("/api/cart/items/[id]",), "owner"),
    ("DELETE", ("/api/cart/items/[id]",), "owner"),
    ("POST", ("/api/checkout",), "customer"),
    ("GET", ("/api/orders",), "customer"),
    ("GET", ("/api/orders/[id]",), "owner"),
    ("GET", ("/api/delivery-methods",), "public"),
    ("POST", ("/api/discounts/validate",), "customer"),
]
right = [("Method", "Admin route", "Access")] + [
    ("GET/POST", ("/api/admin/products",), "ADMIN"),
    ("PATCH/DELETE", ("/api/admin/products/[id]",), "ADMIN"),
    ("POST", ("/api/admin/products/[id]/images",), "ADMIN"),
    ("GET/POST", ("/api/admin/categories",), "ADMIN"),
    ("PATCH/DELETE", ("/api/admin/categories/[id]",), "ADMIN"),
    ("GET", ("/api/admin/orders",), "ADMIN"),
    ("PATCH", ("/api/admin/orders/[id]/status",), "ADMIN"),
    ("GET", ("/api/admin/dashboard",), "ADMIN · B4"),
    ("GET/POST/PATCH", ("/api/admin/discounts",), "ADMIN · B5"),
]
table(slide, 64, 150, [78, 288, 184], left, header_size=9, body_size=9.5, row_h=34, header_h=28)
table(slide, 640, 150, [126, 308, 96], right, header_size=9, body_size=9.5, row_h=34, header_h=28)
write(textbox(slide, 64, 600, 1152, 40), "Access model: requireUser for authenticated routes, requireRole('ADMIN') for the admin surface, ownership checks on address and order ids, and assertSameOrigin on every mutating browser request.", 10.5, MUTED, line_spacing=1.3)
footer(slide, "API · frozen for P3", 10)

# ------------------------------------------------------------------ 11 sequence
slide = new_slide()
kicker(slide, "Critical flow")
heading(slide, "Payment sequence")
picture(slide, "docs/deliverables/sequence-slide.png", 108, 146, w=1064)
footer(slide, "Sequence · checkout → webhook → stock", 11)

# ------------------------------------------------------------------ 12 wireframes 1
slide = new_slide()
kicker(slide, "User interface")
heading(slide, "Wireframes — catalog, product, cart")
items = [("wireframe-catalog.png", "Catalog · A1"), ("wireframe-product.png", "Product · A1"), ("wireframe-cart.png", "Cart · A3")]
note_y = 0
for index, (name, caption) in enumerate(items):
    x = 64 + index * 388
    height = picture(slide, f"docs/deliverables/{name}", x, 156, w=364)
    write(textbox(slide, x, 156 + height + 8, 364, 18), caption.upper(), 9.5, MUTED)
    note_y = 156 + height + 8
write(textbox(slide, 64, note_y + 34, 1152, 40), "Wide screens shown; every customer page keeps the same hierarchy at 360 px, with the product grid collapsing from four columns to two.", 11.5, MUTED)
footer(slide, "Wireframes · 1 of 2", 12)

# ------------------------------------------------------------------ 13 wireframes 2
slide = new_slide()
kicker(slide, "User interface")
heading(slide, "Wireframes — checkout, administration")
items = [("wireframe-checkout.png", "Checkout · A5 / A6"), ("wireframe-admin.png", "Administration · A9")]
note_y = 0
for index, (name, caption) in enumerate(items):
    x = 64 + index * 582
    height = picture(slide, f"docs/deliverables/{name}", x, 152, w=560)
    write(textbox(slide, x, 152 + height + 8, 560, 18), caption.upper(), 9.5, MUTED)
    note_y = 152 + height + 8
write(textbox(slide, 64, note_y + 30, 1152, 60), "Checkout makes the delivery cost and the payment state explicit. The admin panel exposes role-guarded CRUD, status filters and the audited transition path.", 11.5, MUTED, line_spacing=1.4)
footer(slide, "Wireframes · 2 of 2", 13)

# ------------------------------------------------------------------ 14 screenshots
slide = new_slide()
kicker(slide, "Working prototype")
heading(slide, "Live data from MySQL")
shots = [
    ("home-1440.png", "Home · 1440 px"),
    ("catalog-1440.png", "Catalog · A1"),
    ("product-1440.png", "Product · siblings"),
    ("search-1440.png", "Search · A2"),
    ("login-1440.png", "Login · A4"),
    ("account-1440.png", "Account · addresses"),
]
for index, (name, caption) in enumerate(shots):
    x = 64 + (index % 3) * 384
    y = 146 + (index // 3) * 262
    height = picture(slide, f"docs/screenshots/{name}", x, y, w=330)
    write(textbox(slide, x, y + height + 6, 330, 16), caption.upper(), 9, MUTED)
footer(slide, "Prototype · seeded database", 14)

# ------------------------------------------------------------------ 15 schedule
slide = new_slide()
kicker(slide, "Plan, risks and questions")
heading(slide, "Weeks 8–12", y=74, size=34)
rows = [("Week", "Work", "Owner", "Status")]
rows += [
    ("3", "P1, repository, README", "All", "done"),
    ("4", "ERD, endpoints, wireframes", "All", "done"),
    ("5", "Seed data · A1 catalog · A4 accounts", "Cosmin, Iulian", "done"),
    ("6", "A2 search · Stripe setup · login prototype", "Cosmin, Rares", "done"),
    ("7", "P2 specification and live prototype", "All", "done"),
    ("8", "A3 cart · A5 checkout", "Iulian, Rares", "next"),
    ("9", "A6 confirmation · A7 stock · A8 history", "Rares, Iulian", "planned"),
    ("10", "A9 admin panel · A10 security", "Cosmin, Rares", "planned"),
    ("11", "A11 responsive · A12 tests · B4 + B5", "Cosmin, Iulian", "planned"),
    ("12", "P3 fixes, backup video, final README", "All", "planned"),
]
table(slide, 64, 150, [70, 500, 220, 90], rows, header_size=9, body_size=10, row_h=29, header_h=28)
rect(slide, 990, 150, 226, 170, SURFACE, line=LINE)
write(textbox(slide, 1008, 166, 190, 20), "Risks we watch", 13, INK, bold=True)
write(textbox(slide, 1008, 194, 190, 116), ["Payments & stock · webhook-first, conditional updates, transaction tests.", "Integration · frozen contracts and small merges.", "Scope · required features first, freeze in week 11."], 9.5, MUTED, line_spacing=1.3, space_after=5)
rect(slide, 990, 336, 226, 130, SURFACE, line=ACCENT)
write(textbox(slide, 1008, 352, 190, 20), "Thank you — questions", 13, INK, bold=True)
write(textbox(slide, 1008, 380, 190, 70), "Repository, branch and PR links are in the README and the specification document.", 9.5, MUTED, line_spacing=1.35)
trace(slide, [("Branches", "3 feature branches, one author each"), ("Integration", "p2/integration → main · tag P2"), ("Docs", "README · schedule · PR bodies")], y=560)
footer(slide, "Schedule · risks · Q&A", 15)

prs.save(OUT)
print(f"wrote {OUT.name} with {len(prs.slides.__iter__.__self__._sldIdLst)} slides")
