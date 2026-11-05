"""Store screenshots (6.9" iPhone, 1320x2868) from the web build with demo data.

1. npx expo export --platform web --output-dir <dist>
2. python3 design/screenshots/make.py <dist> <out-dir>

Needs Google Chrome, playwright and Pillow. Fonts: Inter (Display) from the system.
"""
import asyncio
import datetime as dt
import http.server
import json
import os
import sys
import threading
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from playwright.async_api import async_playwright

DIST = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
PORT = 8790
W, H = 1320, 2868
BG = (18, 17, 16)
ORANGE = (255, 106, 43)
TEXT = (244, 239, 234)
MUTED = (163, 154, 144)
FONT_BOLD = '/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'
FONT_MED = '/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf'

CAPTIONS = {
    'en': [
        ('One plan for everything', 'Gym, kettlebell, running and mobility in one week'),
        ('A voice coach in your pocket', 'EMOM, AMRAP, Tabata, sets and intervals'),
        ('63 animated exercises', 'With short technique cues for each one'),
        ('Ready-made programs', 'From your first pull-up to your first 5K'),
        ('See your progress', 'Weights, distance, pace and weekly streaks'),
        ('Free. No ads. No tracking.', 'Your data stays on your phone'),
    ],
    'nb': [
        ('Én plan for all trening', 'Styrke, kettlebell, løping og mobilitet i én uke'),
        ('Stemmetrener i lomma', 'EMOM, AMRAP, Tabata, sett og intervaller'),
        ('63 animerte øvelser', 'Med korte teknikktips for hver øvelse'),
        ('Ferdige programmer', 'Fra din første pullup til dine første 5 km'),
        ('Se fremgangen din', 'Vekt, distanse, tempo og ukentlige rekker'),
        ('Gratis. Uten reklame.', 'Ingen sporing – dataene blir på telefonen'),
    ],
    'cs': [
        ('Jeden plán na všechno', 'Posilovna, kettlebell, běh i mobilita v jednom týdnu'),
        ('Hlasový trenér v kapse', 'EMOM, AMRAP, Tabata, série i intervaly'),
        ('63 animovaných cviků', 'S krátkými body techniky u každého'),
        ('Hotové programy', 'Od prvního shybu po prvních 5 km'),
        ('Sleduj svůj pokrok', 'Váhy, vzdálenost, tempo a týdenní série'),
        ('Zdarma. Bez reklam.', 'Bez sledování – data zůstávají v telefonu'),
    ],
}


def demo_state(lang: str) -> dict:
    today = dt.date.today()
    monday = today - dt.timedelta(days=today.weekday())
    ymd = lambda d: d.isoformat()
    logs = []
    n = 0
    # five weeks of history, four sessions a week, slowly getting stronger
    for w in range(5, 0, -1):
        base = monday - dt.timedelta(days=7 * w)
        k = 5 - w
        for day, wid, disc, title in [(0, 'gym_full_a', 'gym', 'Full body A'), (1, 'run_easy', 'running', 'Easy run'), (3, 'gym_full_b', 'gym', 'Full body B'), (5, 'kb_daily', 'kettlebell', 'Swing + Get-up')]:
            n += 1
            sets = []
            dist = None
            if wid == 'gym_full_a':
                sets = [{'ex': 'bbsquat', 'weightKg': 60 + 5 * k, 'reps': 8, 'sets': 3}, {'ex': 'bench', 'weightKg': 50 + 2.5 * k, 'reps': 8, 'sets': 3}, {'ex': 'cablerow', 'weightKg': 45 + 2.5 * k, 'reps': 10, 'sets': 3}]
            elif wid == 'gym_full_b':
                sets = [{'ex': 'bbdeadlift', 'weightKg': 80 + 5 * k, 'reps': 5, 'sets': 3}, {'ex': 'ohp', 'weightKg': 32.5 + 2.5 * k, 'reps': 8, 'sets': 3}, {'ex': 'latpull', 'weightKg': 45 + 2.5 * k, 'reps': 10, 'sets': 3}]
            elif wid == 'kb_daily':
                sets = [{'ex': 'swing1', 'weightKg': 16 if k < 3 else 20, 'reps': 10, 'sets': 10}, {'ex': 'tgu', 'weightKg': 12 if k < 2 else 16, 'reps': 1, 'sets': 10}]
            else:
                dist = 5.0 + 0.3 * k
            logs.append({
                'id': f'demo{n}', 'date': ymd(base + dt.timedelta(days=day)), 'finishedAt': f'{ymd(base)}T18:00:00Z', 'workout': wid,
                'discipline': disc, 'title': title, 'durationSec': 1800 + 240 * (n % 4), 'sets': sets, 'rpe': 6 + n % 3,
                **({'distanceKm': dist} if dist else {}),
            })
    # this week: Monday + Tuesday done, today planned
    for day, wid, disc, title, sets, dist in [(0, 'gym_full_a', 'gym', 'Full body A', [{'ex': 'bbsquat', 'weightKg': 85, 'reps': 8, 'sets': 3}], None), (1, 'run_easy', 'running', 'Easy run', [], 6.4)]:
        d = monday + dt.timedelta(days=day)
        if d < today:
            n += 1
            logs.append({'id': f'demo{n}', 'date': ymd(d), 'finishedAt': f'{ymd(d)}T18:00:00Z', 'workout': wid, 'discipline': disc, 'title': title, 'durationSec': 2100, 'sets': sets, 'rpe': 7, **({'distanceKm': dist} if dist else {})})
    logs.sort(key=lambda l: l['date'], reverse=True)
    plan = []
    for i, (day, wid) in enumerate([(0, 'gym_full_a'), (1, 'run_easy'), (3, 'gym_full_b'), (5, 'kb_daily'), (6, 'mob_morning')]):
        plan.append({'id': f'p{i}', 'date': ymd(monday + dt.timedelta(days=day)), 'workout': wid, 'programId': 'gym_beginner' if wid.startswith('gym') else None})
    if not any(e['date'] == ymd(today) for e in plan):
        plan.append({'id': 'ptoday', 'date': ymd(today), 'workout': 'gym_full_b', 'programId': 'gym_beginner'})
    return {
        'settings': {
            'lang': lang, 'unit': 'metric', 'disciplines': ['gym', 'kettlebell', 'running', 'mobility'],
            'equipment': ['kettlebell', 'barbell', 'dumbbell', 'machine', 'pullupbar'], 'bells': [12, 16, 20, 24],
            'voice': True, 'sound': True, 'weeklyGoal': 4, 'reminder': {'enabled': False, 'hour': 17, 'minute': 0},
            'trainingDays': [0, 1, 3, 5], 'onboarded': True,
        },
        'plan': plan,
        'log': logs,
        'program': {'id': 'gym_beginner', 'start': ymd(monday - dt.timedelta(days=14))},
    }


def serve():
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(s, *a, **k):
            super().__init__(*a, directory=str(DIST), **k)

        def send_head(s):
            if not os.path.exists(s.translate_path(s.path.split('?')[0])):
                s.path = '/index.html'
            return super().send_head()

        def log_message(s, *a):
            pass

    http.server.ThreadingHTTPServer(('', PORT), H).serve_forever()


async def shoot(lang: str):
    raw = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 430, 'height': 932}, device_scale_factor=3)
        state = json.dumps(demo_state(lang))
        await ctx.add_init_script(f"localStorage.setItem('treno:v1', {json.dumps(state)});")
        pg = await ctx.new_page()
        base = f'http://localhost:{PORT}'

        async def snap(name):
            path = OUT / f'_raw_{lang}_{name}.png'
            await pg.screenshot(path=str(path))
            raw.append(path)

        await pg.goto(base + '/', wait_until='networkidle'); await pg.wait_for_timeout(1200); await snap('1today')
        await pg.goto(base + '/timer?w=kb_emom', wait_until='networkidle'); await pg.wait_for_timeout(600)
        await pg.get_by_label({'en': 'Skip', 'nb': 'Hopp over', 'cs': 'Přeskočit'}[lang]).click()
        await pg.wait_for_timeout(4300); await snap('2timer')
        await pg.goto(base + '/exercise/bbsquat', wait_until='networkidle'); await pg.wait_for_timeout(1500); await snap('3exercise')
        await pg.goto(base + '/plan', wait_until='networkidle'); await pg.wait_for_timeout(1200); await snap('4plan')
        await pg.goto(base + '/log', wait_until='networkidle'); await pg.wait_for_timeout(1200); await snap('5log')
        await pg.goto(base + '/onboarding', wait_until='networkidle'); await pg.wait_for_timeout(1000); await snap('6free')
        await b.close()
    return raw


def frame(shot: Path, title: str, sub: str, out: Path):
    canvas = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(canvas)
    # soft orange glow
    glow = Image.new('RGB', (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W * 0.15, -380, W * 0.85, 520), fill=(90, 38, 16))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    canvas = Image.blend(canvas, glow, 0.9)
    d = ImageDraw.Draw(canvas)
    f1 = ImageFont.truetype(FONT_BOLD, 104)
    f2 = ImageFont.truetype(FONT_MED, 50)
    y = 170
    for line in wrap(d, title, f1, W - 160):
        tw = d.textlength(line, font=f1)
        d.text(((W - tw) / 2, y), line, font=f1, fill=TEXT)
        y += 122
    y += 14
    for line in wrap(d, sub, f2, W - 200):
        tw = d.textlength(line, font=f2)
        d.text(((W - tw) / 2, y), line, font=f2, fill=MUTED)
        y += 66
    # phone screenshot with rounded corners and a thin border
    im = Image.open(shot).convert('RGB')
    target_w = 1080
    im = im.resize((target_w, int(im.height * target_w / im.width)), Image.LANCZOS)
    top = max(y + 70, 560)
    avail = H - top
    if im.height > avail:
        im = im.crop((0, 0, im.width, avail + 120))
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height + 200), radius=70, fill=255)
    x = (W - im.width) // 2
    border = Image.new('RGB', (im.width + 16, im.height + 16), (60, 54, 48))
    bmask = Image.new('L', border.size, 0)
    ImageDraw.Draw(bmask).rounded_rectangle((0, 0, border.width - 1, border.height + 200), radius=78, fill=255)
    canvas.paste(border, (x - 8, top - 8), bmask)
    canvas.paste(im, (x, top), mask)
    canvas.save(out, optimize=True)


def wrap(d, text, font, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = f'{cur} {w}'.strip()
        if d.textlength(t, font=font) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


async def main():
    threading.Thread(target=serve, daemon=True).start()
    for lang, caps in CAPTIONS.items():
        raw = await shoot(lang)
        for i, (shot, (t, s)) in enumerate(zip(raw, caps), 1):
            frame(shot, t, s, OUT / f'{lang}_{i}.png')
            shot.unlink()
        print(lang, 'done')


asyncio.run(main())
