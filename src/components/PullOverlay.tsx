import { useEffect, useMemo, useState } from 'react';
import { SkipForward, Home, Layers, Wallet } from 'lucide-react';
import type { PullResult } from '../types';
import { OperatorCard } from './OperatorCard';

/* ------------------------- 光效 ------------------------- */

function Portal() {
  const rings = [
    { size: 340, border: '2px dashed rgba(232,166,58,0.25)', duration: '4s', cls: 'ak-portal-spin' },
    { size: 270, border: '1px solid rgba(232,166,58,0.18)', duration: '5s', cls: 'ak-portal-spin-rev' },
    { size: 200, border: '2px dotted rgba(232,166,58,0.15)', duration: '3s', cls: 'ak-portal-spin' },
    { size: 140, border: '1px solid rgba(232,166,58,0.22)', duration: '6s', cls: 'ak-portal-spin-rev' },
  ];
  const particles = Array.from({ length: 20 });
  const ticks = Array.from({ length: 24 });

  return (
    <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full ak-portal-pulse"
        style={{ backgroundColor: 'rgba(207,134,24,0.06)', filter: 'blur(50px)' }}
      />
      {rings.map((ring, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${ring.cls}`}
          style={{ width: ring.size, height: ring.size, border: ring.border, animationDuration: ring.duration }}
        />
      ))}
      <div
        className="absolute ak-portal-spin-slow"
        style={{ width: 288, height: 288, left: '50%', top: '50%', marginLeft: -144, marginTop: -144 }}
      >
        {ticks.map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-0"
            style={{
              width: 1,
              height: i % 3 === 0 ? 10 : 5,
              backgroundColor: i % 3 === 0 ? 'rgba(232,166,58,0.4)' : 'rgba(232,166,58,0.15)',
              transformOrigin: '0 144px',
              transform: `rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </div>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const radius = 170 + (i % 4) * 15;
        return (
          <div
            key={`p-${i}`}
            className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
            style={{
              marginLeft: -3,
              marginTop: -3,
              backgroundColor: '#e8a63a',
              boxShadow: '0 0 6px #e8a63a, 0 0 12px rgba(232,166,58,0.5)',
              ['--start-x' as string]: `${Math.cos(angle) * radius}px`,
              ['--start-y' as string]: `${Math.sin(angle) * radius}px`,
              animation: `ak-particle-converge 1.1s ease-in ${i * 0.04}s infinite`,
            }}
          />
        );
      })}
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center ak-portal-pulse"
        style={{
          backgroundColor: '#0a0a14',
          boxShadow:
            '0 0 30px 8px rgba(232,166,58,0.35), inset 0 0 24px rgba(232,166,58,0.15), inset 0 0 1px rgba(232,166,58,0.4)',
          border: '1px solid rgba(232,166,58,0.3)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full"
          style={{
            backgroundColor: '#e8a63a',
            boxShadow: '0 0 20px 6px rgba(232,166,58,0.6), 0 0 40px 10px rgba(232,166,58,0.3)',
          }}
        />
      </div>
    </div>
  );
}

/** 六星光效：彩虹环 + 光柱 + 放射光 + 星屑 */
function SixStarBurst() {
  const rings = ['#ff3b6b', '#ff8a3c', '#ffd23f', '#3bd67a', '#3cc8ff', '#a16bff'];
  const rays = Array.from({ length: 12 });
  const particles = Array.from({ length: 16 });

  return (
    <div className="pointer-events-none absolute inset-0 -m-10 z-0 overflow-visible">
      {rings.map((color, i) => (
        <div
          key={`rb-${i}`}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 50,
            height: 50,
            marginLeft: -25,
            marginTop: -25,
            border: `2px solid ${color}`,
            boxShadow: `0 0 12px ${color}aa`,
            opacity: 0,
            animation: `ak-rainbow-ring 1.4s ease-out ${i * 0.1}s forwards`,
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-0 bottom-0"
        style={{
          width: 3,
          marginLeft: -1.5,
          backgroundColor: '#ffd23f',
          boxShadow:
            '0 0 16px 3px rgba(255,210,63,0.8), 0 0 32px 8px rgba(255,180,60,0.5), 0 0 48px 12px rgba(255,160,40,0.3)',
          transformOrigin: 'center',
          animation: 'ak-light-pillar 1s ease-out forwards',
        }}
      />
      {rays.map((_, i) => (
        <div
          key={`ray-${i}`}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 90,
            height: 2,
            marginTop: -1,
            backgroundColor: '#ffd23f',
            boxShadow: '0 0 6px rgba(255,210,63,0.8)',
            transformOrigin: '0% 50%',
            ['--ray-angle' as string]: `${i * 30}deg`,
            animation: `ak-radial-ray 0.9s ease-out ${i * 0.025}s forwards`,
          }}
        />
      ))}
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const radius = 70 + (i % 4) * 15;
        return (
          <div
            key={`pt-${i}`}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{
              marginLeft: -4,
              marginTop: -4,
              backgroundColor: '#ffd23f',
              boxShadow: '0 0 6px #ffd23f, 0 0 12px rgba(255,210,63,0.5)',
              ['--end' as string]: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`,
              animation: `ak-particle-fly 1s ease-out ${i * 0.02}s forwards`,
            }}
          />
        );
      })}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 70,
          height: 70,
          marginLeft: -35,
          marginTop: -35,
          backgroundColor: 'rgba(255,210,63,0.5)',
          animation: 'ak-particle-burst 0.8s ease-out forwards',
        }}
      />
    </div>
  );
}

/** 五星光效：暖金光环 + 环绕光点 */
function FiveStarHalo() {
  const dots = Array.from({ length: 8 });
  return (
    <div className="pointer-events-none absolute inset-0 -m-6 z-0">
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          backgroundColor: 'rgba(232,166,58,0.12)',
          boxShadow: '0 0 24px 6px rgba(232,166,58,0.35), 0 0 48px 12px rgba(232,166,58,0.2)',
          animation: 'ak-halo-pulse 1.6s ease-in-out infinite',
        }}
      />
      {dots.map((_, i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        return (
          <div
            key={`hp-${i}`}
            className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full"
            style={{
              marginLeft: Math.cos(angle) * 45,
              marginTop: Math.sin(angle) * 45,
              backgroundColor: '#f6c56b',
              boxShadow: '0 0 4px #f6c56b, 0 0 8px rgba(246,197,107,0.5)',
              animation: `ak-halo-pulse 1.6s ease-in-out ${i * 0.12}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

/** 未翻开的卡背（带呼吸角标） */
function CardSlot({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (show) return <div className="relative">{children}</div>;
  return (
    <div
      className="w-[88px] h-[120px] md:w-[112px] md:h-[156px] rounded-xl flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#11111c', border: '1px solid rgba(232,166,58,0.08)' }}
    >
      {[
        'top-1 left-1 border-t border-l',
        'top-1 right-1 border-t border-r',
        'bottom-1 left-1 border-b border-l',
        'bottom-1 right-1 border-b border-r',
      ].map((cls, i) => (
        <div
          key={cls}
          className={`absolute w-3 h-3 ak-corner-blink ${cls}`}
          style={{ borderColor: 'rgba(232,166,58,0.3)', animationDelay: `${i * 0.4}s` }}
        />
      ))}
      <div
        className="w-8 h-8 rounded-full ak-spin-arc"
        style={{
          borderTop: '2px solid #e8a63a',
          borderRight: '2px solid transparent',
          borderBottom: '2px solid transparent',
          borderLeft: '2px solid transparent',
        }}
      />
    </div>
  );
}

interface PullOverlayProps {
  results: PullResult[];
  skipAnimation: boolean;
  sessionKey: number;
  orundum: number;
  onClose: () => void;
  onAgain: (count: 1 | 10) => void;
}

export function PullOverlay({
  results,
  skipAnimation,
  sessionKey,
  orundum,
  onClose,
  onAgain,
}: PullOverlayProps) {
  const [phase, setPhase] = useState<'portal' | 'reveal' | 'done'>('portal');
  const [revealed, setRevealed] = useState(0);
  const [shake, setShake] = useState(false);

  const count = results.length >= 10 ? 10 : 1;

  const sorted = useMemo(
    () =>
      [...results].sort((a, b) => {
        if (a.operator.rarity !== b.operator.rarity) return b.operator.rarity - a.operator.rarity;
        if (a.isUp !== b.isUp) return a.isUp ? -1 : 1;
        return a.id.localeCompare(b.id);
      }),
    [results],
  );

  /** 每次新一期寻访重置动画 */
  useEffect(() => {
    setPhase(skipAnimation ? 'done' : 'portal');
    setRevealed(skipAnimation ? results.length : 0);
    setShake(false);
  }, [sessionKey, skipAnimation, results.length]);

  useEffect(() => {
    if (phase !== 'portal' || skipAnimation) return undefined;
    const timer = window.setTimeout(() => setPhase('reveal'), 1100);
    return () => window.clearTimeout(timer);
  }, [phase, skipAnimation]);

  useEffect(() => {
    if (phase !== 'reveal' || skipAnimation) return undefined;
    if (revealed >= results.length) {
      const timer = window.setTimeout(() => setPhase('done'), 600);
      return () => window.clearTimeout(timer);
    }
    if (results[revealed]?.operator.rarity === 6) {
      setShake(true);
      const shakeTimer = window.setTimeout(() => setShake(false), 400);
      return () => window.clearTimeout(shakeTimer);
    }
    const delay = results.length === 1 ? 900 : 260;
    const timer = window.setTimeout(() => setRevealed((n) => n + 1), delay);
    return () => window.clearTimeout(timer);
  }, [phase, revealed, results, skipAnimation]);

  const finish = () => {
    if (phase === 'done') {
      onClose();
      return;
    }
    setRevealed(results.length);
    setPhase('done');
  };

  const canAgain = orundum >= count * 600;
  const showReveal = phase === 'reveal' || phase === 'done';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 backdrop-blur-md ${shake ? 'ak-screen-shake' : ''}`}
        style={{ backgroundColor: '#05050c' }}
      >
        <div
          className="absolute left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: 'rgba(207,134,24,0.04)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full"
          style={{ backgroundColor: 'rgba(207,134,24,0.03)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full"
          style={{ backgroundColor: 'rgba(90,143,124,0.03)', filter: 'blur(60px)' }}
        />
      </div>

      {phase === 'portal' && !skipAnimation && (
        <div className="relative z-10 flex flex-col items-center gap-10 animate-float-in">
          <Portal />
          <div className="flex flex-col items-center gap-2 -mt-4">
            <div className="font-display text-4xl md:text-5xl font-black tracking-[0.4em] ak-shine-text">
              寻访中
            </div>
            <p
              className="text-[10px] md:text-xs tracking-[0.5em] font-display uppercase"
              style={{ color: 'rgba(232,166,58,0.5)' }}
            >
              Headhunting
            </p>
          </div>
        </div>
      )}

      <button
        onClick={finish}
        className={`absolute top-4 right-4 z-30 px-3.5 py-2 rounded-xl backdrop-blur border text-sm transition-all inline-flex items-center gap-1.5 shadow-lg ${
          phase !== 'done'
            ? 'bg-amber-500/80 hover:bg-amber-400 border-amber-300/40 text-black font-black'
            : 'bg-black/60 hover:bg-black/80 text-gray-200 border-white/10 font-bold'
        }`}
      >
        {phase !== 'done' ? (
          <>
            <SkipForward className="w-4 h-4" />
            <span>跳过</span>
          </>
        ) : (
          <>
            <Home className="w-4 h-4" />
            <span>返回主页</span>
          </>
        )}
      </button>

      {showReveal && (
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 md:py-10 h-full overflow-y-auto flex flex-col">
          <div className="text-center mb-6 md:mb-8 animate-float-in">
            <h2 className="font-display text-3xl md:text-5xl font-black tracking-widest mb-2 ak-shine-text">
              寻访结果
            </h2>
            <p className="text-sm md:text-base text-gray-400 tracking-widest font-display">
              Headhunt Result · {results.length} 名干员
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <div
              className={`flex flex-wrap gap-3 md:gap-4 justify-center items-end ${
                results.length === 1 ? 'scale-125 md:scale-150' : ''
              }`}
            >
              {sorted.map((r, i) => (
                <CardSlot key={r.id} show={i < revealed}>
                  {r.operator.rarity === 6 && <SixStarBurst />}
                  {r.operator.rarity === 5 && <FiveStarHalo />}
                  <OperatorCard
                    operator={r.operator}
                    isUp={r.isUp}
                    size={results.length === 1 ? 'lg' : 'md'}
                    animate={!skipAnimation && i < revealed}
                  />
                </CardSlot>
              ))}
            </div>
          </div>

          {phase === 'done' && (
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center animate-float-in">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white transition-all inline-flex items-center gap-2 font-bold"
              >
                <Home className="w-4 h-4" />
                返回主页
              </button>
              <button
                onClick={() => onAgain(count as 1 | 10)}
                disabled={!canAgain}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black tracking-wider shadow-lg shadow-amber-500/30 transition-all inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {count === 10 ? <Layers className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                再次寻访 ×{count}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
