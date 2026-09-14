# ROMS (Runner-league Overwatch Management System) 테이블 정의서 (Table Definition Document)

> **문서 버전**: v1.6 (공통 코드 그룹 및 공통 코드 상세 테이블 추가 반영)  
> **작성일**: 2026-08-06  
> **프로젝트명**: ROMS (오버워치 e스포츠 아카이브 및 대시보드 시스템)  
> **DBMS**: Supabase Cloud Database (PostgreSQL 15+)  
> **ORM Engine**: Prisma ORM v5.22.0  

---

## 1. 테이블 목록 개요 (Table Summary)

| 번호 | 논리 테이블명 | 물리 테이블명 (`@@map`) | 주요 용도 및 설명 | RLS 적용 여부 |
| :---: | :--- | :--- | :--- | :---: |
| 1 | 사용자 & 관리자 | `users` | 로그인 계정, 비밀번호(bcrypt), 권한(`USER`/`ADMIN`) 관리 | **적용 (Enabled)** |
| 2 | 대회 및 시즌 | `seasons` | 시즌명(예: 러너리그 시즌4), 로고 URL, 대회 기간 관리 | **적용 (Enabled)** |
| 3 | 팀 정보 | `teams` | 팀명, 팀 엠블럼 이미지 URL(Supabase Storage) 관리 | **적용 (Enabled)** |
| 4 | 스트리머 / 선수 프로필 | `streamers` | 선수명, 방송 닉네임, 프로필 이미지, 대표 포지션, 방송 채널 링크 | **적용 (Enabled)** |
| 5 | 시즌 참가 팀 | `season_teams` | 특정 시즌에 참가하는 팀 목록 매핑 | **적용 (Enabled)** |
| 6 | 시즌 선수 소속 및 포지션 | `season_team_members` | 시즌 참가 팀에 소속된 선수 및 포지션(`TANK`/`DAMAGE`/`HEALER`) | **적용 (Enabled)** |
| 7 | 경기 매치 | `matches` | 시즌별 토너먼트 단계(8강/준결승/결승), 경기 일시, 승리팀 | **적용 (Enabled)** |
| 8 | 경기 맵 마스터 | `maps` | 오버워치 맵 이름, 맵 전형(점령/화물/혼합/밀기), 맵 이미지 | **적용 (Enabled)** |
| 9 | 세트별 경기 기록 | `match_sets` | 세트 번호, 사용 맵, 세트 승리팀, 경기 시간, VOD 링크 | **적용 (Enabled)** |
| 10 | 선수 세트별 세부 스탯 | `player_set_stats` | 선수별 세트 K/D/A, 피해/치유/경감량, 사용 영웅, MVP 지정 | **적용 (Enabled)** |
| 11 | 영웅 밴 이력 | `hero_bans` | 세트별 팀이 지정한 영웅 밴 이력 | **적용 (Enabled)** |
| 12 | 공통 코드 그룹 | `common_code_groups` | 포지션, 맵 전형, 토너먼트 단계 등 시스템 공통 코드 그룹 관리 | **적용 (Enabled)** |
| 13 | 공통 코드 상세 | `common_codes` | 각 그룹에 속하는 세부 공통 코드 및 코드명, 정렬순서, 사용 여부 관리 | **적용 (Enabled)** |

---

## 2. 상세 테이블 명세 (Table Specifications)

---

### 2.1 `users` (사용자 & 관리자 계정 테이블)

- **설명**: 회원가입/로그인 계정 및 운영자(ADMIN) 권한 정보를 관리하는 테이블입니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 사용자 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | BigInt 고유 식별자 |
| 2 | `email` | 이메일 주소 | `VARCHAR(255)` | - | - | N | - | `UNIQUE` 로그인 이메일 |
| 3 | `password_hash` | 암호화 비밀번호 | `TEXT` | - | - | N | - | `bcrypt` 암호화된 비밀번호 (`CM-002`) |
| 4 | `name` | 사용자 이름 | `TEXT` | - | - | Y | `NULL` | 성명 / 관리자 닉네임 |
| 5 | `role` | 권한 구분 | `ENUM('Role')` | - | - | N | `'USER'` | `'USER'` 또는 `'ADMIN'` |
| 6 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 7 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 계정 생성 일시 |
| 8 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 최종 수정자 식별자 |
| 9 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 최종 수정 일시 (`@updatedAt`) |
| 10 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.2 `seasons` (대회 및 시즌 정보 테이블)

- **설명**: 러너리그 시즌 1~4 및 라이벌 클래시 등 대회 기본 정보를 저장하는 테이블입니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 시즌 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 시즌 식별자 |
| 2 | `name` | 시즌명 | `TEXT` | - | - | N | - | 대회/시즌명 (예: 러너리그 시즌4) |
| 3 | `logo_url` | 시즌 로고 URL | `TEXT` | - | - | Y | `NULL` | Supabase Storage 이미지 URL (`AD-001`) |
| 4 | `start_date` | 대회 시작일 | `DATE` | - | - | Y | `NULL` | 대회 개막 일자 |
| 5 | `end_date` | 대회 종료일 | `DATE` | - | - | Y | `NULL` | 대회 폐막 일자 |
| 6 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 7 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 데이터 생성 일시 |
| 8 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 최종 수정자 식별자 |
| 9 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 데이터 수정 일시 (`@updatedAt`) |
| 10 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.3 `teams` (팀 프로필 테이블)

- **설명**: 참가 팀 기본 정보 및 팀 엠블럼 이미지를 관리하는 테이블입니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 팀 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 팀 식별자 |
| 2 | `name` | 팀명 | `TEXT` | - | - | N | - | 팀 이름 (예: 학살팀, 러너팀) |
| 3 | `emblem_url` | 팀 엠블럼 URL | `TEXT` | - | - | Y | `NULL` | Supabase Storage 엠블럼 URL (`AD-001`) |
| 4 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 5 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 6 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 7 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 8 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.4 `streamers` (스트리머 / 선수 프로필 테이블)

- **설명**: 대회에 참가하는 스트리머(선수)의 기본 프로필, 대표 포지션 및 외부 방송 채널 링크를 관리합니다. (`AD-004`)

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 스트리머 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 선수 고유 식별자 |
| 2 | `name` | 선수 본명/활동명 | `TEXT` | - | - | N | - | 선수 대표 이름 (`US-001`, `AD-004`) |
| 3 | `profile_image_url`| 프로필 이미지 URL | `TEXT` | - | - | Y | `NULL` | Supabase Storage 프로필 이미지 URL (`AD-004`) |
| 4 | `chzzk_channel_id` | 치지직 채널 고유 ID | `TEXT` | - | - | Y | `NULL` | `UNIQUE` 네이버 치지직 32자리 고유 식별자 (`AD-004`) |
| 5 | `is_use` | 사용 여부 | `BOOLEAN` | - | - | N | `true` | 스트리머 활성화/사용 여부 (소프트 딜리트 지원) |
| 6 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 7 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 8 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 9 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 10 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |


---

### 2.5 `season_teams` (시즌 참가 팀 매핑 테이블)

- **설명**: 특정 시즌에 어떤 팀이 참가하는지 관계를 정의하는 교차 테이블입니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 매핑 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 시즌팀 고유 식별자 |
| 2 | `season_id` | 시즌 아이디 | `BIGINT` | - | **FK** | N | - | `seasons.id` (`ON DELETE CASCADE`) |
| 3 | `team_id` | 팀 아이디 | `BIGINT` | - | **FK** | N | - | `teams.id` (`ON DELETE CASCADE`) |
| 4 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 5 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 6 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 7 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 8 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.6 `season_team_members` (시즌 선수 소속 & 포지션 테이블)

- **설명**: 특정 시즌 참가 팀에 배정된 스트리머와 해당 대회에서의 포지션을 지정합니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 배정 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 소속 고유 식별자 |
| 2 | `season_team_id` | 시즌팀 아이디 | `BIGINT` | - | **FK** | N | - | `season_teams.id` (`ON DELETE CASCADE`) |
| 3 | `streamer_id` | 스트리머 아이디 | `BIGINT` | - | **FK** | N | - | `streamers.id` (`ON DELETE CASCADE`) |
| 4 | `position` | 주 포지션 | `ENUM('Position')`| - | - | N | - | `'TANK'`, `'DAMAGE'`, `'HEALER'` (`AD-002`) |
| 5 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 6 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 7 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 8 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 9 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.7 `matches` (경기 매치 테이블)

- **설명**: 시즌 내에서 펼쳐지는 개별 매치(대진 경기) 기본 정보를 관리합니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 매치 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 매치 식별자 |
| 2 | `season_id` | 소속 시즌 아이디 | `BIGINT` | - | **FK** | N | - | `seasons.id` (`ON DELETE CASCADE`) |
| 3 | `tournament_stage`| 토너먼트 단계 | `TEXT` | - | - | N | - | 예: 8강 A조, 준결승, 결승전 |
| 4 | `match_date` | 경기 시행 일시 | `TIMESTAMP(3)` | - | - | Y | `NULL` | 경기 예정/시작 일시 |
| 5 | `team_a_id` | A팀 아이디 | `BIGINT` | - | - | N | - | `teams.id` 대진 A팀 |
| 6 | `team_b_id` | B팀 아이디 | `BIGINT` | - | - | N | - | `teams.id` 대진 B팀 |
| 7 | `winner_team_id` | 최종 승리팀 아이디 | `BIGINT` | - | - | Y | `NULL` | 매치 최종 승리팀 아이디 |
| 8 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 9 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 10 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 11 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 12 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.8 `maps` (경기 맵 마스터 테이블)

- **설명**: 오버워치 경기 맵 마스터 정보 및 맵 전형 종류를 정의합니다. (`AD-004`)

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 맵 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 맵 고유 식별자 |
| 2 | `name` | 맵 이름 | `TEXT` | - | - | N | - | 예: 왕의 길, 아누비스 신전 (`AD-004`) |
| 3 | `map_type` | 맵 전형 종류 | `TEXT` | - | - | N | - | 예: 점령, 화물, 혼합, 밀기 (`AD-004`) |
| 4 | `image_url` | 맵 이미지 URL | `TEXT` | - | - | Y | `NULL` | 맵 전경 이미지 주소 (`AD-004`) |
| 5 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 6 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 7 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 8 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 9 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.9 `match_sets` (세트별 경기 기록 테이블)

- **설명**: 매치 내 세부 세트(1세트, 2세트 등)의 승패, 맵, VOD 링크 정보를 관리합니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 세트 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 세트 기록 식별자 |
| 2 | `match_id` | 매치 아이디 | `BIGINT` | - | **FK** | N | - | `matches.id` (`ON DELETE CASCADE`) |
| 3 | `set_number` | 세트 번호 | `INTEGER` | - | - | N | - | 세트 순번 (1, 2, 3...) |
| 4 | `map_id` | 사용 맵 아이디 | `BIGINT` | - | **FK** | N | - | `maps.id` (`ON DELETE CASCADE`) |
| 5 | `winner_team_id` | 세트 승리팀 아이디| `BIGINT` | - | - | N | - | 해당 세트 승리 팀 |
| 6 | `game_duration_seconds`| 경기 소요 시간(초)| `INTEGER` | - | - | Y | `NULL` | 플레이 시간 (초 단위) |
| 7 | `vod_url` | VOD 다시보기 URL | `TEXT` | - | - | Y | `NULL` | 치지직/유튜브 VOD 링크 (`US-012`) |
| 8 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 9 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 10 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 11 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 12 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.10 `player_set_stats` (선수 세트별 세부 스탯 테이블)

- **설명**: 각 세트에서 참가 선수가 기록한 K/D/A, 피해/치유/경감량, 사용 영웅 및 MVP 여부를 다룹니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 스탯 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 선수 스탯 식별자 |
| 2 | `match_set_id` | 세트 아이디 | `BIGINT` | - | **FK** | N | - | `match_sets.id` (`ON DELETE CASCADE`) |
| 3 | `streamer_id` | 스트리머 아이디 | `BIGINT` | - | **FK** | N | - | `streamers.id` (`ON DELETE CASCADE`) |
| 4 | `kills` | 처치 수 (K) | `INTEGER` | - | - | N | `0` | 세트 내 처치 수 |
| 5 | `deaths` | 죽음 수 (D) | `INTEGER` | - | - | N | `0` | 세트 내 데스 수 |
| 6 | `assists` | 도움 수 (A) | `INTEGER` | - | - | N | `0` | 세트 내 어시스트 수 |
| 7 | `damage` | 가한 피해량 | `INTEGER` | - | - | N | `0` | 총 딜량 |
| 8 | `healing` | 치유량 | `INTEGER` | - | - | N | `0` | 총 힐량 |
| 9 | `mitigated_damage` | 경감량 | `INTEGER` | - | - | N | `0` | 총 방어/경감 피해량 |
| 10 | `main_hero_ids` | 사용 영웅 ID 목록 | `TEXT` | - | - | Y | `NULL` | 쉼표 구분 영웅 목록 |
| 11 | `is_mvp` | 세트 MVP 여부 | `BOOLEAN` | - | - | N | `false` | `true` 또는 `false` (`AD-003`) |
| 12 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 13 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 14 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 15 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 16 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.11 `hero_bans` (영웅 밴 이력 테이블)

- **설명**: 각 세트별로 양 팀이 지정한 영웅 밴(Hero Ban) 기록을 저장합니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 밴 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 밴 기록 식별자 |
| 2 | `match_set_id` | 세트 아이디 | `BIGINT` | - | **FK** | N | - | `match_sets.id` (`ON DELETE CASCADE`) |
| 3 | `team_id` | 밴 지정 팀 아이디 | `BIGINT` | - | **FK** | N | - | `teams.id` (`ON DELETE CASCADE`) |
| 4 | `hero_id` | 밴 지정 영웅 아이디| `BIGINT` | - | - | N | - | 밴 처리된 영웅 식별자 |
| 5 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 6 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 7 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 8 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 9 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |

---

### 2.12 `common_code_groups` (공통 코드 그룹 테이블)

- **설명**: 시스템 전반에서 사용하는 공통 코드 그룹(예: POSITION, MAP_TYPE, TOURNAMENT_STAGE 등)을 관리하는 테이블입니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 코드 그룹 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 공통 코드 그룹 고유 식별자 |
| 2 | `group_code` | 그룹 코드 | `VARCHAR(50)` | - | - | N | - | `UNIQUE` 그룹 코드 키 (예: `POSITION`) |
| 3 | `group_name` | 그룹 명 | `TEXT` | - | - | N | - | 그룹 명칭 (예: 포지션 구분) |
| 4 | `sort_order` | 정렬 순서 | `INTEGER` | - | - | N | `0` | 화면 노출 정렬 순서 |
| 5 | `is_use` | 사용 여부 | `BOOLEAN` | - | - | N | `true` | 코드 그룹 활성화/사용 여부 |
| 6 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 7 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 8 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 9 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 10 | `remarks` | 비고 / 설명 | `TEXT` | - | - | Y | `NULL` | 코드 그룹 상세 설명 및 비고 (기존 description에서 remarks로 일원화) |

---

### 2.13 `common_codes` (공통 코드 상세 테이블)

- **설명**: 각 코드 그룹에 정의된 세부 코드(예: TANK, DAMAGE, HEALER 등) 및 코드명, 정렬순서, 사용 여부를 관리하는 테이블입니다.

| 순번 | 컬럼명 (Physical) | 논리명 (Logical) | 데이터 타입 | PK | FK | Null | 기본값 | 제약조건 / 설명 |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | 공통 코드 아이디 | `BIGINT` | **PK** | - | N | `autoincrement()` | 공통 코드 고유 식별자 |
| 2 | `group_code` | 그룹 코드 | `VARCHAR(50)` | - | **FK** | N | - | `common_code_groups.group_code` (`ON DELETE CASCADE`) |
| 3 | `code` | 코드값 | `VARCHAR(50)` | - | - | N | - | 세부 코드 키 (예: `TANK`, `DAMAGE`, `HEALER`) |
| 4 | `code_name` | 코드명 | `TEXT` | - | - | N | - | 코드 표시 이름 (예: `돌격`, `공격`, `지원`) |
| 5 | `sort_order` | 정렬 순서 | `INTEGER` | - | - | N | `0` | 화면 노출 정렬 순서 |
| 6 | `is_use` | 사용 여부 | `BOOLEAN` | - | - | N | `true` | 코드 활성화/사용 여부 |
| 7 | `created_by` | 생성자 | `TEXT` | - | - | Y | `NULL` | 생성자 식별자 |
| 8 | `created_at` | 생성일시 | `TIMESTAMP(3)` | - | - | N | `CURRENT_TIMESTAMP` | 생성 일시 |
| 9 | `updated_by` | 수정자 | `TEXT` | - | - | Y | `NULL` | 수정자 식별자 |
| 10 | `updated_at` | 수정일시 | `TIMESTAMP(3)` | - | - | N | `auto_update` | 수정 일시 (`@updatedAt`) |
| 11 | `remarks` | 비고 | `TEXT` | - | - | Y | `NULL` | 비고 / 기타 참고사항 |
