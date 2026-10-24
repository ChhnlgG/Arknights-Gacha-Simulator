import type { Rarity } from '../types';

export interface RarityTheme {
  label: string;
  /** 卡框主色 */
  color: string;
  /** 卡框副色（渐变尾） */
  color2: string;
  /** 卡面底色（渐变起点 / 终点） */
  base: string;
  base2: string;
  /** 光晕颜色 */
  glow: string;
  /** 文字强调色（Tailwind 类） */
  textClass: string;
  /** 星级标签底色 */
  starsClass: string;
  /** 立绘缺失时的占位底色 */
  placeholder: string;
}

export const RARITY_THEME: Record<Rarity, RarityTheme> = {
  6: {
    label: '6★',
    color: '#ffd9f2',
    color2: '#8ef0ff',
    base: '#1b0620',
    base2: '#07020c',
    glow: 'rgba(240, 171, 252, 0.55)',
    textClass: 'text-fuchsia-200',
    starsClass: 'text-ember-200',
    placeholder: 'linear-gradient(160deg, #3a0b46 0%, #180620 55%, #0a0310 100%)',
  },
  5: {
    label: '5★',
    color: '#ffe3a3',
    color2: '#b9761a',
    base: '#1d1206',
    base2: '#0e0702',
    glow: 'rgba(232, 166, 58, 0.42)',
    textClass: 'text-amber-200',
    starsClass: 'text-ember-200',
    placeholder: 'linear-gradient(160deg, #3a2408 0%, #1c1104 55%, #0b0602 100%)',
  },
  4: {
    label: '4★',
    color: '#c79be8',
    color2: '#6a3f96',
    base: '#150a22',
    base2: '#08040d',
    glow: 'rgba(156, 130, 184, 0.38)',
    textClass: 'text-plum-300',
    starsClass: 'text-plum-400',
    placeholder: 'linear-gradient(160deg, #2a1740 0%, #140a20 55%, #07030c 100%)',
  },
  3: {
    label: '3★',
    color: '#9aa1ad',
    color2: '#4a4f58',
    base: '#15161a',
    base2: '#0a0b0d',
    glow: 'rgba(120, 124, 134, 0.28)',
    textClass: 'text-dust-300',
    starsClass: 'text-dust-400',
    placeholder: 'linear-gradient(160deg, #24262c 0%, #121317 55%, #08090b 100%)',
  },
};

export const RARITY_ORDER: Rarity[] = [6, 5, 4, 3];

export const stars = (rarity: Rarity): string => '★'.repeat(rarity);

export const isHighRarity = (rarity: Rarity): boolean => rarity >= 5;

/** 六星专属：流光边框角度 */
export const HOLO_GRADIENT =
  'conic-gradient(from 0deg, #ff5a8f, #ffb347, #ffe066, #6be589, #4fc3f7, #b388ff, #ff5a8f)';
