"""检查子集化字体的覆盖情况（开发辅助脚本）。"""
import pathlib

from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = [
    ROOT / "src/assets/fonts/noto-sans-sc-400.woff2",
    ROOT / "src/assets/fonts/noto-serif-sc-700.woff2",
]

for p in FONTS:
    if not p.exists():
        print(f"missing: {p.name}")
        continue
    f = TTFont(p)
    cmap = f.getBestCmap()
    print(p.name, "codepoints:", len(cmap), "family:", f["name"].getDebugName(1))
    missing = [ch for ch in "寻访模拟器庆典限定年夕★·重装术师" if ord(ch) not in cmap]
    print("  missing:", missing if missing else "none")
