"""Renders the app icon set from one SVG design (needs Google Chrome + playwright).

Run from the repo root:  python3 design/icon/make-icons.py
The mark: an aurora-green timer ring around a varde (cairn) of stacked stones.
"""
import asyncio
import math
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets'
SRC = Path(__file__).resolve().parent

BG = '#0D171E'
BG2 = '#1E3442'
ORANGE = '#3FD6B0'  # aurora accent (name kept for the call sites)
WHITE = '#EEF4F6'


def mark(cx, cy, scale, color_ring=ORANGE, color_fig=WHITE):
    """Ring + figure centred at (cx, cy). scale 1.0 = ring radius 330 on a 1024 canvas."""
    s = scale
    r = 330 * s
    sw = 74 * s
    # ring: 300° arc, gap at the top right (like a timer that is almost done)
    # angles measured clockwise from 12 o'clock; the 60° gap sits at about 1–2 o'clock
    a_start, a_end = math.radians(80), math.radians(20)
    xs, ys = cx + r * math.sin(a_start), cy - r * math.cos(a_start)
    xe, ye = cx + r * math.sin(a_end), cy - r * math.cos(a_end)
    ring = f'<path d="M{xs:.1f} {ys:.1f} A{r:.1f} {r:.1f} 0 1 1 {xe:.1f} {ye:.1f}" fill="none" stroke="{color_ring}" stroke-width="{sw:.1f}" stroke-linecap="round"/>'
    # varde (cairn): four stacked stones
    k = s * 1.18  # cairn a bit larger than the original figure so it reads at small sizes
    def stone(x, y, rx, ry, fill):
        return f'<ellipse cx="{cx + x * k:.1f}" cy="{cy + (y - 20) * k:.1f}" rx="{rx * k:.1f}" ry="{ry * k:.1f}" fill="{fill}"/>'
    if color_fig == WHITE:
        shades = ['#B7C8D1', '#EEF4F6', '#9DB2BD', '#EEF4F6']
    else:
        shades = [color_fig] * 4
    fig = (
        stone(0, 162, 158, 56, shades[0])
        + stone(-12, 58, 122, 44, shades[1])
        + stone(14, -26, 88, 36, shades[2])
        + stone(-4, -100, 56, 30, shades[3])
    )
    return ring + fig


def svg(size, body, bg=True):
    back = (
        f'<defs><radialGradient id="g" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="{BG2}"/><stop offset="1" stop-color="{BG}"/></radialGradient></defs>'
        f'<rect width="{size}" height="{size}" fill="url(#g)"/>'
        if bg
        else ''
    )
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">{back}{body}</svg>'


DESIGNS = {
    # iOS / store icon: full bleed, no transparency
    'icon.png': (1024, svg(1024, mark(512, 512, 1.0)), True),
    # Android adaptive foreground: transparent, inside the 66 % safe zone
    'android-icon-foreground.png': (1024, svg(1024, mark(512, 512, 0.85), bg=False), False),
    'android-icon-monochrome.png': (1024, svg(1024, mark(512, 512, 0.85, '#FFFFFF', '#FFFFFF'), bg=False), False),
    # splash: transparent mark, shown centred on the dark background
    'splash-icon.png': (1024, svg(1024, mark(512, 512, 1.25), bg=False), False),
    'favicon.png': (192, svg(1024, mark(512, 512, 1.0)), True),
}


async def main():
    (SRC / 'icon.svg').write_text(DESIGNS['icon.png'][1])
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1024, 'height': 1024})
        for name, (size, s, opaque) in DESIGNS.items():
            await pg.set_content(f'<html><body style="margin:0;background:transparent">{s}</body></html>')
            tmp = SRC / f'_{name}'
            await pg.locator('svg').screenshot(path=str(tmp), omit_background=not opaque)
            im = Image.open(tmp).convert('RGB' if opaque else 'RGBA')
            if im.size[0] != size:
                im = im.resize((size, size), Image.LANCZOS)
            im.save(OUT / name)
            tmp.unlink()
        await b.close()
    # Android background layer: plain colour
    Image.new('RGB', (1024, 1024), BG).save(OUT / 'android-icon-background.png')
    print('icons written to', OUT)


asyncio.run(main())
