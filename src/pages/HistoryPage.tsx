import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  History as HistoryIcon,
  Trash2,
  Sparkles,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  Coins,
  Activity,
  Crosshair,
} from 'lucide-react';
import { useGachaStore } from '../store/useGachaStore';
import { computeStats } from '../lib/stats';
import { BANNER_META } from '../data/banners';
import { RARITY_ORDER, RARITY_THEME } from '../theme/rarity';
import { OperatorCard } from '../components/OperatorCard';
import { Button, FilterChip, Panel, SectionTitle, StatCard } from '../components/ui';
import type { Rarity } from '../types';

const EXPECTED: Record<Rarity, number> = { 6: 2, 5: 8, 4: 50, 3: 40 };

export function HistoryPage() {
  const navigate = useNavigate();
  const history = useGachaStore((s) => s.history);
  const banners = useGachaStore((s) => s.banners);
  const pityTracker = useGachaStore((s) => s.pityTracker);
  const clearHistory = useGachaStore((s) => s.clearHistory);

  const [bannerFilter, setBannerFilter] = useState<'all' | string>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const stats = useMemo(() => computeStats(history, pityTracker), [history, pityTracker]);

  const filtered = useMemo(
    () =>
      history.filter((session) => {
        if (bannerFilter !== 'all' && session.bannerId !== bannerFilter) return false;
        if (rarityFilter !== 'all' && !session.results.some((r) => r.operator.rarity === rarityFilter)) {
          return false;
        }
        return true;
      }),
    [history, bannerFilter, rarityFilter],
  );

  const bannerName = (id: string) => banners.find((b) => b.id === id)?.name ?? '未知卡池';
  const bannerTypeLabel = (id: string) => {
    const type = banners.find((b) => b.id === id)?.type;
    return type ? BANNER_META[type].zh : '未知';
  };

  const clear = () => {
    if (window.confirm('确定要清除所有寻访记录和保底进度吗？此操作不可撤销。')) clearHistory();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap animate-float-in">
        <Button variant="ghost" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/')}>
          返回寻访主页
        </Button>
        <Button
          variant="danger"
          size="md"
          leftIcon={<Trash2 className="w-4 h-4" />}
          onClick={clear}
          disabled={history.length === 0}
        >
          清除记录
        </Button>
      </div>

      <section className="animate-float-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl metal-border bg-ark-bg-deep flex items-center justify-center shrink-0">
            <HistoryIcon className="w-6 h-6 text-amber-300" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black shine-text tracking-wider">
              寻访历史与统计
            </h1>
            <p className="text-xs md:text-sm text-gray-400 tracking-wider mt-0.5">
              Headhunt History · 博士的寻访足迹
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="总寻访次数"
            value={stats.totalPulls.toLocaleString()}
            accent="amber"
          />
          <StatCard
            icon={<Coins className="w-5 h-5" />}
            label="累计消耗合成玉"
            value={`${(stats.totalSpent / 1000).toFixed(1)}K`}
            accent="amber"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5" />}
            label="6星总数"
            value={`${stats.byRarity[6]}`}
            accent="gold"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="6星占比"
            value={`${stats.byRarityPercent[6].toFixed(1)}%`}
            accent="gold"
          />
          <StatCard
            icon={<Crosshair className="w-5 h-5" />}
            label="平均6星抽数"
            value={stats.avgPullsPerSixStar ? `${stats.avgPullsPerSixStar}` : '—'}
            suffix={stats.avgPullsPerSixStar ? '抽' : ''}
            accent="purple"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5" />}
            label="UP出货总计"
            value={`${stats.upCount}`}
            accent="purple"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-float-in">
        {RARITY_ORDER.map((rarity) => {
          const count = stats.byRarity[rarity];
          const pct = stats.byRarityPercent[rarity];
          const expected = EXPECTED[rarity];
          const above = pct > expected;
          const theme = RARITY_THEME[rarity];
          const bar = rarity === 6 ? '#f59e0b' : rarity === 5 ? '#a855f7' : rarity === 4 ? '#38bdf8' : '#94a3b8';
          return (
            <Panel key={rarity} padding="md" metal={rarity === 6}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-display font-black text-lg md:text-xl ${theme.textClass}`}>
                  {theme.label}
                </span>
                <span className="text-xs text-gray-500 tabular-nums">期望 {expected}%</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-3xl md:text-4xl font-black tabular-nums shine-text">
                  {count}
                </span>
                <span className="text-xs text-gray-400">名</span>
                <span className="ml-auto text-xs tabular-nums">
                  <span className={`font-bold ${above ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {pct.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (pct / (expected * 2)) * 100)}%`,
                    backgroundColor: bar,
                    boxShadow: rarity === 6 ? '0 0 10px rgba(245,158,11,0.6)' : undefined,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                {above ? (
                  <>
                    <span className="text-emerald-400">●</span> 高于期望概率
                  </>
                ) : pct === 0 ? (
                  '尚未出货'
                ) : (
                  <>
                    <span className="text-slate-400">●</span> 低于期望概率
                  </>
                )}
              </p>
            </Panel>
          );
        })}
      </section>

      <section className="animate-float-in">
        <Panel padding="lg">
          <SectionTitle
            icon={<HistoryIcon className="w-5 h-5 text-amber-400" />}
            title={
              <>
                寻访记录列表
                <span className="ml-1 text-sm font-body font-normal text-gray-400">
                  共 {filtered.length} 条 · 筛选后
                </span>
              </>
            }
            right={
              <div className="flex flex-wrap gap-2 items-center">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Filter className="w-3.5 h-3.5" />
                  筛选:
                </span>
                <FilterChip active={bannerFilter === 'all'} onClick={() => setBannerFilter('all')}>
                  全部卡池
                </FilterChip>
                {banners.map((b) => (
                  <FilterChip
                    key={b.id}
                    active={bannerFilter === b.id}
                    onClick={() => setBannerFilter(b.id)}
                  >
                    {BANNER_META[b.type]?.zh ?? b.name}
                  </FilterChip>
                ))}
                <span className="w-px h-5 bg-white/10 mx-1" />
                <FilterChip active={rarityFilter === 'all'} onClick={() => setRarityFilter('all')}>
                  所有稀有度
                </FilterChip>
                {RARITY_ORDER.map((r) => (
                  <FilterChip
                    key={r}
                    active={rarityFilter === r}
                    onClick={() => setRarityFilter(r)}
                    rarity={r}
                  >
                    ★{r}
                  </FilterChip>
                ))}
              </div>
            }
          />

          {filtered.length === 0 ? (
            <div className="text-center py-16 md:py-24">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <HistoryIcon className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-400 mb-2">暂无寻访记录</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                {history.length === 0
                  ? '开始你的第一次寻访，记录将会出现在这里。'
                  : '当前筛选条件下没有匹配的记录，试试调整筛选条件吧。'}
              </p>
              <Button onClick={() => navigate('/')}>前往寻访</Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((session, index) => {
                const counts = session.results.reduce<Record<number, number>>(
                  (acc, r) => ({ ...acc, [r.operator.rarity]: (acc[r.operator.rarity] ?? 0) + 1 }),
                  {},
                );
                const six = session.results.filter((r) => r.operator.rarity >= 6);
                const five = session.results.filter((r) => r.operator.rarity === 5);
                const highlights = (six.length > 0 ? six : five).slice(0, 5);
                const open = expanded[session.id] ?? index < 3;

                return (
                  <li
                    key={session.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      counts[6]
                        ? 'border-amber-400/40'
                        : counts[5]
                          ? 'border-purple-400/25 bg-white/[0.025]'
                          : 'border-white/5 bg-white/[0.015] hover:bg-white/[0.035]'
                    }`}
                    style={counts[6] ? { backgroundColor: '#1a1004' } : undefined}
                  >
                    <button
                      className="w-full p-4 md:p-5 text-left flex flex-col md:flex-row md:items-center gap-4"
                      onClick={() => setExpanded((prev) => ({ ...prev, [session.id]: !open }))}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex flex-col items-center justify-center shrink-0 w-14 md:w-16 h-14 md:h-16 rounded-xl border border-white/10 bg-black/40">
                          <span className="font-display text-lg md:text-xl font-black text-amber-300 leading-none">
                            ×{session.pullCount}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                            pulls
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-display font-bold text-gray-100 truncate">
                              {bannerName(session.bannerId)}
                            </span>
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/5 border border-white/10 text-gray-400">
                              {bannerTypeLabel(session.bannerId)}
                            </span>
                            {counts[6] > 0 && (
                              <span className="inline-flex px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 shadow-[0_0_12px_rgba(255,180,0,0.3)]">
                                6★ ×{counts[6]}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-gray-500 tabular-nums">
                              {new Date(session.timestamp).toLocaleString('zh-CN')}
                            </span>
                            <span className="opacity-40">|</span>
                            <span className="text-gray-500 tabular-nums">
                              6★保底: {session.pityCountBefore} → {session.pityCountAfter}
                            </span>
                            <span className="opacity-40">|</span>
                            <span className="text-amber-400/80 tabular-nums">
                              {session.totalSpent.toLocaleString()}
                            </span>
                            <span className="text-gray-500">合成玉</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {RARITY_ORDER.map((rarity) =>
                              counts[rarity] ? (
                                <span
                                  key={rarity}
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                                    rarity === 6
                                      ? 'bg-amber-500/20 text-amber-200'
                                      : rarity === 5
                                        ? 'bg-purple-500/20 text-purple-200'
                                        : rarity === 4
                                          ? 'bg-sky-500/15 text-sky-200'
                                          : 'bg-slate-500/15 text-slate-300'
                                  }`}
                                >
                                  ★{rarity} <span className="tabular-nums">×{counts[rarity]}</span>
                                </span>
                              ) : null,
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:justify-end">
                        <div className="hidden md:flex items-end gap-2 overflow-hidden">
                          {highlights.length === 0 ? (
                            <span className="text-xs text-gray-500 italic">本次无5★+</span>
                          ) : (
                            highlights.map((r) => (
                              <OperatorCard
                                key={r.id}
                                operator={r.operator}
                                isUp={r.isUp}
                                size="sm"
                                showProfession={false}
                                style={{ ['--ak-w' as string]: '56px' }}
                              />
                            ))
                          )}
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5 md:ml-2">
                          {open ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-white/5 p-4 md:p-5 bg-black/20">
                        <div className="flex flex-wrap gap-3 justify-center">
                          {session.results.map((r) => (
                            <OperatorCard key={r.id} operator={r.operator} isUp={r.isUp} size="sm" />
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}
