#!/usr/bin/env python3
"""Render an original, typography-only social card (1200x630); no generated illustrations."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "weekly-shitter/assets/issue-02-social.jpg"
W, H = 1200, 630

def font(size, serif=False):
    choices = (
      ["/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
       "/usr/share/fonts/truetype/liberation2/LiberationSerif-Bold.ttf"]
      if serif else
      ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
       "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"]
    )
    for f in choices:
        if Path(f).is_file():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

im = Image.new("RGB", (W, H), "#111216")
d = ImageDraw.Draw(im)
cream = "#f7f1e8"
red = "#ed4842"
muted = "#c9beb9"
d.rectangle((0, 0, W, 10), fill=red)
d.rectangle((0, 11, W, 100), fill="#19181c")
d.text((55, 38), "THE WEEKLY SHITTER", font=font(37), fill=cream)
d.text((974, 48), "ISSUE 02", font=font(24), fill=red)
d.rectangle((55, 131, 1145, 133), fill="#744340")
d.text((57, 151), "THE FELLAS  /  TRADE DEADLINE SPECIAL", font=font(23), fill=red)
d.text((49, 217), "EVERYBODY'S A", font=font(77, serif=True), fill=cream)
d.text((49, 324), "GENIUS UNTIL", font=font(82, serif=True), fill=cream)
d.text((49, 429), "SUNDAY.", font=font(92, serif=True), fill=red)
d.rectangle((55, 548, 1145, 550), fill="#744340")
d.text((57, 569), "FIVE TRADES. TEN GRADES. ONE MASSIVE SHITSHOW.", font=font(22), fill=muted)
DEST.parent.mkdir(parents=True, exist_ok=True)
im.save(DEST, "JPEG", quality=88, optimize=True, progressive=True, subsampling=0)
with Image.open(DEST) as check:
    assert check.size == (1200, 630) and check.format == "JPEG"
print(f"Created {DEST.relative_to(ROOT)}: {DEST.stat().st_size:,} bytes")
