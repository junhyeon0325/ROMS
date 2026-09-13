// lib/mock/adminData.ts
// ROMS 관리자 대시보드 및 메뉴별 초기 Mock(샘플) 데이터

import { MemberItem, TournamentItem, MapItem, CodeGroupItem, CodeItem, TournamentParticipant } from "@/lib/types/admin";

export const initialMembers: MemberItem[] = [];

export const initialTournaments: TournamentItem[] = [];

export const initialParticipants: TournamentParticipant[] = [];

export const initialMaps: MapItem[] = [];

export const initialCodeGroups: CodeGroupItem[] = [
  {
    groupCode: "MEMBER_ROLE",
    groupName: "참가자 역할 구분",
    description: "대회 참가자 및 선수단 내 역할군 (팀장, 선수, 감독 등)",
    sortOrder: 1,
    isUse: true,
    createdAt: "2026-09-01",
  },
  {
    groupCode: "MAP_MODE",
    groupName: "오버워치 전장 모드",
    description: "오버워치 2 전장별 게임 진행 모드 분류",
    sortOrder: 2,
    isUse: true,
    createdAt: "2026-09-01",
  },
  {
    groupCode: "TOUR_STAT",
    groupName: "대회 진행 상태",
    description: "러너리그 토너먼트 진행 단계 및 상태값",
    sortOrder: 3,
    isUse: true,
    createdAt: "2026-09-02",
  },
  {
    groupCode: "TIER",
    groupName: "실력 등급 (티어)",
    description: "선수 및 스트리머 공식 실력 티어 등급",
    sortOrder: 4,
    isUse: true,
    createdAt: "2026-09-03",
  },
  {
    groupCode: "STREAM_PLATFORM",
    groupName: "스트리밍 플랫폼",
    description: "참가 스트리머 활동 플랫폼 구분",
    sortOrder: 5,
    isUse: true,
    createdAt: "2026-09-05",
  },
];

export const initialCodes: CodeItem[] = [
  // MEMBER_ROLE
  { group: "MEMBER_ROLE", code: "TEAM_LEADER", name: "팀장", nameEn: "Team Leader", sort: 1, useYn: "Y", desc: "팀을 이끄는 리더" },
  { group: "MEMBER_ROLE", code: "PLAYER", name: "선수", nameEn: "Player", sort: 2, useYn: "Y", desc: "경기 출전 선수" },
  { group: "MEMBER_ROLE", code: "COACH", name: "감독", nameEn: "Coach", sort: 3, useYn: "Y", desc: "선수단 지도 감독" },
  { group: "MEMBER_ROLE", code: "ANALYST", name: "전력분석관", nameEn: "Analyst", sort: 4, useYn: "Y", desc: "상대 분석 및 밴픽 지원" },
  { group: "MEMBER_ROLE", code: "MANAGER", name: "매니저", nameEn: "Manager", sort: 5, useYn: "Y", desc: "일정 및 소통 관리" },

  // MAP_MODE
  { group: "MAP_MODE", code: "CONTROL", name: "쟁탈", nameEn: "Control", sort: 1, useYn: "Y", desc: "점령 게이지를 100% 채우는 모드" },
  { group: "MAP_MODE", code: "HYBRID", name: "혼합", nameEn: "Hybrid", sort: 2, useYn: "Y", desc: "거점 점령 후 화물 호위 모드" },
  { group: "MAP_MODE", code: "ESCORT", name: "호위", nameEn: "Escort", sort: 3, useYn: "Y", desc: "화물을 목표 지점까지 호위하는 모드" },
  { group: "MAP_MODE", code: "PUSH", name: "밀기", nameEn: "Push", sort: 4, useYn: "Y", desc: "로봇을 상대 진영으로 미는 모드" },
  { group: "MAP_MODE", code: "FLASH", name: "플래시포인트", nameEn: "Flashpoint", sort: 5, useYn: "Y", desc: "여러 거점을 순차 점령하는 모드" },

  // TOUR_STAT
  { group: "TOUR_STAT", code: "READY", name: "접수중", nameEn: "Registration", sort: 1, useYn: "Y", desc: "참가 신청 및 명단 접수 단계" },
  { group: "TOUR_STAT", code: "PROGRESS", name: "진행중", nameEn: "In Progress", sort: 2, useYn: "Y", desc: "토너먼트 본선 경기 진행 중" },
  { group: "TOUR_STAT", code: "END", name: "종료", nameEn: "Completed", sort: 3, useYn: "Y", desc: "모든 일정 및 시상 종료" },
  { group: "TOUR_STAT", code: "CANCEL", name: "취소", nameEn: "Cancelled", sort: 4, useYn: "N", desc: "사정으로 인한 대회 취소" },

  // TIER
  { group: "TIER", code: "BRONZE", name: "브론즈", nameEn: "Bronze", sort: 1, useYn: "Y", desc: "브론즈 티어" },
  { group: "TIER", code: "SILVER", name: "실버", nameEn: "Silver", sort: 2, useYn: "Y", desc: "실버 티어" },
  { group: "TIER", code: "GOLD", name: "골드", nameEn: "Gold", sort: 3, useYn: "Y", desc: "골드 티어" },
  { group: "TIER", code: "PLATINUM", name: "플래티넘", nameEn: "Platinum", sort: 4, useYn: "Y", desc: "플래티넘 티어" },
  { group: "TIER", code: "DIAMOND", name: "다이아몬드", nameEn: "Diamond", sort: 5, useYn: "Y", desc: "다이아몬드 티어" },
  { group: "TIER", code: "MASTER", name: "마스터", nameEn: "Master", sort: 6, useYn: "Y", desc: "마스터 티어" },
  { group: "TIER", code: "GRANDMASTER", name: "그랜드마스터", nameEn: "Grandmaster", sort: 7, useYn: "Y", desc: "그랜드마스터 티어" },
  { group: "TIER", code: "CHAMPION", name: "챔피언", nameEn: "Champion", sort: 8, useYn: "Y", desc: "최상위 챔피언 티어" },

  // STREAM_PLATFORM
  { group: "STREAM_PLATFORM", code: "CHZZK", name: "치지직", nameEn: "CHZZK", sort: 1, useYn: "Y", desc: "네이버 치지직 스트리밍 플랫폼" },
  { group: "STREAM_PLATFORM", code: "SOOP", name: "숲(SOOP)", nameEn: "SOOP", sort: 2, useYn: "Y", desc: "SOOP (구 아프리카TV)" },
  { group: "STREAM_PLATFORM", code: "YOUTUBE", name: "유튜브", nameEn: "YouTube", sort: 3, useYn: "Y", desc: "YouTube 라이브/영상" },
];


