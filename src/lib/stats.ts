import type { PityState, PullSession, PullStats, Rarity } from '../types';

const emptyByRarity = (): Record<Rarity, number> => ({ 3: 0, 4: 0, 5: 0, 6: 0 });

/** 汇总寻访数据（可选按卡池过滤） */
export function computeStats(
  history: PullSession[],
  pityTracker: Record<string, PityState>,
  bannerId?: string,
): PullStats {
  const sessions = bannerId ? history.filter((s) => s.bannerId === bannerId) : history;
  const results = sessions.flatMap((s) => s.results);
  const totalPulls = results.length;
  const totalSpent = sessions.reduce((sum, s) => sum + s.totalSpent, 0);

  const byRarity = emptyByRarity();
  let upCount = 0;
  const streaks: number[] = [];
  let sinceSix = 0;

  for (const r of results) {
    byRarity[r.operator.rarity] += 1;
    if (r.isUp) upCount += 1;
    sinceSix += 1;
    if (r.operator.rarity === 6) {
      streaks.push(sinceSix);
      sinceSix = 0;
    }
  }

  const pct = (n: number) => (totalPulls ? (n / totalPulls) * 100 : 0);
  const byRarityPercent = {
    3: pct(byRarity[3]),
    4: pct(byRarity[4]),
    5: pct(byRarity[5]),
    6: pct(byRarity[6]),
  } as Record<Rarity, number>;

  const sixStarCount = byRarity[6];
  const avg = streaks.length ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0;
  const currentPity = bannerId ? pityTracker[bannerId]?.sixStarPity ?? 0 : 0;

  return {
    totalPulls,
    totalSpent,
    byRarity,
    byRarityPercent,
    sixStarCount,
    avgPullsPerSixStar: Math.round(avg * 10) / 10,
    upCount,
    bestLucky: streaks.length ? Math.min(...streaks) : 0,
    worstLucky: bannerId
      ? Math.max(...streaks, currentPity, 0)
      : streaks.length
        ? Math.max(...streaks)
        : 0,
  };
}
