// app/admin/members/page.tsx
/**
 * [회원/선수 관리 페이지 컴포넌트]
 * - 관리자 회원 및 선수 명단 관리 화면 (URL: "/admin/members")
 * - 회원 검색/필터링 목록, 신규 회원 등록 및 기본 정보 수정 폼 제공
 */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { MemberItem, CodeItem } from "@/lib/types/admin";
import { CODE_GROUPS, STREAMER_REG_CODES, CHZZK_BASE_URL } from "@/lib/constants/codes";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";
import AdminAvatar, { MemberAvatar } from "@/components/admin/AdminAvatar";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { useCommonCodes } from "@/lib/hooks/useCommonCodes";

// 치지직 후보 스트리머 인터페이스
interface ChzzkCandidate {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount: number;
  followerText: string;
  channelDescription: string;
  openLive?: boolean;
  verifiedMark?: boolean;
}

export default function AdminMembersPage() {
  const { members, setMembers, showFeedback, refreshMembers } = useAdmin();

  // 1. 공통코드: 스트리머 등록 방식 그룹 전용 비동기 로드 (공통 훅 사용)
  const { codes: regTypeCodes } = useCommonCodes(CODE_GROUPS.STREAMER_REGISTRATION);

  // 2. 구분 필터 탭 옵션 (UI 전용 상수 '전체(ALL)' + 공통코드 동적 매핑)
  const filterTabs = useMemo(() => {
    return [
      { code: "ALL", name: "전체" },
      ...regTypeCodes.map((c: CodeItem) => ({ code: c.code, name: c.name })),
    ];
  }, [regTypeCodes]);

  // 검색 & 구분 필터 상태 (기본값: UI 상수 'ALL')
  const [nameSearch, setNameSearch] = useState("");
  const [memoSearch, setMemoSearch] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>("ALL");

  // 선택된 인원 ID (우측 폼 바인딩용)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 치지직 스트리머 조회 모달 상태
  const [candidates, setCandidates] = useState<ChzzkCandidate[]>([]);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [modalQuery, setModalQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 공통코드 중 치지직 연동에 해당하는 세부코드 동적 탐색 (코드값 기준)
  const chzzkCodeItem = useMemo(() => {
    return regTypeCodes.find((c) => c.code === STREAMER_REG_CODES.CHZZK);
  }, [regTypeCodes]);

  // 치지직 기본 코드값 (공통코드에서 동적으로 추출, 미로드 시 빈값)
  const defaultChzzkCode = chzzkCodeItem?.code || "";

  // 우측 등록 폼 상태
  const [memberForm, setMemberForm] = useState<{
    regType: string;
    channelUrl: string;
    name: string;
    profileImg: string;
    memo: string;
  }>({
    regType: "",
    channelUrl: "",
    name: "",
    profileImg: "",
    memo: "",
  });

  // 공통코드가 로드되었을 때 아직 regType이 비어있으면 치지직 우선 또는 첫 번째 코드로 자동 지정
  useEffect(() => {
    if (!memberForm.regType && regTypeCodes.length > 0) {
      setMemberForm((prev) => ({
        ...prev,
        regType: defaultChzzkCode || regTypeCodes[0].code,
      }));
    }
  }, [regTypeCodes, memberForm.regType, defaultChzzkCode]);

  // 치지직 연동 방식 여부 헬퍼 (공통코드 동적 매칭, 공통코드 미로드 시 비활성화)
  const isChzzkType = Boolean(
    chzzkCodeItem && memberForm.regType === chzzkCodeItem.code
  );

  // 인원 필터링 (이름/채널, 메모, 등록 구분 조건별 분리)
  const filteredMemberList = members.filter((m) => {
    const matchName =
      !nameSearch.trim() ||
      m.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
      (m.channelId && m.channelId.toLowerCase().includes(nameSearch.toLowerCase()));

    const matchMemo =
      !memoSearch.trim() ||
      (m.memo && m.memo.toLowerCase().includes(memoSearch.toLowerCase()));

    const selectedFilterObj = regTypeCodes.find((c) => c.code === memberTypeFilter);
    const matchType =
      memberTypeFilter === "ALL" ||
      m.type === memberTypeFilter ||
      (selectedFilterObj && (m.type === selectedFilterObj.code || m.type === selectedFilterObj.name));

    return matchName && matchMemo && matchType;
  });

  // 목록 항목 클릭 시 우측 폼에 바인딩
  const handleSelectMember = (m: MemberItem) => {
    setSelectedMemberId(m.id);
    const matched = regTypeCodes.find(
      (c) => c.code === m.type || c.name === m.type
    );

    setMemberForm({
      regType: matched?.code || m.type || "",
      channelUrl: m.channelId ? (m.channelId.startsWith("http") ? m.channelId : `${CHZZK_BASE_URL}/${m.channelId}`) : "",
      name: m.name,
      profileImg: m.profileImg || "",
      memo: m.memo || "",
    });
  };

  // 신규 등록 클릭 (폼 초기화)
  const handleNewMember = () => {
    setSelectedMemberId(null);
    setMemberForm({
      regType: defaultChzzkCode || regTypeCodes[0]?.code || "",
      channelUrl: "",
      name: "",
      profileImg: "",
      memo: "",
    });
    showFeedback("신규 스트리머 등록 모드로 전환되었습니다.");
  };

  // 치지직 후보 중 선택 적용 함수
  const applySelectedCandidate = (candidate: ChzzkCandidate) => {
    setMemberForm((prev) => ({
      ...prev,
      regType: defaultChzzkCode || prev.regType,
      channelUrl: `${CHZZK_BASE_URL}/${candidate.channelId}`,
      name: candidate.channelName,
      profileImg: candidate.channelImageUrl || prev.profileImg,
      memo: prev.memo || candidate.channelDescription || "",
    }));
    setIsCandidateModalOpen(false);
    showFeedback(`치지직 [${candidate.channelName}] 채널이 연동되었습니다.`);
  };

  // 모달 내 치지직 스트리머 검색 함수
  const searchChzzkStreamers = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      showFeedback("검색할 스트리머 닉네임이나 채널 주소를 입력해주세요.");
      return;
    }
    setModalLoading(true);
    setSearchedQuery(trimmed);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/chzzk?query=${encodeURIComponent(trimmed)}`);
      const result = await res.json();
      if (result.success) {
        const channelList: ChzzkCandidate[] =
          result.channels || (result.channel ? [result.channel] : []);
        setCandidates(channelList);
      } else {
        setCandidates([]);
        showFeedback(result.message || "치지직 채널을 찾을 수 없습니다.");
      }
    } catch (e: any) {
      setCandidates([]);
      showFeedback("치지직 채널 조회 중 통신 오류가 발생했습니다.");
    } finally {
      setModalLoading(false);
    }
  };

  // '스트리머 조회' 버튼 클릭 시 모달 열기
  const handleOpenStreamerModal = () => {
    setModalQuery("");
    setCandidates([]);
    setHasSearched(false);
    setIsCandidateModalOpen(true);
  };

  // 스트리머 Supabase DB 저장 (신규 등록 or 수정)
  const handleSaveMember = async () => {
    if (!memberForm.name.trim()) {
      showFeedback("이름 또는 채널명을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedMemberId) {
        // 기존 스트리머 수정 (PUT)
        const res = await fetch("/api/streamers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedMemberId,
            name: memberForm.name,
            regType: memberForm.regType,
            channelUrl: isChzzkType ? memberForm.channelUrl : "",
            profileImg: memberForm.profileImg,
            memo: memberForm.memo,
          }),
        });
        const result = await res.json();
        if (result.success && result.data) {
          setMembers((prev) =>
            prev.map((item) => (item.id === selectedMemberId ? result.data : item))
          );
          showFeedback(`[${memberForm.name}] 스트리머 정보가 DB에 저장되었습니다.`);
        } else {
          showFeedback(result.message || "수정에 실패했습니다.");
        }
      } else {
        // 신규 스트리머 등록 (POST)
        const res = await fetch("/api/streamers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: memberForm.name,
            regType: memberForm.regType,
            channelUrl: isChzzkType ? memberForm.channelUrl : "",
            profileImg: memberForm.profileImg,
            memo: memberForm.memo,
          }),
        });
        const result = await res.json();
        if (result.success && result.data) {
          setMembers((prev) => [result.data, ...prev]);
          setSelectedMemberId(result.data.id);
          showFeedback(`[${memberForm.name}] 스트리머가 DB에 정상 등록되었습니다.`);
        } else {
          showFeedback(result.message || "등록에 실패했습니다.");
        }
      }
    } catch (e: any) {
      showFeedback("DB 저장 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 스트리머 Supabase DB 삭제 (DELETE)
  const handleDeleteMember = async () => {
    if (!selectedMemberId) return;
    const target = members.find((m) => m.id === selectedMemberId);
    if (!confirm(`[${target?.name || "스트리머"}] 정말 DB에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/streamers?id=${selectedMemberId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== selectedMemberId));
        handleNewMember();
        showFeedback(`[${target?.name || "항목"}] DB에서 삭제되었습니다.`);
      } else {
        showFeedback(result.message || "삭제에 실패했습니다.");
      }
    } catch (e) {
      showFeedback("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        {/* [좌측 7컬럼] 등록된 인원 조회 카드 */}
        <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
          <AdminCard
            title="등록된 스트리머 조회"
            countBadge={`총 ${filteredMemberList.length}명`}
            className="h-full"
            actions={
              <button
                type="button"
                disabled={!nameSearch && !memoSearch && memberTypeFilter === "ALL"}
                onClick={() => {
                  setNameSearch("");
                  setMemoSearch("");
                  setMemberTypeFilter("ALL");
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                title="검색 조건 초기화"
              >
                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>조건 초기화</span>
              </button>
            }
          >
            {/* 검색 및 필터 박스 (한 라인 4분할 1/4 크기 그리드 레이아웃) */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3 shrink-0">
              {/* 한 라인 4분할(1/4 크기) 그리드 - 향후 검색 조건 확장 지원 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. 이름 / 채널 검색 (1/4) */}
                <AdminSearchInput
                  label="이름 / 채널 검색"
                  placeholder="이름 또는 채널 ID..."
                  value={nameSearch}
                  onChange={setNameSearch}
                />

                {/* 2. 메모 / 특이사항 검색 (1/4) */}
                <AdminSearchInput
                  label="메모 / 특이사항 검색"
                  placeholder="메모 내용 검색..."
                  value={memoSearch}
                  onChange={setMemoSearch}
                  icon={
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  }
                />

                {/* 3. 구분 필터 (1/4 - 직관적인 탭 버튼 형태: 상수로 정의된 전체 + 공통코드) */}
                <AdminFilterTabs
                  label="구분"
                  tabs={filterTabs}
                  activeTab={memberTypeFilter}
                  onChange={setMemberTypeFilter}
                />

                {/* 4. 향후 추가 검색 조건 확장용 슬롯 (1/4 빈 영역) */}
                <div className="hidden lg:block">
                  {/* 빈 슬롯: 향후 신규 검색 필터 추가 시 배치 */}
                </div>
              </div>
            </div>

            {/* 인원 리스트 테이블 (그리드 내부 스크롤) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-scrollbar relative">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#151c2e] shadow-2xs">
                  <tr className="text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="px-3.5 py-2.5 bg-slate-100 dark:bg-[#151c2e]">이름 / 채널</th>
                    <th className="px-3.5 py-2.5 w-28 whitespace-nowrap bg-slate-100 dark:bg-[#151c2e]">구분</th>
                    <th className="px-3.5 py-2.5 bg-slate-100 dark:bg-[#151c2e]">메모 / 특이사항</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                  {filteredMemberList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3.5 py-16 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">
                            {members.length === 0 ? "👤" : "🔍"}
                          </span>
                          <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            {members.length === 0
                              ? "등록된 스트리머가 없습니다."
                              : "검색 조건에 일치하는 스트리머가 없습니다."}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {members.length === 0
                              ? "우측 등록 폼에서 새로운 스트리머를 등록해주세요."
                              : "이름 또는 메모 검색 조건, 구분 필터를 변경해보세요."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMemberList.map((m) => {
                      const isSelected = selectedMemberId === m.id;
                      return (
                        <tr
                          key={m.id}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-amber-500/10 dark:bg-amber-500/15 font-medium"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                          onClick={() => handleSelectMember(m)}
                        >
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2.5">
                              <MemberAvatar name={m.name} profileImg={m.profileImg} />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                  {m.name}
                                </div>
                                {m.channelId && (
                                  <a
                                    href={m.channelId.startsWith("http") ? m.channelId : `${CHZZK_BASE_URL}/${m.channelId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono hover:underline flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                    title={`치지직 채널 바로가기: ${m.channelId}`}
                                  >
                                    @{m.channelId.length > 12 ? `${m.channelId.slice(0, 10)}...` : m.channelId}
                                    <span className="text-[9px]">↗</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {(() => {
                              const matchedCode = regTypeCodes.find(
                                (c) => c.code === m.type || c.name === m.type
                              );
                              const isChzzk = Boolean(
                                chzzkCodeItem && (matchedCode?.code === chzzkCodeItem.code || m.type === STREAMER_REG_CODES.CHZZK)
                              );
                              const displayName =
                                matchedCode?.name ||
                                (m.type === STREAMER_REG_CODES.CHZZK
                                  ? "치지직 연동"
                                  : m.type === STREAMER_REG_CODES.STANDARD
                                  ? "일반 등록"
                                  : m.type || "—");
                              return (
                                <span
                                  className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                                    isChzzk
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  {displayName}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-3.5 py-3 text-slate-500 dark:text-slate-400">
                            <span className="line-clamp-1 text-[11px]">
                              {m.memo || "—"}
                            </span>
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

        {/* [우측 5컬럼] 등록 / 수정 폼 카드 */}
        <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
          <AdminCard
            title={selectedMemberId ? "스트리머 정보 수정" : "스트리머 신규 등록"}
            className="h-full"
            actions={
              <AdminFormActions
                onSave={handleSaveMember}
                onDelete={selectedMemberId ? handleDeleteMember : undefined}
                onNew={handleNewMember}
                isEditing={!!selectedMemberId}
                saveLabel={isSaving ? "저장중..." : "저장"}
              />
            }
          >
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
              {/* 등록 방식 선택 (공통코드 동적 매핑, 미로드 시 미노출) */}
              {regTypeCodes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    등록 방식
                  </label>
                  <div className="flex gap-2">
                    {regTypeCodes.map((c) => {
                      const isChecked = memberForm.regType === c.code;
                      return (
                        <label
                          key={c.code}
                          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? "bg-[#f99e1a] text-slate-950 font-bold border-[#f99e1a] shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <input
                            type="radio"
                            name="regType"
                            className="hidden"
                            checked={isChecked}
                            onChange={() =>
                              setMemberForm((p) => ({ ...p, regType: c.code }))
                            }
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 치지직 연동 시 채널 주소 입력창 */}
              {isChzzkType && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    치지직 채널 주소 <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all font-mono"
                      placeholder="예: https://chzzk.naver.com/xxxxxxxx"
                      value={memberForm.channelUrl}
                      onChange={(e) =>
                        setMemberForm((p) => ({ ...p, channelUrl: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      onClick={handleOpenStreamerModal}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>스트리머 조회</span>
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    [스트리머 조회] 버튼을 누르면 검색창에서 원하는 스트리머를 찾아 바로 연동할 수 있습니다.
                  </p>
                </div>
              )}

              {/* 이름 / 표시명 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isChzzkType ? "표시 이름" : "이름"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                  placeholder={
                    isChzzkType
                      ? "조회 시 자동 입력됩니다 (수정 가능)"
                      : "선수 또는 스트리머 이름을 입력하세요"
                  }
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              {/* 프로필 이미지 URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  프로필 이미지 URL
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all font-mono"
                    placeholder="치지직 조회 시 자동 연동되거나 직접 이미지 URL 입력"
                    value={memberForm.profileImg}
                    onChange={(e) =>
                      setMemberForm((p) => ({ ...p, profileImg: e.target.value }))
                    }
                  />
                  {memberForm.profileImg && (
                    <div className="shrink-0" title="프로필 이미지 미리보기">
                      <MemberAvatar name={memberForm.name || "미리보기"} profileImg={memberForm.profileImg} />
                    </div>
                  )}
                </div>
              </div>

              {/* 메모 및 특이사항 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  메모 / 주 포지션 및 특이사항
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all resize-none"
                  placeholder="스트리머의 주 포지션(탱커/딜러/힐러), 모스트 영웅, 티어 또는 특이사항을 기록하세요."
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
      {/* 치지직 스트리머 조회 및 검색 모달 */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  치지직 스트리머 조회
                </h3>
                {hasSearched && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
                    검색 결과 {candidates.length}건
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCandidateModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* 모달 내부 검색 바 */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  searchChzzkStreamers(modalQuery);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all font-medium"
                    placeholder="스트리머 닉네임 또는 채널 주소를 입력하세요..."
                    value={modalQuery}
                    onChange={(e) => setModalQuery(e.target.value)}
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {modalLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>검색중...</span>
                    </>
                  ) : (
                    <span>검색</span>
                  )}
                </button>
              </form>
            </div>

            {/* 후보 리스트 및 상태 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar min-h-[260px] max-h-[460px]">
              {modalLoading ? (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <div className="w-7 h-7 border-2 border-[#f99e1a] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    치지직 스트리머를 조회하고 있습니다...
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    잠시만 기다려주세요.
                  </p>
                </div>
              ) : !hasSearched ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-3 shadow-2xs">
                    🔍
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    등록할 스트리머를 검색해주세요
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                    상단 검색창에 스트리머 닉네임 또는 채널 주소를 입력한 뒤 검색 버튼을 누르세요.
                  </p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mb-3">
                    👀
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ‘{searchedQuery}’에 대한 검색 결과가 없습니다
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                    철자를 확인하시거나, 치지직 웹페이지의 채널 고유 주소(URL)를 입력해주세요.
                  </p>
                </div>
              ) : (
                candidates.map((cand) => (
                  <div
                    key={cand.channelId}
                    onClick={() => applySelectedCandidate(cand)}
                    className="group relative p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 hover:border-[#f99e1a] dark:hover:border-[#f99e1a] transition-all cursor-pointer flex items-center justify-between gap-3.5 shadow-2xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* 아바타 */}
                      <MemberAvatar
                        name={cand.channelName}
                        profileImg={cand.channelImageUrl || undefined}
                        size="w-10 h-10 text-sm"
                      />

                      {/* 스트리머 정보 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {cand.channelName}
                          </span>
                          {cand.verifiedMark && (
                            <span
                              className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-semibold"
                              title="치지직 공식 파트너"
                            >
                              공식
                            </span>
                          )}
                          {cand.openLive && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bold">
                              ● LIVE
                            </span>
                          )}
                        </div>

                        {/* 팔로워 & 채널 ID */}
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            팔로워 {cand.followerText}명
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            ID: {cand.channelId.slice(0, 8)}...
                          </span>
                        </div>

                        {/* 소개글 */}
                        {cand.channelDescription && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                            {cand.channelDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 우측 버튼 영역 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`${CHZZK_BASE_URL}/${cand.channelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                        title="치지직 채널 바로가기 새창 열기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySelectedCandidate(cand);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 group-hover:bg-[#f99e1a] group-hover:text-slate-950 transition-colors shadow-2xs cursor-pointer"
                      >
                        선택
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                원하는 스트리머를 [선택]하면 채널 주소와 프로필이 자동으로 연동됩니다.
              </span>
              <button
                type="button"
                onClick={() => setIsCandidateModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
