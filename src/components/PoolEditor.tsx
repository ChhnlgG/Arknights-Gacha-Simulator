import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  RotateCcw,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import type { Banner, Operator, Profession, Rarity } from '../types';
import { CUSTOM_BANNER_ID } from '../data/banners';
import { useGachaStore } from '../store/useGachaStore';
import { RARITY_ORDER, RARITY_THEME, stars } from '../theme/rarity';
import { compressAvatar } from '../lib/images';
import { OperatorCard } from './OperatorCard';
import { Button } from './ui';

const PROFESSIONS: Profession[] = ['先锋', '近卫', '重装', '狙击', '术师', '医疗', '辅助', '特种'];
const MAX_FIVE_UP = 4;

const RATE_PRESETS = [
  { label: '单UP 50%', rate: 50 },
  { label: '双UP 50%', rate: 50 },
  { label: '限定 70%', rate: 70 },
  { label: '清空', rate: 0 },
];

interface PoolEditorProps {
  open: boolean;
  banner: Banner;
  onClose: () => void;
}

export function PoolEditor({ open, banner, onClose }: PoolEditorProps) {
  const operators = useGachaStore((s) => s.operators);
  const effective = useGachaStore((s) => s.getEffectiveBanner(banner.id));
  const setBannerUp = useGachaStore((s) => s.setBannerUp);
  const setCustomPool = useGachaStore((s) => s.setCustomPool);
  const resetBannerUp = useGachaStore((s) => s.resetBannerUp);
  const addCustomOperator = useGachaStore((s) => s.addCustomOperator);
  const updateCustomOperator = useGachaStore((s) => s.updateCustomOperator);
  const deleteCustomOperator = useGachaStore((s) => s.deleteCustomOperator);

  const isCustomBanner = banner.id === CUSTOM_BANNER_ID;
  const maxSix = banner.type === 'single_up' ? 1 : 2;

  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [professionFilter, setProfessionFilter] = useState<'all' | Profession>('all');
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({ 4: true, 3: true });
  const [upIds, setUpIds] = useState<string[]>([]);
  const [poolIds, setPoolIds] = useState<string[]>([]);
  const [rate, setRate] = useState(banner.rateUpPercent ?? 50);
  const [hydrated, setHydrated] = useState(false);

  // 表单
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRarity, setFormRarity] = useState<Rarity>(6);
  const [formProfession, setFormProfession] = useState<Profession>('近卫');
  const [formLimited, setFormLimited] = useState(false);
  const [formAvatar, setFormAvatar] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* 打开时同步当前卡池配置 */
  useEffect(() => {
    if (!open) {
      setHydrated(false);
      return;
    }
    if (hydrated) return;
    const custom = effective.customUp;
    if (isCustomBanner) {
      setPoolIds(custom?.poolOperators ?? []);
      setUpIds(custom?.upOperators ?? []);
      setRate(custom?.rateUpPercent ?? banner.rateUpPercent ?? 50);
    } else if (custom?.upOperators.length) {
      setUpIds(custom.upOperators);
      setRate(custom.rateUpPercent);
    } else {
      setUpIds(effective.upOperators.filter((id) => operators[id]?.rarity >= 5));
      setRate(effective.rateUpPercent || 50);
    }
    setHydrated(true);
  }, [open, hydrated, effective, isCustomBanner, banner.rateUpPercent, operators]);

  const allOperators = useMemo(() => Object.values(operators), [operators]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return allOperators.filter((op) => {
      if (rarityFilter !== 'all' && op.rarity !== rarityFilter) return false;
      if (professionFilter !== 'all' && op.profession !== professionFilter) return false;
      if (keyword) {
        const hit =
          op.name.toLowerCase().includes(keyword) ||
          op.id.toLowerCase().includes(keyword) ||
          op.profession.includes(keyword);
        if (!hit) return false;
      }
      return true;
    });
  }, [allOperators, rarityFilter, professionFilter, search]);

  const grouped = useMemo(() => {
    const map: Record<Rarity, Operator[]> = { 3: [], 4: [], 5: [], 6: [] };
    for (const op of filtered) map[op.rarity].push(op);
    for (const r of RARITY_ORDER) {
      map[r].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    }
    return map;
  }, [filtered]);

  const upOperators = useMemo(
    () => upIds.map((id) => operators[id]).filter((o): o is Operator => Boolean(o)),
    [upIds, operators],
  );
  const upSixCount = upOperators.filter((o) => o.rarity === 6).length;
  const upFiveCount = upOperators.filter((o) => o.rarity === 5).length;

  const toggleUp = (id: string) => {
    const op = operators[id];
    if (!op) return;
    if (isCustomBanner) {
      if (!poolIds.includes(id)) {
        window.alert('请先右键将该角色标记为「可抽」，再左键标记为 UP');
        return;
      }
      setUpIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      return;
    }
    if (upIds.includes(id)) {
      setUpIds((prev) => prev.filter((x) => x !== id));
      return;
    }
    if (op.rarity !== 6 && op.rarity !== 5) {
      window.alert('仅允许选择六星和五星干员作为 UP 目标');
      return;
    }
    if (op.rarity === 6 && upSixCount >= maxSix) {
      window.alert(`最多只能选择 ${maxSix} 个六星干员作为 UP 目标`);
      return;
    }
    if (op.rarity === 5 && upFiveCount >= MAX_FIVE_UP) {
      window.alert(`五星 UP 最多只能选 ${MAX_FIVE_UP} 个`);
      return;
    }
    setUpIds((prev) => [...prev, id]);
  };

  const togglePool = (id: string) => {
    setPoolIds((prev) => {
      if (prev.includes(id)) {
        setUpIds((up) => up.filter((x) => x !== id));
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const apply = () => {
    if (isCustomBanner) {
      if (poolIds.length === 0) {
        window.alert('至少需要选择 1 个可抽角色（右键点击角色标记为可抽）');
        return;
      }
      const validUp = upIds.filter((id) => poolIds.includes(id));
      setCustomPool(banner.id, poolIds, validUp, rate);
      onClose();
      return;
    }
    if (upSixCount === 0) {
      window.alert('至少需要选择 1 个六星干员');
      return;
    }
    setBannerUp(banner.id, upIds, rate);
    onClose();
  };

  const restoreDefault = () => {
    resetBannerUp(banner.id);
    if (isCustomBanner) {
      setPoolIds([]);
      setUpIds([]);
      setRate(50);
    } else {
      setUpIds(effective.upOperators.filter((id) => operators[id]?.rarity >= 5));
      setRate(effective.rateUpPercent || 50);
    }
  };

  /* ---------- 自定义角色表单 ---------- */
  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormRarity(6);
    setFormProfession('近卫');
    setFormLimited(false);
    setFormAvatar(undefined);
  };

  const pickFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressAvatar(file);
      setFormAvatar(dataUrl);
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submitForm = () => {
    const name = formName.trim();
    if (!name) {
      window.alert('请输入角色名称');
      return;
    }
    const payload = {
      name,
      rarity: formRarity,
      profession: formProfession,
      portrait: formAvatar,
      isLimited: formLimited,
    };
    if (editingId) {
      updateCustomOperator(editingId, payload);
    } else {
      const created = addCustomOperator(payload);
      if (isCustomBanner) setPoolIds((prev) => [...prev, created.id]);
      setUpIds((prev) => [...prev, created.id]);
    }
    resetForm();
    setFormOpen(false);
  };

  const startEdit = (op: Operator) => {
    setEditingId(op.id);
    setFormName(op.name);
    setFormRarity(op.rarity);
    setFormProfession(op.profession);
    setFormLimited(Boolean(op.isLimited));
    setFormAvatar(op.portrait);
    setFormOpen(true);
  };

  const removeCustom = (op: Operator) => {
    if (!window.confirm(`确定删除自定义角色「${op.name}」吗？如果在 UP 列表中也会被移除。`)) return;
    deleteCustomOperator(op.id);
    setUpIds((prev) => prev.filter((x) => x !== op.id));
    setPoolIds((prev) => prev.filter((x) => x !== op.id));
    if (editingId === op.id) {
      resetForm();
      setFormOpen(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6 pointer-events-none">
        <div
          className="pointer-events-auto relative w-full max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden border border-ark-border shadow-2xl flex flex-col"
          style={{ backgroundColor: '#0a0a0c' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="relative px-4 md:px-6 py-4 border-b border-white/10" style={{ backgroundColor: '#1a0820' }}>
            <div className="absolute inset-0 opacity-40 portal-bg pointer-events-none" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-lg md:text-2xl font-black text-white truncate">
                  {isCustomBanner ? '自定义寻访池 · ' : '自定义 UP 干员 · '}
                  {banner.name}
                </h2>
                <p className="text-[11px] md:text-xs text-gray-400 mt-1 leading-relaxed">
                  {isCustomBanner
                    ? '【左键】标记 UP 角色（概率提升） · 【右键】标记可抽角色。抽卡时仅从可抽角色中抽取，UP 角色必须先标记为可抽。'
                    : `选择 1~${maxSix} 个六星干员 + 最多 ${MAX_FIVE_UP} 个五星干员作为概率提升目标；UP 合计概率默认 50% 可调整。至少包含 1 个六星。`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex-shrink-0"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/10">
            {/* 已选 UP 概览 */}
            <div className="px-4 md:px-6 py-4 bg-black/30 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-amber-300/90 uppercase tracking-widest mb-2">
                    {isCustomBanner
                      ? `可抽 ${poolIds.length} 名 · UP ${upOperators.length} 名`
                      : `当前已选 UP 干员 (${upOperators.length})`}
                  </div>
                  {upOperators.length === 0 ? (
                    <div className="text-sm text-gray-500 italic">
                      {isCustomBanner
                        ? '右键点击下方角色标记为「可抽」，左键标记为「UP」'
                        : '未选择任何干员，点下方列表勾选（可以同时选不同星级）'}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {upOperators.map((op) => (
                        <div key={op.id} className="relative">
                          <OperatorCard operator={op} size="sm" isUp showProfession={false} />
                          <button
                            onClick={() => toggleUp(op.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/80 border border-white/20 text-white/80 hover:text-white hover:bg-red-600 flex items-center justify-center"
                            aria-label={`移除 ${op.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 min-w-[180px]">
                  <label className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                    UP 合计概率 %
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))}
                      className="flex-1 accent-fuchsia-400"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rate}
                      onChange={(e) => setRate(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                      className="w-20 px-2 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white font-bold text-center tabular-nums"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {RATE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          if (preset.label === '清空') {
                            setUpIds([]);
                            setRate(0);
                          } else {
                            setRate(preset.rate);
                          }
                        }}
                        className="px-2 py-1 text-[11px] rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white font-medium whitespace-nowrap"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 自定义角色 */}
            <div className="px-4 md:px-6 py-3 bg-indigo-950/30">
              <button
                onClick={() => {
                  if (editingId) return;
                  setFormOpen((v) => !v);
                }}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                      editingId
                        ? 'bg-amber-500/20 border-amber-400/30'
                        : 'bg-fuchsia-500/20 border-fuchsia-400/30'
                    }`}
                  >
                    {editingId ? (
                      <Pencil className="w-4 h-4 text-amber-300" />
                    ) : (
                      <Plus className="w-4 h-4 text-fuchsia-300" />
                    )}
                  </span>
                  <div>
                    <div className={`text-sm font-bold ${editingId ? 'text-amber-200' : 'text-fuchsia-200'}`}>
                      {editingId
                        ? `✎ 编辑自定义角色：${operators[editingId]?.name ?? ''}`
                        : '➕ 新增自定义角色'}
                    </div>
                    <div
                      className={`text-[11px] ${editingId ? 'text-amber-300/60' : 'text-fuchsia-300/60'}`}
                    >
                      {editingId
                        ? '修改名称 / 稀有度 / 职业 / 立绘 / 限定标志'
                        : '创建你自己的干员，支持从本地上传图片'}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-fuchsia-300 transition-transform ${formOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {formOpen && (
                <div className="mt-4 p-4 rounded-xl border border-fuchsia-400/25 bg-black/40 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] tracking-widest text-gray-400 font-bold">角色名称 *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="例：我的原创干员"
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-400/60"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] tracking-widest text-gray-400 font-bold">职业</label>
                      <select
                        value={formProfession}
                        onChange={(e) => setFormProfession(e.target.value as Profession)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white focus:outline-none focus:border-fuchsia-400/60"
                      >
                        {PROFESSIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] tracking-widest text-gray-400 font-bold">稀有度</label>
                    <div className="flex flex-wrap gap-1.5">
                      {RARITY_ORDER.map((r) => {
                        const theme = RARITY_THEME[r];
                        const active = formRarity === r;
                        return (
                          <button
                            key={r}
                            onClick={() => setFormRarity(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              active
                                ? `${theme.textClass} border-current`
                                : 'text-gray-400 border-white/10 hover:text-gray-200 hover:border-white/20'
                            }`}
                            style={
                              active
                                ? {
                                    backgroundColor: theme.base,
                                    borderColor: theme.color,
                                    boxShadow: `0 0 0 1px ${theme.color}55`,
                                  }
                                : undefined
                            }
                          >
                            {stars(r)} {theme.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 本地上传立绘 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] tracking-widest text-gray-400 font-bold">
                      立绘 / 头像 · 从本地上传
                    </label>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-[72px] h-[90px] rounded-lg overflow-hidden border border-white/15 bg-black/50 shrink-0 flex items-center justify-center"
                        style={
                          formAvatar
                            ? undefined
                            : { backgroundImage: RARITY_THEME[formRarity].placeholder }
                        }
                      >
                        {formAvatar ? (
                          <img src={formAvatar} alt="预览" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-white/30" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/25 text-xs font-bold disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {uploading ? '处理中…' : '选择本地图片'}
                          </button>
                          {formAvatar && (
                            <button
                              onClick={() => setFormAvatar(undefined)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-xs font-bold"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> 清除
                            </button>
                          )}
                        </div>
                        <p className="text-[10.5px] text-gray-500 leading-relaxed">
                          支持 JPG / PNG / WebP，自动裁切为 4:5 竖版并压缩存储（约 30KB），随角色一起保存在本地。
                        </p>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => pickFile(e.target.files?.[0])}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formLimited}
                        onChange={(e) => setFormLimited(e.target.checked)}
                        className="w-4 h-4 accent-amber-400"
                      />
                      <span className="text-xs text-amber-200/90 font-medium">限定干员（显示「限定」角标）</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {editingId && (
                        <button
                          onClick={() => {
                            resetForm();
                            setFormOpen(false);
                          }}
                          className="px-3 py-2 text-sm rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white font-bold"
                        >
                          取消
                        </button>
                      )}
                      <Button
                        size="sm"
                        onClick={submitForm}
                        leftIcon={editingId ? <Pencil className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      >
                        {editingId ? '保存' : '添加'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 搜索 / 筛选 */}
            <div className="px-4 md:px-6 py-3 bg-white/5 sticky top-0 z-10 backdrop-blur">
              <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索干员名字：例 陈、银灰、能天使..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white placeholder:text-gray-500 outline-none focus:border-fuchsia-400/60 focus:ring-1 focus:ring-fuchsia-400/40 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setRarityFilter('all')}
                    className={`px-2.5 py-1.5 text-xs rounded-md border font-bold ${
                      rarityFilter === 'all'
                        ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    全部星级
                  </button>
                  {RARITY_ORDER.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRarityFilter((prev) => (prev === r ? 'all' : r))}
                      className={`px-2.5 py-1.5 text-xs rounded-md border font-bold ${
                        rarityFilter === r
                          ? `${RARITY_THEME[r].textClass} border-white/40 bg-white/10`
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {RARITY_THEME[r].label}
                    </button>
                  ))}
                </div>
                <select
                  value={professionFilter}
                  onChange={(e) => setProfessionFilter(e.target.value as 'all' | Profession)}
                  className="px-2.5 py-1.5 text-xs rounded-md border bg-black/50 border-white/15 text-white outline-none focus:border-fuchsia-400/50"
                >
                  <option value="all">全部职业</option>
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 干员列表（与主页 / 结果页使用同一套卡面） */}
            <div className="px-4 md:px-6 py-4 space-y-5">
              {RARITY_ORDER.map((rarity) => {
                const list = grouped[rarity];
                if (list.length === 0) return null;
                const isCollapsed = collapsed[rarity];
                return (
                  <div key={rarity}>
                    <div
                      className="flex items-center justify-between mb-2 cursor-pointer group"
                      onClick={() => setCollapsed((prev) => ({ ...prev, [rarity]: !prev[rarity] }))}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${RARITY_THEME[rarity].textClass}`}>
                          {stars(rarity)} {RARITY_THEME[rarity].label}
                        </span>
                        <span className="text-[11px] text-gray-500">({list.length} 人)</span>
                      </div>
                      <button className="text-gray-400 group-hover:text-white" aria-label="折叠">
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                    {!isCollapsed && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 md:gap-3">
                        {list.map((op) => {
                          const isUp = upIds.includes(op.id);
                          const isPoolable = isCustomBanner && poolIds.includes(op.id);
                          return (
                            <div key={op.id} className="relative group/card flex justify-center">
                              <OperatorCard
                                operator={op}
                                size="sm"
                                isUp={isUp}
                                selected={isUp}
                                poolable={isPoolable && !isUp}
                                showProfession={false}
                                onClick={() => toggleUp(op.id)}
                                onContextMenu={
                                  isCustomBanner
                                    ? (e) => {
                                        e.preventDefault();
                                        togglePool(op.id);
                                      }
                                    : undefined
                                }
                              />
                              {isPoolable && !isUp && (
                                <span className="absolute top-1 left-1 px-1 py-0.5 text-[8px] font-bold text-white rounded bg-emerald-600 z-30 pointer-events-none">
                                  可抽
                                </span>
                              )}
                              {op.isCustom && (
                                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-30">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(op);
                                    }}
                                    className="w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-400 text-black border-2 border-black/70 flex items-center justify-center shadow-lg"
                                    title="编辑自定义角色"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeCustom(op);
                                    }}
                                    className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white border-2 border-black/70 flex items-center justify-center shadow-lg"
                                    title="删除自定义角色"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[11px] md:text-xs text-gray-400 leading-relaxed">
              💡 抽卡规则：当抽到 <span className="text-gray-200">与 UP 干员同星级</span> 的干员时，会有{' '}
              <span className="text-fuchsia-300 font-bold">{rate}%</span> 概率从您选择的 UP 列表中随机（平均分配）
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={restoreDefault}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                恢复默认
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={apply}>
                ✔ 应用自定义UP
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
