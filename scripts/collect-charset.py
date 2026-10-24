"""从源码中收集字符集，并生成 pyftsubset 用的 --text 文件。"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / "src"

chars = set()
for p in ROOT.rglob("*"):
    if p.suffix not in {".ts", ".tsx", ".css"}:
        continue
    text = p.read_text(encoding="utf-8")
    for ch in text:
        cp = ord(ch)
        if 0x4E00 <= cp <= 0x9FFF or 0x3000 <= cp <= 0x303F or 0xFF00 <= cp <= 0xFF65:
            chars.add(ch)

# ASCII + 常用符号（★☆·×÷—–…‰°「」『』《》〈〉“”‘’【】、。，！？：；）
extra = (
    " !\"#$%&'()*+,-./0123456789:;<=>?@"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`"
    "abcdefghijklmnopqrstuvwxyz{|}~"
    "★☆·×÷—–…‰°「」『』《》〈〉“”‘’【】、。，！？：；（）％"
)
chars.update(extra)

out = ROOT.parent / "scripts" / "_charset.txt"
out.write_text("".join(sorted(chars)), encoding="utf-8")
print("unique chars:", len(chars))
print("cjk:", sum(1 for c in chars if 0x4E00 <= ord(c) <= 0x9FFF))
