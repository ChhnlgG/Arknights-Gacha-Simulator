import { useMemo, useState } from 'react';
import { SlidersHorizontal, Wallet, Layers, Plus } from 'lucide-react';
import type { Banner, Operator } from '../types';
import { BANNER_META, BANNER_ORDER, CUSTOM_BANNER_ID } from '../data/banners';
import { useGachaStore } from '../store/useGachaStore';
import { COST_SINGLE, COST_TEN } from '../lib/gacha';
import { OperatorCard } from './OperatorCard';
import { PoolEditor } from './PoolEditor';

/** 卡池色板：不同寻访类型在侧栏 / 横幅上的配色 */
const BANNER_TONE: Record<string, { tag: string; glow: string }> = {
  limited: { tag: 'tag tag-ember', glow: 'rgba(204,100,148,0.55)' },
  single_up: { tag: 'tag tag-plum', glow: 'rgba(207,134,24,0.55)' },
  standard: { tag: 'tag tag-pine', glow: 'rgba(90,143,178,0.5)' },
  jianzhong: { tag: 'tag tag-dust', glow: 'rgba(90,143,124,0.5)' },
};

interface BannerSectionProps {
  onPull: (count: 1 | 10) => void;
  orundum: number;
}

export function BannerSection({ onPull, orundum }: BannerSectionProps) {
  const banners = useGachaStore((s) => s.banners);
  const currentBannerId = useGachaStore((s) => s.currentBannerId);
  const setCurrentBanner = useGachaStore((s) => s.setCurrentBanner);
  const operators = useGachaStore((s) => s.operators);
  const getEffectiveBanner = useGachaStore((s) => s.getEffectiveBanner);

  const [editorOpen, setEditorOpen] = useState(false);

  const banner = banners.find((b) => b.id === currentBannerId) ?? banners[0];
  const effective = getEffectiveBanner(banner.id);
  const meta = BANNER_META[banner.type] ?? BANNER_META.standard;
  const isCustom = banner.id === CUSTOM_BANNER_ID;
  const tone = BANNER_TONE[banner.type] ?? BANNER_TONE.standard;

  const upOps = useMemo(
    () => effective.upOperators.map((id) => operators[id]).filter((o): o is Operator => Boolean(o)),
    [effective.upOperators, operators],
  );
  const sixStars = upOps.filter((o) => o.rarity >= 6);
  const fiveStars = upOps.filter((o) => o.rarity === 5);

  const customPool = useMemo(
    () =>
      (effective.customUp?.poolOperators ?? [])
        .map((id) => operators[id])
        .filter((o): o is Operator => Boolean(o)),
    [effective.customUp, operators],
  );
  const customUpSet = useMemo(() => new Set(effective.customUp?.upOperators ?? []), [effective.customUp]);

  const ordered = BANNER_ORDER.map((id) => banners.find((b) => b.id === id)).filter(
    (b): b is Banner => Boolean(b),
  );

  return (
    <section className="relative">
      <div className="flex flex-wrap items-end gap-4 mb-5 ml-1">
        <span className="tag tag-dust text-[10px] uppercase tracking-label">
          {isCustom ? 'CUSTOM' : meta.cap} · 0{banners.indexOf(banner) + 1}
        </span>
        <h2 className="font-display text-[22px] leading-none text-dust-50">{banner.name}</h2>
        <span className={`${isCustom ? 'tag tag-plum' : tone.tag} -mb-0.5`}>
          {isCustom ? '自定义' : meta.zh}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            className="btn-link text-[12px] inline-flex items-center gap-1.5"
            onClick={() => setEditorOpen(true)}
          >
            <SlidersHorizontal strokeWidth={1.75} className="w-3.5 h-3.5" />
            {isCustom ? '自定义池' : '自定义 UP'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch">
        <aside className="col-span-12 md:col-span-2 flex flex-col pt-1">
          <p className="text-[11px] uppercase tracking-label text-dust-500 mb-3 ml-1">寻访系列</p>
          <ul className="flex flex-col gap-2.5 pl-1">
            {ordered.map((item, index) => {
              const active = item.id === currentBannerId;
              const itemMeta = BANNER_META[item.type] ?? BANNER_META.standard;
              const itemTone = BANNER_TONE[item.type] ?? BANNER_TONE.standard;
              const isCustomItem = item.id === CUSTOM_BANNER_ID;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentBanner(item.id)}
                    className={`group w-full text-left relative px-3 py-3.5 rounded-r-btn transition-all duration-200 ${
                      active ? 'translate-x-3' : 'translate-x-0 hover:translate-x-1'
                    }`}
                    style={{
                      backgroundColor: active ? item.base : 'rgba(255,255,255,0.02)',
                      borderLeft: active ? `1px solid ${item.accent}` : '1px solid transparent',
                      boxShadow: active
                        ? 'inset 1px 0 0 rgba(255,232,180,0.08), 0 10px 24px -18px rgba(0,0,0,0.7)'
                        : undefined,
                    }}
                  >
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`num-display font-bold text-[11px] shrink-0 w-4 ${
                          active ? 'text-ember-200' : 'text-dust-500'
                        }`}
                      >
                        0{index + 1}
                      </span>
                      <span
                        className={`tag ${isCustomItem ? 'tag-plum' : itemTone.tag} text-[10px] px-2 py-0.5`}
                      >
                        {isCustomItem ? '自定义' : itemMeta.zh}
                      </span>
                    </div>
                    <h4
                      className={`mt-1.5 font-display text-[13px] leading-tight pr-2 ${
                        active ? 'text-dust-50' : 'text-dust-300 group-hover:text-dust-100'
                      }`}
                    >
                      {item.name}
                    </h4>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="col-span-12 md:col-span-10 flex flex-col">
          <article
            key={banner.id}
            className="banner-current animate-banner-in relative flex-1 overflow-hidden rounded-r-card border border-white/[0.08]"
            style={{ minHeight: 300, backgroundColor: banner.base }}
          >
            {/* 背景光效：主色聚光 + 细网格 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(80% 120% at 12% -10%, ${tone.glow}, transparent 62%),
                             radial-gradient(60% 100% at 100% 110%, rgba(0,0,0,0.55), transparent 60%)`,
                opacity: 0.55,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.07]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 46px)',
              }}
            />
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${banner.accent}, transparent)` }}
            />

            <div className="relative z-10 h-full w-full flex flex-col justify-between gap-5 px-5 py-5 md:px-7 md:py-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`tag ${isCustom ? 'tag-plum' : tone.tag}`}>
                    {isCustom ? '自定义' : meta.zh}
                  </span>
                  <span className="text-[10px] uppercase tracking-label text-white/50">{meta.cap}</span>
                </div>
                <p className="font-display italic text-[12px] leading-snug text-white/65 max-w-[560px]">
                  {banner.tagline}
                </p>
              </div>

              <div className="relative flex flex-wrap items-end gap-4 md:gap-5 w-full">
                {isCustom ? (
                  customPool.length > 0 ? (
                    <>
                      {customPool.slice(0, 9).map((op) => (
                        <OperatorCard
                          key={op.id}
                          operator={op}
                          size="sm"
                          isUp={customUpSet.has(op.id)}
                          showProfession={false}
                        />
                      ))}
                      {customPool.length > 9 && (
                        <span className="text-white/50 text-sm">+{customPool.length - 9}</span>
                      )}
                    </>
                  ) : (
                    <div className="py-4 px-2 italic text-white/40 text-sm">
                      请点击上方「自定义池」按钮，选择可抽角色和 UP 角色
                    </div>
                  )
                ) : (
                  <>
                    <div className="flex flex-wrap items-end gap-4 md:gap-6 flex-1 min-w-0">
                      {sixStars.length > 0 ? (
                        sixStars.map((op) => (
                          <OperatorCard key={op.id} operator={op} size="md" isUp />
                        ))
                      ) : (
                        <div className="py-3 px-2 italic text-white/40 text-sm">
                          （本池暂无六星 UP 配置）
                        </div>
                      )}
                    </div>
                    {fiveStars.length > 0 && (
                      <div className="hidden lg:flex items-end gap-3 shrink-0 ml-auto">
                        {fiveStars.map((op) => (
                          <OperatorCard key={op.id} operator={op} size="sm" isUp showProfession={false} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-end justify-between gap-6 w-full flex-wrap">
                <div className="flex flex-wrap items-center gap-2 max-w-[52%]">
                  {isCustom ? (
                    <>
                      <span className="tag tag-plum">可抽 {customPool.length} 名</span>
                      <span className="tag tag-ember">UP {customUpSet.size} 名</span>
                      <span className="tag tag-dust">UP 概率 {banner.rateUpPercent}%</span>
                    </>
                  ) : (
                    <>
                      <span className="tag tag-ember">六星 UP {sixStars.length}</span>
                      <span className="tag tag-plum">五星 UP {fiveStars.length}</span>
                      <span className="tag tag-dust">UP 概率 {banner.rateUpPercent}%</span>
                    </>
                  )}
                </div>
                <div className="flex items-stretch gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPull(1)}
                    disabled={orundum < COST_SINGLE}
                    className="btn-ghost inline-flex items-center justify-center gap-2 min-w-[132px]"
                  >
                    <Wallet strokeWidth={1.75} className="w-4 h-4" />
                    <span className="tracking-[0.12em]">寻访 ×1</span>
                    <span className="text-[11px] text-dust-500 tracking-label ml-1">
                      {COST_SINGLE.toLocaleString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPull(10)}
                    disabled={orundum < COST_TEN}
                    className="btn-primary inline-flex items-center justify-center gap-2.5 relative"
                  >
                    <Layers strokeWidth={1.75} style={{ width: 18, height: 18 }} />
                    <span>寻访 ×10</span>
                    <span className="text-[10.5px] opacity-70 tracking-label ml-1">
                      {COST_TEN.toLocaleString()} · 保底 5★
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <PoolEditor open={editorOpen} banner={banner} onClose={() => setEditorOpen(false)} />
    </section>
  );
}

export function AddFirstOperatorHint({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-link inline-flex items-center gap-1 text-[12px]">
      <Plus className="w-3 h-3" /> 创建自定义干员
    </button>
  );
}
