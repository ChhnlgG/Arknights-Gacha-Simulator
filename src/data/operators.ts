import type { Operator } from '../types';
import rosterExample from './operators.example.json';

/**
 * 干员名册。
 *
 * 完整名册与立绘属于第三方作品资产，不随仓库分发（见 README「素材说明」）。
 * 运行时若存在 ./operators.local.json 则用它，否则回退到 example 里的示例条目，
 * 应用仍可启动，卡面走内置矢量占位图。
 *
 * 本地补齐：把 operators.example.json 复制为 operators.local.json，按同一结构填充。
 */
const localFiles = import.meta.glob<{ default: Operator[] }>('./operators.local.json', {
  eager: true,
});

const localRoster: Operator[] = Object.values(localFiles)[0]?.default ?? [];

const DATA: Operator[] = localRoster.length ? localRoster : (rosterExample as Operator[]);

export const OPERATORS: Operator[] = DATA.map((op) => ({
  ...op,
  portrait: `./portraits/${op.id}.jpg`,
}));


export const OPERATOR_MAP: Record<string, Operator> = Object.fromEntries(
  OPERATORS.map((op) => [op.id, op]),
);