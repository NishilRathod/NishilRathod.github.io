"""Generate public/og.png, the 1200x630 social preview card.

Run: python scripts/make_og.py

Uses Georgia and Segoe UI rather than the site's Fraunces/Geist: the webfonts
ship as woff2, which Pillow cannot read, and converting them would mean pulling
in fontTools + brotli. Same serif/sans pairing, close enough at preview size.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og.png"

W, H = 1200, 630
BG = "#05070c"
TEXT = "#eef2fb"
MUTED = "#9fb0c8"
ACCENT = "#6b8cff"
HAIRLINE = "#20242e"

NAME = "Nishil Rathod"
TAGLINE = "Backend systems and the tools around them."
FOOTER = "nishilrathod.github.io"
EYEBROW = "PORTFOLIO"

FONTS = Path("C:/Windows/Fonts")


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    pad = 88

    # Accent rule at the top-left, echoing the section numerals on the site.
    d.rectangle([pad, pad, pad + 56, pad + 4], fill=ACCENT)

    d.text((pad, pad + 34), EYEBROW, font=font("segoeui.ttf", 22), fill=ACCENT)
    d.text((pad, pad + 96), NAME, font=font("georgiab.ttf", 96), fill=TEXT)
    d.text((pad, pad + 232), TAGLINE, font=font("segoeui.ttf", 38), fill=MUTED)

    # Hairline above the footer, matching the section dividers.
    d.rectangle([pad, H - pad - 62, W - pad, H - pad - 61], fill=HAIRLINE)
    d.text((pad, H - pad - 40), FOOTER, font=font("segoeui.ttf", 26), fill=MUTED)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes, {W}x{H})")


if __name__ == "__main__":
    main()
