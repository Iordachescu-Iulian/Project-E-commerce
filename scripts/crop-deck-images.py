"""Produce slide-specific crops of the deck diagrams.

The HTML deck shows each diagram with its own title block. On the PPTX slides
that title block is redundant (the slide already has a heading) and it costs
the vertical space needed to fit the diagram above the footer. The PNGs are
rendered at 2x, so the crop offsets below are 2x the SVG coordinates.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "deliverables"

# (source, target, pixels removed from the top, pixels removed from the bottom)
CROPS = [
    ("erd-deck", "erd-slide", 46, 0),
    ("sequence", "sequence-slide", 72, 40),
    ("architecture", "architecture-slide", 72, 0),
]


def main() -> None:
    for source, target, top, bottom in CROPS:
        path = OUT / f"{source}.png"
        with Image.open(path) as image:
            width, height = image.size
            box = (0, top * 2, width, height - bottom * 2)
            cropped = image.crop(box)
            cropped.save(OUT / f"{target}.png")
            print(f"{target}.png {cropped.width}x{cropped.height}")


if __name__ == "__main__":
    main()
