# ROMS (Runner-league Overwatch Management System) 개발 일지 마스터 (Index)

> **문서 설명**: ROMS 프로젝트의 일별 개발 일지 목록 및 작성 규칙을 안내하는 마스터 문서입니다.
> **최종 수정일**: 2026-09-22 11:43
> **프로젝트**: ROMS (오버워치 e스포츠 아카이브 및 대시보드 시스템)

---

## 📌 개발 일지 작성 규칙 (Daily Log Rules)

1. **파일명 규칙**: 매일 `산출물/개발일지/` 폴더 내에 날짜별로 별도 파일을 생성합니다.
   * Format: `ROMS_개발일지_YYYY-MM-DD.md`
   * 예시: `ROMS_개발일지_2026-08-06.md`
2. **헤더 필수 기재 항목**: 모든 일지 파일 상단 헤더에 **최종 수정일 (날짜 및 시간 포함)** 및 작성자/프로젝트 정보를 포함합니다.
   ```markdown
   > **문서 설명**: ROMS 프로젝트 2026-08-06 개발 일지
   > **최종 수정일**: 2026-08-06 23:52
   > **작성자**: AI 조수 (Antigravity) & 개발자
   ```
3. **업데이트**: 일지 작성 또는 수정 시 헤더의 `최종 수정일` 날짜와 시간을 해당 작업 시점으로 갱신합니다.

---

## 📂 일별 개발 일지 목록 (Daily Development Logs)

| 날짜 | 일지 파일 | 주요 내용 요약 | 상태 |
| :--- | :--- | :--- | :--- |
| **2026-09-22** | [ROMS_개발일지_2026-09-22.md](ROMS_개발일지_2026-09-22.md) | Chzzk 채널 adapter 분리 및 AdminFeatureContexts 책임별 Provider 조합 정리 | 완료 |
| **2026-09-21** | [ROMS_개발일지_2026-09-21.md](ROMS_개발일지_2026-09-21.md) | OverFast 맵 외부 연동 adapter 분리 및 API 계약 보존 | 완료 |
| **2026-09-20** | [ROMS_개발일지_2026-09-20.md](ROMS_개발일지_2026-09-20.md) | 관리자 상태·API 계층 분리 및 회원 API 명칭 정리 | 완료 |
| **2026-09-19** | [ROMS_개발일지_2026-09-19.md](ROMS_개발일지_2026-09-19.md) | 영웅 역할·플레이어 포지션·대회 참여 역할 공통코드 기준값 등록 | 작성 완료 |
| **2026-09-18** | [ROMS_개발일지_2026-09-18.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-18.md) | 공통코드 모듈화/캐싱, 스트리머 관리 안정화, OverFast 기반 맵·영웅 데이터 조회·검색·일괄 등록 및 공식 맵풀 관리 | ✅ 작성 완료 |
| **2026-09-17** | [ROMS_개발일지_2026-09-17.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-17.md) | 공통코드 상단 그리드 '코드 수' 컬럼 삭제, 온디맨드 세부코드 지연 페칭 구조 개편 및 식별자 불변 원칙 UI 확립 | ✅ 작성 완료 |
| **2026-09-16** | [ROMS_개발일지_2026-09-16.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-16.md) | 스트리머 등록 방식 가짜 공통코드(CONNECT_TO_CHZZK 등) 및 매직 스트링 전면 제거, isChzzk 불리언 및 2-버튼 토글 기반 완전 단순화 | ✅ 작성 완료 |
| **2026-09-15** | [ROMS_개발일지_2026-09-15.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-15.md) | 치지직 필수/중복 검증, 공통코드 필드 통일, 마운트 깜빡임 제거, 스트리머 소프트 딜리트 및 복구 기능 구축 | ✅ 작성 완료 |
| **2026-09-14** | [ROMS_개발일지_2026-09-14.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-14.md) | 관리자 범용 데이터 그리드(AdminTable) 신설 및 스트리머 관리 페이지 그리드 공통화 적용 | ✅ 작성 완료 |
| **2026-09-13** | [ROMS_개발일지_2026-09-13.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-13.md) | 스트리머 관리 4분할 검색/필터 개편, 개발자 대메뉴 신설, 공통코드 상하 5:5 인라인 그리드 & Supabase DB 연동, 공통 컴포넌트/훅 분리 리팩토링 | ✅ 작성 완료 |
| **2026-09-12** | [ROMS_개발일지_2026-09-12.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-12.md) | 치지직 스트리머 후보 선택 모달 구축, 팔로워 순 스마트 정렬, 모달 내 직접 검색창 및 스트리머 조회 세분화 | ✅ 작성 완료 |
| **2026-09-11** | [ROMS_개발일지_2026-09-11.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-11.md) | 관리자 메뉴 구조 개편, 신규 3개 화면 구축, 스트리머 역할 분리 및 전역 오버워치 오렌지 테마 리뉴얼 | ✅ 작성 완료 |
| **2026-09-10** | [ROMS_개발일지_2026-09-10.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-10.md) | 상단 헤더 브레드크럼 우측 재배치, 본문 헤더 정리, 좌측 하단 다크모드 스위치 연동 및 사이드바 대시보드 메뉴 간격 일치화 | ✅ 작성 완료 |
| **2026-09-09** | [ROMS_개발일지_2026-09-09.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-09.md) | 관리자 메뉴 개편(대메뉴: 공통관리, 4개 하위메뉴) 및 2단 분할 표준 레이아웃(좌측 조회 + 우측 등록 폼, 치지직 연동/겸직 지원) 전면 구축 | ✅ 작성 완료 |
| **2026-09-02** | [ROMS_개발일지_2026-09-02.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-09-02.md) | 공통 레이아웃 컴포넌트 모듈화(`UserHeader`, `AdminSidebar`), 관리자 중첩 레이아웃(`AdminLayout`) 도입 및 메뉴 상수화 | ✅ 작성 완료 |
| **2026-08-13** | [ROMS_개발일지_2026-08-13.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-08-13.md) | 메뉴 데이터 상수 분리(`navigation.ts`), 과도한 토스트(Toast) 알림 전면 제거 및 TypeScript 타입 정합성 검증 | ✅ 작성 완료 |
| **2026-08-10** | [ROMS_개발일지_2026-08-10.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-08-10.md) | 관리자 대시보드 메뉴 구조 개선, ROMS 메뉴구성도(IA) 기반 탭 및 컨텐츠 동기화 | ✅ 작성 완료 |
| **2026-08-07** | [ROMS_개발일지_2026-08-07.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-08-07.md) | 사용자/관리자 대시보드 환경 구축, 메인화면 중앙 정렬 레이아웃 개선 및 DB 마이그레이션 적용 | ✅ 작성 완료 |
| **2026-08-06** | [ROMS_개발일지_2026-08-06.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-08-06.md) | 공통 코드 관리 테이블 설계, 전 테이블 remarks 컬럼 추가, 관리자 동선 개선 | ✅ 작성 완료 |

| **2026-08-05** | [ROMS_개발일지_2026-08-05.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-08-05.md) | 메인 대시보드 HTML 프로토타입/와이어프레임 정리, IA & 메뉴구성도 업데이트 | ✅ 작성 완료 |
| **2026-08-04** | [ROMS_개발일지_2026-08-04.md](file:///c:/Users/Administrator/antigravity/Roms/%EC%82%B0%EC%B6%9C%EB%AC%BC/%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80/ROMS_%EA%B0%9C%EB%B0%9C%EC%9D%BC%EC%A7%80_2026-08-04.md) | 프로젝트 초기 산출물(계획서, 요구사항, ERD) 정의 및 Prisma ORM 기반 설정 | ✅ 작성 완료 |

---

## 📝 일별 개발 일지 기본 템플릿 (Template)

새로운 개발 일지를 작성할 때 아래 템플릿을 복사하여 작성할 수 있습니다.

```markdown
# ROMS (Runner-league Overwatch Management System) 개발 일지 - YYYY-MM-DD

> **문서 설명**: ROMS 프로젝트의 YYYY-MM-DD 일자 개발 진행 상황, 상세 이력 및 의사결정 사항을 기록한 개발 일지입니다.
> **최종 수정일**: YYYY-MM-DD HH:mm
> **작성자**: AI 조수 (Antigravity) & 개발자
> **프로젝트**: ROMS (오버워치 e스포츠 아카이브 및 대시보드 시스템)

---

## 1. 오늘 주요 개발 현황 요약 (Summary)

* **상태**: 🔄 진행 중 / ✅ 완료
* **주요 작업**:
  1. 작업 내용 1
  2. 작업 내용 2

---

## 2. 상세 개발 이력 (Development Journal)

### 📅 YYYY-MM-DD (요일)

* **작업 제목**:
  * 세부 작업 내용 1
  * 세부 작업 내용 2

---

## 3. 주요 의사결정 기록 (Key Architectural Decisions)

1. **의사결정 1**: 내용

---

## 4. 향후 작업 계획 (Next Steps)

1. 다음 작업 항목 1
2. 다음 작업 항목 2

---
> 💡 *본 일지는 일별 개별 파일(`ROMS_개발일지_YYYY-MM-DD.md`)로 관리됩니다.*
```
