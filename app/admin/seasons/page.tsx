// File: app/admin/seasons/page.tsx
// Page/Component: 대회 등록
// Purpose: 대회 목록과 선택 대회의 일정·상금을 조회하고 등록·수정 모달을 제공한다.
"use client";

import { useState, type MouseEvent } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import type { SeasonItem } from "@/lib/types/seasons";
import AdminCard from "@/components/admin/AdminCard";
import AdminFilterPanel from "@/components/admin/AdminFilterPanel";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminModal from "@/components/admin/AdminModal";
import AdminFormActions from "@/components/admin/AdminFormActions";
import { removeSeason, saveSeason } from "@/lib/seasons/seasonClient";
import { validateSeasonPayload } from "@/lib/seasons/seasonValidator";
import { formatMoneyInput } from "@/lib/seasons/money";
import { SEASON_STATUSES } from "@/lib/seasons/seasonStatus";
import { EMPTY_SEASON_FILTERS, matchesSeasonFilters, type SeasonFilters } from "@/lib/seasons/seasonFilters";

type SeasonForm = {
  name: string;
  status: SeasonItem["status"];
  startDate: string;
  endDate: string;
  schedules: { id?: string; name: string; startDate: string; endDate: string }[];
  prizeAmount: string;
  rankPrizes: { rank: string; amount: string }[];
  remarks: string;
};

const inputClass = "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const headerClass = "px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300";
const cellClass = "px-3 py-2 text-xs text-slate-700 dark:text-slate-200";

// 신규 등록의 모든 필드를 독립된 빈 상태로 만든다.
function emptyForm(): SeasonForm {
  return { name: "", status: "개최 예정", startDate: "", endDate: "", schedules: [], prizeAmount: "", rankPrizes: [], remarks: "" };
}

// 선택한 대회의 저장값을 날짜 전용 편집 행으로 옮긴다.
function formFromSeason(item: SeasonItem): SeasonForm {
  return {
    name: item.name, status: item.status, startDate: item.startDate, endDate: item.endDate,
    schedules: item.schedules.map((schedule) => ({ id: schedule.id, name: schedule.name, startDate: schedule.startDate ?? "", endDate: schedule.endDate ?? "" })),
    prizeAmount: item.prizeAmount ?? "", rankPrizes: item.rankPrizes.map((prize) => ({ rank: String(prize.rank), amount: prize.amount })), remarks: item.remarks,
  };
}

// 날짜 입력 영역을 클릭하면 브라우저가 지원하는 달력 선택기를 연다.
function openDatePicker(event: MouseEvent<HTMLInputElement>) {
  try { event.currentTarget.showPicker?.(); }
  catch { /* 선택기 직접 호출을 지원하지 않는 브라우저는 기본 입력 동작을 사용한다. */ }
}

// 등록 대회와 선택 대회의 세부 자료를 세 영역으로 표시하고 편집 모달을 관리한다.
export default function AdminSeasonsPage() {
  const { seasons, setSeasons, showFeedback } = useAdmin();
  const [filters, setFilters] = useState<SeasonFilters>(EMPTY_SEASON_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [form, setForm] = useState<SeasonForm>(emptyForm);
  const filtered = seasons.filter((item) => matchesSeasonFilters(item, filters));
  const selected = filtered.find((item) => item.id === selectedId) ?? null;
  const isFilterActive = Object.entries(filters).some(([key, value]) => key === "status" ? value !== "ALL" : Boolean(value));

  // 그리드 컬럼별 입력값을 유지하면서 지정한 검색 조건 하나만 갱신한다.
  const setFilter = (key: keyof SeasonFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  // 신규 등록 모달을 빈 폼으로 연다.
  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setModalOpen(true); };

  // 선택된 대회의 현재 값을 편집 모달에 채운다.
  const openEdit = () => {
    if (!selected) return;
    setEditingId(selected.id);
    setForm(formFromSeason(selected));
    setModalOpen(true);
  };

  // 일정과 상금 행을 포함한 전체 폼을 검증해 한 번에 저장한다.
  const handleSave = async () => {
    const payload = {
      ...form,
      schedules: form.schedules.map((schedule) => ({ ...schedule, startDate: schedule.startDate || null, endDate: schedule.endDate || null })),
      rankPrizes: form.rankPrizes.map((prize) => ({ rank: Number(prize.rank), amount: prize.amount })),
    };
    const error = validateSeasonPayload(payload);
    if (error) { showFeedback(error); return; }
    setSaving(true);
    try {
      const result = await saveSeason(payload, editingId || undefined);
      if (!result.success || !result.data) { showFeedback(result.message || "대회 저장에 실패했습니다."); return; }
      const saved = result.data;
      setSeasons((current) => editingId ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setSelectedId(saved.id);
      setModalOpen(false);
      showFeedback(`대회 [${saved.name}] 정보가 저장되었습니다.`);
    } catch { showFeedback("대회 저장에 실패했습니다."); }
    finally { setSaving(false); }
  };

  // 목록과 수정 모달의 삭제 요청 모두 확인을 거쳐 서버에 전달한다.
  const handleDelete = async (target: SeasonItem | null) => {
    if (!target || isSaving || !window.confirm(`[${target.name}] 대회를 삭제하시겠습니까? 세부 일정, 등수별 상금, 참가 팀 연결, 경기·세트·기록도 함께 삭제됩니다.`)) return;
    setSaving(true);
    try {
      const result = await removeSeason(target.id);
      if (!result.success) { showFeedback(result.message || "대회 삭제에 실패했습니다."); return; }
      setSeasons((current) => current.filter((item) => item.id !== target.id));
      if (selectedId === target.id) setSelectedId(null);
      if (editingId === target.id) { setEditingId(null); setModalOpen(false); }
      showFeedback("대회 정보가 삭제되었습니다.");
    } catch { showFeedback("대회 삭제에 실패했습니다."); }
    finally { setSaving(false); }
  };

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <AdminCard title="등록된 대회 조회" countBadge={`총 ${filtered.length}건`} className="min-h-[280px] flex-[1.1]" actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setFilters({ ...EMPTY_SEASON_FILTERS })} disabled={!isFilterActive} title="검색 조건 초기화" className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">조건 초기화</button>
          <button type="button" onClick={openEdit} disabled={!selected || isSaving} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200">선택 대회 수정</button>
          <button type="button" onClick={() => void handleDelete(selected)} disabled={!selected || isSaving} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 disabled:opacity-40 dark:border-rose-800 dark:text-rose-400">선택 대회 삭제</button>
          <button type="button" onClick={openCreate} className="rounded-lg bg-[#f99e1a] px-3 py-1.5 text-xs font-bold text-slate-950">대회 등록</button>
        </div>
      }>
        <AdminFilterPanel>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-5">
            <AdminSearchInput label="대회명" placeholder="대회명 검색..." value={filters.name} onChange={(value) => setFilter("name", value)} />
            <div><label htmlFor="season-status-filter" className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">상태</label><select id="season-status-filter" value={filters.status} onChange={(event) => setFilter("status", event.target.value)} className={inputClass}><option value="ALL">전체</option>{SEASON_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
            <div><label htmlFor="season-start-filter" className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">진행 시작일</label><input id="season-start-filter" type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} onClick={openDatePicker} className={inputClass} /></div>
            <div><label htmlFor="season-end-filter" className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">진행 종료일</label><input id="season-end-filter" type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} onClick={openDatePicker} className={inputClass} /></div>
            <AdminSearchInput label="총 상금" placeholder="금액 검색..." value={filters.prize} onChange={(value) => setFilter("prize", value)} />
            <AdminSearchInput label="세부 일정" placeholder="건수 검색..." value={filters.scheduleCount} onChange={(value) => setFilter("scheduleCount", value)} />
            <AdminSearchInput label="등수별 상금" placeholder="건수 검색..." value={filters.rankPrizeCount} onChange={(value) => setFilter("rankPrizeCount", value)} />
            <AdminSearchInput label="대회 소개 및 룰 메모" placeholder="메모 검색..." value={filters.remarks} onChange={(value) => setFilter("remarks", value)} containerClassName="sm:col-span-2 lg:col-span-3" />
          </div>
        </AdminFilterPanel>
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[1150px] text-left">
            <thead className="sticky top-0 bg-slate-100 dark:bg-[#151c2e]"><tr><th className={headerClass}>대회명</th><th className={headerClass}>상태</th><th className={headerClass}>진행 시작일</th><th className={headerClass}>진행 종료일</th><th className={headerClass}>총 상금</th><th className={headerClass}>세부 일정</th><th className={headerClass}>등수별 상금</th><th className={headerClass}>대회 소개 및 룰 메모</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? <tr><td colSpan={8} className={`${cellClass} py-12 text-center`}>등록된 대회가 없습니다. 대회 등록 버튼을 눌러주세요.</td></tr> : filtered.map((item) => (
                <tr key={item.id} onClick={() => setSelectedId(item.id)} onDoubleClick={() => { setEditingId(item.id); setForm(formFromSeason(item)); setModalOpen(true); }} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedId === item.id ? "bg-amber-500/10 dark:bg-amber-500/15" : ""}`}>
                  <td className={`${cellClass} min-w-36 font-semibold`}>{item.name}</td><td className={cellClass}>{item.status}</td><td className={cellClass}>{item.startDate || "미정"}</td><td className={cellClass}>{item.endDate || "미정"}</td><td className={cellClass}>{item.prize}</td><td className={cellClass}>{item.schedules.length}건</td><td className={cellClass}>{item.rankPrizes.length}건</td><td className={`${cellClass} max-w-56 truncate`} title={item.remarks}>{item.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <div className="grid min-h-[250px] flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminCard title="세부 일정" countBadge={selected ? `${selected.schedules.length}건` : undefined} className="min-h-[250px]">
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full"><thead className="sticky top-0 bg-slate-100 dark:bg-[#151c2e]"><tr><th className={headerClass}>일정 이름</th><th className={headerClass}>시작일</th><th className={headerClass}>종료일</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!selected || selected.schedules.length === 0 ? <tr><td colSpan={3} className={`${cellClass} py-10 text-center`}>{selected ? "등록된 세부 일정이 없습니다." : "상단에서 대회를 선택해주세요."}</td></tr> : selected.schedules.map((schedule, index) => <tr key={schedule.id ?? index}><td className={cellClass}>{schedule.name}</td><td className={cellClass}>{schedule.startDate || "미정"}</td><td className={cellClass}>{schedule.endDate || "미정"}</td></tr>)}
              </tbody>
            </table>
          </div>
        </AdminCard>
        <AdminCard title="등수별 상금" countBadge={selected ? `${selected.rankPrizes.length}건` : undefined} className="min-h-[250px]">
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full"><thead className="sticky top-0 bg-slate-100 dark:bg-[#151c2e]"><tr><th className={headerClass}>등수</th><th className={headerClass}>상금</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!selected || selected.rankPrizes.length === 0 ? <tr><td colSpan={2} className={`${cellClass} py-10 text-center`}>{selected ? "등록된 등수별 상금이 없습니다." : "상단에서 대회를 선택해주세요."}</td></tr> : selected.rankPrizes.map((prize) => <tr key={prize.rank}><td className={cellClass}>{prize.rank}위</td><td className={cellClass}>{formatMoneyInput(prize.amount)}원</td></tr>)}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>

      <AdminModal isOpen={isModalOpen} onClose={() => { if (!isSaving) setModalOpen(false); }} title={editingId ? "대회 정보 수정" : "대회 등록"} description="세부 일정과 등수별 상금은 아래 표에서 행을 추가하고 바로 수정할 수 있습니다." maxWidth="4xl" footer={
        <div className="flex justify-end gap-2">
          <button type="button" disabled={isSaving} onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700">취소</button>
          <AdminFormActions onSave={handleSave} onDelete={editingId ? () => void handleDelete(seasons.find((item) => item.id === editingId) ?? null) : undefined} onNew={openCreate} isEditing={!!editingId} saveDisabled={isSaving} deleteDisabled={isSaving} newLabel="+ 새 대회" />
        </div>
      }>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">대회명 *<input className={`${inputClass} mt-1.5`} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">진행 상태<select className={`${inputClass} mt-1.5`} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SeasonItem["status"] }))}>{SEASON_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">진행 시작일 *<input type="date" className={`${inputClass} mt-1.5 cursor-pointer`} value={form.startDate} max={form.endDate || undefined} onClick={openDatePicker} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">진행 종료일 *<input type="date" className={`${inputClass} mt-1.5 cursor-pointer`} value={form.endDate} min={form.startDate || undefined} onClick={openDatePicker} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">총 상금 규모 *<input aria-label="총 상금 규모" inputMode="numeric" className={`${inputClass} mt-1.5`} value={formatMoneyInput(form.prizeAmount)} onChange={(event) => setForm((current) => ({ ...current, prizeAmount: event.target.value.replaceAll(",", "") }))} /></label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">대회 소개 및 룰 메모<textarea rows={2} className={`${inputClass} mt-1.5`} value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} /></label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold">세부 일정</h3><button type="button" className="text-xs font-semibold text-amber-600" onClick={() => setForm((current) => ({ ...current, schedules: [...current.schedules, { name: "", startDate: "", endDate: "" }] }))}>+ 일정 추가</button></div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700"><table className="w-full min-w-[570px]"><thead className="bg-slate-100 dark:bg-slate-800"><tr><th className={headerClass}>일정 이름</th><th className={headerClass}>시작일</th><th className={headerClass}>종료일</th><th className={headerClass}>관리</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {form.schedules.length === 0 ? <tr><td colSpan={4} className={`${cellClass} py-5 text-center`}>일정 추가를 누르면 편집 행이 생깁니다.</td></tr> : form.schedules.map((schedule, index) => <tr key={schedule.id ?? `new-${index}`} className="bg-amber-500/5">
                <td className="p-1.5"><input aria-label={`${index + 1}번째 일정 이름`} className={inputClass} placeholder="예: 팀원 선정" value={schedule.name} onChange={(event) => setForm((current) => ({ ...current, schedules: current.schedules.map((item, i) => i === index ? { ...item, name: event.target.value } : item) }))} /></td>
                <td className="p-1.5"><input aria-label={`${index + 1}번째 일정 시작일`} type="date" className={`${inputClass} cursor-pointer`} value={schedule.startDate} min={form.startDate || undefined} max={schedule.endDate || form.endDate || undefined} onClick={openDatePicker} onChange={(event) => setForm((current) => ({ ...current, schedules: current.schedules.map((item, i) => i === index ? { ...item, startDate: event.target.value } : item) }))} /></td>
                <td className="p-1.5"><input aria-label={`${index + 1}번째 일정 종료일`} type="date" className={`${inputClass} cursor-pointer`} value={schedule.endDate} min={schedule.startDate || form.startDate || undefined} max={form.endDate || undefined} onClick={openDatePicker} onChange={(event) => setForm((current) => ({ ...current, schedules: current.schedules.map((item, i) => i === index ? { ...item, endDate: event.target.value } : item) }))} /></td>
                <td className="p-1.5 text-center"><button type="button" aria-label={`${index + 1}번째 일정 삭제`} className="text-xs text-rose-600" onClick={() => setForm((current) => ({ ...current, schedules: current.schedules.filter((_, i) => i !== index) }))}>삭제</button></td>
              </tr>)}
            </tbody></table></div>
            <p className="mt-1 text-[11px] text-slate-500">날짜는 선택 사항입니다. 종료일을 입력할 때는 시작일도 입력해주세요.</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold">등수별 상금</h3><button type="button" className="text-xs font-semibold text-amber-600" onClick={() => setForm((current) => ({ ...current, rankPrizes: [...current.rankPrizes, { rank: "", amount: "" }] }))}>+ 등수 추가</button></div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700"><table className="w-full"><thead className="bg-slate-100 dark:bg-slate-800"><tr><th className={headerClass}>등수</th><th className={headerClass}>상금 (원)</th><th className={headerClass}>관리</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {form.rankPrizes.length === 0 ? <tr><td colSpan={3} className={`${cellClass} py-5 text-center`}>등수 추가를 누르면 편집 행이 생깁니다.</td></tr> : form.rankPrizes.map((prize, index) => <tr key={index} className="bg-amber-500/5">
                <td className="w-28 p-1.5"><input aria-label={`${index + 1}번째 상금 등수`} type="number" min="1" step="1" className={inputClass} value={prize.rank} onChange={(event) => setForm((current) => ({ ...current, rankPrizes: current.rankPrizes.map((item, i) => i === index ? { ...item, rank: event.target.value } : item) }))} /></td>
                <td className="p-1.5"><input aria-label={`${index + 1}번째 등수 상금`} inputMode="numeric" className={inputClass} value={formatMoneyInput(prize.amount)} onChange={(event) => setForm((current) => ({ ...current, rankPrizes: current.rankPrizes.map((item, i) => i === index ? { ...item, amount: event.target.value.replaceAll(",", "") } : item) }))} /></td>
                <td className="w-16 p-1.5 text-center"><button type="button" aria-label={`${index + 1}번째 등수 삭제`} className="text-xs text-rose-600" onClick={() => setForm((current) => ({ ...current, rankPrizes: current.rankPrizes.filter((_, i) => i !== index) }))}>삭제</button></td>
              </tr>)}
            </tbody></table></div>
          </div>
        </div>
      </AdminModal>
    </section>
  );
}
