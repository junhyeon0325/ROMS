# ROMS (Runner's Overwatch Match System) 논리 / 물리 ERD 설계서

> **문서 버전**: v1.4 (Supabase PostgreSQL & RLS / 공통 감사 컬럼 반영)  
> **작성일**: 2026-07-30  
> **프로젝트명**: ROMS (오버워치 e스포츠 아카이브 및 대시보드 시스템)  
> **기준 환경**: Supabase Cloud DB (PostgreSQL 15+), Prisma ORM v5.22, Row Level Security (RLS)  

---

## 1. 논리적 ERD (Logical ERD)

개념 및 비즈니스 관점에서 e스포츠 도메인 엔터티(사용자, 시즌, 팀, 스트리머, 매치, 세트, 스탯 등)와 엔터티 간의 관계를 표현한 논리적 모델입니다.

```mermaid
erDiagram
    "사용자 (User)" ||--o{ "감사 이력 (Audit Log)" : "기록함"
    "시즌 (Season)" ||--o{ "시즌 참가 팀 (SeasonTeam)" : "포함함"
    "시즌 (Season)" ||--o{ "경기 매치 (Match)" : "진행함"
    "팀 (Team)" ||--o{ "시즌 참가 팀 (SeasonTeam)" : "참가함"
    "스트리머 (Streamer)" ||--o{ "시즌 선수 소속 (SeasonTeamMember)" : "배정됨"
    "시즌 참가 팀 (SeasonTeam)" ||--o{ "시즌 선수 소속 (SeasonTeamMember)" : "구성됨"
    
    "경기 매치 (Match)" ||--o{ "세트 기록 (MatchSet)" : "구성됨"
    "경기 맵 (MapItem)" ||--o{ "세트 기록 (MatchSet)" : "수행됨"
    
    "세트 기록 (MatchSet)" ||--o{ "선수 세트 스탯 (PlayerSetStat)" : "기록함"
    "스트리머 (Streamer)" ||--o{ "선수 세트 스탯 (PlayerSetStat)" : "달성함"
    
    "세트 기록 (MatchSet)" ||--o{ "영웅 밴 (HeroBan)" : "적용됨"
    "팀 (Team)" ||--o{ "영웅 밴 (HeroBan)" : "지정함"

    "사용자 (User)" {
        BigInt 사용자_아이디 PK
        String 로그인_이메일 UK
        String 암호화_비밀번호
        String 사용자_이름
        Enum 권한_구분 "USER | ADMIN"
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "시즌 (Season)" {
        BigInt 시즌_아이디 PK
        String 시즌명 "예: 러너리그 시즌4"
        String 로고_이미지_URL "Supabase Storage URL"
        Date 대회_시작일
        Date 대회_종료일
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "팀 (Team)" {
        BigInt 팀_아이디 PK
        String 팀명
        String 엠블럼_이미지_URL "Supabase Storage URL"
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "스트리머 (Streamer)" {
        BigInt 스트리머_아이디 PK
        String 선수명
        String 방송_닉네임
        String 프로필_이미지_URL "Supabase Storage URL"
        String 치지직_채널_URL
        String 유튜브_채널_URL
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "시즌 참가 팀 (SeasonTeam)" {
        BigInt 시즌팀_아이디 PK
        BigInt 시즌_아이디 FK
        BigInt 팀_아이디 FK
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "시즌 선수 소속 (SeasonTeamMember)" {
        BigInt 소속_아이디 PK
        BigInt 시즌팀_아이디 FK
        BigInt 스트리머_아이디 FK
        Enum 주포지션 "TANK | DAMAGE | HEALER"
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "경기 매치 (Match)" {
        BigInt 매치_아이디 PK
        BigInt 시즌_아이디 FK
        String 토너먼트_단계 "8강 | 준결승 | 결승 등"
        DateTime 경기_예정일시
        BigInt A팀_아이디 FK
        BigInt B팀_아이디 FK
        BigInt 최종_승리팀_아이디 FK
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "경기 맵 (MapItem)" {
        BigInt 맵_아이디 PK
        String 맵이름 "예: 왕의 길"
        String 맵전형 "점령/화물/혼합/밀기"
        String 맵_이미지_URL
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "세트 기록 (MatchSet)" {
        BigInt 세트_아이디 PK
        BigInt 매치_아이디 FK
        Int 세트번호
        BigInt 맵_아이디 FK
        BigInt 세트_승리팀_아이디 FK
        Int 경기_시간_초
        String VOD_다시보기_URL
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "선수 세트 스탯 (PlayerSetStat)" {
        BigInt 스탯_아이디 PK
        BigInt 세트_아이디 FK
        BigInt 스트리머_아이디 FK
        Int 처치수_Kills
        Int 죽음수_Deaths
        Int 도움수_Assists
        Int 가한_피해량
        Int 치유량
        Int 경감량
        String 주요_사용_영웅목록
        Boolean MVP여부
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }

    "영웅 밴 (HeroBan)" {
        BigInt 밴_아이디 PK
        BigInt 세트_아이디 FK
        BigInt 팀_아이디 FK
        BigInt 밴_영웅_아이디 FK
        String 생성자
        DateTime 생성일시
        String 수정자
        DateTime 수정일시
        String 비고
    }
```

---

## 2. 물리적 ERD (Physical ERD)

PostgreSQL 및 Supabase Cloud DB 상에 실제 DDL로 생성된 물리 데이터베이스 스키마 및 외래키(FK) 구조입니다.

```mermaid
erDiagram
    users ||--o{ season_teams : "created_by"
    seasons ||--o{ season_teams : "season_id"
    teams ||--o{ season_teams : "team_id"
    season_teams ||--o{ season_team_members : "season_team_id"
    streamers ||--o{ season_team_members : "streamer_id"
    
    seasons ||--o{ matches : "season_id"
    matches ||--o{ match_sets : "match_id"
    maps ||--o{ match_sets : "map_id"
    
    match_sets ||--o{ player_set_stats : "match_set_id"
    streamers ||--o{ player_set_stats : "streamer_id"
    
    match_sets ||--o{ hero_bans : "match_set_id"
    teams ||--o{ hero_bans : "team_id"

    users {
        bigint id PK
        varchar email UK
        text password_hash
        text name
        enum role "USER | ADMIN"
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    seasons {
        bigint id PK
        text name
        text logo_url
        date start_date
        date end_date
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    teams {
        bigint id PK
        text name
        text emblem_url
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    streamers {
        bigint id PK
        text name
        text nickname
        text profile_image_url
        text chzzk_channel_url
        text youtube_channel_url
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    season_teams {
        bigint id PK
        bigint season_id FK
        bigint team_id FK
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    season_team_members {
        bigint id PK
        bigint season_team_id FK
        bigint streamer_id FK
        enum position "TANK | DAMAGE | HEALER"
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    matches {
        bigint id PK
        bigint season_id FK
        text tournament_stage
        timestamp match_date
        bigint team_a_id
        bigint team_b_id
        bigint winner_team_id
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    maps {
        bigint id PK
        text name
        text map_type
        text image_url
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    match_sets {
        bigint id PK
        bigint match_id FK
        integer set_number
        bigint map_id FK
        bigint winner_team_id
        integer game_duration_seconds
        text vod_url
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    player_set_stats {
        bigint id PK
        bigint match_set_id FK
        bigint streamer_id FK
        integer kills
        integer deaths
        integer assists
        integer damage
        integer healing
        integer mitigated_damage
        text main_hero_ids
        boolean is_mvp
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }

    hero_bans {
        bigint id PK
        bigint match_set_id FK
        bigint team_id FK
        bigint hero_id
        text created_by
        timestamp created_at
        text updated_by
        timestamp updated_at
        text remarks
    }
```

---

## 3. 엔터티 연관 관계 명세서 (Entity Relationships)

| 부모 테이블 (Parent) | 자식 테이블 (Child) | 관계 (Cardinality) | 외래키 컬럼 (FK) | 삭제 제약 조건 (On Delete) |
| :--- | :--- | :---: | :--- | :--- |
| `seasons` | `season_teams` | `1 : N` | `season_teams.season_id` | `CASCADE` |
| `teams` | `season_teams` | `1 : N` | `season_teams.team_id` | `CASCADE` |
| `season_teams` | `season_team_members` | `1 : N` | `season_team_members.season_team_id` | `CASCADE` |
| `streamers` | `season_team_members` | `1 : N` | `season_team_members.streamer_id` | `CASCADE` |
| `seasons` | `matches` | `1 : N` | `matches.season_id` | `CASCADE` |
| `matches` | `match_sets` | `1 : N` | `match_sets.match_id` | `CASCADE` |
| `maps` | `match_sets` | `1 : N` | `match_sets.map_id` | `CASCADE` |
| `match_sets` | `player_set_stats` | `1 : N` | `player_set_stats.match_set_id` | `CASCADE` |
| `streamers` | `player_set_stats` | `1 : N` | `player_set_stats.streamer_id` | `CASCADE` |
| `match_sets` | `hero_bans` | `1 : N` | `hero_bans.match_set_id` | `CASCADE` |
| `teams` | `hero_bans` | `1 : N` | `hero_bans.team_id` | `CASCADE` |
