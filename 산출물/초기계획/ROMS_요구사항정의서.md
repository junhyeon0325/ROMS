# ROMS (Runner's Overwatch Match System) 요구사항정의서

> **문서 버전**: v1.6 (관리자 공통관리 메뉴 신설 및 스트리머/영웅/맵 등록 요구사항 반영)  
> **작성일**: 2026-07-30  
> **프로젝트명**: ROMS (오버워치 e스포츠 아카이브 및 대시보드 시스템)  
> **기준 환경**: Next.js 14+ (App Router), Supabase (PostgreSQL & Storage), Prisma ORM, NextAuth.js

---

## 1. 개요 및 작성 목적

### 1.1 작성 목적

본 요구사항정의서는 **ROMS (Runner's Overwatch Match System)** 프로젝트의 사용자 서비스 및 관리자 서비스 구축을 위해 구현되어야 하는 모든 기능적·비기능적 요구사항을 명확히 정의하고 표준화하는 문서입니다.

### 1.2 시스템 개요

러너리그(시즌 1~4) 및 라이벌 클래시 등 오버워치 e스포츠 대회의 경기 기록, 대진표, 스트리머 전적, 맵/영웅 통계 데이터를 통합 수집·관리하고, 대시보드 및 아카이브 형태로 팬과 시청자에게 제공하는 시스템입니다.

---

## 2. 요구사항 분류 및 우선순위 체계

### 2.1 분류 코드

| 분류 코드 | 분류명                  | 설명                                                                    |
| :-------- | :---------------------- | :---------------------------------------------------------------------- |
| **CM**    | 공통 (Common)           | 시스템 공통 기능 (메인 대시보드 배치, 회원 인증 및 권한 제어)           |
| **US**    | 사용자 (User Portal)    | 시청자/팬을 위한 전적 조회, 시즌 아카이브, 랭킹 및 선수 비교            |
| **AD**    | 관리자 (Admin Portal)   | 운영자를 위한 공통 마스터(스트리머/영웅/맵) 등록, 시즌/팀 등록, 선수 배정, 경기 세트 점수 및 상세 스탯 입력 |
| **NFR**   | 비기능 (Non-Functional) | 성능, 보안, DB 형상관리(Prisma Migration), 데이터 감사(Audit) 등        |

### 2.2 우선순위 구분 (Priority)

|    우선순위     | 구분 정의                                                               | 적용 대상                                                   |
| :-------------: | :---------------------------------------------------------------------- | :---------------------------------------------------------- |
|  **상 (High)**  | 필수 핵심 기능 (시스템 가동 및 서비스 제공을 위해 반드시 구현되어야 함) | 메인 대시보드, 핵심 전적 조회, 로그인, 스트리머/경기 데이터 입력 등 |
| **중 (Medium)** | 주요 기능 (서비스 완성도 향상 및 사용자 편의성을 높이기 위한 기능)      | 맵별/영웅별 상세 통계, 세트 VOD 링크, 관리자 마스터 관리 등 |
|  **하 (Low)**   | 부가 기능 (선택적 구현 요소 및 추가 분석 툴)                            | 1v1 선수 전적 비교 레이더 차트 등                           |

---

## 3. 기능 요구사항 명세 (Functional Requirements)

### 3.1 공통 기능 (Common)

| 요구사항 ID | 요구사항명             | 상세 설명                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 우선순위 | 관련 엔터티 및 컬럼                                                                                                                                                                                                                                                                            | 비고                |
| :---------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| `CM-001`    | **메인 대시보드 구성** | **1. 상단 네비게이션 & 검색 영역**: ROMS 브랜드 로고, GNB 네비게이션 탭(러너리그, 라이벌클래시, 랭킹) 및 선수 통합 검색바 배치<br>**2. 히어로 영역 (시즌 챔피언 포스터)**: 최근 시즌 챔피언(우승자) 전적/스탯 하이라이트(승수 Display, 포지션, 최다처치, K/D, 승률) 및 "전적 상세보기" CTA 버튼 표출<br>**3. 메인 콘텐츠 영역 (3대 섹션)**:<br>&nbsp;&nbsp;• **러너리그 순위 리스트**: Top 5 선수 순위, 포지션 뱃지(탱/딜/힐), 선수명, 포지션명, 승수(WINS), KDA, 승률 표출 및 클릭 시 선수 상세화면(`/streamer/[id]`) 라우팅<br>&nbsp;&nbsp;• **이번 시즌 지표 (Stat Strip)**: 6대 주요 하이라이트 지표(최다처치, 최다도움, 최다죽음, 최다피해, 최다치유, 최다경감) 헤어라인 스트립 표출<br>&nbsp;&nbsp;• **최근 경기 결과 (Recent Match Results)**: 대회/주차 태그, 선수/팀 대진명, 세트 스코어, 승패 뱃지 리스트 표출 |  **상**  | • `Streamer`<br>&nbsp;&nbsp;(`id`, `name`, `nickname`, `profile_image_url`)<br>• `Season`<br>&nbsp;&nbsp;(`id`, `name`, `logo_url`)<br>• `PlayerSetStat`<br>&nbsp;&nbsp;(`kills`, `deaths`, `assists`, `damage`, `healing`, `mitigated_damage`)<br>• `Match`<br>&nbsp;&nbsp;(`winner_team_id`, `tournament_stage`) | 메인 화면 핵심 구성 |
| `CM-002`    | 사용자/관리자 인증     | • NextAuth.js 기반 Credentials 로그인/로그아웃<br>• bcrypt 비밀번호 암호화 적용<br>• 사용자(USER) 및 운영자(ADMIN) 세션 및 접근 권한 제어                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |  **상**  | • `User`<br>&nbsp;&nbsp;(`email`, `password_hash`, `role`)                                                                                                                                                                                                                                     | 보안/인증           |
| `CM-003`    | 시스템 공통 레이아웃   | • 반응형 상단 네비게이션바(GNB) 및 하단 푸터<br>• 모바일 및 다크모드 지원 UI Design 적용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |  **중**  | -                                                                                                                                                                                                                                                                                              | 공통 UI             |

---

### 3.2 사용자 서비스 (User Portal)

| 요구사항 ID | 요구사항명               | 상세 설명                                                                                                               | 우선순위 | 관련 엔터티 및 컬럼                                                                                   | 비고      |
| :---------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------: | :---------------------------------------------------------------------------------------------------- | :-------- |
| `US-001`    | 스트리머 검색            | • 선수/스트리머명 및 닉네임 검색 자동완성 드롭다운 표출<br>• 검색 결과 선택 시 선수 상세페이지(`/streamer/[id]`)로 이동 |  **상**  | • `Streamer`<br>&nbsp;&nbsp;(`name`, `nickname`, `profile_image_url`)                                 | 검색바    |
| `US-002`    | 시즌 아카이브 대시보드   | • 시즌별 대진표(트리/표), 일정 스케줄, 참가 팀 및 맵풀 제공<br>• 세트별 승리팀, 스탯, VOD(유튜브/치지직) 링크 연동      |  **상**  | • `Season`, `Match`, `MatchSet`<br>&nbsp;&nbsp;(`set_number`, `vod_url`, `winner_team_id`)            | 시즌 파트 |
| `US-003`    | 스트리머 개요 탭         | • 하이라이트 영상, Most 영웅 Top3, 최고 승률 맵, 경기당 평균/최대 스탯 표출                                             |  **상**  | • `Streamer`, `PlayerSetStat`<br>&nbsp;&nbsp;(`kills`, `damage`, `healing`, `main_hero_ids`)          | 선수 상세 |
| `US-004`    | 스트리머 업적 탭         | • 참여 대회 순위, 대회명, 토너먼트 단계, 상금 수령 기록 리스트 제공                                                     |  **중**  | • `Season`, `Match`<br>&nbsp;&nbsp;(`tournament_stage`, `winner_team_id`)                             | 선수 상세 |
| `US-005`    | 경기 맵별 결과 탭        | • 경기 날짜, 맵, 승패, 진영, 영웅 밴 목록, K/D/A, 세부 스탯 조회                                                        |  **중**  | • `MatchSet`, `MapItem`, `HeroBan`<br>&nbsp;&nbsp;(`map_id`, `hero_id`, `kills`, `deaths`, `assists`) | 선수 상세 |
| `US-006`    | 1v1 선수 비교            | • 2명의 스트리머 상대 전적 비교 및 영웅 승률/스탯 레이더 차트 제공                                                      |  **하**  | • `Streamer`, `PlayerSetStat`<br>&nbsp;&nbsp;(`streamer_id`, `kills`, `damage`, `healing`)            | 선수 비교 |
| `US-007`    | 통합 랭킹 대시보드       | • 선수/영웅/맵 기준 통합 순위(우승 횟수, Most Pick Top3 등) 제공                                                        |  **상**  | • `Streamer`, `PlayerSetStat`, `Season`<br>&nbsp;&nbsp;(`kills`, `damage`, `healing`, `is_mvp`)       | 랭킹 파트 |
| `US-008`    | 대진표 시각화            | • 토너먼트 대진표(8강/준결승/결승) 트리 및 세트 스코어 시각화                                                           |  **상**  | • `Match`, `MatchSet`<br>&nbsp;&nbsp;(`tournament_stage`, `team_a_id`, `team_b_id`)                   | 시즌 상세 |
| `US-009`    | 경기 일정 스케줄         | • 시즌별/일자별 경기 스케줄 및 세트 스코어 목록 조회                                                                    |  **중**  | • `Match`<br>&nbsp;&nbsp;(`match_date`, `tournament_stage`)                                           | 시즌 상세 |
| `US-010`    | 시즌 참가 팀 목록        | • 시즌별 참가 팀 엠블럼, 팀명, 소속 로스터 정보 조회                                                                    |  **중**  | • `Team`, `SeasonTeamMember`<br>&nbsp;&nbsp;(`name`, `emblem_url`, `position`)                        | 시즌 상세 |
| `US-011`    | 통계 차트 (영웅/맵 픽률) | • 맵별 픽률, 선수별 영웅 픽률, 전체 영웅 픽률 (Recharts 시각화 차트)                                                    |  **중**  | • `MapItem`, `PlayerSetStat`<br>&nbsp;&nbsp;(`map_type`, `main_hero_ids`)                             | 시즌 통계 |
| `US-012`    | 세트별 VOD 링크 연동     | • 치지직/유튜브 하이라이트 및 다시보기 VOD URL 매핑 링크 제공                                                           |  **중**  | • `MatchSet`<br>&nbsp;&nbsp;(`vod_url`, `set_number`)                                                 | 세트 상세 |
| `US-013`    | 세트별 선수 스탯 조회    | • 세트별 선수 K/D/A, 피해량, 치유량, 경감량, MVP 여부 표출                                                              |  **상**  | • `PlayerSetStat`<br>&nbsp;&nbsp;(`kills`, `deaths`, `assists`, `damage`, `healing`, `is_mvp`)        | 세트 상세 |

---

### 3.3 관리자 서비스 (Admin Portal)

| 요구사항 ID | 요구사항명                  | 상세 설명                                                                                                                       | 우선순위 | 관련 엔터티 및 컬럼                                                                                                                                              | 비고   |
| :---------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| `AD-001`    | 시즌 및 팀 등록             | • 시즌(대회명, 기간, 로고) 생성<br>• 팀 생성 및 엠블럼 이미지 업로드 (**Supabase Storage** 연동)                                |  **상**  | • `Season`<br>&nbsp;&nbsp;(`name`, `logo_url`, `start_date`, `end_date`)<br>• `Team`<br>&nbsp;&nbsp;(`name`, `emblem_url`)                                       | 관리자 |
| `AD-002`    | 선수 배정 및 포지션 관리    | • 스트리머를 특정 시즌 팀에 배정 및 포지션(`TANK`, `DAMAGE`, `HEALER`) 설정                                                     |  **상**  | • `SeasonTeamMember`<br>&nbsp;&nbsp;(`season_team_id`, `streamer_id`, `position`)                                                                                | 관리자 |
| `AD-003`    | 경기 결과 및 세부 스탯 입력 | • 세트별 스코어, 맵 선택, 승리팀, 사용 영웅, MVP 지정<br>• 선수별 K/D/A, 피해량, 치유량, 경감량 입력 및 대시보드 자동 합산 반영 |  **상**  | • `Match`, `MatchSet`, `PlayerSetStat`, `HeroBan`<br>&nbsp;&nbsp;(`set_number`, `kills`, `deaths`, `assists`, `damage`, `healing`, `mitigated_damage`, `is_mvp`) | 관리자 |
| `AD-004`    | **공통 마스터 관리 (스트리머, 영웅, 맵)** | • **스트리머(선수) 등록 및 관리**: 선수명, 방송 닉네임, Supabase Storage 프로필 이미지 URL, 치지직/유튜브 채널 URL 등록/수정<br>• **영웅 마스터 관리**: 오버워치 영웅(영웅명, 역할군, 아이콘) 등록/수정<br>• **맵 마스터 관리**: 오버워치 맵(맵 이름, 맵 전형, 맵 이미지) 등록/수정 | **상** | • `Streamer`<br>&nbsp;&nbsp;(`name`, `nickname`, `profile_image_url`, `chzzk_channel_url`, `youtube_channel_url`)<br>• `MapItem`<br>&nbsp;&nbsp;(`name`, `map_type`, `image_url`)<br>• `HeroBan`<br>&nbsp;&nbsp;(`hero_id`) | 관리자 공통관리 |

---

## 4. 비기능 요구사항 명세 (Non-Functional Requirements)

| 요구사항 ID | 구분                    | 상세 내용                                                                                                                           | 우선순위 | 관련 기술 및 엔터티          |
| :---------- | :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------: | :--------------------------- |
| `NFR-001`   | **인프라 & DB**         | • **Supabase Cloud DB (PostgreSQL)** 인프라 적용<br>• Prisma ORM 연동 및 Connection Pooler (6543, 5432 포트)를 통한 안정적 접속     |  **상**  | Supabase, Prisma ORM         |
| `NFR-002`   | **데이터 감사 (Audit)** | • 모든 데이터베이스 테이블 11개에 공통 감사 컬럼(`created_by`, `created_at`, `updated_by`, `updated_at`) 보유 및 자동 갱신          |  **상**  | 전체 11개 테이블 공통 컬럼   |
| `NFR-003`   | **DB 형상 관리**        | • Flyway 방식의 **Prisma Migration (`prisma/migrations/`)** 도입<br>• 시점별 DDL 커밋 및 원격 DB 마이그레이션 이력 관리             |  **상**  | Prisma Migrations (`0_init`) |
| `NFR-004`   | **보안 (RLS & Key)**    | • Supabase 모든 테이블에 **Row Level Security (RLS)** 활성화<br>• `.env` 환경변수를 통한 DB 비밀번호 보안 관리 (`.gitignore` 설정)  |  **상**  | Supabase RLS Policies        |
| `NFR-005`   | **성능 & 호환성**       | • Next.js 14+ App Router & Server Actions 기반 SSR 및 빠른 반응 속도 제공<br>• 반응형 웹 레이아웃 및 모바일/PC 브라우저 호환성 확보 |  **상**  | Next.js 14, Tailwind CSS     |

---

## 5. 요구사항 추적성 매트릭스 (Traceability Matrix)

| 요구사항 ID                   | 화면 / 페이지                          | 관련 Prisma DB 모델                                        | 주요 연동 DB 컬럼                                                                                             |
| :---------------------------- | :------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `CM-001`                      | 메인 대시보드 (`/`)                    | `Streamer`, `Season`, `PlayerSetStat`, `Match`             | `Streamer.profile_image_url`, `PlayerSetStat.kills/damage/healing/mitigated_damage`, `Match.winner_team_id`   |
| `CM-002`                      | 로그인 페이지 (`/auth/login`)          | `User`                                                     | `User.email`, `User.password_hash`, `User.role`                                                               |
| `US-001` ~ `US-006`           | 스트리머 상세 (`/streamer/[id]`)       | `Streamer`, `SeasonTeamMember`, `PlayerSetStat`, `HeroBan` | `Streamer.name/profile_image_url`, `PlayerSetStat.kills/deaths/assists/damage/healing`, `HeroBan.hero_id`     |
| `US-002`, `US-008` ~ `US-013` | 시즌 상세 (`/season/[id]`)             | `Season`, `Match`, `MatchSet`, `MapItem`, `PlayerSetStat`  | `Season.name/logo_url`, `MatchSet.set_number/vod_url`, `MapItem.name`, `PlayerSetStat.is_mvp`                 |
| `US-007`                      | 통합 랭킹 (`/ranking`)                 | `PlayerSetStat`, `Streamer`, `Season`                      | `PlayerSetStat.kills/damage/healing/mitigated_damage`, `Streamer.name`                                        |
| `AD-001`                      | 관리자 시즌/팀 등록 (`/admin/season`)  | `Season`, `Team`                                           | `Season.name/logo_url`, `Team.name/emblem_url`                                                                |
| `AD-002`                      | 관리자 선수 배정 (`/admin/roster`)     | `SeasonTeam`, `SeasonTeamMember`, `Streamer`               | `SeasonTeamMember.season_team_id`, `SeasonTeamMember.position`                                                |
| `AD-003`                      | 관리자 경기 결과 입력 (`/admin/match`) | `Match`, `MatchSet`, `PlayerSetStat`, `HeroBan`            | `MatchSet.game_duration_seconds`, `PlayerSetStat.kills/deaths/assists/damage/healing/mitigated_damage/is_mvp` |
| `AD-004`                      | 관리자 공통관리 (`/admin/common`)      | `Streamer`, `MapItem`, `HeroBan`                           | `Streamer.name/profile_image_url/chzzk_channel_url`, `MapItem.name/map_type/image_url`                        |
