// app/admin/members/page.tsx
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { MemberItem } from "@/lib/types/admin";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";

export default function AdminMembersPage() {
  const { members, setMembers, showFeedback } = useAdmin();

  // 검색 & 필터 상태
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<{
    선수: boolean;
    감독: boolean;
    팀장: boolean;
  }>({
    선수: true,
    감독: true,
    팀장: true,
  });

  // 선택된 인원 ID (우측 폼 바인딩용)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>("MB-001");
  const [chzzkLoading, setChzzkLoading] = useState(false);

  // 우측 등록 폼 상태
  const [memberForm, setMemberForm] = useState<{
    regType: "치지직 연동" | "일반 등록";
    channelUrl: string;
    name: string;
    roles: { 팀장: boolean; 선수: boolean; 감독: boolean };
    profileImg: string;
    memo: string;
  }>({
    regType: "치지직 연동",
    channelUrl: "",
    name: "땡교",
    roles: { 팀장: true, 선수: true, 감독: false },
    profileImg: "",
    memo: "오버워치 2 올라운더 스트리머. 팀장 및 메인 딜러 겸직.",
  });

  // 인원 필터링
  const filteredMemberList = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.channelId && m.channelId.toLowerCase().includes(memberSearch.toLowerCase()));

    const matchRole = m.roles.some((r) => {
      if (r === "선수" && memberRoleFilter.선수) return true;
      if (r === "감독" && memberRoleFilter.감독) return true;
      if (r === "팀장" && memberRoleFilter.팀장) return true;
      return false;
    });

    return matchSearch && matchRole;
  });

  // 목록 항목 클릭 시 우측 폼에 바인딩
  const handleSelectMember = (m: MemberItem) => {
    setSelectedMemberId(m.id);
    setMemberForm({
      regType: m.type === "치지직 연동" ? "치지직 연동" : "일반 등록",
      channelUrl: m.channelId ? `https://chzzk.naver.com/${m.channelId}` : "",
      name: m.name,
      roles: {
        팀장: m.roles.includes("팀장"),
        선수: m.roles.includes("선수"),
        감독: m.roles.includes("감독"),
      },
      profileImg: m.profileImg || "",
      memo: m.memo || "",
    });
  };

  // 신규 등록 클릭 (폼 초기화)
  const handleNewMember = () => {
    setSelectedMemberId(null);
    setMemberForm({
      regType: "치지직 연동",
      channelUrl: "",
      name: "",
      roles: { 팀장: false, 선수: true, 감독: false },
      profileImg: "",
      memo: "",
    });
    showFeedback("신규 인원 등록 모드로 전환되었습니다.");
  };

  // 치지직 조회 시뮬레이션
  const handleChzzkLookup = () => {
    if (!memberForm.channelUrl.trim()) {
      showFeedback("치지직 채널 주소 또는 ID를 먼저 입력해주세요.");
      return;
    }
    setChzzkLoading(true);
    const cleanId = memberForm.channelUrl.replace("https://chzzk.naver.com/", "").trim();
    setTimeout(() => {
      setChzzkLoading(false);
      setMemberForm((prev) => ({
        ...prev,
        name: prev.name || cleanId || "치지직스트리머",
        profileImg: `https://api.chzzk.naver.com/avatar/${cleanId || "default"}.png`,
      }));
      showFeedback(`치지직 채널 [${cleanId}] 프로필 및 채널 정보가 연동되었습니다.`);
    }, 450);
  };

  // 인원 저장
  const handleSaveMember = () => {
    const selectedRoles: string[] = [];
    if (memberForm.roles.팀장) selectedRoles.push("팀장");
    if (memberForm.roles.선수) selectedRoles.push("선수");
    if (memberForm.roles.감독) selectedRoles.push("감독");

    if (selectedRoles.length === 0) {
      showFeedback("최소 하나 이상의 역할을 선택해주세요.");
      return;
    }
    if (!memberForm.name.trim()) {
      showFeedback("이름 또는 채널명을 입력해주세요.");
      return;
    }

    if (selectedMemberId) {
      setMembers((prev) =>
        prev.map((item) =>
          item.id === selectedMemberId
            ? {
                ...item,
                name: memberForm.name,
                type: memberForm.regType,
                channelId: memberForm.channelUrl.replace("https://chzzk.naver.com/", ""),
                roles: selectedRoles,
                profileImg: memberForm.profileImg,
                memo: memberForm.memo,
              }
            : item,
        ),
      );
      showFeedback(`[${memberForm.name}] 정보가 성공적으로 수정되었습니다.`);
    } else {
      const newId = `MB-${String(members.length + 1).padStart(3, "0")}`;
      const newItem: MemberItem = {
        id: newId,
        name: memberForm.name,
        type: memberForm.regType,
        channelId: memberForm.channelUrl.replace("https://chzzk.naver.com/", ""),
        roles: selectedRoles,
        followers: memberForm.regType === "치지직 연동" ? "1.2K" : "—",
        registeredDate: new Date().toISOString().split("T")[0],
        profileImg: memberForm.profileImg,
        memo: memberForm.memo,
      };
      setMembers((prev) => [newItem, ...prev]);
      setSelectedMemberId(newId);
      showFeedback(`[${memberForm.name}] 신규 등록이 완료되었습니다.`);
    }
  };

  // 인원 삭제
  const handleDeleteMember = () => {
    if (!selectedMemberId) return;
    const target = members.find((m) => m.id === selectedMemberId);
    setMembers((prev) => prev.filter((m) => m.id !== selectedMemberId));
    handleNewMember();
    showFeedback(`[${target?.name || "항목"}] 삭제되었습니다.`);
  };

  return (
    <section className="space-y-6">
      {/* 1) 메인 타이틀 & 부연 설명 */}
      <AdminPageHeader
        title="팀장·선수·감독 등록"
        description="치지직 채널 연동 또는 일반 등록으로 팀장·선수·감독을 등록하고 복수 역할을 관리할 수 있습니다."
      />

      {/* 2) 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* [좌측 7컬럼] 등록된 인원 조회 카드 */}
        <div className="xl:col-span-7">
          <AdminCard
            title="등록된 인원 조회"
            countBadge={`총 ${filteredMemberList.length}명`}
          >
            {/* 검색 및 필터 박스 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  이름 또는 치지직 채널 ID 검색
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="이름 또는 채널 ID 검색..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-4">
                  {(["선수", "감독", "팀장"] as const).map((role) => (
                    <label
                      key={role}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                        checked={memberRoleFilter[role]}
                        onChange={(e) =>
                          setMemberRoleFilter((p) => ({
                            ...p,
                            [role]: e.target.checked,
                          }))
                        }
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors"
                  onClick={() => {
                    setMemberSearch("");
                    setMemberRoleFilter({ 선수: true, 감독: true, 팀장: true });
                  }}
                >
                  필터 초기화
                </button>
              </div>
            </div>

            {/* 인원 리스트 테이블 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="px-3.5 py-3">이름 / 채널</th>
                    <th className="px-3.5 py-3 w-28">구분</th>
                    <th className="px-3.5 py-3">역할</th>
                    <th className="px-3.5 py-3 w-24">등록일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                  {filteredMemberList.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <tr
                        key={m.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/40 font-medium"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                        onClick={() => handleSelectMember(m)}
                      >
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {m.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {m.name}
                              </div>
                              {m.channelId && (
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                  @{m.channelId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              m.type === "치지직 연동"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {m.type === "치지직 연동" ? "치지직" : "일반"}
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {m.roles.map((r) => (
                              <span
                                key={r}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {m.registeredDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>

        {/* [우측 5컬럼] 등록 / 수정 폼 카드 */}
        <div className="xl:col-span-5">
          <AdminCard
            title="인원 등록 / 정보 관리"
            actions={
              <AdminFormActions
                onSave={handleSaveMember}
                onDelete={selectedMemberId ? handleDeleteMember : undefined}
                onNew={handleNewMember}
                isEditing={!!selectedMemberId}
              />
            }
          >
            <div className="space-y-4">
              {/* 등록 방식 선택 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  등록 방식
                </label>
                <div className="flex gap-2">
                  <label
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                      memberForm.regType === "치지직 연동"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="regType"
                      className="hidden"
                      checked={memberForm.regType === "치지직 연동"}
                      onChange={() =>
                        setMemberForm((p) => ({ ...p, regType: "치지직 연동" }))
                      }
                    />
                    치지직 채널 연동
                  </label>
                  <label
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                      memberForm.regType === "일반 등록"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="regType"
                      className="hidden"
                      checked={memberForm.regType === "일반 등록"}
                      onChange={() =>
                        setMemberForm((p) => ({ ...p, regType: "일반 등록" }))
                      }
                    />
                    일반 등록 (수동)
                  </label>
                </div>
              </div>

              {/* 치지직 연동 시 채널 주소 입력창 */}
              {memberForm.regType === "치지직 연동" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    치지직 채널 주소 <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                      placeholder="예: https://chzzk.naver.com/xxxxxxxx"
                      value={memberForm.channelUrl}
                      onChange={(e) =>
                        setMemberForm((p) => ({ ...p, channelUrl: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shrink-0 disabled:opacity-50"
                      onClick={handleChzzkLookup}
                      disabled={chzzkLoading}
                    >
                      {chzzkLoading ? "조회중..." : "치지직 조회"}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    채널을 조회하면 채널명과 프로필 이미지가 자동으로 연동됩니다.
                  </p>
                </div>
              )}

              {/* 이름 / 표시명 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {memberForm.regType === "치지직 연동" ? "표시 이름" : "이름"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder={
                    memberForm.regType === "치지직 연동"
                      ? "조회 시 자동 입력됩니다 (수정 가능)"
                      : "선수 또는 스트리머 이름을 입력하세요"
                  }
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              {/* 역할 선택 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  역할 (복수 선택 가능) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(["팀장", "선수", "감독"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        memberForm.roles[role]
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                      onClick={() =>
                        setMemberForm((p) => ({
                          ...p,
                          roles: { ...p.roles, [role]: !p.roles[role] },
                        }))
                      }
                    >
                      {memberForm.roles[role] ? "✓ " : ""}
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* 프로필 이미지 URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  프로필 이미지 URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  placeholder="치지직 조회 시 자동 연동되거나 직접 이미지 URL 입력"
                  value={memberForm.profileImg}
                  onChange={(e) =>
                    setMemberForm((p) => ({ ...p, profileImg: e.target.value }))
                  }
                />
              </div>

              {/* 메모 및 특이사항 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  메모 / 특이사항
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="선수의 주 포지션, 모스트 영웅, 티어 또는 특이사항을 기록하세요."
                  value={memberForm.memo}
                  onChange={(e) =>
                    setMemberForm((p) => ({ ...p, memo: e.target.value }))
                  }
                />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* 3) 푸터 안내 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-6 pb-2 border-t border-slate-200 dark:border-slate-800 gap-2 text-center sm:text-left">
        <span className="font-semibold text-slate-600 dark:text-slate-400">ROMS · 팀장·선수·감독 등록 관리</span>
        <span>등록된 팀장·선수·감독 정보는 경기 운영에 사용됩니다.</span>
      </div>
    </section>
  );
}
