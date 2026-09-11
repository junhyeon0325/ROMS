// app/admin/tournaments/structure/page.tsx
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { TournamentParticipant } from "@/lib/types/admin";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";
import Link from "next/link";

interface GroupTeam {
  id: string;
  name: string;
  captain: string;
  seed: number;
}

interface Group {
  name: string;
  teams: GroupTeam[];
}

export default function AdminTournamentStructurePage() {
  const { tournaments, members, participants, setParticipants, showFeedback } = useAdmin();

  // 대상 대회 선택
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments[0]?.id || ""
  );

  // 구성 탭 (참가 인원 및 역할 / 조별리그 / 본선 토너먼트 / 세트 룰)
  const [activeTab, setActiveTab] = useState<"participants" | "groups" | "bracket" | "rules">(
    "participants"
  );

  // --- [참가 인원 및 역할 상태] ---
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantRoleFilter, setParticipantRoleFilter] = useState<"전체" | "팀장" | "선수" | "감독">(
    "전체"
  );
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantForm, setParticipantForm] = useState<{
    memberId: string;
    roles: { 팀장: boolean; 선수: boolean; 감독: boolean };
    teamName: string;
  }>({
    memberId: "",
    roles: { 팀장: false, 선수: true, 감독: false },
    teamName: "",
  });

  // 조별 편성 상태 (초기 빈 배열)
  const [groups, setGroups] = useState<Group[]>([]);

  // 경기 규칙 폼 상태
  const [ruleConfig, setRuleConfig] = useState({
    groupFormat: "Bo3",
    playoffFormat: "Bo5",
    finalFormat: "Bo7",
    teamsPerGroup: 4,
    qualifiersPerGroup: 2,
    heroBanEnabled: true,
    maxHeroBans: 1,
    mapPickRule: "패자 선택제 (Loser's Pick)",
    overtimeRule: "공식 오버워치 타이브레이커 쟁탈 1선승",
  });

  const selectedTournament =
    tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];

  // 현재 대회의 참가자 필터링
  const currentTournamentParticipants = participants.filter(
    (p) => p.tournamentId === (selectedTournament?.id || "")
  );

  // 역할별 인원 집계
  const countStats = {
    total: currentTournamentParticipants.length,
    captains: currentTournamentParticipants.filter((p) => p.roles.includes("팀장")).length,
    players: currentTournamentParticipants.filter((p) => p.roles.includes("선수")).length,
    coaches: currentTournamentParticipants.filter((p) => p.roles.includes("감독")).length,
  };

  // 검색 및 필터링된 참가자 목록
  const filteredParticipants = currentTournamentParticipants.filter((p) => {
    const matchSearch =
      p.memberName.toLowerCase().includes(participantSearch.toLowerCase()) ||
      (p.channelId && p.channelId.toLowerCase().includes(participantSearch.toLowerCase())) ||
      (p.teamName && p.teamName.toLowerCase().includes(participantSearch.toLowerCase()));
    const matchRole =
      participantRoleFilter === "전체" || p.roles.includes(participantRoleFilter);
    return matchSearch && matchRole;
  });

  // 참가자 선택 시 수정 폼 바인딩
  const handleSelectParticipant = (item: TournamentParticipant) => {
    setSelectedParticipantId(item.id);
    setParticipantForm({
      memberId: item.memberId,
      roles: {
        팀장: item.roles.includes("팀장"),
        선수: item.roles.includes("선수"),
        감독: item.roles.includes("감독"),
      },
      teamName: item.teamName || "",
    });
  };

  // 신규 참가자 등록 모드로 리셋
  const handleNewParticipant = () => {
    setSelectedParticipantId(null);
    setParticipantForm({
      memberId: "",
      roles: { 팀장: false, 선수: true, 감독: false },
      teamName: "",
    });
    showFeedback("신규 참가자 등록 모드로 전환되었습니다.");
  };

  // 참가자 역할 저장 (신규 등록 또는 수정)
  const handleSaveParticipant = () => {
    if (!selectedTournament) {
      showFeedback("선택된 대회가 없습니다.");
      return;
    }

    const selectedRoles: string[] = [];
    if (participantForm.roles.팀장) selectedRoles.push("팀장");
    if (participantForm.roles.선수) selectedRoles.push("선수");
    if (participantForm.roles.감독) selectedRoles.push("감독");

    if (selectedRoles.length === 0) {
      showFeedback("최소 하나 이상의 역할(팀장, 선수, 감독)을 선택해주세요.");
      return;
    }

    if (selectedParticipantId) {
      // 기존 참가자 역할/팀 수정
      setParticipants((prev) =>
        prev.map((item) =>
          item.id === selectedParticipantId
            ? {
                ...item,
                roles: selectedRoles,
                teamName: participantForm.teamName.trim() || undefined,
              }
            : item
        )
      );
      const target = currentTournamentParticipants.find((p) => p.id === selectedParticipantId);
      showFeedback(`[${target?.memberName}] 참가자의 역할이 업데이트되었습니다.`);
    } else {
      // 신규 참가자 추가
      if (!participantForm.memberId) {
        showFeedback("참가할 스트리머를 선택해주세요.");
        return;
      }

      // 중복 참가 여부 확인
      const alreadyJoined = currentTournamentParticipants.some(
        (p) => p.memberId === participantForm.memberId
      );
      if (alreadyJoined) {
        showFeedback("이미 해당 대회에 참가 등록된 스트리머입니다.");
        return;
      }

      const targetMember = members.find((m) => m.id === participantForm.memberId);
      if (!targetMember) {
        showFeedback("선택한 스트리머 정보를 찾을 수 없습니다.");
        return;
      }

      const newId = `TP-${String(participants.length + 1).padStart(3, "0")}`;
      const newParticipant: TournamentParticipant = {
        id: newId,
        tournamentId: selectedTournament.id,
        memberId: targetMember.id,
        memberName: targetMember.name,
        memberType: targetMember.type,
        channelId: targetMember.channelId,
        profileImg: targetMember.profileImg,
        roles: selectedRoles,
        teamName: participantForm.teamName.trim() || undefined,
        registeredDate: new Date().toISOString().split("T")[0],
      };

      setParticipants((prev) => [newParticipant, ...prev]);
      setSelectedParticipantId(newId);
      showFeedback(
        `[${targetMember.name}] 스트리머가 대회 참가자로 등록되고 역할(${selectedRoles.join(", ")})이 부여되었습니다.`
      );
    }
  };

  // 참가 취소
  const handleDeleteParticipant = () => {
    if (!selectedParticipantId) return;
    const target = currentTournamentParticipants.find((p) => p.id === selectedParticipantId);
    setParticipants((prev) => prev.filter((p) => p.id !== selectedParticipantId));
    handleNewParticipant();
    showFeedback(`[${target?.memberName || "참가자"}] 대회 참가 등록이 취소되었습니다.`);
  };

  // 규정 저장
  const handleSaveStructure = () => {
    if (!selectedTournament) {
      showFeedback("대회가 존재하지 않아 저장할 수 없습니다.");
      return;
    }
    showFeedback(`[${selectedTournament.name}] 대회 구성 및 규정이 저장되었습니다.`);
  };

  const handleResetStructure = () => {
    showFeedback("대회 구성 설정이 기본값으로 초기화되었습니다.");
  };

  return (
    <section className="space-y-6">
      {/* 1) 대회 기본 정보 요약 바 & 탭 네비게이션 */}
      {selectedTournament ? (
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              🏆
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  {selectedTournament.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedTournament.status === "진행중"
                      ? "bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400"
                      : selectedTournament.status === "접수중"
                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {selectedTournament.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                주최: {selectedTournament.organizer} · 참가규모: {selectedTournament.teams}개 팀 · 상금: {selectedTournament.prize}
              </p>
            </div>
          </div>

          {/* 우측: 대회 선택 및 탭 버튼 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                대회 선택:
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => {
                  setSelectedTournamentId(e.target.value);
                  setSelectedParticipantId(null);
                  setParticipantForm({
                    memberId: "",
                    roles: { 팀장: false, 선수: true, 감독: false },
                    teamName: "",
                  });
                  showFeedback(`대상 대회가 변경되었습니다.`);
                }}
                disabled={tournaments.length === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              >
                {tournaments.length === 0 ? (
                  <option value="">등록된 대회 없음</option>
                ) : (
                  tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "participants"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              참가 인원 및 역할 ({countStats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("groups")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "groups"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              조별 편성
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bracket")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "bracket"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              토너먼트 트리
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "rules"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              세트 및 룰 설정
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <span className="text-3xl block mb-2">🏆</span>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
            등록된 대회가 없습니다.
          </p>
          <p className="text-slate-400 dark:text-slate-500 mb-4">
            대회 구성을 설정하려면 먼저 대회를 생성해 주세요.
          </p>
          <Link
            href="/admin/tournaments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
          >
            + 새 대회 등록하기
          </Link>
        </div>
      )}

      {/* 3) 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* 탭 1: 참가 인원 및 역할 관리 */}
        {/* ========================================================= */}
        {activeTab === "participants" && (
          <>
            {/* 좌측 7컬럼: 참가 인원 조회 카드 */}
            <div className="xl:col-span-7 space-y-4">
              <AdminCard
                title="대회 참가 인원 및 역할 배정 현황"
                countBadge={`총 ${countStats.total}명 참가`}
              >
                {/* 상단 통계 배지 요약 바 */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                      총 참가 인원
                    </span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                      {countStats.total}명
                    </span>
                  </div>
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-center">
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">
                      팀장 (Captains)
                    </span>
                    <span className="text-base font-extrabold text-amber-700 dark:text-amber-300">
                      {countStats.captains}명
                    </span>
                  </div>
                  <div className="bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-center">
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block">
                      선수 (Players)
                    </span>
                    <span className="text-base font-extrabold text-blue-700 dark:text-blue-300">
                      {countStats.players}명
                    </span>
                  </div>
                  <div className="bg-purple-50/70 dark:bg-purple-950/30 p-2.5 rounded-xl border border-purple-200/60 dark:border-purple-900/40 text-center">
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block">
                      감독 (Coaches)
                    </span>
                    <span className="text-base font-extrabold text-purple-700 dark:text-purple-300">
                      {countStats.coaches}명
                    </span>
                  </div>
                </div>

                {/* 검색 및 역할 필터 바 */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4 space-y-2.5">
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="참가자 이름, 채널 또는 소속팀 검색..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {(["전체", "팀장", "선수", "감독"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setParticipantRoleFilter(role)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                            participantRoleFilter === role
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    {participantSearch && (
                      <button
                        type="button"
                        onClick={() => setParticipantSearch("")}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline"
                      >
                        검색 초기화
                      </button>
                    )}
                  </div>
                </div>

                {/* 참가 인원 테이블 */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="px-3.5 py-3">스트리머</th>
                        <th className="px-3.5 py-3 w-20">구분</th>
                        <th className="px-3.5 py-3">배정된 역할</th>
                        <th className="px-3.5 py-3 w-24">소속 팀</th>
                        <th className="px-3.5 py-3 w-24">참가일자</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                      {filteredParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3.5 py-12 text-center text-slate-400 dark:text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span className="text-2xl">🎮</span>
                              <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                                {currentTournamentParticipants.length === 0
                                  ? "현재 대회에 참가 신청된 스트리머가 없습니다."
                                  : "검색 및 필터 조건에 부합하는 참가자가 없습니다."}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {currentTournamentParticipants.length === 0
                                  ? "우측 배정 폼에서 스트리머를 선택하고 대회 역할을 부여해주세요."
                                  : "필터를 변경하거나 검색어를 초기화해보세요."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredParticipants.map((p) => {
                          const isSelected = selectedParticipantId === p.id;
                          return (
                            <tr
                              key={p.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50/80 dark:bg-blue-950/40 font-medium"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              }`}
                              onClick={() => handleSelectParticipant(p)}
                            >
                              <td className="px-3.5 py-3">
                                <div className="flex items-center gap-2.5">
                                  {p.profileImg ? (
                                    <img
                                      src={p.profileImg}
                                      alt={p.memberName}
                                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                      {p.memberName.slice(0, 1)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                      {p.memberName}
                                    </div>
                                    {p.channelId && (
                                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        @{p.channelId}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3.5 py-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    p.memberType === "치지직 연동"
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  {p.memberType === "치지직 연동" ? "치지직" : "일반"}
                                </span>
                              </td>
                              <td className="px-3.5 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {p.roles.map((r) => {
                                    const roleBadgeClass =
                                      r === "팀장"
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                        : r === "선수"
                                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                        : "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
                                    return (
                                      <span
                                        key={r}
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeClass}`}
                                      >
                                        {r}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300">
                                {p.teamName ? (
                                  <span className="font-semibold text-[11px]">
                                    {p.teamName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="px-3.5 py-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                {p.registeredDate}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </AdminCard>
            </div>

            {/* 우측 5컬럼: 참가 등록 & 역할 배정 폼 */}
            <div className="xl:col-span-5">
              <AdminCard
                title={selectedParticipantId ? "참가자 역할 수정" : "대회 참가 등록 및 역할 배정"}
                actions={
                  <AdminFormActions
                    onSave={handleSaveParticipant}
                    onDelete={selectedParticipantId ? handleDeleteParticipant : undefined}
                    onNew={handleNewParticipant}
                    isEditing={!!selectedParticipantId}
                    saveLabel={selectedParticipantId ? "역할 저장" : "참가 등록 & 역할 부여"}
                    deleteLabel="참가 취소"
                  />
                }
              >
                <div className="space-y-4">
                  {/* 스트리머 선택 (신규 등록 시 드롭다운, 수정 시 정보 표시) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      참가 대상 스트리머 <span className="text-rose-500">*</span>
                    </label>

                    {selectedParticipantId ? (
                      // 수정 모드: 선택된 스트리머 프로필 고정
                      (() => {
                        const target = currentTournamentParticipants.find(
                          (p) => p.id === selectedParticipantId
                        );
                        return (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                {target?.memberName.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {target?.memberName}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {target?.channelId ? `@${target.channelId}` : target?.memberType}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              참가중
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      // 신규 모드: 스트리머 선택 드롭다운
                      <div>
                        {members.length === 0 ? (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-700 dark:text-amber-300">
                            <p className="font-semibold mb-1">등록된 스트리머가 없습니다.</p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
                              대회에 참가시킬 스트리머를 먼저 스트리머 관리에서 등록해주세요.
                            </p>
                            <Link
                              href="/admin/members"
                              className="inline-flex items-center gap-1 font-bold underline hover:text-amber-800"
                            >
                              스트리머 등록하러 가기 →
                            </Link>
                          </div>
                        ) : (
                          <select
                            value={participantForm.memberId}
                            onChange={(e) =>
                              setParticipantForm((p) => ({ ...p, memberId: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="">스트리머를 선택하세요...</option>
                            {members.map((m) => {
                              const isAlreadyIn = currentTournamentParticipants.some(
                                (p) => p.memberId === m.id
                              );
                              return (
                                <option
                                  key={m.id}
                                  value={m.id}
                                  disabled={isAlreadyIn}
                                >
                                  {m.name} ({m.type}{m.channelId ? ` · @${m.channelId}` : ""})
                                  {isAlreadyIn ? " [이미 참가중]" : ""}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 대회 역할 선택 (복수 선택 지원) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      대회 역할 부여 (복수 선택 가능) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {(["팀장", "선수", "감독"] as const).map((role) => {
                        const isChecked = participantForm.roles[role];
                        const activeColorClass =
                          role === "팀장"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : role === "선수"
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-purple-600 text-white border-purple-600 shadow-sm";

                        return (
                          <button
                            key={role}
                            type="button"
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isChecked
                                ? activeColorClass
                                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                            }`}
                            onClick={() =>
                              setParticipantForm((p) => ({
                                ...p,
                                roles: { ...p.roles, [role]: !p.roles[role] },
                              }))
                            }
                          >
                            {isChecked ? "✓ " : ""}
                            {role}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                      스트리머는 팀장이면서 선수로 동시에 출전할 수도 있습니다.
                    </p>
                  </div>

                  {/* 소속 팀 / 시드 지정 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      소속 팀 배정 (선택 사항)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="예: 러너팀, A조 1번 시드팀 등"
                      value={participantForm.teamName}
                      onChange={(e) =>
                        setParticipantForm((p) => ({ ...p, teamName: e.target.value }))
                      }
                    />
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      팀이 확정되었거나 팀장으로 지정된 경우 팀명을 입력해 두면 조 편성과 연계됩니다.
                    </p>
                  </div>

                  {/* 안내 카드 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span>📌</span>
                      <span>대회 역할 체계 안내</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                      <li><strong className="text-amber-600 dark:text-amber-400">팀장</strong>: 조 편성 및 픽밴 회의, 팀원 경매/지명 권한</li>
                      <li><strong className="text-blue-600 dark:text-blue-400">선수</strong>: 실제 본선 및 세트 경기에 출전하는 플레이어</li>
                      <li><strong className="text-purple-600 dark:text-purple-400">감독</strong>: 밴픽 전략 및 팀 멘토링 전담 역할</li>
                    </ul>
                  </div>
                </div>
              </AdminCard>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 탭 2: 조별 편성 */}
        {/* ========================================================= */}
        {activeTab === "groups" && (
          <div className="xl:col-span-12">
            <AdminCard
              title="조별 예선 그룹 편성 (Group Stage)"
              countBadge={`총 ${groups.length}개조`}
              actions={
                <button
                  type="button"
                  onClick={() => {
                    if (groups.length === 0) {
                      showFeedback("편성된 조가 없어 셔플을 진행할 수 없습니다.");
                      return;
                    }
                    showFeedback("조 무작위 셔플 추첨이 완료되었습니다.");
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  🎲 조 추첨 셔플
                </button>
              }
            >
              {groups.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <span className="text-3xl block mb-2">📋</span>
                  <p className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">
                    편성된 조별 예선 그룹이 없습니다.
                  </p>
                  <p className="text-[11px] text-slate-400 mb-4">
                    먼저 [참가 인원 및 역할] 탭에서 팀장 및 참가자를 구성한 후 조 편성을 진행해주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("participants")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all"
                  >
                    참가 인원 및 역할 탭으로 이동 →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((grp) => (
                    <div
                      key={grp.name}
                      className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40"
                    >
                      <div className="bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {grp.name} (풀리그 라운드로빈)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          상위 2팀 본선 4강 진출
                        </span>
                      </div>

                      <div className="p-3 divide-y divide-slate-200/60 dark:divide-slate-800/60">
                        {grp.teams.map((team) => (
                          <div
                            key={team.id}
                            className="py-2.5 px-2 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center">
                                {team.seed}
                              </span>
                              <div>
                                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {team.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  팀장: {team.captain}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => showFeedback(`[${team.name}] 팀 정보 수정`)}
                                className="text-[11px] px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500"
                              >
                                시드 조정
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        )}

        {/* ========================================================= */}
        {/* 탭 3: 토너먼트 트리 */}
        {/* ========================================================= */}
        {activeTab === "bracket" && (
          <div className="xl:col-span-12">
            <AdminCard
              title="본선 토너먼트 대진 브래킷"
              countBadge="4강 토너먼트"
            >
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <span className="text-3xl block mb-2">🎯</span>
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  생성된 본선 대진표가 없습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  조별 풀리그 순위가 확정된 후 본선 토너먼트 대진 브래킷이 자동 생성됩니다.
                </p>
              </div>
            </AdminCard>
          </div>
        )}

        {/* ========================================================= */}
        {/* 탭 4: 세트 및 룰 설정 */}
        {/* ========================================================= */}
        {activeTab === "rules" && (
          <>
            <div className="xl:col-span-7">
              <AdminCard title="세트별 진행 맵 및 룰 구성" countBadge="표준 OW2 규정">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">1세트: 쟁탈 (Control)</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 네팔, 일리오스, 오아시스</div>
                    </div>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">Bo3 필수</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">2세트: 혼합 (Hybrid)</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 왕의 길, 눔바니, 미드타운</div>
                    </div>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">Bo3 필수</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">3세트: 플래시포인트 / 밀기</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 수라바사, 뉴 정크 시티, 이스페란사</div>
                    </div>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">Bo3 결정세트</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">4세트: 호위 (Escort)</div>
                      <div className="text-slate-500 text-[11px]">고정 맵풀: 서킷 로얄, 지브롤터 감시기지</div>
                    </div>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">Bo5 연장세트</span>
                  </div>
                </div>
              </AdminCard>
            </div>

            <div className="xl:col-span-5">
              <AdminCard
                title="대회 규정 및 세부 설정"
                actions={
                  <AdminFormActions
                    onSave={handleSaveStructure}
                    onNew={handleResetStructure}
                    saveLabel="규정 저장"
                    newLabel="설정 초기화"
                  />
                }
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      조별 풀리그 경기 방식
                    </label>
                    <select
                      value={ruleConfig.groupFormat}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, groupFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Bo1">단판제 (Bo1)</option>
                      <option value="Bo3">3판 2선승제 (Bo3)</option>
                      <option value="Bo5">5판 3선승제 (Bo5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      본선 토너먼트 경기 방식
                    </label>
                    <select
                      value={ruleConfig.playoffFormat}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, playoffFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Bo3">3판 2선승제 (Bo3)</option>
                      <option value="Bo5">5판 3선승제 (Bo5)</option>
                      <option value="Bo7">7판 4선승제 (Bo7)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      결승전 경기 방식
                    </label>
                    <select
                      value={ruleConfig.finalFormat}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, finalFormat: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Bo5">5판 3선승제 (Bo5)</option>
                      <option value="Bo7">7판 4선승제 (Bo7)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        조당 팀 수
                      </label>
                      <input
                        type="number"
                        value={ruleConfig.teamsPerGroup}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, teamsPerGroup: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        조별 본선 진출 팀 수
                      </label>
                      <input
                        type="number"
                        value={ruleConfig.qualifiersPerGroup}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, qualifiersPerGroup: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          영웅 밴(Ban) 시스템 운영
                        </div>
                        <div className="text-[11px] text-slate-400">
                          팀별 세트당 지정 영웅 밴 적용
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleConfig.heroBanEnabled}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, heroBanEnabled: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        맵 선택 권한 규칙
                      </label>
                      <input
                        type="text"
                        value={ruleConfig.mapPickRule}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, mapPickRule: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        동점 타이브레이커 규정
                      </label>
                      <input
                        type="text"
                        value={ruleConfig.overtimeRule}
                        onChange={(e) =>
                          setRuleConfig({ ...ruleConfig, overtimeRule: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </AdminCard>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
