// File: app/admin/streamers/components/ChzzkSearchModal.tsx
// Page/Component: ChzzkSearchModal
// Purpose: 치지직 채널을 검색하고 등록 상태를 확인한 뒤 하나의 채널만 스트리머 폼에 반영한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminAvatar from "@/components/admin/AdminAvatar";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import { getChzzkChannelUrl } from "@/lib/streamers/chzzk";
import type {
  ChzzkChannelCandidate as ChzzkCandidate,
  StreamerItem,
} from "@/lib/types/streamers";

interface ChzzkSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (candidate: ChzzkCandidate) => void;
  registeredByChannelId: Map<string, StreamerItem>;
  selectedStreamerId: string | null;
  showFeedback: (msg: string) => void;
}

type SearchResultState = "idle" | "not-found" | "error";

// 치지직 API 검색 결과를 표 형식의 단일 선택 목록으로 제공한다.
export default function ChzzkSearchModal({
  isOpen,
  onClose,
  onSelect,
  registeredByChannelId,
  selectedStreamerId,
  showFeedback,
}: ChzzkSearchModalProps) {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [candidates, setCandidates] = useState<ChzzkCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [resultState, setResultState] = useState<SearchResultState>("idle");

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setSearchedQuery("");
    setCandidates([]);
    setSelectedChannelId(null);
    setResultState("idle");
  }, [isOpen]);

  // 검색어로 치지직 채널 후보를 조회하고, 실패 원인을 표의 빈 상태로 구분한다.
  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      showFeedback("검색할 스트리머 닉네임이나 채널 주소를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setSearchedQuery(trimmedQuery);
    setCandidates([]);
    setSelectedChannelId(null);
    setResultState("idle");
    try {
      const response = await fetch(
        `/api/chzzk?query=${encodeURIComponent(trimmedQuery)}`,
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        setResultState(response.status === 404 ? "not-found" : "error");
        return;
      }
      const channelList: ChzzkCandidate[] =
        result.channels || (result.channel ? [result.channel] : []);
      setCandidates(channelList);
      setResultState(channelList.length ? "idle" : "not-found");
    } catch {
      setResultState("error");
    } finally {
      setIsLoading(false);
    }
  };

  // 다른 스트리머에 연결된 채널은 중복 연결을 막고, 현재 편집 대상의 채널만 다시 선택할 수 있게 한다.
  const getChannelStatus = (candidate: ChzzkCandidate) => {
    const registeredStreamer = registeredByChannelId.get(candidate.channelId);
    const isCurrentStreamer = registeredStreamer?.id === selectedStreamerId;
    return {
      registeredStreamer,
      isCurrentStreamer,
      isSelectable: !registeredStreamer || isCurrentStreamer,
    };
  };

  // 행 또는 라디오 버튼 클릭 시 등록 가능한 후보 하나만 선택한다.
  const handleSelectCandidate = (candidate: ChzzkCandidate) => {
    if (!getChannelStatus(candidate).isSelectable) {
      showFeedback("이미 다른 스트리머에 연동된 치지직 채널입니다.");
      return;
    }
    setSelectedChannelId(candidate.channelId);
  };

  const selectedCandidate = useMemo(
    () =>
      candidates.find(
        (candidate) => candidate.channelId === selectedChannelId,
      ) ?? null,
    [candidates, selectedChannelId],
  );
  const columns: AdminTableColumn<ChzzkCandidate>[] = useMemo(
    () => [
      {
        key: "select",
        header: "선택",
        width: "w-16",
        align: "center",
        render: (candidate) => {
          const { isSelectable } = getChannelStatus(candidate);
          return (
            <input
              type="radio"
              name="chzzk-channel"
              checked={selectedChannelId === candidate.channelId}
              disabled={!isSelectable}
              onClick={(event) => event.stopPropagation()}
              onChange={() => handleSelectCandidate(candidate)}
              className="h-3.5 w-3.5 border-slate-300 text-[#f99e1a] accent-[#f99e1a] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`${candidate.channelName} 선택`}
            />
          );
        },
      },
      {
        key: "channelName",
        header: "스트리머 / 채널",
        width: "min-w-[240px]",
        render: (candidate) => (
          <div className="flex items-center gap-2.5">
            <AdminAvatar
              name={candidate.channelName}
              profileImg={candidate.channelImageUrl || undefined}
              size="w-9 h-9 text-xs"
            />
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                {candidate.channelName}
              </p>
              <a
                href={getChzzkChannelUrl(candidate.channelId)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                title="치지직 채널 바로가기"
              >
                치지직 바로가기 <span className="text-[9px] leading-none">↗</span>
              </a>
            </div>
          </div>
        ),
      },
      {
        key: "followerCount",
        header: "팔로워",
        width: "w-24",
        render: (candidate) => (
          <span className="text-[11px] text-slate-500">
            {candidate.followerText}명
          </span>
        ),
      },
      {
        key: "channelDescription",
        header: "소개",
        width: "min-w-[180px]",
        render: (candidate) => (
          <span className="line-clamp-1 text-[11px] text-slate-500">
            {candidate.channelDescription || "-"}
          </span>
        ),
      },
      {
        key: "status",
        header: "상태",
        width: "w-32",
        render: (candidate) => {
          const { registeredStreamer, isCurrentStreamer } =
            getChannelStatus(candidate);
          if (!registeredStreamer)
            return <AdminBadge variant="neutral">신규 등록 가능</AdminBadge>;
          if (isCurrentStreamer)
            return <AdminBadge variant="brand">현재 연동 채널</AdminBadge>;
          return <AdminBadge variant="success">이미 연동됨</AdminBadge>;
        },
      },
    ],
    [registeredByChannelId, selectedChannelId, selectedStreamerId],
  );

  // 검색 전·결과 없음·통신 오류를 동일한 표 영역에서 명확히 안내한다.
  const renderEmpty = () => {
    if (resultState === "not-found")
      return (
        <>
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            ‘{searchedQuery}’에 대한 검색 결과가 없습니다.
          </p>
          <p className="mt-1 text-[11px]">
            채널명 철자 또는 치지직 채널 고유 주소를 확인해주세요.
          </p>
        </>
      );
    if (resultState === "error")
      return (
        <>
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            치지직 채널 검색에 실패했습니다.
          </p>
          <p className="mt-1 text-[11px]">잠시 후 다시 시도해주세요.</p>
        </>
      );
    return (
      <>
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          등록할 스트리머를 검색해주세요.
        </p>
        <p className="mt-1 text-[11px]">
          채널명 또는 치지직 채널 주소로 조회할 수 있습니다.
        </p>
      </>
    );
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="치지직 스트리머 조회"
      description="검색 결과에서 하나의 채널을 선택해 스트리머 등록 폼에 반영합니다. 이미 다른 스트리머에 연동된 채널은 선택할 수 없습니다."
      maxWidth="4xl"
      bodyClassName="p-5 overflow-y-auto flex-1 min-h-0 space-y-4"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            {selectedCandidate
              ? `[${selectedCandidate.channelName}] 채널 선택됨`
              : "연동할 채널 하나를 선택해주세요."}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => selectedCandidate && onSelect(selectedCandidate)}
              disabled={!selectedCandidate}
              className="rounded-lg bg-[#f99e1a] px-3.5 py-1.5 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              선택 반영
            </button>
          </div>
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
      >
        <AdminSearchInput
          label="치지직 스트리머 검색"
          placeholder="스트리머 닉네임 또는 채널 주소를 입력하세요..."
          value={query}
          onChange={setQuery}
        />
      </form>
      <div className="h-[420px] shrink-0">
        <AdminTable
          columns={columns}
          data={candidates}
          keyField="channelId"
          selectedId={selectedChannelId}
          onRowClick={handleSelectCandidate}
          isLoading={isLoading}
          emptyIcon="🔎"
          emptyTitle="검색 결과가 없습니다."
          renderEmpty={renderEmpty}
        />
      </div>
    </AdminModal>
  );
}
