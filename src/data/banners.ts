import type { Banner, BannerType } from '../types';

export const BANNER_META: Record<BannerType, { zh: string; cap: string }> = {
  limited: { zh: '庆典限定', cap: 'LIMITED' },
  single_up: { zh: '单 UP', cap: 'SINGLE UP' },
  standard: { zh: '标准寻访', cap: 'STANDARD' },
  jianzhong: { zh: '中坚寻访', cap: 'CORE POOL' },
};

export const BANNERS: Banner[] = [
  {
    id: 'banner_limited',
    name: '庆典限定寻访',
    type: 'limited',
    description:
      '限定寻访池：【常规庆典限定】（周年 / 半周年 / 春节 / 夏日）与【联动限定】互通；限定干员（年、夕、令、浊心斯卡蒂、耀骑士临光、W、灰烬等）仅在本池限时可出；4/3 星使用双池通用干员。',
    tagline: 'Limited · 庆典 / 联动限定限时寻访',
    accent: '#cc6494',
    base: '#1c0a15',
    upOperators: ['nian', 'xi', 'shanji', 'shuanghua', 'huolong', 'leilonglang'],
    rateUpPercent: 70,
  },
  {
    id: 'banner_single_up',
    name: '单UP寻访',
    type: 'single_up',
    description:
      '单UP 标准常驻寻访：6★【玛恩纳】出现率占 6★ 总数的 50%；五星【和弦】【寒檀】【吉星】【深律】概率提升；候选池同【标准寻访】，不会抽出中坚专属干员。',
    tagline: 'Single UP · 单 6★ 专属概率提升',
    accent: '#cf8618',
    base: '#1f1306',
    upOperators: ['maenna', 'hexian', 'hantan', 'jixing', 'shenlv'],
    rateUpPercent: 50,
  },
  {
    id: 'banner_standard',
    name: '标准寻访',
    type: 'standard',
    description:
      '【新标准常驻池】—— 仅能抽出：标准专属 6/5★（森蚺、空弦、嵯峨、异客、瑕光、玛恩纳、白铁、可露希尔 等），以及 4/3★ 双池通用干员；中坚寻访专属旧常驻不会出现在本池中。',
    tagline: 'Standard · 新常驻干员标准寻访',
    accent: '#5a8fb2',
    base: '#06131e',
    upOperators: ['senran', 'kongxian', 'danshu', 'aluoma', 'bobo', 'lizhenfen'],
    rateUpPercent: 50,
  },
  {
    id: 'banner_jianzhong',
    name: '中坚寻访',
    type: 'jianzhong',
    description:
      '【中坚寻访】—— 仅能抽出：2023.4.6 从标准池移出的旧常驻 6/5★（能天使、推进之王、伊芙利特、银灰、陈、煌、泥岩、艾雅法拉 等 32 六星 + 68 五星），以及 4/3★ 双池通用干员；新标准池专属干员不会出现在本池中。',
    tagline: 'Core Pool · 2023 中坚常驻专属寻访',
    accent: '#5a8f7c',
    base: '#081b15',
    upOperators: ['nengtianshi', 'yinhui', 'baimianxiao', 'lindong', 'dekesi', 'fulanka'],
    rateUpPercent: 50,
  },
  {
    id: 'banner_custom',
    name: '自定义寻访',
    type: 'standard',
    description:
      '【自定义寻访】—— 完全自定义可抽角色池。左键标记 UP 角色（概率提升），右键标记可抽角色。抽卡时仅从您选定的角色中抽取。',
    tagline: 'Custom · 自选角色池寻访',
    accent: '#a064dc',
    base: '#160a24',
    upOperators: [],
    rateUpPercent: 50,
  },
];

/** 侧栏固定顺序 */
export const BANNER_ORDER = [
  'banner_limited',
  'banner_single_up',
  'banner_standard',
  'banner_jianzhong',
  'banner_custom',
] as const;

export const CUSTOM_BANNER_ID = 'banner_custom';
