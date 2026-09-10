// lib/types/admin.ts
// ROMS 관리자 페이지 공통 타입 정의

export interface MemberItem {
  id: string;
  name: string;
  type: string; // '치지직 연동' | '일반 등록'
  channelId?: string;
  roles: string[]; // ['팀장', '선수', '감독']
  followers: string;
  registeredDate: string;
  profileImg?: string;
  memo?: string;
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
  mode: "혼합" | "호위" | "쟁탈" | "플래시포인트" | "밀기";
  location: string;
  isActive: boolean;
  desc?: string;
}

export interface CodeItem {
  group: string;
  code: string;
  name: string;
  nameEn: string;
  sort: number;
  useYn: "Y" | "N";
  desc?: string;
}
