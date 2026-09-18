// app/admin/members/page.tsx
/**
 * [회원/선수 관리 페이지 컴포넌트]
 * - 관리자 회원 및 선수 명단 관리 화면 (URL: "/admin/members")
 * - MemberListSection (목록/검색), MemberFormSection (등록/수정), ChzzkSearchModal (치지직 연동 모달)로 모듈화 구성
 */
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import { ChzzkCandidate, MemberFormData, MemberItem } from "@/lib/types/admin";
import { CHZZK_BASE_URL, getChzzkChannelUrl } from "@/lib/constants/codes";
import MemberListSection from "./components/MemberListSection";
import MemberFormSection from "./components/MemberFormSection";
import ChzzkSearchModal from "./components/ChzzkSearchModal";

const INITIAL_FORM_STATE: MemberFormData = {
  isChzzk: true,
  channelUrl: "",
  name: "",
  profileImg: "",
  memo: "",
  isUse: true,
};

export default function AdminMembersPage() {
  const { members, setMembers, showFeedback, isMembersLoading } = useAdmin();

  // 선택된 인원 ID (우측 폼 바인딩용)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // 공통 비동기 저장 훅 (로딩 및 피드백 캡슐화)
  const { execute: mutateMember, isPending: isSaving } = useAdminMutation();

  // 치지직 스트리머 조회 모달 노출 상태
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);

  // 우측 등록/수정 폼 상태
  const [memberForm, setMemberForm] = useState<MemberFormData>(INITIAL_FORM_STATE);

  // 치지직 연동 방식 여부
  const isChzzkType = memberForm.isChzzk;

  // 목록 항목 클릭 시 우측 폼에 바인딩
  const handleSelectMember = (m: MemberItem) => {
    setSelectedMemberId(m.id);
    const isChzzk = Boolean(m.channelId);

    setMemberForm({
      isChzzk: isChzzk,
      channelUrl: getChzzkChannelUrl(m.channelId),
      name: m.name,
      profileImg: m.profileImg || "",
      memo: m.memo || "",
      isUse: m.isUse !== false,
    });
  };

  // 신규 등록 클릭 (폼 초기화)
  const handleNewMember = () => {
    setSelectedMemberId(null);
    setMemberForm(INITIAL_FORM_STATE);
    showFeedback("신규 스트리머 등록 모드로 전환되었습니다.");
  };

  // 치지직 후보 중 선택 적용 함수
  const applySelectedCandidate = (candidate: ChzzkCandidate) => {
    setMemberForm((prev) => ({
      ...prev,
      isChzzk: true,
      channelUrl: `${CHZZK_BASE_URL}/${candidate.channelId}`,
      name: candidate.channelName,
      profileImg: candidate.channelImageUrl || prev.profileImg,
      memo: prev.memo || candidate.channelDescription || "",
    }));
    setIsCandidateModalOpen(false);
    showFeedback(`치지직 [${candidate.channelName}] 채널이 연동되었습니다.`);
  };

  // 스트리머 Supabase DB 저장 (신규 등록 or 수정 - useAdminMutation 적용)
  const handleSaveMember = async () => {
    if (!memberForm.name.trim()) {
      showFeedback("이름 또는 채널명을 입력해주세요.");
      return;
    }

    if (isChzzkType && !memberForm.channelUrl.trim()) {
      showFeedback("[스트리머 조회] 버튼을 통해 연동할 스트리머를 검색 후 선택해주세요.");
      return;
    }

    if (selectedMemberId) {
      // 기존 스트리머 수정 (PUT)
      await mutateMember(
        async () => {
          const res = await fetch("/api/streamers", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: selectedMemberId,
              name: memberForm.name,
              isChzzk: memberForm.isChzzk,
              channelUrl: isChzzkType ? memberForm.channelUrl : "",
              profileImg: memberForm.profileImg,
              memo: memberForm.memo,
              isUse: memberForm.isUse,
            }),
          });
          return res.json();
        },
        {
          successMessage: `[${memberForm.name}] 스트리머 정보가 DB에 저장되었습니다.`,
          errorMessage: "수정에 실패했습니다.",
          onSuccess: (data?: MemberItem) => {
            if (data) {
              setMembers((prev) =>
                prev.map((item) => (item.id === selectedMemberId ? data : item))
              );
            }
          },
        }
      );
    } else {
      // 신규 스트리머 등록 (POST)
      await mutateMember(
        async () => {
          const res = await fetch("/api/streamers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: memberForm.name,
              isChzzk: memberForm.isChzzk,
              channelUrl: isChzzkType ? memberForm.channelUrl : "",
              profileImg: memberForm.profileImg,
              memo: memberForm.memo,
              isUse: memberForm.isUse,
            }),
          });
          return res.json();
        },
        {
          successMessage: `[${memberForm.name}] 스트리머가 DB에 정상 등록되었습니다.`,
          errorMessage: "등록에 실패했습니다.",
          onSuccess: (data?: MemberItem) => {
            if (data) {
              setMembers((prev) => [data, ...prev]);
              setSelectedMemberId(data.id);
            }
          },
        }
      );
    }
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* 2단 분할 레이아웃: 좌측 목록 (7컬럼) + 우측 폼 (5컬럼) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        {/* [좌측 7컬럼] 등록된 인원 조회 카드 */}
        <MemberListSection
          members={members}
          selectedMemberId={selectedMemberId}
          onSelectMember={handleSelectMember}
          isLoading={isMembersLoading}
        />

        {/* [우측 5컬럼] 등록 / 수정 폼 카드 */}
        <MemberFormSection
          selectedMemberId={selectedMemberId}
          form={memberForm}
          setForm={setMemberForm}
          onSave={handleSaveMember}
          onNew={handleNewMember}
          onOpenStreamerModal={() => setIsCandidateModalOpen(true)}
          isSaving={isSaving}
        />
      </div>

      {/* 치지직 스트리머 조회 및 검색 모달 */}
      <ChzzkSearchModal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        onSelect={applySelectedCandidate}
        showFeedback={showFeedback}
      />
    </section>
  );
}
