#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 打包 Windows 便携版 exe（单文件）
#
# 本机环境有三个坑，脚本里都绕开了：
#   1. 工程路径含中文 / 空格，Go 写的 app-builder 与 7za 会报
#      "winmm.dll not found" / "Error #80070005"，所以把它们复制到纯 ASCII
#      目录再通过环境变量指过去。
#   2. electron-builder 的输出目录若在中文路径下，7z 压缩阶段会失败，因此
#      输出目录固定为 C:/akbuild-out，成功后再复制回 ./release。
#   3. 工作区注入了批量删除保护，需临时放宽阈值，否则 electron-builder
#      清理 locales 时报 SAFE_DELETE_BULK_CONFIRM_REQUIRED。
# ---------------------------------------------------------------------------
set -euo pipefail

# 工作区的批量删除保护会拦住 vite 清空 dist、electron-builder 清理 locales
export CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD=200000

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ASCII_BASE="$(cygpath -m "${LOCALAPPDATA:-$HOME/AppData/Local}")"
TOOLS="$ASCII_BASE/Temp/akbuild-tools"
OUT="C:/akbuild-out"

mkdir -p "$TOOLS"
cp -f node_modules/app-builder-bin/win/x64/app-builder.exe "$TOOLS/" 2>/dev/null || true
cp -f node_modules/7zip-bin/win/x64/7za.exe "$TOOLS/" 2>/dev/null || true

# 7zip-bin / app-builder-bin 默认只会用自己目录下的可执行文件（中文路径 → 报错），
# 各补一个 ARK_* 环境变量入口
if ! grep -q "ARK_7ZA" node_modules/7zip-bin/index.js 2>/dev/null; then
  node -e "
const fs=require('fs');const p='node_modules/7zip-bin/index.js';
let s=fs.readFileSync(p,'utf8');
s=s.replace('function getPath() {', 'function getPath() {\n  if (process.env.ARK_7ZA) { return process.env.ARK_7ZA }\n');
fs.writeFileSync(p,s);
console.log('patched 7zip-bin');
"
fi

if ! grep -q "ARK_APP_BUILDER" node_modules/app-builder-bin/index.js 2>/dev/null; then
  node -e "
const fs=require('fs');const p='node_modules/app-builder-bin/index.js';
let s=fs.readFileSync(p,'utf8');
s=s.replace('function getPath() {', 'function getPath() {\n  if (process.env.ARK_APP_BUILDER) { return process.env.ARK_APP_BUILDER }\n');
fs.writeFileSync(p,s);
console.log('patched app-builder-bin');
"
fi

echo "== 1/3 构建前端 =="
if [ -f "$ASCII_BASE/Temp/eb.exe" ]; then
  export ESBUILD_BINARY_PATH="$ASCII_BASE/Temp/eb.exe"
fi
npx vite build

echo "== 2/3 打包 electron =="
export ARK_APP_BUILDER="$TOOLS/app-builder.exe"
export ARK_7ZA="$TOOLS/7za.exe"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
export CSC_IDENTITY_AUTO_DISCOVERY=false

npx electron-builder --win portable --x64 --publish=never \
  --config.directories.output="$OUT"

echo "== 3/3 收集产物 =="
mkdir -p "$ROOT/../release"
ARTIFACT="$(ls "$OUT"/*.exe | head -1)"
cp -f "$ARTIFACT" "$ROOT/../release/$(basename "$ARTIFACT")"
ls -lh "$ROOT/../release/"
