-- 영웅 역할, 플레이어 포지션, 대회 참여 역할의 공통 기준값을 등록한다.
INSERT INTO "common_code_groups" ("group_code", "group_name", "sort_order", "is_use", "created_at", "updated_at")
VALUES
  ('HERO_ROLE', '영웅 역할군', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PLAYER_POSITION', '플레이어 포지션', 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PARTICIPANT_ROLE', '대회 참여 역할', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("group_code") DO NOTHING;

-- 동일한 코드 문자열이라도 그룹별 의미를 분리해 독립적으로 관리한다.
INSERT INTO "common_codes" ("group_code", "code", "code_name", "sort_order", "is_use", "created_at", "updated_at")
VALUES
  ('HERO_ROLE', 'TANK', '돌격', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('HERO_ROLE', 'DAMAGE', '공격', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('HERO_ROLE', 'SUPPORT', '지원', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PLAYER_POSITION', 'TANK', '돌격', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PLAYER_POSITION', 'DAMAGE', '공격', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PLAYER_POSITION', 'SUPPORT', '지원', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PARTICIPANT_ROLE', 'CAPTAIN', '팀장', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PARTICIPANT_ROLE', 'PLAYER', '선수', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PARTICIPANT_ROLE', 'COACH', '감독', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("group_code", "code") DO NOTHING;
