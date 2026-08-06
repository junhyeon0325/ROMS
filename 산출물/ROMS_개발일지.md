# ROMS (Runner's Overwatch Match System) 개발 일지 (Development Log)

> **문서 설명**: AI 조수(Antigravity)와 개발자가 함께 프로젝트 진행 상황, 기능 개발 내역, DB 및 아키텍처 변경 이력을 기록하고 지속적으로 업데이트하는 개발 일지입니다.  
> **최종 수정일**: 2026-08-06  
> **프로젝트**: ROMS (오버워치 e스포츠 아카이브 및 대시보드 시스템)  

---

## 1. 프로젝트 개요 및 기술 스택

* **프로젝트명**: ROMS (Runner's Overwatch Match System)
* **목표**: 오버워치 e스포츠 대회(러너리그, 라이벌 클래시 등)의 경기 기록, 대진표, 선수 전적, 맵/영웅 통계를 통합 관리·제공하는 아카이브 & 대시보드 시스템 구축
* **주요 기술 스택**:
  * **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts
  * **Backend**: Next.js Server Actions & API Routes
  * **Database & ORM**: Supabase Cloud DB (PostgreSQL) + Prisma ORM
  * **Authentication**: NextAuth.js (Credentials Provider / Role-based: `USER`, `ADMIN`)
  * **Storage**: Supabase Storage

---

## 2. 개발 진행 현황 (Progress Overview)

| 구분 | 주요 개발 내용 | 상태 | 비고 |
| :--- | :--- | :---: | :--- |
| **Phase 1: 초기 기획 & 설계** | 요구사항 정의서, ERD, 테이블 정의서, 메뉴구성도, 프로젝트 계획서 작성 | ✅ 완료 | `산출물/초기계획/` |
| **Phase 2: UI/UX 화면 설계** | 메인 화면 프로토타입(HTML) 및 11개 상세 UI 와이어프레임(PNG) 작성 | ✅ 완료 | `산출물/ROMS 프로젝트 화면설계서/` |
| **Phase 3: DB 스키마 & 모델링** | Prisma Schema 설정, PostgreSQL 테이블 구조 및 Audit/Remarks 컬럼 반영 | ✅ 완료 | `prisma/schema.prisma` |
| **Phase 4: 인프라 및 기반 구축** | Supabase DB 연동, NextAuth.js 인증 및 Storage 설정 | 🔄 진행 예정 | DB Migration 및 Client 구현 |
| **Phase 5: 주요 기능 구현** | User Portal (메인 대시보드, 스트리머 상세, 아카이브) & Admin Portal 구현 | ⏳ 대기 | UI 컴포넌트 및 API 개발 |

---

## 3. 상세 개발 이력 (Development Journal)

### 📅 2026-08-06 (목) - DB 스키마 보완 및 관리자 메뉴 구조 개선
* **공통 코드 관리 테이블 (`common_code_groups`, `common_codes`) 설계 및 구축**:
  * 포지션, 맵 전형, 토너먼트 단계 등 시스템 공통 코드를 유연하게 관리하기 위한 2단계 마스터-디테일 구조 테이블 설계.
  * `prisma/schema.prisma` 스키마 추가 및 Prisma Client 빌드(`npx prisma generate`) 검증 완료.
  * `ROMS_ERD.md` (v1.6) 및 `ROMS_테이블정의서.md` (v1.6) 산출물 문서 현행화.
* **모든 DB 테이블에 `remarks` (비고) 컬럼 추가**:
  * `User`, `Season`, `Team`, `Streamer`, `SeasonTeam`, `SeasonTeamMember`, `Match`, `MatchSet`, `PlayerSetStat`, `HeroBan`, `HeroMaster`, `MapMaster` 등 전 테이블에 비고(`remarks String?`) 필드 일괄 추가 반영.
  * `prisma/schema.prisma`, `ROMS_ERD.md`, `ROMS_테이블정의서.md` 현행화 완료.
* **관리자 메뉴 및 선수 관리 흐름 변경**:
  * 기존 공통 관리 메뉴에 위치했던 '스트리머(선수) 등록' 메뉴를 **대회/시즌, 팀 및 선수 관리** 하위 메뉴로 이동.
  * 시즌 등록 완료 후 연속성 있게 스트리머 등록 및 팀 배정이 이루어지도록 흐름 개선.

---

### 📅 2026-08-05 (수) - 화면설계서 자산 정리 및 산출물 구조화
* **화면 설계 자산 현행화**:
  * 메인 대시보드 HTML 프로토타입 (`01_CM-LST-001_메인 화면.html`) 수집 및 정리.
  * 사용자 서비스 상세 와이어프레임 11종(`02_US-LST-001` ~ `02_US-LST-011`) 이미지 자산 추가.
* **IA & 메뉴구성도 업데이트 (`ROMS_메뉴구성도.md` v1.7)**:
  * 매치 관리 및 상세 기록 입력 구조화, 경기 결과 독립 조회 메뉴 추가.

---

### 📅 2026-07-29 ~ 2026-08-04 - 프로젝트 초기 기획 및 스키마 설계
* **프로젝트 초기 산출물 정의**:
  * `ROMS_프로젝트계획서.md`: 전체 일정(WBS), 기술 스택, 시스템 아키텍처 수립.
  * `ROMS_요구사항정의서.md`: User/Admin 요구사항 13종 상세 정의.
  * `ROMS_ERD.md` 및 `ROMS_테이블정의서.md`: 12개 핵심 도메인 모델 스키마 설계.
* **Prisma ORM 기반 설정**:
  * PostgreSQL 연동을 위한 `prisma/schema.prisma` 작성.
  * `createdBy`, `createdAt`, `updatedBy`, `updatedAt` 공통 감사(Audit) 필드 포함.

---

## 4. 주요 의사결정 기록 (Key Architectural Decisions)

1. **데이터베이스 및 ORM (Supabase + Prisma)**:
   * PostgreSQL 기반 데이터 무결성 및 관계 모델 관리의 용이함을 고려하여 Supabase Cloud DB 사용.
   * 타입 안정성과 생산성을 고려해 Prisma ORM 채택. BigInt primary key 활용.
2. **공통 필드 표준화**:
   * 레코드 이력 관리를 위한 Audit 필드 (`createdBy`, `createdAt`, `updatedBy`, `updatedAt`)와 비고(`remarks`) 필드를 전 모델에 필수/선택 요소로 표준 배치.
3. **선수 및 팀 관리 워크플로우**:
   * 스트리머(선수)는 마스터 개념과 더불어 시즌별 팀 배정(SeasonTeamMember)과 유기적으로 연결되어 관리자 동선 최소화.

---

## 5. 향후 작업 계획 (Next Steps)

1. **Supabase 데이터베이스 연동 & Migration**:
   * `.env` 설정 확인 및 Supabase DB 초기 마이그레이션 (`prisma migrate dev` / `db push`).
2. **기본 레이아웃 & Design System 구현**:
   * Header/GNB, Footer, Theme, Common Card/Table UI 컴포넌트 제작.
3. **NextAuth.js 로그인/인증 연동**:
   * Credentials provider 기반 Admin 로그인 페이지(`SCR-008`) 구현.

---
> 💡 *본 일지는 개발 작업 진행 시 지속적으로 업데이트됩니다.*
