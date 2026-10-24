"""
生成应用图标：矢量源文件 (icon.svg) + 多尺寸 PNG + Windows ICO。
几何数据只维护一份，SVG 与位图共用，保证两者完全一致。
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PUBLIC = os.path.join(ROOT, 'public')
BUILD = os.path.join(ROOT, 'build')
os.makedirs(PUBLIC, exist_ok=True)
os.makedirs(BUILD, exist_ok=True)

SIZE = 256
SS = 4  # 超采样倍数

# ---------------- 几何 ----------------
P1 = (128.0, 40.0)
P2 = (198.0, 79.0)
P3 = (198.0, 153.0)
P4 = (128.0, 192.0)
P5 = (58.0, 153.0)
P6 = (58.0, 79.0)
C = (128.0, 116.0)

FACES = [
    ((P1, P2, C), '#ffe9a8'),  # 右上高光面
    ((P2, P3, C), '#f2bb46'),  # 右面
    ((P3, P4, C), '#c8891a'),  # 右下暗面
    ((P4, P5, C), '#a86f10'),  # 左下暗面
    ((P5, P6, C), '#d99b1e'),  # 左面
    ((P6, P1, C), '#ffd777'),  # 左上亮面
]

CORE = [(128.0, 102.0), (144.0, 116.0), (128.0, 130.0), (112.0, 116.0)]

SPARKLE_BIG = [
    (196.0, 40.0), (200.0, 54.0), (214.0, 58.0), (200.0, 62.0),
    (196.0, 76.0), (192.0, 62.0), (178.0, 58.0), (192.0, 54.0),
]
SPARKLE_SMALL = [
    (54.0, 168.0), (56.5, 176.0), (64.5, 178.5), (56.5, 181.0),
    (54.0, 189.0), (51.5, 181.0), (43.5, 178.5), (51.5, 176.0),
]

RING_R = 104.0


def fmt(pt):
    return f'{pt[0]:.1f},{pt[1]:.1f}'


def build_svg():
    faces = '\n'.join(
        f'      <polygon points="{fmt(a)} {fmt(b)} {fmt(c)}" fill="{color}" />'
        for (a, b, c), color in FACES
    )
    hexagon = ' '.join(fmt(p) for p in (P1, P2, P3, P4, P5, P6))
    core = ' '.join(fmt(p) for p in CORE)
    spark_big = ' '.join(fmt(p) for p in SPARKLE_BIG)
    spark_small = ' '.join(fmt(p) for p in SPARKLE_SMALL)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="明日方舟寻访模拟器">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#17130d" />
      <stop offset="55%" stop-color="#100d0b" />
      <stop offset="100%" stop-color="#05050a" />
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="46%" r="52%">
      <stop offset="0%" stop-color="#e8a63a" stop-opacity="0.32" />
      <stop offset="60%" stop-color="#e8a63a" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#e8a63a" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#fff6dd" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#fff6dd" stop-opacity="0" />
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="256" height="256" rx="56" fill="url(#bg)" />
  <rect x="3" y="3" width="250" height="250" rx="53" fill="none" stroke="#e8a63a" stroke-opacity="0.18" stroke-width="1.5" />
  <circle cx="128" cy="116" r="104" fill="none" stroke="#e8a63a" stroke-opacity="0.12" stroke-width="1.5" />
  <circle cx="128" cy="116" r="104" fill="url(#halo)" />

  <g>
{faces}
    <polygon points="{hexagon}" fill="none" stroke="#2a1b06" stroke-opacity="0.55" stroke-width="3" stroke-linejoin="round" />
    <polygon points="{hexagon}" fill="none" stroke="#ffeec2" stroke-opacity="0.5" stroke-width="1.5" stroke-linejoin="round" />
    <polygon points="{core}" fill="#fffaf0" />
    <polygon points="{core}" fill="none" stroke="#ffd777" stroke-width="1" stroke-opacity="0.8" />
  </g>

  <polygon points="{spark_big}" fill="#fff3cf" />
</svg>
'''


def gradient_image(w, h, c0, c1, diagonal=True):
    small = 96
    img = Image.new('RGBA', (small, small))
    px = img.load()
    for y in range(small):
        for x in range(small):
            t = ((x + y) / (2 * (small - 1))) if diagonal else (y / (small - 1))
            r = int(c0[0] + (c1[0] - c0[0]) * t)
            g = int(c0[1] + (c1[1] - c0[1]) * t)
            b = int(c0[2] + (c1[2] - c0[2]) * t)
            px[x, y] = (r, g, b, 255)
    return img.resize((w, h), Image.BICUBIC)


def radial_glow(size, center, radius, color, alpha):
    w, h = size
    small = 120
    img = Image.new('L', (small, small), 0)
    px = img.load()
    cx, cy = center[0] / w * small, center[1] / h * small
    r = radius / w * small
    for y in range(small):
        for x in range(small):
            d = math.hypot(x - cx, y - cy) / r
            if d < 1:
                px[x, y] = int(alpha * (1 - d) ** 1.6 * 255)
    layer = Image.new('RGBA', (w, h), color + (0,))
    mask = img.resize((w, h), Image.BICUBIC)
    layer.putalpha(mask)
    return layer


def render(size):
    s = size * SS
    k = s / SIZE
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))

    # 背景（圆角）
    bg = gradient_image(s, s, (27, 23, 16), (6, 5, 9))
    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(56 * k), fill=255)
    canvas.paste(bg, (0, 0), mask)

    # 光晕 / 圆环
    canvas.alpha_composite(radial_glow((s, s), (128 * k, 116 * k), 120 * k, (232, 166, 58), 0.40))

    d = ImageDraw.Draw(canvas)
    ring = [int((128 - RING_R) * k), int((116 - RING_R) * k), int((128 + RING_R) * k), int((116 + RING_R) * k)]
    d.ellipse(ring, outline=(232, 166, 58, 34), width=max(1, int(1.6 * k)))
    d.rounded_rectangle(
        [int(3 * k), int(3 * k), int(253 * k), int(253 * k)],
        radius=int(53 * k),
        outline=(232, 166, 58, 48),
        width=max(1, int(1.4 * k)),
    )

    # 水晶各个切面
    for (a, b, c), color in FACES:
        d.polygon([(a[0] * k, a[1] * k), (b[0] * k, b[1] * k), (c[0] * k, c[1] * k)],
                  fill=color)

    hexagon = [(p[0] * k, p[1] * k) for p in (P1, P2, P3, P4, P5, P6)]
    d.line(hexagon + [hexagon[0]], fill=(42, 27, 6, 160), width=max(1, int(3 * k)), joint='curve')
    d.line(hexagon + [hexagon[0]], fill=(255, 238, 194, 120), width=max(1, int(1.4 * k)), joint='curve')

    core = [(p[0] * k, p[1] * k) for p in CORE]
    d.polygon(core, fill=(255, 250, 240, 255))

    # 星芒
    d.polygon([(p[0] * k, p[1] * k) for p in SPARKLE_BIG], fill=(255, 243, 207, 240))

    return canvas.resize((size, size), Image.LANCZOS)


def main():
    svg = build_svg()
    open(os.path.join(PUBLIC, 'icon.svg'), 'w', encoding='utf-8').write(svg)
    open(os.path.join(BUILD, 'icon.svg'), 'w', encoding='utf-8').write(svg)

    sizes = [16, 24, 32, 48, 64, 128, 256, 512]
    images = {}
    for size in sizes:
        img = render(size)
        images[size] = img
        out = os.path.join(BUILD, f'icon-{size}.png' if size > 32 else f'icon-{size}.png')
        img.save(out, 'PNG')
        print('png', out)

    images[256].save(os.path.join(BUILD, 'icon.png'), 'PNG')
    images[512].save(os.path.join(PUBLIC, 'icon-512.png'), 'PNG')

    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    images[256].save(
        os.path.join(BUILD, 'icon.ico'),
        format='ICO',
        sizes=ico_sizes,
        bitmap_format='bmp' if False else 'png',
    )
    print('ico done')


if __name__ == '__main__':
    main()
