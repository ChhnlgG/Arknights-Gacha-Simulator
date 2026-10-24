import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Rarity } from '../types';

type Variant = 'primary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger:
    'bg-rose-900/40 hover:bg-rose-800/60 border border-rose-500/40 text-rose-200 hover:text-white transition-all',
  link: 'btn-link',
};

const SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
  xl: 'px-9 py-4 text-lg gap-3',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`${VARIANT[variant]} ${variant !== 'link' ? SIZE[size] : ''} inline-flex items-center justify-center font-body font-medium tracking-wide ${className}`}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

export function Panel({
  children,
  className = '',
  padding = 'md',
  metal = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  metal?: boolean;
}) {
  const pad = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-7' }[padding];
  return <div className={`${metal ? 'metal-border' : 'glass-panel'} ${pad} ${className}`}>{children}</div>;
}

export function SectionTitle({
  cap,
  title,
  icon,
  right,
}: {
  cap?: string;
  title: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end gap-3 mb-4 ml-1">
      <div className="flex-1 min-w-0">
        {cap && <p className="text-[11px] uppercase tracking-label text-dust-500 mb-1">{cap}</p>}
        <h3 className="font-display text-[17px] leading-none text-dust-50 flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      {right}
    </div>
  );
}

const ACCENT = {
  amber: { bg: '#241504', border: 'rgba(245,158,11,0.35)', text: 'text-amber-300' },
  gold: { bg: '#241504', border: 'rgba(245,158,11,0.35)', text: 'text-amber-300' },
  purple: { bg: '#200a33', border: 'rgba(168,85,247,0.3)', text: 'text-purple-300' },
  blue: { bg: '#061527', border: 'rgba(56,189,248,0.3)', text: 'text-sky-300' },
} as const;

export function StatCard({
  icon,
  label,
  value,
  suffix,
  accent = 'amber',
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  suffix?: string;
  accent?: keyof typeof ACCENT;
}) {
  const theme = ACCENT[accent];
  return (
    <div
      className={`relative rounded-xl border p-3 md:p-4 overflow-hidden backdrop-blur ${theme.text}`}
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5 blur-2xl" />
      <div className="relative flex items-center gap-2 mb-1.5">
        {icon && <span className="opacity-75">{icon}</span>}
        <span className="text-[10.5px] uppercase tracking-wider font-medium opacity-75">{label}</span>
      </div>
      <div className="relative flex items-baseline gap-1">
        <span className="font-display text-xl md:text-2xl font-black shine-text tabular-nums leading-none">
          {value}
        </span>
        {suffix && <span className="text-[11px] opacity-70">{suffix}</span>}
      </div>
    </div>
  );
}

export function KeyStat({
  label,
  value,
  color,
}: {
  label: string;
  value: ReactNode;
  color?: 'ember' | 'plum';
}) {
  const cls = color === 'ember' ? 'text-ember-100' : color === 'plum' ? 'text-plum-300' : 'text-dust-100';
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-label text-dust-500 mb-1.5">{label}</div>
      <div className={`num-display font-display font-black text-[20px] leading-none ${cls}`}>{value}</div>
    </div>
  );
}

const PROGRESS = {
  gold: { track: '#1c1208', fill: '#f59e0b', glow: '0 0 12px rgba(245,158,11,0.5)', text: 'text-amber-300' },
  purple: { track: '#1a0a24', fill: '#a855f7', glow: '0 0 12px rgba(168,85,247,0.5)', text: 'text-purple-300' },
  blue: { track: '#06111d', fill: '#38bdf8', glow: '0 0 10px rgba(56,189,248,0.5)', text: 'text-sky-300' },
} as const;

export function Progress({
  value,
  max,
  label,
  sublabel,
  variant = 'gold',
}: {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  variant?: keyof typeof PROGRESS;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const theme = PROGRESS[variant];
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-sm font-medium ${theme.text}`}>{label}</span>
        <span className="text-xs text-gray-400 tabular-nums">
          {value} / {max}
        </span>
      </div>
      <div
        className="relative h-2.5 rounded-full overflow-hidden border"
        style={{ backgroundColor: theme.track, borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: theme.fill, boxShadow: theme.glow }}
        />
      </div>
      {sublabel && <p className="mt-1.5 text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  rarity,
  children,
}: {
  active: boolean;
  onClick: () => void;
  rarity?: Rarity;
  children: ReactNode;
}) {
  const activeCls = rarity
    ? rarity === 6
      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
      : rarity === 5
        ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
        : rarity === 4
          ? 'bg-sky-500/20 border-sky-400/30 text-sky-200'
          : 'bg-slate-500/20 border-slate-400/30 text-slate-200'
    : 'bg-ember-400/20 border-ember-400/40 text-ember-200';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active ? activeCls : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  );
}
