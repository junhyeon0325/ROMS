"use client";

import React, { useState, useEffect } from "react";
import { getChzzkChannelUrl } from "@/lib/constants/codes";
import { MemberAvatar } from "@/components/admin/AdminAvatar";
import AdminModal from "@/components/admin/AdminModal";
import { ChzzkCandidate } from "@/lib/types/admin";

// 치지직 후보 스트리머 인터페이스
interface ChzzkSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (candidate: ChzzkCandidate) => void;
  showFeedback: (msg: string) => void;
}

export default function ChzzkSearchModal({
  isOpen,
  onClose,
  onSelect,
  showFeedback,
}: ChzzkSearchModalProps) {
  const [modalQuery, setModalQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [candidates, setCandidates] = useState<ChzzkCandidate[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setModalQuery("");
      setCandidates([]);
      setHasSearched(false);
      setSearchedQuery("");
    }
  }, [isOpen]);

  // 치지직 검색 API 호출
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = modalQuery.trim();
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

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      bodyClassName="flex-1 flex flex-col min-h-0 overflow-hidden"
      title={
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            치지직 스트리머 조회
          </span>
          {hasSearched && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
              검색 결과 {candidates.length}건
            </span>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            원하는 스트리머를 [선택]하면 채널 주소와 프로필이 자동으로 연동됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      }
    >
      {/* 모달 내부 검색 바 */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
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
                onClick={() => onSelect(cand)}
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
                    href={getChzzkChannelUrl(cand.channelId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                    title="치지직 채널 바로가기 새창 열기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(cand);
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
    </AdminModal>
  );
}
