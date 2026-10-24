import { RotateCcw, Plus, Diamond } from 'lucide-react';
import { useGachaStore } from '../store/useGachaStore';

export function OrundumChip() {
  const orundum = useGachaStore((s) => s.orundum);
  const addOrundum = useGachaStore((s) => s.addOrundum);

  return (
    <div className="chip-orundum px-4 py-2.5 flex items-center gap-3 min-w-[210px]">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="shrink-0">
        <defs>
          <linearGradient id="orundum-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f6c56b" />
            <stop offset="100%" stopColor="#cf8618" />
          </linearGradient>
        </defs>
        <polygon
          points="12,2.4 21,7.6 21,16.4 12,21.6 3,16.4 3,7.6"
          fill="none"
          stroke="url(#orundum-grad)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <polygon
          points="12,6.4 17.2,9.4 17.2,14.6 12,17.6 6.8,14.6 6.8,9.4"
          fill="url(#orundum-grad)"
          opacity="0.22"
        />
        <path d="M12 9v6M9 12h6" stroke="#f6c56b" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      </svg>
      <div className="flex flex-col leading-none min-w-0">
        <span className="text-[10px] tracking-[0.22em] text-ember-200/65 font-medium">合成玉</span>
        <span className="num-display text-[20px] font-bold text-ember-50 mt-0.5">
          {orundum.toLocaleString()}
        </span>
      </div>
      <button
        type="button"
        onClick={() => addOrundum(60_000)}
        aria-label="增加 60000 合成玉"
        className="ml-1 shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-r-tag text-ember-200/80 hover:text-ember-50 hover:bg-white/5 transition-colors"
      >
        <Plus strokeWidth={2} className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Header() {
  const resetAll = useGachaStore((s) => s.resetAll);

  return (
    <header className="relative z-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10 pt-8 pb-4 flex items-baseline gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Diamond className="w-4 h-4 text-ember-300 shrink-0" strokeWidth={1.5} />
          <p className="uppercase text-[11px] tracking-[0.32em] text-dust-500">Headhunt</p>
        </div>
        <h1 className="font-display text-[28px] md:text-[34px] leading-none tracking-dense text-dust-50">
          寻访模拟器
        </h1>
        <div className="ml-auto flex items-center gap-5">
          <button
            type="button"
            className="btn-link hidden md:inline-flex items-center gap-1.5 text-[12px]"
            onClick={() => {
              if (window.confirm('确定要重置所有数据吗？\n合成玉、保底进度和历史记录都将被清除。')) resetAll();
            }}
          >
            <RotateCcw strokeWidth={1.75} className="w-3.5 h-3.5" />
            重置数据
          </button>
          <OrundumChip />
        </div>
      </div>
    </header>
  );
}
