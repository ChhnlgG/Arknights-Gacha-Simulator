import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, History, Sparkles, Layers } from 'lucide-react';
import { useGachaStore } from '../store/useGachaStore';
import { computeStats } from '../lib/stats';
import { RARITY_ORDER } from '../theme/rarity';
import { BannerSection } from '../components/BannerSection';
import { PityPanel } from '../components/PityPanel';
import { PullOverlay } from '../components/PullOverlay';
import { OperatorCard } from '../components/OperatorCard';
import { KeyStat, SectionTitle } from '../components/ui';
import type { Rarity } from '../types';

const SKIP_KEY = 'ark-skip-animation';

const RATE_TABLE: Record<Rarity, { pct: string; note: string; tone: 'ember' | 'plum' | 'pine' | 'dust' }> = {
  6: { pct: '2%', note: '50 抽起软保底递增 2%，第 99 抽必出', tone: 'ember' },
  5: { pct: '8%', note: '单次十连前 9 抽未出则第 10 抽必出 5★', tone: 'plum' },
  4: { pct: '50%', note: '标准 / 中坚 双池通用，无独立保底', tone: 'pine' },
  3: { pct: '40%', note: '双池通用，无保底', tone: 'dust' },
};

const TONE_TEXT = {
  ember: 'text-ember-100',
  plum: 'text-plum-300',
  pine: 'text-pine-300',
  dust: 'text-dust-400',
} as const;

export function HomePage() {
  const navigate = useNavigate();
  const currentBannerId = useGachaStore((s) => s.currentBannerId);
  const orundum = useGachaStore((s) => s.orundum);
  const history = useGachaStore((s) => s.history);
  const pityTracker = useGachaStore((s) => s.pityTracker);
  const performPull = useGachaStore((s) => s.performPull);
  const banner = useGachaStore((s) => s.getEffectiveBanner(currentBannerId));

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [skipAnimation, setSkipAnimation] = useState(() => {
    try {
      return localStorage.getItem(SKIP_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SKIP_KEY, skipAnimation ? '1' : '0');
    } catch {
      /* 忽略隐私模式下的写入失败 */
    }
  }, [skipAnimation]);

  const stats = useMemo(
    () => computeStats(history, pityTracker, currentBannerId),
    [history, pityTracker, currentBannerId],
  );

  const lastSession = history[0];
  const lastSixStars = useMemo(
    () => (lastSession?.results ?? []).filter((r) => r.operator.rarity >= 6).slice(0, 5),
    [lastSession],
  );
  const recent = history.slice(0, 3);

  const pull = (count: 1 | 10) => {
    const results = performPull(currentBannerId, count);
    if (!results || results.length === 0) return;
    setSessionKey((k) => k + 1);
    setOverlayOpen(true);
  };

  const overlayResults = useGachaStore((s) => s.lastResults);

  return (
    <div className="relative mx-auto max-w-7xl px-6 md:px-10 pb-28">
      {overlayOpen && overlayResults && (
        <PullOverlay
          results={overlayResults}
          sessionKey={sessionKey}
          skipAnimation={skipAnimation}
          orundum={orundum}
          onClose={() => setOverlayOpen(false)}
          onAgain={(count) => {
            const results = performPull(currentBannerId, count);
            if (!results || results.length === 0) return;
            setSessionKey((k) => k + 1);
          }}
        />
      )}

      <section className="pt-2 animate-float-in">
        <BannerSection onPull={pull} orundum={orundum} />
      </section>

      <section className="mt-16 grid grid-cols-12 gap-8 items-start animate-float-in">
        <div className="col-span-12 lg:col-span-4 space-y-12">
          <div>
            <SectionTitle cap="Probability · 寻访概率" title="稀有度出率" />
            <ul className="space-y-3">
              {RARITY_ORDER.map((rarity, index) => {
                const row = RATE_TABLE[rarity];
                return (
                  <li
                    key={rarity}
                    className="px-4 py-3 flex items-baseline gap-5"
                    style={{
                      marginLeft: index % 2 === 0 ? 0 : 22,
                      backgroundColor: index === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderRadius: 4,
                    }}
                  >
                    <span
                      className={`rarity-stars shrink-0 text-[13px] w-16 ${
                        row.tone === 'plum' ? 'rarity-plum' : row.tone === 'dust' ? 'rarity-slate' : ''
                      }`}
                    >
                      {'★'.repeat(rarity)}
                    </span>
                    <span className={`num-display font-display font-bold shrink-0 w-14 ${TONE_TEXT[row.tone]}`}>
                      {row.pct}
                    </span>
                    <span className="text-[12.5px] leading-relaxed text-dust-400">{row.note}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 space-y-1.5 pl-1 text-[11.5px] leading-relaxed text-dust-400/95 max-w-[470px]">
              <p>
                · <span className="text-ember-200/90">大小保底：</span>UP 池中 6★ 出货时，
                {banner.rateUpPercent}% 概率为 UP 干员；若首次歪出非 UP，下一 6★ 必为 UP。
              </p>
              <p>
                · <span className="text-ember-200/90">软保底：</span>自上次 6★ 起第 50 抽开始，6★
                出率每抽递增 2%，直至 100%。
              </p>
            </div>
          </div>

          <div>
            <SectionTitle
              cap="Pity · 保底追踪"
              title="进度与当前统计"
              icon={<BarChart3 strokeWidth={1.75} className="w-4 h-4 text-pine-400" />}
            />
            <div className="pl-2">
              <PityPanel />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-14 pl-0 lg:pl-4">
          <div className="flex items-start justify-between gap-5 flex-wrap">
            <div>
              <h3 className="font-display text-[17px] leading-none text-dust-50 mb-3">动画偏好</h3>
              <label className="inline-flex items-center gap-2 select-none cursor-pointer group">
                <input
                  type="checkbox"
                  checked={skipAnimation}
                  onChange={(e) => setSkipAnimation(e.target.checked)}
                  className="w-3.5 h-3.5 accent-ember-400 opacity-80"
                />
                <span className="text-[12px] text-dust-500 group-hover:text-dust-400 transition-colors">
                  永久跳过寻访动画
                </span>
              </label>
            </div>
            <button onClick={() => navigate('/history')} className="btn-link text-[11.5px] -mt-1">
              查看全部寻访记录 →
            </button>
          </div>

          <div>
            <SectionTitle
              icon={<Layers strokeWidth={1.75} className="w-4 h-4 text-dust-500" />}
              title="本池统计"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 max-w-[580px]">
              <KeyStat label="累计抽数" value={stats.totalPulls.toLocaleString()} />
              <KeyStat label="累计消耗" value={`${(stats.totalSpent / 1000).toFixed(1)}K`} />
              <KeyStat label="6★ 数量" value={`${stats.byRarity[6]}`} color="ember" />
              <KeyStat label="5★ 数量" value={`${stats.byRarity[5]}`} color="plum" />
              <KeyStat
                label="平均 6★"
                value={stats.avgPullsPerSixStar ? `${stats.avgPullsPerSixStar} 抽` : '—'}
                color="ember"
              />
              <KeyStat label="UP 出货" value={`${stats.upCount}`} />
              {stats.bestLucky > 0 && <KeyStat label="最欧抽数" value={`${stats.bestLucky} 抽`} color="ember" />}
              {stats.worstLucky > 0 && (
                <KeyStat label="最非抽数" value={`${stats.worstLucky} 抽`} color="plum" />
              )}
            </div>
          </div>

          <div>
            <SectionTitle
              icon={<Sparkles strokeWidth={1.75} className="w-4 h-4 text-ember-300" />}
              title="最新出货"
              right={
                lastSixStars.length > 0 ? (
                  <span className="tag tag-ember text-[10px]">{lastSixStars.length} 名 6★</span>
                ) : undefined
              }
            />
            {lastSixStars.length > 0 ? (
              <div className="flex flex-wrap gap-4 pl-2">
                {lastSixStars.map((r) => (
                  <OperatorCard key={r.id} operator={r.operator} isUp={r.isUp} size="sm" />
                ))}
              </div>
            ) : (
              <div className="py-10 text-[13px] text-dust-500 pl-2 italic">
                暂无 6★ 寻访记录 · 点击横幅右下角「寻访 ×10」开始你的第一次寻访，博士。
              </div>
            )}
          </div>

          <div>
            <SectionTitle
              icon={<History strokeWidth={1.75} className="w-4 h-4 text-dust-500" />}
              title="最近寻访"
            />
            {recent.length === 0 ? (
              <div className="py-6 text-[13px] text-dust-500 pl-2 italic">暂无记录</div>
            ) : (
              <ul className="space-y-2.5 max-w-[560px]">
                {recent.map((session) => {
                  const counts = session.results.reduce<Record<number, number>>(
                    (acc, r) => ({ ...acc, [r.operator.rarity]: (acc[r.operator.rarity] ?? 0) + 1 }),
                    {},
                  );
                  return (
                    <li
                      key={session.id}
                      className="flex items-center gap-5 px-3 py-2.5 hover:bg-white/[0.025] rounded-r-btn transition-colors"
                    >
                      <span className="num-display text-[11.5px] text-dust-500 shrink-0 w-24">
                        {new Date(session.timestamp).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-display font-bold text-[13px] text-ember-200 shrink-0">
                        ×{session.pullCount}
                      </span>
                      <div className="flex flex-wrap gap-2 min-w-0">
                        {RARITY_ORDER.map((rarity) =>
                          counts[rarity] ? (
                            <span
                              key={rarity}
                              className={`tag ${
                                rarity === 6
                                  ? 'tag-ember'
                                  : rarity === 5
                                    ? 'tag-plum'
                                    : rarity === 4
                                      ? 'tag-pine'
                                      : 'tag-dust'
                              }`}
                            >
                              {'★'.repeat(rarity)} ×{counts[rarity]}
                            </span>
                          ) : null,
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
