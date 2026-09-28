// File: app/admin/seasons/structure/ParticipantManager.tsx
// Page/Component: ParticipantManager
// Purpose: 선택한 대회의 참가 스트리머를 필터 그리드로 조회하고 포지션·역할을 저장한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminModal from "@/components/admin/AdminModal";
import AdminAvatar from "@/components/admin/AdminAvatar";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminFilterPanel from "@/components/admin/AdminFilterPanel";
import AdminMultiFilterTabs from "@/components/admin/AdminMultiFilterTabs";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { type AdminTableColumn } from "@/components/admin/AdminTable";
import { PARTICIPANT_ROLE_GROUP_CODE, PLAYER_POSITION_GROUP_CODE } from "@/lib/constants/commonCodes";
import { useAdmin } from "@/lib/context/AdminContext";
import { useCommonCodes } from "@/lib/hooks/useCommonCodes";
import { addSeasonParticipants, deleteSeasonParticipant, fetchParticipants, saveParticipantRoles } from "@/lib/seasons/participantClient";
import { toggleSelectedStreamer, toggleVisibleStreamers } from "@/lib/seasons/participantSelection";
import { getChzzkChannelUrl } from "@/lib/streamers/chzzk";
import type { SeasonParticipantRecord } from "@/lib/types/seasonParticipants";
import type { StreamerItem } from "@/lib/types/streamers";

interface Props { seasonId: string; isAddOpen: boolean; onAddOpenChange: (open: boolean) => void }

interface PositionSelectorProps {
  label: string;
  options: Array<{ code: string; name: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// 공통코드 포지션 하나를 선택 가능한 버튼으로 보여준다.
function PositionSelector({ label, options, value, onChange, disabled = false }: PositionSelectorProps) {
  return <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
    {options.map((position) => <button key={position.code} type="button" role="radio" aria-checked={value === position.code} disabled={disabled} onClick={(event) => { event.stopPropagation(); onChange(position.code); }} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${value === position.code ? "border-[#f99e1a] bg-[#f99e1a]/15 text-amber-700 dark:text-amber-300" : "border-slate-200 text-slate-600 hover:border-amber-400 dark:border-slate-700 dark:text-slate-300"}`}>{position.name}</button>)}
  </div>;
}

// 선택한 대회의 서버 참가자와 편집 중 포지션·역할을 대회가 바뀔 때마다 새로 불러온다.
export default function ParticipantManager({ seasonId, isAddOpen, onAddOpenChange }: Props) {
  const { members, showFeedback } = useAdmin();
  const { codes: roles, error: rolesError } = useCommonCodes(PARTICIPANT_ROLE_GROUP_CODE);
  const { codes: positions, error: positionsError } = useCommonCodes(PLAYER_POSITION_GROUP_CODE);
  const [participants, setParticipants] = useState<SeasonParticipantRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [positionDrafts, setPositionDrafts] = useState<Record<string, string | null>>({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [participantQuery, setParticipantQuery] = useState("");
  const [positionFilters, setPositionFilters] = useState<string[]>([]);
  const [roleFilters, setRoleFilters] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (!seasonId) { setParticipants([]); return; }
    setLoading(true);
    setParticipants([]);
    setDrafts({});
    setPositionDrafts({});
    setSelectedParticipantIds([]);
    fetchParticipants(seasonId).then((result) => {
      if (!active) return;
      if (result.success && result.data) setParticipants(result.data);
      else showFeedback(result.message || "참가자 목록을 불러오지 못했습니다.");
    }).catch(() => { if (active) showFeedback("참가자 목록을 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [seasonId, showFeedback]);

  useEffect(() => { if (rolesError) showFeedback(rolesError); }, [rolesError, showFeedback]);
  useEffect(() => { if (positionsError) showFeedback(positionsError); }, [positionsError, showFeedback]);

  const existingIds = useMemo(() => new Set(participants.map((item) => item.streamerId)), [participants]);
  const visibleParticipants = useMemo(() => participants.filter((item) => {
    const matchesName = item.name.toLowerCase().includes(participantQuery.trim().toLowerCase());
    const matchesPosition = !positionFilters.length || (!!item.position && positionFilters.includes(item.position));
    const matchesRole = !roleFilters.length || item.roles.some((role) => roleFilters.includes(role));
    return matchesName && matchesPosition && matchesRole;
  }), [participants, participantQuery, positionFilters, roleFilters]);
  const visibleParticipantIds = useMemo(() => visibleParticipants.map((item) => item.streamerId), [visibleParticipants]);
  const allVisibleParticipantsSelected = visibleParticipantIds.length > 0 && visibleParticipantIds.every((id) => selectedParticipantIds.includes(id));
  const partlyVisibleParticipantsSelected = !allVisibleParticipantsSelected && visibleParticipantIds.some((id) => selectedParticipantIds.includes(id));
  const dirtyParticipants = useMemo(() => participants.filter((item) => {
    const selectedRoles = drafts[item.streamerId] ?? item.roles;
    const rolesChanged = selectedRoles.length !== item.roles.length || selectedRoles.some((code) => !item.roles.includes(code));
    const hasPositionDraft = Object.prototype.hasOwnProperty.call(positionDrafts, item.streamerId);
    const selectedPosition = selectedRoles.includes("COACH") ? null : hasPositionDraft ? positionDrafts[item.streamerId] : item.position;
    return rolesChanged || selectedPosition !== item.position;
  }), [participants, drafts, positionDrafts]);

  // 현재 필터에 표시된 참가자를 한 번에 선택하거나 선택 해제한다.
  const toggleVisibleParticipants = () => {
    setSelectedParticipantIds((current) => allVisibleParticipantsSelected
      ? current.filter((id) => !visibleParticipantIds.includes(id))
      : [...new Set([...current, ...visibleParticipantIds])]);
  };

  // 이름과 역할·포지션 필터를 현재 조회 화면에서 초기화한다.
  const resetParticipantFilters = () => {
    setParticipantQuery(""); setPositionFilters([]); setRoleFilters([]);
  };
  // 행 전체 선택과 체크박스 선택이 같은 참가자 선택 상태를 갱신한다.
  const toggleParticipantSelection = (streamerId: string) => {
    setSelectedParticipantIds((current) => current.includes(streamerId)
      ? current.filter((id) => id !== streamerId)
      : [...current, streamerId]);
  };
  const candidates = useMemo(() => members.filter((item) => item.isUse !== false && `${item.name} ${item.channelId || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [members, query]);
  // 헤더 체크박스는 현재 검색 결과에서 등록 가능한 선수만 집계하고 일부 선택을 표시한다.
  const selectableVisibleIds = useMemo(() => candidates.filter((member) => !existingIds.has(member.id)).map((member) => member.id), [candidates, existingIds]);
  const allVisibleSelected = selectableVisibleIds.length > 0 && selectableVisibleIds.every((id) => selectedIds.includes(id));
  const partlyVisibleSelected = !allVisibleSelected && selectableVisibleIds.some((id) => selectedIds.includes(id));

  // 이미 참가한 스트리머는 선택을 막고 나머지는 행과 체크박스 모두로 선택한다.
  const toggleStreamer = (member: StreamerItem) => {
    setSelectedIds((current) => toggleSelectedStreamer(current, member.id, existingIds));
  };

  // 현재 검색 결과의 등록 가능 스트리머를 한꺼번에 선택하거나 해제한다.
  const toggleVisible = () => {
    setSelectedIds((current) => toggleVisibleStreamers(current, candidates.map((member) => member.id), existingIds));
  };

  const columns: AdminTableColumn<StreamerItem>[] = [
    { key: "select", header: <input type="checkbox" checked={allVisibleSelected} disabled={!selectableVisibleIds.length} onChange={toggleVisible} ref={(input) => { if (input) input.indeterminate = partlyVisibleSelected; }} aria-label="검색 결과 전체 선택" className="h-4 w-4 accent-[#f99e1a] disabled:cursor-not-allowed disabled:opacity-40" />, width: "w-16", align: "center", render: (member) => <input type="checkbox" checked={selectedIds.includes(member.id)} disabled={existingIds.has(member.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleStreamer(member)} aria-label={`${member.name} 선택`} className="h-4 w-4 accent-[#f99e1a] disabled:cursor-not-allowed disabled:opacity-40" /> },
    { key: "name", header: "스트리머 / 채널", width: "min-w-[240px]", render: (member) => <div className="flex items-center gap-2.5"><AdminAvatar name={member.name} profileImg={member.profileImg} size="w-9 h-9 text-xs" /><div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-slate-100">{member.name}</p>{member.channelId ? <a href={getChzzkChannelUrl(member.channelId)} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="mt-0.5 inline-flex rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">치지직 바로가기 ↗</a> : <span className="text-[11px] text-slate-500">일반 등록</span>}</div></div> },
    { key: "type", header: "구분", width: "w-28", render: (member) => <span className="text-[11px] text-slate-500">{member.type}</span> },
    { key: "status", header: "상태", width: "w-28", render: (member) => existingIds.has(member.id) ? <AdminBadge variant="success">이미 참가</AdminBadge> : <AdminBadge variant="neutral">등록 가능</AdminBadge> },
  ];

  // 새 등록 모달을 열 때 이전 검색과 선택을 초기화한다.
  useEffect(() => { if (isAddOpen) { setQuery(""); setSelectedIds([]); } }, [isAddOpen]);

  // 선택한 스트리머를 기본 선수 역할과 미지정 포지션으로 등록한다.
  const addSelected = async () => {
    if (!selectedIds.length || busyId) return;
    setBusyId("adding");
    try {
      const result = await addSeasonParticipants(seasonId, selectedIds, ["PLAYER"], Object.fromEntries(selectedIds.map((id) => [id, null])));
      if (!result.success || !result.data) { showFeedback(result.message || "참가자 등록에 실패했습니다."); return; }
      setParticipants((current) => [...current, ...result.data!.filter((item) => !current.some((saved) => saved.streamerId === item.streamerId))]);
      onAddOpenChange(false); showFeedback(`${result.data.length}명의 참가자를 등록했습니다.`);
    } catch { showFeedback("참가자 등록에 실패했습니다."); }
    finally { setBusyId(null); }
  };

  // 수정된 참가자들을 한 번의 요청으로 저장하고 성공한 편집 상태를 정리한다.
  const saveAll = async () => {
    if (!dirtyParticipants.length || busyId) return;
    setBusyId("saving-all");
    const updates = dirtyParticipants.map((item) => {
      const selectedRoles = drafts[item.streamerId] ?? item.roles;
      const position = selectedRoles.includes("COACH") ? null : Object.prototype.hasOwnProperty.call(positionDrafts, item.streamerId) ? positionDrafts[item.streamerId] : undefined;
      return { streamerId: item.streamerId, roles: selectedRoles, ...(position !== undefined ? { position } : {}) };
    });
    try {
      const result = await saveParticipantRoles(seasonId, updates);
      if (!result.success || !result.data) { showFeedback(result.message || "참가자 변경 사항 저장에 실패했습니다."); return; }
      const savedIds = new Set(result.data.map((item) => item.streamerId));
      const savedData = new Map(result.data.map((item) => [item.streamerId, item]));
      setParticipants((current) => current.map((item) => savedData.get(item.streamerId) ?? item));
      setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !savedIds.has(id))));
      setPositionDrafts((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !savedIds.has(id))));
      showFeedback(`${result.data.length}명의 변경 사항을 저장했습니다.`);
    } catch {
      showFeedback("참가자 변경 사항 저장 요청에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  // 공통코드 선택을 중복 없는 코드 배열로 토글한다.
  const toggleRole = (codes: string[], code: string) => codes.includes(code) ? codes.filter((value) => value !== code) : [...codes, code];
  // 마지막 역할을 제거하는 입력은 막고, 나머지 역할 변경은 행 초안에 반영한다.
  const changeParticipantRole = (item: SeasonParticipantRecord, selected: string[], code: string) => {
    const next = toggleRole(selected, code);
    if (!next.length) { showFeedback("역할은 한 개 이상 선택해주세요."); return; }
    setDrafts((current) => ({ ...current, [item.streamerId]: next }));
  };

  // 선택된 선수 연결만 대회에서 제외하고 성공·실패 결과를 화면 상태에 반영한다.
  const removeSelectedParticipants = async () => {
    const targets = participants.filter((item) => selectedParticipantIds.includes(item.streamerId));
    if (!targets.length || busyId || !window.confirm(`${targets.length}명의 선수를 대회 참가 목록에서 제외할까요?`)) return;
    setBusyId("removing");
    const results = await Promise.all(targets.map(async (item) => {
      try {
        const result = await deleteSeasonParticipant(seasonId, item.streamerId);
        return result.success ? { item, removed: true as const } : { item, removed: false as const };
      } catch { return { item, removed: false as const }; }
    }));
    const removedIds = new Set(results.filter((result) => result.removed).map((result) => result.item.streamerId));
    if (removedIds.size) {
      setParticipants((current) => current.filter((item) => !removedIds.has(item.streamerId)));
      setSelectedParticipantIds((current) => current.filter((id) => !removedIds.has(id)));
      setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !removedIds.has(id))));
      setPositionDrafts((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !removedIds.has(id))));
    }
    setBusyId(null);
    const failed = results.length - removedIds.size;
    showFeedback(failed ? `${removedIds.size}명 제외, ${failed}명 제외 실패.` : `${removedIds.size}명의 선수를 대회에서 제외했습니다.`);
  };

  const participantColumns: AdminTableColumn<SeasonParticipantRecord>[] = [
    { key: "select", header: <input type="checkbox" checked={allVisibleParticipantsSelected} disabled={!visibleParticipantIds.length || !!busyId} onChange={toggleVisibleParticipants} ref={(input) => { if (input) input.indeterminate = partlyVisibleParticipantsSelected; }} aria-label="현재 필터 결과 전체 선택" className="h-4 w-4 accent-[#f99e1a] disabled:opacity-40" />, width: "w-12", align: "center", render: (item) => <input type="checkbox" checked={selectedParticipantIds.includes(item.streamerId)} disabled={!!busyId} onClick={(event) => event.stopPropagation()} onChange={() => toggleParticipantSelection(item.streamerId)} aria-label={`${item.name} 선택`} className="h-4 w-4 accent-[#f99e1a]" /> },
    { key: "name", header: "선수", width: "min-w-[220px]", render: (item) => <div className="flex items-center gap-3"><AdminAvatar name={item.name} profileImg={item.profileImg} size="h-9 w-9 text-xs" /><span className="truncate font-bold text-slate-900 dark:text-slate-100">{item.name}</span></div> },
    { key: "position", header: "포지션", width: "min-w-[220px]", render: (item) => { const isCoach = (drafts[item.streamerId] ?? item.roles).includes("COACH"); return <PositionSelector label={`${item.name} 포지션`} options={positions} value={isCoach ? "" : positionDrafts[item.streamerId] ?? item.position ?? ""} disabled={!!busyId || isCoach} onChange={(value) => setPositionDrafts((current) => ({ ...current, [item.streamerId]: value }))} />; } },
    { key: "roles", header: "역할", width: "min-w-[320px]", render: (item) => { const selected = drafts[item.streamerId] ?? item.roles; return <div className="flex flex-wrap gap-2" aria-label={`${item.name} 역할`}>{roles.map((role) => <label key={role.code} onClick={(event) => event.stopPropagation()} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700"><input type="checkbox" disabled={!!busyId} checked={selected.includes(role.code)} onChange={() => changeParticipantRole(item, selected, role.code)} />{role.name}</label>)}</div>; } },
  ];

  return <div className="col-span-full flex h-full min-h-[360px] min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111726] md:p-5">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
      <span className="text-xs text-slate-500">{visibleParticipants.length} / {participants.length}명 조회 · {selectedParticipantIds.length}명 선택</span>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={!participantQuery && !positionFilters.length && !roleFilters.length} onClick={resetParticipantFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">조건 초기화</button>
        <button type="button" disabled={!selectedParticipantIds.length || !!busyId} onClick={() => void removeSelectedParticipants()} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900 dark:text-rose-400">{busyId === "removing" ? "제외 중..." : "선택 선수 제외"}</button>
        <button type="button" disabled={!dirtyParticipants.length || !!busyId} onClick={() => void saveAll()} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busyId === "saving-all" ? "저장 중..." : `변경 사항 저장 (${dirtyParticipants.length})`}</button>
      </div>
    </div>
    <AdminFilterPanel>
      <AdminSearchInput label="선수 이름" value={participantQuery} onChange={setParticipantQuery} placeholder="선수 이름 검색..." containerClassName="lg:col-span-3" />
      <AdminMultiFilterTabs label="포지션" tabs={[{ code: "ALL", name: "전체" }, ...positions.filter((position) => position.code !== "TANK")]} selectedCodes={positionFilters} onChange={setPositionFilters} containerClassName="lg:col-span-3" />
      <AdminMultiFilterTabs label="역할" tabs={[{ code: "ALL", name: "전체" }, ...roles]} selectedCodes={roleFilters} onChange={setRoleFilters} containerClassName="lg:col-span-6" />
    </AdminFilterPanel>
    <div className="flex-1 min-h-0 flex flex-col">
      <AdminTable columns={participantColumns} data={visibleParticipants} keyField="streamerId" onRowClick={(item) => toggleParticipantSelection(item.streamerId)} rowClassName={(item) => selectedParticipantIds.includes(item.streamerId) ? "bg-amber-500/10 dark:bg-amber-500/15" : ""} isLoading={loading} containerClassName="min-h-[260px]" emptyTitle="선수가 없습니다." emptyDescription="필터 조건을 확인하거나 상단에서 선수를 추가하세요." />
    </div>
    <AdminModal isOpen={isAddOpen} onClose={() => { if (!busyId) onAddOpenChange(false); }} title="선수 추가" description="대회에 등록할 스트리머를 선택하세요. 역할과 포지션은 등록 후 지정할 수 있습니다." maxWidth="4xl" bodyClassName="p-5 overflow-y-auto flex-1 min-h-0 space-y-4" footer={<div className="flex items-center justify-between gap-3"><span className="text-[11px] text-slate-500">{selectedIds.length}명 선택됨</span><div className="flex gap-2"><button type="button" disabled={!!busyId} onClick={() => onAddOpenChange(false)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-50 dark:border-slate-700">취소</button><button type="button" disabled={!selectedIds.length || !!busyId} onClick={() => void addSelected()} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{selectedIds.length}명 등록</button></div></div>}>
      <AdminSearchInput label="등록된 스트리머 검색" value={query} onChange={setQuery} placeholder="스트리머 이름 또는 채널 ID를 입력하세요..." />
      <div className="text-xs text-slate-500">검색 결과 {candidates.length}명</div>
      <div className="flex h-[380px] min-h-0 shrink-0 flex-col"><AdminTable columns={columns} data={candidates} keyField="id" onRowClick={toggleStreamer} rowClassName={(member) => existingIds.has(member.id) ? "cursor-not-allowed opacity-60" : selectedIds.includes(member.id) ? "bg-amber-500/10 dark:bg-amber-500/15" : ""} emptyIcon="🔎" emptyTitle="검색 결과가 없습니다." emptyDescription="스트리머 이름 또는 채널 ID를 확인해주세요." /></div>
    </AdminModal>
  </div>;
}
