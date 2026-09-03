// lib/constants/navigation.ts
// 메뉴 데이터 상수 파일

// 메뉴 타입 정의
export interface NavItem {
    id: string;
    label: string;
    href?: string;
    description?: string;
    icon?: string;
}

// 사용자 페이지 메인메뉴
export const USER_NAV_ITEMS: NavItem[] = [
    { id: "runner", label: "러너리그", href: "/runner" },
    { id: "rival", label: "라이벌클래시", href: "/rival" },
    { id: "ranking", label: "랭킹", href: "/ranking" },
]

// 관리자 페이지 메뉴
export const ADMIN_NAV_ITEMS: NavItem[] = [
    { id: "master", label: "공통 마스터 관리", description: "등록 스트리머, 영웅 픽풀, 맵 데이터 관리", href: "/admin/master", },
    { id: "season", label: "시즌 및 팀/로스터 관리", description: "대회 시즌 생성, 팀 생성 및 선수 배정", href: "/admin/season", },
    { id: "match-entry", label: "매치 관리 & 기록 입력", description: "매치 생성 및 게임 흐름 기반 상세 스탯 입력", href: "/admin/matches", },
    { id: "match-results", label: "경기 결과 & 스탯 조회", description: "등록 스트리머, 영웅 픽풀, 맵 데이터 관리", href: "/admin/master", },
]