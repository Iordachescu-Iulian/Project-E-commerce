from __future__ import annotations

import math
from pathlib import Path

OUT = Path(__file__).parent

BG = "#14121F"
CARD = "#1E1B2E"
HEAD = "#2A2834"
INK = "#F4F2EC"
MUTED = "#B8B4CC"
ACCENT = "#5FE0A4"
SECONDARY = "#5B45E0"
LINE = "#55516B"

FONT = "Arial, Helvetica, sans-serif"


def svg(width: int, height: int, body: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img">
<style>
  text {{ font-family: {FONT}; fill: {INK}; }}
  .title {{ font-size: 26px; font-weight: 700; letter-spacing: 0.14em; }}
  .sub {{ font-size: 14px; fill: {MUTED}; }}
  .entity {{ font-size: 16px; font-weight: 700; }}
  .field {{ font-size: 12.5px; fill: {INK}; }}
  .badge {{ font-size: 10px; font-weight: 700; }}
  .rel {{ font-size: 12px; fill: {MUTED}; }}
  .note {{ font-size: 12px; fill: {MUTED}; }}
  .label {{ font-size: 13px; font-weight: 700; }}
  .arrow-label {{ font-size: 12px; fill: {MUTED}; }}
</style>
<rect width="{width}" height="{height}" fill="{BG}"/>
{body}
</svg>'''

# ---------------------------------------------------------------- ERD

ENTITY_W = 300
ROW_H = 20
HEAD_H = 34


def entity(x, y, name, rows, dashed=False):
    height = HEAD_H + len(rows) * ROW_H + 8
    stroke = SECONDARY if dashed else "#3A3650"
    parts = [f'<rect x="{x}" y="{y}" width="{ENTITY_W}" height="{height}" rx="8" fill="{CARD}" stroke="{stroke}" stroke-width="1.2"/>']
    parts.append(f'<rect x="{x}" y="{y}" width="{ENTITY_W}" height="{HEAD_H}" rx="8" fill="{HEAD}"/>')
    parts.append(f'<rect x="{x}" y="{y + HEAD_H - 8}" width="{ENTITY_W}" height="8" fill="{HEAD}"/>')
    parts.append(f'<text x="{x + 14}" y="{y + 22}" class="entity">{name}</text>')

    for index, (label, badge) in enumerate(rows):
        row_y = y + HEAD_H + 6 + index * ROW_H
        colour = ACCENT if badge in ("PK", "FK") else MUTED
        if badge:
            parts.append(f'<text x="{x + 12}" y="{row_y + 13}" class="badge" fill="{colour}">{badge}</text>')
        parts.append(f'<text x="{x + 62}" y="{row_y + 13}" class="field">{label}</text>')

    return "".join(parts), height


def crow_end(x, y, side):
    """Three prongs opening away from an entity edge."""
    if side == "top":
        pts = [(x, y), (x - 8, y - 12)], [(x, y), (x, y - 12)], [(x, y), (x + 8, y - 12)]
    elif side == "bottom":
        pts = [(x, y), (x - 8, y + 12)], [(x, y), (x, y + 12)], [(x, y), (x + 8, y + 12)]
    elif side == "left":
        pts = [(x, y), (x - 12, y - 8)], [(x, y), (x - 12, y)], [(x, y), (x - 12, y + 8)]
    else:
        pts = [(x, y), (x + 12, y - 8)], [(x, y), (x + 12, y)], [(x, y), (x + 12, y + 8)]

    return "".join(
        f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="{ACCENT}" stroke-width="1.6"/>'
        for a, b in pts
    )


def rel(points, one_side, many_side, label_one="1", label_many="N"):
    path = " ".join(f"{x},{y}" for x, y in points)
    parts = [f'<polyline points="{path}" fill="none" stroke="{ACCENT}" stroke-width="1.4" opacity="0.75"/>']

    mx, my = points[-1]
    parts.append(crow_end(mx, my, many_side))

    ox, oy = points[0]
    offsets = {
        "top": (10, -8),
        "bottom": (10, 14),
        "left": (-18, -8),
        "right": (10, -8),
    }
    dx, dy = offsets[one_side]
    parts.append(f'<text x="{ox + dx}" y="{oy + dy}" class="label" fill="{ACCENT}">{label_one}</text>')

    mx_offsets = {"top": (10, -8), "bottom": (10, 16), "left": (-20, -8), "right": (10, -8)}
    dx, dy = mx_offsets[many_side]
    parts.append(f'<text x="{mx + dx}" y="{my + dy}" class="label" fill="{ACCENT}">{label_many}</text>')

    return "".join(parts)


def build_erd():
    body = []
    body.append('<text x="30" y="34" class="title">HEXORA — ENTITY RELATIONSHIP DIAGRAM</text>')
    body.append('<text x="30" y="56" class="sub">13 models · MySQL 8.0 · Prisma schema · crow’s-foot notation</text>')

    entities = {}

    entities["User"] = (30, 84, [
        ("id", "PK"), ("email", "UQ"), ("passwordHash", ""), ("name", ""),
        ("role", ""), ("createdAt", ""), ("updatedAt", ""),
    ])
    entities["Address"] = (30, 290, [
        ("id", "PK"), ("userId", "FK"), ("fullName", ""), ("phone", ""),
        ("line1", ""), ("line2?", ""), ("city", ""), ("county?", ""),
        ("postalCode", ""), ("country", ""), ("isDefault", ""),
    ])
    entities["Cart"] = (30, 550, [
        ("id", "PK"), ("userId · unique", "FK"), ("createdAt", ""), ("updatedAt", ""),
    ])
    entities["CartItem"] = (30, 710, [
        ("id", "PK"), ("cartId", "FK"), ("productId", "FK"), ("quantity", ""),
    ])

    entities["Category"] = (370, 84, [
        ("id", "PK"), ("slug", "UQ"), ("name", ""), ("description", ""), ("createdAt", ""),
    ])
    entities["Product"] = (370, 250, [
        ("id", "PK"), ("slug", "UQ"), ("name", ""), ("gameTitle", ""),
        ("gameSlug", "IDX"), ("edition", ""), ("price", ""), ("stock", ""),
        ("platform", ""), ("format", ""), ("isActive", ""), ("categoryId", "FK"),
    ])
    entities["ProductImage"] = (370, 650, [
        ("id", "PK"), ("productId", "FK"), ("url", ""), ("alt", "NULL"),
        ("position", ""), ("createdAt", ""),
    ])
    entities["DeliveryMethod"] = (370, 830, [
        ("id", "PK"), ("code", "UQ"), ("name", ""), ("price", ""),
        ("isActive", ""), ("createdAt", ""),
    ])

    entities["Order"] = (720, 84, [
        ("id", "PK"), ("orderNumber", "UQ"), ("userId", "FK"), ("status", ""),
        ("paymentStatus", ""), ("subtotal", ""), ("discountAmount", ""),
        ("deliveryCost", ""), ("total", ""), ("discountCodeId?", "FK"),
        ("deliveryMethodId?", "FK"), ("deliveryMethodCode", ""), ("deliveryMethodName", ""),
        ("shippingName", ""), ("shippingPhone", ""), ("shippingLine1", ""),
        ("shippingCity", ""), ("shippingPostalCode", ""), ("shippingCountry", ""),
        ("stripePaymentIntentId", "UQ"), ("paidAt?", ""),
    ])
    entities["OrderItem"] = (720, 590, [
        ("id", "PK"), ("orderId", "FK"), ("productId?", "FK"),
        ("productName", ""), ("productSlug", ""), ("unitPrice", ""),
        ("quantity", ""), ("lineTotal", ""),
    ])
    entities["OrderStatusHistory"] = (720, 840, [
        ("id", "PK"), ("orderId", "FK"), ("fromStatus?", ""), ("toStatus", ""),
        ("actorId?", "FK"), ("note?", ""), ("createdAt", ""),
    ])

    entities["DiscountCode"] = (1070, 84, [
        ("id", "PK"), ("code", "UQ"), ("type", ""), ("value", ""),
        ("expiresAt?", ""), ("maxUses?", ""), ("usedCount", ""),
        ("isActive", ""), ("createdAt", ""),
    ])
    entities["PaymentEvent"] = (1070, 320, [
        ("id", "PK"), ("stripeEventId", "UQ"), ("type", ""), ("payload (JSON)", ""),
        ("processedAt", ""),
    ])

    boxes = {}
    for name, (x, y, rows) in entities.items():
        markup, height = entity(x, y, name, rows, dashed=name == "PaymentEvent")
        boxes[name] = (x, y, height)
        body.append(markup)

    # relationships
    body.append(rel([(180, 224), (180, 290)], "top", "top"))
    body.append(rel([(330, 150), (350, 150), (350, 580), (330, 580)], "right", "right"))
    body.append(rel([(150, 84), (150, 66), (870, 66), (870, 84)], "top", "top"))
    body.append(rel([(500, 204), (500, 250)], "bottom", "top"))
    body.append(rel([(500, 534), (500, 650)], "bottom", "top"))
    body.append(rel([(370, 500), (350, 500), (350, 760), (330, 760)], "left", "right"))
    body.append(rel([(180, 674), (180, 710)], "bottom", "top"))
    body.append(rel([(870, 564), (870, 590)], "bottom", "top"))
    body.append(rel([(670, 480), (694, 480), (694, 630), (720, 630)], "right", "left"))
    body.append(rel([(1020, 330), (1058, 330), (1058, 940), (1020, 940)], "right", "right"))
    body.append(rel([(600, 1014), (600, 1032), (1034, 1032), (1034, 430), (1020, 430)], "bottom", "right"))
    body.append(rel([(1070, 160), (1020, 160)], "left", "right"))
    body.append(rel(
        [(30, 210), (14, 210), (14, 1056), (700, 1056), (700, 940), (720, 940)],
        "left", "left",
    ))

    body.append(
        f'<rect x="1070" y="500" width="300" height="104" rx="8" fill="none" stroke="{SECONDARY}" stroke-dasharray="6 5"/>'
    )
    body.append('<text x="1084" y="526" class="entity" fill="#A99BFF">PaymentEvent is standalone</text>')
    body.append('<text x="1084" y="548" class="note">No foreign key: the order id travels in</text>')
    body.append('<text x="1084" y="566" class="note">PaymentIntent metadata.orderId.</text>')
    body.append('<text x="1084" y="584" class="note">Unique stripeEventId = idempotency.</text>')

    body.append(
        f'<rect x="30" y="1078" width="1340" height="1" fill="{LINE}" opacity="0.6"/>'
    )
    body.append('<text x="30" y="1102" class="note">Snapshots on Order keep the delivery address and prices valid even if the source rows change later.</text>')
    body.append(f'<text x="30" y="1122" class="note">DIGITAL / PHYSICAL editions of one game share gameSlug; OrderItem.productId is nullable so an order survives product deletion.</text>')

    (OUT / "erd.svg").write_text(svg(1440, 1140, "".join(body)), encoding="utf-8")


# ---------------------------------------------------------------- Architecture

def box(x, y, w, h, title, lines, accent=ACCENT, fill=CARD):
    parts = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="#3A3650" stroke-width="1.2"/>',
        f'<rect x="{x}" y="{y}" width="5" height="{h}" rx="2.5" fill="{accent}"/>',
        f'<text x="{x + 20}" y="{y + 30}" class="entity">{title}</text>',
    ]
    for index, line in enumerate(lines):
        parts.append(f'<text x="{x + 20}" y="{y + 56 + index * 21}" class="field" fill="{MUTED}">{line}</text>')
    return "".join(parts)


def labelled_arrow(x1, y1, x2, y2, label, dash=False, colour=ACCENT):
    dash_attr = 'stroke-dasharray="7 5"' if dash else ""
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2
    return (
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{colour}" stroke-width="2" marker-end="url(#arrow)" {dash_attr}/>'
        f'<rect x="{mid_x - len(label) * 3.4}" y="{mid_y - 20}" width="{len(label) * 6.8}" height="17" fill="{BG}"/>'
        f'<text x="{mid_x - len(label) * 3.2}" y="{mid_y - 7}" class="arrow-label">{label}</text>'
    )


def build_architecture():
    body = []
    body.append(
        '<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">'
        f'<path d="M0,0 L9,4.5 L0,9 z" fill="{ACCENT}"/></marker></defs>'
    )
    body.append('<text x="30" y="36" class="title">HEXORA — COMPONENT ARCHITECTURE</text>')
    body.append('<text x="30" y="58" class="sub">Next.js 14 full-stack monolith · Prisma · MySQL 8.0 · Stripe test mode</text>')

    body.append(f'<rect x="30" y="86" width="270" height="150" rx="12" fill="none" stroke="{LINE}" stroke-dasharray="7 5"/>')
    body.append('<text x="46" y="112" class="label" fill="#A99BFF">CLIENT</text>')
    body.append(box(46, 124, 238, 96, "Browser", ["React 18 · Tailwind CSS", "360 px → desktop", "HTML + fetch calls"], SECONDARY))

    body.append(f'<rect x="360" y="86" width="600" height="360" rx="12" fill="none" stroke="{LINE}" stroke-dasharray="7 5"/>')
    body.append('<text x="376" y="112" class="label" fill="#A99BFF">NEXT.JS 14 SERVER (Node 18)</text>')
    body.append(box(376, 130, 268, 120, "App Router pages", ["Server Components: catalog,", "category, product, account", "Client Components: forms,", "search, address editor"]))
    body.append(box(668, 130, 276, 120, "API route handlers", ["/api/auth/*  /api/addresses/*", "/api/products  /api/categories", "/api/webhooks/stripe", "Server-side guards on every route"]))
    body.append(box(376, 276, 268, 150, "Server-only layer", ["src/server/queries/*  (reads)", "src/server/services/*  (writes)", "src/lib/auth + session (JWT)", "src/lib/security (origin check)"]))
    body.append(box(668, 276, 276, 150, "Shared libraries", ["src/lib/prisma.ts (singleton)", "src/lib/stripe.ts (secret key)", "Zod schemas + money helpers", "No Prisma in Client Components"]))

    body.append(f'<rect x="1030" y="86" width="290" height="150" rx="12" fill="none" stroke="{LINE}" stroke-dasharray="7 5"/>')
    body.append('<text x="1046" y="112" class="label" fill="#A99BFF">DATA</text>')
    body.append(box(1046, 124, 258, 96, "MySQL 8.0.36", ["127.0.0.1:3307 (project local)", "13 tables · seeded 32 editions", "Transactions for stock"]))

    body.append(f'<rect x="1030" y="290" width="290" height="156" rx="12" fill="none" stroke="{LINE}" stroke-dasharray="7 5"/>')
    body.append('<text x="1046" y="316" class="label" fill="#A99BFF">EXTERNAL</text>')
    body.append(box(1046, 328, 258, 104, "Stripe (test mode)", ["PaymentIntents (weeks 8–9)", "Signed webhook events", "No live keys, no real cards"], SECONDARY))

    body.append(box(376, 520, 568, 96, "Prisma ORM 5.22", ["Parameterised SQL · schema.prisma is the single source of truth", "Migrations applied with prisma db push"], ACCENT))
    body.append(box(46, 520, 270, 96, "Local assets", ["public/images/products/*.svg", "Generated covers, no CDN", "Fast, offline demo"], ACCENT))

    body.append(labelled_arrow(284, 172, 360, 172, "HTTPS"))
    body.append(labelled_arrow(964, 190, 1030, 172, "SQL"))
    body.append(labelled_arrow(964, 380, 1030, 380, "Stripe SDK", dash=True, colour=SECONDARY))
    body.append(labelled_arrow(1175, 290, 1175, 328, "webhook"))
    body.append(labelled_arrow(660, 446, 660, 520, "Prisma client"))
    body.append(labelled_arrow(506, 520, 506, 446, "queries / services", dash=True))

    body.append('<text x="30" y="672" class="note">The Stripe secret key and webhook secret stay in .env on the server. The browser only sees the publishable key.</text>')
    body.append('<text x="30" y="692" class="note">Stripe confirms payments through the webhook, never through the browser redirect: the confirmation page only reads the database.</text>')

    (OUT / "architecture.svg").write_text(svg(1360, 720, "".join(body)), encoding="utf-8")


# ---------------------------------------------------------------- Sequence

def build_sequence():
    body = []
    body.append(
        '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">'
        f'<path d="M0,0 L8,4 L0,8 z" fill="{ACCENT}"/></marker>'
        '<marker id="arrow-muted" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">'
        f'<path d="M0,0 L8,4 L0,8 z" fill="{MUTED}"/></marker></defs>'
    )
    body.append('<text x="30" y="36" class="title">HEXORA — PAYMENT SEQUENCE</text>')
    body.append('<text x="30" y="58" class="sub">Critical flow: checkout → Stripe → webhook → order status → stock update</text>')

    actors = [
        ("Customer", 100, ACCENT),
        ("Browser / React", 330, SECONDARY),
        ("Next.js server", 560, ACCENT),
        ("MySQL", 800, "#A99BFF"),
        ("Stripe test mode", 1040, SECONDARY),
        ("Webhook route", 1270, ACCENT),
    ]
    top = 100
    bottom = 760

    for name, x, colour in actors:
        body.append(f'<rect x="{x - 92}" y="{top}" width="184" height="42" rx="8" fill="{HEAD}" stroke="#3A3650"/>')
        body.append(f'<text x="{x}" y="{top + 26}" class="entity" text-anchor="middle" fill="{colour}">{name}</text>')
        body.append(f'<line x1="{x}" y1="{top + 42}" x2="{x}" y2="{bottom}" stroke="{LINE}" stroke-dasharray="5 5"/>')

    steps = [
        (150, "Browser / React", "Next.js server", "1  POST /api/checkout"),
        (182, "Next.js server", "MySQL", "2  validate cart + stock, create Order NEW/UNPAID"),
        (214, "Next.js server", "Stripe test mode", "3  create PaymentIntent (server-side amount)"),
        (246, "Stripe test mode", "Browser / React", "4  client secret"),
        (278, "Browser / React", "Stripe test mode", "5  confirm card 4242 4242 4242 4242"),
        (330, "Stripe test mode", "Webhook route", "6  payment_intent.succeeded (signed)"),
        (378, "Webhook route", "Webhook route", "7  verify stripe-signature, unique PaymentEvent"),
        (426, "Webhook route", "MySQL", "8  tx: PAID + paidAt + stock −qty + history"),
        (470, "Webhook route", "Stripe test mode", "9  200 OK"),
        (520, "Customer", "Browser / React", "10  open confirmation page"),
        (552, "Browser / React", "Next.js server", "11  GET /orders/:id (reads DB only)"),
        (584, "Next.js server", "Browser / React", "12  order number + status PAID"),
    ]

    positions = {name: x for name, x, _ in actors}

    for index, (y, source, target, label) in enumerate(steps):
        sx = positions[source]
        tx = positions[target]

        if source == target:
            if sx > 1100:
                body.append(
                    f'<path d="M{sx},{y} h-56 v26 h56" fill="none" stroke="{ACCENT}" stroke-width="1.8" marker-end="url(#arrow)"/>'
                )
                body.append(f'<text x="{sx - 70}" y="{y + 12}" class="arrow-label" text-anchor="end">{label}</text>')
                continue
            body.append(
                f'<path d="M{sx},{y} h56 v26 h-56" fill="none" stroke="{ACCENT}" stroke-width="1.8" marker-end="url(#arrow)"/>'
            )
            body.append(f'<text x="{sx + 70}" y="{y + 12}" class="arrow-label">{label}</text>')
            continue

        direction = 1 if tx > sx else -1
        body.append(
            f'<line x1="{sx}" y1="{y}" x2="{tx - direction * 4}" y2="{y}" stroke="{ACCENT}" stroke-width="1.8" marker-end="url(#arrow)"/>'
        )
        anchor = "start" if direction > 0 else "end"
        text_x = sx + 8 if direction > 0 else sx - 8
        if abs(tx - sx) < 260:
            text_x = min(sx, tx)
            anchor = "start"
        body.append(f'<text x="{text_x}" y="{y - 7}" class="arrow-label" text-anchor="{anchor}">{label}</text>')

    body.append(f'<rect x="30" y="632" width="580" height="104" rx="8" fill="{CARD}" stroke="{ACCENT}" stroke-opacity="0.5"/>')
    body.append('<text x="46" y="656" class="label" fill="' + ACCENT + '">IMPLEMENTED AT P2</text>')
    body.append('<text x="46" y="680" class="note">Steps 6–9: signature check, idempotent event, paid order and stock in one transaction.</text>')
    body.append('<text x="46" y="700" class="note">Invalid signature → 400. Duplicate event → duplicate:true and no side effects.</text>')
    body.append('<text x="46" y="720" class="note">Failed payment (payment_intent.payment_failed) leaves the order UNPAID.</text>')

    body.append(f'<rect x="640" y="632" width="620" height="104" rx="8" fill="{CARD}" stroke="{SECONDARY}" stroke-opacity="0.7"/>')
    body.append('<text x="656" y="656" class="label" fill="#A99BFF">WEEKS 8–9</text>')
    body.append('<text x="656" y="680" class="note">Steps 1–5 and 10–12: checkout UI, PaymentIntent creation, card confirmation and confirmation page.</text>')
    body.append('<text x="656" y="700" class="note">A browser redirect never marks an order paid. Only the signed webhook does.</text>')
    body.append('<text x="656" y="720" class="note">Cancellation restores stock exactly once via restoreStockForCancelledOrder.</text>')

    (OUT / "sequence.svg").write_text(svg(1360, 780, "".join(body)), encoding="utf-8")


build_erd()
build_architecture()
build_sequence()


# ---------------------------------------------------------------- Compact ERD for the deck

SMALL_W = 260
SMALL_ROW = 19
SMALL_HEAD = 30


def entity_small(x, y, name, rows):
    height = SMALL_HEAD + len(rows) * SMALL_ROW + 6
    parts = [f'<rect x="{x}" y="{y}" width="{SMALL_W}" height="{height}" rx="7" fill="{CARD}" stroke="#3A3650" stroke-width="1.2"/>']
    parts.append(f'<rect x="{x}" y="{y}" width="{SMALL_W}" height="{SMALL_HEAD}" rx="7" fill="{HEAD}"/>')
    parts.append(f'<rect x="{x}" y="{y + SMALL_HEAD - 7}" width="{SMALL_W}" height="7" fill="{HEAD}"/>')
    parts.append(f'<text x="{x + 12}" y="{y + 20}" class="entity" style="font-size:15px">{name}</text>')

    for index, (label, badge) in enumerate(rows):
        row_y = y + SMALL_HEAD + 4 + index * SMALL_ROW
        colour = ACCENT if badge in ("PK", "FK") else MUTED
        if badge:
            parts.append(f'<text x="{x + 10}" y="{row_y + 12}" class="badge" fill="{colour}">{badge}</text>')
        parts.append(f'<text x="{x + 46}" y="{row_y + 12}" class="field" style="font-size:11.5px">{label}</text>')

    return "".join(parts), height


def link(points, one_xy, many_xy, many_side):
    path = " ".join(f"{x},{y}" for x, y in points)
    parts = [f'<polyline points="{path}" fill="none" stroke="{ACCENT}" stroke-width="1.4" opacity="0.8"/>']
    parts.append(crow_end(points[-1][0], points[-1][1], many_side))
    if one_xy:
        parts.append(f'<text x="{one_xy[0]}" y="{one_xy[1]}" class="label" fill="{ACCENT}" style="font-size:11px">{ONE}</text>')
    if many_xy:
        parts.append(f'<text x="{many_xy[0]}" y="{many_xy[1]}" class="label" fill="{ACCENT}" style="font-size:11px">{MANY}</text>')
    return "".join(parts)


ONE = "1"
MANY = "N"


def build_erd_deck():
    body = []
    body.append('<text x="20" y="24" class="title" style="font-size:22px">DATA MODEL \u2014 13 TABLES</text>')
    body.append('<text x="20" y="42" class="sub">One card per Prisma model; the full field list is in the specification document</text>')

    cards = {
        "User": (20, 68, [("id", "PK"), ("email", "UQ"), ("role", ""), ("passwordHash", "")]),
        "Address": (20, 200, [("id", "PK"), ("userId", "FK"), ("city", ""), ("isDefault", "")]),
        "Cart": (20, 332, [("id", "PK"), ("userId", "FK,UQ"), ("createdAt", "")]),
        "CartItem": (20, 445, [("id", "PK"), ("cartId", "FK"), ("productId", "FK"), ("quantity", "")]),
        "Category": (310, 68, [("id", "PK"), ("slug", "UQ"), ("name", "")]),
        "Product": (310, 181, [("id", "PK"), ("slug", "UQ"), ("gameSlug", "IDX"), ("price", ""), ("stock", ""), ("categoryId", "FK")]),
        "ProductImage": (310, 351, [("id", "PK"), ("productId", "FK"), ("url", "")]),
        "DeliveryMethod": (310, 464, [("id", "PK"), ("code", "UQ"), ("price", "")]),
        "Order": (610, 68, [("id", "PK"), ("orderNumber", "UQ"), ("userId", "FK"), ("status", ""), ("total", ""), ("deliveryMethodId", "FK"), ("discountCodeId", "FK")]),
        "OrderItem": (610, 300, [("id", "PK"), ("orderId", "FK"), ("productId", "FK"), ("quantity", ""), ("unitPrice", "")]),
        "OrderStatusHistory": (610, 490, [("id", "PK"), ("orderId", "FK"), ("toStatus", ""), ("actorId", "FK")]),
        "DiscountCode": (900, 68, [("id", "PK"), ("code", "UQ"), ("type", ""), ("value", "")]),
        "PaymentEvent": (900, 210, [("id", "PK"), ("stripeEventId", "UQ"), ("type", ""), ("processedAt", "")]),
    }

    for name, (x, y, rows) in cards.items():
        markup, _ = entity_small(x, y, name, rows)
        body.append(markup)

    body.append(link([(150, 180), (150, 200)], (132, 194), (164, 192), "top"))
    body.append(link([(150, 312), (150, 332)], (132, 326), (164, 324), "top"))
    body.append(link([(150, 425), (150, 445)], (132, 439), (164, 437), "top"))
    body.append(link([(440, 161), (440, 181)], (422, 175), (454, 173), "top"))
    body.append(link([(440, 331), (440, 351)], (422, 345), (454, 343), "top"))
    body.append(link([(570, 300), (592, 300), (592, 400), (610, 400)], (576, 292), (598, 418), "left"))
    body.append(link([(870, 190), (884, 190), (884, 556), (870, 556)], (872, 183), (888, 548), "right"))
    body.append(link([(884, 365), (870, 365)], None, None, "right"))
    body.append(link([(1030, 68), (1030, 52), (740, 52), (740, 68)], (1014, 62), (748, 44), "top"))

    body.append(f'<rect x="900" y="360" width="260" height="250" rx="8" fill="{CARD}" stroke="{SECONDARY}" stroke-opacity="0.7"/>')
    body.append('<text x="916" y="386" class="label" fill="#A99BFF" style="font-size:12px">READING THE DIAGRAM</text>')
    body.append('<text x="916" y="412" class="note">Crow\u2019s foot marks the many side.</text>')
    body.append('<text x="916" y="432" class="note">PK key \u00b7 FK foreign key \u00b7 UQ unique</text>')
    body.append('<text x="916" y="452" class="note">IDX indexed \u00b7 all FKs are indexed</text>')
    body.append('<text x="916" y="486" class="note" fill="#F4F2EC">Optional FKs on Order</text>')
    body.append('<text x="916" y="506" class="note">deliveryMethodId \u2192 DeliveryMethod</text>')
    body.append('<text x="916" y="526" class="note">discountCodeId \u2192 DiscountCode</text>')
    body.append('<text x="916" y="560" class="note">PaymentEvent stores no FK: the order</text>')
    body.append('<text x="916" y="580" class="note">id arrives in the webhook metadata.</text>')

    (OUT / "erd-deck.svg").write_text(svg(1280, 660, "".join(body)), encoding="utf-8")


build_erd_deck()
print("wrote erd.svg, erd-deck.svg, architecture.svg, sequence.svg")
