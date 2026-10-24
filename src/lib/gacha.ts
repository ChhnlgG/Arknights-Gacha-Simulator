import type {
  Banner,
  BannerType,
  Operator,
  PityState,
  PullResult,
  Rarity,
} from '../types';

export const COST_SINGLE = 600;
export const COST_TEN = 6000;
export const INITIAL_ORUNDUM = 100_000;

const SIX_STAR_BASE = 0.02;
const FIVE_STAR_RATE = 0.08;
const FOUR_STAR_RATE = 0.5;
const SOFT_PITY_START = 50;
const HARD_PITY = 99;

export const emptyPity = (): PityState => ({
  sixStarPity: 0,
  fiveStarPity: 0,
  guaranteedSixStarUp: false,
  totalPulls: 0,
});

export const makePityTrackers = (banners: Banner[]): Record<string, PityState> =>
  Object.fromEntries(banners.map((b) => [b.id, emptyPity()]));

/** 当前 6★ 单抽概率（含软保底递增） */
export const sixStarRate = (pity: number): number => {
  if (pity >= HARD_PITY - 1) return 1;
  if (pity >= SOFT_PITY_START) return SIX_STAR_BASE + (pity - (SOFT_PITY_START - 1)) * 0.02;
  return SIX_STAR_BASE;
};

export const pullsUntilSixStar = (pity: number): number => Math.max(0, HARD_PITY - pity);

const pickRandom = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

/** 本轮抽卡的稀有度判定 */
export function rollRarity(pity: PityState, isLastOfTen: boolean) {
  const rate = sixStarRate(pity.sixStarPity);
  const roll = Math.random();
  let rarity: Rarity;
  let hardPity = false;

  if (roll < rate) {
    rarity = 6;
    if (pity.sixStarPity >= HARD_PITY - 1) hardPity = true;
  } else if (roll < rate + FIVE_STAR_RATE) {
    rarity = 5;
  } else if (roll < rate + FIVE_STAR_RATE + FOUR_STAR_RATE) {
    rarity = 4;
  } else {
    rarity = 3;
  }

  let tenPity = false;
  if (isLastOfTen && rarity < 5 && pity.fiveStarPity >= 9) {
    rarity = 5;
    tenPity = true;
  }

  return {
    rarity,
    isSoftPity: pity.sixStarPity >= SOFT_PITY_START,
    isHardPity: hardPity,
    isTenPullPity: tenPity,
  };
}

/** 按寻访类型筛出候选干员 */
export function candidatesFor(rarity: Rarity, type: BannerType, operators: Record<string, Operator>) {
  const all = Object.values(operators).filter((op) => op.rarity === rarity);
  if (rarity < 5) return all.filter((op) => !op.pool);
  return all.filter((op) => op.pool === type);
}

/** 抽中某稀有度后，决定具体干员与是否 UP */
export function pickOperator(
  rarity: Rarity,
  banner: Banner,
  operators: Record<string, Operator>,
  guaranteedUp: boolean,
): { operator: Operator; isUp: boolean } {
  const customPool = banner.customUp?.poolOperators ?? [];
  let candidates: Operator[];

  if (customPool.length > 0) {
    candidates = customPool
      .map((id) => operators[id])
      .filter((op): op is Operator => Boolean(op) && op.rarity === rarity);
    if (candidates.length === 0) {
      const fallback = customPool.map((id) => operators[id]).filter(Boolean);
      if (fallback.length > 0) return { operator: pickRandom(fallback), isUp: false };
      candidates = candidatesFor(rarity, banner.type, operators);
    }
  } else {
    candidates = candidatesFor(rarity, banner.type, operators);
    if (candidates.length === 0) candidates = Object.values(operators).filter((op) => op.rarity === rarity);
  }

  if (candidates.length === 0) {
    const anyOp = Object.values(operators)[0];
    return { operator: anyOp, isUp: false };
  }

  const upCandidates = banner.upOperators
    .map((id) => operators[id])
    .filter((op): op is Operator => Boolean(op) && op.rarity === rarity);
  const rateUp = banner.rateUpPercent / 100;
  const upEnabled = (customPool.length > 0 || rarity >= 5) && banner.upOperators.length > 0;

  if (upEnabled) {
    if (guaranteedUp && upCandidates.length > 0) {
      return { operator: pickRandom(upCandidates), isUp: true };
    }
    if (upCandidates.length > 0 && Math.random() < rateUp) {
      return { operator: pickRandom(upCandidates), isUp: true };
    }
  }

  const operator = pickRandom(candidates);
  return { operator, isUp: upCandidates.some((op) => op.id === operator.id) };
}

export const makeId = (): string =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export interface PullOutcome {
  results: PullResult[];
  nextPity: PityState;
  spent: number;
  pityBefore: number;
  pityAfter: number;
}

/** 执行一次 1 抽 / 10 抽（纯函数，便于测试） */
export function runPull(
  banner: Banner,
  operators: Record<string, Operator>,
  pity: PityState,
  count: 1 | 10,
): PullOutcome {
  const next: PityState = { ...pity };
  const pityBefore = next.sixStarPity;
  const results: PullResult[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i += 1) {
    const isLastOfTen = i === count - 1 && count === 10;
    const roll = rollRarity(next, isLastOfTen);
    const guaranteed = roll.rarity >= 6 && next.guaranteedSixStarUp;
    const { operator, isUp } = pickOperator(roll.rarity, banner, operators, guaranteed);

    next.sixStarPity += 1;
    next.fiveStarPity += 1;
    next.totalPulls += 1;

    if (roll.rarity >= 6) {
      next.guaranteedSixStarUp = !isUp;
      next.sixStarPity = 0;
    }
    if (roll.rarity >= 5) next.fiveStarPity = 0;

    results.push({
      id: makeId(),
      operator,
      isUp,
      timestamp: now + i,
      pullNumberInSession: i + 1,
    });
  }

  return {
    results,
    nextPity: next,
    spent: count * COST_SINGLE,
    pityBefore,
    pityAfter: next.sixStarPity,
  };
}
