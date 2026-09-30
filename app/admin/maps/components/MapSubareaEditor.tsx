// File: app/admin/maps/components/MapSubareaEditor.tsx
// Page/Component: MapSubareaEditor
// Purpose: 선택한 맵의 세부 지역을 추가·수정·정렬하고 참조 중인 항목 삭제를 안내한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useAdmin } from "@/lib/context/AdminContext";
import type { MapSubareaItem } from "@/lib/types/maps";

type DraftSubarea = { key: string; id?: string; name: string; nameEn: string };
type ApiResult<T> = { success: boolean; data?: T; message?: string };

// API 항목을 입력 중인 편집 행 형식으로 바꾼다.
function toDraft(item: MapSubareaItem): DraftSubarea {
  return { key: item.id, id: item.id, name: item.name, nameEn: item.nameEn };
}

// 맵 선택 상태에 따라 세부 지역을 불러오고 전체 편집 목록을 저장한다.
export default function MapSubareaEditor({ mapId, disabled = false }: { mapId: string | null; disabled?: boolean }) {
  const { showFeedback } = useAdmin();
  const [items, setItems] = useState<DraftSubarea[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("[]");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const snapshot = useMemo(() => JSON.stringify(items.map(({ id, name, nameEn }, index) => ({ id, name, nameEn, sortOrder: index + 1 }))), [items]);
  const hasChanges = snapshot !== savedSnapshot;

  // 선택한 맵을 바꿀 때 이전 목록을 비우고 해당 맵의 세부 지역을 다시 읽는다.
  useEffect(() => {
    if (!mapId) { setItems([]); setSavedSnapshot("[]"); setError(""); return; }
    const controller = new AbortController();
    setLoading(true); setError(""); setItems([]); setSavedSnapshot("[]");
    fetch(`/api/maps/${encodeURIComponent(mapId)}/subareas`, { signal: controller.signal }).then((response) => response.json() as Promise<ApiResult<MapSubareaItem[]>>).then((result) => {
      if (controller.signal.aborted) return;
      if (!result.success || !result.data) throw new Error(result.message || "세부 지역을 불러오지 못했습니다.");
      const next = result.data.map(toDraft);
      setItems(next);
      setSavedSnapshot(JSON.stringify(next.map(({ id, name, nameEn }, index) => ({ id, name, nameEn, sortOrder: index + 1 }))));
    }).catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "세부 지역을 불러오지 못했습니다."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [mapId]);

  // 입력 중인 지역을 API에 순서대로 저장하고 서버에서 확정된 ID로 행을 다시 만든다.
  const save = async () => {
    if (!mapId || disabled || saving || !hasChanges) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/maps/${encodeURIComponent(mapId)}/subareas`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subareas: items.map(({ id, name, nameEn }, index) => ({ ...(id ? { id } : {}), name, nameEn, sortOrder: index + 1 })) }) });
      const result = await response.json() as ApiResult<MapSubareaItem[]>;
      if (!result.success || !result.data) throw new Error(result.message || "세부 지역을 저장하지 못했습니다.");
      const next = result.data.map(toDraft);
      setItems(next); setSavedSnapshot(JSON.stringify(next.map(({ id, name, nameEn }, index) => ({ id, name, nameEn, sortOrder: index + 1 }))));
      showFeedback("맵 세부 지역을 저장했습니다.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "세부 지역을 저장하지 못했습니다."); }
    finally { setSaving(false); }
  };

  // 목록에서 선택한 항목을 위나 아래로 옮겨 표시 순서를 바꾼다.
  const move = (index: number, offset: -1 | 1) => setItems((current) => {
    const target = index + offset;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  return <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
    <div className="mb-2 flex items-center justify-between gap-2"><div><h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">세부 지역 <span className="ml-1 text-[10px] font-medium text-slate-400">{items.length}개</span></h3><p className="mt-0.5 text-[10px] text-slate-500">예: 리장타워의 야시장, 정원, 관제 센터</p></div><div className="flex gap-1.5"><button type="button" disabled={!mapId || loading || saving || disabled} onClick={() => setItems((current) => [...current, { key: crypto.randomUUID(), name: "", nameEn: "" }])} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Plus size={12} />추가</button><button type="button" disabled={!mapId || !hasChanges || loading || saving || disabled} onClick={() => void save()} className="inline-flex items-center gap-1 rounded-lg bg-[#f99e1a] px-2.5 py-1.5 text-[10px] font-bold text-slate-950 disabled:opacity-40">{saving ? "저장 중" : <><Save size={12} />저장</>}</button></div></div>
    {error && <p role="alert" className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
    {!mapId ? <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-center text-[11px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">먼저 맵을 저장하면 세부 지역을 추가할 수 있습니다.</p> : loading ? <p className="p-3 text-center text-[11px] text-slate-400">세부 지역을 불러오는 중...</p> : items.length ? <div className="space-y-1.5">{items.map((item, index) => <div key={item.key} className="grid grid-cols-[30px_minmax(0,1fr)_minmax(0,1fr)_58px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-950"><span className="text-center text-[10px] font-bold text-slate-400">{index + 1}</span><input aria-label="세부 지역 한글명" value={item.name} maxLength={100} disabled={saving || disabled} onChange={(event) => setItems((current) => current.map((row) => row.key === item.key ? { ...row, name: event.target.value } : row))} placeholder="한글명" className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900" /><input aria-label="세부 지역 영문명" value={item.nameEn} maxLength={100} disabled={saving || disabled} onChange={(event) => setItems((current) => current.map((row) => row.key === item.key ? { ...row, nameEn: event.target.value } : row))} placeholder="영문명 (선택)" className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900" /><div className="flex justify-end"><button type="button" aria-label="위로" title="위로" disabled={index === 0 || saving || disabled} onClick={() => move(index, -1)} className="rounded p-1 text-slate-400 hover:text-amber-600 disabled:opacity-30"><ArrowUp size={12} /></button><button type="button" aria-label="아래로" title="아래로" disabled={index === items.length - 1 || saving || disabled} onClick={() => move(index, 1)} className="rounded p-1 text-slate-400 hover:text-amber-600 disabled:opacity-30"><ArrowDown size={12} /></button><button type="button" aria-label={`${item.name || "새 지역"} 제거`} title="제거" disabled={saving || disabled} onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))} className="rounded p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button></div></div>)}</div> : <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-center text-[11px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">세부 지역이 없습니다. 이 맵에만 선택 항목이 필요하면 추가하세요.</p>}
  </section>;
}
