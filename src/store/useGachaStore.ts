import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Banner,
  BannerType,
  CustomUp,
  Operator,
  PityState,
  PullResult,
  PullSession,
} from '../types';
import { BANNERS, CUSTOM_BANNER_ID } from '../data/banners';
import { OPERATOR_MAP, OPERATORS } from '../data/operators';
import {
  COST_SINGLE,
  INITIAL_ORUNDUM,
  emptyPity,
  makePityTrackers,
  makeId,
  runPull,
} from '../lib/gacha';

const STORAGE_KEY = 'ark-gacha-store';
const STORAGE_VERSION = 4;
const HISTORY_LIMIT = 300;

export interface CustomOperatorInput {
  name: string;
  rarity: Operator['rarity'];
  profession: Operator['profession'];
  portrait?: string;
  isLimited?: boolean;
}

interface GachaState {
  orundum: number;
  currentBannerId: string;
  pityTracker: Record<string, PityState>;
  history: PullSession[];
  lastResults: PullResult[] | null;
  lastBannerId: string | null;
  operators: Record<string, Operator>;
  banners: Banner[];

  setCurrentBanner: (id: string) => void;
  addOrundum: (amount: number) => void;
  getEffectiveBanner: (id: string) => Banner;
  performPull: (bannerId: string, count: 1 | 10) => PullResult[] | null;
  clearHistory: () => void;
  resetAll: () => void;

  setBannerUp: (bannerId: string, upOperators: string[], rateUpPercent: number) => void;
  setCustomPool: (
    bannerId: string,
    poolOperators: string[],
    upOperators: string[],
    rateUpPercent: number,
  ) => void;
  resetBannerUp: (bannerId: string) => void;

  addCustomOperator: (input: CustomOperatorInput) => Operator;
  updateCustomOperator: (id: string, patch: Partial<CustomOperatorInput>) => void;
  deleteCustomOperator: (id: string) => void;
}

const initialPity = makePityTrackers(BANNERS);

export const useGachaStore = create<GachaState>()(
  persist(
    (set, get) => ({
      orundum: INITIAL_ORUNDUM,
      currentBannerId: BANNERS[0].id,
      pityTracker: initialPity,
      history: [],
      lastResults: null,
      lastBannerId: null,
      operators: OPERATOR_MAP,
      banners: BANNERS,

      setCurrentBanner: (id) => set({ currentBannerId: id }),

      addOrundum: (amount) => set((s) => ({ orundum: Math.max(0, s.orundum + amount) })),

      /** 合并卡池默认 UP 与用户自定义配置 */
      getEffectiveBanner: (id) => {
        const banner = get().banners.find((b) => b.id === id) ?? BANNERS[0];
        const custom = banner.customUp;
        if (!custom) return banner;
        const hasPool = Boolean(custom.poolOperators && custom.poolOperators.length > 0);
        const hasUp = custom.upOperators.length > 0;
        if (!hasPool && !hasUp) return banner;
        return {
          ...banner,
          upOperators: hasUp ? custom.upOperators : [],
          rateUpPercent: custom.rateUpPercent,
        };
      },

      performPull: (bannerId, count) => {
        const state = get();
        const banner = state.getEffectiveBanner(bannerId);
        const cost = count * COST_SINGLE;
        if (state.orundum < cost) return null;

        const pity = state.pityTracker[bannerId] ?? emptyPity();
        const outcome = runPull(banner, state.operators, pity, count);
        const session: PullSession = {
          id: makeId(),
          bannerId,
          timestamp: Date.now(),
          pullCount: count,
          results: outcome.results,
          totalSpent: outcome.spent,
          pityCountBefore: outcome.pityBefore,
          pityCountAfter: outcome.pityAfter,
        };

        set({
          orundum: state.orundum - cost,
          pityTracker: { ...state.pityTracker, [bannerId]: outcome.nextPity },
          history: [session, ...state.history].slice(0, HISTORY_LIMIT),
          lastResults: outcome.results,
          lastBannerId: bannerId,
        });

        return outcome.results;
      },

      clearHistory: () =>
        set({
          history: [],
          pityTracker: makePityTrackers(BANNERS),
          lastResults: null,
          lastBannerId: null,
        }),

      resetAll: () =>
        set({
          orundum: INITIAL_ORUNDUM,
          currentBannerId: BANNERS[0].id,
          pityTracker: makePityTrackers(BANNERS),
          history: [],
          lastResults: null,
          lastBannerId: null,
          operators: { ...OPERATOR_MAP },
          banners: BANNERS.map((b) => ({ ...b })),
        }),

      setBannerUp: (bannerId, upOperators, rateUpPercent) =>
        set((s) => ({
          banners: s.banners.map((b) =>
            b.id === bannerId
              ? {
                  ...b,
                  customUp:
                    upOperators.length > 0
                      ? { upOperators, rateUpPercent: clampPercent(rateUpPercent) }
                      : null,
                }
              : b,
          ),
        })),

      setCustomPool: (bannerId, poolOperators, upOperators, rateUpPercent) =>
        set((s) => ({
          banners: s.banners.map((b) =>
            b.id === bannerId
              ? {
                  ...b,
                  customUp: {
                    poolOperators,
                    upOperators,
                    rateUpPercent: clampPercent(rateUpPercent),
                    updatedAt: Date.now(),
                  },
                }
              : b,
          ),
        })),

      resetBannerUp: (bannerId) =>
        set((s) => ({
          banners: s.banners.map((b) => (b.id === bannerId ? { ...b, customUp: null } : b)),
        })),

      addCustomOperator: (input) => {
        const id = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const operator: Operator = {
          ...input,
          id,
          isCustom: true,
          portrait: input.portrait,
          description: `${input.name} · 自定义干员`,
        };
        set((s) => ({ operators: { ...s.operators, [id]: operator } }));
        return operator;
      },

      updateCustomOperator: (id, patch) =>
        set((s) => {
          const current = s.operators[id];
          if (!current?.isCustom) return s;
          return {
            operators: { ...s.operators, [id]: { ...current, ...patch } },
            history: s.history.map((session) => ({
              ...session,
              results: session.results.map((r) =>
                r.operator.id === id ? { ...r, operator: { ...r.operator, ...patch } } : r,
              ),
            })),
            lastResults:
              s.lastResults?.map((r) =>
                r.operator.id === id ? { ...r, operator: { ...r.operator, ...patch } } : r,
              ) ?? null,
          };
        }),

      deleteCustomOperator: (id) =>
        set((s) => {
          if (!s.operators[id]?.isCustom) return s;
          const operators = { ...s.operators };
          delete operators[id];
          const banners = s.banners.map((b) => {
            const custom = b.customUp;
            if (!custom) return b;
            const inUp = custom.upOperators.includes(id);
            const inPool = custom.poolOperators?.includes(id) ?? false;
            if (!inUp && !inPool) return b;
            return {
              ...b,
              customUp: {
                ...custom,
                upOperators: custom.upOperators.filter((x) => x !== id),
                poolOperators: custom.poolOperators?.filter((x) => x !== id),
              },
            };
          });
          return { operators, banners };
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        orundum: s.orundum,
        currentBannerId: s.currentBannerId,
        pityTracker: s.pityTracker,
        history: s.history,
        lastResults: s.lastResults,
        lastBannerId: s.lastBannerId,
        banners: s.banners.map(({ id, customUp }) => ({ id, customUp: customUp ?? null })),
        customOperators: Object.values(s.operators).filter((op) => op.isCustom),
      }),
      /** 旧版本存档直接交给 merge 做一次“归一化”，避免旧字段丢失 */
      migrate: (persisted) => persisted as GachaState,
      merge: (persisted, current) => mergePersisted(persisted, current),
    },
  ),
);

const clampPercent = (v: number) => Math.max(0, Math.min(100, Math.round(v) || 0));

/** 旧版本用 avatar 字段存头像，这里做一次兼容 */
const legacyAvatar = (op: Operator): string | undefined =>
  op.portrait ?? (op as unknown as { avatar?: string }).avatar;

const normalizeHistory = (history: PullSession[]): PullSession[] =>
  history.map((session) => ({
    ...session,
    results: session.results.map((r) => ({
      ...r,
      operator: { ...r.operator, portrait: legacyAvatar(r.operator) },
    })),
  }));

/** 合并：内置干员 / 卡池永远使用代码内数据，只保留用户自定义部分 */
function mergePersisted<T extends Partial<GachaState>>(persisted: unknown, current: T): T {
  const raw = (persisted ?? {}) as Record<string, unknown>;
  const customList =
    (raw.customOperators as Operator[] | undefined) ??
    Object.values((raw.operators as Record<string, Operator>) ?? {}).filter((op) => op?.isCustom);

  const operators: Record<string, Operator> = { ...OPERATOR_MAP };
  for (const op of customList ?? []) {
    if (op?.isCustom) operators[op.id] = { ...op, portrait: op.portrait ?? legacyAvatar(op) };
  }

  const savedCustom = new Map(
    ((raw.banners as { id: string; customUp?: CustomUp | null }[] | undefined) ?? []).map((b) => [
      b.id,
      b.customUp ?? null,
    ]),
  );

  const banners: Banner[] = BANNERS.map((b) => ({
    ...b,
    customUp: savedCustom.get(b.id) ?? null,
  }));

  const pity = { ...makePityTrackers(BANNERS), ...((raw.pityTracker as Record<string, PityState>) ?? {}) };

  return {
    ...current,
    orundum: typeof raw.orundum === 'number' && !Number.isNaN(raw.orundum) ? raw.orundum : INITIAL_ORUNDUM,
    currentBannerId: BANNERS.some((b) => b.id === raw.currentBannerId)
      ? (raw.currentBannerId as string)
      : BANNERS[0].id,
    pityTracker: pity,
    history: Array.isArray(raw.history)
      ? normalizeHistory((raw.history as PullSession[]).slice(0, HISTORY_LIMIT))
      : [],
    lastResults: Array.isArray(raw.lastResults)
      ? normalizeHistory([{ results: raw.lastResults as PullResult[] } as PullSession])[0].results
      : null,
    lastBannerId: typeof raw.lastBannerId === 'string' ? raw.lastBannerId : null,
    operators,
    banners,
  };
}

/** 常用派生选择器 */
export const selectBanner = (id: string) => (s: GachaState) =>
  s.banners.find((b) => b.id === id) ?? BANNERS[0];

export const selectIsCustomBanner = (id: string) => id === CUSTOM_BANNER_ID;

export const ALL_OPERATORS = OPERATORS;

export type { BannerType };
