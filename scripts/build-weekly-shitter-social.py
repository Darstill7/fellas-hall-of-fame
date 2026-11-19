#!/usr/bin/env python3
"""Build a 1200x630 share card from Issue 02's approved art. Stdlib + Pillow + CairoSVG."""
from io import BytesIO
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "weekly-shitter/assets/issue-02-newsroom.svg"
DEST = ROOT / "weekly-shitter/assets/issue-02-social.jpg"
W, H = 1200, 630

def font(size, serif=False):
    candidates = (
        ["/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
         "/usr/share/fonts/truetype/liberation2/LiberationSerif-Bold.ttf"]
        if serif else
        ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"]
    )
    for candidate in candidates:
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()

canvas = Image.new("RGB", (W, H), "#0d0e12")
draw = ImageDraw.Draw(canvas)
draw.rectangle((0, 0, W, 73), fill="#101116")
draw.rectangle((0, 0, W, 7), fill="#e34a45")
draw.text((48, 25), "THE WEEKLY SHITTER", font=font(30), fill="#f8f4ec")
draw.text((939, 32), "ISSUE 02  /  THE FELLAS", font=font(15), fill="#f0aaa4")
art_bytes = cairosvg.svg2png(url=str(SOURCE), output_width=1200, output_height=590)
art = Image.open(BytesIO(art_bytes)).convert("RGB")
canvas.paste(art.crop((0, 90, 1200, 465)), (0, 73))
draw.rectangle((0, 438, W, H), fill="#101116")
draw.rectangle((48, 464, 127, 470), fill="#e84a45")
draw.text((49, 481), "EVERYBODY'S A GENIUS UNTIL SUNDAY", font=font(45, serif=True), fill="#f7f2e9")
draw.text((50, 558), "Five trades. A first-place showdown. A collapse of common fucking sense.", font=font(18), fill="#d0c5c1")
draw.text((50, 599), "NOVEMBER 19, 2026   /   THE TRADE DEADLINE MELTDOWN", font=font(12), fill="#ef726d")
DEST.parent.mkdir(parents=True, exist_ok=True)
canvas.save(DEST, "JPEG", quality=85, optimize=True, progressive=True, subsampling=0)
with Image.open(DEST) as check:
    assert check.size == (1200, 630) and check.format == "JPEG"
print(f"Created {DEST.relative_to(ROOT)}: {DEST.stat().st_size:,} bytes")
