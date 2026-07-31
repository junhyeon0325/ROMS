# ROMS (Runner's Overwatch Match System) 화면설계서 (Slide Deck Specification)

> **문서 유형**: 프레젠테이션 슬라이드 덱 (Google Slides / PPT 스토리보드 형태)  
> **문서 버전**: v2.0 (화면설계서 / 메뉴구성도 분리 적용)  
> **작성일**: 2026-07-30  
> **프로젝트명**: ROMS (오버워치 e스포츠 아카이브 및 대시보드 시스템)  
> **기준 산출물**: ROMS 요구사항정의서 v1.4, ROMS 메뉴구성도 v1.0  

---

## 📽️ 프레젠테이션 슬라이드 덱 (Slides Overview)

````carousel
# [SLIDE 01] 표지 - ROMS 화면 설계서
## 🖥️ ROMS (Runner's Overwatch Match System) 화면 설계 스토리보드
- **발표/설계 버전**: v2.0 (Presentation Slide Deck Format)
- **주요 내용**: 사용자 및 관리자 화면별 스토리보드, 비주얼 시안, 레이아웃 구성 및 이벤트 명세
- **연동 기술**: Next.js 14 (App Router), Supabase (PostgreSQL & Storage), Prisma ORM

<!-- slide -->
# [SLIDE 02] SCR-001 메인 대시보드 (Main Dashboard)
![SCR-001 Main Dashboard Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_main_dashboard_mockup_1785375938492.png)
### 📌 화면 개요: SCR-001 메인 대시보드 (`/`)
- **주요 기능**: 상단 통합 검색바, 중앙 바로가기 숏컷, 하단 13종 리더보드 카드
- **연동 엔터티**: `Streamer`, `Season`, `PlayerSetStat`, `Match`

<!-- slide -->
# [SLIDE 03] SCR-002 스트리머 상세 (Streamer Detail)
![SCR-002 Streamer Detail Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_streamer_detail_mockup_1785375950424.png)
### 📌 화면 개요: SCR-002 스트리머 상세 페이지 (`/streamer/[id]`)
- **주요 기능**: 5대 서브 탭(개요, 업적, 결과, 맵데이터, 1v1비교), 통계 차트 표출
- **연동 엔터티**: `Streamer`, `SeasonTeamMember`, `PlayerSetStat`, `HeroBan`

<!-- slide -->
# [SLIDE 04] SCR-003 시즌 아카이브 (Season Archive)
![SCR-003 Season Archive Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_season_archive_mockup_1785375962296.png)
### 📌 화면 개요: SCR-003 시즌 아카이브 페이지 (`/season/[id]`)
- **주요 기능**: 토너먼트 대진표 트리, 일자별 스케줄, 세트 상세 모달, VOD 링크
- **연동 엔터티**: `Season`, `Match`, `MatchSet`, `MapItem`, `PlayerSetStat`

<!-- slide -->
# [SLIDE 05] SCR-005 ~ SCR-007 관리자 포털 (Admin Portal)
![SCR-005 Admin Portal Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_admin_portal_mockup_1785375973508.png)
### 📌 화면 개요: SCR-005 ~ SCR-007 관리자 서비스 (`/admin/*`)
- **주요 기능**: 시즌/팀 등록, 선수 배정, 경기 세트 스코어/스탯/MVP 입력
- **연동 엔터티**: `Season`, `Team`, `SeasonTeamMember`, `MatchSet`, `PlayerSetStat`
````

---

## 📄 슬라이드별 세부 스토리보드 명세 (Detailed Slide Storyboards)

---

### [SLIDE 02] `SCR-001` : 메인 대시보드 (Main Dashboard)

- **화면 ID**: `SCR-001`
- **화면명**: 메인 대시보드 (Main Dashboard)
- **URL 경로**: `/`
- **접근 권한**: 전체 (Public)
- **관련 요구사항 ID**: `CM-001`, `US-001`

#### 1. 비주얼 슬라이드 디자인
![SCR-001 Main Dashboard Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_main_dashboard_mockup_1785375938492.png)

#### 2. 화면 구성 요소 및 레이아웃 명세
1. **상단 네비게이션 & 검색 영역**:
   - `GNB`: ROMS 로고, 서비스 소개, 관리자 로그인 이동 버튼 (`/auth/login`)
   - `Search Bar`: 스트리머명 및 닉네임 입력 시 자동완성 연관 드롭다운 표출 (`Streamer` 테이블 연동)
2. **중앙 숏컷 메뉴 영역**:
   - `Season Buttons`: `[시즌 1]`, `[시즌 2]`, `[시즌 3]`, `[시즌 4]`, `[라이벌 클래시]` 클릭 시 해당 `/season/[id]` 이동
   - `Leaderboard Button`: `[🏆 통합 랭킹 바로가기]` 클릭 시 `/ranking` 이동
3. **하단 13종 리더보드 지표 카드 영역**:
   - **우승 횟수 Top 5**: 우승 횟수 숫자 + 선수 프로필 이미지
   - **단일 세트 최다 (6종)**: 최다처치, 최다도움, 최다죽음, 최다피해, 최다치유, 최다경감
   - **전체 누적 최다 (6종)**: 누적최다처치, 누적최다도움, 누적최다죽음, 누적최다피해, 누적최대치유, 누적최다경감
   - **카드 클릭 이벤트**: 카드 내부의 **선수 프로필 이미지 또는 선수명 클릭 시 해당 선수 상세페이지(`/streamer/[id]`)로 라우팅 이동**.

---

### [SLIDE 03] `SCR-002` : 스트리머 상세 페이지 (Streamer Detail)

- **화면 ID**: `SCR-002`
- **화면명**: 스트리머 상세 페이지 (Streamer Detail)
- **URL 경로**: `/streamer/[id]`
- **접근 권한**: 전체 (Public)
- **관련 요구사항 ID**: `US-001` ~ `US-006`

#### 1. 비주얼 슬라이드 디자인
![SCR-002 Streamer Detail Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_streamer_detail_mockup_1785375950424.png)

#### 2. 서브 탭 구성 명세
1. **개요 탭 (`US-003`)**: 모스트 영웅 Top3, 경기당 평균/최대 스탯, 하이라이트 VOD 플레이어
2. **업적 탭 (`US-004`)**: 참여 시즌별 성적 리스트 및 우승 트로피 뱃지
3. **경기 맵별 결과 탭 (`US-005`)**: 경기 일자, 맵, 승패, 진영, 영웅 밴 목록, K/D/A, 세부 스탯 표출
4. **맵별 데이터 탭 (`US-011`)**: 맵 종류별 승률(%), 승/패 판수 시각화
5. **1v1 선수 비교 탭 (`US-006`)**: 상대 스트리머 선택 후 상대 전적 및 영웅 승률/스탯 레이더 차트 제공

---

### [SLIDE 04] `SCR-003` : 시즌 아카이브 페이지 (Season Archive)

- **화면 ID**: `SCR-003`
- **화면명**: 시즌 아카이브 페이지 (Season Archive)
- **URL 경로**: `/season/[id]`
- **접근 권한**: 전체 (Public)
- **관련 요구사항 ID**: `US-002`, `US-008` ~ `US-013`

#### 1. 비주얼 슬라이드 디자인
![SCR-003 Season Archive Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_season_archive_mockup_1785375962296.png)

#### 2. 화면 세부 명세
- **시즌 헤더**: 대회 명칭, 대회 기간, 공식 시즌 로고 (`Season.logo_url`)
- **토너먼트 대진표 트리 (`US-008`)**: 8강 ➔ 준결승 ➔ 결승 토너먼트 대진표 시각화
- **세트 상세 팝업 (`US-012`, `US-013`)**: 세트 클릭 시 10명 참가 선수의 K/D/A, 피해량, 치유량, 경감량, MVP, VOD(유튜브/치지직) 다시보기 링크 제공

---

### [SLIDE 05] `SCR-005` ~ `SCR-007` : 관리자 포털 (Admin Portal)

- **화면 ID**: `SCR-005` ~ `SCR-007`
- **화면명**: 관리자 서비스 (Admin Portal)
- **URL 경로**: `/admin/season`, `/admin/roster`, `/admin/match`
- **접근 권한**: 관리자 (ADMIN 전용)
- **관련 요구사항 ID**: `AD-001` ~ `AD-004`

#### 1. 비주얼 슬라이드 디자인
![SCR-005 Admin Portal Visual](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/bbb8c3fb-4de0-474b-a87d-42af5b6d2af1/roms_admin_portal_mockup_1785375973508.png)

#### 2. 관리자 3대 메뉴 명세
1. **시즌 & 팀 관리 (`SCR-005`)**: 시즌 생성 및 **Supabase Storage 연동 팀 엠블럼 이미지 업로드**
2. **선수 배정 관리 (`SCR-006`)**: 스트리머를 특정 시즌 팀에 배정 및 포지션(`TANK`, `DAMAGE`, `HEALER`) 설정
3. **경기 결과 & 스탯 입력 (`SCR-007`)**: 매치/세트 스코어, 맵 및 영웅 밴 지정, 선수별 K/D/A, 피해/치유/경감량 및 MVP 설정
