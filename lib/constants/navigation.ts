// lib/constants/navigation.ts
// 메뉴 데이터 상수 파일

// 메뉴 타입 정의
export interface NavItem {
    id: string;
    label: string;
    href?: string;
    description?: string;
    icon?: string;
    children?: NavItem[];
}

// 사용자 페이지 메인메뉴
export const USER_NAV_ITEMS: NavItem[] = [
    { id: "runner", label: "러너리그", href: "/runner" },
    { id: "rival", label: "라이벌클래시", href: "/rival" },
    { id: "ranking", label: "랭킹", href: "/ranking" },
]

// 관리자 페이지 메뉴
export const ADMIN_NAV_ITEMS: NavItem[] = [
    {
        id: "dashboard",
        label: "대시보드",
        href: "/admin",
        description: "ROMS 시스템 통합 현황 및 실시간 관제 지표",
        icon: "dashboard",
    },
    {
        id: "tournaments",
        label: "대회 관리",
        icon: "trophy",
        children: [
            {
                id: "tournament-register",
                label: "대회 등록",
                href: "/admin/tournaments",
                description: "시즌 및 정규 리그 대회 정보 등록 및 진행 상태 관리",
            },
            {
                id: "tournament-structure",
                label: "대회 구성 관리",
                href: "/admin/tournaments/structure",
                description: "대회별 참가 인원 및 역할(팀장·선수·감독) 배정, 조 편성, 토너먼트 규정 구성 관리",
            },
        ],
    },
    {
        id: "common",
        label: "공통관리",
        icon: "folder",
        children: [
            {
                id: "streamer",
                label: "스트리머 관리",
                href: "/admin/members",
                description: "스트리머 프로필 정보 등록 및 치지직 채널 연동 관리",
            },
            {
                id: "map",
                label: "맵 관리",
                href: "/admin/maps",
                description: "오버워치 2 전장(맵) 데이터 및 공식 맵풀 운영 관리",
            },
            {
                id: "game-mode",
                label: "게임 모드 관리",
                href: "/admin/game-modes",
                description: "오버워치 공식 게임 모드(혼합, 호위, 쟁탈 등) 규칙 및 설정 관리",
            },
            {
                id: "hero",
                label: "영웅 관리",
                href: "/admin/heroes",
                description: "오버워치 영웅(돌격, 공격, 지원) 데이터 및 활성화/밴픽 상태 관리",
            },
        ],
    },
    {
        id: "developer",
        label: "개발자 메뉴",
        icon: "code",
        children: [
            {
                id: "code",
                label: "공통코드 관리",
                href: "/admin/codes",
                description: "시스템 표준 마스터 코드 그룹 및 상세 코드 관리",
            },
        ],
    },
]