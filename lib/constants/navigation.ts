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
        id: "common",
        label: "공통관리",
        icon: "folder",
        children: [
            {
                id: "tournament",
                label: "대회등록",
                href: "/admin/tournaments",
                description: "시즌 및 대회 정보 신규 등록 및 진행 상태 관리",
            },
            {
                id: "map",
                label: "맵 등록",
                href: "/admin/maps",
                description: "오버워치 전장(맵) 및 게임 모드 데이터 관리",
            },
            {
                id: "roster",
                label: "팀장 선수 감독 관리",
                href: "/admin/members",
                description: "대회 참가 팀장, 선수, 감독 및 스트리머 통합 관리",
            },
            {
                id: "code",
                label: "공통코드",
                href: "/admin/codes",
                description: "시스템 표준 마스터 코드 그룹 및 상세 코드 관리",
            },
        ],
    },
]