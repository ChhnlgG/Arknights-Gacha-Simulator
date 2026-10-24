"""把干员名册抽成独立数据文件，使仓库可分发的代码与受版权保护的名录分离。

产出:
  src/data/operators.local.json   (gitignore，含实名)
  src/data/operators.example.json (可入库，仅 3 条示例)
并改写 src/data/operators.ts 为数据驱动加载。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "operators.ts"

text = SRC.read_text(encoding="utf-8")

# 解析现有 OPERATORS 数组里的对象字面量
start = text.index("export const OPERATORS: Operator[] = [")
end = text.index("];", start)
body = text[start:end]

entries = []
for m in re.finditer(r"\{([^{}]+)\}", body):
    raw = m.group(1)
    obj = {}
    for km in re.finditer(r"(\w+):\s*('(?:[^']*)'|\"[^\"]*\"|true|false|\d+)", raw):
        key, val = km.group(1), km.group(2)
        if val in ("true", "false"):
            obj[key] = val == "true"
        elif val.startswith("'"):
            obj[key] = val[1:-1]
        elif val.startswith('"'):
            obj[key] = val[1:-1]
        else:
            obj[key] = int(val)
    if obj.get("id"):
        # portrait 改为派生字段，数据文件里去掉
        obj.pop("portrait", None)
        entries.append(obj)

print(f"解析到 {len(entries)} 名干员")

local = ROOT / "src" / "data" / "operators.local.json"
local.write_text(json.dumps(entries, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"写出 {local.name} ({local.stat().st_size // 1024} KB)")

example = entries[:3]
ex = ROOT / "src" / "data" / "operators.example.json"
ex.write_text(json.dumps(example, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"写出 {ex.name} ({len(example)} 条示例)")

new_head = '''import type { Operator } from '../types';
import roster from './operators.local.json';
import rosterExample from './operators.example.json';

/**
 * 干员名册。
 *
 * 完整名册与立绘属于第三方作品资产，不随仓库分发（见 README「素材说明」）。
 * 运行时优先读取 ./operators.local.json；缺失时回退到 example 里的示例条目，
 * 应用仍可启动，卡面走内置矢量占位图。
 *
 * 本地补齐：把 operators.example.json 复制为 operators.local.json 后按同一结构填充。
 */
const DATA: Operator[] = (roster as Operator[]).length
  ? (roster as Operator[])
  : (rosterExample as Operator[]);

export const OPERATORS: Operator[] = DATA.map((op) => ({
  ...op,
  portrait: `./portraits/${op.id}.jpg`,
}));
'''

tail_start = text.index("];", start) + 2
tail = text[tail_start:]
SRC.write_text(new_head + tail, encoding="utf-8")
print("operators.ts 已改写为数据驱动")
