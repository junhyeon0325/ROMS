// components/admin/AdminAvatar.tsx
/**
 * [관리자 공통 아바타 컴포넌트]
 * - 프로필 이미지 표시 및 로드 실패(onError) / 미등록 시 이름 첫 글자 이니셜 아바타 대체
 * - 회원/선수, 스트리머, 치지직 검색 모달, 관리자 프로필 등에서 공용으로 사용
 */
"use client";

import React, { useState, useEffect } from "react";

export interface AdminAvatarProps {
  /** 표시할 대상 이름 (이니셜 추출용) */
  name: string;
  /** 이미지 URL (없거나 깨졌을 경우 이니셜로 대체) */
  profileImg?: string | null;
  /** Tailwind 크기 및 텍스트 클래스 (기본값: 'w-8 h-8 text-xs') */
  size?: string;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

export default function AdminAvatar({
  name,
  profileImg,
  size = "w-8 h-8 text-xs",
  className = "",
}: AdminAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // profileImg 변경 시 에러 상태 리셋
  useEffect(() => {
    setHasError(false);
  }, [profileImg]);

  if (!profileImg || hasError) {
    const initial = (name || "?").trim().slice(0, 1).toUpperCase();
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs select-none ${className}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={profileImg}
      alt={name}
      className={`${size} rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

// 하위 호환성을 위한 별칭 export
export { AdminAvatar, AdminAvatar as MemberAvatar };
