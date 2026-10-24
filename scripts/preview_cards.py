"""前端预览图生成器（纯 Pillow 复刻设计系统，无浏览器依赖）。

本机 Edge / Electron 离屏渲染均被沙箱拦截（crashpad 无法 OpenProcess，
截图静默失败），因此改用与 index.css 一一对应的 Pillow 绘制：
颜色、圆角、渐变、光晕、暗角、文字位置全部按 index.css 的实测数值实现。

产出 5 张方向性预览，写入 preview/redesign-0X-*.png
    python scripts/preview_cards.py
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PORTRAITS = ROOT / "public" / "portraits"
PREVIEW = ROOT.parent / "preview"

# ---- 设计 token（与 src/index.css、src/theme/rarity.ts 对齐）
BG = (17, 17, 16)
INK = (231, 229, 223)
SERIF = "C:/Windows/Fonts/simsun.ttc"
SANS = "C:/Windows/Fonts/msyh.ttc"
SANS_B = "C:/Windows/Fonts/msyhbd.ttc"
HEI_B = "C:/Windows/Fonts/simhei.ttf"

RARITY = {
    6: {"base": (27, 6, 32), "base2": (7, 2, 12), "frame": (255, 217, 242), "glow": (240, 171, 252)},
    5: {"base": (29, 18, 6), "base2": (14, 7, 2), "frame": (255, 227, 163), "glow": (232, 166, 58)},
    4: {"base": (21, 10, 34), "base2": (8, 4, 13), "frame": (199, 155, 232), "glow": (156, 130, 184)},
    3: {"base": (21, 22, 26), "base2": (10, 11, 13), "frame": (154, 161, 173), "glow": (120, 124, 134)},
}


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def linear_gradient(size, c0, c1, angle=160) -> Image.Image:
    """160deg 线性渐变（CSS 角度制：0=向上，顺时针）。"""
    w, h = size
    a = math.radians(angle - 90)
    dx, dy = math.cos(a), math.sin(a)
    xs = np.arange(w)[None, :]
    ys = np.arange(h)[:, None]
    proj = xs * dx + ys * dy
    proj = (proj - proj.min()) / max(proj.max() - proj.min(), 1e-6)
    img = np.zeros((h, w, 3), np.float64)
    for i in range(3):
        img[..., i] = c0[i] + (c1[i] - c0[i]) * proj
    return Image.fromarray(img.astype(np.uint8))


def radial_alpha(size, cx, cy, r0, r1, strength=1.0) -> Image.Image:
    """以 (cx,cy) 为中心的径向透明度遮罩（L 模式）。"""
    w, h = size
    ys, xs = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xs - cx * w) / (w * 0.7)) ** 2 + ((ys - cy * h) / (h * 0.7)) ** 2)
    v = np.clip((r1 - d) / max(r1 - r0, 1e-6), 0, 1) ** 1.6
    return Image.fromarray((v * 255 * strength).astype(np.uint8))


def rounded_mask(size, radius) -> Image.Image:
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=255)
    return m


def paste_rgba(base: Image.Image, layer: Image.Image, xy) -> None:
    base.paste(layer, xy, layer)


def conic_holo(size, n=360) -> Image.Image:
    """六星旋转虹光：conic-gradient 近似。"""
    w, h = size
    cx, cy = w / 2, h / 2
    ys, xs = np.mgrid[0:h, 0:w]
    ang = (np.degrees(np.arctan2(ys - cy, xs - cx)) + 360) % 360
    stops = [
        (0, (255, 90, 143)),
        (60, (255, 179, 71)),
        (120, (255, 224, 102)),
        (180, (107, 229, 137)),
        (240, (79, 195, 247)),
        (300, (179, 136, 255)),
        (360, (255, 90, 143)),
    ]
    img = np.zeros((h, w, 3), np.float64)
    for i in range(len(stops) - 1):
        a0, c0 = stops[i]
        a1, c1 = stops[i + 1]
        sel = (ang >= a0) & (ang < a1)
        t = (ang - a0) / max(a1 - a0, 1e-6)
        for k in range(3):
            img[..., k] = np.where(sel, c0[k] + (c1[k] - c0[k]) * t, img[..., k])
    return Image.fromarray(img.astype(np.uint8))


# --------------------------------------------------------------- 卡面绘制

def draw_card(
    art: Image.Image | None,
    *,
    rarity: int,
    name: str,
    profession: str,
    w: int,
    h: int,
    radius: int = 11,
    art_pos: float = 0.16,
    art_zoom: float = 1.0,
    scrim_strength: float = 1.0,
    show_stars: bool = True,
    name_size: int = 15,
    badge: str | None = None,
    glow: bool = True,
    holo: bool = None,
) -> Image.Image:
    """按 index.css 的层序合成一张卡：底 → 立绘 → 暗角 → 压暗 → 薄膜 → 高光 → 信息条。"""
    th = RARITY[rarity]
    pad = 3 if rarity == 6 else 2
    total = (w + pad * 2, h + pad * 2)
    canvas = Image.new("RGBA", total, (0, 0, 0, 0))

    # ---- 外发光
    if glow:
        aura = Image.new("RGBA", total, (0, 0, 0, 0))
        ad = ImageDraw.Draw(aura)
        g = th["glow"]
        alpha = 150 if rarity >= 6 else (95 if rarity == 5 else 40)
        for i in range(14):
            t = i / 13
            r = int(radius + 16 * (1 - t))
            al = int(alpha * (1 - t) ** 2.2)
            ad.rounded_rectangle(
                [pad - 14 + i, pad - 14 + i, total[0] - pad + 13 - i, total[1] - pad + 13 - i],
                r, outline=(g[0], g[1], g[2], al), width=2,
            )
        aura = aura.filter(ImageFilter.GaussianBlur(7))
        canvas = Image.alpha_composite(canvas, aura)

    # ---- 卡框
    frame = Image.new("RGBA", total, (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    if rarity == 6:
        holo_img = conic_holo(total).convert("RGBA")
        fm = rounded_mask(total, radius).point(lambda v: v)
        holo_img.putalpha(fm)
        frame = holo_img
    elif rarity == 5:
        fg = linear_gradient(total, (255, 242, 205), (180, 122, 30), 148)
        fg.putalpha(rounded_mask(total, radius))
        frame = fg.convert("RGBA")
    elif rarity == 4:
        fg = linear_gradient(total, (211, 174, 240), (58, 35, 84), 150)
        fg.putalpha(rounded_mask(total, radius))
        frame = fg.convert("RGBA")
    else:
        fg = linear_gradient(total, (154, 161, 173), (42, 45, 51), 150)
        fg.putalpha(rounded_mask(total, radius))
        frame = fg.convert("RGBA")
    canvas = Image.alpha_composite(canvas, frame)

    # ---- 卡面内容（内缩 pad）
    inner_box = (pad, pad, pad + w, pad + h)
    inner = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    base = linear_gradient((w, h), th["base"], th["base2"], 160).convert("RGBA")
    inner = Image.alpha_composite(inner, base)

    if art is not None:
        # object-fit: cover + object-position: 50% art_pos
        aw, ah = art.size
        scale = max(w / aw, h / ah) * art_zoom
        nw, nh = int(aw * scale), int(ah * scale)
        a = art.resize((nw, nh), Image.LANCZOS).convert("RGBA")
        ox = int((w - nw) / 2)
        oy = int((h - nh) * art_pos)
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        layer.paste(a, (ox, oy))
        inner = Image.alpha_composite(inner, layer)

    # ---- 暗角
    vig = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vm = radial_alpha((w, h), 0.5, 0.10, 0.30, 0.95, 1.0)
    vig.putalpha(vm.point(lambda v: int(v * 0.42)))
    vig = Image.composite(Image.new("RGBA", (w, h), (0, 0, 0, 255)), Image.new("RGBA", (w, h), (0, 0, 0, 0)), vig.split()[3])
    inner = Image.alpha_composite(inner, vig)

    # ---- 底部压暗（scrim）
    scrim_h = int(h * 0.44)
    sm = Image.new("L", (1, scrim_h), 0)
    for y in range(scrim_h):
        t = y / scrim_h  # 0 顶部 → 1 底部
        v = 245 * (t ** 2.1)
        sm.putpixel((0, y), int(min(255, v * scrim_strength)))
    sm = sm.resize((w, scrim_h), Image.BILINEAR)
    scrim = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    scrim.paste(Image.new("RGBA", (w, scrim_h), (4, 3, 6, 255)), (0, h - scrim_h), sm)
    inner = Image.alpha_composite(inner, scrim)

    # ---- 高光斜带
    gloss = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.polygon([(0, 0), (w * 0.72, 0), (0, h * 0.52)], fill=(255, 255, 255, 22))
    inner = Image.alpha_composite(inner, gloss)

    # ---- 信息条
    meta = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    md = ImageDraw.Draw(meta)
    f_star = font(SANS_B, max(8, name_size - 4))
    f_name = font(HEI_B, name_size)
    f_sub = font(SANS, max(7, name_size - 6))
    y = h - 6
    if profession:
        y -= max(7, name_size - 6)
        md.text((8, y), profession, font=f_sub, fill=(231, 229, 223, 158))
        y -= 3
    y -= name_size
    md.text((8, y), name, font=f_name, fill=(255, 250, 240, 255),
            stroke_width=2, stroke_fill=(0, 0, 0, 200))
    y -= max(8, name_size - 4) + 1
    if show_stars:
        star_col = (255, 214, 150) if rarity >= 5 else (176, 168, 190)
        md.text((7, y), "★" * rarity, font=f_star, fill=star_col + (255,))
    inner = Image.alpha_composite(inner, meta)

    # ---- 角标
    if badge:
        bd = ImageDraw.Draw(inner)
        fb = font(HEI_B, 10)
        tb = bd.textbbox((0, 0), badge, font=fb)
        bw, bh = tb[2] - tb[0] + 10, tb[3] - tb[1] + 6
        bd.rounded_rectangle([4, 4, 4 + bw, 4 + bh], 2, fill=(244, 63, 94, 255))
        bd.text((9, 6), badge, font=fb, fill=(255, 255, 255, 255))

    inner.putalpha(Image.composite(inner.split()[3], Image.new("L", (w, h), 0),
                                   rounded_mask((w, h), max(2, radius - pad))))
    canvas.paste(inner, (pad, pad), inner)

    # ---- 角花
    if rarity >= 5:
        cd = ImageDraw.Draw(canvas)
        col = (255, 226, 250, 217) if rarity == 6 else (255, 238, 200, 184)
        L = 9
        for (x, y, sx, sy) in (
            (pad + 4, pad + 4, 1, 1),
            (total[0] - pad - 4, pad + 4, -1, 1),
            (pad + 4, total[1] - pad - 4, 1, -1),
            (total[0] - pad - 4, total[1] - pad - 4, -1, -1),
        ):
            cd.line([(x, y), (x + L * sx, y)], fill=col, width=1)
            cd.line([(x, y), (x, y + L * sy)], fill=col, width=1)
    return canvas


def load_art(name: str, size=(384, 512)) -> Image.Image | None:
    p = PORTRAITS / f"{name}.jpg"
    if not p.exists():
        return None
    return Image.open(p).convert("RGB").resize(size, Image.LANCZOS)


# --------------------------------------------------------------- 布局工具

def panel(size, title: str, subtitle: str = "") -> Image.Image:
    img = Image.new("RGBA", size, BG + (255,))
    d = ImageDraw.Draw(img)
    # 背景纹理：径向微光 + 细扫描线
    d.ellipse([-size[0] * 0.35, size[1] * 0.55, size[0] * 0.55, size[1] * 1.55],
              fill=(20, 17, 14, 255))
    for y in range(0, size[1], 3):
        d.line([(0, y), (size[0], y)], fill=(255, 255, 255, 4))
    d.text((44, 30), title, font=font(SERIF, 26), fill=(241, 237, 226, 255))
    if subtitle:
        d.text((44, 66), subtitle, font=font(SANS, 13), fill=(160, 156, 148, 255))
    d.line([(44, 92), (size[0] - 44, 92)], fill=(60, 58, 54, 255))
    return img


def label(d: ImageDraw.ImageDraw, xy, text: str, sub: str = "", size=12, color=INK):
    x, y = xy
    d.text((x, y), text, font=font(SANS_B, size), fill=color + (255,))
    if sub:
        d.text((x, y + size + 5), sub, font=font(SANS, size - 2), fill=(146, 143, 136, 255))


def compose(rows: list[list[Image.Image]], pad=22, bg=(17, 17, 16)) -> Image.Image:
    """把卡面按行拼接成透明底的组图。"""
    w = max(sum(c.width for c in r) + pad * (len(r) - 1) for r in rows)
    h = sum(max(c.height for c in r) for r in rows) + pad * (len(rows) - 1)
    img = Image.new("RGBA", (w, h), bg + (255,))
    y = 0
    for r in rows:
        x = (w - (sum(c.width for c in r) + pad * (len(r) - 1))) // 2
        rh = max(c.height for c in r)
        for c in r:
            img.alpha_composite(c, (x, y + (rh - c.height) // 2))
            x += c.width + pad
        y += rh + pad
    return img
