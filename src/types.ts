export type Rarity = 3 | 4 | 5 | 6;

export type Profession =
  | '先锋'
  | '近卫'
  | '重装'
  | '狙击'
  | '术师'
  | '医疗'
  | '辅助'
  | '特种';

/** 干员所属的抽取池：中坚 / 新标准 / 限定（含联动） */
export type PoolKind = 'jianzhong' | 'standard' | 'limited';

export interface Operator {
  id: string;
  name: string;
  rarity: Rarity;
  profession: Profession;
  /** 本地精二立绘路径；缺失时回退到矢量占位图 */
  portrait?: string;
  isLimited?: boolean;
  /** 仅在这些寻访类型中出现；null 表示 3/4 星通用 */
  pool?: PoolKind | null;
  isCustom?: boolean;
  description?: string;
}

export type BannerType = 'limited' | 'single_up' | 'standard' | 'jianzhong';

export interface CustomUp {
  upOperators: string[];
  poolOperators?: string[];
  rateUpPercent: number;
  updatedAt?: number;
}

export interface Banner {
  id: string;
  name: string;
  type: BannerType;
  description: string;
  tagline: string;
  /** 横幅主色（CSS 颜色） */
  accent: string;
  /** 横幅底色（CSS 颜色） */
  base: string;
  upOperators: string[];
  rateUpPercent: number;
  customUp?: CustomUp | null;
}

export interface PityState {
  sixStarPity: number;
  fiveStarPity: number;
  guaranteedSixStarUp: boolean;
  totalPulls: number;
}

export interface PullResult {
  id: string;
  operator: Operator;
  isUp: boolean;
  timestamp: number;
  pullNumberInSession: number;
}

export interface PullSession {
  id: string;
  bannerId: string;
  timestamp: number;
  pullCount: number;
  results: PullResult[];
  totalSpent: number;
  pityCountBefore: number;
  pityCountAfter: number;
}

export interface PullStats {
  totalPulls: number;
  totalSpent: number;
  byRarity: Record<Rarity, number>;
  byRarityPercent: Record<Rarity, number>;
  sixStarCount: number;
  avgPullsPerSixStar: number;
  upCount: number;
  bestLucky: number;
  worstLucky: number;
}
