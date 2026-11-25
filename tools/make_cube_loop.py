"""Write src/hc/cube-loop.svg: the Over Hypercube hero drawing (the hypercube drawn from the centre outwards)
as a self-contained, auto-playing, looping animated SVG, 204 px wide like the GIF it replaces. It replaces the old 8-frame logo GIF on the About pages.

Same geometry, colours, draw order and ease as buildAbout() in src/hc/hero-reveal.js, without the labels.
One cycle: draw (2.7 s), hold, fade out, short white pause, repeat. With reduced motion it shows the finished cube.

Usage: python3 tools/make_cube_loop.py
"""
import math, os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'hc', 'cube-loop.svg')
RED, BLUE, YELLOW, BLACK = '#FF0000', '#0000FF', '#FFCC00', '#1D1D1B'
L, C, CX, CY, SW = 190, .59, 0.0, 0.0, 20
AX = [[L, 0], [0, -L], [C * L, -C * L], [C * L, C * L]]
COL, ORDER = [RED, BLUE, YELLOW, BLACK], [3, 2, 1, 0]          # red drawn last: on top at the corners
GLIDE = 'cubic-bezier(.55,.05,.2,1)'
START, SPREAD, DRAW = .1, 1.6, 1.0                              # as in the hero
HOLD_END, FADE, T = 4.9, .6, 6.2                                # seconds: hold until, fade length, full cycle


def pos(v):
    x, y = CX - (L + 2 * C * L) / 2, CY + L / 2
    for k in range(4):
        if v >> k & 1:
            x += AX[k][0]; y += AX[k][1]
    return x, y


edges = []
for k in ORDER:
    for v in range(16):
        if v >> k & 1:
            continue
        a, b = pos(v), pos(v | 1 << k)
        if math.hypot(*b) < math.hypot(*a):
            a, b = b, a
        edges.append(dict(a=a, b=b, k=k, near=math.hypot(*a), len=math.hypot(b[0] - a[0], b[1] - a[1]), angle=math.atan2(a[1], a[0])))

# centre -> out: inner tips first, equal distances in order around the centre; starts evenly spaced
order = sorted(range(len(edges)), key=lambda i: (round(edges[i]['near'] / 8), edges[i]['angle']))
at = {i: START + (r / (len(order) - 1)) * SPREAD for r, i in enumerate(order)}

xs = [p[0] for e in edges for p in (e['a'], e['b'])]; ys = [p[1] for e in edges for p in (e['a'], e['b'])]
pad = SW / 2 + 14
x0, y0, x1, y1 = min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad
w, h = x1 - x0, y1 - y0
pct = lambda s: f'{100 * s / T:.3f}%'

css = [f'.c{{animation:f {T}s linear infinite}}',
       f'@keyframes f{{0%,{pct(HOLD_END)}{{opacity:1}}{pct(HOLD_END + FADE)},100%{{opacity:0}}}}',
       f'line{{animation-duration:{T}s;animation-iteration-count:infinite;animation-timing-function:linear}}']
lines = []
for i, e in enumerate(edges):
    n, t = e['len'], at[i]
    css.append(f'#e{i}{{animation-name:d{i}}}'
               f'@keyframes d{i}{{0%,{pct(t)}{{stroke-dashoffset:{n:.2f};animation-timing-function:{GLIDE}}}'
               f'{pct(t + DRAW)},100%{{stroke-dashoffset:0}}}}')
    lines.append(f'<line id="e{i}" x1="{e["a"][0]:.2f}" y1="{e["a"][1]:.2f}" x2="{e["b"][0]:.2f}" y2="{e["b"][1]:.2f}" '
                 f'stroke="{COL[e["k"]]}" stroke-dasharray="{n:.2f} {n + 2 * SW:.2f}" stroke-dashoffset="0"/>')
css.append('@media (prefers-reduced-motion:reduce){.c,line{animation:none}}')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}" width="204" height="{204 * h / w:.0f}" '
       f'role="img" aria-label="Hypercube">\n<title>Hypercube</title>\n<style>{"".join(css)}</style>\n'
       f'<g class="c" fill="none" stroke-width="{SW}" stroke-linecap="round">\n' + '\n'.join(lines) + '\n</g>\n</svg>\n')
open(OUT, 'w').write(svg)
print(OUT, f'{len(edges)} edges, {w:.0f} x {h:.0f}, {len(svg)} bytes')
