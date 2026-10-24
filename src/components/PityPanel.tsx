import { Activity, Sparkles, Flame, Timer } from 'lucide-react';
import { useGachaStore } from '../store/useGachaStore';
import { sixStarRate, pullsUntilSixStar } from '../lib/gacha';
import { Progress, StatCard } from './ui';

export function PityPanel() {
  const bannerId = useGachaStore((s) => s.currentBannerId);
  const pity = useGachaStore((s) => s.pityTracker[bannerId]);

  if (!pity) return null;

  const rate = sixStarRate(pity.sixStarPity);
  const remaining = pullsUntilSixStar(pity.sixStarPity);
  const softPity = pity.sixStarPity >= 50;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="总抽数"
          value={pity.totalPulls.toLocaleString()}
          accent="amber"
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="6星保底进度"
          value={`${pity.sixStarPity}/99`}
          accent={softPity ? 'amber' : 'blue'}
        />
        <StatCard
          icon={<Timer className="w-4 h-4" />}
          label="6星剩余抽数"
          value={remaining === 0 ? '必出!' : `${remaining}`}
          accent="purple"
        />
        <StatCard
          icon={<Sparkles className="w-4 h-4" />}
          label="当前6星概率"
          value={`${(rate * 100).toFixed(1)}%`}
          accent={rate >= 0.5 ? 'amber' : 'blue'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Progress
          value={Math.min(pity.sixStarPity, 99)}
          max={99}
          label="6星保底进度"
          sublabel={`第50抽起概率递增，第99抽必出6星${pity.guaranteedSixStarUp ? ' · 下一6星必为UP' : ''}`}
          variant="gold"
        />
        <Progress
          value={Math.min(pity.fiveStarPity, 9)}
          max={9}
          label="5星十连保底"
          sublabel="单次十连若前9抽未出5星及以上，第10抽至少为5星"
          variant="purple"
        />
      </div>

      {pity.guaranteedSixStarUp && (
        <div
          className="relative overflow-hidden rounded-xl border border-amber-400/40 p-3 flex items-center gap-3"
          style={{ backgroundColor: '#3d2607' }}
        >
          <div
            className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(245,158,11,0.25)' }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="relative flex-1">
            <p className="text-sm font-bold text-amber-200">大小保底激活</p>
            <p className="text-xs text-amber-200/70">下次获得6星干员时，必定为当前UP干员！</p>
          </div>
        </div>
      )}
    </div>
  );
}
