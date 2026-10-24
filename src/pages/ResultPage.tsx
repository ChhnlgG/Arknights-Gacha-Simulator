import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, History, Sparkles, Home, Wallet } from 'lucide-react';
import { useGachaStore } from '../store/useGachaStore';
import { COST_SINGLE, COST_TEN } from '../lib/gacha';
import { RARITY_ORDER } from '../theme/rarity';
import { OperatorCard } from '../components/OperatorCard';
import { Button, Panel } from '../components/ui';

export function ResultPage() {
  const navigate = useNavigate();
  const results = useGachaStore((s) => s.lastResults);
  const bannerId = useGachaStore((s) => s.lastBannerId);
  const banners = useGachaStore((s) => s.banners);
  const history = useGachaStore((s) => s.history);
  const orundum = useGachaStore((s) => s.orundum);
  const performPull = useGachaStore((s) => s.performPull);

  useEffect(() => {
    if (!results) navigate('/', { replace: true });
  }, [results, navigate]);

  if (!results) return null;

  const banner = banners.find((b) => b.id === bannerId) ?? banners[0];
  const counts = results.reduce<Record<number, number>>(
    (acc, r) => ({ ...acc, [r.operator.rarity]: (acc[r.operator.rarity] ?? 0) + 1 }),
    {},
  );
  const maxRarity = Math.max(...results.map((r) => r.operator.rarity));
  const session = history[0];
  const spent = session?.totalSpent ?? 0;
  const pityBefore = session?.pityCountBefore ?? 0;
  const pityAfter = session?.pityCountAfter ?? 0;
  const upCount = results.filter((r) => r.isUp).length;
  const hasSix = (counts[6] ?? 0) > 0;

  const again = (count: 1 | 10) => {
    if (!bannerId) return;
    // 抽卡结果写入 store，本页会自动重新渲染
    performPull(bannerId, count);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap animate-float-in">
        <Button variant="ghost" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/')}>
          返回寻访主页
        </Button>
        <Button variant="ghost" size="md" leftIcon={<History className="w-4 h-4" />} onClick={() => navigate('/history')}>
          历史记录
        </Button>
      </div>

      <section className="text-center animate-float-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 mb-4 backdrop-blur">
          <span className="text-xs text-gray-400 tracking-widest">{banner.name} · 消耗</span>
          <span className="font-display font-bold shine-text tabular-nums">{spent.toLocaleString()}</span>
          <span className="text-xs text-amber-300/80">合成玉</span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-black shine-text tracking-[0.2em] mb-2">
          寻访结果
        </h1>
        <div className="flex items-center justify-center gap-4 text-xs md:text-sm text-gray-400 tracking-widest flex-wrap">
          <span>共 {results.length} 名干员</span>
          <span className="opacity-40">|</span>
          <span>
            6★保底进度 {pityBefore} →{' '}
            <span className={pityAfter < pityBefore ? 'text-amber-300' : ''}>{pityAfter}</span>
          </span>
          {upCount > 0 && (
            <>
              <span className="opacity-40">|</span>
              <span className="text-rose-300">UP出货 ×{upCount}</span>
            </>
          )}
        </div>
      </section>

      <section className="animate-float-in">
        <Panel padding="lg" className="relative overflow-hidden" metal={maxRarity >= 6}>
          {maxRarity >= 6 && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20 animate-pulse"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,200,80,0.4), transparent 60%)' }}
            />
          )}
          <div className="relative">
            <div className="flex flex-wrap gap-2 mb-5 justify-center">
              {RARITY_ORDER.map((rarity) =>
                counts[rarity] ? (
                  <div
                    key={rarity}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-display font-black border backdrop-blur ${
                      rarity === 6
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-[0_0_24px_rgba(255,180,0,0.3)]'
                        : rarity === 5
                          ? 'bg-purple-500/20 text-purple-200 border-purple-400/40'
                          : rarity === 4
                            ? 'bg-sky-500/15 text-sky-200 border-sky-400/30'
                            : 'bg-slate-500/15 text-slate-200 border-slate-400/25'
                    }`}
                  >
                    <span className="tracking-wider">{'★'.repeat(rarity)}</span>
                    <span className="text-sm">×{counts[rarity]}</span>
                  </div>
                ) : null,
              )}
            </div>
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center items-end">
              {results.map((r, index) => (
                <div key={r.id} className="animate-float-in" style={{ animationDelay: `${index * 60}ms` }}>
                  <OperatorCard operator={r.operator} isUp={r.isUp} size={results.length === 1 ? 'lg' : 'md'} />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      {hasSix && (
        <section className="animate-float-in">
          <Panel padding="lg" className="relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: 'linear-gradient(135deg, rgba(255,200,80,0.1), transparent 50%, rgba(200,100,255,0.1))',
              }}
            />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 30px rgba(245,158,11,0.5)' }}
              >
                <Sparkles className="w-7 h-7 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-black shine-text mb-1">恭喜博士！出货 6★ 干员！</h3>
                <p className="text-sm text-gray-300/80">
                  你在这次寻访中获得了
                  <span className="text-amber-300 font-bold"> {counts[6]} </span>名6星干员
                  {upCount > 0 && (
                    <>
                      ，其中 <span className="text-rose-300 font-bold">{upCount}</span> 名为UP角色
                    </>
                  )}
                  。愿下一次寻访同样好运。
                </p>
              </div>
            </div>
          </Panel>
        </section>
      )}

      <section className="animate-float-in">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <Button
            size="xl"
            leftIcon={<Wallet className="w-5 h-5" />}
            disabled={orundum < COST_SINGLE}
            onClick={() => again(1)}
            className="w-full sm:w-auto justify-center"
          >
            <div className="flex flex-col items-start leading-tight">
              <span>再来 1 次</span>
              <span className="text-[11px] tracking-widest opacity-70 mt-0.5">
                {COST_SINGLE.toLocaleString()} 合成玉
              </span>
            </div>
          </Button>
          <Button
            size="xl"
            leftIcon={<Layers className="w-5 h-5" />}
            disabled={orundum < COST_TEN}
            onClick={() => again(10)}
            className="w-full sm:w-auto justify-center"
          >
            <div className="flex flex-col items-start leading-tight">
              <span>再来 10 次</span>
              <span className="text-[11px] tracking-widest opacity-70 mt-0.5">
                {(COST_TEN * 10).toLocaleString()} 合成玉
              </span>
            </div>
          </Button>
          <Button
            variant="ghost"
            size="xl"
            leftIcon={<Home className="w-5 h-5" />}
            onClick={() => navigate('/')}
            className="w-full sm:w-auto justify-center"
          >
            返回主页
          </Button>
        </div>
      </section>
    </div>
  );
}
