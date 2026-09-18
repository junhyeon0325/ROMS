"use client";

import React, { useState, useMemo } from "react";
import { MemberItem } from "@/lib/types/admin";
import { getChzzkChannelUrl } from "@/lib/constants/codes";
import AdminCard from "@/components/admin/AdminCard";
import AdminFilterPanel from "@/components/admin/AdminFilterPanel";
import { MemberAvatar } from "@/components/admin/AdminAvatar";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";

interface MemberListSectionProps {
  members: MemberItem[];
  selectedMemberId: string | null;
  onSelectMember: (member: MemberItem) => void;
  isLoading: boolean;
}

export default function MemberListSection({
  members,
  selectedMemberId,
  onSelectMember,
  isLoading,
}: MemberListSectionProps) {
  // 1. 구분 필터 탭 옵션 (치지직 연동 여부 기반)
  const filterTabs = useMemo(
    () => [
      { code: "ALL", name: "전체" },
      { code: "CHZZK", name: "치지직 연동" },
      { code: "STANDARD", name: "일반 등록" },
    ],
    []
  );

  // 2. 사용 상태 필터 탭 옵션 (활성 / 비활성)
  const statusFilterTabs = useMemo(
    () => [
      { code: "ALL", name: "전체" },
      { code: "ACTIVE", name: "사용중" },
      { code: "INACTIVE", name: "미사용" },
    ],
    []
  );

  // 검색 & 구분 필터 상태
  const [nameSearch, setNameSearch] = useState("");
  const [memoSearch, setMemoSearch] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // 인원 필터링 (이름/채널, 메모, 치지직 연동 구분, 사용 상태별)
  const filteredMemberList = useMemo(() => {
    return members.filter((m) => {
      const matchName =
        !nameSearch.trim() ||
        m.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
        (m.channelId && m.channelId.toLowerCase().includes(nameSearch.toLowerCase()));

      const matchMemo =
        !memoSearch.trim() ||
        (m.memo && m.memo.toLowerCase().includes(memoSearch.toLowerCase()));

      const matchType =
        memberTypeFilter === "ALL" ||
        (memberTypeFilter === "CHZZK" && Boolean(m.channelId)) ||
        (memberTypeFilter === "STANDARD" && !m.channelId);

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && m.isUse !== false) ||
        (statusFilter === "INACTIVE" && m.isUse === false);

      return matchName && matchMemo && matchType && matchStatus;
    });
  }, [members, nameSearch, memoSearch, memberTypeFilter, statusFilter]);

  // 검색 초기화 가능 여부
  const isFilterActive =
    Boolean(nameSearch) ||
    Boolean(memoSearch) ||
    memberTypeFilter !== "ALL" ||
    statusFilter !== "ALL";

  const handleResetFilters = () => {
    setNameSearch("");
    setMemoSearch("");
    setMemberTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  // 스트리머 목록 테이블 컬럼 정의 (공통 AdminTable 적용)
  const streamerColumns: AdminTableColumn<MemberItem>[] = useMemo(
    () => [
      {
        key: "name",
        header: "이름 / 채널",
        width: "min-w-[140px] whitespace-nowrap",
        cellClassName: "whitespace-nowrap",
        render: (m) => (
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <div className="shrink-0">
              <MemberAvatar name={m.name} profileImg={m.profileImg} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                {m.name}
              </div>
              {m.channelId && (
                <a
                  href={getChzzkChannelUrl(m.channelId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 mt-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  title={`치지직 채널 바로가기 (${m.channelId})`}
                >
                  <span className="whitespace-nowrap">치지직 바로가기</span>
                  <span className="text-[9px] leading-none shrink-0">↗</span>
                </a>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: "구분",
        width: "w-24 whitespace-nowrap",
        cellClassName: "whitespace-nowrap",
        render: (m) => {
          const isChzzk = Boolean(m.channelId);
          return (
            <AdminBadge variant={isChzzk ? "success" : "neutral"}>
              {isChzzk ? "치지직 연동" : "일반 등록"}
            </AdminBadge>
          );
        },
      },
      {
        key: "isUse",
        header: "상태",
        width: "w-20 whitespace-nowrap",
        cellClassName: "whitespace-nowrap",
        render: (m) => <AdminBadge status={m.isUse !== false} />,
      },
      {
        key: "memo",
        header: "메모 / 특이사항",
        render: (m) => (
          <span className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
            {m.memo || "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
      <AdminCard
        title="등록된 스트리머 조회"
        countBadge={`총 ${filteredMemberList.length}명`}
        className="h-full"
        actions={
          <button
            type="button"
            disabled={!isFilterActive}
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="검색 조건 초기화"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>조건 초기화</span>
          </button>
        }
      >
        {/* 검색 및 필터 박스 (한 라인 4분할 1/4 크기 그리드 레이아웃) */}
        <AdminFilterPanel>
            {/* 1. 이름 / 채널 검색 (1/4) */}
            <AdminSearchInput
              label="이름 / 채널 검색"
              placeholder="이름 또는 채널 ID..."
              value={nameSearch}
              onChange={setNameSearch}
              containerClassName="lg:col-span-3"
            />

            {/* 2. 메모 / 특이사항 검색 (1/4) */}
            <AdminSearchInput
              label="메모 / 특이사항 검색"
              placeholder="메모 내용 검색..."
              value={memoSearch}
              onChange={setMemoSearch}
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              }
              containerClassName="lg:col-span-3"
            />

            {/* 3. 구분 필터 (1/4 - 전체 / 치지직 연동 / 일반 등록) */}
            <AdminFilterTabs
              label="구분"
              tabs={filterTabs}
              activeTab={memberTypeFilter}
              onChange={setMemberTypeFilter}
              containerClassName="lg:col-span-3"
            />

            {/* 4. 사용 상태 필터 (1/4 - 전체 / 사용중 / 미사용) */}
            <AdminFilterTabs
              label="상태"
              tabs={statusFilterTabs}
              activeTab={statusFilter}
              onChange={setStatusFilter}
              containerClassName="lg:col-span-3"
            />
        </AdminFilterPanel>

        {/* 스트리머 목록 테이블 (공통 AdminTable 컴포넌트) */}
        <AdminTable<MemberItem>
          columns={streamerColumns}
          data={filteredMemberList}
          keyField="id"
          selectedId={selectedMemberId}
          onRowClick={onSelectMember}
          isLoading={isLoading}
          renderEmpty={() => (
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
                  : "이름 또는 메모 검색 조건, 구분/상태 필터를 변경해보세요."}
              </p>
            </div>
          )}
        />
      </AdminCard>
    </div>
  );
}
