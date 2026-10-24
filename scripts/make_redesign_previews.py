"""生成 5 张方向性预览图，写入 preview/。"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import preview_cards as P  # noqa: E402

W, H = 168, 232          # lg 卡面尺寸，与 OperatorCard SIZE.lg 一致
OUT = P.PREVIEW


def save(img: Image.Image, name: str) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / name
    img.convert("RGB").save(p, "PNG", optimize=True)
    print(f"  {name}  {img.width}x{img.height}  {p.stat().st_size // 1024}KB")
    return p


def gallery(names: list[tuple[str, int, str, str]], *, rarity_mix=True) -> list[Image.Image]:
    cards = []
    for (art, rar, nm, prof) in names:
        a = P.load_art(art)
        cards.append(P.draw_card(a, rarity=rar, name=nm, profession=prof,
                                 w=W, h=H, name_size=15, badge="UP" if rar == 6 else None))
    return cards


# ---------------------------------------------------------------- 方案 1
def preview_01() -> Image.Image:
    """纵向 4:5 直出：立绘等比缩放到底，信息条压进底部 18%。"""
    img = P.panel((1240, 700), "方向一 · 纵向直出 / 信息条内嵌",
                  "object-fit: cover 等比撑满，锚点固定在面部；底部 18% 交给渐变压暗与文字")
    d = ImageDraw.Draw(img)
    row = [
        P.draw_card(P.load_art("nengtianshi"), rarity=6, name="能天使", profession="狙击",
                    w=W, h=H, art_pos=0.10, name_size=15, badge="UP"),
        P.draw_card(P.load_art("tuijinzhiwang"), rarity=6, name="推进之王", profession="先锋",
                    w=W, h=H, art_pos=0.12, name_size=15),
        P.draw_card(P.load_art("yifulite"), rarity=5, name="伊芙利特", profession="术师",
                    w=W, h=H, art_pos=0.14, name_size=15),
        P.draw_card(P.load_art("a"), rarity=4, name="艾雅法拉", profession="术师",
                    w=W, h=H, art_pos=0.16, name_size=15) if (P.PORTRAITS / "a.jpg").exists() else None,
    ]
    row = [c for c in row if c]
    x = 60
    for c in row:
        img.alpha_composite(c, (x, 150))
        x += c.width + 46
    P.label(d, (60, 470), "优点", "零运行时成本，改动仅在 CSS art_pos 与字号")
    P.label(d, (60, 530), "风险", "窄高比例下横构图立绘会裁掉手部与武器，损失角色辨识度")
    return img


# ---------------------------------------------------------------- 方案 2
def preview_02() -> Image.Image:
    """扩展画布：立绘不满铺，上下留色场，人物完整可见。"""
    img = P.panel((1240, 700), "方向二 · 留边色场 / 人物完整不裁切",
                  "立绘按 contain 完整呈现，上下以稀有度渐变底色补足 4:5，卡面不再切脸切手")
    d = ImageDraw.Draw(img)
    cards = []
    for (nm, rar, prof, artn) in [
        ("能天使", 6, "狙击", "nengtianshi"),
        ("推进之王", 6, "先锋", "tuijinzhiwang"),
        ("伊芙利特", 5, "术师", "yifulite"),
    ]:
        cards.append(
            P.draw_card(P.load_art(artn), rarity=rar, name=nm, profession=prof,
                        w=W, h=H, art_pos=0.30, art_zoom=0.82, name_size=15)
        )
    x = 60
    for c in cards:
        img.alpha_composite(c, (x, 150))
        x += c.width + 46
    P.label(d, (60, 470), "原理", "art_zoom<1 + art_pos=0.30，让立绘落在画布中段")
    P.label(d, (60, 530), "收益", "203 张立绘无需预裁，素材层零改动；脸部完整率接近 100%")
    return img


# ---------------------------------------------------------------- 方案 3
def preview_03() -> Image.Image:
    """双区构图：上部面部特写 + 下部全身缩略。"""
    img = P.panel((1320, 700), "方向三 · 双区构图 / 头像特写 + 全身缩略",
                  "上 62% 为面部特写（保证脸完整且位于上二分之一），下 38% 放全身剪影与信息")
    d = ImageDraw.Draw(img)
    cards = []
    for (nm, rar, prof, artn) in [
        ("能天使", 6, "狙击", "nengtianshi"),
        ("伊芙利特", 5, "术师", "yifulite"),
    ]:
        c = P.draw_card(P.load_art(artn), rarity=rar, name=nm, profession=prof,
                        w=W, h=H, art_pos=0.02, art_zoom=1.42, name_size=15)
        # 中部一条分隔线，模拟上/下双区
        dd = ImageDraw.Draw(c)
        yy = int(c.height * 0.62)
        dd.line([(4, yy), (c.width - 4, yy)], fill=(255, 255, 255, 46), width=1)
        cards.append(c)
    x = 60
    for c in cards:
        img.alpha_composite(c, (x, 150))
        x += c.width + 46
    P.label(d, (60, 470), "关键", "放大系数 1.42 时脸部占比稳定，缩略图承担全身识别")
    P.label(d, (60, 530), "成本", "需为每张立绘记录脸框坐标；无坐标时退化为中心裁切")
    return img


# ---------------------------------------------------------------- 方案 4
def preview_04() -> Image.Image:
    """信息条外置：卡面纯立绘，文字下沉到卡下一行。"""
    img = P.panel((1320, 760), "方向四 · 信息外置 / 卡面回归纯立绘",
                  "卡面只留立绘与稀有度边框，名称职业星级移到卡下方，立绘可视面积提升约 22%")
    d = ImageDraw.Draw(img)
    x = 60
    for (nm, rar, prof, artn) in [
        ("能天使", 6, "狙击", "nengtianshi"),
        ("推进之王", 6, "先锋", "tuijinzhiwang"),
        ("伊芙利特", 5, "术师", "yifulite"),
    ]:
        c = P.draw_card(P.load_art(artn), rarity=rar, name="", profession="",
                        w=W, h=H, art_pos=0.06, name_size=15, show_stars=False)
        img.alpha_composite(c, (x, 140))
        # 卡下文字
        dd = ImageDraw.Draw(img)
        dd.text((x + 4, 140 + c.height + 10), "★" * rar, font=P.font(P.SANS_B, 12),
                fill=(255, 214, 150, 255) if rar >= 5 else (176, 168, 190, 255))
        dd.text((x + 4, 140 + c.height + 28), nm, font=P.font(P.HEI_B, 16), fill=(241, 237, 226, 255))
        dd.text((x + 4, 140 + c.height + 50), prof, font=P.font(P.SANS, 11), fill=(146, 143, 136, 255))
        x += c.width + 46
    P.label(d, (60, 530), "收益", "立绘不再被压暗条吃掉，卡面构图自由度最大")
    P.label(d, (60, 590), "代价", "卡片总高变大，十连结算双列布局需重排；信息与图像分离后扫码式浏览变慢")
    return img


# ---------------------------------------------------------------- 方案 5
def preview_05() -> Image.Image:
    """最小改动：保留现行卡面，只修锚点与压暗曲线。"""
    img = P.panel((1320, 760), "方向五 · 原地修锚点 / 最小改动",
                  "保留现有卡面结构，只把 object-position 从 16% 改为按稀有度与立绘高度自适应，并重调压暗曲线")
    d = ImageDraw.Draw(img)
    x, y = 60, 140
    specs = [
        ("改动前 · art_pos 16%", 0.16, 1.0),
        ("改动后 · art_pos 6%", 0.06, 1.0),
        ("改动后 · 压暗减弱", 0.06, 0.72),
    ]
    for (cap, pos, scrim) in specs:
        c = P.draw_card(P.load_art("nengtianshi"), rarity=6, name="能天使", profession="狙击",
                        w=W, h=H, art_pos=pos, name_size=15, scrim_strength=scrim, badge="UP")
        img.alpha_composite(c, (x, y))
        ImageDraw.Draw(img).text((x, y + c.height + 8), cap, font=P.font(P.SANS_B, 11),
                                 fill=(160, 156, 148, 255))
        x += c.width + 40
    P.label(d, (60, 530), "改动面", "index.css 单文件，.ak-op-card__art 的 object-position 与 __scrim 的色标")
    P.label(d, (60, 590), "风险最低", "无素材迁移、无数据结构变更，回滚只需还原两行 CSS")
    return img


def main() -> int:
    print("生成预览图：")
    save(preview_01(), "redesign-01-cover.png")
    save(preview_02(), "redesign-02-contained.png")
    save(preview_03(), "redesign-03-dual-zone.png")
    save(preview_04(), "redesign-04-meta-outside.png")
    save(preview_05(), "redesign-05-anchor-fix.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

