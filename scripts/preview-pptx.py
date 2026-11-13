"""Approximate PowerPoint rendering for visual QA without Office installed.

Draws every shape, picture and table of a .pptx onto a 1280x720 canvas with
PIL, using Arial metrics, and reports text that does not fit its box.
"""

import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.util import Emu

FONT_PATH = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
SCALE = 96 / 72  # points -> pixels
OUT_DIR = Path(__file__).resolve().parents[1] / "docs" / "deliverables" / "pptx-preview"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def emu_to_px(value):
    return int(round(value / 914400 * 96))


def font_for(size_pt, bold):
    size_px = max(6, int(round(size_pt * SCALE)))
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size_px)


def wrap(text, font, max_width):
    words = text.split(" ")
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or font.getlength(candidate) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_text_frame(draw, shape, report, slide_index):
    frame = shape.text_frame
    x = emu_to_px(shape.left)
    y = emu_to_px(shape.top)
    w = emu_to_px(shape.width)
    h = emu_to_px(shape.height)
    cursor = float(y)
    total = 0
    for paragraph in frame.paragraphs:
        runs = [run for run in paragraph.runs if run.text]
        if not runs:
            cursor += 8
            total += 8
            continue
        size_pt = (runs[0].font.size.pt if runs[0].font.size else 18)
        bold = bool(runs[0].font.bold)
        colour = runs[0].font.color.rgb if runs[0].font.color and runs[0].font.color.type is not None else None
        fill = tuple(int(str(colour)[i : i + 2], 16) for i in (0, 2, 4)) if colour is not None else (244, 242, 236)
        font = font_for(size_pt, bold)
        line_h = size_pt * SCALE * (paragraph.line_spacing or 1.2)
        text = "".join(run.text for run in runs)
        lines = wrap(text, font, max(w, 10))
        for line in lines:
            draw.text((x, cursor), line, font=font, fill=fill)
            cursor += line_h
            total += line_h
        cursor += 2
    if total > h + 6:
        report.append(
            f"slide {slide_index}: text overflows its box by {int(total - h)}px "
            f"({(shape.text_frame.text[:48] + 'â€¦') if len(shape.text_frame.text) > 48 else shape.text_frame.text!r})"
        )


def render(path):
    prs = Presentation(path)
    width = emu_to_px(prs.slide_width)
    height = emu_to_px(prs.slide_height)
    report = []

    for index, slide in enumerate(prs.slides, start=1):
        canvas = Image.new("RGB", (width, height), (11, 9, 17))
        draw = ImageDraw.Draw(canvas)

        for shape in slide.shapes:
            if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                pic = Image.open(io.BytesIO(shape.image.blob))
                target = (emu_to_px(shape.width), emu_to_px(shape.height))
                canvas.paste(pic.convert("RGB").resize(target), (emu_to_px(shape.left), emu_to_px(shape.top)))
                continue

            if shape.has_table:
                table = shape.table
                x = emu_to_px(shape.left)
                y = emu_to_px(shape.top)
                for r, row in enumerate(table.rows):
                    row_h = emu_to_px(row.height)
                    col_x = x
                    for c, cell in enumerate(row.cells):
                        col_w = emu_to_px(table.columns[c].width)
                        try:
                            fill = cell.fill.fore_color.rgb
                            colour = tuple(int(str(fill)[i : i + 2], 16) for i in (0, 2, 4))
                        except Exception:
                            colour = (30, 27, 46)
                        draw.rectangle([col_x, y, col_x + col_w, y + row_h], fill=colour)
                        text = cell.text_frame.text
                        if text:
                            run = next(
                                (r for p in cell.text_frame.paragraphs for r in p.runs if r.text),
                                None,
                            )
                            size_pt = run.font.size.pt if run is not None and run.font.size else 10
                            f = font_for(size_pt, r == 0)
                            draw.text((col_x + 8, y + 6), text[:70], font=f, fill=(184, 180, 204) if r == 0 else (244, 242, 236))
                        col_x += col_w
                    y += row_h
                continue

            if shape.has_text_frame and shape.text_frame.text.strip():
                draw_text_frame(draw, shape, report, index)
                continue

            if shape.shape_type == MSO_SHAPE_TYPE.AUTO_SHAPE:
                x, y = emu_to_px(shape.left), emu_to_px(shape.top)
                w, h = emu_to_px(shape.width), emu_to_px(shape.height)
                try:
                    rgb = shape.fill.fore_color.rgb
                    colour = tuple(int(str(rgb)[i : i + 2], 16) for i in (0, 2, 4))
                except Exception:
                    colour = None
                if colour:
                    radius = min(w, h) * 0.06
                    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=colour)

        canvas.save(OUT_DIR / f"slide-{index:02d}.png")

    print("\n".join(report) if report else "no overflow detected")


if __name__ == "__main__":
    render(sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parents[1] / "P2 - Hexora.pptx"))
