import { useMemo, useState, type CSSProperties, type MouseEventHandler } from 'react';
import {
  Zap,
  Sword,
  Shield,
  Crosshair,
  Sparkles,
  HeartPulse,
  Wand2,
  Ghost,
  type LucideIcon,
} from 'lucide-react';
import type { Operator, Profession, Rarity } from '../types';
import { RARITY_THEME, stars } from '../theme/rarity';

export type CardSize = 'sm' | 'md' | 'lg';

const PROFESSION_ICON: Record<Profession, LucideIcon> = {
  先锋: Zap,
  近卫: Sword,
  重装: Shield,
  狙击: Crosshair,
  术师: Sparkles,
  医疗: HeartPulse,
  辅助: Wand2,
  特种: Ghost,
};

const SIZE: Record<CardSize, { w: number; h: number; name: number; stars: number }> = {
  sm: { w: 90, h: 124, name: 13, stars: 9 },
  md: { w: 116, h: 160, name: 15, stars: 10 },
  lg: { w: 168, h: 232, name: 21, stars: 13 },
};

/** 由角色 id 生成稳定的星屑位置，避免重渲染时抖动 */
function sparklesFor(id: string, count: number) {
  let seed = 0;
  for (let i = 0; i < id.length; i += 1) seed = (seed * 31 + id.charCodeAt(i)) % 100000;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: count }, () => ({
    left: `${8 + rand() * 84}%`,
    top: `${6 + rand() * 56}%`,
    delay: `${(rand() * 3.4).toFixed(2)}s`,
    duration: `${(2.6 + rand() * 2).toFixed(2)}s`,
  }));
}

interface OperatorCardProps {
  operator: Operator;
  size?: CardSize;
  isUp?: boolean;
  /** 出现动画（寻访结果用） */
  animate?: boolean;
  animationDelay?: number;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  selected?: boolean;
  poolable?: boolean;
  className?: string;
  style?: CSSProperties;
  showProfession?: boolean;
}

/**
 * 统一的干员卡面：横幅 / 选人面板 / 寻访结果 / 历史记录 / 图鉴共用，
 * 保证同一角色在任何版面下的立绘、稀有度配色、光效完全一致。
 */
export function OperatorCard({
  operator,
  size = 'md',
  isUp = false,
  animate = false,
  animationDelay = 0,
  onClick,
  onContextMenu,
  selected = false,
  poolable = false,
  className = '',
  style,
  showProfession = true,
}: OperatorCardProps) {
  const theme = RARITY_THEME[operator.rarity as Rarity];
  const dims = SIZE[size];
  const [broken, setBroken] = useState(false);
  const Icon = PROFESSION_ICON[operator.profession] ?? Sparkles;
  const hasPortrait = Boolean(operator.portrait) && !broken;
  const highRarity = operator.rarity >= 5;
  const sparkles = useMemo(
    () => (highRarity ? sparklesFor(operator.id, operator.rarity === 6 ? 6 : 4) : []),
    [operator.id, operator.rarity, highRarity],
  );
  const clickable = Boolean(onClick);

  return (
    <div
      className={`ak-op-card ak-op-card--${operator.rarity} ${className}`}
      style={{ ['--ak-w' as string]: `${dims.w}px`, ...style }}
      data-clickable={clickable}
      data-selected={selected}
      data-poolable={poolable}
      data-rarity={operator.rarity}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={`${operator.name} ${theme.label}`}
    >
      <div className="ak-op-card__aura" aria-hidden />

      <div
        className="ak-op-card__frame"
        style={
          animate
            ? { animation: `cardFlip .72s cubic-bezier(.2,.8,.2,1) ${animationDelay}ms both` }
            : undefined
        }
      >
        <div
          className="ak-op-card__inner"
          style={{
            height: dims.h,
            ['--ak-base' as string]: theme.base,
            ['--ak-base2' as string]: theme.base2,
          }}
        >
          {hasPortrait ? (
            <img
              className="ak-op-card__art"
              src={operator.portrait}
              alt={operator.name}
              loading="lazy"
              draggable={false}
              onError={() => setBroken(true)}
            />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{ backgroundImage: theme.placeholder }}
                aria-hidden
              />
              <div className="ak-op-card__placeholder" style={{ fontSize: dims.name + 7 }}>
                {operator.name}
              </div>
            </>
          )}

          <div className="ak-op-card__vignette" aria-hidden />
          <div className="ak-op-card__scrim" aria-hidden />
          {operator.rarity === 6 && <div className="ak-op-card__foil" aria-hidden />}
          <div className="ak-op-card__gloss" aria-hidden />
          {highRarity && <div className="ak-op-card__sheen" aria-hidden />}

          {sparkles.length > 0 && (
            <div className="ak-op-card__sparkles" aria-hidden>
              {sparkles.map((s, i) => (
                <span
                  key={i}
                  className="ak-op-card__sparkle"
                  style={{
                    left: s.left,
                    top: s.top,
                    animationDelay: s.delay,
                    animationDuration: s.duration,
                  }}
                />
              ))}
            </div>
          )}

          {highRarity && (
            <>
              <span className="ak-op-card__corner ak-op-card__corner--tl" aria-hidden />
              <span className="ak-op-card__corner ak-op-card__corner--tr" aria-hidden />
              <span className="ak-op-card__corner ak-op-card__corner--bl" aria-hidden />
              <span className="ak-op-card__corner ak-op-card__corner--br" aria-hidden />
            </>
          )}

          {isUp && <span className="ak-op-card__badge ak-op-card__badge--up">UP</span>}
          {operator.isCustom && (
            <span className="ak-op-card__badge ak-op-card__badge--custom">自定</span>
          )}
          {operator.isLimited && (
            <span className="ak-op-card__badge ak-op-card__badge--limited">限定</span>
          )}

          <div className="ak-op-card__meta">
            <div className={`ak-op-card__stars ${theme.starsClass}`} style={{ fontSize: dims.stars }}>
              {stars(operator.rarity)}
            </div>
            <div className="ak-op-card__name" style={{ fontSize: dims.name }}>
              {operator.name}
            </div>
            {showProfession && size !== 'sm' && (
              <div className="ak-op-card__sub">
                <Icon size={size === 'lg' ? 12 : 10} strokeWidth={2.2} />
                <span>{operator.profession}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
