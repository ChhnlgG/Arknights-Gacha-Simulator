# 明日方舟寻访模拟器 · Arknights Headhunt Simulator

一个纯前端实现的《明日方舟》寻访（抽卡）模拟器。React 18 + TypeScript + Vite 5 + Tailwind 3 +
Zustand 4，可用浏览器直接运行，也可打包为 Electron 单文件桌面应用。

抽卡概率、保底、UP 机制按原作规则实现；卡面立绘、稀有度光效、十连动画均为本地渲染，离线可用。

本工程最初以单文件脚本形式开发，后按模块拆分重构为当前 TypeScript 结构（`src/` 各层见下方目录说明）。

## 功能

- **五类卡池**：限定 / 单 UP / 标准 / 中坚 / 自定义，规则各自独立
- **完整保底**：六星 50 抽后递增概率、99 抽硬保底、十连五星保底、六星大保底
- **统一卡面**：同一个 `OperatorCard` 组件承担横幅、选人面板、寻访结果、历史记录，
  三种尺寸（`sm` 90×124 / `md` 116×160 / `lg` 168×232），星屑由干员 id 派生以保证同一角色到处一致
- **寻访动画**：传送门 → 翻牌 → 结算，六星附带旋转虹光边框与镭射面
- **数据统计**：稀有度分布、平均出六星抽数、最非 / 最欧记录
- **自定义干员**：可上传本地图片作为立绘，前端压成 320×400 JPEG 存入 localStorage
- **离线优先**：中文字体按项目用字子集化后内置，不依赖任何 CDN

## 快速开始

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 产出 dist/
npm run typecheck  # tsc --noEmit
```

抽卡逻辑是纯函数（`src/lib/gacha.ts`，无副作用），保底状态机与候选筛选分离，便于单独测试。

## 素材说明（重要）

**本仓库不包含干员立绘，也不包含干员实名数据。**

`public/portraits/` 下的立绘与完整干员名录，属于《明日方舟》（Hypergryph / 鹰角网络）
及其权利人的美术与文本资产，**不随本仓库分发**。

仓库内的 `src/data/operators.example.json` 只含 4 条虚构占位干员，用于演示数据结构。
应用启动时读取 `src/data/operators.local.json`；该文件不存在则回退到示例数据，
`public/portraits/` 为空时卡面自动回退到内置矢量占位图（稀有度配色 + 干员名），
**应用依然可以正常构建与运行**。

本地补齐真实数据：

```bash
cp src/data/operators.example.json src/data/operators.local.json
```

然后按同一结构填充 `id / name / rarity / profession / pool`，并把对应的 384×512（3:4）
JPEG 放进 `public/portraits/<id>.jpg`。`portrait` 字段由 `id` 自动派生，无需手写。
请自行确认你所在地区对相关素材的使用权限。

字体为思源黑体 / 思源宋体子集化产物（SIL Open Font License 1.1），可随仓库分发。

## 目录结构

```
src/
  types.ts              领域模型（Operator / Banner / PityState / PullResult …）
  data/
    operators.ts        名册加载器（读 local.json，回退 example）
    operators.example.json  虚构占位数据，可入库
    banners.ts          卡池定义
  theme/rarity.ts       稀有度配色、星数、虹彩渐变
  lib/
    gacha.ts            抽卡纯函数：概率、保底、候选筛选、单抽 / 十连
    stats.ts            统计聚合
    images.ts           本地图片读取 + 压缩
  store/useGachaStore.ts  Zustand + persist，含旧存档迁移
  components/
    OperatorCard.tsx    统一卡面
    BannerSection.tsx   卡池侧栏 + 横幅 + 寻访按钮
    PoolEditor.tsx      自定义 UP / 自定义池 / 自定义干员
    PullOverlay.tsx     寻访动画
    PityPanel.tsx       保底进度
  pages/                Home / Result / History
  index.css             设计系统 + 卡面光效关键帧
public/
  portraits/            立绘（不入库，见上）
scripts/                图标生成、字体子集化、预览图渲染、PE 图标写入
```

## 抽卡规则

| 项目 | 规则 |
| --- | --- |
| 六星基础概率 | 2%，第 50 抽起每抽 +2%，第 99 抽必出 |
| 五星 / 四星 / 三星 | 8% / 50% / 40% |
| 十连保底 | 前 9 抽未出 5★ 时，第 10 抽必为 5★ 及以上 |
| 六星大保底 | 本池六星未出 UP 时，下一次六星必为 UP |
| 单抽 / 十连 | 600 / 6000 合成玉，初始 100,000 |

## 卡面构图

`OperatorCard` 用 `object-fit: cover` + `object-position: 50% 16%` 把 384×512 立绘装进卡面。
该锚点偏向画面上部，让面部落在卡面上二分之一。不同立绘的头部位置差异较大时，
可用 `--ak-art-pos` 变量按需覆盖，无需改组件。

## 打包为桌面应用

```bash
bash scripts/build-win.sh    # → release/明日方舟寻访模拟器-<版本>-便携版.exe
```

产物为单文件便携版（Electron 28 + NSIS SFX），双击即用。脚本内已处理 Windows 下
中文路径导致 Go 工具链（`app-builder.exe` / `7za.exe`）无法加载系统 DLL 的问题，细节见脚本注释。

## 应用图标

图标来自单份几何数据，由脚本同时渲染矢量与各尺寸位图：

```bash
python scripts/make_icon.py    # → build/icon.svg · icon.ico · icon-{16..512}.png
```

## 字体子集化

```bash
python scripts/collect-charset.py   # 汇总源码用字
pyftsubset NotoSansCJKsc-Regular.otf --text-file=scripts/_charset.txt \
  --flavor=woff2 --output-file=src/assets/fonts/noto-sans-sc-400.woff2 \
  --layout-features='*' --no-hinting
```

新增大量文案后如出现缺字，重新执行上述流程即可。

## 免责声明

本项目为个人学习与技术演示用途的非官方作品，与 Hypergryph / 鹰角网络无任何关联。
《明日方舟》名称、角色及相关美术资产的权利归其各自权利人所有。
