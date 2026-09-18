// lib/types/admin.ts
// ROMS 관리자 페이지 공통 타입 정의

export interface MemberItem {
  id: string;
  name: string;
  type: string; // '치지직 연동' | '일반 등록' (또는 'CHZZK' | 'STANDARD')
  isChzzk?: boolean;
  channelId?: string;
  roles?: string[]; // 대회 참여 시 배정되거나 이전 데이터 호환용
  followers: string;
  registeredDate: string;
  profileImg?: string;
  memo?: string;
  isUse?: boolean;
}

export interface TournamentParticipant {
  id: string; // 참가 식별자 (예: 'TP-001')
  tournamentId: string; // 대상 대회 ID
  memberId: string; // 스트리머 ID
  memberName: string;
  memberType: string; // '치지직 연동' | '일반 등록'
  channelId?: string;
  profileImg?: string;
  roles: string[]; // ['팀장', '선수', '감독']
  teamName?: string;
  registeredDate: string;
}

export interface TournamentItem {
  id: string;
  name: string;
  status: "진행중" | "접수중" | "종료";
  period: string;
  teams: number;
  prize: string;
  organizer: string;
  desc: string;
}

export interface MapItem {
  id: string;
  nameKr: string;
  nameEn: string;
  mode: string;
  location: string;
  countryCode?: string;
  imageUrl?: string;
  isActive: boolean;
  source?: "OVERFAST" | "MANUAL";
  sourceKey?: string;
  desc?: string;
}

export type HeroRole = "TANK" | "DAMAGE" | "SUPPORT";

/** 관리자 화면에서 수동 등록과 외부 연동 데이터를 구분하는 출처다. */
export type Source = "OVERFAST" | "MANUAL";

export interface HeroItem {
  id: string;
  nameKr: string;
  nameEn: string;
  role: HeroRole;
  isPickable: boolean;
  imageUrl?: string;
  source?: "OVERFAST" | "MANUAL";
  sourceKey?: string;
  desc: string;
}

/** OverFast API에서 조회한 영웅의 등록 전 데이터다. */
export interface ExternalHero {
  sourceKey: string;
  nameEn: string;
  role: HeroRole;
  subrole: string;
  imageUrl: string;
  source: "OVERFAST";
}

/** OverFast API에서 조회한 맵의 등록 전 데이터다. */
export interface ExternalMap {
  sourceKey: string;
  nameEn: string;
  gamemodes: string[];
  location: string;
  countryCode: string;
  imageUrl: string;
  source: "OVERFAST";
}

/** 관리자 맵 등록·수정 폼에서 사용하는 입력 데이터다. */
export interface MapFormData {
  nameKr: string;
  nameEn: string;
  mode: string;
  location: string;
  countryCode: string;
  imageUrl: string;
  isActive: boolean;
  source: Source;
  sourceKey: string;
  desc: string;
}

/** 관리자 회원 등록·수정 폼에서 사용하는 입력 데이터다. */
export interface MemberFormData {
  isChzzk: boolean;
  channelUrl: string;
  name: string;
  profileImg: string;
  memo: string;
  isUse: boolean;
}

/** 치지직 검색 API에서 반환하는 채널 후보 데이터다. */
export interface ChzzkCandidate {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount: number;
  followerText: string;
  channelDescription: string;
  openLive?: boolean;
  verifiedMark?: boolean;
}

export interface CodeGroupItem {
  groupCode: string;
  groupName: string;
  remarks?: string;
  sortOrder: number;
  isUse: boolean;
  createdAt?: string;
}

export interface CodeItem {
  groupCode: string;
  code: string;
  name: string;
  sortOrder: number;
  isUse: boolean;
  remarks?: string;
}

